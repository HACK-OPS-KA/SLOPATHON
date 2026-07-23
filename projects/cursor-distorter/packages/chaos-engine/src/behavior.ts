import type { BehaviorSignals } from "@cursor-distorter/shared-types";

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

export interface ClickOutcome {
  now: number;
  /** Target the user intended to hit, if any. */
  targetId?: string;
  /** True when the effective click landed on the intended target. */
  hitIntended: boolean;
  /** Distance in px between intended and effective click. */
  missDistance: number;
}

/**
 * Tracks recent user behavior to drive adaptive sabotage. Pure in-memory counters and
 * decays — no input contents, keystrokes, or identifiers are ever recorded.
 */
export class BehaviorTracker {
  private signals: BehaviorSignals = freshSignals();
  private lastMoveAt = 0;
  private speedEma = 0;
  private missTimes: number[] = [];

  reset(now = 0): void {
    this.signals = freshSignals();
    this.lastMoveAt = now;
    this.speedEma = 0;
    this.missTimes = [];
  }

  /** Feed one frame of movement. `speed` is px/ms. */
  onFrame(now: number, moving: boolean, speed: number): void {
    if (moving && speed > 0.02) this.lastMoveAt = now;
    this.signals.idleMs = Math.max(0, now - this.lastMoveAt);

    const alpha = 0.12;
    this.speedEma = this.speedEma * (1 - alpha) + speed * alpha;
    // Slow, deliberate movement reads as high "carefulness".
    this.signals.carefulness = clamp01(1 - this.speedEma / 0.6);

    // Recent misses decay over a 4s window.
    this.missTimes = this.missTimes.filter((t) => now - t < 4000);
    this.signals.recentMisses = this.missTimes.length;
  }

  onClickOutcome(o: ClickOutcome): void {
    if (o.hitIntended) {
      this.signals.successfulClicks++;
      this.signals.consecutiveMissesOnSameTarget = 0;
      // Succeeding despite active effects reads as adaptation.
      this.signals.adaptationScore = clamp01(this.signals.adaptationScore + 0.15);
    } else {
      this.signals.failedClicks++;
      this.missTimes.push(o.now);
      this.signals.adaptationScore = clamp01(this.signals.adaptationScore - 0.12);
      if (o.targetId && o.targetId === this.signals.lastMissTargetId) {
        this.signals.consecutiveMissesOnSameTarget++;
      } else {
        this.signals.consecutiveMissesOnSameTarget = o.targetId ? 1 : 0;
      }
      this.signals.lastMissTargetId = o.targetId;
    }
  }

  onCloseAttempt(): void {
    this.signals.closeAttempts++;
  }

  resetCloseAttempts(): void {
    this.signals.closeAttempts = 0;
  }

  snapshot(): BehaviorSignals {
    return { ...this.signals };
  }
}

function freshSignals(): BehaviorSignals {
  return {
    recentMisses: 0,
    consecutiveMissesOnSameTarget: 0,
    lastMissTargetId: undefined,
    successfulClicks: 0,
    failedClicks: 0,
    carefulness: 0.5,
    idleMs: 0,
    closeAttempts: 0,
    adaptationScore: 0.5,
  };
}
