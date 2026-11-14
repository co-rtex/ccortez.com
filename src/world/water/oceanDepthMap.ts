import { DataTexture, LinearFilter, RedFormat, UnsignedByteType } from 'three';

import { OCEAN_LEVEL, getTerrainHeight } from '../terrain';

/**
 * Water depth around the island, baked once into a small texture so the ocean shader can draw shallows and a
 * surf line that follow the real coast. Depth is ocean level minus terrain height, clamped to [-1, 3] m and
 * stored in one byte (0 = 1 m above water, 255 = 3 m or deeper).
 */
export const OCEAN_DEPTH_MAP_SIZE = 256;
export const OCEAN_DEPTH_MAP_EXTENT = 200;
export const OCEAN_DEPTH_MIN = -1;
export const OCEAN_DEPTH_MAX = 3;

export function encodeDepth(depth: number): number {
  const t = (Math.min(Math.max(depth, OCEAN_DEPTH_MIN), OCEAN_DEPTH_MAX) - OCEAN_DEPTH_MIN) / (OCEAN_DEPTH_MAX - OCEAN_DEPTH_MIN);
  return Math.round(t * 255);
}

export function buildOceanDepthData(size = OCEAN_DEPTH_MAP_SIZE): Uint8Array {
  const data = new Uint8Array(size * size);
  for (let row = 0; row < size; row += 1) {
    for (let col = 0; col < size; col += 1) {
      const x = ((col + 0.5) / size - 0.5) * OCEAN_DEPTH_MAP_EXTENT;
      const z = ((row + 0.5) / size - 0.5) * OCEAN_DEPTH_MAP_EXTENT;
      data[row * size + col] = encodeDepth(OCEAN_LEVEL - getTerrainHeight(x, z));
    }
  }
  return data;
}

export function createOceanDepthTexture(): DataTexture {
  const texture = new DataTexture(
    buildOceanDepthData(),
    OCEAN_DEPTH_MAP_SIZE,
    OCEAN_DEPTH_MAP_SIZE,
    RedFormat,
    UnsignedByteType,
  );
  texture.magFilter = LinearFilter;
  texture.minFilter = LinearFilter;
  texture.needsUpdate = true;
  return texture;
}
