import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import { Object3D } from 'three';
import type { InstancedMesh } from 'three';

import { useGameStore } from '../state/gameStore';
import { getTerrainMeshHeight } from './terrainMesh';

/**
 * Small puffs of dust kicked up behind the player while walking or running: a fixed pool of instanced puffs
 * that rise, grow and shrink away over about half a second. Nothing is allocated per frame.
 */

const POOL = 24;
const LIFETIME = 0.55;
const MIN_SPEED = 1.2;

interface Puff {
  x: number;
  y: number;
  z: number;
  age: number;
  size: number;
}

export function FootstepDust() {
  const meshRef = useRef<InstancedMesh>(null);
  const puffsRef = useRef<Puff[] | null>(null);
  const dummyRef = useRef<Object3D | null>(null);
  const state = useRef({ next: 0, sinceSpawn: 0, lastX: 0, lastZ: 0, initialised: false });

  useFrame((_, rawDelta) => {
    const delta = Math.min(rawDelta, 0.1);
    const mesh = meshRef.current;
    if (!mesh) return;
    puffsRef.current ??= Array.from({ length: POOL }, () => ({ x: 0, y: -100, z: 0, age: LIFETIME, size: 0 }));
    dummyRef.current ??= new Object3D();
    const puffs = puffsRef.current;
    const dummy = dummyRef.current;
    const { playerPosition, playerMode } = useGameStore.getState();
    const s = state.current;
    if (!s.initialised) {
      s.lastX = playerPosition.x;
      s.lastZ = playerPosition.z;
      s.initialised = true;
    }
    const dx = playerPosition.x - s.lastX;
    const dz = playerPosition.z - s.lastZ;
    s.lastX = playerPosition.x;
    s.lastZ = playerPosition.z;
    const speed = delta > 0 ? Math.hypot(dx, dz) / delta : 0;

    s.sinceSpawn += delta;
    const interval = speed > 5 ? 0.07 : 0.13;
    if (playerMode === 'exploring' && speed > MIN_SPEED && speed < 30 && s.sinceSpawn > interval) {
      s.sinceSpawn = 0;
      const puff = puffs[s.next]!;
      s.next = (s.next + 1) % POOL;
      const back = 0.25 / Math.max(Math.hypot(dx, dz), 1e-4);
      const side = (Math.random() - 0.5) * 0.3;
      puff.x = playerPosition.x - dx * back + side * dz;
      puff.z = playerPosition.z - dz * back - side * dx;
      puff.y = getTerrainMeshHeight(puff.x, puff.z) + 0.06;
      puff.age = 0;
      puff.size = speed > 5 ? 0.16 : 0.11;
    }

    puffs.forEach((puff, index) => {
      puff.age += delta;
      const t = Math.min(puff.age / LIFETIME, 1);
      const scale = t >= 1 ? 0 : puff.size * (0.6 + t * 1.2) * (1 - t * t);
      dummy.position.set(puff.x, puff.y + t * 0.35, puff.z);
      dummy.scale.setScalar(scale);
      dummy.updateMatrix();
      mesh.setMatrixAt(index, dummy.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, POOL]} frustumCulled={false}>
      <icosahedronGeometry args={[1, 0]} />
      <meshStandardMaterial color="#efe0c2" roughness={1} flatShading transparent opacity={0.75} depthWrite={false} />
    </instancedMesh>
  );
}
