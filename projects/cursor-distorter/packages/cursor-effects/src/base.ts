import type {
  ClickableTarget,
  CursorContext,
  EffectConfig,
  EffectId,
  EffectResult,
  PriorityTag,
} from "@cursor-distorter/shared-types";
import { rectCenter } from "@cursor-distorter/shared-types";
import type { ConfigurableEffect } from "@cursor-distorter/chaos-engine";

export const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
export const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

/**
 * Shared implementation for every distortion module: stores config, exposes typed
 * parameter accessors, and derives an effective magnitude that blends per-effect
 * intensity with the global chaos intensity.
 */
export abstract class BaseEffect implements ConfigurableEffect {
  abstract readonly id: EffectId;
  abstract readonly name: string;
  abstract readonly description: string;

  enabled = false;
  intensity = 0.5;
  probability = 1;

  protected globalIntensity = 0.4;
  protected params: Record<string, number | string | boolean> = {};

  configure(config: EffectConfig, globalIntensity: number): void {
    this.enabled = config.enabled;
    this.intensity = config.intensity;
    this.probability = config.probability;
    this.globalIntensity = globalIntensity;
    this.params = { ...(config.params ?? {}) };
  }

  /** Blended magnitude in [0, 1]: per-effect intensity scaled by global intensity. */
  protected eff(): number {
    return clamp01(this.intensity * (0.5 + 0.5 * this.globalIntensity));
  }

  protected num(key: string, def: number): number {
    const v = this.params[key];
    return typeof v === "number" ? v : def;
  }

  protected str(key: string, def: string): string {
    const v = this.params[key];
    return typeof v === "string" ? v : def;
  }

  protected boolp(key: string, def: boolean): boolean {
    const v = this.params[key];
    return typeof v === "boolean" ? v : def;
  }

  abstract update(context: CursorContext): EffectResult;

  cleanup(): void {
    /* effects with internal state override this */
  }
}

/** Prefer targets the user asked to sabotage most; fall back to importance. */
export function mostImportantTarget(
  targets: ClickableTarget[],
  priorities: PriorityTag[],
): ClickableTarget | undefined {
  if (targets.length === 0) return undefined;
  const prioritySet = new Set(priorities);
  let best: ClickableTarget | undefined;
  let bestScore = -Infinity;
  for (const t of targets) {
    if (t.isEscapeHatch) continue;
    const score = t.importance + (t.priorityTag && prioritySet.has(t.priorityTag) ? 1 : 0);
    if (score > bestScore) {
      bestScore = score;
      best = t;
    }
  }
  return best;
}

export function leastUsefulTarget(targets: ClickableTarget[]): ClickableTarget | undefined {
  let best: ClickableTarget | undefined;
  let bestScore = Infinity;
  for (const t of targets) {
    if (t.importance < bestScore) {
      bestScore = t.importance;
      best = t;
    }
  }
  return best;
}

export { rectCenter };
