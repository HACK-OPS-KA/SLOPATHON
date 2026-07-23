import type { CursorContext, EffectId, EffectResult } from "@cursor-distorter/shared-types";
import { BaseEffect } from "./base";
import { CURSOR_MESSAGES } from "./messages";

/**
 * 11. Social Cursor — the cursor develops a personality and occasionally comments in a
 * small speech bubble beside one of the rendered cursors. Voices: default, delegator
 * (Group Project), dealer (Casino).
 */
export class SocialEffect extends BaseEffect {
  readonly id: EffectId = "social";
  readonly name = "Social Cursor";
  readonly description = "Your cursor has developed opinions and boundaries.";

  private nextAt = 0;

  update(ctx: CursorContext): EffectResult {
    if (ctx.now < this.nextAt) return {};
    const gap = ctx.rng.range(3500, 7000) * (1.4 - this.intensity * 0.6);
    this.nextAt = ctx.now + gap;
    if (!ctx.rng.bool(this.probability)) return {};

    const voice = this.str("voice", "default");
    const pool = CURSOR_MESSAGES[voice] ?? CURSOR_MESSAGES.default!;
    const text = ctx.rng.pick(pool);
    const anchor = ctx.rng.int(0, 2);
    return {
      message: { id: `s${Math.floor(ctx.now)}`, text, tone: "passive-aggressive", ttlMs: 2600, anchor },
    };
  }

  cleanup(): void {
    this.nextAt = 0;
  }
}
