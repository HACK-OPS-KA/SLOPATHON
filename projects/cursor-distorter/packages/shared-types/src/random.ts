/**
 * A deterministic, seedable random stream. Implemented in `chaos-engine`, but the
 * interface lives here so effects depend only on shared types. Every distortion draws
 * from a stream so a given seed reproduces "this exact suffering".
 */
export interface RandomStream {
  /** Uniform float in [0, 1). */
  next(): number;
  /** Uniform float in [min, max). */
  range(min: number, max: number): number;
  /** Uniform integer in [min, max] inclusive. */
  int(min: number, max: number): number;
  /** True with probability p (0..1). */
  bool(p?: number): boolean;
  /** Random element of a non-empty array. */
  pick<T>(items: readonly T[]): T;
  /** Approximate normal distribution sample. */
  gaussian(mean?: number, stddev?: number): number;
  /** A point on the unit circle scaled by `radius`. */
  onCircle(radius: number): { x: number; y: number };
  /** Derive an independent, labelled sub-stream (stable across frames for a label). */
  fork(label: string): RandomStream;
}
