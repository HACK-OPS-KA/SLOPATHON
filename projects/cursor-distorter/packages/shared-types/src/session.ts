/** How much suffering the user opted into during onboarding. */
export type InconvenienceTolerance =
  | "barely" // Barely noticeable
  | "destabilizing" // Mildly destabilizing
  | "irritating" // Deeply irritating
  | "reality"; // Make me question reality

/** What the user claimed to be doing (onboarding step 2). */
export type OnboardingGoal =
  | "serious-work"
  | "admin"
  | "presentation"
  | "time-sensitive"
  | "nothing";

/** Which host surface the distortion is being applied to. */
export type OperatingMode = "sandbox" | "system";

/** Live, anonymous session statistics. No sensitive data — counts and estimates only. */
export interface SessionStats {
  startedAt: number;
  durationMs: number;
  /** Clicks that landed where the user intended. */
  successfulClicks: number;
  /** Intended clicks the platform "protected" the user from. */
  preventedClicks: number;
  /** Clicks generated somewhere the user did not intend. */
  accidentalClicks: number;
  /** Sum of miss distances (px) — for average pointer disagreement. */
  totalMissDistance: number;
  missCount: number;
  /** 0..100 — cursor-user trust score. */
  trustScore: number;
  /** Estimated productivity intercepted, in ms. */
  productivityLostMs: number;
  /** 0..1 — modelled user frustration. */
  frustration: number;
  /** Count of tasks the cursor helped the user avoid (Group Project flavour). */
  responsibilityAvoided: number;
}

export function emptySessionStats(startedAt = 0): SessionStats {
  return {
    startedAt,
    durationMs: 0,
    successfulClicks: 0,
    preventedClicks: 0,
    accidentalClicks: 0,
    totalMissDistance: 0,
    missCount: 0,
    trustScore: 100,
    productivityLostMs: 0,
    frustration: 0,
    responsibilityAvoided: 0,
  };
}

export function averageDisagreement(stats: SessionStats): number {
  return stats.missCount === 0 ? 0 : stats.totalMissDistance / stats.missCount;
}
