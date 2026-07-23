import type {
  BehaviorSignals,
  EffectConfig,
  EffectId,
  RandomStream,
} from "@cursor-distorter/shared-types";

export interface AdaptiveModelLine {
  id: string;
  text: string;
  severity?: "ok" | "warn" | "bad";
  at: number;
}

export interface AdaptiveDirective {
  effect: EffectId;
  patch?: Partial<Omit<EffectConfig, "params">>;
  paramPatch?: Record<string, number | string | boolean>;
}

export interface AdaptiveResult {
  directives: AdaptiveDirective[];
  modelLines: AdaptiveModelLine[];
  /** True once the user has earned release from the evasive close behavior. */
  releaseCloseEvasion: boolean;
}

const EMPTY: AdaptiveResult = { directives: [], modelLines: [], releaseCloseEvasion: false };

/**
 * A lightweight rules engine that reacts to user behavior — the source of the
 * "User adaptation detected / Counter-adaptation deployed" theatre. It nudges effect
 * configuration and emits fake internal-model lines. Deliberately throttled so it
 * escalates rather than thrashes.
 */
export class AdaptiveController {
  private lastEvalAt = -1e9;
  private lastRotateAt = -1e9;
  private seq = 0;
  private readonly rotation: EffectId[] = [
    "freezes",
    "longway",
    "drift",
    "overshoot",
    "sensitivity",
    "social",
  ];

  reset(): void {
    this.lastEvalAt = -1e9;
    this.lastRotateAt = -1e9;
    this.seq = 0;
  }

  evaluate(
    now: number,
    behavior: BehaviorSignals,
    enabled: EffectId[],
    rng: RandomStream,
  ): AdaptiveResult {
    const releaseCloseEvasion = behavior.closeAttempts >= 3;

    // Throttle the heavier reasoning; the close-release flag is always fresh.
    if (now - this.lastEvalAt < 700) {
      return releaseCloseEvasion ? { ...EMPTY, releaseCloseEvasion } : EMPTY;
    }
    this.lastEvalAt = now;

    const directives: AdaptiveDirective[] = [];
    const lines: AdaptiveModelLine[] = [];
    const enabledSet = new Set(enabled);
    const line = (text: string, severity?: AdaptiveModelLine["severity"]) =>
      lines.push({ id: `m${now}-${this.seq++}`, text, severity, at: now });

    // 1. Repeatedly missing the same target → widen the imprecision field.
    if (behavior.consecutiveMissesOnSameTarget >= 2 && enabledSet.has("imprecision")) {
      directives.push({ effect: "imprecision", paramPatch: { radiusBump: 8 } });
      line("Counter-adaptation deployed", "warn");
    }

    // 2. Careful, deliberate movement → add micro-drift.
    if (behavior.carefulness > 0.72 && enabledSet.has("drift")) {
      directives.push({ effect: "drift", patch: { intensity: 0.5 } });
      line("Manual precision detected — micro-drift engaged", "warn");
    }

    // 3. User is adapting well → introduce a different effect.
    if (behavior.adaptationScore > 0.78 && now - this.lastRotateAt > 6000) {
      const candidates = this.rotation.filter((id) => !enabledSet.has(id));
      if (candidates.length > 0) {
        const next = rng.pick(candidates);
        directives.push({
          effect: next,
          patch: { enabled: true, intensity: 0.45, probability: 0.5 },
        });
        this.lastRotateAt = now;
        line("User adaptation detected", "bad");
        line("Introducing a corrective inconvenience", "warn");
      }
    }

    // 4. User disengaged (not moving) → the model notes the disagreement.
    if (behavior.idleMs > 1600) {
      line("Pointer-user disagreement: contested", "warn");
    }

    // 5. Trying hard to leave.
    if (releaseCloseEvasion) {
      line("Manual control privileges restored", "ok");
    } else if (behavior.closeAttempts > 0) {
      line("Manual control privileges under review", "bad");
    }

    return { directives, modelLines: lines, releaseCloseEvasion };
  }
}
