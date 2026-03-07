import { describe, expect, it } from 'vitest';

import { projectPointOntoCorridor, resolveWorkbenchPlacement, sampleCorridorPoint } from './placement';

describe('workbench placement', () => {
  it('samples road corridors with a stable tangent', () => {
    const sample = sampleCorridorPoint('east-promenade', 18);
    expect(sample.x).toBeGreaterThan(10);
    expect(Math.abs(sample.yaw)).toBeLessThan(1.4);
  });

  it('projects an offset point back onto its corridor frame', () => {
    const sample = sampleCorridorPoint('east-promenade', 22);
    const x = sample.x + sample.rightX * 3.4;
    const z = sample.z + sample.rightZ * 3.4;
    const projected = projectPointOntoCorridor('east-promenade', x, z);

    expect(projected.distanceAlong).toBeCloseTo(22, 1);
    expect(projected.lateralOffset).toBeCloseTo(3.4, 1);
  });

  it('resolves corridor placement onto terrain space', () => {
    const placement = resolveWorkbenchPlacement({
      mode: 'corridor',
      corridorId: 'southeast-trail',
      distanceAlong: 18,
      lateralOffset: 2.8,
      yawMode: 'follow-road',
      yawOffset: 0,
      yOffset: 0.18,
    });

    expect(Number.isFinite(placement.anchor.x)).toBe(true);
    expect(Number.isFinite(placement.anchor.y)).toBe(true);
    expect(Number.isFinite(placement.rotationY)).toBe(true);
  });
});
