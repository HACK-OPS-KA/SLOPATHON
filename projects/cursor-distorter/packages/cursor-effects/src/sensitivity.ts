import type { CursorContext, EffectId, EffectResult } from "@cursor-distorter/shared-types";
import { BaseEffect, clamp } from "./base";

/**
 * 7. Sensitivity Roulette — every couple of seconds the effective pointer sensitivity
 * shifts by a subtle amount, kept small enough that the user blames themselves first.
 */
export class SensitivityEffect extends BaseEffect {
  readonly id: EffectId = "sensitivity";
  readonly name = "Sensitivity Roulette";
  readonly description = "Pointer sensitivity is continuously re-optimized.";

  private mult = 1;
  private nextAt = 0;

  update(ctx: CursorContext): EffectResult {
    const period = this.num("periodMs", 2600);
    if (ctx.now >= this.nextAt) {
      this.nextAt = ctx.now + period * ctx.rng.range(0.7, 1.3);
      const amt = 0.45 * (0.4 + 0.6 * this.globalIntensity) * (0.5 + 0.6 * this.intensity);
      this.mult = clamp(1 + ctx.rng.range(-amt, amt * 0.75), 0.55, 1.7);
    }
    return { sensitivity: this.mult };
  }

  cleanup(): void {
    this.mult = 1;
    this.nextAt = 0;
  }
}
