import { isInsideObstacle } from '../engine/movement';

import { WORLD_COLLISION_OBSTACLES } from './biome';
import { WORLD_BOUNDS, WORLD_WATER_BODIES } from './constants';
import { getTerrainHeight, isPointWaterBlocked, isPointWalkable } from './terrain';

import type { WaterBodyDefinition } from './constants';

export interface BunnyAnchor {
  id: string;
  x: number;
  z: number;
  seed: number;
  wanderRadius: number;
  hopHeight: number;
  pace: number;
}

export interface BirdTrack {
  id: string;
  centerX: number;
  centerZ: number;
  altitude: number;
  radiusX: number;
  radiusZ: number;
  speed: number;
  seed: number;
}

export type LakeFaunaKind = 'ducks' | 'fish';

export interface LakeFaunaPlan {
  lakeId: string;
  kind: LakeFaunaKind;
  seed: number;
}

const BUNNY_TARGET_COUNT = 14;
const BUNNY_MIN_DISTANCE = 3.2;
const BUNNY_AVOID_RADIUS = 0.48;

const BIRD_TARGET_COUNT = 12;

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

function conflictsWithObstacle(x: number, z: number, radius: number): boolean {
  return WORLD_COLLISION_OBSTACLES.some((obstacle) => isInsideObstacle({ x, z }, obstacle, radius));
}

function generateBunnyAnchors(targetCount: number, seed: number): BunnyAnchor[] {
  const rand = createRandom(seed);
  const anchors: BunnyAnchor[] = [];
  const minDistanceSquared = BUNNY_MIN_DISTANCE * BUNNY_MIN_DISTANCE;
  const margin = 4;

  const minX = WORLD_BOUNDS.minX + margin;
  const maxX = WORLD_BOUNDS.maxX - margin;
  const minZ = WORLD_BOUNDS.minZ + margin;
  const maxZ = WORLD_BOUNDS.maxZ - margin;

  for (let attempts = 0; attempts < 28000 && anchors.length < targetCount; attempts += 1) {
    const x = minX + (maxX - minX) * rand();
    const z = minZ + (maxZ - minZ) * rand();

    if (!isPointWalkable(x, z, BUNNY_AVOID_RADIUS)) {
      continue;
    }

    if (isPointWaterBlocked(x, z, BUNNY_AVOID_RADIUS)) {
      continue;
    }

    if (conflictsWithObstacle(x, z, BUNNY_AVOID_RADIUS)) {
      continue;
    }

    let tooClose = false;
    for (const anchor of anchors) {
      if (sqrDistance(x, z, anchor.x, anchor.z) < minDistanceSquared) {
        tooClose = true;
        break;
      }
    }
    if (tooClose) {
      continue;
    }

    anchors.push({
      id: `bunny-${anchors.length}`,
      x,
      z,
      seed: rand() * 1000,
      wanderRadius: 0.55 + rand() * 0.55,
      hopHeight: 0.07 + rand() * 0.12,
      pace: 0.5 + rand() * 0.45,
    });
  }

  return anchors;
}

function generateBirdTracks(targetCount: number, seed: number): BirdTrack[] {
  const rand = createRandom(seed);
  const tracks: BirdTrack[] = [];

  for (let index = 0; index < targetCount; index += 1) {
    const centerX = -36 + rand() * 72;
    const centerZ = -34 + rand() * 70;
    tracks.push({
      id: `bird-${index}`,
      centerX,
      centerZ,
      altitude: 18 + rand() * 15,
      radiusX: 6 + rand() * 16,
      radiusZ: 5 + rand() * 12,
      speed: 0.1 + rand() * 0.2,
      seed: rand() * 1000,
    });
  }

  return tracks;
}

function createLakeFaunaPlan(lake: WaterBodyDefinition, index: number): LakeFaunaPlan {
  const kind: LakeFaunaKind = ((Math.floor(lake.seed) + index) % 2 === 0 ? 'ducks' : 'fish');
  return {
    lakeId: lake.id,
    kind,
    seed: lake.seed * 0.61 + index * 17.37,
  };
}

export const AMBIENT_BUNNY_ANCHORS: BunnyAnchor[] = generateBunnyAnchors(BUNNY_TARGET_COUNT, 9012);
export const AMBIENT_BIRD_TRACKS: BirdTrack[] = generateBirdTracks(BIRD_TARGET_COUNT, 4810);
export const LAKE_FAUNA_PLANS: LakeFaunaPlan[] = WORLD_WATER_BODIES.map((lake, index) =>
  createLakeFaunaPlan(lake, index),
);

export function getLakeFaunaPlanByLakeId(lakeId: string): LakeFaunaPlan | undefined {
  return LAKE_FAUNA_PLANS.find((plan) => plan.lakeId === lakeId);
}

export function sampleBunnyAnchorHeight(anchor: BunnyAnchor): number {
  return getTerrainHeight(anchor.x, anchor.z);
}
