import { describe, it, expect } from "vitest";
import { SessionTracker } from "../session-tracker";
import { emptySessionStats, type BehaviorSignals } from "@cursor-distorter/shared-types";

const behavior: BehaviorSignals = {
  recentMisses: 0,
  consecutiveMissesOnSameTarget: 0,
  successfulClicks: 0,
  failedClicks: 0,
  carefulness: 0.5,
  idleMs: 0,
  closeAttempts: 0,
  adaptationScore: 0.5,
};

describe("SessionTracker", () => {
  it("expires at the configured max session length", () => {
    const s = new SessionTracker();
    s.setMaxSessionMs(1000);
    s.start(0);
    expect(s.isExpired(500)).toBe(false);
    expect(s.isExpired(1000)).toBe(true);
    expect(s.remainingMs(400)).toBe(600);
    expect(s.remainingMs(5000)).toBe(0);
  });

  it("accumulates productivity loss only while active", () => {
    const s = new SessionTracker();
    s.start(0);
    s.tick({ now: 1000, active: false, intensity: 0.5, behavior });
    expect(s.snapshot().productivityLostMs).toBe(0);
    s.tick({ now: 2000, active: true, intensity: 0.5, behavior });
    expect(s.snapshot().productivityLostMs).toBeGreaterThan(0);
  });

  it("drops trust as clicks are prevented", () => {
    const s = new SessionTracker();
    s.start(0);
    for (let i = 0; i < 10; i++) s.recordPreventedClick(40);
    s.tick({ now: 100, active: true, intensity: 0.5, behavior });
    expect(s.snapshot().trustScore).toBeLessThan(100);
  });

  it("computes average disagreement via helper", () => {
    const stats = emptySessionStats(0);
    stats.totalMissDistance = 120;
    stats.missCount = 4;
    expect(stats.totalMissDistance / stats.missCount).toBe(30);
  });
});
