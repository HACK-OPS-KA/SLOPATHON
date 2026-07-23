"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { RemoteDuoHost, RemoteMicController } from "./remote-duo";

type GamePhase = "ready" | "playing" | "crashed";
type MicState = "idle" | "requesting" | "live" | "calibrating" | "error";

type Pipe = {
  x: number;
  gapY: number;
  scored: boolean;
};

type World = {
  width: number;
  height: number;
  birdY: number;
  birdVelocity: number;
  pipes: Pipe[];
  spawnClock: number;
  score: number;
};

const GRAVITY = 1460;
const FLAP_VELOCITY = -455;
const PIPE_SPEED = 188;
const PIPE_WIDTH = 74;
const PIPE_INTERVAL = 1.48;
const FLOOR_HEIGHT = 54;
const BIRD_RADIUS = 16;
const HIGH_SCORE_KEY = "screamy-bird-high-score";
const MIN_YELL_THRESHOLD = 0.7;
const DEFAULT_YELL_THRESHOLD = 0.82;

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const createWorld = (width: number, height: number): World => ({
  width,
  height,
  birdY: Math.max(110, (height - FLOOR_HEIGHT) * 0.46),
  birdVelocity: 0,
  pipes: [],
  spawnClock: 0.76,
  score: 0,
});

function drawBackground(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  elapsed: number,
) {
  context.fillStyle = "#0d1014";
  context.fillRect(0, 0, width, height);

  const horizon = height - FLOOR_HEIGHT;
  const gridOffset = (elapsed * 24) % 42;

  context.strokeStyle = "rgba(53, 229, 255, 0.09)";
  context.lineWidth = 1;
  for (let x = -42 + gridOffset; x < width + 42; x += 42) {
    context.beginPath();
    context.moveTo(x, 0);
    context.lineTo(x, horizon);
    context.stroke();
  }
  for (let y = 30; y < horizon; y += 42) {
    context.beginPath();
    context.moveTo(0, y);
    context.lineTo(width, y);
    context.stroke();
  }

  context.fillStyle = "#151920";
  for (let index = 0; index < 18; index += 1) {
    const buildingWidth = 46 + ((index * 17) % 44);
    const buildingHeight = 38 + ((index * 31) % 92);
    const x = index * 96 - ((elapsed * 20) % 96);
    context.fillRect(
      x,
      horizon - buildingHeight,
      buildingWidth,
      buildingHeight,
    );
  }

  context.fillStyle = "#dfff00";
  context.fillRect(0, horizon, width, 3);
  context.fillStyle = "#08090b";
  context.fillRect(0, horizon + 3, width, FLOOR_HEIGHT - 3);

  context.fillStyle = "rgba(223, 255, 0, 0.24)";
  for (let x = -60 + ((elapsed * 155) % 60); x < width + 60; x += 60) {
    context.beginPath();
    context.moveTo(x, horizon + 9);
    context.lineTo(x + 24, horizon + 9);
    context.lineTo(x + 12, horizon + 18);
    context.closePath();
    context.fill();
  }
}

function drawPipe(
  context: CanvasRenderingContext2D,
  pipe: Pipe,
  height: number,
) {
  const gapSize = clamp(height * 0.31, 142, 188);
  const gapTop = pipe.gapY - gapSize / 2;
  const gapBottom = pipe.gapY + gapSize / 2;
  const floorTop = height - FLOOR_HEIGHT;

  context.fillStyle = "#ff4d2e";
  context.fillRect(pipe.x, 0, PIPE_WIDTH, gapTop);
  context.fillRect(pipe.x, gapBottom, PIPE_WIDTH, floorTop - gapBottom);

  context.fillStyle = "#08090b";
  context.fillRect(pipe.x + 9, 0, 8, gapTop);
  context.fillRect(pipe.x + 9, gapBottom, 8, floorTop - gapBottom);

  context.fillStyle = "#f4f2ea";
  context.fillRect(pipe.x - 5, Math.max(0, gapTop - 14), PIPE_WIDTH + 10, 14);
  context.fillRect(pipe.x - 5, gapBottom, PIPE_WIDTH + 10, 14);

  context.fillStyle = "#08090b";
  context.font = "700 9px monospace";
  context.fillText("NOISE", pipe.x + 17, Math.max(10, gapTop - 4));
  context.fillText("NOISE", pipe.x + 17, gapBottom + 10);
}

function drawBird(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  velocity: number,
) {
  context.save();
  context.translate(x, y);
  context.rotate(clamp(velocity / 980, -0.36, 0.7));

  context.fillStyle = "rgba(223, 255, 0, 0.18)";
  context.beginPath();
  context.arc(-5, 2, BIRD_RADIUS + 8, 0, Math.PI * 2);
  context.fill();

  context.fillStyle = "#dfff00";
  context.beginPath();
  context.arc(0, 0, BIRD_RADIUS, 0, Math.PI * 2);
  context.fill();

  context.fillStyle = "#08090b";
  context.beginPath();
  context.arc(5, -5, 5, 0, Math.PI * 2);
  context.fill();

  context.fillStyle = "#f4f2ea";
  context.beginPath();
  context.arc(6, -6, 2, 0, Math.PI * 2);
  context.fill();

  context.fillStyle = "#ff4d2e";
  context.beginPath();
  context.moveTo(13, -1);
  context.lineTo(29, 5);
  context.lineTo(13, 9);
  context.closePath();
  context.fill();

  context.fillStyle = "#08090b";
  context.fillRect(-21, -4, 13, 8);
  context.restore();
}

function SinglePlayerGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const worldRef = useRef<World>(createWorld(900, 520));
  const phaseRef = useRef<GamePhase>("ready");
  const animationRef = useRef<number | null>(null);
  const lastFrameRef = useRef<number | null>(null);
  const runStartedAtRef = useRef(0);
  const thresholdRef = useRef(DEFAULT_YELL_THRESHOLD);
  const levelRef = useRef(0);
  const audioFrameRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioStreamRef = useRef<MediaStream | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const triggerArmedRef = useRef(true);
  const lastTriggerRef = useRef(0);
  const triggerFlapRef = useRef<() => void>(() => undefined);

  const [phase, setPhase] = useState<GamePhase>("ready");
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [threshold, setThreshold] = useState(DEFAULT_YELL_THRESHOLD);
  const [audioLevel, setAudioLevel] = useState(0);
  const [decibels, setDecibels] = useState<number | null>(null);
  const [micState, setMicState] = useState<MicState>("idle");
  const [micMessage, setMicMessage] = useState(
    "Enable the mic, then shout above the red line.",
  );
  const [lastEvent, setLastEvent] = useState("Flight system standing by");

  const updatePhase = useCallback((nextPhase: GamePhase) => {
    phaseRef.current = nextPhase;
    setPhase(nextPhase);
  }, []);

  const resizeWorld = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const width = Math.max(320, rect.width);
    const height = Math.max(340, rect.height);
    const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);

    canvas.width = Math.round(width * pixelRatio);
    canvas.height = Math.round(height * pixelRatio);

    const context = canvas.getContext("2d");
    context?.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);

    if (phaseRef.current !== "playing") {
      worldRef.current = createWorld(width, height);
    } else {
      worldRef.current.width = width;
      worldRef.current.height = height;
    }
  }, []);

  const startRun = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    worldRef.current = createWorld(
      Math.max(320, rect.width),
      Math.max(340, rect.height),
    );
    worldRef.current.birdVelocity = FLAP_VELOCITY;
    runStartedAtRef.current = performance.now();
    setScore(0);
    updatePhase("playing");
    setLastEvent("Run started — make some noise");
    canvas.focus();
  }, [updatePhase]);

  const crash = useCallback(() => {
    if (phaseRef.current !== "playing") return;

    const finalScore = worldRef.current.score;
    const nextHighScore = Math.max(highScore, finalScore);
    if (nextHighScore !== highScore) {
      setHighScore(nextHighScore);
      window.localStorage.setItem(HIGH_SCORE_KEY, String(nextHighScore));
    }
    updatePhase("crashed");
    setLastEvent(`Vocal aviation incident at pipe ${finalScore + 1}`);
  }, [highScore, updatePhase]);

  const triggerFlap = useCallback(() => {
    if (phaseRef.current === "playing") {
      worldRef.current.birdVelocity = FLAP_VELOCITY;
      setLastEvent("Jump threshold crossed");
      return;
    }
    startRun();
  }, [startRun]);

  useEffect(() => {
    triggerFlapRef.current = triggerFlap;
  }, [triggerFlap]);

  useEffect(() => {
    const storedHighScore = Number(
      window.localStorage.getItem(HIGH_SCORE_KEY) ?? "0",
    );
    const highScoreFrame = window.requestAnimationFrame(() => {
      if (Number.isFinite(storedHighScore)) {
        setHighScore(storedHighScore);
      }
    });

    resizeWorld();
    const resizeObserver = new ResizeObserver(resizeWorld);
    if (canvasRef.current) resizeObserver.observe(canvasRef.current);

    return () => {
      window.cancelAnimationFrame(highScoreFrame);
      resizeObserver.disconnect();
    };
  }, [resizeWorld]);

  useEffect(() => {
    const renderFrame = (now: number) => {
      const canvas = canvasRef.current;
      const context = canvas?.getContext("2d");

      if (canvas && context) {
        const world = worldRef.current;
        const lastFrame = lastFrameRef.current ?? now;
        const delta = clamp((now - lastFrame) / 1000, 0, 0.034);
        lastFrameRef.current = now;
        const elapsed =
          phaseRef.current === "playing"
            ? (now - runStartedAtRef.current) / 1000
            : now / 1000;

        if (phaseRef.current === "playing") {
          world.birdVelocity += GRAVITY * delta;
          world.birdY += world.birdVelocity * delta;
          world.spawnClock += delta;

          if (world.spawnClock >= PIPE_INTERVAL) {
            world.spawnClock = 0;
            const playableHeight = world.height - FLOOR_HEIGHT;
            const gapSize = clamp(world.height * 0.31, 142, 188);
            const margin = gapSize / 2 + 44;
            const pseudoRandom =
              (Math.sin(elapsed * 1.73 + world.score * 2.31) + 1) / 2;
            world.pipes.push({
              x: world.width + PIPE_WIDTH,
              gapY: margin + pseudoRandom * (playableHeight - margin * 2),
              scored: false,
            });
          }

          for (const pipe of world.pipes) {
            pipe.x -= PIPE_SPEED * delta;
            if (!pipe.scored && pipe.x + PIPE_WIDTH < world.width * 0.24) {
              pipe.scored = true;
              world.score += 1;
              setScore(world.score);
              setLastEvent(`Pipe ${world.score} cleared`);
            }
          }
          world.pipes = world.pipes.filter(
            (pipe) => pipe.x + PIPE_WIDTH > -20,
          );

          const birdX = world.width * 0.24;
          const gapSize = clamp(world.height * 0.31, 142, 188);
          const hitPipe = world.pipes.some((pipe) => {
            const overlapsX =
              birdX + BIRD_RADIUS > pipe.x &&
              birdX - BIRD_RADIUS < pipe.x + PIPE_WIDTH;
            if (!overlapsX) return false;
            const gapTop = pipe.gapY - gapSize / 2;
            const gapBottom = pipe.gapY + gapSize / 2;
            return (
              world.birdY - BIRD_RADIUS < gapTop ||
              world.birdY + BIRD_RADIUS > gapBottom
            );
          });

          const hitBoundary =
            world.birdY - BIRD_RADIUS < 0 ||
            world.birdY + BIRD_RADIUS > world.height - FLOOR_HEIGHT;

          if (hitPipe || hitBoundary) crash();
        }

        drawBackground(context, world.width, world.height, elapsed);
        for (const pipe of world.pipes) {
          drawPipe(context, pipe, world.height);
        }
        drawBird(
          context,
          world.width * 0.24,
          world.birdY,
          world.birdVelocity,
        );
      }

      animationRef.current = window.requestAnimationFrame(renderFrame);
    };

    animationRef.current = window.requestAnimationFrame(renderFrame);
    return () => {
      if (animationRef.current !== null) {
        window.cancelAnimationFrame(animationRef.current);
      }
    };
  }, [crash]);

  const stopMicrophone = useCallback(() => {
    if (audioFrameRef.current !== null) {
      window.cancelAnimationFrame(audioFrameRef.current);
      audioFrameRef.current = null;
    }
    audioStreamRef.current?.getTracks().forEach((track) => track.stop());
    audioStreamRef.current = null;
    analyserRef.current?.disconnect();
    analyserRef.current = null;
    void audioContextRef.current?.close();
    audioContextRef.current = null;
    levelRef.current = 0;
    setAudioLevel(0);
    setDecibels(null);
    setMicState("idle");
    setMicMessage("Microphone stopped. Click or tap still works as fallback.");
    setLastEvent("Microphone disconnected");
  }, []);

  const startMicrophone = useCallback(async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setMicState("error");
      setMicMessage("This browser does not expose microphone input.");
      return;
    }

    setMicState("requesting");
    setMicMessage("Waiting for microphone permission…");

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          autoGainControl: false,
          echoCancellation: true,
          noiseSuppression: true,
        },
      });

      const audioContext = new AudioContext();
      await audioContext.resume();
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 1024;
      analyser.smoothingTimeConstant = 0.5;

      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);

      audioStreamRef.current = stream;
      audioContextRef.current = audioContext;
      analyserRef.current = analyser;
      setMicState("live");
      setMicMessage("Listening locally. Cross the red line to flap.");
      setLastEvent("Microphone online");

      const samples = new Float32Array(analyser.fftSize);
      let lastUiUpdate = 0;

      const readAudio = (now: number) => {
        const activeAnalyser = analyserRef.current;
        if (!activeAnalyser) return;

        activeAnalyser.getFloatTimeDomainData(samples);
        let sumSquares = 0;
        for (const sample of samples) sumSquares += sample * sample;
        const rms = Math.sqrt(sumSquares / samples.length);
        const db = rms > 0.00001 ? 20 * Math.log10(rms) : -80;
        const normalized = clamp((db + 58) / 43, 0, 1);
        levelRef.current = normalized;

        if (now - lastUiUpdate > 42) {
          setAudioLevel(normalized);
          setDecibels(db);
          lastUiUpdate = now;
        }

        const crossedLine = normalized >= thresholdRef.current;
        const cooledDown = now - lastTriggerRef.current > 210;

        if (crossedLine && triggerArmedRef.current && cooledDown) {
          triggerArmedRef.current = false;
          lastTriggerRef.current = now;
          triggerFlapRef.current();
        } else if (
          normalized <
          Math.max(0.08, thresholdRef.current - 0.08)
        ) {
          triggerArmedRef.current = true;
        }

        audioFrameRef.current = window.requestAnimationFrame(readAudio);
      };

      audioFrameRef.current = window.requestAnimationFrame(readAudio);
    } catch {
      setMicState("error");
      setMicMessage(
        "Microphone unavailable. Allow access or click the game as fallback.",
      );
      setLastEvent("Microphone permission failed");
    }
  }, []);

  const calibrateMicrophone = useCallback(() => {
    if (micState !== "live") return;

    setMicState("calibrating");
    setMicMessage("Stay quiet for one second. Measuring room noise…");
    const startedAt = performance.now();
    let peak = 0;

    const sampleRoom = (now: number) => {
      peak = Math.max(peak, levelRef.current);
      if (now - startedAt < 1200) {
        window.requestAnimationFrame(sampleRoom);
        return;
      }

      const calibratedThreshold = clamp(
        peak + 0.18,
        MIN_YELL_THRESHOLD,
        0.92,
      );
      thresholdRef.current = calibratedThreshold;
      setThreshold(calibratedThreshold);
      setMicState("live");
      setMicMessage("Calibrated. Now make an unreasonable amount of noise.");
      setLastEvent(
        `Room calibrated — jump line at ${Math.round(calibratedThreshold * 100)}%`,
      );
    };

    window.requestAnimationFrame(sampleRoom);
  }, [micState]);

  useEffect(
    () => () => {
      if (audioFrameRef.current !== null) {
        window.cancelAnimationFrame(audioFrameRef.current);
      }
      audioStreamRef.current?.getTracks().forEach((track) => track.stop());
      void audioContextRef.current?.close();
    },
    [],
  );

  const handleThresholdChange = (value: number) => {
    const nextThreshold = clamp(value, 0.12, 0.9);
    thresholdRef.current = nextThreshold;
    setThreshold(nextThreshold);
    triggerArmedRef.current = true;
  };

  const dbLabel =
    decibels === null ? "—" : `${Math.round(clamp(decibels, -80, 0))}`;
  const micLabel = {
    idle: "Mic offline",
    requesting: "Requesting access",
    live: "Mic live",
    calibrating: "Calibrating",
    error: "Mic unavailable",
  }[micState];

  const microphoneActive =
    micState === "live" || micState === "calibrating";

  return (
    <main className="app-shell">
      <div className="topbar">
        <div className="brand-lockup">
          <span className="brand-mark" aria-hidden="true">
            SB
          </span>
          <span>HACK//OPS Experimental Aviation</span>
        </div>
        <div className="system-state">
          <span className="status-dot" aria-hidden="true" />
          Local audio processing / no recordings
        </div>
      </div>

      <div className="page">
        <header className="hero">
          <div>
            <p className="eyebrow">Vocal flight system v0.1</p>
            <h1>
              Screamy
              <br />
              <span>Bird.</span>
            </h1>
          </div>
          <p className="hero-copy">
            We replaced one ordinary flap button with a full real-time audio
            pipeline. Scream above the line. Avoid the pipes. Lose your voice.
          </p>
        </header>

        <section className="game-layout" aria-label="Screamy Bird game">
          <div className="game-card">
            <div className="card-bar">
              <strong>Flight viewport</strong>
              <div className="scoreline">
                <span>
                  Score <b>{score.toString().padStart(2, "0")}</b>
                </span>
                <span>
                  Best <b>{highScore.toString().padStart(2, "0")}</b>
                </span>
              </div>
            </div>

            <div className="canvas-wrap">
              <canvas
                ref={canvasRef}
                className="game-canvas"
                tabIndex={0}
                aria-label="Screamy Bird. Click, tap, or shout above the jump line to flap."
                onPointerDown={() => triggerFlap()}
              />
              <div className="scanline" aria-hidden="true" />

              {phase !== "playing" && (
                <div className="game-overlay">
                  <div className="overlay-card">
                    <p className="overlay-kicker">
                      {phase === "crashed"
                        ? "Vocal aviation incident"
                        : "Pre-flight check"}
                    </p>
                    <h2>
                      {phase === "crashed"
                        ? `Score ${score}`
                        : "Ready when loud"}
                    </h2>
                    <p>
                      {phase === "crashed"
                        ? "The bird has been grounded pending an internal noise investigation."
                        : "Enable the microphone, then make short noises above the red jump line. Click and tap are emergency fallbacks."}
                    </p>
                    <button
                      className="primary-button"
                      type="button"
                      onClick={startRun}
                      data-testid="start-run"
                    >
                      {phase === "crashed" ? "Re-deploy bird" : "Start run"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <aside className="control-rail" aria-label="Audio flight controls">
            <div className="rail-heading">
              <p>Input channel 01</p>
              <h2>Voice thrust</h2>
            </div>

            <div className="meter-zone">
              <div
                className="volume-meter"
                role="progressbar"
                aria-label="Live microphone volume"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={Math.round(audioLevel * 100)}
              >
                <div
                  className="volume-fill"
                  style={{ height: `${Math.max(0.5, audioLevel * 100)}%` }}
                />
                <div
                  className="threshold-line"
                  style={{ bottom: `${threshold * 100}%` }}
                />
              </div>

              <div className="meter-readout">
                <span className="readout-value">{dbLabel}</span>
                <span className="readout-label">dBFS approx.</span>

                <p className="mic-status" aria-live="polite">
                  <strong>{micLabel}</strong>
                  {micMessage}
                </p>

                <div className="spacer" />

                <div className="threshold-control">
                  <label htmlFor="threshold">
                    Jump line <b>{Math.round(threshold * 100)}%</b>
                  </label>
                  <input
                    id="threshold"
                    type="range"
                    min={MIN_YELL_THRESHOLD * 100}
                    max="96"
                    value={Math.round(threshold * 100)}
                    onChange={(event) =>
                      handleThresholdChange(Number(event.target.value) / 100)
                    }
                  />
                </div>
              </div>
            </div>

            <div className="rail-actions">
              {microphoneActive ? (
                <button
                  className="secondary-button"
                  type="button"
                  onClick={stopMicrophone}
                >
                  Stop microphone
                </button>
              ) : (
                <button
                  className="primary-button"
                  type="button"
                  onClick={startMicrophone}
                  disabled={micState === "requesting"}
                  data-testid="enable-mic"
                >
                  {micState === "requesting"
                    ? "Waiting for permission"
                    : "Enable microphone"}
                </button>
              )}
              <button
                className="secondary-button"
                type="button"
                onClick={calibrateMicrophone}
                disabled={micState !== "live"}
              >
                Calibrate room
              </button>
              <a className="mode-link" href="?duo=1">
                Open remote 2-player mode
              </a>
              <p className="privacy-note">
                Audio is measured in this tab and never stored or transmitted.
              </p>
            </div>
          </aside>
        </section>

        <section className="instruction-strip" aria-label="How to play">
          <article className="instruction">
            <span>01 / ARM</span>
            <h3>Enable the microphone</h3>
            <p>Permission is requested only after you press the button.</p>
          </article>
          <article className="instruction">
            <span>02 / TUNE</span>
            <h3>Move the red line</h3>
            <p>Set it above room noise and below your most committed scream.</p>
          </article>
          <article className="instruction">
            <span>03 / REGRET</span>
            <h3>Make short noises</h3>
            <p>Each crossing triggers one flap. Silence re-arms the system.</p>
          </article>
        </section>

        <p className="event-log" aria-live="polite">
          Last event: <strong>{lastEvent}</strong>
        </p>
      </div>
    </main>
  );
}

export function ScreamyBirdGame() {
  const [mode, setMode] = useState<"single" | "duo" | "controller">("single");

  useEffect(() => {
    const modeFrame = window.requestAnimationFrame(() => {
      const params = new URLSearchParams(window.location.search);
      if (params.get("controller") === "1") {
        setMode("controller");
      } else if (params.get("duo") === "1") {
        setMode("duo");
      }
    });
    return () => window.cancelAnimationFrame(modeFrame);
  }, []);

  if (mode === "controller") {
    return <RemoteMicController />;
  }

  if (mode === "duo") {
    return <RemoteDuoHost />;
  }

  return <SinglePlayerGame />;
}
