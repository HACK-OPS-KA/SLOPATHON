import type { CursorContext, EffectId, EffectResult, Vec2 } from "@cursor-distorter/shared-types";
import { BaseEffect, clamp01, rectCenter } from "./base";

/**
 * 5. Button Repulsion — as the cursor approaches a clickable target, the target itself
 * edges away. Three levels (barely / suspicious / personal-attack). The target always
 * remains reachable, and the escape hatch is never repelled.
 */
export class RepulsionEffect extends BaseEffect {
  readonly id: EffectId = "repulsion";
  readonly name = "Button Repulsion";
  readonly description = "Clickable targets maintain a respectful distance.";

  update(ctx: CursorContext): EffectResult {
    const t = ctx.nearestTarget;
    if (!t || t.isEscapeHatch) return {};

    const prox = clamp01(1 - ctx.nearestDistance / 100);
    if (prox <= 0) return {};

    const level = this.str("level", "suspicious");
    const base = level === "barely" ? 3 : level === "personal-attack" ? 15 : 8;
    const priorityBoost =
      t.priorityTag && ctx.priorities.includes(t.priorityTag) ? 1.5 : 1;
    const amount =
      base * (0.5 + 0.5 * this.globalIntensity) * (0.6 + 0.8 * this.intensity) * prox * priorityBoost;

    const center = rectCenter(t.rect);
    const dx = center.x - ctx.real.x;
    const dy = center.y - ctx.real.y;
    const len = Math.hypot(dx, dy) || 1;
    // Desired displacement of the target, directed away from the cursor.
    const delta: Vec2 = { x: (dx / len) * amount, y: (dy / len) * amount };
    return { targetNudges: [{ targetId: t.id, delta }] };
  }
}
