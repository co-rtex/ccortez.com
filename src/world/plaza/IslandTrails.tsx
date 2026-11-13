import { useMemo } from 'react';
import { BufferAttribute, BufferGeometry, Color } from 'three';

import { ISLAND_TRAILS, PLAZA_RADII } from '../islandPaths';
import type { IslandTrail } from '../islandPaths';
import { getTerrainHeight } from '../terrain';

/**
 * Trails draped over the terrain. Each trail is a ribbon five vertices wide that follows the ground, with a
 * packed-earth centre and feathered edges that fade into the grass.
 */

const ACROSS = [-1, -0.62, 0, 0.62, 1];
const ALPHA = [0, 0.92, 1, 0.92, 0];
const LIFT = 0.05;
const centerColor = new Color('#e2c596');
const edgeColor = new Color('#c9a774');

function hash(x: number): number {
  const s = Math.sin(x * 12.9898) * 43758.5453;
  return s - Math.floor(s);
}

function buildTrailGeometry(trail: IslandTrail): BufferGeometry {
  const points = trail.points.filter(([x, z]) => Math.hypot(x, z) > PLAZA_RADII.edge + 0.35);
  const rows = points.length;
  const columns = ACROSS.length;
  const positions = new Float32Array(rows * columns * 3);
  const colors = new Float32Array(rows * columns * 4);
  const color = new Color();
  const indices: number[] = [];

  points.forEach(([x, z], row) => {
    const prev = points[Math.max(row - 1, 0)]!;
    const next = points[Math.min(row + 1, rows - 1)]!;
    const tx = next[0] - prev[0];
    const tz = next[1] - prev[1];
    const length = Math.hypot(tx, tz) || 1;
    const nx = -tz / length;
    const nz = tx / length;
    // Width breathes a little along the trail so the edges are not ruler-straight.
    const halfWidth = (trail.width / 2) * (0.88 + hash(row * 0.37 + trail.width) * 0.24);
    const taper = Math.min(1, row / 3, (rows - 1 - row) / 4 + 0.35);

    ACROSS.forEach((offset, column) => {
      const px = x + nx * offset * halfWidth * Math.max(taper, 0.35);
      const pz = z + nz * offset * halfWidth * Math.max(taper, 0.35);
      const index = row * columns + column;
      positions[index * 3] = px;
      positions[index * 3 + 1] = getTerrainHeight(px, pz) + LIFT;
      positions[index * 3 + 2] = pz;
      color.copy(centerColor).lerp(edgeColor, Math.abs(offset) * 0.8 + hash(index) * 0.15);
      colors[index * 4] = color.r;
      colors[index * 4 + 1] = color.g;
      colors[index * 4 + 2] = color.b;
      colors[index * 4 + 3] = ALPHA[column]! * Math.min(1, taper + 0.2);
    });
  });

  for (let row = 0; row < rows - 1; row += 1) {
    for (let column = 0; column < columns - 1; column += 1) {
      const a = row * columns + column;
      const b = a + 1;
      const c = a + columns;
      const d = c + 1;
      indices.push(a, c, b, b, c, d);
    }
  }

  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new BufferAttribute(positions, 3));
  geometry.setAttribute('color', new BufferAttribute(colors, 4));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

export function IslandTrails() {
  const geometries = useMemo(() => ISLAND_TRAILS.map(buildTrailGeometry), []);

  return (
    <group>
      {geometries.map((geometry, index) => (
        <mesh key={ISLAND_TRAILS[index]!.id} geometry={geometry} receiveShadow renderOrder={1}>
          <meshStandardMaterial
            vertexColors
            transparent
            depthWrite={false}
            roughness={0.95}
            polygonOffset
            polygonOffsetFactor={-2}
            polygonOffsetUnits={-2}
          />
        </mesh>
      ))}
    </group>
  );
}
