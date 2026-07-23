import type { EffectConfig, EffectId } from "./effects";

export type PresetId =
  | "mildly-annoying"
  | "mouse-broken"
  | "executive"
  | "group-project"
  | "casino"
  | "catastrophe";

export interface Preset {
  id: PresetId;
  name: string;
  tagline: string;
  description: string;
  /** Global intensity 0..1 the preset starts at. */
  intensity: number;
  /** When true, the preset auto-escalates over time (Live Demo Catastrophe). */
  escalating?: boolean;
  /** Per-effect overrides applied on top of the default effect config. */
  effects: Partial<Record<EffectId, Partial<EffectConfig>>>;
}

/** One step of an escalation timeline (Live Demo Catastrophe / demo mode). */
export interface EscalationStage {
  /** Seconds from escalation start at which this stage begins. */
  at: number;
  label: string;
  /** Human-facing analytics blurb shown when the stage triggers. */
  note?: string;
  /** Intensity to ramp to at this stage. */
  intensity?: number;
  /** Effect config overrides to merge in when this stage begins. */
  effects?: Partial<Record<EffectId, Partial<EffectConfig>>>;
}
