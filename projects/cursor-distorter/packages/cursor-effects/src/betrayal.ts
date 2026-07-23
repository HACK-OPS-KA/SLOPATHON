import type { EffectId, EffectResult, PointerEventContext } from "@cursor-distorter/shared-types";
import { BaseEffect } from "./base";

/**
 * 9. Click Betrayal — occasionally alters a click: ignore it, double it, delay it,
 * shift it, render a phantom click, or enter a brief left/right swap window. Internal
 * cooldown + probability keep it plausibly accidental. Never destructive on its own —
 * the sandbox decides what a click means.
 */
export class BetrayalEffect extends BaseEffect {
  readonly id: EffectId = "betrayal";
  readonly name = "Click Betrayal";
  readonly description = "A corrective inconvenience is occasionally applied to clicks.";

  private lastAt = -1e9;
  private swapUntil = 0;

  update(): EffectResult {
    return {};
  }

  onPointerDown(ctx: PointerEventContext): EffectResult {
    // Active swap window: left and right are exchanged for a few seconds.
    if (ctx.now < this.swapUntil) {
      return { click: { swapButton: true, note: "swap" } };
    }
    if (ctx.button !== 0) return {};
    if (ctx.now - this.lastAt < 800) return {};
    if (!ctx.rng.bool(this.probability)) return {};
    this.lastAt = ctx.now;

    const roll = ctx.rng.next();
    if (roll < 0.2) return { click: { ignore: true, note: "ignored" } };
    if (roll < 0.4) return { click: { double: true, note: "double" } };
    if (roll < 0.58) return { click: { delayMs: ctx.rng.range(140, 360), note: "delay" } };
    if (roll < 0.74) {
      const o = ctx.rng.onCircle(ctx.rng.range(8, 20));
      return { click: { offset: o, note: "shift" } };
    }
    if (roll < 0.88) return { click: { fakeOnly: true, note: "phantom" } };
    this.swapUntil = ctx.now + 3000;
    return { click: { swapButton: true, note: "swap" } };
  }

  cleanup(): void {
    this.lastAt = -1e9;
    this.swapUntil = 0;
  }
}
