import { useMemo } from 'react';

import { ISLAND_TRAILS } from '../islandPaths';
import { buildTrailGeometry } from './trailGeometry';

/**
 * Trails draped over the terrain. Each trail is a ribbon seven vertices wide that follows the ground, with a
 * packed-earth centre and feathered edges that fade into the grass.
 */

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
