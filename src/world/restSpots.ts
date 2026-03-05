import { isInsideObstacle } from '../engine/movement';
import { WORLD_COLLISION_OBSTACLES } from './biome';
import { WORLD_WATER_BODIES } from './constants';
import {
  SCENIC_CAMERA_BLEND_SPEED,
  SCENIC_FACING_YAW,
  SCENIC_FORWARD_XZ,
  SCENIC_RIGHT_XZ,
  SCENIC_SEATED_EYE_HEIGHT,
  SCENIC_SEATED_LOOK_DISTANCE,
} from './scenic';
import {
  getLakeBoundaryPoint,
  getNearestLakeShoreSignedDistance,
  getTerrainHeight,
  isPointWaterBlocked,
  isPointWalkable,
} from './terrain';

import type { WorldAnchor } from '../types/experience';
import type { WaterBodyDefinition } from './constants';

export interface ScenicRestSpotDefinition {
  id: string;
  label: string;
  lakeId: string;
  interactionRadius: number;
  benchFootprintRadius: number;
  seat: {
    x: number;
    z: number;
    yOffset: number;
    rotationY: number;
  };
  exit: {
    x: number;
    z: number;
  };
  scenicCamera: {
    lookDistance: number;
    eyeHeight: number;
    blendSpeed: number;
  };
}

const PLAYER_STANDING_HEIGHT_OFFSET = 0.82;
const PLAYER_COLLISION_RADIUS = 0.42;
const REST_SPOT_INTERACTION_RADIUS = 2.4;
const BENCH_SEAT_Y_OFFSET = 0.46;
const BENCH_FOOTPRINT_RADIUS = 0.72;
const BENCH_OBSTACLE_CLEARANCE = 0.24;
const BENCH_SHORE_MIN_DISTANCE = 0.28;
const BENCH_SHORE_MAX_DISTANCE = 2.2;
const BENCH_SHORE_SCALE_START = 1.18;
const BENCH_SHORE_SCALE_END = 1.52;
const BENCH_SHORE_SCALE_STEP = 0.06;
const BENCH_SEARCH_ANGLE_SAMPLES = 72;
const EXIT_DISTANCE = 1.5;
const EXIT_SIDE_OFFSET = 0.64;
function normalize2D(x: number, z: number): { x: number; z: number } {
  const length = Math.hypot(x, z) || 1;
  return { x: x / length, z: z / length };
}

function hasObstacleConflict(x: number, z: number, radius: number): boolean {
  return WORLD_COLLISION_OBSTACLES.some((obstacle) =>
    isInsideObstacle({ x, z }, obstacle, radius + BENCH_OBSTACLE_CLEARANCE),
  );
}

function isValidBenchSeatPlacement(x: number, z: number): boolean {
  if (!isPointWalkable(x, z, BENCH_FOOTPRINT_RADIUS)) {
    return false;
  }

  if (isPointWaterBlocked(x, z, BENCH_FOOTPRINT_RADIUS)) {
    return false;
  }

  const shoreDistance = getNearestLakeShoreSignedDistance(x, z);
  if (!Number.isFinite(shoreDistance)) {
    return false;
  }

  if (shoreDistance < BENCH_SHORE_MIN_DISTANCE || shoreDistance > BENCH_SHORE_MAX_DISTANCE) {
    return false;
  }

  if (hasObstacleConflict(x, z, BENCH_FOOTPRINT_RADIUS)) {
    return false;
  }

  return true;
}

function isValidExitPlacement(x: number, z: number): boolean {
  if (!isPointWalkable(x, z, PLAYER_COLLISION_RADIUS)) {
    return false;
  }

  if (isPointWaterBlocked(x, z, PLAYER_COLLISION_RADIUS)) {
    return false;
  }

  if (hasObstacleConflict(x, z, PLAYER_COLLISION_RADIUS)) {
    return false;
  }

  return true;
}

function findExitAnchorForSeat(seatX: number, seatZ: number): { x: number; z: number } | null {
  const backward = {
    x: -SCENIC_FORWARD_XZ.x,
    z: -SCENIC_FORWARD_XZ.z,
  };

  const candidates: Array<{ x: number; z: number }> = [
    {
      x: seatX + backward.x * EXIT_DISTANCE,
      z: seatZ + backward.z * EXIT_DISTANCE,
    },
    {
      x: seatX + backward.x * EXIT_DISTANCE + SCENIC_RIGHT_XZ.x * EXIT_SIDE_OFFSET,
      z: seatZ + backward.z * EXIT_DISTANCE + SCENIC_RIGHT_XZ.z * EXIT_SIDE_OFFSET,
    },
    {
      x: seatX + backward.x * EXIT_DISTANCE - SCENIC_RIGHT_XZ.x * EXIT_SIDE_OFFSET,
      z: seatZ + backward.z * EXIT_DISTANCE - SCENIC_RIGHT_XZ.z * EXIT_SIDE_OFFSET,
    },
    {
      x: seatX + backward.x * (EXIT_DISTANCE + 0.35),
      z: seatZ + backward.z * (EXIT_DISTANCE + 0.35),
    },
  ];

  for (const candidate of candidates) {
    if (isValidExitPlacement(candidate.x, candidate.z)) {
      return candidate;
    }
  }

  // Fallback: radial search around the bench with slight angular bias toward the bench backside.
  const baseAngle = Math.atan2(backward.z, backward.x);
  for (let distance = 1.15; distance <= 2.4; distance += 0.16) {
    for (let angleIndex = 0; angleIndex < 24; angleIndex += 1) {
      const angle = baseAngle + ((angleIndex - 12) / 12) * 1.35;
      const candidateX = seatX + Math.cos(angle) * distance;
      const candidateZ = seatZ + Math.sin(angle) * distance;
      if (isValidExitPlacement(candidateX, candidateZ)) {
        return { x: candidateX, z: candidateZ };
      }
    }
  }

  return null;
}

function findBenchSeatForLake(lake: WaterBodyDefinition): { x: number; z: number } {
  const preferredRadial = {
    x: -SCENIC_FORWARD_XZ.x,
    z: -SCENIC_FORWARD_XZ.z,
  };
  let bestCandidate: { x: number; z: number; score: number } | null = null;

  for (let angleIndex = 0; angleIndex < BENCH_SEARCH_ANGLE_SAMPLES; angleIndex += 1) {
    const angle = (angleIndex / BENCH_SEARCH_ANGLE_SAMPLES) * Math.PI * 2;
    const boundaryPoint = getLakeBoundaryPoint(lake, angle, 1);
    const radial = normalize2D(boundaryPoint.x - lake.centerX, boundaryPoint.z - lake.centerZ);
    const alignment = radial.x * preferredRadial.x + radial.z * preferredRadial.z;

    for (let scale = BENCH_SHORE_SCALE_START; scale <= BENCH_SHORE_SCALE_END + 0.0001; scale += BENCH_SHORE_SCALE_STEP) {
      const candidate = getLakeBoundaryPoint(lake, angle, scale);
      if (!isValidBenchSeatPlacement(candidate.x, candidate.z)) {
        continue;
      }

      const shoreDistance = getNearestLakeShoreSignedDistance(candidate.x, candidate.z);
      const distancePenalty = Math.abs(scale - 1.26);
      const score = alignment * 3.8 - distancePenalty * 0.9 - shoreDistance * 0.32;

      if (!bestCandidate || score > bestCandidate.score) {
        bestCandidate = {
          x: candidate.x,
          z: candidate.z,
          score,
        };
      }
    }
  }

  if (!bestCandidate) {
    throw new Error(`Unable to place scenic bench for lake "${lake.id}". Adjust scenic placement constraints.`);
  }

  return {
    x: bestCandidate.x,
    z: bestCandidate.z,
  };
}

function toLabel(id: string): string {
  return id
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function createRestSpotForLake(lake: WaterBodyDefinition): ScenicRestSpotDefinition {
  const seat = findBenchSeatForLake(lake);
  const exit = findExitAnchorForSeat(seat.x, seat.z);

  if (!exit) {
    throw new Error(`Unable to place scenic bench exit point for lake "${lake.id}".`);
  }

  return {
    id: `${lake.id}-bench`,
    label: `${toLabel(lake.id)} Bench`,
    lakeId: lake.id,
    interactionRadius: REST_SPOT_INTERACTION_RADIUS,
    benchFootprintRadius: BENCH_FOOTPRINT_RADIUS,
    seat: {
      x: seat.x,
      z: seat.z,
      yOffset: BENCH_SEAT_Y_OFFSET,
      rotationY: SCENIC_FACING_YAW,
    },
    exit: {
      x: exit.x,
      z: exit.z,
    },
    scenicCamera: {
      lookDistance: SCENIC_SEATED_LOOK_DISTANCE,
      eyeHeight: SCENIC_SEATED_EYE_HEIGHT,
      blendSpeed: SCENIC_CAMERA_BLEND_SPEED,
    },
  };
}

export const SCENIC_REST_SPOTS: ScenicRestSpotDefinition[] = WORLD_WATER_BODIES.map((lake) =>
  createRestSpotForLake(lake),
);

export function getScenicRestSpotById(id: string): ScenicRestSpotDefinition | undefined {
  return SCENIC_REST_SPOTS.find((spot) => spot.id === id);
}

export function getRestSpotSeatAnchor(spot: ScenicRestSpotDefinition): WorldAnchor {
  return {
    x: spot.seat.x,
    y: getTerrainHeight(spot.seat.x, spot.seat.z) + spot.seat.yOffset,
    z: spot.seat.z,
  };
}

export function getRestSpotExitAnchor(spot: ScenicRestSpotDefinition): WorldAnchor {
  return {
    x: spot.exit.x,
    y: getTerrainHeight(spot.exit.x, spot.exit.z) + PLAYER_STANDING_HEIGHT_OFFSET,
    z: spot.exit.z,
  };
}
