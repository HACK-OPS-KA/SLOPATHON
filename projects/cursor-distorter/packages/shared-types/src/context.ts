import type { Rect, Vec2 } from "./geometry";
import type { RandomStream } from "./random";

/** What the cursor can be asked to sabotage most (User Priorities). */
export type PriorityTag =
  | "work"
  | "communication"
  | "popups"
  | "calendar"
  | "files"
  | "design"
  | "spreadsheets"
  | "coding"
  | "forms"
  | "important";

/** A clickable element registered by the Safe Demo Sandbox. */
export interface ClickableTarget {
  id: string;
  rect: Rect;
  /** 0..1 — how genuinely useful the control is. High = the app wants to protect you from it. */
  importance: number;
  kind:
    | "button"
    | "checkbox"
    | "radio"
    | "link"
    | "icon"
    | "cell"
    | "slot"
    | "close"
    | "submit"
    | "danger"
    | "toggle"
    | "input";
  priorityTag?: PriorityTag;
  /** Marks the emergency / turn-off control which must always stay clickable. */
  isEscapeHatch?: boolean;
}

/** Adaptive-sabotage signals derived from recent user behavior. */
export interface BehaviorSignals {
  /** Misses within the recent window. */
  recentMisses: number;
  /** How many times in a row the same target was missed. */
  consecutiveMissesOnSameTarget: number;
  lastMissTargetId?: string;
  successfulClicks: number;
  failedClicks: number;
  /** 0..1 — high when the user moves slowly and precisely. */
  carefulness: number;
  /** ms since the pointer last meaningfully moved. */
  idleMs: number;
  /** Attempts to close the app / press the final "turn off" button. */
  closeAttempts: number;
  /** 0..1 — how well the user is adapting to the current effects. */
  adaptationScore: number;
}

/** Everything an effect needs to compute a per-frame distortion. */
export interface CursorContext {
  /** Monotonic timestamp in ms. */
  now: number;
  /** ms elapsed since the previous frame. */
  dt: number;
  /** ms since the engine started this session. */
  elapsed: number;
  /** True, un-distorted pointer position (sandbox coordinates). */
  real: Vec2;
  /** Raw pointer velocity in px/ms. */
  velocity: Vec2;
  /** Speed magnitude in px/ms. */
  speed: number;
  moving: boolean;
  /** All clickable targets currently in the sandbox. */
  targets: ClickableTarget[];
  nearestTarget?: ClickableTarget;
  /** Distance in px to the nearest target's border. */
  nearestDistance: number;
  viewport: { width: number; height: number };
  /** Global chaos intensity 0..1. */
  intensity: number;
  /** Deterministic RNG for this session. */
  rng: RandomStream;
  behavior: BehaviorSignals;
  /** Priorities the user asked to sabotage most. */
  priorities: PriorityTag[];
}

/** Context for pointer down/up events (click handling). */
export interface PointerEventContext extends CursorContext {
  /** 0 = left/primary, 2 = right/secondary. */
  button: number;
  pointerType: string;
  /** The target under the real pointer at click time, if any. */
  intendedTarget?: ClickableTarget;
}
