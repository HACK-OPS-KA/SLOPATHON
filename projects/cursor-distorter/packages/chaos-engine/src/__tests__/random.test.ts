import { describe, it, expect } from "vitest";
import { SeededRandom, hashString } from "../random";

describe("SeededRandom", () => {
  it("is deterministic for a given seed", () => {
    const a = new SeededRandom(1234);
    const b = new SeededRandom(1234);
    const seqA = Array.from({ length: 50 }, () => a.next());
    const seqB = Array.from({ length: 50 }, () => b.next());
    expect(seqA).toEqual(seqB);
  });

  it("produces different sequences for different seeds", () => {
    const a = new SeededRandom("suffering");
    const b = new SeededRandom("relief");
    expect(a.next()).not.toBe(b.next());
  });

  it("resetStream replays the exact same sequence", () => {
    const r = new SeededRandom(99);
    const first = Array.from({ length: 10 }, () => r.next());
    r.resetStream();
    const second = Array.from({ length: 10 }, () => r.next());
    expect(second).toEqual(first);
  });

  it("range stays within [min, max)", () => {
    const r = new SeededRandom(7);
    for (let i = 0; i < 1000; i++) {
      const v = r.range(-5, 5);
      expect(v).toBeGreaterThanOrEqual(-5);
      expect(v).toBeLessThan(5);
    }
  });

  it("int is inclusive of both bounds", () => {
    const r = new SeededRandom(42);
    const seen = new Set<number>();
    for (let i = 0; i < 2000; i++) seen.add(r.int(1, 6));
    expect([...seen].sort()).toEqual([1, 2, 3, 4, 5, 6]);
  });

  it("bool respects p=0 and p=1", () => {
    const r = new SeededRandom(3);
    for (let i = 0; i < 100; i++) {
      expect(r.bool(0)).toBe(false);
      expect(r.bool(1)).toBe(true);
    }
  });

  it("pick throws on empty array", () => {
    const r = new SeededRandom(1);
    expect(() => r.pick([])).toThrow();
  });

  it("fork is deterministic per label", () => {
    const p1 = new SeededRandom(500);
    const p2 = new SeededRandom(500);
    const f1 = p1.fork("imprecision");
    const f2 = p2.fork("imprecision");
    expect(Array.from({ length: 5 }, () => f1.next())).toEqual(
      Array.from({ length: 5 }, () => f2.next()),
    );
    const g1 = p1.fork("drift");
    expect(f1.next()).not.toBe(g1.next());
  });

  it("hashString is stable", () => {
    expect(hashString("cursor")).toBe(hashString("cursor"));
    expect(hashString("cursor")).not.toBe(hashString("Cursor"));
  });
});
