import { describe, expect, it } from 'vitest';

import {
  BOULDER_POINTS,
  BUSH_POINTS,
  COASTAL_ROCK_POINTS,
  FLOWER_POINTS,
  ROAD_PATH_NETWORK_XZ,
  ROCK_COLLIDER_BUFFER,
  ROCK_CORE_COLLIDER_SCALE,
  TREE_COLLIDER_BUFFER,
  TREE_COLLIDER_RADIUS,
  TREE_POINTS,
  TREE_TRUNK_RADIUS,
  WORLD_COLLISION_OBSTACLES,
} from './biome';
import type { CircleObstacle } from '../engine/movement';
import { OCEAN_LEVEL, getTerrainHeight, isPointWaterBlocked, isPointWalkable } from './terrain';

function samplePathPoints(polyline: Array<[number, number]>): Array<{ x: number; z: number }> {
  const points: Array<{ x: number; z: number }> = [];

  for (let index = 0; index < polyline.length - 1; index += 1) {
    const [startX, startZ] = polyline[index] ?? [0, 0];
    const [endX, endZ] = polyline[index + 1] ?? [0, 0];
    const distance = Math.hypot(endX - startX, endZ - startZ);
    const steps = Math.max(1, Math.ceil(distance / 1.25));

    for (let step = 0; step <= steps; step += 1) {
      const t = step / steps;
      points.push({
        x: startX + (endX - startX) * t,
        z: startZ + (endZ - startZ) * t,
      });
    }
  }

  return points;
}

describe('biome placement', () => {
  it('keeps trees, bushes, flowers, and boulders on walkable land', () => {
    for (const tree of TREE_POINTS) {
      expect(isPointWalkable(tree.x, tree.z, 0.42)).toBe(true);
    }

    for (const bush of BUSH_POINTS) {
      expect(isPointWalkable(bush.x, bush.z, 0.28)).toBe(true);
    }

    for (const flower of FLOWER_POINTS) {
      expect(isPointWalkable(flower.x, flower.z, 0.2)).toBe(true);
    }

    for (const boulder of BOULDER_POINTS) {
      expect(isPointWalkable(boulder.x, boulder.z, 0.5)).toBe(true);
    }
  });

  it('keeps coastal rocks near shore but above water level', () => {
    for (const rock of COASTAL_ROCK_POINTS) {
      const terrainY = getTerrainHeight(rock.x, rock.z);
      expect(terrainY).toBeGreaterThan(OCEAN_LEVEL + 0.1);
      expect(terrainY).toBeLessThan(OCEAN_LEVEL + 1.4);
    }
  });

  it('keeps neighborhood paths on walkable terrain', () => {
    for (const polyline of ROAD_PATH_NETWORK_XZ) {
      const samples = samplePathPoints(polyline);
      for (const sample of samples) {
        const walkable = isPointWalkable(sample.x, sample.z, 0.16);
        expect(
          walkable,
          `Non-walkable path sample at x=${sample.x.toFixed(2)} z=${sample.z.toFixed(2)}`,
        ).toBe(true);
      }
    }
  });

  it('keeps tree and rock anchor points out of water-blocked zones', () => {
    for (const tree of TREE_POINTS) {
      expect(isPointWaterBlocked(tree.x, tree.z, TREE_COLLIDER_RADIUS)).toBe(false);
    }

    for (const rock of [...BOULDER_POINTS, ...COASTAL_ROCK_POINTS]) {
      const rockRadius = rock.size * ROCK_CORE_COLLIDER_SCALE + ROCK_COLLIDER_BUFFER;
      expect(isPointWaterBlocked(rock.x, rock.z, rockRadius)).toBe(false);
    }
  });

  it('uses trunk-only colliders for trees (not canopy-sized)', () => {
    expect(TREE_COLLIDER_RADIUS).toBeCloseTo(TREE_TRUNK_RADIUS + TREE_COLLIDER_BUFFER, 8);
    expect(TREE_COLLIDER_RADIUS).toBeLessThanOrEqual(0.48);

    for (const tree of TREE_POINTS) {
      const treeCollider = WORLD_COLLISION_OBSTACLES.find((obstacle): obstacle is CircleObstacle => {
        if (!('radius' in obstacle)) {
          return false;
        }

        return obstacle.centerX === tree.x && obstacle.centerZ === tree.z;
      });

      expect(treeCollider, `Missing collider for tree at x=${tree.x.toFixed(2)} z=${tree.z.toFixed(2)}`).toBeDefined();
      expect(treeCollider?.radius).toBeCloseTo(TREE_COLLIDER_RADIUS, 8);
    }
  });

  it('uses core-only colliders for rocks (not full silhouette bounds)', () => {
    const allRocks = [...BOULDER_POINTS, ...COASTAL_ROCK_POINTS];

    for (const rock of allRocks) {
      const rockCollider = WORLD_COLLISION_OBSTACLES.find((obstacle): obstacle is CircleObstacle => {
        if (!('radius' in obstacle)) {
          return false;
        }

        return obstacle.centerX === rock.x && obstacle.centerZ === rock.z;
      });

      expect(rockCollider, `Missing collider for rock at x=${rock.x.toFixed(2)} z=${rock.z.toFixed(2)}`).toBeDefined();
      expect(rockCollider?.radius).toBeLessThan(rock.size);
      expect(rockCollider?.radius).toBeCloseTo(
        rock.size * ROCK_CORE_COLLIDER_SCALE + ROCK_COLLIDER_BUFFER,
        8,
      );
    }
  });
});
