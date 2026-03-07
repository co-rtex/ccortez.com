import { getTerrainHeight } from '../world/terrain';

import { getWorkbenchCorridorById } from './corridors';

import type {
  WorkbenchCorridorId,
  WorkbenchPlacement,
  WorkbenchResolvedPlacement,
} from '../types/workbench';

interface SegmentSample {
  x: number;
  z: number;
  yaw: number;
  rightX: number;
  rightZ: number;
}

interface CorridorSegment {
  startX: number;
  startZ: number;
  endX: number;
  endZ: number;
  length: number;
  cumulativeStart: number;
}

interface CorridorCache {
  totalLength: number;
  segments: CorridorSegment[];
}

const corridorCache = new Map<WorkbenchCorridorId, CorridorCache>();

function getOrCreateCorridorCache(corridorId: WorkbenchCorridorId): CorridorCache {
  const existing = corridorCache.get(corridorId);
  if (existing) {
    return existing;
  }

  const corridor = getWorkbenchCorridorById(corridorId);
  const segments: CorridorSegment[] = [];
  let cumulativeStart = 0;

  for (let index = 0; index < corridor.polyline.length - 1; index += 1) {
    const [startX, startZ] = corridor.polyline[index] ?? [0, 0];
    const [endX, endZ] = corridor.polyline[index + 1] ?? [0, 0];
    const length = Math.hypot(endX - startX, endZ - startZ);
    if (length <= 0.0001) {
      continue;
    }

    segments.push({
      startX,
      startZ,
      endX,
      endZ,
      length,
      cumulativeStart,
    });

    cumulativeStart += length;
  }

  const cache = {
    totalLength: cumulativeStart,
    segments,
  };
  corridorCache.set(corridorId, cache);
  return cache;
}

function createSegmentSample(segment: CorridorSegment, t: number): SegmentSample {
  const clampedT = Math.min(Math.max(t, 0), 1);
  const tangentX = (segment.endX - segment.startX) / segment.length;
  const tangentZ = (segment.endZ - segment.startZ) / segment.length;
  return {
    x: segment.startX + (segment.endX - segment.startX) * clampedT,
    z: segment.startZ + (segment.endZ - segment.startZ) * clampedT,
    yaw: Math.atan2(tangentX, tangentZ),
    rightX: tangentZ,
    rightZ: -tangentX,
  };
}

export function getWorkbenchCorridorLength(corridorId: WorkbenchCorridorId): number {
  return getOrCreateCorridorCache(corridorId).totalLength;
}

export function sampleCorridorPoint(corridorId: WorkbenchCorridorId, distanceAlong: number): SegmentSample {
  const cache = getOrCreateCorridorCache(corridorId);
  const [lastSegment] = cache.segments.slice(-1);
  if (cache.segments.length === 0 || !lastSegment) {
    return {
      x: 0,
      z: 0,
      yaw: 0,
      rightX: 1,
      rightZ: 0,
    };
  }

  const clampedDistance = Math.min(Math.max(distanceAlong, 0), cache.totalLength);

  for (const segment of cache.segments) {
    const segmentEnd = segment.cumulativeStart + segment.length;
    if (clampedDistance <= segmentEnd) {
      return createSegmentSample(segment, (clampedDistance - segment.cumulativeStart) / segment.length);
    }
  }

  return createSegmentSample(lastSegment, 1);
}

export function projectPointOntoCorridor(
  corridorId: WorkbenchCorridorId,
  x: number,
  z: number,
): { distanceAlong: number; lateralOffset: number; rotationY: number } {
  const cache = getOrCreateCorridorCache(corridorId);
  let bestDistanceSquared = Number.POSITIVE_INFINITY;
  let bestResult = {
    distanceAlong: 0,
    lateralOffset: 0,
    rotationY: 0,
  };

  for (const segment of cache.segments) {
    const dx = segment.endX - segment.startX;
    const dz = segment.endZ - segment.startZ;
    const px = x - segment.startX;
    const pz = z - segment.startZ;
    const lengthSquared = dx * dx + dz * dz;
    const t = lengthSquared > 0 ? Math.min(Math.max((px * dx + pz * dz) / lengthSquared, 0), 1) : 0;
    const sample = createSegmentSample(segment, t);
    const offsetX = x - sample.x;
    const offsetZ = z - sample.z;
    const distanceSquared = offsetX * offsetX + offsetZ * offsetZ;

    if (distanceSquared < bestDistanceSquared) {
      bestDistanceSquared = distanceSquared;
      bestResult = {
        distanceAlong: segment.cumulativeStart + segment.length * t,
        lateralOffset: offsetX * sample.rightX + offsetZ * sample.rightZ,
        rotationY: sample.yaw,
      };
    }
  }

  return bestResult;
}

export function resolveWorkbenchPlacement(placement: WorkbenchPlacement): WorkbenchResolvedPlacement {
  if (placement.mode === 'freeform') {
    return {
      anchor: {
        x: placement.x,
        y: getTerrainHeight(placement.x, placement.z) + placement.yOffset,
        z: placement.z,
      },
      rotationY: placement.rotationY,
    };
  }

  const sample = sampleCorridorPoint(placement.corridorId, placement.distanceAlong);
  const x = sample.x + sample.rightX * placement.lateralOffset;
  const z = sample.z + sample.rightZ * placement.lateralOffset;
  return {
    anchor: {
      x,
      y: getTerrainHeight(x, z) + placement.yOffset,
      z,
    },
    rotationY: placement.yawMode === 'follow-road' ? sample.yaw + placement.yawOffset : placement.yawOffset,
  };
}
