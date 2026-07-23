import type { CursorContext, EffectId, EffectResult } from "@cursor-distorter/shared-types";
import {
  BaseEffect,
  clamp,
  leastUsefulTarget,
  mostImportantTarget,
  rectCenter,
} from "./base";

/**
 * 6. Cursor Drift — slowly accumulates a directional offset. Patterns: a constant
 * breeze, circular drift, random walk, gravity toward the bottom-left, attraction to
 * useless UI, and repulsion from the controls you actually need. Always capped and
 * gently decaying so it can never run away.
 */
export class DriftEffect extends BaseEffect {
  readonly id: EffectId = "drift";
  readonly name = "Cursor Drift";
  readonly description = "A gentle, directional opinion about where you should be.";

  private dx = 0;
  private dy = 0;

  update(ctx: CursorContext): EffectResult {
    const pattern = this.str("pattern", "breeze");
    const rate =
      0.02 * (0.5 + 0.5 * this.globalIntensity) * (0.5 + 0.9 * this.intensity) * Math.min(ctx.dt, 40);

    let vx = 0;
    let vy = 0;
    switch (pattern) {
      case "circular": {
        const a = ctx.now / 1400;
        vx = Math.cos(a);
        vy = Math.sin(a);
        break;
      }
      case "random-walk":
        vx = ctx.rng.range(-1, 1);
        vy = ctx.rng.range(-1, 1);
        break;
      case "gravity":
        vx = -0.7;
        vy = 0.72;
        break;
      case "useful-repel": {
        const t = mostImportantTarget(ctx.targets, ctx.priorities);
        if (t) {
          const c = rectCenter(t.rect);
          vx = ctx.real.x - c.x;
          vy = ctx.real.y - c.y;
          const l = Math.hypot(vx, vy) || 1;
          vx /= l;
          vy /= l;
        }
        break;
      }
      case "useless-attract": {
        const t = leastUsefulTarget(ctx.targets);
        if (t) {
          const c = rectCenter(t.rect);
          vx = c.x - ctx.real.x;
          vy = c.y - ctx.real.y;
          const l = Math.hypot(vx, vy) || 1;
          vx /= l;
          vy /= l;
        }
        break;
      }
      case "breeze":
      default:
        vx = 0.82;
        vy = 0.2;
    }

    this.dx += vx * rate;
    this.dy += vy * rate;
    const cap = 55 * (0.4 + 0.6 * this.intensity);
    this.dx = clamp(this.dx, -cap, cap);
    this.dy = clamp(this.dy, -cap, cap);
    this.dx *= 0.992;
    this.dy *= 0.992;

    if (Math.hypot(this.dx, this.dy) < 0.2) return {};
    return { offset: { x: this.dx, y: this.dy } };
  }

  cleanup(): void {
    this.dx = 0;
    this.dy = 0;
  }
}
