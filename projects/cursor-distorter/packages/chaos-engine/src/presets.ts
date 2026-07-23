import type {
  EffectConfig,
  EffectId,
  Preset,
  PresetId,
} from "@cursor-distorter/shared-types";
import { ALL_EFFECT_IDS } from "@cursor-distorter/shared-types";

/** Baseline configuration for every effect (all disabled until a preset turns them on). */
export const DEFAULT_EFFECT_CONFIG: Record<EffectId, EffectConfig> = {
  imprecision: {
    enabled: false,
    intensity: 0.35,
    probability: 0.65,
    params: { radius: 24, distribution: "edge", mode: "plausible", radiusBump: 0 },
  },
  triplets: {
    enabled: false,
    intensity: 0.5,
    probability: 1,
    params: { formation: "triangle", spread: 26, count: 3 },
  },
  lag: {
    enabled: false,
    intensity: 0.4,
    probability: 1,
    params: { delayMs: 130, style: "smooth" },
  },
  overshoot: {
    // Runs every frame so the spring can settle; it injects impulse on fast frames itself.
    enabled: false,
    intensity: 0.5,
    probability: 0.7,
    params: { spring: 0.14 },
  },
  repulsion: {
    enabled: false,
    intensity: 0.45,
    probability: 1,
    triggers: { onProximityBelow: 100 },
    params: { level: "suspicious" },
  },
  drift: {
    enabled: false,
    intensity: 0.3,
    probability: 1,
    params: { pattern: "breeze" },
  },
  sensitivity: {
    // Self-times its changes and applies the multiplier every frame.
    enabled: false,
    intensity: 0.4,
    probability: 1,
  },
  freezes: {
    // Engine schedules an opportunity roughly every 1.3s; the effect rolls to fire.
    enabled: false,
    intensity: 0.4,
    probability: 0.55,
    triggers: { scheduleEveryMs: 1300 },
  },
  betrayal: {
    // Discrete click alteration; probability + cooldown handled inside the effect.
    enabled: false,
    intensity: 0.5,
    probability: 0.18,
  },
  longway: {
    enabled: false,
    intensity: 0.5,
    probability: 0.5,
    triggers: { onSpeedAbove: 0.45 },
  },
  social: {
    // Self-times speech bubbles.
    enabled: false,
    intensity: 0.6,
    probability: 0.75,
  },
  confidence: {
    // Self-times its analytics readouts; renderer persists the last set.
    enabled: false,
    intensity: 0.6,
    probability: 1,
  },
};

export function cloneDefaultConfig(): Record<EffectId, EffectConfig> {
  const out = {} as Record<EffectId, EffectConfig>;
  for (const id of ALL_EFFECT_IDS) {
    const base = DEFAULT_EFFECT_CONFIG[id];
    out[id] = {
      ...base,
      triggers: base.triggers ? { ...base.triggers } : undefined,
      params: base.params ? { ...base.params } : undefined,
    };
  }
  return out;
}

/** Merge a partial config on top of an existing one (params/triggers merged, not replaced). */
export function mergeEffectConfig(
  base: EffectConfig,
  patch: Partial<EffectConfig>,
): EffectConfig {
  return {
    ...base,
    ...patch,
    triggers: patch.triggers ? { ...base.triggers, ...patch.triggers } : base.triggers,
    params: patch.params ? { ...base.params, ...patch.params } : base.params,
  };
}

export const PRESETS: Record<PresetId, Preset> = {
  "mildly-annoying": {
    id: "mildly-annoying",
    name: "Mildly Annoying",
    tagline: "You'll blame yourself first.",
    description:
      "Small click offsets, a light breeze of drift, the occasional micro-freeze, and just enough lag to seem plausible.",
    intensity: 0.3,
    effects: {
      imprecision: { enabled: true, intensity: 0.3, probability: 0.55, params: { radius: 18 } },
      drift: { enabled: true, intensity: 0.25, params: { pattern: "breeze" } },
      freezes: { enabled: true, intensity: 0.35, probability: 0.09 },
      lag: { enabled: true, intensity: 0.28, params: { delayMs: 90, style: "smooth" } },
    },
  },
  "mouse-broken": {
    id: "mouse-broken",
    name: "Is My Mouse Broken?",
    tagline: "Technically, no.",
    description:
      "Triplet cursors, roulette sensitivity, spring-loaded overshoot, and phantom clicks. The hardware is fine. Probably.",
    intensity: 0.55,
    effects: {
      triplets: { enabled: true, intensity: 0.55, params: { formation: "triangle", count: 3 } },
      sensitivity: { enabled: true, intensity: 0.5 },
      overshoot: { enabled: true, intensity: 0.6 },
      betrayal: { enabled: true, intensity: 0.5, probability: 0.2, params: { fakeBias: 0.6 } },
    },
  },
  executive: {
    id: "executive",
    name: "Executive Productivity",
    tagline: "Optimized for everything except the task.",
    description:
      "The cursor avoids useful controls, gravitates toward settings and notifications, takes the scenic route, and reports rich confidence analytics.",
    intensity: 0.55,
    effects: {
      repulsion: { enabled: true, intensity: 0.55, params: { level: "personal-attack" } },
      drift: { enabled: true, intensity: 0.4, params: { pattern: "useful-repel" } },
      longway: { enabled: true, intensity: 0.6 },
      confidence: { enabled: true, intensity: 0.7 },
    },
  },
  "group-project": {
    id: "group-project",
    name: "Group Project",
    tagline: "Someone else can handle this.",
    description:
      "The cursor pauses before doing work, hurries toward useless actions, abandons drag-and-drop, and delegates responsibility.",
    intensity: 0.5,
    effects: {
      freezes: { enabled: true, intensity: 0.6, probability: 0.16 },
      drift: { enabled: true, intensity: 0.4, params: { pattern: "useful-repel" } },
      betrayal: { enabled: true, intensity: 0.5, probability: 0.2, params: { abandonDrag: true } },
      social: { enabled: true, intensity: 0.7, params: { voice: "delegator" } },
    },
  },
  casino: {
    id: "casino",
    name: "Casino Mode",
    tagline: "Every click is a rare win.",
    description:
      "Each click shows a probability meter, a fake streak counter, and celebratory sound. No money changes hands. The house still wins.",
    intensity: 0.5,
    effects: {
      betrayal: { enabled: true, intensity: 0.5, probability: 0.28, params: { casino: true } },
      social: { enabled: true, intensity: 0.6, params: { voice: "dealer" } },
      confidence: { enabled: true, intensity: 0.6, params: { casino: true } },
      imprecision: { enabled: true, intensity: 0.3, probability: 0.4, params: { radius: 16 } },
    },
  },
  catastrophe: {
    id: "catastrophe",
    name: "Live Demo Catastrophe",
    tagline: "Starts subtle. Does not stay subtle.",
    description:
      "Begins with the faintest inaccuracy and automatically escalates over three minutes until the cursor council convenes.",
    intensity: 0.15,
    escalating: true,
    effects: {
      imprecision: { enabled: true, intensity: 0.2, probability: 0.4, params: { radius: 14 } },
    },
  },
};

export const PRESET_ORDER: PresetId[] = [
  "mildly-annoying",
  "mouse-broken",
  "executive",
  "group-project",
  "casino",
  "catastrophe",
];

export function getPreset(id: PresetId): Preset {
  return PRESETS[id];
}

export function listPresets(): Preset[] {
  return PRESET_ORDER.map((id) => PRESETS[id]);
}
