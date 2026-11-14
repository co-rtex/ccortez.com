import { describe, expect, it } from 'vitest';

import { PUBLISHED_WORKBENCH_PLAZA_METRICS, WORKBENCH_LAYOUT } from '../../content/workbenches/layout';
import { PLAYER_START } from './constants';
import {
  ISLAND_TRAILS,
  PLAZA_LAMP_COLLIDER_RADIUS,
  PLAZA_LAMP_POSITIONS,
  PLAZA_PATH_SPOKES,
  PLAZA_RADII,
  plazaAngleOf,
  plazaPoint,
} from './islandPaths';
import { isPointWalkable } from './terrain';

const perimeterAnchors = WORKBENCH_LAYOUT.filter((bench) =>
  PUBLISHED_WORKBENCH_PLAZA_METRICS.perimeterWorkbenchIds.includes(bench.id),
).map((bench) => {
  if (bench.placement.mode !== 'freeform') throw new Error(`expected freeform placement for ${bench.id}`);
  return { x: bench.placement.x, z: bench.placement.z };
});

describe('island paths', () => {
  it('orders plaza zones from the court outward', () => {
    expect(PLAZA_RADII.court).toBeLessThan(PLAZA_RADII.lawnOuter);
    expect(PLAZA_RADII.lawnOuter).toBeLessThan(PUBLISHED_WORKBENCH_PLAZA_METRICS.perimeterRadius);
    expect(PLAZA_RADII.promenadeOuter).toBeLessThan(PLAZA_RADII.edge);
  });

  it('round-trips plaza angles', () => {
    for (const angle of [0, 1, -2, 3]) {
      const [x, z] = plazaPoint(angle, 10);
      expect(plazaAngleOf(x, z)).toBeCloseTo(angle, 6);
    }
  });

  it('runs every spoke through a gap between perimeter benches', () => {
    expect(perimeterAnchors).toHaveLength(PUBLISHED_WORKBENCH_PLAZA_METRICS.perimeterWorkbenchCount);
    const slot = (Math.PI * 2) / (PUBLISHED_WORKBENCH_PLAZA_METRICS.perimeterWorkbenchCount + 1);
    for (const spoke of PLAZA_PATH_SPOKES) {
      for (const anchor of perimeterAnchors) {
        const benchAngle = plazaAngleOf(anchor.x, anchor.z);
        const delta = Math.abs(Math.atan2(Math.sin(benchAngle - spoke.angle), Math.cos(benchAngle - spoke.angle)));
        expect(delta, spoke.id).toBeGreaterThanOrEqual(slot * 0.49);
      }
    }
  });

  it('keeps every trail sample on walkable ground outside the plaza core', () => {
    for (const trail of ISLAND_TRAILS) {
      expect(trail.points.length, trail.id).toBeGreaterThan(4);
      for (const [x, z] of trail.points) {
        expect(isPointWalkable(x, z, 0.16), `${trail.id} at ${x.toFixed(2)},${z.toFixed(2)}`).toBe(true);
        expect(Math.hypot(x, z), trail.id).toBeGreaterThan(PLAZA_RADII.edge - 1);
      }
    }
  });

  it('keeps lamp posts clear of bench platforms and the spawn point', () => {
    for (const [x, z] of PLAZA_LAMP_POSITIONS) {
      for (const anchor of perimeterAnchors) {
        expect(Math.hypot(x - anchor.x, z - anchor.z)).toBeGreaterThan(4.4);
      }
      expect(Math.hypot(x - PLAYER_START.x, z - PLAYER_START.z)).toBeGreaterThan(1 + PLAZA_LAMP_COLLIDER_RADIUS);
    }
  });
});

describe('lighthouse', () => {
  it('stands on dry land at the end of the north trail', async () => {
    const { LIGHTHOUSE, ISLAND_TRAILS: trails } = await import('./islandPaths');
    const { OCEAN_LEVEL, getTerrainHeight } = await import('./terrain');
    expect(getTerrainHeight(LIGHTHOUSE.x, LIGHTHOUSE.z)).toBeGreaterThan(OCEAN_LEVEL + 0.4);
    const north = trails.find((trail) => trail.id === 'north-gate')!;
    const [endX, endZ] = north.points[north.points.length - 1]!;
    expect(Math.hypot(LIGHTHOUSE.x - endX, LIGHTHOUSE.z - endZ)).toBeLessThan(4);
  });
});
