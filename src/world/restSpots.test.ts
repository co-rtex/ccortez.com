import { describe, expect, it } from 'vitest';

import { isInsideObstacle } from '../engine/movement';
import { WORLD_COLLISION_OBSTACLES } from './biome';
import { WORLD_WATER_BODIES } from './constants';
import { SCENIC_FACING_YAW } from './scenic';
import { getNearestLakeShoreSignedDistance, isPointWaterBlocked, isPointWalkable } from './terrain';
import { SCENIC_REST_SPOTS, getRestSpotExitAnchor, getRestSpotSeatAnchor } from './restSpots';

describe('scenic rest spots', () => {
  it('creates exactly one bench per lake', () => {
    expect(SCENIC_REST_SPOTS.length).toBe(WORLD_WATER_BODIES.length);

    const lakeIds = new Set(SCENIC_REST_SPOTS.map((spot) => spot.lakeId));
    expect(lakeIds.size).toBe(WORLD_WATER_BODIES.length);
  });

  it('keeps seat and exit anchors on walkable non-water terrain', () => {
    for (const spot of SCENIC_REST_SPOTS) {
      const seatAnchor = getRestSpotSeatAnchor(spot);
      const exitAnchor = getRestSpotExitAnchor(spot);

      expect(isPointWalkable(seatAnchor.x, seatAnchor.z, 0.3), `${spot.id} seat should be walkable`).toBe(true);
      expect(isPointWaterBlocked(seatAnchor.x, seatAnchor.z, 0.3), `${spot.id} seat should be out of water`).toBe(
        false,
      );

      expect(isPointWalkable(exitAnchor.x, exitAnchor.z, 0.42), `${spot.id} exit should be walkable`).toBe(true);
      expect(isPointWaterBlocked(exitAnchor.x, exitAnchor.z, 0.42), `${spot.id} exit should be out of water`).toBe(
        false,
      );
    }
  });

  it('uses one shared global orientation for all benches', () => {
    for (const spot of SCENIC_REST_SPOTS) {
      expect(spot.seat.rotationY).toBeCloseTo(SCENIC_FACING_YAW, 8);
    }
  });

  it('keeps bench footprint clear of tree and rock colliders', () => {
    for (const spot of SCENIC_REST_SPOTS) {
      const seatAnchor = getRestSpotSeatAnchor(spot);
      const collides = WORLD_COLLISION_OBSTACLES.some((obstacle) =>
        isInsideObstacle({ x: seatAnchor.x, z: seatAnchor.z }, obstacle, spot.benchFootprintRadius),
      );
      expect(collides, `${spot.id} should not overlap obstacle colliders`).toBe(false);
    }
  });

  it('keeps each bench near a shoreline as a true rest spot', () => {
    for (const spot of SCENIC_REST_SPOTS) {
      const seatAnchor = getRestSpotSeatAnchor(spot);
      const shoreDistance = getNearestLakeShoreSignedDistance(seatAnchor.x, seatAnchor.z);
      expect(shoreDistance, `${spot.id} should remain outside water`).toBeGreaterThan(0);
      expect(shoreDistance, `${spot.id} should stay near shore`).toBeLessThanOrEqual(2.2);
    }
  });
});
