import { describe, it, expect } from "vitest";
import { SeededRandom } from "@cursor-distorter/chaos-engine";
import type {
  BehaviorSignals,
  EffectConfig,
  PointerEventContext,
} from "@cursor-distorter/shared-types";
import {
  ImprecisionEffect,
  TripletsEffect,
  FreezeEffect,
  SensitivityEffect,
  OvershootEffect,
  BetrayalEffect,
  createAllEffects,
  EFFECT_CATALOG,
} from "../index";

const behavior: BehaviorSignals = {
  recentMisses: 0,
  consecutiveMissesOnSameTarget: 0,
  successfulClicks: 0,
  failedClicks: 0,
  carefulness: 0.5,
  idleMs: 0,
  closeAttempts: 0,
  adaptationScore: 0.5,
};

function ctx(overrides: Partial<PointerEventContext> = {}): PointerEventContext {
  return {
    now: 0,
    dt: 16,
    elapsed: 0,
    real: { x: 200, y: 200 },
    velocity: { x: 0, y: 0 },
    speed: 0,
    moving: false,
    targets: [],
    nearestTarget: undefined,
    nearestDistance: Infinity,
    viewport: { width: 800, height: 600 },
    intensity: 1,
    rng: new SeededRandom(1),
    behavior,
    priorities: [],
    button: 0,
    pointerType: "mouse",
    intendedTarget: undefined,
    ...overrides,
  };
}

const cfg = (over: Partial<EffectConfig> = {}): EffectConfig => ({
  enabled: true,
  intensity: 1,
  probability: 1,
  ...over,
});

describe("ImprecisionEffect", () => {
  it("keeps redirected clicks within the configured radius", () => {
    const e = new ImprecisionEffect();
    const radius = 20;
    e.configure(cfg({ params: { radius, distribution: "uniform", mode: "plausible" } }), 1);
    const rng = new SeededRandom(7);
    for (let i = 0; i < 500; i++) {
      const res = e.onPointerDown(ctx({ rng }));
      const o = res.click?.offset;
      expect(o).toBeDefined();
      // global intensity 1 => radius scale (0.5 + 0.5*1) = 1.
      expect(Math.hypot(o!.x, o!.y)).toBeLessThanOrEqual(radius + 1e-6);
    }
  });

  it("is deterministic for a given seed", () => {
    const e1 = new ImprecisionEffect();
    const e2 = new ImprecisionEffect();
    e1.configure(cfg({ params: { radius: 30 } }), 1);
    e2.configure(cfg({ params: { radius: 30 } }), 1);
    const a = e1.onPointerDown(ctx({ rng: new SeededRandom(42) }));
    const b = e2.onPointerDown(ctx({ rng: new SeededRandom(42) }));
    expect(a).toEqual(b);
  });

  it("never redirects when probability is zero", () => {
    const e = new ImprecisionEffect();
    e.configure(cfg({ probability: 0 }), 1);
    expect(e.onPointerDown(ctx())).toEqual({});
  });
});

describe("TripletsEffect", () => {
  it("renders count-1 ghosts", () => {
    const e = new TripletsEffect();
    e.configure(cfg({ params: { count: 3 } }), 1);
    expect(e.update(ctx()).ghosts).toHaveLength(2);
    e.configure(cfg({ params: { count: 2 } }), 1);
    expect(e.update(ctx()).ghosts).toHaveLength(1);
  });

  it("ghosts carry no identifying opacity difference", () => {
    const e = new TripletsEffect();
    e.configure(cfg({ params: { count: 3 } }), 1);
    const ghosts = e.update(ctx()).ghosts!;
    expect(new Set(ghosts.map((g) => g.opacity))).toEqual(new Set([1]));
  });
});

describe("FreezeEffect", () => {
  it("respects probability and freeze bounds", () => {
    const off = new FreezeEffect();
    off.configure(cfg({ probability: 0 }), 1);
    expect(off.update(ctx())).toEqual({});

    const on = new FreezeEffect();
    on.configure(cfg({ probability: 1, intensity: 1 }), 1);
    const rng = new SeededRandom(3);
    for (let i = 0; i < 300; i++) {
      const ms = on.update(ctx({ rng })).freezeMs;
      expect(ms).toBeGreaterThan(0);
      expect(ms!).toBeLessThanOrEqual(900 * (0.6 + 0.7)); // dramatic upper bound
    }
  });
});

describe("SensitivityEffect", () => {
  it("stays within safe multiplier bounds", () => {
    const e = new SensitivityEffect();
    e.configure(cfg(), 1);
    const rng = new SeededRandom(9);
    for (let i = 0; i < 200; i++) {
      const s = e.update(ctx({ now: i * 500, rng })).sensitivity!;
      expect(s).toBeGreaterThanOrEqual(0.55);
      expect(s).toBeLessThanOrEqual(1.7);
    }
  });
});

describe("OvershootEffect", () => {
  it("injects on fast movement then springs back to nothing", () => {
    const e = new OvershootEffect();
    e.configure(cfg(), 1);
    const rng = new SeededRandom(2);
    // Fast frames inject impulses (probabilistic per frame).
    let injected = false;
    for (let i = 0; i < 20; i++) {
      if (e.update(ctx({ speed: 2, velocity: { x: 2, y: 0 }, rng })).offset) injected = true;
    }
    expect(injected).toBe(true);
    // Idle frames let it settle back to empty.
    let last = e.update(ctx({ speed: 0, rng }));
    for (let i = 0; i < 300; i++) last = e.update(ctx({ speed: 0, rng }));
    expect(last).toEqual({});
  });
});

describe("BetrayalEffect", () => {
  it("produces a click transform when it fires", () => {
    const e = new BetrayalEffect();
    e.configure(cfg({ probability: 1 }), 1);
    const res = e.onPointerDown(ctx({ now: 1000, rng: new SeededRandom(5) }));
    expect(res.click).toBeDefined();
  });
});

describe("catalog + factory", () => {
  it("exposes exactly the twelve effects with matching catalog entries", () => {
    const effects = createAllEffects();
    expect(effects).toHaveLength(12);
    const ids = new Set(effects.map((e) => e.id));
    expect(new Set(EFFECT_CATALOG.map((c) => c.id))).toEqual(ids);
  });
});
