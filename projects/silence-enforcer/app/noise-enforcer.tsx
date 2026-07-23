"use client";

import {
  type ChangeEvent,
  type CSSProperties,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

type Phase = "disarmed" | "armed" | "blaring" | "cooldown";
type InputMode = "microphone" | "keyboard";
type MicStatus = "idle" | "requesting" | "live" | "unavailable";

type LogEntry = {
  id: number;
  time: string;
  title: string;
  detail: string;
  tone: "neutral" | "good" | "warning" | "danger";
};

type LoadedSound = {
  name: string;
  duration: number;
};

const DB_MIN = -72;
const DB_MAX = 0;
const BURST_SECONDS = 3.2;
const MAX_LOCAL_SOUNDS = 3;
const MAX_LOCAL_FILE_BYTES = 12 * 1024 * 1024;

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const formatClock = () =>
  new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(new Date());

const stateCopy: Record<
  Phase,
  { label: string; kicker: string; description: string }
> = {
  disarmed: {
    label: "DISARMED",
    kicker: "Officer off duty",
    description: "No microphone access. No output. An excellent time for silence.",
  },
  armed: {
    label: "ARMED",
    kicker: "Listening for violations",
    description: "Stay louder than the threshold or face automated consequences.",
  },
  blaring: {
    label: "BLARING",
    kicker: "Silence violation",
    description: "A short, locally synthesized corrective noise burst is in progress.",
  },
  cooldown: {
    label: "COOLDOWN",
    kicker: "Paperwork interval",
    description: "The officer is waiting before checking the room again.",
  },
};

export function NoiseEnforcer() {
  const [phase, setPhase] = useState<Phase>("disarmed");
  const [inputMode, setInputMode] = useState<InputMode>("microphone");
  const [micStatus, setMicStatus] = useState<MicStatus>("idle");
  const [threshold, setThreshold] = useState(-44);
  const [graceSeconds, setGraceSeconds] = useState(5);
  const [cooldownSeconds, setCooldownSeconds] = useState(10);
  const [outputVolume, setOutputVolume] = useState(18);
  const [outputMuted, setOutputMuted] = useState(false);
  const [currentDb, setCurrentDb] = useState(DB_MIN);
  const [countdown, setCountdown] = useState(graceSeconds);
  const [quietProgress, setQuietProgress] = useState(0);
  const [headphoneAck, setHeadphoneAck] = useState(false);
  const [loadedSounds, setLoadedSounds] = useState<LoadedSound[]>([]);
  const [fileStatus, setFileStatus] = useState(
    "Optional: add up to 3 audio files from this device.",
  );
  const [isTestNoise, setIsTestNoise] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([
    {
      id: 1,
      time: "--:--:--",
      title: "System ready",
      detail: "Waiting for an explicit arm command.",
      tone: "neutral",
    },
  ]);

  const phaseRef = useRef<Phase>("disarmed");
  const inputModeRef = useRef<InputMode>("microphone");
  const thresholdRef = useRef(threshold);
  const graceRef = useRef(graceSeconds);
  const cooldownRef = useRef(cooldownSeconds);
  const volumeRef = useRef(outputVolume);
  const mutedRef = useRef(outputMuted);
  const currentDbRef = useRef(DB_MIN);
  const quietSinceRef = useRef<number | null>(null);
  const blareUntilRef = useRef(0);
  const cooldownUntilRef = useRef(0);
  const testNoiseRef = useRef(false);
  const logIdRef = useRef(1);
  const lastTimerResetLogRef = useRef(0);

  const audioContextRef = useRef<AudioContext | null>(null);
  const masterGainRef = useRef<GainNode | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const mediaSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const customBuffersRef = useRef<AudioBuffer[]>([]);
  const activeSourcesRef = useRef<Set<AudioScheduledSourceNode>>(new Set());
  const triggerBurstRef = useRef<() => void>(() => undefined);
  const disarmRef = useRef<(reason?: string) => void>(() => undefined);

  const appendLog = useCallback(
    (
      title: string,
      detail: string,
      tone: LogEntry["tone"] = "neutral",
    ) => {
      logIdRef.current += 1;
      const entry: LogEntry = {
        id: logIdRef.current,
        time: formatClock(),
        title,
        detail,
        tone,
      };
      setLogs((current) => [entry, ...current].slice(0, 9));
    },
    [],
  );

  const updatePhase = useCallback((nextPhase: Phase) => {
    phaseRef.current = nextPhase;
    setPhase(nextPhase);
  }, []);

  useEffect(() => {
    inputModeRef.current = inputMode;
  }, [inputMode]);

  useEffect(() => {
    thresholdRef.current = threshold;
    quietSinceRef.current = null;
    setCountdown(graceRef.current);
    setQuietProgress(0);
  }, [threshold]);

  useEffect(() => {
    graceRef.current = graceSeconds;
    if (phaseRef.current === "armed") {
      quietSinceRef.current = null;
      setCountdown(graceSeconds);
      setQuietProgress(0);
    }
  }, [graceSeconds]);

  useEffect(() => {
    cooldownRef.current = cooldownSeconds;
  }, [cooldownSeconds]);

  const setMasterOutput = useCallback((volume: number, muted: boolean) => {
    const context = audioContextRef.current;
    const master = masterGainRef.current;
    if (!context || !master) return;

    const target = muted ? 0 : clamp(volume / 100, 0, 0.55);
    master.gain.cancelScheduledValues(context.currentTime);
    master.gain.setTargetAtTime(target, context.currentTime, 0.03);
  }, []);

  useEffect(() => {
    volumeRef.current = outputVolume;
    setMasterOutput(outputVolume, mutedRef.current);
  }, [outputVolume, setMasterOutput]);

  useEffect(() => {
    mutedRef.current = outputMuted;
    setMasterOutput(volumeRef.current, outputMuted);
  }, [outputMuted, setMasterOutput]);

  const ensureAudio = useCallback(async () => {
    let context = audioContextRef.current;
    if (!context || context.state === "closed") {
      const AudioContextClass =
        window.AudioContext ??
        (
          window as typeof window & {
            webkitAudioContext?: typeof AudioContext;
          }
        ).webkitAudioContext;

      if (!AudioContextClass) {
        throw new Error("This browser does not support Web Audio.");
      }

      context = new AudioContextClass();
      const master = context.createGain();
      const limiter = context.createDynamicsCompressor();
      master.gain.value = mutedRef.current
        ? 0
        : clamp(volumeRef.current / 100, 0, 0.55);
      limiter.threshold.value = -16;
      limiter.knee.value = 7;
      limiter.ratio.value = 14;
      limiter.attack.value = 0.003;
      limiter.release.value = 0.16;
      master.connect(limiter).connect(context.destination);
      audioContextRef.current = context;
      masterGainRef.current = master;
    }

    if (context.state === "suspended") {
      await context.resume();
    }

    return context;
  }, []);

  const stopActiveSounds = useCallback(() => {
    for (const source of activeSourcesRef.current) {
      try {
        source.stop();
      } catch {
        // The node may have already ended.
      }
    }
    activeSourcesRef.current.clear();
    window.speechSynthesis?.cancel();
  }, []);

  const stopMicrophone = useCallback(() => {
    mediaSourceRef.current?.disconnect();
    mediaSourceRef.current = null;
    analyserRef.current?.disconnect();
    analyserRef.current = null;
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setMicStatus("idle");
  }, []);

  const startMicrophone = useCallback(async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      throw new Error("Microphone input is unavailable in this browser.");
    }

    setMicStatus("requesting");
    const context = await ensureAudio();
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        autoGainControl: false,
        echoCancellation: false,
        noiseSuppression: false,
        channelCount: 1,
      },
      video: false,
    });

    stopMicrophone();
    const analyser = context.createAnalyser();
    analyser.fftSize = 1024;
    analyser.smoothingTimeConstant = 0.72;
    const source = context.createMediaStreamSource(stream);
    source.connect(analyser);

    streamRef.current = stream;
    mediaSourceRef.current = source;
    analyserRef.current = analyser;
    setMicStatus("live");
  }, [ensureAudio, stopMicrophone]);

  const registerSource = useCallback((source: AudioScheduledSourceNode) => {
    activeSourcesRef.current.add(source);
    source.addEventListener(
      "ended",
      () => activeSourcesRef.current.delete(source),
      { once: true },
    );
  }, []);

  const playBurst = useCallback(
    async (duration = BURST_SECONDS, includeVoice = true) => {
      const context = await ensureAudio();
      const master = masterGainRef.current;
      if (!master) return;

      const now = context.currentTime + 0.025;
      const end = now + duration;

      const siren = context.createOscillator();
      const sirenGain = context.createGain();
      siren.type = "sawtooth";
      siren.frequency.setValueAtTime(360, now);
      for (
        let sweepIndex = 0, offset = 0;
        offset < duration;
        sweepIndex += 1, offset += 0.28
      ) {
        siren.frequency.linearRampToValueAtTime(
          sweepIndex % 2 === 0 ? 920 : 370,
          Math.min(end, now + offset + 0.26),
        );
      }
      sirenGain.gain.setValueAtTime(0.0001, now);
      sirenGain.gain.linearRampToValueAtTime(0.14, now + 0.05);
      sirenGain.gain.setValueAtTime(0.14, Math.max(now + 0.06, end - 0.1));
      sirenGain.gain.exponentialRampToValueAtTime(0.0001, end);
      siren.connect(sirenGain).connect(master);
      registerSource(siren);
      siren.start(now);
      siren.stop(end);

      const buzzer = context.createOscillator();
      const buzzerGain = context.createGain();
      buzzer.type = "square";
      buzzer.frequency.value = 118;
      buzzerGain.gain.setValueAtTime(0.0001, now);
      for (let offset = 0; offset < duration; offset += 0.18) {
        const pulseStart = now + offset;
        const pulseEnd = Math.min(end, pulseStart + 0.09);
        buzzerGain.gain.setValueAtTime(0.0001, pulseStart);
        buzzerGain.gain.linearRampToValueAtTime(0.17, pulseStart + 0.018);
        buzzerGain.gain.exponentialRampToValueAtTime(0.0001, pulseEnd);
      }
      buzzer.connect(buzzerGain).connect(master);
      registerSource(buzzer);
      buzzer.start(now);
      buzzer.stop(end);

      const chirp = context.createOscillator();
      const chirpGain = context.createGain();
      chirp.type = "triangle";
      chirpGain.gain.setValueAtTime(0.0001, now);
      for (let offset = 0.08; offset < duration; offset += 0.34) {
        const chirpStart = now + offset;
        const chirpEnd = Math.min(end, chirpStart + 0.15);
        chirp.frequency.setValueAtTime(1480, chirpStart);
        chirp.frequency.exponentialRampToValueAtTime(520, chirpEnd);
        chirpGain.gain.setValueAtTime(0.0001, chirpStart);
        chirpGain.gain.linearRampToValueAtTime(0.11, chirpStart + 0.02);
        chirpGain.gain.exponentialRampToValueAtTime(0.0001, chirpEnd);
      }
      chirp.connect(chirpGain).connect(master);
      registerSource(chirp);
      chirp.start(now);
      chirp.stop(end);

      const noiseBuffer = context.createBuffer(
        1,
        Math.ceil(context.sampleRate * duration),
        context.sampleRate,
      );
      const noiseData = noiseBuffer.getChannelData(0);
      for (let index = 0; index < noiseData.length; index += 1) {
        noiseData[index] = Math.random() * 2 - 1;
      }
      const noise = context.createBufferSource();
      const noiseFilter = context.createBiquadFilter();
      const noiseGain = context.createGain();
      noise.buffer = noiseBuffer;
      noiseFilter.type = "bandpass";
      noiseFilter.frequency.value = 1450;
      noiseFilter.Q.value = 0.8;
      noiseGain.gain.setValueAtTime(0.0001, now);
      for (let offset = 0.04; offset < duration; offset += 0.22) {
        const cutStart = now + offset;
        const cutEnd = Math.min(end, cutStart + 0.065);
        noiseGain.gain.setValueAtTime(0.0001, cutStart);
        noiseGain.gain.linearRampToValueAtTime(0.075, cutStart + 0.008);
        noiseGain.gain.exponentialRampToValueAtTime(0.0001, cutEnd);
      }
      noise.connect(noiseFilter).connect(noiseGain).connect(master);
      registerSource(noise);
      noise.start(now);
      noise.stop(end);

      if (customBuffersRef.current.length > 0) {
        const cutSpacing = 0.29;
        for (
          let cutIndex = 0, offset = 0;
          offset < duration;
          cutIndex += 1, offset += cutSpacing
        ) {
          const buffer =
            customBuffersRef.current[
              cutIndex % customBuffersRef.current.length
            ];
          const source = context.createBufferSource();
          const gain = context.createGain();
          const sliceDuration = Math.min(
            0.32,
            duration - offset,
            buffer.duration,
          );
          const availableOffset = Math.max(0, buffer.duration - sliceDuration);
          const sourceOffset =
            availableOffset === 0
              ? 0
              : (cutIndex * 0.41) % availableOffset;
          source.buffer = buffer;
          gain.gain.setValueAtTime(0.0001, now + offset);
          gain.gain.linearRampToValueAtTime(0.24, now + offset + 0.012);
          gain.gain.setValueAtTime(
            0.24,
            Math.max(now + offset + 0.014, now + offset + sliceDuration - 0.03),
          );
          gain.gain.exponentialRampToValueAtTime(
            0.0001,
            now + offset + sliceDuration,
          );
          source.connect(gain).connect(master);
          registerSource(source);
          source.start(now + offset, sourceOffset, sliceDuration);
          source.stop(now + offset + sliceDuration);
        }
      }

      if (
        includeVoice &&
        !mutedRef.current &&
        "speechSynthesis" in window
      ) {
        const warning = new SpeechSynthesisUtterance(
          "Silence violation detected. Resume unnecessary noise.",
        );
        warning.rate = 1.08;
        warning.pitch = 0.68;
        warning.volume = clamp(volumeRef.current / 100, 0, 0.42);
        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(warning);
      }
    },
    [ensureAudio, registerSource],
  );

  const triggerBurst = useCallback(() => {
    if (phaseRef.current !== "armed") return;

    const now = performance.now();
    blareUntilRef.current = now + BURST_SECONDS * 1000;
    quietSinceRef.current = null;
    updatePhase("blaring");
    setCountdown(BURST_SECONDS);
    setQuietProgress(1);
    appendLog(
      mutedRef.current ? "Violation logged — output muted" : "NOISE CITATION",
      mutedRef.current
        ? "The enforcement cycle ran silently because mute was engaged."
        : "Silence exceeded the grace period. Corrective burst deployed.",
      "danger",
    );
    void playBurst();
  }, [appendLog, playBurst, updatePhase]);

  useEffect(() => {
    triggerBurstRef.current = triggerBurst;
  }, [triggerBurst]);

  const disarm = useCallback(
    (reason = "Manual stop pressed") => {
      const wasActive = phaseRef.current !== "disarmed";
      updatePhase("disarmed");
      quietSinceRef.current = null;
      blareUntilRef.current = 0;
      cooldownUntilRef.current = 0;
      testNoiseRef.current = false;
      setIsTestNoise(false);
      setCountdown(graceRef.current);
      setQuietProgress(0);
      setCurrentDb(DB_MIN);
      currentDbRef.current = DB_MIN;
      stopActiveSounds();
      stopMicrophone();
      void audioContextRef.current?.suspend();
      if (wasActive) appendLog("System disarmed", reason, "good");
    },
    [appendLog, stopActiveSounds, stopMicrophone, updatePhase],
  );

  useEffect(() => {
    disarmRef.current = disarm;
  }, [disarm]);

  const arm = useCallback(async () => {
    if (!headphoneAck || phaseRef.current !== "disarmed") return;

    try {
      await ensureAudio();

      let resolvedMode = inputModeRef.current;
      if (resolvedMode === "microphone") {
        try {
          await startMicrophone();
        } catch {
          resolvedMode = "keyboard";
          inputModeRef.current = "keyboard";
          setInputMode("keyboard");
          setMicStatus("unavailable");
          appendLog(
            "Microphone unavailable",
            "Switched to keyboard test mode. Hold SPACE to simulate room noise.",
            "warning",
          );
        }
      }

      currentDbRef.current = resolvedMode === "keyboard" ? -61 : DB_MIN;
      setCurrentDb(currentDbRef.current);
      quietSinceRef.current = performance.now();
      setCountdown(graceRef.current);
      setQuietProgress(0);
      updatePhase("armed");
      appendLog(
        "Officer armed",
        resolvedMode === "microphone"
          ? "Local level analysis started. No audio is recorded or transmitted."
          : "Keyboard simulation started. Hold SPACE or the test-noise pad.",
        "good",
      );
    } catch {
      setMicStatus("unavailable");
      appendLog(
        "Audio unavailable",
        "This browser could not unlock Web Audio. Try another current browser.",
        "warning",
      );
    }
  }, [
    appendLog,
    ensureAudio,
    headphoneAck,
    startMicrophone,
    updatePhase,
  ]);

  useEffect(() => {
    if (phase === "disarmed") return;

    const sampleBuffer = new Uint8Array(1024);
    const tick = () => {
      const now = performance.now();
      let measuredDb = currentDbRef.current;

      if (inputModeRef.current === "keyboard") {
        const pulse = Math.sin(now / 270) * 1.5;
        measuredDb = testNoiseRef.current ? -23 + pulse : -61 + pulse;
      } else if (analyserRef.current) {
        const analyser = analyserRef.current;
        analyser.getByteTimeDomainData(sampleBuffer);
        let sumSquares = 0;
        for (const sample of sampleBuffer) {
          const normalized = (sample - 128) / 128;
          sumSquares += normalized * normalized;
        }
        const rms = Math.sqrt(sumSquares / sampleBuffer.length);
        measuredDb = rms > 0 ? 20 * Math.log10(rms) : DB_MIN;
      }

      measuredDb = clamp(measuredDb, DB_MIN, DB_MAX);
      currentDbRef.current = measuredDb;
      setCurrentDb(measuredDb);

      if (phaseRef.current === "armed") {
        if (measuredDb < thresholdRef.current) {
          if (quietSinceRef.current === null) quietSinceRef.current = now;
          const quietElapsed = (now - quietSinceRef.current) / 1000;
          const remaining = Math.max(0, graceRef.current - quietElapsed);
          setCountdown(remaining);
          setQuietProgress(clamp(quietElapsed / graceRef.current, 0, 1));
          if (quietElapsed >= graceRef.current) triggerBurstRef.current();
        } else {
          const previousQuietSince = quietSinceRef.current;
          quietSinceRef.current = null;
          setCountdown(graceRef.current);
          setQuietProgress(0);
          if (
            previousQuietSince !== null &&
            now - previousQuietSince > 900 &&
            now - lastTimerResetLogRef.current > 2400
          ) {
            lastTimerResetLogRef.current = now;
            appendLog(
              "Silence timer cleared",
              "Ambient volume crossed the threshold. Compliance restored.",
              "good",
            );
          }
        }
      } else if (phaseRef.current === "blaring") {
        const remaining = Math.max(0, (blareUntilRef.current - now) / 1000);
        setCountdown(remaining);
        if (now >= blareUntilRef.current) {
          stopActiveSounds();
          cooldownUntilRef.current = now + cooldownRef.current * 1000;
          updatePhase("cooldown");
          setCountdown(cooldownRef.current);
          appendLog(
            "Cooldown started",
            `Monitoring resumes in ${cooldownRef.current} seconds.`,
            "neutral",
          );
        }
      } else if (phaseRef.current === "cooldown") {
        const remaining = Math.max(0, (cooldownUntilRef.current - now) / 1000);
        setCountdown(remaining);
        setQuietProgress(1 - remaining / cooldownRef.current);
        if (now >= cooldownUntilRef.current) {
          updatePhase("armed");
          quietSinceRef.current =
            measuredDb < thresholdRef.current ? now : null;
          setCountdown(graceRef.current);
          setQuietProgress(0);
          appendLog(
            "Monitoring resumed",
            "The room is being checked for repeat silence.",
            "neutral",
          );
        }
      }
    };

    tick();
    const timer = window.setInterval(tick, 100);
    return () => window.clearInterval(timer);
  }, [appendLog, phase, stopActiveSounds, updatePhase]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (
        event.code === "Escape" &&
        phaseRef.current !== "disarmed"
      ) {
        event.preventDefault();
        disarmRef.current("Emergency keyboard stop (ESC)");
        return;
      }
      if (
        event.code === "Space" &&
        inputModeRef.current === "keyboard" &&
        phaseRef.current !== "disarmed"
      ) {
        event.preventDefault();
        testNoiseRef.current = true;
        setIsTestNoise(true);
      }
    };

    const onKeyUp = (event: KeyboardEvent) => {
      if (event.code === "Space") {
        testNoiseRef.current = false;
        setIsTestNoise(false);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, []);

  useEffect(() => {
    const onVisibilityChange = () => {
      if (document.hidden && phaseRef.current !== "disarmed") {
        disarmRef.current(
          "Page hidden or screen locked — background enforcement is disabled.",
        );
      }
    };
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () =>
      document.removeEventListener("visibilitychange", onVisibilityChange);
  }, []);

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    const scope = new URL("./", window.location.href).pathname;
    void navigator.serviceWorker
      .register(new URL("sw.js", window.location.href), { scope })
      .catch(() => undefined);
  }, []);

  useEffect(
    () => () => {
      stopActiveSounds();
      stopMicrophone();
      void audioContextRef.current?.close();
    },
    [stopActiveSounds, stopMicrophone],
  );

  const handleSoundFiles = useCallback(
    async (event: ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(event.target.files ?? []).slice(
        0,
        MAX_LOCAL_SOUNDS,
      );
      event.target.value = "";
      if (files.length === 0) return;

      const validFiles = files.filter(
        (file) =>
          file.type.startsWith("audio/") &&
          file.size <= MAX_LOCAL_FILE_BYTES,
      );
      if (validFiles.length === 0) {
        setFileStatus("Choose audio files under 12 MB each.");
        return;
      }

      try {
        setFileStatus("Decoding locally…");
        const context = await ensureAudio();
        const decoded = await Promise.all(
          validFiles.map(async (file) => ({
            name: file.name,
            buffer: await context.decodeAudioData(await file.arrayBuffer()),
          })),
        );
        customBuffersRef.current = decoded.map((item) => item.buffer);
        setLoadedSounds(
          decoded.map((item) => ({
            name: item.name,
            duration: item.buffer.duration,
          })),
        );
        setFileStatus(
          `${decoded.length} local sound${decoded.length === 1 ? "" : "s"} ready. Nothing was uploaded.`,
        );
        appendLog(
          "Local soundboard updated",
          `${decoded.length} user-provided file${decoded.length === 1 ? "" : "s"} decoded in this browser only.`,
          "good",
        );
      } catch {
        setFileStatus("One or more files could not be decoded.");
      }
    },
    [appendLog, ensureAudio],
  );

  const clearLocalSounds = useCallback(() => {
    customBuffersRef.current = [];
    setLoadedSounds([]);
    setFileStatus("Optional: add up to 3 audio files from this device.");
    appendLog(
      "Local soundboard cleared",
      "Synthesized sirens and buzzers remain available.",
      "neutral",
    );
  }, [appendLog]);

  const previewBurst = useCallback(async () => {
    if (!headphoneAck) return;
    try {
      appendLog(
        outputMuted ? "Preview requested while muted" : "Short preview played",
        outputMuted
          ? "Unmute output to hear the conservative-level test."
          : "A 1.4 second synthesized test used the current output setting.",
        "neutral",
      );
      await playBurst(1.4, false);
    } catch {
      appendLog(
        "Preview unavailable",
        "The browser did not unlock audio output.",
        "warning",
      );
    }
  }, [appendLog, headphoneAck, outputMuted, playBurst]);

  const startTestNoise = useCallback(() => {
    if (phaseRef.current === "disarmed") return;
    testNoiseRef.current = true;
    setIsTestNoise(true);
  }, []);

  const stopTestNoise = useCallback(() => {
    testNoiseRef.current = false;
    setIsTestNoise(false);
  }, []);

  const meterPercent = clamp(
    ((currentDb - DB_MIN) / (DB_MAX - DB_MIN)) * 100,
    0,
    100,
  );
  const thresholdPercent = clamp(
    ((threshold - DB_MIN) / (DB_MAX - DB_MIN)) * 100,
    0,
    100,
  );
  const isQuiet = currentDb < threshold;
  const isActive = phase !== "disarmed";
  const visibleDb = phase === "disarmed" ? "—" : Math.round(currentDb);

  const countdownLabel = useMemo(() => {
    if (phase === "disarmed") return "Not running";
    if (phase === "armed")
      return isQuiet ? "Until citation" : "Room compliant";
    if (phase === "blaring") return "Burst remaining";
    return "Until re-check";
  }, [isQuiet, phase]);

  const meterStyle = {
    "--meter-value": `${meterPercent}%`,
    "--meter-color":
      phase === "blaring"
        ? "#ff3b1f"
        : isQuiet
          ? "#dfff00"
          : "#50f5a6",
  } as CSSProperties;

  const progressStyle = {
    "--progress": `${quietProgress * 100}%`,
  } as CSSProperties;

  return (
    <main className={`officer-app phase-${phase}`}>
      <div className="privacy-strip">
        <span className="privacy-pulse" aria-hidden="true" />
        <strong>LOCAL AUDIO ANALYSIS</strong>
        <span>ZERO RECORDING · ZERO UPLOADS</span>
      </div>

      <header className="site-header">
        <a className="lab-mark" href="https://lab.janpfrenger.com/">
          <span className="lab-mark-dot" aria-hidden="true">
            JP
          </span>
          <span>
            JAN P FRENGER
            <small>/ LAB TEST 005</small>
          </span>
        </a>
        <button
          className="header-stop"
          type="button"
          onClick={() => disarm()}
          disabled={!isActive}
          aria-label="Disarm and stop all sound"
        >
          <span className="stop-square" aria-hidden="true" />
          STOP
        </button>
      </header>

      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">Slopathon public nuisance prototype</p>
          <h1>
            NOISE
            <span>ENFORCEMENT</span>
            OFFICER
          </h1>
          <p className="premise">
            An absurd automated officer that detects unacceptable silence and
            files the complaint as noise.
          </p>
        </div>
        <div className="hero-stamp" aria-label="Department status">
          <span>DEPT. OF</span>
          <strong>ANTI-QUIET</strong>
          <span>PERMIT № 0000</span>
        </div>
      </section>

      <section className="control-grid" aria-label="Noise enforcement controls">
        <article className="meter-card">
          <div className="card-head">
            <div>
              <p className="micro-label">LIVE ROOM LEVEL</p>
              <h2>Silence detector</h2>
            </div>
            <span className={`live-pill mic-${micStatus}`}>
              {inputMode === "keyboard"
                ? "TEST INPUT"
                : micStatus === "live"
                  ? "MIC LIVE"
                  : micStatus === "requesting"
                    ? "REQUESTING"
                    : "MIC IDLE"}
            </span>
          </div>

          <div
            className="radial-meter"
            style={meterStyle}
            role="meter"
            aria-label="Current microphone level in dBFS"
            aria-valuemin={DB_MIN}
            aria-valuemax={DB_MAX}
            aria-valuenow={phase === "disarmed" ? undefined : currentDb}
          >
            <div className="meter-grid" aria-hidden="true" />
            <div className="meter-core">
              <span className="meter-number">{visibleDb}</span>
              <span className="meter-unit">dBFS</span>
              <span className={`quiet-readout ${isQuiet ? "is-quiet" : ""}`}>
                {phase === "disarmed"
                  ? "OFFLINE"
                  : isQuiet
                    ? "TOO QUIET"
                    : "ACCEPTABLE NOISE"}
              </span>
            </div>
            <div className="threshold-flag">
              <span>QUIET LINE</span>
              <strong>{threshold} dBFS</strong>
            </div>
          </div>

          <div className="meter-scale" aria-hidden="true">
            <span>-72</span>
            <span>-48</span>
            <span>-24</span>
            <span>0 dBFS</span>
          </div>

          <div className="countdown-panel" style={progressStyle}>
            <div>
              <span>{countdownLabel}</span>
              <strong>
                {phase === "armed" && !isQuiet
                  ? "HOLD"
                  : phase === "disarmed"
                    ? "--.-"
                    : countdown.toFixed(1)}
                {phase !== "disarmed" &&
                  !(phase === "armed" && !isQuiet) && <small>s</small>}
              </strong>
            </div>
            <div className="countdown-rule" aria-hidden="true" />
          </div>
        </article>

        <aside className="control-panel">
          <div className={`state-banner state-${phase}`}>
            <div>
              <span className="micro-label">{stateCopy[phase].kicker}</span>
              <strong>{stateCopy[phase].label}</strong>
            </div>
            <span className="state-beacon" aria-hidden="true" />
            <p>{stateCopy[phase].description}</p>
          </div>

          <div className="state-rail" aria-label="Enforcement cycle">
            {(["armed", "blaring", "cooldown"] as const).map((state, index) => (
              <div
                className={`state-step ${
                  phase === state ? "is-current" : ""
                }`}
                key={state}
              >
                <span>0{index + 1}</span>
                <strong>{state.toUpperCase()}</strong>
              </div>
            ))}
          </div>

          <div className="input-selector">
            <div className="section-title">
              <span>01</span>
              <div>
                <p className="micro-label">INPUT SOURCE</p>
                <h3>Choose how to test</h3>
              </div>
            </div>
            <div className="segmented-control">
              <button
                type="button"
                className={inputMode === "microphone" ? "is-selected" : ""}
                onClick={() => setInputMode("microphone")}
                disabled={isActive}
              >
                Microphone
                <small>Local level only</small>
              </button>
              <button
                type="button"
                className={inputMode === "keyboard" ? "is-selected" : ""}
                onClick={() => setInputMode("keyboard")}
                disabled={isActive}
              >
                Test mode
                <small>Hold SPACE</small>
              </button>
            </div>
          </div>

          {inputMode === "keyboard" && (
            <button
              className={`test-noise-pad ${isTestNoise ? "is-pressed" : ""}`}
              type="button"
              disabled={!isActive}
              onPointerDown={startTestNoise}
              onPointerUp={stopTestNoise}
              onPointerCancel={stopTestNoise}
              onPointerLeave={stopTestNoise}
            >
              <span>{isTestNoise ? "TEST NOISE ACTIVE" : "HOLD FOR TEST NOISE"}</span>
              <small>Keyboard: hold SPACE · Emergency stop: ESC</small>
            </button>
          )}

          <div className="arm-zone">
            <label className="safety-check">
              <input
                type="checkbox"
                checked={headphoneAck}
                onChange={(event) => setHeadphoneAck(event.target.checked)}
                disabled={isActive}
              />
              <span className="check-box" aria-hidden="true" />
              <span>
                <strong>I am not wearing headphones.</strong>
                <small>
                  I warned nearby people and will keep the device at a
                  conservative volume.
                </small>
              </span>
            </label>

            {isActive ? (
              <button
                className="disarm-button"
                type="button"
                onClick={() => disarm()}
              >
                <span className="stop-square" aria-hidden="true" />
                DISARM / STOP NOW
              </button>
            ) : (
              <button
                className="arm-button"
                type="button"
                onClick={arm}
                disabled={!headphoneAck}
              >
                <span className="arm-light" aria-hidden="true" />
                ARM THE OFFICER
                <small>Unlocks audio &amp; requests mic if selected</small>
              </button>
            )}
          </div>
        </aside>
      </section>

      <section className="settings-section" aria-labelledby="settings-title">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Citation parameters</p>
            <h2 id="settings-title">Set the tolerance for peace.</h2>
          </div>
          <p>
            dBFS is a relative digital level, not a calibrated sound-pressure
            reading. Different phones will report different values.
          </p>
        </div>

        <div className="settings-grid">
          <label className="setting-card">
            <span className="setting-top">
              <span>
                <small>QUIET THRESHOLD</small>
                <strong>{threshold} dBFS</strong>
              </span>
              <span className="setting-index">A</span>
            </span>
            <input
              type="range"
              min="-65"
              max="-20"
              step="1"
              value={threshold}
              onChange={(event) => setThreshold(Number(event.target.value))}
              style={{ "--range-fill": `${thresholdPercent}%` } as CSSProperties}
              aria-label="Quiet threshold in dBFS"
            />
            <span className="range-labels">
              <span>More sensitive</span>
              <span>Less sensitive</span>
            </span>
          </label>

          <label className="setting-card">
            <span className="setting-top">
              <span>
                <small>GRACE PERIOD</small>
                <strong>{graceSeconds} seconds</strong>
              </span>
              <span className="setting-index">B</span>
            </span>
            <input
              type="range"
              min="2"
              max="20"
              step="1"
              value={graceSeconds}
              onChange={(event) => setGraceSeconds(Number(event.target.value))}
              style={
                {
                  "--range-fill": `${((graceSeconds - 2) / 18) * 100}%`,
                } as CSSProperties
              }
              aria-label="Grace period in seconds"
            />
            <span className="range-labels">
              <span>Impatient</span>
              <span>Merciful</span>
            </span>
          </label>

          <label className="setting-card">
            <span className="setting-top">
              <span>
                <small>COOLDOWN</small>
                <strong>{cooldownSeconds} seconds</strong>
              </span>
              <span className="setting-index">C</span>
            </span>
            <input
              type="range"
              min="5"
              max="30"
              step="1"
              value={cooldownSeconds}
              onChange={(event) =>
                setCooldownSeconds(Number(event.target.value))
              }
              style={
                {
                  "--range-fill": `${((cooldownSeconds - 5) / 25) * 100}%`,
                } as CSSProperties
              }
              aria-label="Cooldown period in seconds"
            />
            <span className="range-labels">
              <span>Frequent patrols</span>
              <span>Long paperwork</span>
            </span>
          </label>
        </div>
      </section>

      <section className="sound-section" aria-labelledby="sound-title">
        <div className="sound-console">
          <div className="section-title">
            <span>02</span>
            <div>
              <p className="micro-label">OUTPUT BAY</p>
              <h2 id="sound-title">Tightly cut, copyright-safe chaos</h2>
            </div>
          </div>

          <div className="volume-control">
            <label htmlFor="output-volume">
              <span>
                <small>OUTPUT GAIN</small>
                <strong>{outputMuted ? "MUTED" : `${outputVolume}%`}</strong>
              </span>
              <button
                type="button"
                className={outputMuted ? "is-muted" : ""}
                onClick={() => setOutputMuted((current) => !current)}
              >
                {outputMuted ? "Unmute" : "Mute"}
              </button>
            </label>
            <input
              id="output-volume"
              type="range"
              min="5"
              max="55"
              step="1"
              value={outputVolume}
              onChange={(event) => setOutputVolume(Number(event.target.value))}
              style={
                {
                  "--range-fill": `${((outputVolume - 5) / 50) * 100}%`,
                } as CSSProperties
              }
            />
            <span className="gain-cap">
              DEFAULT 18% · HARD CAP 55% · RAPID CUTS 180–320MS · LIMITER ON
            </span>
            <button
              className="preview-button"
              type="button"
              onClick={previewBurst}
              disabled={!headphoneAck}
            >
              Preview 1.4s synthesized burst
            </button>
          </div>
        </div>

        <div className="soundboard-card">
          <div className="soundboard-head">
            <div>
              <p className="micro-label">OPTIONAL LOCAL SLOTS</p>
              <h3>Your own terrible decisions</h3>
            </div>
            {loadedSounds.length > 0 && (
              <button type="button" onClick={clearLocalSounds}>
                Clear all
              </button>
            )}
          </div>
          <div className="sound-slots">
            {Array.from({ length: MAX_LOCAL_SOUNDS }).map((_, index) => {
              const sound = loadedSounds[index];
              return (
                <div className={`sound-slot ${sound ? "is-loaded" : ""}`} key={index}>
                  <span>0{index + 1}</span>
                  {sound ? (
                    <div>
                      <strong>{sound.name}</strong>
                      <small>{sound.duration.toFixed(1)}s · local memory</small>
                    </div>
                  ) : (
                    <div>
                      <strong>Empty slot</strong>
                      <small>user-provided audio only</small>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          <label className="file-picker">
            <input
              type="file"
              accept="audio/*"
              multiple
              onChange={handleSoundFiles}
            />
            <span>Choose local audio files</span>
            <small>{fileStatus}</small>
          </label>
          <p className="sound-policy">
            No clips are bundled or scraped. Selected files are decoded in
            browser memory and disappear when this page closes.
          </p>
        </div>
      </section>

      <section className="log-section" aria-labelledby="log-title">
        <div className="log-head">
          <div>
            <p className="eyebrow">Incident record</p>
            <h2 id="log-title">Officer&apos;s log</h2>
          </div>
          <span>{logs.length.toString().padStart(2, "0")} ENTRIES</span>
        </div>
        <div className="log-table" role="log" aria-live="polite">
          {logs.map((entry) => (
            <div className={`log-row log-${entry.tone}`} key={entry.id}>
              <time>{entry.time}</time>
              <span className="log-dot" aria-hidden="true" />
              <div>
                <strong>{entry.title}</strong>
                <p>{entry.detail}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="safety-notice" aria-labelledby="safety-title">
        <div className="warning-icon" aria-hidden="true">
          !
        </div>
        <div>
          <p className="micro-label">HEARING &amp; BROWSER SAFETY</p>
          <h2 id="safety-title">Never use this with headphones.</h2>
          <p>
            Start low, warn people nearby, and use the persistent STOP control.
            The app never bypasses your device volume or mute. It automatically
            disarms when the page is hidden or the screen locks; browsers do
            not guarantee microphone monitoring or audio in the background.
          </p>
        </div>
      </section>

      <footer>
        <span>NOISE ENFORCEMENT OFFICER / SLOPATHON 2026</span>
        <span>LOCAL-ONLY EXPERIMENT · NO WARRANTY OF GOOD JUDGMENT</span>
        <a href="https://lab.janpfrenger.com/">BACK TO JAN&apos;S LAB ↗</a>
      </footer>

      {isActive && (
        <button
          className="mobile-emergency-stop"
          type="button"
          onClick={() => disarm()}
        >
          <span className="stop-square" aria-hidden="true" />
          DISARM / STOP
        </button>
      )}
    </main>
  );
}
