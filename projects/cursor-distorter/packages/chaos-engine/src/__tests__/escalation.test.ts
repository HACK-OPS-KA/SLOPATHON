import { describe, it, expect } from "vitest";
import {
  EscalationController,
  CATASTROPHE_TIMELINE,
} from "../escalation";
import type { EscalationStage } from "@cursor-distorter/shared-types";

const timeline: EscalationStage[] = [
  { at: 0, label: "a" },
  { at: 1, label: "b" },
  { at: 2, label: "c" },
];

describe("EscalationController", () => {
  it("fires each stage exactly once as time crosses it", () => {
    const c = new EscalationController(timeline);
    c.start(0);
    expect(c.tick(0).map((s) => s.label)).toEqual(["a"]);
    expect(c.tick(500).map((s) => s.label)).toEqual([]);
    expect(c.tick(1000).map((s) => s.label)).toEqual(["b"]);
    expect(c.tick(2500).map((s) => s.label)).toEqual(["c"]);
    expect(c.done).toBe(true);
    expect(c.tick(9000)).toEqual([]);
  });

  it("catches up multiple stages after a long gap", () => {
    const c = new EscalationController(timeline);
    c.start(0);
    expect(c.tick(5000).map((s) => s.label)).toEqual(["a", "b", "c"]);
  });

  it("does nothing before start()", () => {
    const c = new EscalationController(timeline);
    expect(c.tick(9999)).toEqual([]);
    expect(c.isRunning()).toBe(false);
  });

  it("catastrophe timeline is ordered and spans three minutes", () => {
    const ats = CATASTROPHE_TIMELINE.map((s) => s.at);
    expect(ats).toEqual([...ats].sort((a, b) => a - b));
    expect(Math.max(...ats)).toBe(180);
  });
});
