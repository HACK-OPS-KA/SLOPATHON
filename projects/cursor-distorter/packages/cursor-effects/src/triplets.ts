import type {
  CursorContext,
  EffectId,
  EffectResult,
  GhostCursor,
  Vec2,
} from "@cursor-distorter/shared-types";
import { BaseEffect, clamp } from "./base";

/**
 * 2. Cursor Triplets — renders up to three identical cursors that all track the real
 * pointer with slightly different transforms. None is identifiable as the real one.
 */
export class TripletsEffect extends BaseEffect {
  readonly id: EffectId = "triplets";
  readonly name = "Cursor Triplets";
  readonly description = "Three cursors provide three times the confidence.";

  update(ctx: CursorContext): EffectResult {
    const count = Math.round(clamp(this.num("count", 3), 2, 3));
    const n = count - 1;
    if (n <= 0) return {};

    const spread =
      this.num("spread", 26) * (0.5 + 0.5 * this.globalIntensity) * (0.65 + 0.7 * this.intensity);
    const formation = this.str("formation", "triangle");
    const t = ctx.now / 1000;
    const ghosts: GhostCursor[] = [];

    for (let i = 0; i < n; i++) {
      const k = i + 1;
      let off: Vec2;
      switch (formation) {
        case "parallel":
          off = { x: spread * k * 1.1, y: k % 2 === 0 ? spread * 0.3 : -spread * 0.3 };
          break;
        case "orbit": {
          const a = t * 1.5 + (k / (n + 1)) * Math.PI * 2;
          off = { x: Math.cos(a) * spread, y: Math.sin(a) * spread };
          break;
        }
        case "diverge": {
          const g = Math.min(3.2, 1 + ctx.elapsed / 18000);
          const a = k * 2.3;
          off = { x: Math.cos(a) * spread * k * g, y: Math.sin(a) * spread * k * g };
          break;
        }
        case "shell": {
          const a = t * 2.2 + k * Math.PI;
          off = { x: Math.cos(a) * spread, y: Math.sin(a * 0.9) * spread * 0.6 };
          break;
        }
        case "triangle":
        default: {
          const a = -Math.PI / 2 + k * ((Math.PI * 2) / count);
          off = { x: Math.cos(a) * spread, y: Math.sin(a) * spread };
        }
      }
      ghosts.push({ id: `triplet-${i}`, offset: off, opacity: 1, showClick: true });
    }
    return { ghosts };
  }
}
