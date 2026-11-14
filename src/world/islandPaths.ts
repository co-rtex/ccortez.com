import { PUBLISHED_WORKBENCH_PLAZA_METRICS } from '../../content/workbenches/layout';
import { WORLD_WATER_BODIES } from './constants';
import { CENTRAL_PLAZA_CENTER_PAD_RADIUS } from './hub';
import { getIslandDistanceNormalized, getLakeDistance, isPointWalkable } from './terrain';
import { SCENIC_FORWARD_XZ } from './scenic';

/**
 * The plaza and island path network.
 *
 * Benches sit on a ring at `perimeterRadius`, one slot every `2π / slotCount` radians with an empty slot (the
 * north gate) at angle 0. Angles here use the same convention as the bench layout: a point at angle `a` and
 * radius `r` is at `(-r·sin a, -r·cos a)`, so angle 0 is north (−z). Paths leave the plaza through the gaps
 * between benches (half-slot angles) and continue as trails to the lakes and the shore.
 */

export interface PlazaPathSpoke {
  id: string;
  /** Plaza angle in radians (0 = north gate). */
  angle: number;
  /** Paved width inside the plaza, in metres. */
  width: number;
}

export interface IslandTrail {
  id: string;
  points: Array<[number, number]>;
  width: number;
}

const metrics = PUBLISHED_WORKBENCH_PLAZA_METRICS;
const SLOT_COUNT = metrics.perimeterWorkbenchCount + 1;
const SLOT_ANGLE = (Math.PI * 2) / SLOT_COUNT;

export const PLAZA_RADII = {
  /** Paved court around the fountain (the reserved Start Here pad). */
  court: CENTRAL_PLAZA_CENTER_PAD_RADIUS,
  /** Lawns run from the court to the promenade. */
  lawnOuter: metrics.perimeterRadius - 4.6,
  /** Paved promenade that carries the bench ring. */
  promenadeOuter: metrics.plazaRadius - 1.1,
  /** Outer kerb. */
  edge: metrics.plazaRadius,
} as const;

export function plazaPoint(angle: number, radius: number): [number, number] {
  return [-radius * Math.sin(angle), -radius * Math.cos(angle)];
}

export function plazaAngleOf(x: number, z: number): number {
  return Math.atan2(-x, -z);
}

/** Half-slot offsets give the gaps between benches; slot 0 is the gate. */
const SPOKE_SLOTS: Array<{ id: string; slot: number; width: number }> = [
  { id: 'north-gate', slot: 0, width: 4.2 },
  { id: 'northwest', slot: 3.5, width: 2.6 },
  { id: 'northeast', slot: -3.5, width: 2.6 },
  { id: 'southwest', slot: 7.5, width: 2.6 },
  { id: 'southeast', slot: -7.5, width: 2.6 },
  { id: 'south', slot: SLOT_COUNT / 2, width: 2.6 },
];

export const PLAZA_PATH_SPOKES: PlazaPathSpoke[] = SPOKE_SLOTS.map(({ id, slot, width }) => ({
  id,
  angle: slot * SLOT_ANGLE,
  width,
}));

function lakeNearestTo(x: number, z: number) {
  return [...WORLD_WATER_BODIES].sort(
    (a, b) => Math.hypot(a.centerX - x, a.centerZ - z) - Math.hypot(b.centerX - x, b.centerZ - z),
  )[0]!;
}

/**
 * Nudges a point onto comfortably walkable ground: out of lakes (away from the lake centre) and in from the
 * coast (toward the island centre).
 */
function keepOnLand(x: number, z: number, clearance: number): [number, number] {
  let px = x;
  let pz = z;
  for (let step = 0; step < 80; step += 1) {
    const lake = WORLD_WATER_BODIES.find((body) => getLakeDistance(body, px, pz) < 1 + clearance * 0.2);
    if (lake) {
      const dx = px - lake.centerX;
      const dz = pz - lake.centerZ;
      const length = Math.hypot(dx, dz) || 1;
      px += (dx / length) * 0.3;
      pz += (dz / length) * 0.3;
      continue;
    }
    if (isPointWalkable(px, pz, clearance)) break;
    const length = Math.hypot(px, pz) || 1;
    px -= (px / length) * 0.3;
    pz -= (pz / length) * 0.3;
  }
  return [px, pz];
}

function smoothTrail(points: Array<[number, number]>, spacing: number): Array<[number, number]> {
  // Catmull–Rom through the control points, resampled at roughly `spacing` metres.
  const out: Array<[number, number]> = [];
  for (let index = 0; index < points.length - 1; index += 1) {
    const p0 = points[Math.max(index - 1, 0)]!;
    const p1 = points[index]!;
    const p2 = points[index + 1]!;
    const p3 = points[Math.min(index + 2, points.length - 1)]!;
    const steps = Math.max(2, Math.ceil(Math.hypot(p2[0] - p1[0], p2[1] - p1[1]) / spacing));
    for (let step = 0; step < steps; step += 1) {
      const t = step / steps;
      const t2 = t * t;
      const t3 = t2 * t;
      const blend = (a: number, b: number, c: number, d: number) =>
        0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3);
      out.push([blend(p0[0], p1[0], p2[0], p3[0]), blend(p0[1], p1[1], p2[1], p3[1])]);
    }
  }
  out.push(points[points.length - 1]!);
  return out;
}

function buildTrail(id: string, angle: number, width: number, target: [number, number]): IslandTrail {
  const start = plazaPoint(angle, PLAZA_RADII.edge - 0.6);
  const leave = plazaPoint(angle, PLAZA_RADII.edge + 4.5);
  const mid: [number, number] = [(leave[0] + target[0]) / 2, (leave[1] + target[1]) / 2];
  // A gentle sideways bow keeps trails from reading as ruler-straight spokes.
  const dx = target[0] - leave[0];
  const dz = target[1] - leave[1];
  const length = Math.hypot(dx, dz) || 1;
  const bow = Math.min(3.2, length * 0.14) * (angle >= 0 ? 1 : -1);
  const bowed: [number, number] = [mid[0] + (-dz / length) * bow, mid[1] + (dx / length) * bow];
  const control = [start, leave, bowed, target].map(([x, z]) => keepOnLand(x, z, 1.4));
  const points = smoothTrail(control, 0.7).map(([x, z]) => keepOnLand(x, z, 1.1));
  return { id, points, width };
}

/** Where a lake trail ends: on the lake's back shore, near its scenic bench, which faces the sunset. */
function lakeTrailTarget(angle: number): [number, number] {
  const [x, z] = plazaPoint(angle, PLAZA_RADII.edge + 10);
  const lake = lakeNearestTo(x, z);
  const reach = Math.max(lake.radiusX, lake.radiusZ) + 2.2;
  return keepOnLand(lake.centerX - SCENIC_FORWARD_XZ.x * reach, lake.centerZ - SCENIC_FORWARD_XZ.z * reach, 1.6);
}

/** Walks outward along a spoke until it nears the coast, for trails that end at a shore lookout. */
function shoreTrailTarget(angle: number): [number, number] {
  let radius = PLAZA_RADII.edge + 6;
  for (; radius < 90; radius += 0.5) {
    const [x, z] = plazaPoint(angle, radius);
    if (getIslandDistanceNormalized(x, z) > 0.74 || !isPointWalkable(x, z, 1.6)) break;
  }
  return keepOnLand(...plazaPoint(angle, radius - 2.5), 1.6);
}

export const ISLAND_TRAILS: IslandTrail[] = PLAZA_PATH_SPOKES.map((spoke) => {
  // The south spoke points straight at Moss Heart Pond, so it leads to the pond's bench like the other lakes.
  const isShore = spoke.id === 'north-gate';
  const target = isShore ? shoreTrailTarget(spoke.angle) : lakeTrailTarget(spoke.angle);
  return buildTrail(spoke.id, spoke.angle, isShore ? 2.6 : 2.1, target);
});

/** Paths used for vegetation clearance: plaza spokes (centre to edge) plus the trails beyond. */
export const PATH_NETWORK_XZ: Array<Array<[number, number]>> = [
  ...PLAZA_PATH_SPOKES.map((spoke) => [plazaPoint(spoke.angle, 0), plazaPoint(spoke.angle, PLAZA_RADII.edge)]),
  ...ISLAND_TRAILS.map((trail) => trail.points),
];

/** Lamp posts flank each spoke where it leaves the court. */
export const PLAZA_LAMP_POSITIONS: Array<[number, number]> = PLAZA_PATH_SPOKES.flatMap((spoke) => {
  const forward: [number, number] = [-Math.sin(spoke.angle), -Math.cos(spoke.angle)];
  const side: [number, number] = [forward[1], -forward[0]];
  const offset = spoke.width / 2 + 0.75;
  return [PLAZA_RADII.court + 0.9].flatMap((radius) =>
    [-1, 1].map((sign): [number, number] => [
      forward[0] * radius + side[0] * offset * sign,
      forward[1] * radius + side[1] * offset * sign,
    ]),
  );
});

export const PLAZA_LAMP_COLLIDER_RADIUS = 0.2;

export interface PlazaFlowerBed {
  x: number;
  z: number;
  /** Rotation about Y so the bed's long axis follows the ring. */
  rotationY: number;
  length: number;
  width: number;
}

/** Lawn wedges (mid-angles between spokes) used by the district markers; flower beds take the others. */
export const PLAZA_DISTRICT_MARKER_ANGLES = { work: 1.82, projects: -1.82 } as const;
export const PLAZA_DISTRICT_MARKER_RADIUS = 14.2;

export const PLAZA_FLOWER_BEDS: PlazaFlowerBed[] = [0.85, -0.85, 2.81, -2.81].map((angle) => {
  const [x, z] = plazaPoint(angle, 15.6);
  // Tangent to the ring: perpendicular to the radial direction.
  return { x, z, rotationY: angle + Math.PI / 2, length: 4.4, width: 1.5 };
});

/** Circle colliders approximating each bed (three along its length). */
export const PLAZA_FLOWER_BED_COLLIDERS: Array<{ x: number; z: number; radius: number }> = PLAZA_FLOWER_BEDS.flatMap(
  (bed) =>
    [-1.4, 0, 1.4].map((offset) => ({
      x: bed.x + Math.sin(bed.rotationY) * offset,
      z: bed.z + Math.cos(bed.rotationY) * offset,
      radius: 0.85,
    })),
);

/** Lighthouse at the end of the north trail: the island's second landmark and a reason to walk out. */
export const LIGHTHOUSE = (() => {
  const northTrail = ISLAND_TRAILS.find((trail) => trail.id === 'north-gate')!;
  const [endX, endZ] = northTrail.points[northTrail.points.length - 1]!;
  const length = Math.hypot(endX, endZ) || 1;
  // A little past the trail end, toward the coast, so the trail arrives at its door.
  return { x: endX + (endX / length) * 2.0, z: endZ + (endZ / length) * 2.0, radius: 1.5 };
})();

/** Areas vegetation and rocks keep clear of. */
export const LANDMARK_CLEAR_ZONES: Array<{ x: number; z: number; radius: number }> = [
  { x: LIGHTHOUSE.x, z: LIGHTHOUSE.z, radius: 5 },
];
