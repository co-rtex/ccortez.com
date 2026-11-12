import { MathUtils } from 'three';
import { describe, expect, it } from 'vitest';

import { clamp, lerp, smootherstep, smoothstep } from './scalarMath';

// Deterministic sample values, including edges and values outside the ranges.
const samples: number[] = [];
let seed = 12345;
for (let i = 0; i < 2000; i += 1) {
  seed = (Math.imul(seed, 1103515245) + 12345) >>> 0;
  samples.push((seed / 4294967296) * 40 - 20);
}
samples.push(0, 1, -1, 0.5, 2, -2, 1e-9, -1e-9);

describe('scalarMath matches three.js MathUtils exactly', () => {
  it('clamp', () => {
    for (const v of samples) expect(Object.is(clamp(v, -3, 7), MathUtils.clamp(v, -3, 7))).toBe(true);
  });

  it('lerp', () => {
    for (const v of samples) expect(Object.is(lerp(v, v * 1.7 + 3, 0.37), MathUtils.lerp(v, v * 1.7 + 3, 0.37))).toBe(true);
    for (const t of samples) expect(Object.is(lerp(-4.2, 9.1, t), MathUtils.lerp(-4.2, 9.1, t))).toBe(true);
  });

  it('smoothstep', () => {
    for (const v of samples) expect(Object.is(smoothstep(v, -5, 6.5), MathUtils.smoothstep(v, -5, 6.5))).toBe(true);
  });

  it('smootherstep', () => {
    for (const v of samples) expect(Object.is(smootherstep(v, -5, 6.5), MathUtils.smootherstep(v, -5, 6.5))).toBe(true);
  });
});
