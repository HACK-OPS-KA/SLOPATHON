import type { SoundName } from "../cursor/ChaosLoop";

// Synthesized, dependency-free SFX for the chaos loop and dashboard. Each sound is a
// short, low-volume blip built from OscillatorNode + GainNode envelopes so rapid events
// stay subtle rather than harsh.

let enabled = false;

export function setSoundEnabled(on: boolean): void {
  enabled = on;
}

export function isSoundEnabled(): boolean {
  return enabled;
}

// Lazily-created shared AudioContext. `null` while uninitialised; `false` once we've
// concluded audio is unavailable (SSR, blocked, or unsupported) so we stop retrying.
let ctx: AudioContext | null | false = null;

type AudioContextCtor = new () => AudioContext;

function getCtx(): AudioContext | null {
  if (ctx === false) return null;
  if (ctx) {
    if (ctx.state === "suspended") void ctx.resume();
    return ctx;
  }
  if (typeof window === "undefined") {
    ctx = false;
    return null;
  }
  try {
    const w = window as unknown as {
      AudioContext?: AudioContextCtor;
      webkitAudioContext?: AudioContextCtor;
    };
    const Ctor = w.AudioContext ?? w.webkitAudioContext;
    if (!Ctor) {
      ctx = false;
      return null;
    }
    const created = new Ctor();
    ctx = created;
    if (created.state === "suspended") void created.resume();
    return created;
  } catch {
    ctx = false;
    return null;
  }
}

// Per-name throttle: at most ~8 plays/second so rapid events don't buzz.
const MIN_INTERVAL_MS = 125;
const lastPlayed: Partial<Record<SoundName, number>> = {};

interface ToneOpts {
  type?: OscillatorType;
  from: number;
  to?: number;
  /** seconds */
  attack?: number;
  /** seconds */
  duration: number;
  peak: number;
  /** offset from the batch start, in seconds */
  delay?: number;
}

function tone(ac: AudioContext, master: GainNode, opts: ToneOpts): void {
  const {
    type = "sine",
    from,
    to = from,
    attack = 0.005,
    duration,
    peak,
    delay = 0,
  } = opts;
  const start = ac.currentTime + delay;
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = type;

  osc.frequency.setValueAtTime(from, start);
  if (to !== from) {
    osc.frequency.exponentialRampToValueAtTime(Math.max(1, to), start + duration);
  }

  const atk = Math.min(attack, duration * 0.5);
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(peak, start + atk);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);

  osc.connect(gain).connect(master);
  osc.start(start);
  osc.stop(start + duration + 0.02);
}

export function playSound(name: SoundName): void {
  if (!enabled) return;

  const now = typeof performance !== "undefined" ? performance.now() : Date.now();
  const prev = lastPlayed[name];
  if (prev !== undefined && now - prev < MIN_INTERVAL_MS) return;
  lastPlayed[name] = now;

  const ac = getCtx();
  if (!ac) return;

  try {
    const master = ac.createGain();
    master.gain.value = 1;
    master.connect(ac.destination);

    switch (name) {
      case "offset":
        // Very short soft tick/blip.
        tone(ac, master, {
          type: "sine",
          from: 1200,
          duration: 0.04,
          peak: 0.06,
        });
        break;

      case "spring":
        // Quick, bouncy upward pitch bend.
        tone(ac, master, {
          type: "sine",
          from: 300,
          to: 700,
          attack: 0.008,
          duration: 0.12,
          peak: 0.09,
        });
        break;

      case "error":
        // Soft descending two-tone.
        tone(ac, master, {
          type: "triangle",
          from: 400,
          to: 300,
          duration: 0.09,
          peak: 0.08,
        });
        tone(ac, master, {
          type: "square",
          from: 300,
          to: 220,
          duration: 0.11,
          peak: 0.05,
          delay: 0.08,
        });
        break;

      case "slot": {
        // Brief cheerful three-note arpeggio — the rare-win chime.
        const notes = [660, 880, 1320];
        notes.forEach((f, i) => {
          tone(ac, master, {
            type: "triangle",
            from: f,
            duration: 0.08,
            peak: 0.08,
            delay: i * 0.05,
          });
        });
        break;
      }

      case "newcursor":
        // Soft bell / marimba ping with a fast decay.
        tone(ac, master, {
          type: "sine",
          from: 880,
          attack: 0.004,
          duration: 0.16,
          peak: 0.09,
        });
        tone(ac, master, {
          type: "sine",
          from: 1760,
          attack: 0.004,
          duration: 0.09,
          peak: 0.03,
        });
        break;

      case "chime":
        // Calm corporate two-note chime.
        tone(ac, master, {
          type: "sine",
          from: 523.25,
          attack: 0.01,
          duration: 0.14,
          peak: 0.07,
        });
        tone(ac, master, {
          type: "sine",
          from: 783.99,
          attack: 0.01,
          duration: 0.18,
          peak: 0.07,
          delay: 0.1,
        });
        break;
    }
  } catch {
    // If synthesis fails mid-flight, stay silent rather than throwing into the loop.
  }
}
