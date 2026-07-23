import type { CursorContext, EffectId, EffectResult } from "@cursor-distorter/shared-types";
import { BaseEffect, clamp } from "./base";

/**
 * 3. Input Lag — reports a smoothing factor (0..1) the renderer uses to trail the
 * rendered cursor behind the real pointer. Supports smooth/choppy/variable styles and
 * lag that intensifies near important buttons.
 */
export class LagEffect extends BaseEffect {
  readonly id: EffectId = "lag";
  readonly name = "Input Lag";
  readonly description = "Manual pointer control is, briefly, a legacy workflow.";

  update(ctx: CursorContext): EffectResult {
    let delay =
      this.num("delayMs", 130) * (0.5 + 0.5 * this.globalIntensity) * (0.6 + 0.9 * this.intensity);
    const style = this.str("style", "smooth");

    if (ctx.nearestDistance < 90) delay *= 1.5; // lag that increases near important buttons
    if (style === "variable") {
      delay *= 0.6 + 0.8 * (0.5 + 0.5 * Math.sin(ctx.now / 700));
    }

    let smoothing = clamp(120 / (120 + delay), 0.05, 1);
    if (style === "choppy" && ctx.rng.bool(0.12)) smoothing = 1; // occasional snap

    return { smoothing };
  }
}
