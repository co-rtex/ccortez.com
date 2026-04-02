import { describe, expect, it } from 'vitest';

import {
  PUBLISHED_WORKBENCH_CLEAR_ZONES,
  PUBLISHED_WORKBENCH_PLAZA_METRICS,
  WORKBENCH_LAYOUT,
} from '../../content/workbenches/layout';
import {
  WORKBENCH_CLEAR_RADIUS,
} from './publishedRing';
import {
  START_HERE_ANCHOR,
  START_HERE_ROTATION_Y,
  START_HERE_WORKBENCH_ID,
  getWorkbenchFacingCenterRotationY,
} from '../world/hub';

describe('published workbench plaza layout', () => {
  it('places Start Here on the reserved center-pad intro spot and every other published bench on the shared inward-facing plaza ring', () => {
    const published = WORKBENCH_LAYOUT.filter((definition) => definition.visibility === 'published');
    const centerWorkbench = published.find((definition) => definition.id === START_HERE_WORKBENCH_ID);
    const perimeterWorkbenches = published.filter((definition) => definition.id !== START_HERE_WORKBENCH_ID);

    expect(centerWorkbench?.placement.mode).toBe('freeform');
    if (centerWorkbench?.placement.mode === 'freeform') {
      expect(centerWorkbench.placement.x).toBe(START_HERE_ANCHOR.x);
      expect(centerWorkbench.placement.z).toBe(START_HERE_ANCHOR.z);
      expect(centerWorkbench.placement.rotationY).toBe(START_HERE_ROTATION_Y);
      expect(Math.hypot(centerWorkbench.placement.x, centerWorkbench.placement.z)).toBeLessThan(
        PUBLISHED_WORKBENCH_PLAZA_METRICS.centerPadRadius,
      );
    }

    for (const definition of perimeterWorkbenches) {
      expect(definition.placement.mode).toBe('freeform');

      if (definition.placement.mode !== 'freeform') {
        continue;
      }

      const radius = Math.hypot(definition.placement.x, definition.placement.z);
      expect(radius).toBeCloseTo(PUBLISHED_WORKBENCH_PLAZA_METRICS.perimeterRadius, 2);
      expect(radius).toBeGreaterThan(PUBLISHED_WORKBENCH_PLAZA_METRICS.centerPadRadius);
      expect(radius).toBeLessThan(PUBLISHED_WORKBENCH_PLAZA_METRICS.plazaRadius);
      expect(definition.placement.rotationY).toBe(
        getWorkbenchFacingCenterRotationY(definition.placement.x, definition.placement.z),
      );
    }
  });

  it('keeps work and project benches grouped into contiguous plaza arcs', () => {
    const sortedDistricts = PUBLISHED_WORKBENCH_PLAZA_METRICS.perimeterWorkbenchIds
      .map((id) => WORKBENCH_LAYOUT.find((definition) => definition.id === id)?.district)
      .filter((district): district is NonNullable<typeof district> => Boolean(district));

    let transitions = 0;
    for (let index = 0; index < sortedDistricts.length; index += 1) {
      const current = sortedDistricts[index];
      const next = sortedDistricts[(index + 1) % sortedDistricts.length];
      if (current !== next) {
        transitions += 1;
      }
    }

    expect(new Set(sortedDistricts)).toEqual(new Set(['work-experience', 'projects']));
    expect(transitions).toBe(2);
  });

  it('derives published clear zones directly from the ring layout', () => {
    const published = WORKBENCH_LAYOUT.filter((definition) => definition.visibility === 'published');

    expect(PUBLISHED_WORKBENCH_CLEAR_ZONES).toHaveLength(published.length);
    expect(PUBLISHED_WORKBENCH_CLEAR_ZONES.every((zone) => zone.radius === WORKBENCH_CLEAR_RADIUS)).toBe(true);
  });
});
