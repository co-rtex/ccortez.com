import { getTerrainHeight } from './terrain';

/** The rendered terrain is a PlaneGeometry of this size and resolution, displaced by getTerrainHeight. */
export const TERRAIN_MESH_SIZE = 430;
export const TERRAIN_MESH_SEGMENTS = 360;
const CELL = TERRAIN_MESH_SIZE / TERRAIN_MESH_SEGMENTS;
const HALF = TERRAIN_MESH_SIZE / 2;

/**
 * Height of the rendered terrain surface (the flat triangles between grid vertices), not of the smooth height
 * function. Use it for anything draped on the ground so it never dips below the visible mesh.
 *
 * PlaneGeometry rows run along world +z (plane y = -world z) and each cell is split into the triangles
 * (a, b, d) and (b, c, d) with a = (col, row), b = (col, row + 1), c = (col + 1, row + 1), d = (col + 1, row).
 */
export function getTerrainMeshHeight(x: number, z: number): number {
  const u = (x + HALF) / CELL;
  const v = (z + HALF) / CELL;
  const col = Math.min(Math.max(Math.floor(u), 0), TERRAIN_MESH_SEGMENTS - 1);
  const row = Math.min(Math.max(Math.floor(v), 0), TERRAIN_MESH_SEGMENTS - 1);
  const fu = u - col;
  const fv = v - row;
  const at = (c: number, r: number) => getTerrainHeight(c * CELL - HALF, r * CELL - HALF);
  const ha = at(col, row);
  const hb = at(col, row + 1);
  const hc = at(col + 1, row + 1);
  const hd = at(col + 1, row);
  if (fu + fv <= 1) {
    // Triangle a(0,0) b(0,1) d(1,0)
    return ha + (hd - ha) * fu + (hb - ha) * fv;
  }
  // Triangle b(0,1) c(1,1) d(1,0)
  return hc + (hb - hc) * (1 - fu) + (hd - hc) * (1 - fv);
}
