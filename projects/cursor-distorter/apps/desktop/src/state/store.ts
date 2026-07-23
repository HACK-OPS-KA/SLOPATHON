import { create } from "zustand";
import {
  ChaosEngine,
  PRESETS,
  cloneDefaultConfig,
  type AdaptiveModelLine,
} from "@cursor-distorter/chaos-engine";
import { createAllEffects } from "@cursor-distorter/cursor-effects";
import {
  emptySessionStats,
  type ConfidenceReadout,
  type EffectConfig,
  type EffectId,
  type IndicatorState,
  type InconvenienceTolerance,
  type OnboardingGoal,
  type OperatingMode,
  type PresetId,
  type PriorityTag,
  type SessionStats,
  type SystemModeStatus,
} from "@cursor-distorter/shared-types";

export type Screen = "onboarding" | "dashboard" | "demo";

/** Maps the onboarding tolerance to a starting chaos intensity. */
const TOLERANCE_INTENSITY: Record<InconvenienceTolerance, number> = {
  barely: 0.22,
  destabilizing: 0.45,
  irritating: 0.7,
  reality: 0.95,
};

function createEngine(): ChaosEngine {
  const engine = new ChaosEngine({ seed: "cursor-distorter", effects: createAllEffects() });
  return engine;
}

const bridge = typeof window !== "undefined" ? window.cursorDistorter : undefined;

function initialSystemStatus(): SystemModeStatus {
  return {
    available: !!bridge?.isElectron,
    active: false,
    accessibilityGranted: false,
    helperConnected: false,
    reason: bridge?.isElectron
      ? "System Distortion Mode is available but not active."
      : "Running in the browser — Safe Demo Sandbox only.",
  };
}

export interface PointerSample {
  /** Real and rendered pointer positions, normalized 0..1 within the sandbox. */
  real: { x: number; y: number };
  render: { x: number; y: number };
}

export interface LiveSnapshot {
  stats: SessionStats;
  confidence: ConfidenceReadout[];
  modelLines: AdaptiveModelLine[];
  activeContributors: EffectId[];
  remainingMs: number;
  closeEvasionReleased: boolean;
  sample: PointerSample | null;
}

interface CDState {
  engine: ChaosEngine;
  screen: Screen;

  onboarding: {
    step: number;
    goal?: OnboardingGoal;
    tolerance?: InconvenienceTolerance;
    mode?: OperatingMode;
  };

  active: boolean;
  presetId: PresetId | null;
  intensity: number;
  effects: Record<EffectId, EffectConfig>;
  priorities: PriorityTag[];
  operatingMode: OperatingMode;
  soundOn: boolean;
  maxSessionMinutes: number;

  stats: SessionStats;
  confidence: ConfidenceReadout[];
  modelLines: AdaptiveModelLine[];
  activeContributors: EffectId[];
  remainingMs: number;
  closeEvasionReleased: boolean;
  sample: PointerSample | null;
  systemStatus: SystemModeStatus;

  // actions
  setScreen: (s: Screen) => void;
  setOnboarding: (patch: Partial<CDState["onboarding"]>) => void;
  completeOnboarding: () => void;
  applyPreset: (id: PresetId) => void;
  toggleEffect: (id: EffectId) => void;
  setEffectConfig: (id: EffectId, patch: Partial<EffectConfig>) => void;
  setIntensity: (v: number) => void;
  setActive: (v: boolean) => void;
  arm: () => void;
  panic: () => void;
  setPriorities: (tags: PriorityTag[]) => void;
  togglePriority: (tag: PriorityTag) => void;
  setSound: (on: boolean) => void;
  setOperatingMode: (m: OperatingMode) => void;
  setMaxSessionMinutes: (m: number) => void;
  resetSession: (seed?: number | string) => void;
  syncLive: (snap: LiveSnapshot) => void;
  setSystemStatus: (s: SystemModeStatus) => void;
  syncEffectsFromEngine: () => void;
}

function indicatorFor(active: boolean, mode: OperatingMode): IndicatorState {
  if (!active) return "off";
  return mode === "system" ? "system" : "sandbox";
}

export const useStore = create<CDState>((set, get) => {
  const engine = createEngine();

  const pushIndicator = (active: boolean, mode: OperatingMode) => {
    bridge?.setActive(active);
    bridge?.setIndicator(indicatorFor(active, mode));
  };

  return {
    engine,
    screen: "onboarding",
    onboarding: { step: 0 },

    active: false,
    presetId: null,
    intensity: 0.4,
    effects: cloneDefaultConfig(),
    priorities: [],
    operatingMode: "sandbox",
    soundOn: false,
    maxSessionMinutes: 10,

    stats: emptySessionStats(),
    confidence: [],
    modelLines: [],
    activeContributors: [],
    remainingMs: 10 * 60 * 1000,
    closeEvasionReleased: false,
    sample: null,
    systemStatus: initialSystemStatus(),

    setScreen: (screen) => set({ screen }),

    setOnboarding: (patch) =>
      set((s) => ({ onboarding: { ...s.onboarding, ...patch } })),

    completeOnboarding: () => {
      const { onboarding, engine: e } = get();
      const intensity = onboarding.tolerance
        ? TOLERANCE_INTENSITY[onboarding.tolerance]
        : 0.4;
      e.setIntensity(intensity);
      e.setMaxSessionMs(get().maxSessionMinutes * 60 * 1000);
      set({
        intensity,
        operatingMode: onboarding.mode ?? "sandbox",
        screen: "dashboard",
      });
    },

    applyPreset: (id) => {
      const e = get().engine;
      e.applyPreset(PRESETS[id]);
      set({
        presetId: id,
        intensity: e.getIntensity(),
        effects: structuredCloneConfig(e.getAllConfig()),
      });
    },

    toggleEffect: (id) => {
      const e = get().engine;
      const next = !e.getConfig(id).enabled;
      e.applyConfig(id, { enabled: next });
      set((s) => ({
        effects: { ...s.effects, [id]: { ...s.effects[id], enabled: next } },
        presetId: null,
      }));
    },

    setEffectConfig: (id, patch) => {
      const e = get().engine;
      e.applyConfig(id, patch);
      set((s) => ({
        effects: { ...s.effects, [id]: e.getConfig(id) },
        presetId: null,
      }));
    },

    setIntensity: (v) => {
      get().engine.setIntensity(v);
      set({ intensity: v });
    },

    setActive: (v) => {
      const { engine: e, operatingMode } = get();
      e.setActive(v);
      if (v && e.isPanicked()) e.resume();
      pushIndicator(v, operatingMode);
      set({ active: v });
    },

    arm: () => get().setActive(true),

    panic: () => {
      const e = get().engine;
      e.panic();
      pushIndicator(false, get().operatingMode);
      set({ active: false });
    },

    setPriorities: (tags) => {
      get().engine.setPriorities(tags);
      set({ priorities: tags });
    },

    togglePriority: (tag) => {
      const cur = get().priorities;
      const next = cur.includes(tag) ? cur.filter((t) => t !== tag) : [...cur, tag];
      get().engine.setPriorities(next);
      set({ priorities: next });
    },

    setSound: (on) => set({ soundOn: on }),

    setOperatingMode: (m) => {
      set({ operatingMode: m });
      if (get().active) pushIndicator(true, m);
    },

    setMaxSessionMinutes: (m) => {
      const clamped = Math.max(1, Math.min(60, m));
      get().engine.setMaxSessionMs(clamped * 60 * 1000);
      set({ maxSessionMinutes: clamped });
    },

    resetSession: (seed) => {
      const e = get().engine;
      e.reset(seed);
      e.setMaxSessionMs(get().maxSessionMinutes * 60 * 1000);
      e.setIntensity(get().intensity);
      e.setPriorities(get().priorities);
      pushIndicator(false, get().operatingMode);
      set({
        active: false,
        stats: emptySessionStats(),
        confidence: [],
        modelLines: [],
        activeContributors: [],
        closeEvasionReleased: false,
      });
    },

    syncLive: (snap) =>
      set({
        stats: snap.stats,
        confidence: snap.confidence,
        modelLines: snap.modelLines,
        activeContributors: snap.activeContributors,
        remainingMs: snap.remainingMs,
        closeEvasionReleased: snap.closeEvasionReleased,
        sample: snap.sample,
      }),

    setSystemStatus: (systemStatus) => set({ systemStatus }),

    syncEffectsFromEngine: () =>
      set({ effects: structuredCloneConfig(get().engine.getAllConfig()) }),
  };
});

function structuredCloneConfig(
  cfg: Record<EffectId, EffectConfig>,
): Record<EffectId, EffectConfig> {
  const out = {} as Record<EffectId, EffectConfig>;
  for (const k of Object.keys(cfg) as EffectId[]) {
    const c = cfg[k];
    out[k] = {
      ...c,
      triggers: c.triggers ? { ...c.triggers } : undefined,
      params: c.params ? { ...c.params } : undefined,
    };
  }
  return out;
}
