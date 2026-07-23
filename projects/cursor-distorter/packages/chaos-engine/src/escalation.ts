import type { EscalationStage } from "@cursor-distorter/shared-types";

/**
 * The Live Demo Catastrophe timeline — starts subtle, escalates over three minutes.
 * Times are in seconds from escalation start.
 */
export const CATASTROPHE_TIMELINE: EscalationStage[] = [
  {
    at: 0,
    label: "Baseline",
    note: "Cursor resilience monitoring active.",
    intensity: 0.15,
    effects: { imprecision: { enabled: true, intensity: 0.2, probability: 0.4 } },
  },
  {
    at: 30,
    label: "Slight inaccuracy",
    note: "Minor pointer disagreement detected.",
    intensity: 0.28,
    effects: { imprecision: { enabled: true, intensity: 0.35, probability: 0.6 } },
  },
  {
    at: 60,
    label: "Lag and drift",
    note: "Motor accuracy anomaly under observation.",
    intensity: 0.42,
    effects: {
      lag: { enabled: true, intensity: 0.4 },
      drift: { enabled: true, intensity: 0.35 },
    },
  },
  {
    at: 90,
    label: "Second cursor",
    note: "Cursor alignment has been strategically diversified.",
    intensity: 0.55,
    effects: { triplets: { enabled: true, intensity: 0.4, params: { count: 2 } } },
  },
  {
    at: 120,
    label: "Third cursor + repulsion",
    note: "Three cursors provide three times the confidence.",
    intensity: 0.68,
    effects: {
      triplets: { enabled: true, intensity: 0.6, params: { count: 3 } },
      repulsion: { enabled: true, intensity: 0.5 },
    },
  },
  {
    at: 150,
    label: "Confidence warnings",
    note: "Intent certainty remains below operational thresholds.",
    intensity: 0.8,
    effects: {
      confidence: { enabled: true, intensity: 0.7 },
      overshoot: { enabled: true, intensity: 0.5 },
    },
  },
  {
    at: 180,
    label: "The cursor council convenes",
    note: "A corrective inconvenience has been applied.",
    intensity: 0.92,
    effects: {
      social: { enabled: true, intensity: 0.7 },
      betrayal: { enabled: true, intensity: 0.5, probability: 0.22 },
      freezes: { enabled: true, intensity: 0.5 },
    },
  },
];

/** Demo-mode escalation — a brisker version that ramps every ~25 seconds. */
export const DEMO_TIMELINE: EscalationStage[] = [
  {
    at: 0,
    label: "Warm-up",
    note: "Onboarding your pointer to reduced autonomy.",
    intensity: 0.2,
    effects: { imprecision: { enabled: true, intensity: 0.3, probability: 0.5 } },
  },
  {
    at: 25,
    label: "Drift online",
    note: "Your productivity is being gently intercepted.",
    intensity: 0.38,
    effects: { drift: { enabled: true, intensity: 0.4 }, lag: { enabled: true, intensity: 0.35 } },
  },
  {
    at: 50,
    label: "Cursors multiply",
    note: "Additional cursors deployed for redundancy.",
    intensity: 0.55,
    effects: { triplets: { enabled: true, intensity: 0.55, params: { count: 3 } } },
  },
  {
    at: 75,
    label: "Buttons resist",
    note: "Manual pointer control is a legacy workflow.",
    intensity: 0.72,
    effects: {
      repulsion: { enabled: true, intensity: 0.6 },
      confidence: { enabled: true, intensity: 0.7 },
    },
  },
  {
    at: 100,
    label: "Full council",
    note: "We noticed you were becoming accurate.",
    intensity: 0.9,
    effects: {
      social: { enabled: true, intensity: 0.75 },
      betrayal: { enabled: true, intensity: 0.55 },
      overshoot: { enabled: true, intensity: 0.55 },
    },
  },
];

/**
 * Walks an escalation timeline as wall-clock advances, emitting each stage exactly
 * once when its time is crossed.
 */
export class EscalationController {
  private timeline: EscalationStage[];
  private startedAt = 0;
  private index = 0;
  private running = false;

  constructor(timeline: EscalationStage[] = CATASTROPHE_TIMELINE) {
    this.timeline = [...timeline].sort((a, b) => a.at - b.at);
  }

  setTimeline(timeline: EscalationStage[]): void {
    this.timeline = [...timeline].sort((a, b) => a.at - b.at);
    this.index = 0;
  }

  start(now: number): void {
    this.startedAt = now;
    this.index = 0;
    this.running = true;
  }

  stop(): void {
    this.running = false;
  }

  reset(): void {
    this.index = 0;
    this.running = false;
  }

  isRunning(): boolean {
    return this.running;
  }

  elapsedSeconds(now: number): number {
    return this.running ? (now - this.startedAt) / 1000 : 0;
  }

  get done(): boolean {
    return this.index >= this.timeline.length;
  }

  /** Returns any stages newly crossed since the previous tick. */
  tick(now: number): EscalationStage[] {
    if (!this.running) return [];
    const elapsed = (now - this.startedAt) / 1000;
    const fired: EscalationStage[] = [];
    while (this.index < this.timeline.length && this.timeline[this.index]!.at <= elapsed) {
      fired.push(this.timeline[this.index]!);
      this.index++;
    }
    return fired;
  }
}
