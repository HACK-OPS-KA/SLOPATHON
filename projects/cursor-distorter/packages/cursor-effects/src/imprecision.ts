import type {
  EffectId,
  EffectResult,
  PointerEventContext,
  Rect,
  Vec2,
} from "@cursor-distorter/shared-types";
import { rectCenter } from "@cursor-distorter/shared-types";
import { BaseEffect, clamp } from "./base";

/**
 * 1. Imprecision Field — redirects the effective click to a point near the intended
 * one. Supports uniform/edge distributions, a "plausible miss" into empty space, and
 * an "almost got it" mode that lands just outside the target.
 */
export class ImprecisionEffect extends BaseEffect {
  readonly id: EffectId = "imprecision";
  readonly name = "Imprecision Field";
  readonly description = "Your click is redirected to a more innovative location.";

  update(): EffectResult {
    return {};
  }

  onPointerDown(ctx: PointerEventContext): EffectResult {
    if (ctx.button !== 0) return {};
    if (!ctx.rng.bool(this.probability)) return {};

    const radius =
      clamp(this.num("radius", 24) + this.num("radiusBump", 0), 2, 75) *
      (0.5 + 0.5 * this.globalIntensity);
    const mode = this.str("mode", "plausible");
    const distribution = this.str("distribution", "edge");

    let offset: Vec2;
    if (mode === "almost" && ctx.intendedTarget) {
      offset = justOutside(ctx.real, ctx.intendedTarget.rect, radius, ctx.rng);
    } else {
      const mag =
        distribution === "edge"
          ? radius * ctx.rng.range(0.72, 1)
          : radius * Math.sqrt(ctx.rng.next());
      const angle = ctx.rng.next() * Math.PI * 2;
      offset = { x: Math.cos(angle) * mag, y: Math.sin(angle) * mag };
    }
    return { click: { offset, note: "imprecision" } };
  }
}

function justOutside(
  real: Vec2,
  rect: Rect,
  radius: number,
  rng: PointerEventContext["rng"],
): Vec2 {
  const center = rectCenter(rect);
  let dx = real.x - center.x;
  let dy = real.y - center.y;
  if (Math.abs(dx) < 1 && Math.abs(dy) < 1) {
    dx = rng.range(-1, 1);
    dy = rng.range(-1, 1);
  }
  const len = Math.hypot(dx, dy) || 1;
  const push = radius * rng.range(0.4, 0.9) + 6;
  return { x: (dx / len) * push, y: (dy / len) * push };
}
