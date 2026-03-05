import { describe, expect, it } from 'vitest';

import { blendMovementSpeed, resolveMovementSpeed } from './playerSpeed';

describe('player movement speed', () => {
  it('uses walk speed by default when keyboard mode is enabled', () => {
    expect(resolveMovementSpeed(true, false, { walk: 8, run: 13 })).toBe(8);
  });

  it('uses run speed when run modifier is active', () => {
    expect(resolveMovementSpeed(true, true, { walk: 8, run: 13 })).toBe(13);
  });

  it('returns zero speed when keyboard mode is disabled', () => {
    expect(resolveMovementSpeed(false, true, { walk: 8, run: 13 })).toBe(0);
  });

  it('blends speed toward target smoothly', () => {
    const blended = blendMovementSpeed(8, 13, 0.1, 9);
    expect(blended).toBeGreaterThan(8);
    expect(blended).toBeLessThan(13);
  });
});
