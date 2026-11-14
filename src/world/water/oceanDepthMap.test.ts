import { describe, expect, it } from 'vitest';

import { OCEAN_DEPTH_MAP_SIZE, buildOceanDepthData, encodeDepth } from './oceanDepthMap';

describe('ocean depth map', () => {
  it('encodes depth into a byte range with clamping', () => {
    expect(encodeDepth(-5)).toBe(0);
    expect(encodeDepth(99)).toBe(255);
    expect(encodeDepth(0)).toBe(Math.round(255 / 4));
  });

  it('is dry at the island centre and deep at the edge of the map', () => {
    const data = buildOceanDepthData();
    const centre = data[(OCEAN_DEPTH_MAP_SIZE / 2) * OCEAN_DEPTH_MAP_SIZE + OCEAN_DEPTH_MAP_SIZE / 2]!;
    expect(centre).toBe(0);
    expect(data[0]).toBeGreaterThan(200);
  });
});
