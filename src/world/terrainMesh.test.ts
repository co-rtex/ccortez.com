import { describe, expect, it } from 'vitest';
import { PlaneGeometry } from 'three';

import { planeXYToWorldXZ } from './renderSpace';
import { getTerrainHeight } from './terrain';
import { TERRAIN_MESH_SEGMENTS, TERRAIN_MESH_SIZE, getTerrainMeshHeight } from './terrainMesh';

describe('terrain mesh height', () => {
  it('matches the height function at grid vertices', () => {
    const geometry = new PlaneGeometry(TERRAIN_MESH_SIZE, TERRAIN_MESH_SIZE, TERRAIN_MESH_SEGMENTS, TERRAIN_MESH_SEGMENTS);
    const positions = geometry.attributes.position!;
    for (const index of [0, 1234, 40_000, 65_000, positions.count - 1]) {
      const { x, z } = planeXYToWorldXZ({ x: positions.getX(index), y: positions.getY(index) });
      expect(getTerrainMeshHeight(x, z)).toBeCloseTo(getTerrainHeight(x, z), 5);
    }
  });

  it('interpolates linearly inside a cell', () => {
    const cell = TERRAIN_MESH_SIZE / TERRAIN_MESH_SEGMENTS;
    const x0 = 20 * cell - TERRAIN_MESH_SIZE / 2 + 160 * cell;
    const z0 = 30 * cell - TERRAIN_MESH_SIZE / 2 + 160 * cell;
    const a = getTerrainHeight(x0, z0);
    const d = getTerrainHeight(x0 + cell, z0);
    expect(getTerrainMeshHeight(x0 + cell * 0.5, z0 + 1e-6)).toBeCloseTo((a + d) / 2, 3);
  });
});
