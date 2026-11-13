import { useLayoutEffect, useMemo, useRef } from 'react';
import { Color, Object3D } from 'three';
import type { InstancedMesh } from 'three';

import { getTerrainHeight } from '../terrain';
import { LAKE_DOCKS } from './dockLayout';

/** Plank docks beside the scenic benches: instanced planks, posts and a small lantern at the end. */

const PLANK_PITCH = 0.36;
const DECK_WIDTH = 1.3;
const PLANK_TONES = ['#b9875a', '#a97a50', '#c29165'];

export function LakeDocks() {
  const plankRef = useRef<InstancedMesh>(null);
  const postRef = useRef<InstancedMesh>(null);

  const layout = useMemo(() => {
    const planks: Array<{ x: number; y: number; z: number; yaw: number; tone: string }> = [];
    const posts: Array<{ x: number; y: number; z: number; height: number }> = [];
    const lanterns: Array<{ x: number; y: number; z: number }> = [];
    LAKE_DOCKS.forEach((dock, dockIndex) => {
      const yaw = Math.atan2(dock.direction.x, dock.direction.z);
      const sideX = dock.direction.z;
      const sideZ = -dock.direction.x;
      const count = Math.floor(dock.length / PLANK_PITCH);
      for (let index = 0; index < count; index += 1) {
        const along = (index + 0.5) * PLANK_PITCH;
        planks.push({
          x: dock.start.x + dock.direction.x * along,
          y: dock.deckY + ((index * 7 + dockIndex) % 3) * 0.006,
          z: dock.start.z + dock.direction.z * along,
          yaw,
          tone: PLANK_TONES[(index + dockIndex) % PLANK_TONES.length]!,
        });
      }
      for (const along of [0.3, dock.length * 0.55, dock.length - 0.2]) {
        for (const side of [-1, 1]) {
          const x = dock.start.x + dock.direction.x * along + sideX * side * (DECK_WIDTH / 2 - 0.06);
          const z = dock.start.z + dock.direction.z * along + sideZ * side * (DECK_WIDTH / 2 - 0.06);
          const bottom = Math.min(getTerrainHeight(x, z), dock.deckY - 0.9);
          posts.push({ x, y: (bottom + dock.deckY + 0.28) / 2, z, height: dock.deckY + 0.28 - bottom });
        }
      }
      const endAlong = dock.length - 0.2;
      lanterns.push({
        x: dock.start.x + dock.direction.x * endAlong + sideX * (DECK_WIDTH / 2 - 0.06),
        y: dock.deckY + 0.36,
        z: dock.start.z + dock.direction.z * endAlong + sideZ * (DECK_WIDTH / 2 - 0.06),
      });
    });
    return { planks, posts, lanterns };
  }, []);

  useLayoutEffect(() => {
    const dummy = new Object3D();
    const color = new Color();
    const plankMesh = plankRef.current;
    if (plankMesh) {
      layout.planks.forEach((plank, index) => {
        dummy.position.set(plank.x, plank.y, plank.z);
        dummy.rotation.set(0, plank.yaw, 0);
        dummy.scale.set(DECK_WIDTH, 0.07, PLANK_PITCH - 0.04);
        dummy.updateMatrix();
        plankMesh.setMatrixAt(index, dummy.matrix);
        plankMesh.setColorAt(index, color.set(plank.tone));
      });
      plankMesh.instanceMatrix.needsUpdate = true;
      if (plankMesh.instanceColor) plankMesh.instanceColor.needsUpdate = true;
      plankMesh.computeBoundingSphere();
    }
    const postMesh = postRef.current;
    if (postMesh) {
      layout.posts.forEach((post, index) => {
        dummy.position.set(post.x, post.y, post.z);
        dummy.rotation.set(0, 0, 0);
        dummy.scale.set(1, post.height, 1);
        dummy.updateMatrix();
        postMesh.setMatrixAt(index, dummy.matrix);
      });
      postMesh.instanceMatrix.needsUpdate = true;
      postMesh.computeBoundingSphere();
    }
  }, [layout]);

  return (
    <group>
      <instancedMesh ref={plankRef} args={[undefined, undefined, layout.planks.length]} castShadow receiveShadow>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial roughness={0.85} />
      </instancedMesh>
      <instancedMesh ref={postRef} args={[undefined, undefined, layout.posts.length]} castShadow>
        <cylinderGeometry args={[0.07, 0.08, 1, 8]} />
        <meshStandardMaterial color="#7a5236" roughness={0.9} />
      </instancedMesh>
      {layout.lanterns.map((lantern, index) => (
        <group key={index} position={[lantern.x, lantern.y, lantern.z]}>
          {/* A short post so the lantern stands on the deck instead of floating. */}
          <mesh castShadow position={[0, -0.24, 0]}>
            <cylinderGeometry args={[0.035, 0.045, 0.3, 6]} />
            <meshStandardMaterial color="#4e5b44" roughness={0.6} />
          </mesh>
          <mesh>
            <boxGeometry args={[0.16, 0.2, 0.16]} />
            <meshStandardMaterial color="#ffe0a3" emissive="#ffc46b" emissiveIntensity={1.2} toneMapped={false} />
          </mesh>
          <mesh position={[0, 0.14, 0]}>
            <coneGeometry args={[0.14, 0.1, 4]} />
            <meshStandardMaterial color="#d27a52" roughness={0.7} />
          </mesh>
        </group>
      ))}
    </group>
  );
}
