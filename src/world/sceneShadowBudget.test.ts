import { describe, expect, it } from 'vitest';

import { SHADOW_OFF_DISTANCE, SHADOW_ON_DISTANCE, shouldCastSceneShadows } from './sceneShadowBudget';

describe('scene shadow budget', () => {
  it('casts near the player and stops far away', () => {
    expect(shouldCastSceneShadows(8, false)).toBe(true);
    expect(shouldCastSceneShadows(40, true)).toBe(false);
  });

  it('has hysteresis, so a player standing at the boundary does not make shadows flicker', () => {
    const between = (SHADOW_ON_DISTANCE + SHADOW_OFF_DISTANCE) / 2;
    expect(shouldCastSceneShadows(between, true)).toBe(true);
    expect(shouldCastSceneShadows(between, false)).toBe(false);
  });
});
