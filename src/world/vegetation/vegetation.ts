import { BOULDER_POINTS, BUSH_POINTS, COASTAL_ROCK_POINTS, FLOWER_POINTS, TREE_POINTS } from '../biome';
import type { RockPoint, ScatterPoint } from '../biome';
import { PATH_NETWORK_XZ, PLAZA_RADII } from '../islandPaths';
import { WORLD_WATER_BODIES } from '../constants';
import { OCEAN_LEVEL, getIslandDistanceNormalized, getLakeDistance, getTerrainHeight } from '../terrain';

/**
 * Turns scatter points into instance transforms for a handful of instanced meshes. Pure and deterministic:
 * the same points always give the same instances, and collision data (from the scatter points) is untouched.
 *
 * Species:
 * - broadleaf: three or four faceted canopy puffs on a trunk, in one of several greens
 * - conifer: three stacked cones, more common toward the coast
 * - blossom: pink canopy, an accent near the plaza
 * - amber: a warm autumn accent, sparse
 */

export type TreeSpecies = 'broadleaf' | 'conifer' | 'blossom' | 'amber';

export interface Instance {
  position: [number, number, number];
  scale: [number, number, number];
  rotation: [number, number, number];
  color: string;
}

export interface VegetationInstances {
  trunks: Instance[];
  puffs: Instance[];
  cones: Instance[];
  blooms: Instance[];
  rocks: Instance[];
  blades: Instance[];
  species: TreeSpecies[];
}

const BROADLEAF_GREENS = ['#5fae55', '#4f9e4f', '#74bb5a', '#3f8f4f', '#86c35c'];
const CONIFER_GREENS = ['#2f7d5a', '#3a8a5e', '#2a6f55'];
const BLOSSOM = ['#f4a7c0', '#f7bfd2', '#ee93b2'];
const AMBER = ['#f0a54a', '#e98c3f', '#f4bd57'];
const TRUNKS = ['#8f6342', '#7d5639', '#9b6e4a'];
const BUSH_GREENS = ['#5aa556', '#6cb35a', '#4c9550'];
const PETALS = ['#ff9fc7', '#ffd875', '#bda8ff', '#ffb687', '#8bd5ff', '#ffffff'];
const ROCK_TONES = ['#b9a48e', '#a8957f', '#c4b198', '#9e8d7a'];
const BLADE_GREENS = ['#8fc35a', '#7bb04e', '#a6cf62', '#6fa94a'];
export const GRASS_TUFT_COUNT = 700;

function distanceToPaths(x: number, z: number): number {
  let best = Number.POSITIVE_INFINITY;
  for (const line of PATH_NETWORK_XZ) {
    for (let index = 0; index < line.length - 1; index += 1) {
      const [ax, az] = line[index]!;
      const [bx, bz] = line[index + 1]!;
      const vx = bx - ax;
      const vz = bz - az;
      const t = Math.min(Math.max(((x - ax) * vx + (z - az) * vz) / (vx * vx + vz * vz || 1), 0), 1);
      best = Math.min(best, Math.hypot(x - (ax + vx * t), z - (az + vz * t)));
    }
  }
  return best;
}

/** Small three-blade grass tufts scattered over the meadows (not on paths, the plaza, beaches or lake edges). */
function addGrassTufts(out: VegetationInstances): void {
  const rand = seeded(9071);
  let placed = 0;
  for (let attempt = 0; attempt < 20000 && placed < GRASS_TUFT_COUNT; attempt += 1) {
    const x = (rand() - 0.5) * 140;
    const z = (rand() - 0.5) * 134;
    if (Math.hypot(x, z) < PLAZA_RADII.edge + 4.5) continue;
    if (getIslandDistanceNormalized(x, z) > 0.86) continue;
    const y = getTerrainHeight(x, z);
    if (y < OCEAN_LEVEL + 1.3) continue;
    if (WORLD_WATER_BODIES.some((body) => getLakeDistance(body, x, z) < 1.25)) continue;
    if (distanceToPaths(x, z) < 1.6) continue;
    placed += 1;
    const color = pick(BLADE_GREENS, rand());
    const height = 0.22 + rand() * 0.16;
    for (let blade = 0; blade < 3; blade += 1) {
      const angle = rand() * Math.PI * 2;
      out.blades.push({
        position: [x + Math.cos(angle) * 0.07, y + height / 2 - 0.02, z + Math.sin(angle) * 0.07],
        scale: [1, height, 1],
        rotation: [Math.cos(angle) * 0.35, rand() * Math.PI, Math.sin(angle) * 0.35],
        color,
      });
    }
  }
}

/** Small deterministic generator seeded per point so instances never depend on iteration order. */
function seeded(seed: number): () => number {
  let state = Math.floor(seed * 9973) % 2147483647;
  if (state <= 0) state += 2147483646;
  return () => {
    state = (state * 16807) % 2147483647;
    return (state - 1) / 2147483646;
  };
}

function pick<T>(list: T[], value: number): T {
  return list[Math.min(list.length - 1, Math.floor(value * list.length))]!;
}

export function getTreeSpecies(point: ScatterPoint): TreeSpecies {
  const rand = seeded(point.seed + 0.5);
  const roll = rand();
  const nearPlaza = Math.hypot(point.x, point.z) < PLAZA_RADII.edge + 12;
  const coastal = getIslandDistanceNormalized(point.x, point.z) > 0.74;
  if (nearPlaza && roll < 0.3) return 'blossom';
  if (coastal && roll < 0.5) return 'conifer';
  if (!coastal && roll > 0.9) return 'amber';
  if (roll > 0.88) return 'conifer';
  return 'broadleaf';
}

function addTree(point: ScatterPoint, species: TreeSpecies, out: VegetationInstances): void {
  const rand = seeded(point.seed);
  const y = getTerrainHeight(point.x, point.z);
  const size = 0.85 + rand() * 0.45;
  const lean: [number, number, number] = [(rand() - 0.5) * 0.08, rand() * Math.PI * 2, (rand() - 0.5) * 0.08];

  if (species === 'conifer') {
    const trunkHeight = 0.9 * size;
    out.trunks.push({
      position: [point.x, y + trunkHeight / 2, point.z],
      scale: [0.8 * size, trunkHeight, 0.8 * size],
      rotation: lean,
      color: pick(TRUNKS, rand()),
    });
    const green = pick(CONIFER_GREENS, rand());
    const tiers = [
      { y: 0.9, radius: 1.35, height: 1.9 },
      { y: 1.95, radius: 1.05, height: 1.6 },
      { y: 2.85, radius: 0.7, height: 1.3 },
    ];
    for (const tier of tiers) {
      out.cones.push({
        position: [point.x, y + (tier.y + tier.height / 2) * size, point.z],
        scale: [tier.radius * size, tier.height * size, tier.radius * size],
        rotation: [0, rand() * Math.PI, 0],
        color: green,
      });
    }
    return;
  }

  const trunkHeight = (2.0 + rand() * 0.9) * size;
  out.trunks.push({
    position: [point.x, y + trunkHeight / 2, point.z],
    scale: [size, trunkHeight, size],
    rotation: lean,
    color: pick(TRUNKS, rand()),
  });

  const palette = species === 'blossom' ? BLOSSOM : species === 'amber' ? AMBER : BROADLEAF_GREENS;
  const base = pick(palette, rand());
  const canopy = (1.0 + rand() * 0.45) * size;
  const puffs = 3 + Math.floor(rand() * 2);
  // A main puff on top of the trunk and smaller ones around it at varied heights.
  out.puffs.push({
    position: [point.x, y + trunkHeight + canopy * 0.45, point.z],
    scale: [canopy, canopy * 0.92, canopy],
    rotation: [rand(), rand() * Math.PI, rand()],
    color: base,
  });
  for (let index = 0; index < puffs; index += 1) {
    const angle = (index / puffs) * Math.PI * 2 + rand();
    const r = canopy * (0.55 + rand() * 0.25);
    const s = canopy * (0.55 + rand() * 0.2);
    out.puffs.push({
      position: [
        point.x + Math.cos(angle) * r,
        y + trunkHeight + canopy * (0.05 + rand() * 0.45),
        point.z + Math.sin(angle) * r,
      ],
      scale: [s, s * 0.9, s],
      rotation: [rand(), rand() * Math.PI, rand()],
      color: index % 2 === 0 ? base : pick(palette, rand()),
    });
  }
}

function addBush(point: ScatterPoint, out: VegetationInstances): void {
  const rand = seeded(point.seed + 7);
  const y = getTerrainHeight(point.x, point.z);
  const green = pick(BUSH_GREENS, rand());
  const size = 0.55 + rand() * 0.3;
  const count = 2 + Math.floor(rand() * 2);
  for (let index = 0; index < count; index += 1) {
    const angle = rand() * Math.PI * 2;
    const r = index === 0 ? 0 : size * 0.7;
    const s = index === 0 ? size : size * (0.6 + rand() * 0.2);
    out.puffs.push({
      position: [point.x + Math.cos(angle) * r, y + s * 0.62, point.z + Math.sin(angle) * r],
      scale: [s, s * 0.85, s],
      rotation: [rand(), rand() * Math.PI, rand()],
      color: green,
    });
  }
  // Some bushes carry a few blossoms.
  if (rand() > 0.6) {
    const petal = pick(PETALS, rand());
    for (let index = 0; index < 4; index += 1) {
      const angle = rand() * Math.PI * 2;
      out.blooms.push({
        position: [point.x + Math.cos(angle) * size * 0.6, y + size * (0.9 + rand() * 0.3), point.z + Math.sin(angle) * size * 0.6],
        scale: [0.11, 0.11, 0.11],
        rotation: [0, 0, 0],
        color: petal,
      });
    }
  }
}

function addFlowerPatch(point: ScatterPoint, out: VegetationInstances): void {
  const rand = seeded(point.seed + 13);
  const y = getTerrainHeight(point.x, point.z);
  const color = pick(PETALS, rand());
  const accent = pick(PETALS, rand());
  // A low leafy cushion grounds the blooms so they read as a planted patch rather than loose dice.
  out.puffs.push({
    position: [point.x, y + 0.08, point.z],
    scale: [0.55 + rand() * 0.2, 0.2, 0.5 + rand() * 0.2],
    rotation: [0, rand() * Math.PI, 0],
    color: pick(BUSH_GREENS, rand()),
  });
  const count = 10 + Math.floor(rand() * 7);
  for (let index = 0; index < count; index += 1) {
    const angle = rand() * Math.PI * 2;
    const r = Math.sqrt(rand()) * 0.55;
    const s = 0.055 + rand() * 0.04;
    out.blooms.push({
      position: [point.x + Math.cos(angle) * r, y + 0.2 + rand() * 0.1, point.z + Math.sin(angle) * r],
      scale: [s, s, s],
      rotation: [0, 0, 0],
      color: rand() > 0.3 ? color : accent,
    });
  }
}

function addRock(point: RockPoint, out: VegetationInstances): void {
  const rand = seeded(point.seed + 21);
  const y = getTerrainHeight(point.x, point.z);
  const squash = 0.62 + rand() * 0.25;
  out.rocks.push({
    position: [point.x, y + point.size * squash * 0.35, point.z],
    scale: [point.size * (0.95 + rand() * 0.25), point.size * squash, point.size * (0.9 + rand() * 0.25)],
    rotation: [rand() * 0.4, rand() * Math.PI * 2, rand() * 0.4],
    color: pick(ROCK_TONES, rand()),
  });
}

export function buildVegetationInstances(): VegetationInstances {
  const out: VegetationInstances = { trunks: [], puffs: [], cones: [], blooms: [], rocks: [], blades: [], species: [] };
  for (const point of TREE_POINTS) {
    const species = getTreeSpecies(point);
    out.species.push(species);
    addTree(point, species, out);
  }
  for (const point of BUSH_POINTS) addBush(point, out);
  for (const point of FLOWER_POINTS) addFlowerPatch(point, out);
  for (const point of [...BOULDER_POINTS, ...COASTAL_ROCK_POINTS]) addRock(point, out);
  addGrassTufts(out);
  return out;
}
