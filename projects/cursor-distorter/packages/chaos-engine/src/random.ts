import type { RandomStream } from "@cursor-distorter/shared-types";

/** Deterministic 32-bit string hash (xmur3 finalizer), used to seed streams. */
export function hashString(str: string): number {
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  h = Math.imul(h ^ (h >>> 16), 2246822507);
  h = Math.imul(h ^ (h >>> 13), 3266489909);
  h ^= h >>> 16;
  return h >>> 0;
}

/**
 * A small, fast, fully deterministic PRNG (mulberry32). Same seed → same sequence,
 * which is what powers "Replay this exact suffering".
 */
export class SeededRandom implements RandomStream {
  private state: number;
  readonly seed: number;

  constructor(seed: number | string = 0x1a2b3c4d) {
    const s = typeof seed === "number" ? seed >>> 0 : hashString(seed);
    this.seed = s === 0 ? 0x9e3779b9 : s;
    this.state = this.seed;
  }

  /** Reset the stream back to its original seed. */
  resetStream(): void {
    this.state = this.seed;
  }

  next(): number {
    let a = this.state;
    a = (a + 0x6d2b79f5) | 0;
    this.state = a >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  range(min: number, max: number): number {
    return min + (max - min) * this.next();
  }

  int(min: number, max: number): number {
    return Math.floor(this.range(min, max + 1));
  }

  bool(p = 0.5): boolean {
    if (p <= 0) return false;
    if (p >= 1) return true;
    return this.next() < p;
  }

  pick<T>(items: readonly T[]): T {
    if (items.length === 0) throw new Error("pick() requires a non-empty array");
    return items[Math.floor(this.next() * items.length)]!;
  }

  gaussian(mean = 0, stddev = 1): number {
    const u1 = Math.max(this.next(), 1e-9);
    const u2 = this.next();
    const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    return mean + stddev * z;
  }

  onCircle(radius: number): { x: number; y: number } {
    const angle = this.next() * Math.PI * 2;
    return { x: Math.cos(angle) * radius, y: Math.sin(angle) * radius };
  }

  fork(label: string): SeededRandom {
    return new SeededRandom((this.state ^ hashString(label)) >>> 0);
  }
}

/** Convenience factory that accepts an optional seed. */
export function createRandom(seed?: number | string): SeededRandom {
  return new SeededRandom(seed);
}
