import { MathUtils } from 'three';

import { WORLD_WATER_BODIES } from './constants';

import type { WaterBodyDefinition } from './constants';

const SHORE_RANGE = 0.5;
const INNER_PLAYABLE_DISTANCE = 0.8;
export const LAKE_SHORELINE_SAMPLE_DETAIL = 72;
export const SHORELINE_TOUCH_EPSILON = 0.03;
export const ISLAND_RADIUS_X = 68;
export const ISLAND_RADIUS_Z = 64;
const OCEAN_WALKABLE_FLOOR_OFFSET = 0.82;

export const OCEAN_LEVEL = -1.18;

function baseTerrainHeight(x: number, z: number): number {
  const macro = Math.sin(x * 0.028) * 0.52 + Math.cos(z * 0.032) * 0.48;
  const ridges = Math.sin((x + z) * 0.056) * 0.24 + Math.cos((x - z) * 0.062) * 0.2;
  const micro = Math.sin(x * 0.19 + z * 0.23) * 0.06;
  const mound = Math.exp(-(x * x + z * z) / 18000) * 0.62;
  return macro + ridges + micro + mound;
}

function getIslandPolarAngle(x: number, z: number): number {
  return Math.atan2(z / ISLAND_RADIUS_Z, x / ISLAND_RADIUS_X);
}

export function getIslandEdgeRadiusFactor(angle: number): number {
  const large = Math.sin(angle * 3.2 + 0.4) * 0.09;
  const medium = Math.cos(angle * 5.4 - 0.8) * 0.06;
  const small = Math.sin(angle * 8.1 + 1.3) * 0.04;
  return 1 + large + medium + small;
}

export function getIslandDistanceNormalized(x: number, z: number): number {
  const baseDistance = Math.hypot(x / ISLAND_RADIUS_X, z / ISLAND_RADIUS_Z);
  const radiusFactor = getIslandEdgeRadiusFactor(getIslandPolarAngle(x, z));
  return baseDistance / radiusFactor;
}

function applyIslandFalloff(height: number, x: number, z: number): number {
  const islandDistance = getIslandDistanceNormalized(x, z);
  const shoreline = MathUtils.smoothstep(islandDistance, 0.72, 0.96);
  const shelf = MathUtils.smoothstep(islandDistance, 0.94, 1.08);
  const abyss = MathUtils.smoothstep(islandDistance, 1.04, 1.22);

  const droppedHeight = height - shoreline * 2.5 - shelf * 4.3 - abyss * 6.4;
  return Math.max(droppedHeight, OCEAN_LEVEL - 2.6);
}

export function sampleLakeRadiusFactor(body: WaterBodyDefinition, angle: number): number {
  const seed = body.seed;
  const largeWave = Math.sin(angle * 3 + seed * 0.7) * 0.085;
  const mediumWave = Math.cos(angle * 5 - seed * 0.33) * 0.055;
  const smallWave = Math.sin(angle * 9 + seed * 0.21) * 0.022;
  return 1 + largeWave + mediumWave + smallWave;
}

function toLakeLocal(body: WaterBodyDefinition, x: number, z: number): { x: number; z: number } {
  const dx = x - body.centerX;
  const dz = z - body.centerZ;
  const cos = Math.cos(-body.rotation);
  const sin = Math.sin(-body.rotation);

  return {
    x: dx * cos - dz * sin,
    z: dx * sin + dz * cos,
  };
}

function normalizedLakeDistance(body: WaterBodyDefinition, x: number, z: number): number {
  const local = toLakeLocal(body, x, z);
  const angle = Math.atan2(local.z, local.x);
  const edgeFactor = sampleLakeRadiusFactor(body, angle);

  const radiusX = body.radiusX * edgeFactor;
  const radiusZ = body.radiusZ * edgeFactor;

  const nx = local.x / radiusX;
  const nz = local.z / radiusZ;
  return Math.hypot(nx, nz);
}

export function getLakeBoundaryPoint(
  body: WaterBodyDefinition,
  angle: number,
  scale = 1,
): { x: number; z: number } {
  const edgeFactor = sampleLakeRadiusFactor(body, angle);
  const localX = Math.cos(angle) * body.radiusX * edgeFactor * scale;
  const localZ = Math.sin(angle) * body.radiusZ * edgeFactor * scale;

  const cos = Math.cos(body.rotation);
  const sin = Math.sin(body.rotation);

  return {
    x: body.centerX + localX * cos - localZ * sin,
    z: body.centerZ + localX * sin + localZ * cos,
  };
}

export function getLakeBoundaryPolyline(
  body: WaterBodyDefinition,
  detail = LAKE_SHORELINE_SAMPLE_DETAIL,
  scale = 1,
): Array<{ x: number; z: number }> {
  const samples = Math.max(12, Math.floor(detail));
  const points: Array<{ x: number; z: number }> = [];

  for (let index = 0; index <= samples; index += 1) {
    const angle = (index / samples) * Math.PI * 2;
    points.push(getLakeBoundaryPoint(body, angle, scale));
  }

  return points;
}

function computeWaterSurfaceHeight(body: WaterBodyDefinition): number {
  let sum = 0;
  let min = Number.POSITIVE_INFINITY;
  let max = Number.NEGATIVE_INFINITY;
  const samples = 32;

  for (let index = 0; index < samples; index += 1) {
    const angle = (index / samples) * Math.PI * 2;
    const point = getLakeBoundaryPoint(body, angle);
    const perimeterTerrain = applyIslandFalloff(baseTerrainHeight(point.x, point.z), point.x, point.z);
    sum += perimeterTerrain;
    min = Math.min(min, perimeterTerrain);
    max = Math.max(max, perimeterTerrain);
  }

  const meanPerimeterHeight = sum / samples;
  const targetHeight = MathUtils.lerp(min + 0.09, meanPerimeterHeight + 0.14, 0.66);
  const cappedHeight = Math.min(targetHeight, max + 0.2);
  return Math.max(cappedHeight, OCEAN_LEVEL + 0.46);
}

const WATER_SURFACE_HEIGHTS = WORLD_WATER_BODIES.map((body) => computeWaterSurfaceHeight(body));
const LAKE_BOUNDARY_CACHE = WORLD_WATER_BODIES.map((body) =>
  getLakeBoundaryPolyline(body, LAKE_SHORELINE_SAMPLE_DETAIL),
);

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

function getLakeShoreDistanceByIndex(index: number, x: number, z: number): number {
  const boundaryPoints = LAKE_BOUNDARY_CACHE[index];
  if (!boundaryPoints || boundaryPoints.length < 2) {
    return Number.POSITIVE_INFINITY;
  }

  let minDistance = Number.POSITIVE_INFINITY;
  for (let pointIndex = 0; pointIndex < boundaryPoints.length - 1; pointIndex += 1) {
    const start = boundaryPoints[pointIndex];
    const end = boundaryPoints[pointIndex + 1];
    if (!start || !end) {
      continue;
    }

    const distance = pointToSegmentDistance(x, z, start.x, start.z, end.x, end.z);
    minDistance = Math.min(minDistance, distance);
  }

  return minDistance;
}

function getLakeShoreSignedDistanceByIndex(index: number, x: number, z: number): number {
  const body = WORLD_WATER_BODIES[index];
  if (!body) {
    return Number.POSITIVE_INFINITY;
  }

  const shoreDistance = getLakeShoreDistanceByIndex(index, x, z);
  const inside = getLakeDistance(body, x, z) <= 1;
  return inside ? -shoreDistance : shoreDistance;
}

function carveForLake(
  body: WaterBodyDefinition,
  waterSurfaceY: number,
  x: number,
  z: number,
  height: number,
): number {
  const d = normalizedLakeDistance(body, x, z);

  if (d <= 1) {
    const edgeT = MathUtils.smoothstep(d, 0, 1);
    const depth = MathUtils.lerp(1.08, 0.26, edgeT);
    const floorY = waterSurfaceY - depth;
    return Math.min(height, floorY);
  }

  if (d <= 1 + SHORE_RANGE) {
    const shoreT = 1 - (d - 1) / SHORE_RANGE;
    const shoreEase = MathUtils.smootherstep(shoreT, 0, 1);
    const shoreRaise = Math.sin(shoreT * Math.PI) * 0.11 + shoreEase * 0.05;
    const shoreTarget = waterSurfaceY + shoreRaise;
    const shorelineBlend = MathUtils.clamp(shoreEase * 0.72, 0, 1);
    return MathUtils.lerp(height, shoreTarget, shorelineBlend);
  }

  return height;
}

export function getTerrainHeight(x: number, z: number): number {
  let height = applyIslandFalloff(baseTerrainHeight(x, z), x, z);

  for (let index = 0; index < WORLD_WATER_BODIES.length; index += 1) {
    const body = WORLD_WATER_BODIES[index];
    const waterSurfaceY = WATER_SURFACE_HEIGHTS[index] ?? computeWaterSurfaceHeight(body);
    height = carveForLake(body, waterSurfaceY, x, z, height);
  }

  return height;
}

export function getWaterSurfaceHeight(body: WaterBodyDefinition): number {
  const index = WORLD_WATER_BODIES.findIndex((entry) => entry.id === body.id);
  if (index >= 0) {
    return WATER_SURFACE_HEIGHTS[index] ?? computeWaterSurfaceHeight(body);
  }

  return computeWaterSurfaceHeight(body);
}

export function getLakeDistance(body: WaterBodyDefinition, x: number, z: number): number {
  return normalizedLakeDistance(body, x, z);
}

export function getNearestLakeShoreSignedDistance(x: number, z: number): number {
  let bestSignedDistance = Number.POSITIVE_INFINITY;
  let bestAbsDistance = Number.POSITIVE_INFINITY;

  for (let index = 0; index < WORLD_WATER_BODIES.length; index += 1) {
    const signedDistance = getLakeShoreSignedDistanceByIndex(index, x, z);
    const absDistance = Math.abs(signedDistance);

    if (absDistance < bestAbsDistance) {
      bestAbsDistance = absDistance;
      bestSignedDistance = signedDistance;
    }
  }

  return bestSignedDistance;
}

export function isPointWaterBlocked(x: number, z: number, playerRadius = 0): boolean {
  const signedDistanceToShore = getNearestLakeShoreSignedDistance(x, z);
  if (!Number.isFinite(signedDistanceToShore)) {
    return false;
  }

  return signedDistanceToShore < playerRadius - SHORELINE_TOUCH_EPSILON;
}

export function getWaterWalkabilityDiagnostics(
  x: number,
  z: number,
  playerRadius = 0,
): {
  signedDistanceToShore: number;
  playerRadius: number;
  shorelineTouchEpsilon: number;
  waterBlocked: boolean;
} {
  const signedDistanceToShore = getNearestLakeShoreSignedDistance(x, z);
  return {
    signedDistanceToShore,
    playerRadius,
    shorelineTouchEpsilon: SHORELINE_TOUCH_EPSILON,
    waterBlocked: isPointWaterBlocked(x, z, playerRadius),
  };
}

export function isPointInAnyLake(x: number, z: number, padding = 0): boolean {
  return WORLD_WATER_BODIES.some((body) => getLakeDistance(body, x, z) <= 1 + padding);
}

export type WalkabilityBlockReason =
  | 'water'
  | 'island-boundary'
  | 'ocean-depth'
  | 'none';

export function getWalkabilityBlockReason(x: number, z: number, radius = 0): WalkabilityBlockReason {
  if (isPointWaterBlocked(x, z, radius)) {
    return 'water';
  }

  const islandDistance = getIslandDistanceNormalized(x, z);
  if (islandDistance > INNER_PLAYABLE_DISTANCE - radius * 0.0015) {
    return 'island-boundary';
  }

  const groundHeight = getTerrainHeight(x, z);
  if (groundHeight <= OCEAN_LEVEL + OCEAN_WALKABLE_FLOOR_OFFSET) {
    return 'ocean-depth';
  }

  return 'none';
}

export function isPointWalkable(x: number, z: number, radius = 0): boolean {
  return getWalkabilityBlockReason(x, z, radius) === 'none';
}

export function findNearestWalkablePoint(
  x: number,
  z: number,
  radiusPadding = 0.72,
): { x: number; z: number } | null {
  if (isPointWalkable(x, z, radiusPadding)) {
    return { x, z };
  }

  const maxRadius = 14;
  const radialStep = 0.4;
  const baseAngleSamples = 24;

  for (let ring = 1; ring <= Math.ceil(maxRadius / radialStep); ring += 1) {
    const distance = ring * radialStep;
    const angleSamples = baseAngleSamples + ring * 2;

    for (let index = 0; index < angleSamples; index += 1) {
      const angle = (index / angleSamples) * Math.PI * 2 + ring * 0.11;
      const candidateX = x + Math.cos(angle) * distance;
      const candidateZ = z + Math.sin(angle) * distance;

      if (isPointWalkable(candidateX, candidateZ, radiusPadding)) {
        return { x: candidateX, z: candidateZ };
      }
    }
  }

  return null;
}
