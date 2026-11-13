import { useLayoutEffect, useMemo, useRef } from 'react';
import { Color, Object3D } from 'three';
import type { InstancedMesh } from 'three';

import { CENTRAL_PLAZA_FOUNDATION_DEPTH } from '../hub';
import { PLAZA_FLOWER_BEDS, PLAZA_LAMP_POSITIONS, PLAZA_RADII } from '../islandPaths';
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
        <meshStandardMaterial color="#4e5b44" roughness={0.6} metalness={0.25} />
      </instancedMesh>
      <instancedMesh ref={postRef} args={[undefined, undefined, count]} castShadow>
        <cylinderGeometry args={[0.055, 0.075, LAMP_POST_HEIGHT, 8]} />
        <meshStandardMaterial color="#4e5b44" roughness={0.55} metalness={0.25} />
      </instancedMesh>
      <instancedMesh ref={lanternRef} args={[undefined, undefined, count]}>
        <sphereGeometry args={[0.2, 16, 12]} />
        <meshStandardMaterial color="#ffe0a3" emissive="#ffc46b" emissiveIntensity={1.4} toneMapped={false} />
      </instancedMesh>
      <instancedMesh ref={capRef} args={[undefined, undefined, count]} castShadow>
        <coneGeometry args={[0.26, 0.2, 10]} />
        <meshStandardMaterial color="#f3e3c3" roughness={0.7} />
      </instancedMesh>
    </group>
  );
}


const BED_FLOWERS = ['#f7d154', '#f28c8c', '#ffffff', '#c6a8ff', '#ff9fc7'];

/** Raised flower beds in the lawn wedges: a stone kerb, dark soil, a low hedge line and dense blooms. */
function PlazaFlowerBeds({ y }: { y: number }) {
  const bloomRef = useRef<InstancedMesh>(null);
  const hedgeRef = useRef<InstancedMesh>(null);
  const blooms = useMemo(() => {
    const out: Array<{ x: number; y: number; z: number; s: number; color: string }> = [];
    PLAZA_FLOWER_BEDS.forEach((bed, bedIndex) => {
      let seed = bedIndex * 97 + 13;
      const rand = () => {
        seed = (seed * 16807) % 2147483647;
        return seed / 2147483647;
      };
      for (let index = 0; index < 46; index += 1) {
        const along = (rand() - 0.5) * (bed.length - 0.7);
        const across = (rand() - 0.5) * (bed.width - 0.6);
        out.push({
          x: bed.x + Math.sin(bed.rotationY) * along + Math.cos(bed.rotationY) * across,
          z: bed.z + Math.cos(bed.rotationY) * along - Math.sin(bed.rotationY) * across,
          y: y + 0.36 + rand() * 0.14,
          s: 0.09 + rand() * 0.06,
          color: BED_FLOWERS[(bedIndex + Math.floor(rand() * 3)) % BED_FLOWERS.length]!,
        });
      }
    });
    return out;
  }, [y]);

  useLayoutEffect(() => {
    const dummy = new Object3D();
    const color = new Color();
    const bloomMesh = bloomRef.current;
    if (bloomMesh) {
      blooms.forEach((bloom, index) => {
        dummy.position.set(bloom.x, bloom.y, bloom.z);
        dummy.scale.setScalar(bloom.s);
        dummy.rotation.set(0, 0, 0);
        dummy.updateMatrix();
        bloomMesh.setMatrixAt(index, dummy.matrix);
        bloomMesh.setColorAt(index, color.set(bloom.color));
      });
      bloomMesh.instanceMatrix.needsUpdate = true;
      if (bloomMesh.instanceColor) bloomMesh.instanceColor.needsUpdate = true;
      bloomMesh.computeBoundingSphere();
    }
    const hedgeMesh = hedgeRef.current;
    if (hedgeMesh) {
      PLAZA_FLOWER_BEDS.forEach((bed, bedIndex) => {
        [-1, 1].forEach((end, endIndex) => {
          const along = end * (bed.length / 2 - 0.45);
          dummy.position.set(bed.x + Math.sin(bed.rotationY) * along, y + 0.55, bed.z + Math.cos(bed.rotationY) * along);
          dummy.scale.set(0.55, 0.5, 0.55);
          dummy.rotation.set(0, bedIndex + endIndex, 0);
          dummy.updateMatrix();
          hedgeMesh.setMatrixAt(bedIndex * 2 + endIndex, dummy.matrix);
        });
      });
      hedgeMesh.instanceMatrix.needsUpdate = true;
      hedgeMesh.computeBoundingSphere();
    }
  }, [blooms, y]);

  return (
    <group>
      {PLAZA_FLOWER_BEDS.map((bed, index) => (
        <group key={index} position={[bed.x, y, bed.z]} rotation={[0, bed.rotationY, 0]}>
          <mesh castShadow receiveShadow position={[0, 0.16, 0]} scale={[bed.width / 2, 1, bed.length / 2]}>
            <cylinderGeometry args={[1, 1.04, 0.32, 32]} />
            <meshStandardMaterial color="#e6d3b0" roughness={0.85} />
          </mesh>
          <mesh receiveShadow position={[0, 0.33, 0]} scale={[bed.width / 2 - 0.12, 1, bed.length / 2 - 0.12]}>
            <cylinderGeometry args={[1, 1, 0.04, 32]} />
            <meshStandardMaterial color="#6b4a33" roughness={1} />
          </mesh>
        </group>
      ))}
      <instancedMesh ref={hedgeRef} args={[undefined, undefined, PLAZA_FLOWER_BEDS.length * 2]} castShadow>
        <icosahedronGeometry args={[1, 1]} />
        <meshStandardMaterial color="#4f9e4f" roughness={0.8} flatShading />
      </instancedMesh>
      <instancedMesh ref={bloomRef} args={[undefined, undefined, blooms.length]}>
        <icosahedronGeometry args={[1, 0]} />
        <meshStandardMaterial roughness={0.6} flatShading />
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
      <PlazaFlowerBeds y={centerY} />
      <PlazaFountain y={centerY + 0.02} />
    </group>
  );
}
