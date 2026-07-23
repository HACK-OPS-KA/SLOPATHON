import type {
  CursorContext,
  EffectId,
  EffectResult,
  PathBend,
} from "@cursor-distorter/shared-types";
import { BaseEffect } from "./base";

const SHAPES: PathBend["shape"][] = ["arc", "sine", "spiral", "loop", "detour"];

/**
 * 10. The Long Way Around — when the user heads toward a target, the rendered cursor
 * path is bent into an arc, sine, spiral, one unnecessary loop, or a small detour. The
 * shape is stable for a gesture, then changes. Purely visual (the renderer curves the
 * path); only active while moving.
 */
export class LongWayEffect extends BaseEffect {
  readonly id: EffectId = "longway";
  readonly name = "The Long Way Around";
  readonly description = "A more scenic route to the same destination.";

  private shape: PathBend["shape"] = "arc";
  private nextShapeAt = 0;
  private phase = 0;

  update(ctx: CursorContext): EffectResult {
    if (!ctx.nearestTarget) return {};
    if (ctx.now >= this.nextShapeAt) {
      this.shape = ctx.rng.pick(SHAPES);
      this.nextShapeAt = ctx.now + ctx.rng.range(1200, 2600);
      this.phase = ctx.rng.range(0, Math.PI * 2);
    }
    const amplitude = (8 + 26 * this.intensity) * (0.5 + 0.5 * this.globalIntensity);
    return { pathBend: { shape: this.shape, amplitude, phase: this.phase } };
  }

  cleanup(): void {
    this.nextShapeAt = 0;
  }
}
