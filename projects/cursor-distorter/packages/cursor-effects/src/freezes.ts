import type { CursorContext, EffectId, EffectResult } from "@cursor-distorter/shared-types";
import { BaseEffect } from "./base";

/**
 * 8. Micro-Freezes — brief, deniable pauses (80-450ms), with a rare "dramatic pause"
 * of up to 900ms. The engine offers an opportunity on a schedule; the effect rolls to
 * fire. The freeze duration is handled by the renderer holding the cursor still.
 */
export class FreezeEffect extends BaseEffect {
  readonly id: EffectId = "freezes";
  readonly name = "Micro-Freezes";
  readonly description = "Occasional, brief, entirely deniable pauses.";

  update(ctx: CursorContext): EffectResult {
    if (!ctx.rng.bool(this.probability)) return {};
    const dramatic = ctx.rng.bool(0.08);
    const ms =
      (dramatic ? ctx.rng.range(500, 900) : ctx.rng.range(80, 450)) * (0.6 + 0.7 * this.intensity);
    return { freezeMs: ms, note: dramatic ? "dramatic-pause" : "micro-freeze" };
  }
}
