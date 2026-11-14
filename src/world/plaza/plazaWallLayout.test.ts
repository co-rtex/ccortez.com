import { describe, expect, it } from 'vitest';

import { PLAZA_PATH_SPOKES, PLAZA_RADII, plazaPoint } from '../islandPaths';
import {
  PLAZA_WALL_ARCS,
  PLAZA_WALL_COLLIDERS,
  PLAZA_WALL_OPENINGS,
  PLAZA_WALL_PIERS,
  isInWallOpening,
} from './plazaWallLayout';

describe('plaza seat wall', () => {
  it('has one opening per path, centred on it', () => {
    expect(PLAZA_WALL_OPENINGS).toHaveLength(PLAZA_PATH_SPOKES.length);
    for (const spoke of PLAZA_PATH_SPOKES) {
      const [x, z] = plazaPoint(spoke.angle, PLAZA_RADII.edge);
      expect(isInWallOpening(Math.atan2(x, z))).toBe(true);
    }
  });

  it('leaves every path walkable: no collider within the path width where it crosses the wall', () => {
    for (const spoke of PLAZA_PATH_SPOKES) {
      const [x, z] = plazaPoint(spoke.angle, PLAZA_RADII.edge + 0.28);
      const blocking = PLAZA_WALL_COLLIDERS.filter(
        (collider) => Math.hypot(collider.centerX - x, collider.centerZ - z) < spoke.width / 2 + collider.radius,
      );
      expect(blocking).toEqual([]);
    }
  });

  it('is continuous between openings, with a pier either side of each', () => {
    const covered = PLAZA_WALL_ARCS.reduce((sum, arc) => sum + arc.thetaLength, 0);
    const open = PLAZA_WALL_OPENINGS.reduce((sum, opening) => sum + opening.halfAngle * 2, 0);
    expect(covered + open).toBeLessThan(Math.PI * 2);
    expect(covered + open).toBeGreaterThan(Math.PI * 2 * 0.97);
    expect(PLAZA_WALL_PIERS).toHaveLength(PLAZA_WALL_OPENINGS.length * 2);
  });

  it('blocks the ground between paths', () => {
    const between = (PLAZA_PATH_SPOKES[0]!.angle + PLAZA_PATH_SPOKES[1]!.angle) / 2;
    const [x, z] = plazaPoint(between, PLAZA_RADII.edge + 0.28);
    expect(
      PLAZA_WALL_COLLIDERS.some((collider) => Math.hypot(collider.centerX - x, collider.centerZ - z) < collider.radius),
    ).toBe(true);
  });
});
