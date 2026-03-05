import { MathUtils } from 'three';

import { WORLD_BOUNDS, WORLD_WATER_BODIES } from './constants';
import {
  OCEAN_LEVEL,
  getIslandDistanceNormalized,
  getLakeDistance,
  getTerrainHeight,
  isPointWalkable,
} from './terrain';

import type { CircleObstacle, CollisionObstacle } from '../engine/movement';

export interface ScatterPoint {
  x: number;
  z: number;
  seed: number;
}

export interface RockPoint extends ScatterPoint {
  size: number;
}

export const SPAWN_HUB_RADIUS = 8.4;
export const TREE_TRUNK_RADIUS = 0.27;
export const TREE_TRUNK_HEIGHT = 2.1;
export const TREE_COLLIDER_BUFFER = 0.12;
export const TREE_COLLIDER_RADIUS = TREE_TRUNK_RADIUS + TREE_COLLIDER_BUFFER;
export const ROCK_CORE_COLLIDER_SCALE = 0.72;
export const ROCK_COLLIDER_BUFFER = 0.04;

export const ROAD_PATH_NETWORK_XZ: Array<Array<[number, number]>> = [
  [
    [0, 0],
    [0, -10],
    [0, -22],
    [0, -35],
    [0, -44],
  ],
  [
    [0, 0],
    [0, 10],
    [-1, 20],
    [-4, 29],
    [-10, 37],
    [-14, 43],
  ],
  [
    [0, 0],
    [-8, -10],
    [-12, -27],
    [-20, -37],
    [-29, -42],
  ],
  [
    [0, 0],
    [7, -12],
    [11, -27],
    [18, -39],
    [27, -44],
  ],
  [
    [0, 0],
    [-11, 7],
    [-23, 14],
    [-35, 22],
    [-40, 24],
  ],
  [
    [0, 0],
    [10, 6],
    [21, 11],
    [33, 11],
    [44, 12],
  ],
  [
    [-12, -27],
    [-7, -14],
    [3, -3],
    [15, 4],
    [28, 9],
    [38, 16],
  ],
  [
    [-23, 14],
    [-9, 12],
    [7, 9],
    [21, 8],
    [35, 9],
  ],
];

function createRandom(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  };
}

function sqrDistance(aX: number, aZ: number, bX: number, bZ: number): number {
  const dx = aX - bX;
  const dz = aZ - bZ;
  return dx * dx + dz * dz;
}

function pointToSegmentDistance(
  pointX: number,
  pointZ: number,
  startX: number,
  startZ: number,
  endX: number,
  endZ: number,
): number {
  const vx = endX - startX;
  const vz = endZ - startZ;
  const wx = pointX - startX;
  const wz = pointZ - startZ;
  const segmentLengthSquared = vx * vx + vz * vz;

  if (segmentLengthSquared === 0) {
    return Math.hypot(pointX - startX, pointZ - startZ);
  }

  const t = MathUtils.clamp((wx * vx + wz * vz) / segmentLengthSquared, 0, 1);
  const projectionX = startX + t * vx;
  const projectionZ = startZ + t * vz;
  return Math.hypot(pointX - projectionX, pointZ - projectionZ);
}

function distanceToRoad(pointX: number, pointZ: number): number {
  let minDistance = Number.POSITIVE_INFINITY;

  for (const polyline of ROAD_PATH_NETWORK_XZ) {
    for (let index = 0; index < polyline.length - 1; index += 1) {
      const [startX, startZ] = polyline[index] ?? [0, 0];
      const [endX, endZ] = polyline[index + 1] ?? [0, 0];
      const distance = pointToSegmentDistance(pointX, pointZ, startX, startZ, endX, endZ);
      minDistance = Math.min(minDistance, distance);
    }
  }

  return minDistance;
}

function isNearLake(pointX: number, pointZ: number, padding: number): boolean {
  return WORLD_WATER_BODIES.some((body) => getLakeDistance(body, pointX, pointZ) < 1 + padding);
}

function generateScatterPoints({
  count,
  seed,
  minDistance,
  avoid,
}: {
  count: number;
  seed: number;
  minDistance: number;
  avoid: (x: number, z: number) => boolean;
}): ScatterPoint[] {
  const rand = createRandom(seed);
  const points: ScatterPoint[] = [];
  const minDistanceSquared = minDistance * minDistance;
  const margin = 2.2;

  const minX = WORLD_BOUNDS.minX + margin;
  const maxX = WORLD_BOUNDS.maxX - margin;
  const minZ = WORLD_BOUNDS.minZ + margin;
  const maxZ = WORLD_BOUNDS.maxZ - margin;

  for (let attempts = 0; attempts < 24000 && points.length < count; attempts += 1) {
    const x = MathUtils.lerp(minX, maxX, rand());
    const z = MathUtils.lerp(minZ, maxZ, rand());

    if (avoid(x, z)) {
      continue;
    }

    let tooClose = false;
    for (const point of points) {
      if (sqrDistance(x, z, point.x, point.z) < minDistanceSquared) {
        tooClose = true;
        break;
      }
    }

    if (tooClose) {
      continue;
    }

    points.push({ x, z, seed: rand() * 1000 });
  }

  return points;
}

function isInNeighborhood(pointX: number, pointZ: number): boolean {
  return Math.hypot(pointX, pointZ) < SPAWN_HUB_RADIUS + 1.8;
}

function isGroundedPlacement(pointX: number, pointZ: number, radiusPadding = 0.38): boolean {
  return isPointWalkable(pointX, pointZ, radiusPadding);
}

export const TREE_POINTS: ScatterPoint[] = generateScatterPoints({
  count: 128,
  seed: 1701,
  minDistance: 2.75,
  avoid: (x, z) =>
    !isGroundedPlacement(x, z, 0.44) ||
    isNearLake(x, z, 0.38) ||
    distanceToRoad(x, z) < 1.75 ||
    isInNeighborhood(x, z) ||
    getIslandDistanceNormalized(x, z) > 0.9,
});

export const BUSH_POINTS: ScatterPoint[] = generateScatterPoints({
  count: 92,
  seed: 2409,
  minDistance: 2.05,
  avoid: (x, z) =>
    !isGroundedPlacement(x, z, 0.34) ||
    isNearLake(x, z, 0.28) ||
    distanceToRoad(x, z) < 1.2 ||
    isInNeighborhood(x, z) ||
    getIslandDistanceNormalized(x, z) > 0.94,
});

export const FLOWER_POINTS: ScatterPoint[] = generateScatterPoints({
  count: 132,
  seed: 3121,
  minDistance: 1.3,
  avoid: (x, z) =>
    !isGroundedPlacement(x, z, 0.22) ||
    isNearLake(x, z, 0.2) ||
    Math.hypot(x, z) < SPAWN_HUB_RADIUS + 2.4 ||
    getIslandDistanceNormalized(x, z) > 0.95,
});

const rawBoulderPoints: ScatterPoint[] = generateScatterPoints({
  count: 46,
  seed: 4321,
  minDistance: 3.5,
  avoid: (x, z) =>
    !isGroundedPlacement(x, z, 0.5) ||
    isNearLake(x, z, 0.35) ||
    distanceToRoad(x, z) < 1.35 ||
    isInNeighborhood(x, z) ||
    getIslandDistanceNormalized(x, z) > 0.91,
});

export const BOULDER_POINTS: RockPoint[] = rawBoulderPoints.map((point) => ({
  ...point,
  size: 0.74 + ((point.seed * 0.0019) % 0.56),
}));

const rawCoastalRockPoints: ScatterPoint[] = generateScatterPoints({
  count: 128,
  seed: 5123,
  minDistance: 1.4,
  avoid: (x, z) => {
    const islandDistance = getIslandDistanceNormalized(x, z);
    const groundHeight = getTerrainHeight(x, z);

    if (islandDistance < 0.77 || islandDistance > 0.92) {
      return true;
    }

    if (groundHeight <= OCEAN_LEVEL + 0.55 || groundHeight >= OCEAN_LEVEL + 1.22) {
      return true;
    }

    return isNearLake(x, z, 0.5) || distanceToRoad(x, z) < 1.2 || isInNeighborhood(x, z);
  },
});

export const COASTAL_ROCK_POINTS: RockPoint[] = rawCoastalRockPoints.map((point) => ({
  ...point,
  size: 0.42 + ((point.seed * 0.0022) % 0.44),
}));

function getRockCollisionRadius(visualSize: number): number {
  return visualSize * ROCK_CORE_COLLIDER_SCALE + ROCK_COLLIDER_BUFFER;
}

function createTreeAndRockCollisionObstacles(): CircleObstacle[] {
  const treeObstacles = TREE_POINTS.map((point) => ({
    centerX: point.x,
    centerZ: point.z,
    radius: TREE_COLLIDER_RADIUS,
  }));

  const boulderObstacles = [...BOULDER_POINTS, ...COASTAL_ROCK_POINTS].map((point) => ({
    centerX: point.x,
    centerZ: point.z,
    radius: getRockCollisionRadius(point.size),
  }));

  return [...treeObstacles, ...boulderObstacles];
}

export const WORLD_COLLISION_OBSTACLES: CollisionObstacle[] = [
  ...createTreeAndRockCollisionObstacles(),
];
