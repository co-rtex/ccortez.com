import { describe, expect, it } from 'vitest';

import { ISLAND_TRAILS } from '../islandPaths';
import { isPointWalkable } from '../terrain';
import { TRAIL_SIGNS } from './trailSignLayout';

describe('trail signs', () => {
  it('labels every trail with its destination and stands beside it on land', () => {
    expect(TRAIL_SIGNS).toHaveLength(ISLAND_TRAILS.length);
    expect(TRAIL_SIGNS.find((sign) => sign.trailId === 'north-gate')?.label).toBe('Lighthouse');
    expect(TRAIL_SIGNS.find((sign) => sign.trailId === 'south')?.label).toBe('Moss Heart Pond');
    for (const sign of TRAIL_SIGNS) {
      expect(isPointWalkable(sign.x, sign.z, 0)).toBe(true);
    }
  });
});
