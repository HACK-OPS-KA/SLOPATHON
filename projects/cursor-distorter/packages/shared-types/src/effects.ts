import type { Vec2 } from "./geometry";
import type { CursorContext, PointerEventContext } from "./context";

/** Stable identifiers for the twelve core distortion modules. */
export type EffectId =
  | "imprecision"
  | "triplets"
  | "lag"
  | "overshoot"
  | "repulsion"
  | "drift"
  | "sensitivity"
  | "freezes"
  | "betrayal"
  | "longway"
  | "social"
  | "confidence";

export const ALL_EFFECT_IDS: EffectId[] = [
  "imprecision",
  "triplets",
  "lag",
  "overshoot",
  "repulsion",
  "drift",
  "sensitivity",
  "freezes",
  "betrayal",
  "longway",
  "social",
  "confidence",
];

/** An additional rendered cursor with a transform relative to the primary cursor. */
export interface GhostCursor {
  id: string;
  offset: Vec2;
  rotation?: number;
  opacity?: number;
  scale?: number;
  /** When true the ghost mirrors click animations. */
  showClick?: boolean;
  hue?: number;
}

export type MessageTone = "passive-aggressive" | "helpful" | "ominous" | "analytics";

/** A small speech bubble shown beside a cursor (Social Cursor). */
export interface CursorMessage {
  id: string;
  text: string;
  tone?: MessageTone;
  ttlMs?: number;
  /** Which rendered cursor the bubble attaches to (index; 0 = primary). */
  anchor?: number;
}

/** A fake confidence/analytics readout (Cursor Confidence). */
export interface ConfidenceReadout {
  id: string;
  label: string;
  value: string;
  trend?: "up" | "down" | "flat";
  severity?: "ok" | "warn" | "bad";
}

/** Visual bending of the rendered cursor path (The Long Way Around). */
export interface PathBend {
  shape: "arc" | "sine" | "spiral" | "loop" | "detour";
  /** Peak lateral displacement in px. */
  amplitude: number;
  phase: number;
}

/** A request to nudge a specific target element (Button Repulsion). */
export interface TargetNudge {
  targetId: string;
  delta: Vec2;
}

/** How a click should be betrayed. Composed by the engine on pointer down/up. */
export interface ClickTransform {
  /** Redirect the effective click by this offset (px). */
  offset?: Vec2;
  /** Drop the click entirely. */
  ignore?: boolean;
  /** Turn a single click into a (slightly separated) double click. */
  double?: boolean;
  /** Delay dispatch by this many ms. */
  delayMs?: number;
  /** Swap primary/secondary button for this click. */
  swapButton?: boolean;
  /** Render a click animation but dispatch nothing real. */
  fakeOnly?: boolean;
  note?: string;
}

/**
 * The contribution a single effect makes. All fields optional; the engine composes
 * results across enabled effects into a `FrameDistortion` (or a `ClickTransform`).
 */
export interface EffectResult {
  /** Positional offset added to the rendered primary cursor (px). */
  offset?: Vec2;
  /** Smoothing factor 0..1 for movement toward the target (1 = instant, lower = laggier). */
  smoothing?: number;
  /** Multiplier on effective pointer sensitivity (Sensitivity Roulette). */
  sensitivity?: number;
  /** Freeze the rendered cursor for this many ms (Micro-Freezes). */
  freezeMs?: number;
  ghosts?: GhostCursor[];
  message?: CursorMessage | null;
  spinner?: boolean;
  pathBend?: PathBend | null;
  confidence?: ConfidenceReadout[];
  targetNudges?: TargetNudge[];
  /** Click behavior (only meaningful from onPointerDown/onPointerUp). */
  click?: ClickTransform;
  note?: string;
}

export const EMPTY_RESULT: EffectResult = Object.freeze({});

/** The common interface every distortion module implements. */
export interface CursorEffect {
  readonly id: EffectId;
  readonly name: string;
  readonly description: string;
  enabled: boolean;
  /** 0..1 */
  intensity: number;
  /** 0..1 */
  probability: number;
  update(context: CursorContext): EffectResult;
  onPointerMove?(event: PointerEventContext): EffectResult;
  onPointerDown?(event: PointerEventContext): EffectResult;
  onPointerUp?(event: PointerEventContext): EffectResult;
  cleanup(): void;
}

/** Per-effect trigger conditions evaluated by the engine before running an effect. */
export interface TriggerConfig {
  onSpeedAbove?: number;
  onSpeedBelow?: number;
  onProximityBelow?: number;
  afterClick?: boolean;
  afterFailedClicks?: number;
  afterElapsedMs?: number;
  scheduleEveryMs?: number;
}

/** Serializable configuration for one effect. */
export interface EffectConfig {
  enabled: boolean;
  intensity: number;
  probability: number;
  cooldownMs?: number;
  triggers?: TriggerConfig;
  params?: Record<string, number | string | boolean>;
}

/** The composed, ready-to-render distortion for a single frame. */
export interface FrameDistortion {
  primaryOffset: Vec2;
  smoothing: number;
  sensitivity: number;
  /** Timestamp (ms) until which the rendered cursor is frozen. */
  freezeUntil: number;
  ghosts: GhostCursor[];
  message: CursorMessage | null;
  spinner: boolean;
  pathBend: PathBend | null;
  confidence: ConfidenceReadout[];
  /** targetId -> accumulated nudge offset. */
  targetNudges: Record<string, Vec2>;
  /** Effect ids that contributed this frame (for the analytics/debug view). */
  activeContributors: EffectId[];
}
