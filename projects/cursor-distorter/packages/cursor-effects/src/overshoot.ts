import type { CursorContext, EffectId, EffectResult } from "@cursor-distorter/shared-types";
import { BaseEffect } from "./base";

/**
 * 4. Overshoot — on fast movement the rendered cursor is thrown slightly past the
 * pointer, then springs back. Runs every frame so the spring can settle.
 */
export class OvershootEffect extends BaseEffect {
  readonly id: EffectId = "overshoot";
  readonly name = "Overshoot";
  readonly description = "The cursor arrives, reconsiders, and corrects.";

  private ox = 0;
  private oy = 0;

  update(ctx: CursorContext): EffectResult {
    const strength = (0.5 + 0.5 * this.globalIntensity) * this.intensity;
    const damp = 1 - (0.16 + this.num("spring", 0.14) * 0.7); // spring-back per frame

    // Inject an impulse in the direction of motion on fast frames.
    if (ctx.speed > 0.7 && ctx.rng.bool(this.probability * 0.55)) {
      const inv = 1 / (ctx.speed || 1);
      this.ox += ctx.velocity.x * inv * 30 * strength;
      this.oy += ctx.velocity.y * inv * 30 * strength;
    }

    this.ox *= damp;
    this.oy *= damp;

    if (Math.hypot(this.ox, this.oy) < 0.3) {
      this.ox = 0;
      this.oy = 0;
      return {};
    }
    return { offset: { x: this.ox, y: this.oy } };
  }

  cleanup(): void {
    this.ox = 0;
    this.oy = 0;
  }
}
