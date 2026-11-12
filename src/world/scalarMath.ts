/**
 * Scalar helpers with the exact formulas of three.js MathUtils (r183). Terrain and biome code use
 * these instead of importing three, so the workbench runtime and HUD can load without the 3D engine.
 * scalarMath.test.ts checks bit-for-bit equality against MathUtils.
 */

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function lerp(x: number, y: number, t: number): number {
  return (1 - t) * x + t * y;
}

export function smoothstep(x: number, min: number, max: number): number {
  if (x <= min) return 0;
  if (x >= max) return 1;
  const t = (x - min) / (max - min);
  return t * t * (3 - 2 * t);
}

export function smootherstep(x: number, min: number, max: number): number {
  if (x <= min) return 0;
  if (x >= max) return 1;
  const t = (x - min) / (max - min);
  return t * t * t * (t * (t * 6 - 15) + 10);
}
