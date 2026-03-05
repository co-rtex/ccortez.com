import { describe, expect, it } from 'vitest';

import { isInsideObstacle } from '../engine/movement';
import { WORLD_COLLISION_OBSTACLES } from './biome';
import { WORLD_WATER_BODIES } from './constants';
import { getNearestLakeShoreSignedDistance, isPointWaterBlocked, isPointWalkable } from './terrain';
import { AMBIENT_BIRD_TRACKS, AMBIENT_BUNNY_ANCHORS, LAKE_FAUNA_PLANS } from './ambientLife';

describe('ambient life generation', () => {
  it('places bunny anchors on valid walkable ground away from water', () => {
    expect(AMBIENT_BUNNY_ANCHORS.length).toBeGreaterThan(8);

    for (const anchor of AMBIENT_BUNNY_ANCHORS) {
      expect(isPointWalkable(anchor.x, anchor.z, 0.22), `bunny ${anchor.id} should be walkable`).toBe(true);
      expect(isPointWaterBlocked(anchor.x, anchor.z, 0.22), `bunny ${anchor.id} should not be in water`).toBe(false);
      const overlap = WORLD_COLLISION_OBSTACLES.some((obstacle) =>
        isInsideObstacle({ x: anchor.x, z: anchor.z }, obstacle, 0.45),
      );
      expect(overlap, `bunny ${anchor.id} should not overlap hard obstacles`).toBe(false);
    }
  });

  it('creates subtle sky bird tracks in valid altitude ranges', () => {
    expect(AMBIENT_BIRD_TRACKS.length).toBeGreaterThanOrEqual(8);
    for (const track of AMBIENT_BIRD_TRACKS) {
      expect(track.altitude).toBeGreaterThanOrEqual(18);
      expect(track.altitude).toBeLessThanOrEqual(34);
    }
  });

  it('assigns lake fauna plan to every lake', () => {
    expect(LAKE_FAUNA_PLANS.length).toBe(WORLD_WATER_BODIES.length);

    const knownLakeIds = new Set(WORLD_WATER_BODIES.map((lake) => lake.id));
    for (const plan of LAKE_FAUNA_PLANS) {
      expect(knownLakeIds.has(plan.lakeId)).toBe(true);
      expect(plan.kind === 'ducks' || plan.kind === 'fish').toBe(true);
    }
  });

  it('keeps lakes with fauna near accessible shoreline context', () => {
    for (const lake of WORLD_WATER_BODIES) {
      const shoreDistance = getNearestLakeShoreSignedDistance(lake.centerX, lake.centerZ);
      expect(shoreDistance).toBeLessThan(0);
    }
  });
});
