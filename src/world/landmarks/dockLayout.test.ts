import { describe, expect, it } from 'vitest';

import { WORLD_WATER_BODIES } from '../constants';
import { getLakeDistance } from '../terrain';
import { LAKE_DOCKS } from './dockLayout';

describe('lake docks', () => {
  it('gives every lake a dock that starts on land and ends over its water', () => {
    expect(LAKE_DOCKS).toHaveLength(WORLD_WATER_BODIES.length);
    for (const dock of LAKE_DOCKS) {
      const lake = WORLD_WATER_BODIES.find((body) => body.id === dock.lakeId)!;
      expect(getLakeDistance(lake, dock.start.x, dock.start.z), dock.lakeId).toBeGreaterThan(1);
      const endX = dock.start.x + dock.direction.x * dock.length;
      const endZ = dock.start.z + dock.direction.z * dock.length;
      expect(getLakeDistance(lake, endX, endZ), dock.lakeId).toBeLessThan(0.8);
    }
  });
});
