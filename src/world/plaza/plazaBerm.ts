import { CENTRAL_PLAZA_FOUNDATION_DEPTH } from '../hub';
import { PLAZA_RADII } from '../islandPaths';
import { getCentralPlazaOuterRadius, getCentralPlazaTopHeight } from '../terrain';

/** The grassy skirt around the plaza: a cone from the plaza edge down to the surrounding ground. */
export const PLAZA_BERM = {
  topRadius: PLAZA_RADII.edge + 0.25,
  bottomRadius: getCentralPlazaOuterRadius() + 1.2,
  depth: CENTRAL_PLAZA_FOUNDATION_DEPTH,
  topY: getCentralPlazaTopHeight(),
} as const;

/** Height of the berm's surface at (x, z), or -Infinity outside it. */
export function getPlazaBermHeight(x: number, z: number): number {
  const r = Math.hypot(x, z);
  if (r < PLAZA_BERM.topRadius || r > PLAZA_BERM.bottomRadius) return Number.NEGATIVE_INFINITY;
  const t = (r - PLAZA_BERM.topRadius) / (PLAZA_BERM.bottomRadius - PLAZA_BERM.topRadius);
  return PLAZA_BERM.topY - PLAZA_BERM.depth * t;
}
