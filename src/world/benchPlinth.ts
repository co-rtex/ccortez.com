import { PATH_NETWORK_XZ, PLAZA_PATH_SPOKES } from './islandPaths';

/**
 * Architecture shared by every ring workbench: a raised, many-sided stone plinth (instead of a broad flat
 * disk that read as a pale placemat on the paving) and a crescent planter of hedges on its outer side that
 * frames the diorama, hides monitor backs from outside the ring and separates the bench from the trees.
 *
 * All heights are relative to the workbench anchor, which sits BENCH_ANCHOR_LIFT above the plaza floor.
 */
export const BENCH_ANCHOR_LIFT = 0.18;

export const BENCH_PLINTH = {
  /** Sides of the plinth drum: faceted to match the low-poly world, round enough to read as a dais. */
  sides: 16,
  /** Riser runs from just below the plaza floor up to the coping. */
  footY: -BENCH_ANCHOR_LIFT - 0.04,
  baseRadius: 3.16,
  topRadius: 3.05,
  /** Light coping lip; its top is the deck that scene props stand on. */
  copingHeight: 0.07,
  copingRadius: 3.12,
  /** Deck height: scene content was authored to stand at 0.10 above the anchor. */
  deckY: 0.1,
  /** Category-tinted field inside the coping, and the accent inlay ring at its edge. */
  fieldRadius: 2.7,
  inlayRadius: 2.83,
  /** Front step toward the plaza centre: an invitation up onto the plinth. */
  stepWidth: 1.7,
  stepDepth: 0.42,
} as const;

export const BENCH_PLANTER = {
  innerRadius: 3.32,
  outerRadius: 3.98,
  /** Half the crescent's angular span, centred on the bench's outer side. */
  halfSpan: (58 * Math.PI) / 180,
  curbHeight: 0.16,
  bushesPerCrescent: 11,
} as const;

/** Paths keep this much clear width either side of their centreline. */
const PATH_CLEARANCE = 2.1;

export interface BenchPlacementXZ {
  x: number;
  z: number;
  rotationY: number;
}

export interface HedgeBush {
  x: number;
  z: number;
  /** Bush radius before squash. */
  size: number;
  rotationY: number;
  /** 0..2: picks one of the hedge greens. */
  tone: number;
}

/** World XZ of a point at local polar angle `phi` (0 = the bench's outer side) and radius `r`. */
export function benchLocalToWorld(bench: BenchPlacementXZ, phi: number, r: number): [number, number] {
  // Local +z faces the plaza centre, so the outer side is local -z.
  const lx = r * Math.sin(phi);
  const lz = -r * Math.cos(phi);
  const cos = Math.cos(bench.rotationY);
  const sin = Math.sin(bench.rotationY);
  return [bench.x + lx * cos + lz * sin, bench.z - lx * sin + lz * cos];
}

function distanceToSegment(px: number, pz: number, ax: number, az: number, bx: number, bz: number): number {
  const dx = bx - ax;
  const dz = bz - az;
  const lengthSq = dx * dx + dz * dz;
  const t = lengthSq > 0 ? Math.max(0, Math.min(1, ((px - ax) * dx + (pz - az) * dz) / lengthSq)) : 0;
  return Math.hypot(px - (ax + dx * t), pz - (az + dz * t));
}

export function distanceToPathNetwork(x: number, z: number): number {
  let best = Infinity;
  for (const path of PATH_NETWORK_XZ) {
    for (let i = 1; i < path.length; i += 1) {
      const [ax, az] = path[i - 1]!;
      const [bx, bz] = path[i]!;
      best = Math.min(best, distanceToSegment(x, z, ax, az, bx, bz));
    }
  }
  return best;
}

const MAX_SPOKE_HALF_WIDTH = Math.max(...PLAZA_PATH_SPOKES.map((spoke) => spoke.width / 2));

/** True where a planter would sit across a path: those stretches of the crescent are left open. */
export function isPlanterBlockedByPath(x: number, z: number): boolean {
  return distanceToPathNetwork(x, z) < MAX_SPOKE_HALF_WIDTH + PATH_CLEARANCE - 1;
}

function hash01(seed: number): number {
  const s = Math.sin(seed * 91.37 + 17.13) * 43758.5453;
  return s - Math.floor(s);
}

/** Hedge bushes along each bench's crescent, skipping any that would stand on a path. */
export function getHedgeBushes(benches: readonly BenchPlacementXZ[]): HedgeBush[] {
  const bushes: HedgeBush[] = [];
  const midRadius = (BENCH_PLANTER.innerRadius + BENCH_PLANTER.outerRadius) / 2;
  benches.forEach((bench, benchIndex) => {
    for (let i = 0; i < BENCH_PLANTER.bushesPerCrescent; i += 1) {
      const t = i / (BENCH_PLANTER.bushesPerCrescent - 1);
      const seed = benchIndex * 31 + i * 7;
      const phi = (t * 2 - 1) * BENCH_PLANTER.halfSpan + (hash01(seed) - 0.5) * 0.06;
      const [x, z] = benchLocalToWorld(bench, phi, midRadius + (hash01(seed + 1) - 0.5) * 0.12);
      if (isPlanterBlockedByPath(x, z)) continue;
      // Taller in the middle of the crescent, lower at its tips.
      const crest = 1 - Math.abs(t * 2 - 1) * 0.35;
      bushes.push({
        x,
        z,
        size: 0.6 * (0.72 + hash01(seed + 2) * 0.38) * crest,
        rotationY: hash01(seed + 3) * Math.PI * 2,
        tone: Math.floor(hash01(seed + 4) * 3),
      });
    }
  });
  return bushes;
}
