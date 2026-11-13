import { WORLD_WATER_BODIES } from '../constants';
import { ISLAND_TRAILS, PLAZA_RADII } from '../islandPaths';
import { getLakeDistance } from '../terrain';

export interface TrailSign {
  trailId: string;
  label: string;
  x: number;
  z: number;
  /** Yaw so the board's arrow points along the trail. */
  rotationY: number;
}

function titleCase(id: string): string {
  return id
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

/** Where each trail ends: the lighthouse for the north gate, otherwise the lake nearest the trail's end. */
export function getTrailDestination(trailId: string, end: [number, number]): string {
  if (trailId === 'north-gate') return 'Lighthouse';
  const lake = [...WORLD_WATER_BODIES].sort(
    (a, b) => getLakeDistance(a, end[0], end[1]) - getLakeDistance(b, end[0], end[1]),
  )[0]!;
  return titleCase(lake.id);
}

/** A signpost beside each trail just after it leaves the plaza, pointing the way it goes. */
export const TRAIL_SIGNS: TrailSign[] = ISLAND_TRAILS.flatMap((trail) => {
  const index = trail.points.findIndex(([x, z]) => Math.hypot(x, z) > PLAZA_RADII.edge + 3.2);
  if (index < 0 || index >= trail.points.length - 1) return [];
  const [x, z] = trail.points[index]!;
  const [nx, nz] = trail.points[Math.min(index + 3, trail.points.length - 1)]!;
  const dx = nx - x;
  const dz = nz - z;
  const length = Math.hypot(dx, dz) || 1;
  // Stand the post beside the trail, not on it.
  const side = trail.width / 2 + 0.7;
  return [
    {
      trailId: trail.id,
      label: getTrailDestination(trail.id, trail.points[trail.points.length - 1]!),
      x: x + (-dz / length) * side,
      z: z + (dx / length) * side,
      rotationY: Math.atan2(dx, dz),
    },
  ];
});
