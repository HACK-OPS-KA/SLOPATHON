import type { BehaviorSignals, SessionStats } from "@cursor-distorter/shared-types";
import { emptySessionStats } from "@cursor-distorter/shared-types";

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

export const DEFAULT_MAX_SESSION_MS = 10 * 60 * 1000;

export interface TickInput {
  now: number;
  active: boolean;
  intensity: number;
  behavior: BehaviorSignals;
}

/**
 * Aggregates anonymous session statistics and models the (deliberately theatrical)
 * trust / frustration / productivity numbers shown on the dashboard. Also owns the
 * max-session timer that force-disables distortion.
 */
export class SessionTracker {
  private stats: SessionStats = emptySessionStats();
  private startedAt = 0;
  private lastTickAt = 0;
  private maxSessionMs = DEFAULT_MAX_SESSION_MS;

  start(now: number): void {
    this.stats = emptySessionStats(now);
    this.startedAt = now;
    this.lastTickAt = now;
  }

  reset(now = 0): void {
    this.start(now);
  }

  setMaxSessionMs(ms: number): void {
    this.maxSessionMs = Math.max(1000, ms);
  }

  getMaxSessionMs(): number {
    return this.maxSessionMs;
  }

  isExpired(now: number): boolean {
    return now - this.startedAt >= this.maxSessionMs;
  }

  remainingMs(now: number): number {
    return Math.max(0, this.maxSessionMs - (now - this.startedAt));
  }

  tick(input: TickInput): void {
    const dt = Math.max(0, input.now - this.lastTickAt);
    this.lastTickAt = input.now;
    this.stats.durationMs = input.now - this.startedAt;

    if (input.active) {
      // Every active millisecond "intercepts" a scaled slice of productivity.
      this.stats.productivityLostMs += dt * (0.25 + input.intensity * 0.9);
    }

    const b = input.behavior;
    this.stats.frustration = clamp(
      b.recentMisses * 0.14 + this.stats.accidentalClicks * 0.015 + b.closeAttempts * 0.05,
      0,
      1,
    );
    const avgDisagreement =
      this.stats.missCount === 0 ? 0 : this.stats.totalMissDistance / this.stats.missCount;
    this.stats.trustScore = clamp(
      100 -
        (this.stats.preventedClicks * 1.8 +
          this.stats.accidentalClicks * 1.2 +
          avgDisagreement * 0.4) +
        this.stats.successfulClicks * 0.6,
      3,
      100,
    );
  }

  recordSuccessfulClick(): void {
    this.stats.successfulClicks++;
  }

  /** An intended click the platform "protected" the user from. */
  recordPreventedClick(missDistance: number): void {
    this.stats.preventedClicks++;
    this.stats.totalMissDistance += Math.abs(missDistance);
    this.stats.missCount++;
  }

  recordAccidentalClick(): void {
    this.stats.accidentalClicks++;
  }

  recordResponsibilityAvoided(): void {
    this.stats.responsibilityAvoided++;
  }

  snapshot(): SessionStats {
    return { ...this.stats };
  }
}
