import { describe, expect, it } from 'vitest';

import { resolvePlayerMovement } from './movement';

import type { RectObstacle, WorldBounds } from './movement';

const bounds: WorldBounds = {
  minX: -10,
  maxX: 10,
  minZ: -10,
  maxZ: 10,
};

const obstacles: RectObstacle[] = [
  {
    minX: -2,
    maxX: 2,
    minZ: -2,
    maxZ: 2,
  },
];

describe('resolvePlayerMovement', () => {
  it('clamps movement to world bounds', () => {
    const next = resolvePlayerMovement(
      { x: 9.5, y: 0.8, z: 9.5 },
      { x: 4, z: 4 },
      bounds,
      [],
      0.7,
    );

    expect(next.x).toBeLessThanOrEqual(bounds.maxX - 0.7);
    expect(next.z).toBeLessThanOrEqual(bounds.maxZ - 0.7);
  });

  it('blocks movement into obstacles', () => {
    const next = resolvePlayerMovement(
      { x: -2.8, y: 0.8, z: 0 },
      { x: 2, z: 0 },
      bounds,
      obstacles,
      0.7,
    );

    expect(next.x).toBeCloseTo(-2.8);
  });
});
