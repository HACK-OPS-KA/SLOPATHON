import { describe, it, expect } from "vitest";
import { ChaosEngine, type ConfigurableEffect } from "../engine";
import { PRESETS } from "../presets";
import type {
  CursorContext,
  EffectConfig,
  EffectId,
  EffectResult,
  PointerEventContext,
} from "@cursor-distorter/shared-types";

class FakeEffect implements ConfigurableEffect {
  readonly name = "Fake";
  readonly description = "test double";
  enabled = false;
  intensity = 0.5;
  probability = 1;
  cleaned = false;
  lastIntensity = -1;
  lastConfig?: EffectConfig;

  constructor(public readonly id: EffectId) {}

  configure(config: EffectConfig): void {
    this.lastConfig = config;
  }

  update(ctx: CursorContext): EffectResult {
    this.lastIntensity = ctx.intensity;
    return { offset: { x: 10, y: 0 } };
  }

  onPointerDown(_ctx: PointerEventContext): EffectResult {
    return { click: { offset: { x: 5, y: 5 } } };
  }

  cleanup(): void {
    this.cleaned = true;
  }
}

const viewport = { width: 800, height: 600 };
const frameAt = (engine: ChaosEngine, now: number) =>
  engine.frame({ now, real: { x: 100, y: 100 }, targets: [], viewport });

describe("ChaosEngine", () => {
  it("applies a registered effect's offset when active", () => {
    const engine = new ChaosEngine({ seed: 1 });
    const fake = new FakeEffect("drift");
    engine.register(fake);
    engine.applyConfig("drift", { enabled: true });
    engine.setActive(true);
    engine.setIntensity(1);

    const d = frameAt(engine, 16);
    expect(d.primaryOffset.x).toBe(10);
    expect(d.activeContributors).toContain("drift");
    expect(fake.lastIntensity).toBe(1);
  });

  it("panic() bypasses all distortion and returns the identity", () => {
    const engine = new ChaosEngine({ seed: 1 });
    const fake = new FakeEffect("drift");
    engine.register(fake);
    engine.applyConfig("drift", { enabled: true });
    engine.setActive(true);
    frameAt(engine, 16);

    engine.panic();
    const d = frameAt(engine, 32);

    expect(engine.isPanicked()).toBe(true);
    expect(d.primaryOffset).toEqual({ x: 0, y: 0 });
    expect(d.activeContributors).toEqual([]);
    expect(fake.cleaned).toBe(true);
  });

  it("panic bypass holds even with every effect fully loaded", () => {
    const engine = new ChaosEngine({ seed: 7 });
    const ids: EffectId[] = ["imprecision", "triplets", "lag", "drift", "overshoot"];
    for (const id of ids) {
      const f = new FakeEffect(id);
      engine.register(f);
      engine.applyConfig(id, { enabled: true, intensity: 1, probability: 1 });
    }
    engine.setActive(true);
    engine.setIntensity(1);
    engine.panic();
    const d = frameAt(engine, 100);
    expect(d.primaryOffset).toEqual({ x: 0, y: 0 });
  });

  it("returns identity when inactive", () => {
    const engine = new ChaosEngine();
    const fake = new FakeEffect("drift");
    engine.register(fake);
    engine.applyConfig("drift", { enabled: true });
    engine.setActive(false);
    expect(frameAt(engine, 16).primaryOffset).toEqual({ x: 0, y: 0 });
  });

  it("auto-disables after the max session time", () => {
    const engine = new ChaosEngine({ seed: 1, maxSessionMs: 1000 });
    const fake = new FakeEffect("drift");
    engine.register(fake);
    engine.applyConfig("drift", { enabled: true });
    engine.setActive(true);

    expect(frameAt(engine, 0).primaryOffset.x).toBe(10);
    const expired = frameAt(engine, 1500);
    expect(expired.primaryOffset).toEqual({ x: 0, y: 0 });
    expect(engine.isExpired()).toBe(true);
  });

  it("applyPreset enables exactly the preset's effects", () => {
    const engine = new ChaosEngine();
    engine.applyPreset(PRESETS["mildly-annoying"]);
    expect(engine.getConfig("imprecision").enabled).toBe(true);
    expect(engine.getConfig("drift").enabled).toBe(true);
    expect(engine.getConfig("triplets").enabled).toBe(false);
    expect(engine.getIntensity()).toBe(0.3);
  });

  it("composes click transforms on pointer down, empty when inactive", () => {
    const engine = new ChaosEngine();
    const fake = new FakeEffect("betrayal");
    engine.register(fake);
    engine.applyConfig("betrayal", { enabled: true });
    engine.setActive(true);

    const t = engine.pointerDown({
      now: 10,
      real: { x: 0, y: 0 },
      targets: [],
      viewport,
      button: 0,
      pointerType: "mouse",
    });
    expect(t.offset).toEqual({ x: 5, y: 5 });

    engine.setActive(false);
    const t2 = engine.pointerDown({
      now: 20,
      real: { x: 0, y: 0 },
      targets: [],
      viewport,
      button: 0,
      pointerType: "mouse",
    });
    expect(t2).toEqual({});
  });

  it("skips effects whose proximity trigger is not satisfied", () => {
    const engine = new ChaosEngine();
    const fake = new FakeEffect("repulsion");
    engine.register(fake);
    engine.applyConfig("repulsion", {
      enabled: true,
      triggers: { onProximityBelow: 10 },
    });
    engine.setActive(true);
    // No targets → nearestDistance is Infinity → not eligible.
    expect(frameAt(engine, 16).primaryOffset).toEqual({ x: 0, y: 0 });
  });

  it("releases close-button evasion after three attempts", () => {
    const engine = new ChaosEngine();
    expect(engine.isCloseEvasionReleased()).toBe(false);
    engine.recordCloseAttempt();
    engine.recordCloseAttempt();
    expect(engine.isCloseEvasionReleased()).toBe(false);
    engine.recordCloseAttempt();
    expect(engine.isCloseEvasionReleased()).toBe(true);
  });

  it("reset cleans up effects and clears panic", () => {
    const engine = new ChaosEngine();
    const fake = new FakeEffect("drift");
    engine.register(fake);
    engine.panic();
    engine.reset();
    expect(fake.cleaned).toBe(true);
    expect(engine.isPanicked()).toBe(false);
  });
});
