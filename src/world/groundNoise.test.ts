import { describe, expect, it } from 'vitest';

import { valueNoise2D } from './groundNoise';

describe('valueNoise2D', () => {
  it('stays within 0..1 and is deterministic', () => {
    for (let i = 0; i < 500; i += 1) {
      const x = i * 0.731 - 90;
      const z = i * 1.317 - 40;
      const value = valueNoise2D(x, z);
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThanOrEqual(1);
      expect(valueNoise2D(x, z)).toBe(value);
    }
  });

  it('changes smoothly between nearby samples', () => {
    for (let i = 0; i < 200; i += 1) {
      const x = i * 0.37;
      expect(Math.abs(valueNoise2D(x + 0.01, 3.2) - valueNoise2D(x, 3.2))).toBeLessThan(0.03);
    }
  });

  it('actually varies (not a flat field)', () => {
    const samples = Array.from({ length: 100 }, (_, i) => valueNoise2D(i * 1.7, i * 0.9));
    expect(Math.max(...samples) - Math.min(...samples)).toBeGreaterThan(0.5);
  });
});
