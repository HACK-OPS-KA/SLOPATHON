import {
  createContext,
  useCallback,
  useContext,
  useRef,
  type MutableRefObject,
  type ReactNode,
} from "react";
import type { ClickableTarget, PriorityTag, Rect, Vec2 } from "@cursor-distorter/shared-types";

export interface ActivateInfo {
  /** Effective click point in sandbox coordinates. */
  point: Vec2;
  /** True when the effective click matched the target the user was aiming at. */
  intended: boolean;
  button: number;
}

export interface TargetOptions {
  id: string;
  kind: ClickableTarget["kind"];
  importance: number;
  priorityTag?: PriorityTag;
  isEscapeHatch?: boolean;
  disabled?: boolean;
  draggable?: boolean;
  onActivate?: (info: ActivateInfo) => void;
  onDragStart?: () => void;
  onDrop?: (zoneId: string | null) => void;
}

interface TargetEntry {
  id: string;
  el: HTMLElement;
  opts: MutableRefObject<TargetOptions>;
  nudge: Vec2;
}

interface ZoneEntry {
  id: string;
  el: HTMLElement;
  accepts?: (dragId: string) => boolean;
}

/** Non-reactive registry of clickable targets and drop zones for the sandbox. */
export class TargetRegistry {
  private targets = new Map<string, TargetEntry>();
  private zones = new Map<string, ZoneEntry>();
  private origin: HTMLElement | null = null;

  setOrigin(el: HTMLElement | null): void {
    this.origin = el;
  }

  private originRect(): DOMRect | null {
    return this.origin ? this.origin.getBoundingClientRect() : null;
  }

  mount(id: string, el: HTMLElement, opts: MutableRefObject<TargetOptions>): void {
    this.targets.set(id, { id, el, opts, nudge: { x: 0, y: 0 } });
  }

  unmount(id: string): void {
    this.targets.delete(id);
  }

  mountZone(id: string, el: HTMLElement, accepts?: (dragId: string) => boolean): void {
    this.zones.set(id, { id, el, accepts });
  }

  unmountZone(id: string): void {
    this.zones.delete(id);
  }

  private rectOf(el: HTMLElement): Rect | null {
    const o = this.originRect();
    if (!o) return null;
    const r = el.getBoundingClientRect();
    return { x: r.left - o.left, y: r.top - o.top, width: r.width, height: r.height };
  }

  /** Snapshot of all enabled targets as engine-ready ClickableTargets. */
  computeTargets(): ClickableTarget[] {
    const out: ClickableTarget[] = [];
    for (const entry of this.targets.values()) {
      const o = entry.opts.current;
      if (o.disabled) continue;
      const rect = this.rectOf(entry.el);
      if (!rect) continue;
      out.push({
        id: o.id,
        rect,
        importance: o.importance,
        kind: o.kind,
        priorityTag: o.priorityTag,
        isEscapeHatch: o.isEscapeHatch,
      });
    }
    return out;
  }

  /** Topmost (smallest-area) enabled target containing `point`. */
  hitTest(point: Vec2): TargetEntry | null {
    let best: TargetEntry | null = null;
    let bestArea = Infinity;
    for (const entry of this.targets.values()) {
      if (entry.opts.current.disabled) continue;
      const rect = this.rectOf(entry.el);
      if (!rect) continue;
      if (
        point.x >= rect.x &&
        point.x <= rect.x + rect.width &&
        point.y >= rect.y &&
        point.y <= rect.y + rect.height
      ) {
        const area = rect.width * rect.height;
        if (area < bestArea) {
          bestArea = area;
          best = entry;
        }
      }
    }
    return best;
  }

  getEntry(id: string): TargetEntry | null {
    return this.targets.get(id) ?? null;
  }

  /** Build an engine-ready ClickableTarget (with its live rect) for one id. */
  clickableById(id: string): ClickableTarget | null {
    const entry = this.targets.get(id);
    if (!entry) return null;
    const o = entry.opts.current;
    const rect = this.rectOf(entry.el);
    if (!rect) return null;
    return {
      id: o.id,
      rect,
      importance: o.importance,
      kind: o.kind,
      priorityTag: o.priorityTag,
      isEscapeHatch: o.isEscapeHatch,
    };
  }

  activate(entry: TargetEntry, info: ActivateInfo): void {
    entry.opts.current.onActivate?.(info);
  }

  /** Drop zone (if any) under `point`. */
  zoneAt(point: Vec2, dragId: string): ZoneEntry | null {
    for (const zone of this.zones.values()) {
      const rect = this.rectOf(zone.el);
      if (!rect) continue;
      if (
        point.x >= rect.x &&
        point.x <= rect.x + rect.width &&
        point.y >= rect.y &&
        point.y <= rect.y + rect.height
      ) {
        if (!zone.accepts || zone.accepts(dragId)) return zone;
      }
    }
    return null;
  }

  /** Ease repulsion nudges toward their desired offsets (per-frame spring). */
  applyNudges(desired: Record<string, Vec2>, ease = 0.28): void {
    for (const entry of this.targets.values()) {
      if (entry.el.dataset.cdDragging === "1") continue; // dragging overrides nudge
      if (entry.el.dataset.cdSelfmove === "1") continue; // self-evading controls own their transform
      const want = desired[entry.id] ?? { x: 0, y: 0 };
      entry.nudge.x += (want.x - entry.nudge.x) * ease;
      entry.nudge.y += (want.y - entry.nudge.y) * ease;
      if (Math.abs(entry.nudge.x) < 0.05 && Math.abs(entry.nudge.y) < 0.05) {
        if (entry.el.style.transform) entry.el.style.transform = "";
      } else {
        entry.el.style.transform = `translate(${entry.nudge.x.toFixed(2)}px, ${entry.nudge.y.toFixed(2)}px)`;
      }
    }
  }

  setHover(id: string | null): void {
    for (const entry of this.targets.values()) {
      if (entry.id === id) entry.el.dataset.cdHover = "1";
      else delete entry.el.dataset.cdHover;
    }
  }

  flash(id: string): void {
    const entry = this.targets.get(id);
    if (!entry) return;
    entry.el.dataset.cdFlash = "1";
    window.setTimeout(() => {
      if (entry.el) delete entry.el.dataset.cdFlash;
    }, 180);
  }
}

const RegistryContext = createContext<TargetRegistry | null>(null);

export function RegistryProvider({
  registry,
  children,
}: {
  registry: TargetRegistry;
  children: ReactNode;
}) {
  return <RegistryContext.Provider value={registry}>{children}</RegistryContext.Provider>;
}

export function useRegistry(): TargetRegistry {
  const reg = useContext(RegistryContext);
  if (!reg) throw new Error("useRegistry must be used within a RegistryProvider");
  return reg;
}

/** Attach to a sandbox control to make it a clickable target. Returns a ref callback. */
export function useTarget(opts: TargetOptions) {
  const reg = useRegistry();
  const optsRef = useRef(opts);
  optsRef.current = opts;
  const idRef = useRef(opts.id);
  idRef.current = opts.id;

  return useCallback(
    (el: HTMLElement | null) => {
      if (el) reg.mount(idRef.current, el, optsRef);
      else reg.unmount(idRef.current);
    },
    [reg],
  );
}

/** Attach to a container to make it a drop zone. */
export function useDropZone(id: string, accepts?: (dragId: string) => boolean) {
  const reg = useRegistry();
  const acceptsRef = useRef(accepts);
  acceptsRef.current = accepts;
  return useCallback(
    (el: HTMLElement | null) => {
      if (el) reg.mountZone(id, el, (dragId) => acceptsRef.current?.(dragId) ?? true);
      else reg.unmountZone(id);
    },
    [reg, id],
  );
}
