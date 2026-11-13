import { describe, expect, it } from 'vitest';

import { ISLAND_TRAILS } from '../islandPaths';
import { buildTrailGeometry } from './trailGeometry';

describe('island trail geometry', () => {
  it('faces upward so the ribbon is not back-face culled from above', () => {
    for (const trail of ISLAND_TRAILS) {
      const normals = buildTrailGeometry(trail).getAttribute('normal');
      let up = 0;
      for (let index = 0; index < normals.count; index += 1) up += normals.getY(index);
      expect(up / normals.count, trail.id).toBeGreaterThan(0.5);
    }
  });
});
