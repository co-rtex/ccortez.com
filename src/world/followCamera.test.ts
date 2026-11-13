import { describe, expect, it } from 'vitest';

import { getBenchFramingWeight, getFollowLookAhead, getPanelViewOffset } from './followCamera';

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

describe('view offset beside an open panel', () => {
  const rect = (left: number, top: number, width: number, height: number) => ({
    left,
    top,
    width,
    height,
    right: left + width,
    bottom: top + height,
  });
  const canvas = rect(0, 0, 1440, 900);

  it('moves the view left by half a side panel', () => {
    expect(getPanelViewOffset(canvas, rect(1010, 0, 430, 900))).toEqual({ x: 215, y: 0 });
  });

  it('moves the view up by half a bottom sheet', () => {
    const phone = rect(0, 0, 390, 844);
    const sheet = rect(0, 844 * 0.4, 390, 844 * 0.6);
    expect(getPanelViewOffset(phone, sheet).x).toBe(0);
    expect(getPanelViewOffset(phone, sheet).y).toBeCloseTo((844 * 0.6) / 2, 6);
  });

  it('does nothing when the panel covers the whole canvas', () => {
    expect(getPanelViewOffset(canvas, rect(0, 0, 1440, 900))).toEqual({ x: 0, y: 0 });
  });
});
