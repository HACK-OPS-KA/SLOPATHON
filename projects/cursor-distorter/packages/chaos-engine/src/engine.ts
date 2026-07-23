import type {
  ClickTransform,
  ClickableTarget,
  CursorContext,
  CursorEffect,
  EffectConfig,
  EffectId,
  EffectResult,
  FrameDistortion,
  GhostCursor,
  PointerEventContext,
  Preset,
  PriorityTag,
  SessionStats,
  Vec2,
} from "@cursor-distorter/shared-types";
import { distanceToRect } from "@cursor-distorter/shared-types";
import { SeededRandom } from "./random";
import { BehaviorTracker, type ClickOutcome } from "./behavior";
import { SessionTracker } from "./session-tracker";
import {
  AdaptiveController,
  type AdaptiveDirective,
  type AdaptiveModelLine,
} from "./adaptive";
import { cloneDefaultConfig, mergeEffectConfig } from "./presets";

/** An effect that can be reconfigured by the engine (superset of CursorEffect). */
export interface ConfigurableEffect extends CursorEffect {
  configure(config: EffectConfig, globalIntensity: number): void;
}

export interface FrameInput {
  now: number;
  real: Vec2;
  targets: ClickableTarget[];
  viewport: { width: number; height: number };
}

export interface PointerInput extends FrameInput {
  button: number;
  pointerType: string;
  intendedTarget?: ClickableTarget;
}

export interface EngineOptions {
  seed?: number | string;
  effects?: CursorEffect[];
  priorities?: PriorityTag[];
  maxSessionMs?: number;
}

function identityDistortion(): FrameDistortion {
  return {
    primaryOffset: { x: 0, y: 0 },
    smoothing: 1,
    sensitivity: 1,
    freezeUntil: 0,
    ghosts: [],
    message: null,
    spinner: false,
    pathBend: null,
    confidence: [],
    targetNudges: {},
    activeContributors: [],
  };
}

const hasConfigure = (e: CursorEffect): e is ConfigurableEffect =>
  typeof (e as ConfigurableEffect).configure === "function";

/**
 * The ChaosEngine composes independent CursorEffect modules into a single per-frame
 * distortion (and per-click transform). It owns effect enable/intensity/probability,
 * scheduling, triggers, cooldowns, the deterministic RNG, behavior/session tracking,
 * and — most importantly — the panic bypass that guarantees reversibility.
 */
export class ChaosEngine {
  private effects = new Map<EffectId, CursorEffect>();
  private order: EffectId[] = [];
  private config: Record<EffectId, EffectConfig> = cloneDefaultConfig();
  private rng: SeededRandom;
  private seed: number | string;

  private behavior = new BehaviorTracker();
  private session = new SessionTracker();
  private adaptive = new AdaptiveController();

  private intensity = 0.4;
  private priorities: PriorityTag[] = [];

  private active = false;
  private panicked = false;

  private lastNow = 0;
  private lastReal: Vec2 | null = null;

  private lastScheduleFireAt = new Map<EffectId, number>();
  private lastActivationAt = new Map<EffectId, number>();
  private lastClickAt = -1e9;

  private modelLines: AdaptiveModelLine[] = [];
  private closeEvasionReleased = false;

  constructor(opts: EngineOptions = {}) {
    this.seed = opts.seed ?? 0x5eeded;
    this.rng = new SeededRandom(this.seed);
    if (opts.priorities) this.priorities = [...opts.priorities];
    if (opts.maxSessionMs) this.session.setMaxSessionMs(opts.maxSessionMs);
    if (opts.effects) for (const e of opts.effects) this.register(e);
    this.session.start(0);
  }

  // ---- registration & configuration -------------------------------------------------

  register(effect: CursorEffect): void {
    if (!this.effects.has(effect.id)) this.order.push(effect.id);
    this.effects.set(effect.id, effect);
    this.syncEffect(effect.id);
  }

  getEffect(id: EffectId): CursorEffect | undefined {
    return this.effects.get(id);
  }

  effectsList(): CursorEffect[] {
    return this.order.map((id) => this.effects.get(id)!).filter(Boolean);
  }

  getConfig(id: EffectId): EffectConfig {
    return this.config[id];
  }

  getAllConfig(): Record<EffectId, EffectConfig> {
    return this.config;
  }

  private syncEffect(id: EffectId): void {
    const effect = this.effects.get(id);
    const cfg = this.config[id];
    if (!effect || !cfg) return;
    effect.enabled = cfg.enabled;
    effect.intensity = cfg.intensity;
    effect.probability = cfg.probability;
    if (hasConfigure(effect)) effect.configure(cfg, this.intensity);
  }

  applyConfig(id: EffectId, patch: Partial<EffectConfig>): void {
    this.config[id] = mergeEffectConfig(this.config[id], patch);
    this.syncEffect(id);
  }

  applyPreset(preset: Preset): void {
    // Reset every effect to default, then layer the preset's overrides.
    this.config = cloneDefaultConfig();
    this.intensity = preset.intensity;
    for (const id of Object.keys(preset.effects) as EffectId[]) {
      const patch = preset.effects[id];
      if (patch) this.config[id] = mergeEffectConfig(this.config[id], patch);
    }
    for (const id of this.order) this.syncEffect(id);
  }

  enableOnly(ids: EffectId[]): void {
    const set = new Set(ids);
    for (const id of this.order) {
      this.config[id].enabled = set.has(id);
      this.syncEffect(id);
    }
  }

  disableAll(): void {
    for (const id of this.order) {
      this.config[id].enabled = false;
      this.syncEffect(id);
    }
  }

  setIntensity(v: number): void {
    this.intensity = Math.max(0, Math.min(1, v));
    for (const id of this.order) this.syncEffect(id);
  }

  getIntensity(): number {
    return this.intensity;
  }

  setPriorities(tags: PriorityTag[]): void {
    this.priorities = [...tags];
  }

  getPriorities(): PriorityTag[] {
    return [...this.priorities];
  }

  // ---- lifecycle & safety -----------------------------------------------------------

  setActive(active: boolean): void {
    this.active = active;
  }

  private isActiveAt(now: number): boolean {
    return this.active && !this.panicked && !this.session.isExpired(now);
  }

  isActive(): boolean {
    return this.isActiveAt(this.lastNow);
  }

  /** Latch the panic state. All distortion output becomes the identity immediately. */
  panic(): void {
    this.panicked = true;
    this.active = false;
    for (const effect of this.effects.values()) effect.cleanup();
  }

  isPanicked(): boolean {
    return this.panicked;
  }

  /** Clear the panic latch (used when the user explicitly re-arms distortion). */
  resume(): void {
    this.panicked = false;
  }

  isExpired(): boolean {
    return this.session.isExpired(this.lastNow);
  }

  remainingSessionMs(): number {
    return this.session.remainingMs(this.lastNow);
  }

  setMaxSessionMs(ms: number): void {
    this.session.setMaxSessionMs(ms);
  }

  setSeed(seed: number | string): void {
    this.seed = seed;
    this.rng = new SeededRandom(seed);
  }

  getSeed(): number | string {
    return this.seed;
  }

  reset(seed?: number | string): void {
    if (seed !== undefined) this.seed = seed;
    this.rng = new SeededRandom(this.seed);
    this.behavior.reset(this.lastNow);
    this.session.reset(this.lastNow);
    this.adaptive.reset();
    this.panicked = false;
    this.active = false;
    this.lastReal = null;
    this.lastScheduleFireAt.clear();
    this.lastActivationAt.clear();
    this.lastClickAt = -1e9;
    this.modelLines = [];
    this.closeEvasionReleased = false;
    for (const effect of this.effects.values()) effect.cleanup();
  }

  // ---- per-frame update -------------------------------------------------------------

  private buildContext(input: FrameInput): CursorContext {
    const dt = this.lastReal ? Math.max(0, input.now - this.lastNow) : 0;
    const velocity: Vec2 =
      this.lastReal && dt > 0
        ? { x: (input.real.x - this.lastReal.x) / dt, y: (input.real.y - this.lastReal.y) / dt }
        : { x: 0, y: 0 };
    const speed = Math.hypot(velocity.x, velocity.y);

    let nearestTarget: ClickableTarget | undefined;
    let nearestDistance = Infinity;
    for (const t of input.targets) {
      const d = distanceToRect(input.real, t.rect);
      if (d < nearestDistance) {
        nearestDistance = d;
        nearestTarget = t;
      }
    }
    if (!Number.isFinite(nearestDistance)) nearestDistance = Infinity;

    return {
      now: input.now,
      dt,
      elapsed: input.now - this.session.snapshot().startedAt,
      real: input.real,
      velocity,
      speed,
      moving: speed > 0.02,
      targets: input.targets,
      nearestTarget,
      nearestDistance,
      viewport: input.viewport,
      intensity: this.intensity,
      rng: this.rng,
      behavior: this.behavior.snapshot(),
      priorities: this.priorities,
    };
  }

  private isEligible(id: EffectId, ctx: CursorContext): boolean {
    const cfg = this.config[id];
    if (!cfg.enabled) return false;
    const t = cfg.triggers;
    if (t) {
      if (t.afterElapsedMs != null && ctx.elapsed < t.afterElapsedMs) return false;
      if (t.onSpeedAbove != null && ctx.speed < t.onSpeedAbove) return false;
      if (t.onSpeedBelow != null && ctx.speed > t.onSpeedBelow) return false;
      if (t.onProximityBelow != null && ctx.nearestDistance > t.onProximityBelow) return false;
      if (t.afterFailedClicks != null && ctx.behavior.failedClicks < t.afterFailedClicks)
        return false;
      if (t.afterClick && ctx.now - this.lastClickAt > 900) return false;
      if (t.scheduleEveryMs != null) {
        const last = this.lastScheduleFireAt.get(id) ?? -1e9;
        if (ctx.now - last < t.scheduleEveryMs) return false;
        this.lastScheduleFireAt.set(id, ctx.now);
      }
    }
    if (cfg.cooldownMs) {
      const last = this.lastActivationAt.get(id) ?? -1e9;
      if (ctx.now - last < cfg.cooldownMs) return false;
    }
    return true;
  }

  frame(input: FrameInput): FrameDistortion {
    const dt = this.lastReal ? Math.max(0, input.now - this.lastNow) : 0;
    const ctx = this.buildContext(input);

    // Always track movement + session duration, even when inactive.
    this.behavior.onFrame(input.now, ctx.moving, ctx.speed);
    const activeNow = this.isActiveAt(input.now);
    this.session.tick({
      now: input.now,
      active: activeNow,
      intensity: this.intensity,
      behavior: this.behavior.snapshot(),
    });

    this.lastNow = input.now;
    this.lastReal = input.real;

    if (!activeNow) return identityDistortion();

    // Adaptive reasoning may reconfigure effects and emit model lines.
    this.runAdaptive(input.now);

    const dist = identityDistortion();
    let smoothingMin = 1;
    let sensitivityProduct = 1;

    for (const id of this.order) {
      const effect = this.effects.get(id)!;
      if (!this.isEligible(id, ctx)) continue;
      const res = effect.update(ctx);
      if (isEmpty(res)) continue;
      this.lastActivationAt.set(id, input.now);
      dist.activeContributors.push(id);
      accumulate(dist, res, input.now);
      if (res.smoothing != null) smoothingMin = Math.min(smoothingMin, res.smoothing);
      if (res.sensitivity != null) sensitivityProduct *= res.sensitivity;
    }

    dist.smoothing = smoothingMin;
    dist.sensitivity = sensitivityProduct;
    void dt;
    return dist;
  }

  private runAdaptive(now: number): void {
    const enabled = this.order.filter((id) => this.config[id].enabled);
    const result = this.adaptive.evaluate(now, this.behavior.snapshot(), enabled, this.rng);
    if (result.releaseCloseEvasion) this.closeEvasionReleased = true;
    for (const d of result.directives) this.applyDirective(d);
    if (result.modelLines.length) {
      this.modelLines.push(...result.modelLines);
      if (this.modelLines.length > 8) this.modelLines = this.modelLines.slice(-8);
    }
  }

  private applyDirective(d: AdaptiveDirective): void {
    const cfg = this.config[d.effect];
    if (!cfg) return;
    if (d.patch) this.config[d.effect] = mergeEffectConfig(cfg, d.patch);
    if (d.paramPatch) {
      const params = { ...(this.config[d.effect].params ?? {}) };
      for (const [k, v] of Object.entries(d.paramPatch)) {
        if (k.endsWith("Bump") && typeof v === "number") {
          const current = typeof params[k] === "number" ? (params[k] as number) : 0;
          params[k] = Math.min(50, current + v);
        } else {
          params[k] = v;
        }
      }
      this.config[d.effect].params = params;
    }
    this.syncEffect(d.effect);
  }

  // ---- click handling ---------------------------------------------------------------

  private buildPointerContext(input: PointerInput): PointerEventContext {
    const base = this.buildContext(input);
    return {
      ...base,
      button: input.button,
      pointerType: input.pointerType,
      intendedTarget: input.intendedTarget,
    };
  }

  pointerDown(input: PointerInput): ClickTransform {
    this.lastClickAt = input.now;
    if (!this.isActiveAt(input.now)) return {};
    const ctx = this.buildPointerContext(input);
    return this.composeClick(ctx, "onPointerDown");
  }

  pointerUp(input: PointerInput): ClickTransform {
    if (!this.isActiveAt(input.now)) return {};
    const ctx = this.buildPointerContext(input);
    return this.composeClick(ctx, "onPointerUp");
  }

  private composeClick(
    ctx: PointerEventContext,
    phase: "onPointerDown" | "onPointerUp",
  ): ClickTransform {
    const out: ClickTransform = {};
    let offset: Vec2 = { x: 0, y: 0 };
    let swapParity = false;
    let delayMax = 0;
    for (const id of this.order) {
      if (!this.config[id].enabled) continue;
      const effect = this.effects.get(id)!;
      const handler = effect[phase];
      if (!handler) continue;
      const res = handler.call(effect, ctx);
      const c = res?.click;
      if (!c) continue;
      if (c.ignore) return { ignore: true, note: c.note };
      if (c.offset) offset = { x: offset.x + c.offset.x, y: offset.y + c.offset.y };
      if (c.double) out.double = true;
      if (c.fakeOnly) out.fakeOnly = true;
      if (c.swapButton) swapParity = !swapParity;
      if (c.delayMs) delayMax = Math.max(delayMax, c.delayMs);
      if (c.note) out.note = c.note;
    }
    if (offset.x !== 0 || offset.y !== 0) out.offset = offset;
    if (swapParity) out.swapButton = true;
    if (delayMax > 0) out.delayMs = delayMax;
    return out;
  }

  // ---- outcome recording ------------------------------------------------------------

  recordClickOutcome(outcome: ClickOutcome): void {
    this.behavior.onClickOutcome(outcome);
    if (outcome.hitIntended) {
      this.session.recordSuccessfulClick();
    } else {
      this.session.recordPreventedClick(outcome.missDistance);
    }
  }

  recordAccidentalClick(): void {
    this.session.recordAccidentalClick();
  }

  recordResponsibilityAvoided(): void {
    this.session.recordResponsibilityAvoided();
  }

  recordCloseAttempt(): void {
    this.behavior.onCloseAttempt();
  }

  isCloseEvasionReleased(): boolean {
    return this.closeEvasionReleased || this.behavior.snapshot().closeAttempts >= 3;
  }

  // ---- readouts ---------------------------------------------------------------------

  stats(): SessionStats {
    return this.session.snapshot();
  }

  getModelLines(): AdaptiveModelLine[] {
    return [...this.modelLines];
  }

  getBehavior() {
    return this.behavior.snapshot();
  }
}

function isEmpty(res: EffectResult): boolean {
  return (
    !res ||
    (res.offset == null &&
      res.smoothing == null &&
      res.sensitivity == null &&
      res.freezeMs == null &&
      (!res.ghosts || res.ghosts.length === 0) &&
      res.message == null &&
      !res.spinner &&
      res.pathBend == null &&
      (!res.confidence || res.confidence.length === 0) &&
      (!res.targetNudges || res.targetNudges.length === 0) &&
      res.click == null)
  );
}

function accumulate(dist: FrameDistortion, res: EffectResult, now: number): void {
  if (res.offset) {
    dist.primaryOffset.x += res.offset.x;
    dist.primaryOffset.y += res.offset.y;
  }
  if (res.freezeMs && res.freezeMs > 0) {
    dist.freezeUntil = Math.max(dist.freezeUntil, now + res.freezeMs);
  }
  if (res.ghosts && res.ghosts.length) {
    dist.ghosts.push(...res.ghosts as GhostCursor[]);
  }
  if (res.message !== undefined && res.message !== null) {
    dist.message = res.message;
  }
  if (res.spinner) dist.spinner = true;
  if (res.pathBend) dist.pathBend = res.pathBend;
  if (res.confidence && res.confidence.length) {
    dist.confidence.push(...res.confidence);
  }
  if (res.targetNudges) {
    for (const n of res.targetNudges) {
      const cur = dist.targetNudges[n.targetId] ?? { x: 0, y: 0 };
      dist.targetNudges[n.targetId] = { x: cur.x + n.delta.x, y: cur.y + n.delta.y };
    }
  }
}
