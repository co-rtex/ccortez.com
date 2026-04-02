import { describe, expect, it } from 'vitest';

import {
  PUBLISHED_WORKBENCH_CLEAR_ZONES,
  WORKBENCH_LAYOUT,
} from '../../content/workbenches/layout';
import {
  HUB_RING_FACING_YAW,
  HUB_RING_RADIUS,
  WORKBENCH_CLEAR_RADIUS,
} from './publishedRing';
import { SPAWN_HUB_RADIUS } from '../world/hub';

function normalizeAngle(angle: number): number {
  const turn = Math.PI * 2;
  return ((angle % turn) + turn) % turn;
}

describe('published workbench ring layout', () => {
  it('places every published bench on the same hub ring with the shared south-facing yaw', () => {
    const published = WORKBENCH_LAYOUT.filter((definition) => definition.visibility === 'published');

    for (const definition of published) {
      expect(definition.placement.mode).toBe('freeform');

      if (definition.placement.mode !== 'freeform') {
        continue;
      }

      const radius = Math.hypot(definition.placement.x, definition.placement.z);
      expect(radius).toBeCloseTo(HUB_RING_RADIUS, 3);
      expect(radius).toBeGreaterThan(SPAWN_HUB_RADIUS);
      expect(definition.placement.rotationY).toBe(HUB_RING_FACING_YAW);
    }
  });

  it('keeps work and project benches grouped into contiguous ring blocks', () => {
    const sortedDistricts = WORKBENCH_LAYOUT
      .flatMap((definition) => {
        if (definition.visibility !== 'published' || definition.placement.mode !== 'freeform') {
          return [];
        }

        return [
          {
            district: definition.district,
            angle: normalizeAngle(Math.atan2(definition.placement.z, definition.placement.x)),
          },
        ];
      })
      .sort((left, right) => left.angle - right.angle)
      .map((entry) => entry.district);

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
