import { describe, expect, it } from 'vitest';

import { getBenchFramingWeight, getFollowLookAhead } from './followCamera';

describe('follow camera look-ahead', () => {
  it('looks furthest ahead on wide screens and least on portrait phones', () => {
    expect(getFollowLookAhead(16 / 9)).toBeCloseTo(-6.2);
    expect(getFollowLookAhead(390 / 844)).toBeCloseTo(-1.2);
    expect(getFollowLookAhead(1)).toBeLessThan(getFollowLookAhead(0.8));
  });
});

describe('bench framing assist', () => {
  it('turns the look target toward a bench south of the player only', () => {
    expect(getBenchFramingWeight({ x: 0, z: 0 }, null)).toBe(0);
    expect(getBenchFramingWeight({ x: 0, z: 0 }, { x: 0, z: -4 })).toBe(0);
    expect(getBenchFramingWeight({ x: 0, z: 0 }, { x: 0, z: 4 })).toBe(1);
    const partial = getBenchFramingWeight({ x: 0, z: 0 }, { x: 4, z: 1.5 });
    expect(partial).toBeGreaterThan(0);
    expect(partial).toBeLessThan(1);
  });
});
