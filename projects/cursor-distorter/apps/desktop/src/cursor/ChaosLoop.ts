import type { ChaosEngine } from "@cursor-distorter/chaos-engine";
import type {
  ClickableTarget,
  ConfidenceReadout,
  Vec2,
} from "@cursor-distorter/shared-types";
import type { CursorLayerApi } from "./CursorLayer";
import type { TargetRegistry, ActivateInfo } from "./registry";
import type { LiveSnapshot } from "../state/store";

export type SoundName =
  | "offset"
  | "spring"
  | "error"
  | "slot"
  | "newcursor"
  | "chime";

export interface ChaosLoopDeps {
  engine: ChaosEngine;
  registry: TargetRegistry;
  root: HTMLElement;
  cursorApi: () => CursorLayerApi | null;
  onLive: (snap: LiveSnapshot) => void;
  onSound?: (name: SoundName) => void;
}

interface DragState {
  id: string;
  startR: Vec2;
  el: HTMLElement;
}

interface MessageState {
  text: string;
  anchor: number;
  until: number;
}

const lerpFactor = (s: number, dt: number) => 1 - Math.pow(1 - s, dt / 16.67);

/**
 * Owns the per-frame render loop. Samples the real pointer, asks the ChaosEngine for a
 * distortion, builds the rendered-cursor pipeline, redirects clicks/drags, and pushes a
 * throttled live snapshot to the dashboard.
 */
export class ChaosLoop {
  private raf = 0;
  private running = false;

  private clientX = 0;
  private clientY = 0;
  private inside = false;
  private lastNow = 0;

  private M: Vec2 = { x: 0, y: 0 };
  private lastM: Vec2 = { x: 0, y: 0 };
  private virtualP: Vec2 = { x: 0, y: 0 };
  private R: Vec2 = { x: 0, y: 0 };
  private ghostCount = 0;
  private freezeUntil = 0;

  private message: MessageState | null = null;
  private confidenceCache: ConfidenceReadout[] = [];
  private lastLiveAt = 0;
  private drag: DragState | null = null;

  constructor(private deps: ChaosLoopDeps) {}

  start(): void {
    if (this.running) return;
    this.running = true;
    const { root } = this.deps;
    root.addEventListener("pointermove", this.onPointerMove);
    root.addEventListener("pointerdown", this.onPointerDown);
    root.addEventListener("pointerup", this.onPointerUp);
    root.addEventListener("pointerenter", this.onEnter);
    root.addEventListener("pointerleave", this.onLeave);
    root.addEventListener("contextmenu", this.onContextMenu);
    this.raf = requestAnimationFrame(this.tick);
  }

  stop(): void {
    if (!this.running) return;
    this.running = false;
    const { root } = this.deps;
    root.removeEventListener("pointermove", this.onPointerMove);
    root.removeEventListener("pointerdown", this.onPointerDown);
    root.removeEventListener("pointerup", this.onPointerUp);
    root.removeEventListener("pointerenter", this.onEnter);
    root.removeEventListener("pointerleave", this.onLeave);
    root.removeEventListener("contextmenu", this.onContextMenu);
    cancelAnimationFrame(this.raf);
  }

  private toSandbox(clientX: number, clientY: number): Vec2 {
    const r = this.deps.root.getBoundingClientRect();
    return { x: clientX - r.left, y: clientY - r.top };
  }

  private onPointerMove = (e: PointerEvent) => {
    this.clientX = e.clientX;
    this.clientY = e.clientY;
    this.inside = true;
  };

  private onEnter = (e: PointerEvent) => {
    this.inside = true;
    this.clientX = e.clientX;
    this.clientY = e.clientY;
    // Snap the virtual pointer to the real one so re-entry doesn't jump.
    this.M = this.toSandbox(e.clientX, e.clientY);
    this.lastM = { ...this.M };
    this.virtualP = { ...this.M };
    this.R = { ...this.M };
  };

  private onLeave = () => {
    this.inside = false;
    this.endDrag(null);
  };

  private onContextMenu = (e: Event) => {
    e.preventDefault();
  };

  private viewport() {
    const r = this.deps.root.getBoundingClientRect();
    return { width: r.width, height: r.height };
  }

  private onPointerDown = (e: PointerEvent) => {
    e.preventDefault();
    const { engine, registry } = this.deps;
    const now = performance.now();
    this.M = this.toSandbox(e.clientX, e.clientY);
    const intendedEntry = registry.hitTest(this.R);
    const intended: ClickableTarget | undefined = intendedEntry
      ? (registry.clickableById(intendedEntry.opts.current.id) ?? undefined)
      : undefined;

    // Begin a drag if we grabbed a draggable and the engine didn't ignore the press.
    if (intendedEntry?.opts.current.draggable) {
      const t = engine.pointerDown({
        now,
        real: this.M,
        targets: registry.computeTargets(),
        viewport: this.viewport(),
        button: e.button,
        pointerType: e.pointerType || "mouse",
        intendedTarget: intended,
      });
      if (!t.ignore) {
        this.beginDrag(intendedEntry.opts.current.id);
        intendedEntry.opts.current.onDragStart?.();
        return;
      }
    }

    if (intended?.isEscapeHatch) engine.recordCloseAttempt();

    const transform = engine.pointerDown({
      now,
      real: this.M,
      targets: registry.computeTargets(),
      viewport: this.viewport(),
      button: e.button,
      pointerType: e.pointerType || "mouse",
      intendedTarget: intended,
    });

    const api = this.deps.cursorApi();

    if (transform.ignore) {
      api?.spawnClick(this.R.x, this.R.y, "fake");
      this.registerMiss(intended, 0);
      this.deps.onSound?.("error");
      return;
    }

    const E: Vec2 = {
      x: this.R.x + (transform.offset?.x ?? 0),
      y: this.R.y + (transform.offset?.y ?? 0),
    };
    const missDistance = Math.hypot(E.x - this.R.x, E.y - this.R.y);

    if (transform.fakeOnly) {
      api?.spawnClick(E.x, E.y, "fake");
      this.registerMiss(intended, missDistance);
      this.deps.onSound?.("error");
      return;
    }

    if (transform.swapButton) {
      // Left behaves like right: nothing activates.
      api?.spawnClick(E.x, E.y, "ghost");
      this.registerMiss(intended, missDistance);
      this.deps.onSound?.("error");
      return;
    }

    const doActivate = () => this.activateAt(E, intended, e.button, missDistance);
    if (transform.delayMs && transform.delayMs > 0) {
      window.setTimeout(doActivate, transform.delayMs);
    } else {
      doActivate();
    }

    if (transform.double) {
      window.setTimeout(() => {
        const E2 = { x: E.x + 6, y: E.y + 5 };
        this.activateAt(E2, intended, e.button, missDistance, true);
      }, 90);
    }
  };

  private onPointerUp = (e: PointerEvent) => {
    if (this.drag) {
      this.M = this.toSandbox(e.clientX, e.clientY);
      const E: Vec2 = { x: this.R.x, y: this.R.y };
      const { engine, registry } = this.deps;
      const t = engine.pointerUp({
        now: performance.now(),
        real: this.M,
        targets: registry.computeTargets(),
        viewport: this.viewport(),
        button: e.button,
        pointerType: e.pointerType || "mouse",
      });
      // Click Betrayal can make drag-and-drop detach just before the destination.
      const betrayed = t.ignore || t.fakeOnly;
      const zone = betrayed ? null : registry.zoneAt(E, this.drag.id);
      this.endDrag(zone ? zone.id : null);
      if (zone) this.deps.onSound?.("slot");
      else this.deps.onSound?.("error");
    }
  };

  private activateAt(
    E: Vec2,
    intended: ClickableTarget | undefined,
    button: number,
    missDistance: number,
    isSecond = false,
  ) {
    const { engine, registry } = this.deps;
    const api = this.deps.cursorApi();
    const effEntry = registry.hitTest(E);
    const now = performance.now();

    if (!effEntry) {
      api?.spawnClick(E.x, E.y, "real");
      if (!isSecond) this.registerMiss(intended, missDistance);
      return;
    }

    const hitIntended = !!intended && effEntry.opts.current.id === intended.id;
    const info: ActivateInfo = { point: E, intended: hitIntended, button };
    registry.activate(effEntry, info);
    registry.flash(effEntry.opts.current.id);
    api?.spawnClick(E.x, E.y, "real");

    if (!isSecond) {
      engine.recordClickOutcome({
        now,
        targetId: intended?.id,
        hitIntended,
        missDistance,
      });
      if (!hitIntended) engine.recordAccidentalClick();
      this.deps.onSound?.(hitIntended ? "slot" : "error");
    }
  }

  private registerMiss(intended: ClickableTarget | undefined, missDistance: number) {
    this.deps.engine.recordClickOutcome({
      now: performance.now(),
      targetId: intended?.id,
      hitIntended: false,
      missDistance,
    });
  }

  private beginDrag(id: string) {
    const entry = this.deps.registry.getEntry(id);
    if (!entry) return;
    entry.el.dataset.cdDragging = "1";
    entry.el.style.zIndex = "40";
    this.drag = { id, startR: { ...this.R }, el: entry.el };
  }

  private endDrag(zoneId: string | null) {
    if (!this.drag) return;
    const entry = this.deps.registry.getEntry(this.drag.id);
    if (entry) {
      delete entry.el.dataset.cdDragging;
      entry.el.style.transform = "";
      entry.el.style.zIndex = "";
      entry.opts.current.onDrop?.(zoneId);
    }
    this.drag = null;
  }

  private tick = () => {
    const now = performance.now();
    const dt = this.lastNow ? Math.min(64, now - this.lastNow) : 16;
    this.lastNow = now;
    const { engine, registry } = this.deps;

    if (this.inside) this.M = this.toSandbox(this.clientX, this.clientY);

    const targets = registry.computeTargets();
    const dist = engine.frame({
      now,
      real: this.M,
      targets,
      viewport: this.viewport(),
    });

    // 1. Sensitivity roulette scales movement of the virtual pointer.
    const dxM = this.M.x - this.lastM.x;
    const dyM = this.M.y - this.lastM.y;
    this.virtualP.x += dxM * dist.sensitivity;
    this.virtualP.y += dyM * dist.sensitivity;
    this.lastM = { ...this.M };
    // Safety: never let the virtual pointer diverge unusably far from the hand.
    const div = Math.hypot(this.virtualP.x - this.M.x, this.virtualP.y - this.M.y);
    if (div > 140) {
      this.virtualP.x += (this.M.x - this.virtualP.x) * 0.12;
      this.virtualP.y += (this.M.y - this.virtualP.y) * 0.12;
    }

    // 2. Additive offsets (drift, overshoot).
    const target = {
      x: this.virtualP.x + dist.primaryOffset.x,
      y: this.virtualP.y + dist.primaryOffset.y,
    };

    // 3. Micro-freeze holds the rendered cursor still.
    this.freezeUntil = Math.max(this.freezeUntil, dist.freezeUntil);
    const frozen = now < this.freezeUntil;

    // 4. Lag smoothing.
    if (!frozen) {
      const f = lerpFactor(dist.smoothing, dt);
      this.R.x += (target.x - this.R.x) * f;
      this.R.y += (target.y - this.R.y) * f;
    }

    // 5. Path bend (visual only).
    let display = this.R;
    if (dist.pathBend) {
      const vx = this.M.x - this.virtualP.x;
      void vx;
      const dirx = target.x - this.R.x;
      const diry = target.y - this.R.y;
      const len = Math.hypot(dirx, diry);
      if (len > 0.4) {
        const px = -diry / len;
        const py = dirx / len;
        const amp = dist.pathBend.amplitude * Math.sin(now / 180 + dist.pathBend.phase);
        display = { x: this.R.x + px * amp, y: this.R.y + py * amp };
      }
    }

    // Repulsion nudges (spring targets away).
    registry.applyNudges(dist.targetNudges);

    // Drag follows the rendered cursor.
    if (this.drag) {
      const dxr = display.x - this.drag.startR.x;
      const dyr = display.y - this.drag.startR.y;
      this.drag.el.style.transform = `translate(${dxr.toFixed(1)}px, ${dyr.toFixed(1)}px)`;
    }

    // Hover feedback for the target under the rendered cursor.
    const hovered = registry.hitTest(display);
    registry.setHover(hovered ? hovered.opts.current.id : null);

    // Build the cursor set.
    const cursors = [{ x: display.x, y: display.y, opacity: 1 }];
    for (const g of dist.ghosts) {
      cursors.push({
        x: display.x + g.offset.x,
        y: display.y + g.offset.y,
        opacity: g.opacity ?? 1,
      });
    }
    if (dist.ghosts.length !== this.ghostCount) {
      if (dist.ghosts.length > this.ghostCount) this.deps.onSound?.("newcursor");
      this.ghostCount = dist.ghosts.length;
    }

    // Messages (Social Cursor).
    if (dist.message) {
      this.message = {
        text: dist.message.text,
        anchor: dist.message.anchor ?? 0,
        until: now + (dist.message.ttlMs ?? 2600),
      };
    }
    if (this.message && now > this.message.until) this.message = null;
    let bubble: { x: number; y: number; text: string } | null = null;
    if (this.message) {
      const idx = Math.min(this.message.anchor, cursors.length - 1);
      const c = cursors[idx]!;
      bubble = { x: c.x, y: c.y, text: this.message.text };
    }

    // Fake spinner when lag is heavy.
    const spinner = engine.isActive() && dist.smoothing < 0.25 ? { x: display.x, y: display.y } : null;

    // Confidence readouts persist between updates.
    if (dist.confidence.length) this.confidenceCache = dist.confidence;

    this.deps.cursorApi()?.render({ visible: this.inside, cursors, bubble, spinner });

    // Throttled dashboard sync (~8Hz).
    if (now - this.lastLiveAt > 120) {
      this.lastLiveAt = now;
      const vp = this.viewport();
      this.deps.onLive({
        stats: engine.stats(),
        confidence: this.confidenceCache,
        modelLines: engine.getModelLines(),
        activeContributors: dist.activeContributors,
        remainingMs: engine.remainingSessionMs(),
        closeEvasionReleased: engine.isCloseEvasionReleased(),
        sample:
          this.inside && vp.width > 0
            ? {
                real: { x: this.M.x / vp.width, y: this.M.y / vp.height },
                render: { x: display.x / vp.width, y: display.y / vp.height },
              }
            : null,
      });
    }

    if (this.running) this.raf = requestAnimationFrame(this.tick);
  };
}
