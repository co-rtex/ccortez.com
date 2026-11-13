import { useFrame } from '@react-three/fiber';
import { useLayoutEffect, useMemo, useRef } from 'react';
import { Color, ConeGeometry, CylinderGeometry, DodecahedronGeometry, IcosahedronGeometry, Object3D } from 'three';
import type { BufferGeometry, InstancedMesh } from 'three';

import { useGameStore } from '../../state/gameStore';
import { OCCLUSION_UNIFORMS, applyOcclusionDither } from './occlusionDither';
import { buildVegetationInstances } from './vegetation';
import type { Instance } from './vegetation';

/**
 * All trees, bushes, flowers and rocks in five instanced draw calls (previously ~2,000 individual meshes).
 * Faceted geometry with flat shading gives the stylized, hand-cut look; colour varies per instance.
 */

function InstancedPart({
  instances,
  geometry,
  roughness = 0.85,
  castShadow = true,
  receiveShadow = false,
  emissive,
  ditherOccluders = false,
}: {
  instances: Instance[];
  geometry: BufferGeometry;
  roughness?: number;
  castShadow?: boolean;
  receiveShadow?: boolean;
  emissive?: number;
  ditherOccluders?: boolean;
}) {
  const ref = useRef<InstancedMesh>(null);

  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    const dummy = new Object3D();
    const color = new Color();
    instances.forEach((instance, index) => {
      dummy.position.set(...instance.position);
      dummy.rotation.set(...instance.rotation);
      dummy.scale.set(...instance.scale);
      dummy.updateMatrix();
      mesh.setMatrixAt(index, dummy.matrix);
      mesh.setColorAt(index, color.set(instance.color));
    });
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    mesh.computeBoundingSphere();
  }, [instances]);

  return (
    <instancedMesh
      ref={ref}
      args={[geometry, undefined, instances.length]}
      castShadow={castShadow}
      receiveShadow={receiveShadow}
    >
      <meshStandardMaterial
        roughness={roughness}
        flatShading
        emissive={emissive ? '#ffffff' : '#000000'}
        emissiveIntensity={emissive ?? 0}
        onBeforeCompile={ditherOccluders ? applyOcclusionDither : undefined}
        customProgramCacheKey={ditherOccluders ? () => 'foliage-occlusion-dither' : undefined}
      />
    </instancedMesh>
  );
}

export function InstancedVegetation() {
  useFrame(() => {
    const { playerPosition } = useGameStore.getState();
    OCCLUSION_UNIFORMS.uPlayer.value.set(playerPosition.x, playerPosition.y, playerPosition.z);
  });
  const instances = useMemo(() => buildVegetationInstances(), []);
  const geometries = useMemo(
    () => ({
      trunk: new CylinderGeometry(0.14, 0.22, 1, 7),
      puff: new IcosahedronGeometry(1, 1),
      cone: new ConeGeometry(1, 1, 8),
      bloom: new IcosahedronGeometry(1, 0),
      rock: new DodecahedronGeometry(1, 0),
    }),
    [],
  );

  return (
    <group>
      <InstancedPart instances={instances.trunks} geometry={geometries.trunk} roughness={0.9} />
      <InstancedPart instances={instances.puffs} geometry={geometries.puff} roughness={0.8} receiveShadow ditherOccluders />
      <InstancedPart instances={instances.cones} geometry={geometries.cone} roughness={0.82} receiveShadow ditherOccluders />
      <InstancedPart instances={instances.blooms} geometry={geometries.bloom} roughness={0.6} castShadow={false} emissive={0.08} />
      <InstancedPart instances={instances.rocks} geometry={geometries.rock} roughness={0.92} receiveShadow />
    </group>
  );
}
