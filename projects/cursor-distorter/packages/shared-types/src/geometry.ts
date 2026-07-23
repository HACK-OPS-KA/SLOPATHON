/** A 2D vector in sandbox/screen pixel coordinates. */
export interface Vec2 {
  x: number;
  y: number;
}

/** An axis-aligned rectangle in sandbox coordinates. */
export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export const ORIGIN: Vec2 = Object.freeze({ x: 0, y: 0 });

export function vec(x = 0, y = 0): Vec2 {
  return { x, y };
}

export function addVec(a: Vec2, b: Vec2): Vec2 {
  return { x: a.x + b.x, y: a.y + b.y };
}

export function subVec(a: Vec2, b: Vec2): Vec2 {
  return { x: a.x - b.x, y: a.y - b.y };
}

export function scaleVec(a: Vec2, s: number): Vec2 {
  return { x: a.x * s, y: a.y * s };
}

export function lengthOf(a: Vec2): number {
  return Math.hypot(a.x, a.y);
}

export function distance(a: Vec2, b: Vec2): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

export function clampVec(a: Vec2, maxLen: number): Vec2 {
  const len = lengthOf(a);
  if (len <= maxLen || len === 0) return a;
  const s = maxLen / len;
  return { x: a.x * s, y: a.y * s };
}

export function rectCenter(r: Rect): Vec2 {
  return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
}

/** Shortest distance from a point to the border of a rect (0 if inside). */
export function distanceToRect(p: Vec2, r: Rect): number {
  const dx = Math.max(r.x - p.x, 0, p.x - (r.x + r.width));
  const dy = Math.max(r.y - p.y, 0, p.y - (r.y + r.height));
  return Math.hypot(dx, dy);
}

export function pointInRect(p: Vec2, r: Rect): boolean {
  return p.x >= r.x && p.x <= r.x + r.width && p.y >= r.y && p.y <= r.y + r.height;
}
