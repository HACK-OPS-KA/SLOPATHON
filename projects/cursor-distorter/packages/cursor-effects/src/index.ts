import type { CursorEffect, EffectId } from "@cursor-distorter/shared-types";
import { ImprecisionEffect } from "./imprecision";
import { TripletsEffect } from "./triplets";
import { LagEffect } from "./lag";
import { OvershootEffect } from "./overshoot";
import { RepulsionEffect } from "./repulsion";
import { DriftEffect } from "./drift";
import { SensitivityEffect } from "./sensitivity";
import { FreezeEffect } from "./freezes";
import { BetrayalEffect } from "./betrayal";
import { LongWayEffect } from "./longway";
import { SocialEffect } from "./social";
import { ConfidenceEffect } from "./confidence";

export { BaseEffect } from "./base";
export * from "./imprecision";
export * from "./triplets";
export * from "./lag";
export * from "./overshoot";
export * from "./repulsion";
export * from "./drift";
export * from "./sensitivity";
export * from "./freezes";
export * from "./betrayal";
export * from "./longway";
export * from "./social";
export * from "./confidence";
export { CURSOR_MESSAGES } from "./messages";

/** Fresh instances of all twelve effects, in canonical order. */
export function createAllEffects(): CursorEffect[] {
  return [
    new ImprecisionEffect(),
    new TripletsEffect(),
    new LagEffect(),
    new OvershootEffect(),
    new RepulsionEffect(),
    new DriftEffect(),
    new SensitivityEffect(),
    new FreezeEffect(),
    new BetrayalEffect(),
    new LongWayEffect(),
    new SocialEffect(),
    new ConfidenceEffect(),
  ];
}

export type ParamKind = "range" | "select" | "toggle";

export interface ParamSpec {
  key: string;
  label: string;
  kind: ParamKind;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  options?: { value: string; label: string }[];
}

export type EffectCategory = "movement" | "click" | "visual" | "analytics";

export interface EffectInfo {
  id: EffectId;
  name: string;
  description: string;
  icon: string;
  category: EffectCategory;
  params: ParamSpec[];
}

/** Metadata that drives the Effect Mixer UI (icons, categories, extra tunables). */
export const EFFECT_CATALOG: EffectInfo[] = [
  {
    id: "imprecision",
    name: "Imprecision Field",
    description: "Redirects each click to a more innovative location nearby.",
    icon: "◎",
    category: "click",
    params: [
      { key: "radius", label: "Miss radius", kind: "range", min: 2, max: 75, step: 1, unit: "px" },
      {
        key: "distribution",
        label: "Distribution",
        kind: "select",
        options: [
          { value: "edge", label: "Edge-biased" },
          { value: "uniform", label: "Uniform" },
        ],
      },
      {
        key: "mode",
        label: "Mode",
        kind: "select",
        options: [
          { value: "plausible", label: "Plausible miss" },
          { value: "almost", label: "Almost got it" },
        ],
      },
    ],
  },
  {
    id: "triplets",
    name: "Cursor Triplets",
    description: "Three identical cursors. None of them will confess.",
    icon: "⋮",
    category: "visual",
    params: [
      { key: "count", label: "Cursors", kind: "range", min: 2, max: 3, step: 1 },
      { key: "spread", label: "Spread", kind: "range", min: 8, max: 60, step: 1, unit: "px" },
      {
        key: "formation",
        label: "Formation",
        kind: "select",
        options: [
          { value: "triangle", label: "Triangle" },
          { value: "parallel", label: "Parallel" },
          { value: "orbit", label: "Orbit" },
          { value: "diverge", label: "Diverge" },
          { value: "shell", label: "Shell game" },
        ],
      },
    ],
  },
  {
    id: "lag",
    name: "Input Lag",
    description: "The rendered cursor trails a moment behind reality.",
    icon: "↝",
    category: "movement",
    params: [
      { key: "delayMs", label: "Delay", kind: "range", min: 30, max: 600, step: 10, unit: "ms" },
      {
        key: "style",
        label: "Style",
        kind: "select",
        options: [
          { value: "smooth", label: "Smooth" },
          { value: "choppy", label: "Choppy" },
          { value: "variable", label: "Variable" },
        ],
      },
    ],
  },
  {
    id: "overshoot",
    name: "Overshoot",
    description: "Arrives past the target, then springs back.",
    icon: "⤜",
    category: "movement",
    params: [{ key: "spring", label: "Springiness", kind: "range", min: 0.05, max: 0.4, step: 0.01 }],
  },
  {
    id: "repulsion",
    name: "Button Repulsion",
    description: "Clickable targets keep a respectful distance.",
    icon: "⊘",
    category: "movement",
    params: [
      {
        key: "level",
        label: "Level",
        kind: "select",
        options: [
          { value: "barely", label: "Barely noticeable" },
          { value: "suspicious", label: "Suspicious" },
          { value: "personal-attack", label: "Personal attack" },
        ],
      },
    ],
  },
  {
    id: "drift",
    name: "Cursor Drift",
    description: "A slow, directional opinion about where you should be.",
    icon: "≈",
    category: "movement",
    params: [
      {
        key: "pattern",
        label: "Pattern",
        kind: "select",
        options: [
          { value: "breeze", label: "Constant breeze" },
          { value: "circular", label: "Circular" },
          { value: "random-walk", label: "Random walk" },
          { value: "gravity", label: "Gravity (SW)" },
          { value: "useless-attract", label: "Toward useless UI" },
          { value: "useful-repel", label: "Away from useful UI" },
        ],
      },
    ],
  },
  {
    id: "sensitivity",
    name: "Sensitivity Roulette",
    description: "Pointer sensitivity, continuously re-optimized.",
    icon: "⇅",
    category: "movement",
    params: [
      { key: "periodMs", label: "Change every", kind: "range", min: 1000, max: 6000, step: 100, unit: "ms" },
    ],
  },
  {
    id: "freezes",
    name: "Micro-Freezes",
    description: "Brief, deniable pauses. Rarely dramatic.",
    icon: "❚❚",
    category: "movement",
    params: [],
  },
  {
    id: "betrayal",
    name: "Click Betrayal",
    description: "Ignore, double, delay, shift, phantom, or swap a click.",
    icon: "✕",
    category: "click",
    params: [],
  },
  {
    id: "longway",
    name: "The Long Way Around",
    description: "Bends the path into an arc, loop, or scenic detour.",
    icon: "↺",
    category: "visual",
    params: [],
  },
  {
    id: "social",
    name: "Social Cursor",
    description: "Small speech bubbles with strong opinions.",
    icon: "❝",
    category: "visual",
    params: [
      {
        key: "voice",
        label: "Voice",
        kind: "select",
        options: [
          { value: "default", label: "Default" },
          { value: "delegator", label: "Delegator" },
          { value: "dealer", label: "Casino dealer" },
        ],
      },
    ],
  },
  {
    id: "confidence",
    name: "Cursor Confidence",
    description: "Live analytics with no basis in reality.",
    icon: "▤",
    category: "analytics",
    params: [{ key: "casino", label: "Casino readouts", kind: "toggle" }],
  },
];

export const EFFECT_INFO_BY_ID: Record<EffectId, EffectInfo> = Object.fromEntries(
  EFFECT_CATALOG.map((e) => [e.id, e]),
) as Record<EffectId, EffectInfo>;
