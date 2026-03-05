import type { WorldBounds } from '../engine/movement';
import type { WorldAnchor } from '../types/experience';

export interface WaterBodyDefinition {
  id: string;
  centerX: number;
  centerZ: number;
  radiusX: number;
  radiusZ: number;
  rotation: number;
  seed: number;
}

export const WORLD_BOUNDS: WorldBounds = {
  minX: -86,
  maxX: 86,
  minZ: -86,
  maxZ: 86,
};

export const WORLD_WATER_BODIES: WaterBodyDefinition[] = [
  {
    id: 'willow-crescent',
    centerX: -32,
    centerZ: -20,
    radiusX: 6.4,
    radiusZ: 4.9,
    rotation: -0.42,
    seed: 11,
  },
  {
    id: 'sunset-mirror',
    centerX: 34,
    centerZ: -24,
    radiusX: 6.8,
    radiusZ: 4.6,
    rotation: 0.31,
    seed: 23,
  },
  {
    id: 'fern-basin',
    centerX: -26,
    centerZ: 31,
    radiusX: 6.2,
    radiusZ: 4.4,
    rotation: 0.62,
    seed: 37,
  },
  {
    id: 'starlight-pool',
    centerX: 31,
    centerZ: 27,
    radiusX: 6.5,
    radiusZ: 4.7,
    rotation: -0.27,
    seed: 51,
  },
  {
    id: 'moss-heart-pond',
    centerX: 4,
    centerZ: 38,
    radiusX: 5.4,
    radiusZ: 4,
    rotation: 0.08,
    seed: 63,
  },
];

export const PLAYER_START: WorldAnchor = {
  x: 0,
  y: 0.8,
  z: 0,
};

const MAX_LAKE_RADIUS_FACTOR = 1.2;

function ensureWaterBodiesDoNotOverlap(bodies: WaterBodyDefinition[]): void {
  for (let leftIndex = 0; leftIndex < bodies.length; leftIndex += 1) {
    const left = bodies[leftIndex];
    if (!left) {
      continue;
    }

    const leftRadius = Math.max(left.radiusX, left.radiusZ) * MAX_LAKE_RADIUS_FACTOR;
    for (let rightIndex = leftIndex + 1; rightIndex < bodies.length; rightIndex += 1) {
      const right = bodies[rightIndex];
      if (!right) {
        continue;
      }

      const rightRadius = Math.max(right.radiusX, right.radiusZ) * MAX_LAKE_RADIUS_FACTOR;
      const centerDistance = Math.hypot(left.centerX - right.centerX, left.centerZ - right.centerZ);

      if (centerDistance <= leftRadius + rightRadius + 2.4) {
        throw new Error(
          `Water body overlap detected between "${left.id}" and "${right.id}". Move lake anchors farther apart.`,
        );
      }
    }
  }
}

ensureWaterBodiesDoNotOverlap(WORLD_WATER_BODIES);
