import { describe, expect, it } from 'vitest';

import { planeXYToWorldXZ, worldXZToPlaneXY } from './renderSpace';

describe('render-space mapping', () => {
  it('maps world Z to negated plane Y for rotated plane geometry', () => {
    const plane = worldXZToPlaneXY({ x: 14.5, z: -8.25 });
    expect(plane.x).toBeCloseTo(14.5, 8);
    expect(plane.y).toBeCloseTo(8.25, 8);
  });

  it('round-trips world <-> plane coordinates without drift', () => {
    const worldPoints = [
      { x: 0, z: 0 },
      { x: -32.4, z: 18.1 },
      { x: 46.2, z: -41.9 },
    ];

    for (const point of worldPoints) {
      const plane = worldXZToPlaneXY(point);
      const roundTripped = planeXYToWorldXZ(plane);

      expect(roundTripped.x).toBeCloseTo(point.x, 8);
      expect(roundTripped.z).toBeCloseTo(point.z, 8);
    }
  });
});
