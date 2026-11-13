import { useFrame } from '@react-three/fiber';
import { useEffect, useRef } from 'react';
import { Vector3 } from 'three';
import type { Group, Mesh, Object3D } from 'three';

import { useGameStore } from '../state/gameStore';
import { hasPerfFlag } from './perfFlags';

/**
 * Bench dioramas were the bulk of the shadow pass: every prop re-rendered into the shadow map, which made the
 * shadow-update frames spike (overview p95 34 ms vs 17 ms without prop shadows, M3 uncapped). Two rules keep the
 * shadows that matter:
 *  - Props smaller than SMALL_CASTER_RADIUS never cast: their shadows are a few pixels, often inside the desk's.
 *  - Larger props cast only while the player is near that bench; far benches are small on screen and still
 *    grounded by their plinth's own shadow. The switch has hysteresis so it never flickers at the boundary.
 */
export const SMALL_CASTER_RADIUS = 0.22;
export const SHADOW_ON_DISTANCE = 20;
export const SHADOW_OFF_DISTANCE = 23;
const CHECK_INTERVAL = 0.25;

/** Whether a bench at `distance` should cast prop shadows, given whether it does now. */
export function shouldCastSceneShadows(distance: number, castingNow: boolean): boolean {
  return castingNow ? distance <= SHADOW_OFF_DISTANCE : distance <= SHADOW_ON_DISTANCE;
}

function setCasting(meshes: readonly Mesh[], value: boolean): void {
  for (const mesh of meshes) mesh.castShadow = value;
}

function worldRadius(mesh: Mesh, scratch: Vector3): number {
  const geometry = mesh.geometry;
  if (!geometry.boundingSphere) geometry.computeBoundingSphere();
  mesh.getWorldScale(scratch);
  return (geometry.boundingSphere?.radius ?? 0) * Math.max(scratch.x, scratch.y, scratch.z);
}

export function useSceneShadowBudget(rootRef: React.RefObject<Group | null>, anchor: { x: number; z: number }) {
  const castersRef = useRef<Mesh[]>([]);
  const castingRef = useRef(true);
  const sinceCheckRef = useRef(CHECK_INTERVAL);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    if (hasPerfFlag('shadowfull')) return;
    root.updateMatrixWorld(true);
    const scratch = new Vector3();
    const casters: Mesh[] = [];
    root.traverse((object: Object3D) => {
      const mesh = object as Mesh;
      if (!mesh.isMesh || !mesh.castShadow) return;
      if (worldRadius(mesh, scratch) < SMALL_CASTER_RADIUS) mesh.castShadow = false;
      else casters.push(mesh);
    });
    castersRef.current = casters;
    castingRef.current = true;
    sinceCheckRef.current = CHECK_INTERVAL;
  }, [rootRef]);

  useFrame((_, delta) => {
    sinceCheckRef.current += delta;
    if (sinceCheckRef.current < CHECK_INTERVAL || castersRef.current.length === 0) return;
    sinceCheckRef.current = 0;
    const { playerPosition } = useGameStore.getState();
    const distance = Math.hypot(playerPosition.x - anchor.x, playerPosition.z - anchor.z);
    const next = shouldCastSceneShadows(distance, castingRef.current);
    if (next === castingRef.current) return;
    castingRef.current = next;
    setCasting(castersRef.current, next);
  });
}
