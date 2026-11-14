import { describe, expect, it } from 'vitest';

import { getOcclusionStrength } from './occlusionDither';

describe('foliage occlusion dither', () => {
  const camera = { x: 0, y: 10, z: 15 };
  const player = { x: 0, y: 0, z: 0 };

  it('fades canopy on the line between camera and player', () => {
    expect(getOcclusionStrength({ x: 0, y: 5.5, z: 7.5 }, camera, player)).toBe(1);
  });

  it('leaves canopy beside the line or behind the player alone', () => {
    expect(getOcclusionStrength({ x: 6, y: 5, z: 7.5 }, camera, player)).toBe(0);
    expect(getOcclusionStrength({ x: 0, y: 0.9, z: -4 }, camera, player)).toBe(0);
  });
});
