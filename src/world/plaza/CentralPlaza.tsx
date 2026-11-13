import { useLayoutEffect, useRef } from 'react';
import { Object3D } from 'three';
import type { InstancedMesh } from 'three';

import { CENTRAL_PLAZA_FOUNDATION_DEPTH } from '../hub';
import { PLAZA_LAMP_POSITIONS, PLAZA_RADII } from '../islandPaths';
import { getCentralPlazaOuterRadius, getCentralPlazaTopHeight } from '../terrain';
import { PlazaFountain } from './PlazaFountain';
import { applyPlazaFloorShader } from './plazaFloorShader';

const LAMP_POST_HEIGHT = 2.7;

function PlazaLamps({ y }: { y: number }) {
  const postRef = useRef<InstancedMesh>(null);
  const baseRef = useRef<InstancedMesh>(null);
  const lanternRef = useRef<InstancedMesh>(null);
  const capRef = useRef<InstancedMesh>(null);

  useLayoutEffect(() => {
    const dummy = new Object3D();
    const place = (mesh: InstancedMesh | null, height: number) => {
      if (!mesh) return;
      PLAZA_LAMP_POSITIONS.forEach(([x, z], index) => {
        dummy.position.set(x, y + height, z);
        dummy.updateMatrix();
        mesh.setMatrixAt(index, dummy.matrix);
      });
      mesh.instanceMatrix.needsUpdate = true;
      mesh.computeBoundingSphere();
    };
    place(baseRef.current, 0.14);
    place(postRef.current, LAMP_POST_HEIGHT / 2);
    place(lanternRef.current, LAMP_POST_HEIGHT + 0.2);
    place(capRef.current, LAMP_POST_HEIGHT + 0.46);
  }, [y]);

  const count = PLAZA_LAMP_POSITIONS.length;
  return (
    <group>
      <instancedMesh ref={baseRef} args={[undefined, undefined, count]} castShadow>
        <cylinderGeometry args={[0.2, 0.26, 0.28, 10]} />
        <meshStandardMaterial color="#5a4a3c" roughness={0.6} metalness={0.3} />
      </instancedMesh>
      <instancedMesh ref={postRef} args={[undefined, undefined, count]} castShadow>
        <cylinderGeometry args={[0.055, 0.075, LAMP_POST_HEIGHT, 8]} />
        <meshStandardMaterial color="#5a4a3c" roughness={0.55} metalness={0.3} />
      </instancedMesh>
      <instancedMesh ref={lanternRef} args={[undefined, undefined, count]}>
        <sphereGeometry args={[0.2, 16, 12]} />
        <meshStandardMaterial color="#ffe0a3" emissive="#ffc46b" emissiveIntensity={1.4} toneMapped={false} />
      </instancedMesh>
      <instancedMesh ref={capRef} args={[undefined, undefined, count]} castShadow>
        <coneGeometry args={[0.26, 0.2, 10]} />
        <meshStandardMaterial color="#5a4a3c" roughness={0.55} metalness={0.3} />
      </instancedMesh>
    </group>
  );
}

export function CentralPlaza() {
  const centerY = getCentralPlazaTopHeight();
  const outerRadius = getCentralPlazaOuterRadius();

  return (
    <group>
      {/* Retaining wall: a warm stone drum that the terrain blends into. */}
      <mesh receiveShadow position={[0, centerY - CENTRAL_PLAZA_FOUNDATION_DEPTH * 0.5, 0]}>
        <cylinderGeometry args={[PLAZA_RADII.edge + 0.25, outerRadius + 1.2, CENTRAL_PLAZA_FOUNDATION_DEPTH, 96, 1, true]} />
        <meshStandardMaterial color="#cdb38a" roughness={0.9} />
      </mesh>

      <mesh receiveShadow position={[0, centerY + 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[PLAZA_RADII.edge + 0.25, 160]} />
        <meshStandardMaterial
          roughness={0.86}
          metalness={0}
          onBeforeCompile={applyPlazaFloorShader}
          customProgramCacheKey={() => 'plaza-floor-v1'}
        />
      </mesh>

      {/* Low kerb along the outer edge. */}
      <mesh castShadow receiveShadow position={[0, centerY + 0.08, 0]}>
        <cylinderGeometry args={[PLAZA_RADII.edge + 0.25, PLAZA_RADII.edge + 0.3, 0.16, 128, 1, true]} />
        <meshStandardMaterial color="#c4a77c" roughness={0.88} />
      </mesh>

      <PlazaLamps y={centerY} />
      <PlazaFountain y={centerY + 0.02} />
    </group>
  );
}
