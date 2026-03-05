import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import { MathUtils } from 'three';
import type { Group } from 'three';

import { AMBIENT_BUNNY_ANCHORS } from './ambientLife';
import { getTerrainHeight, isPointWaterBlocked, isPointWalkable } from './terrain';

interface BunnyRuntimeState {
  x: number;
  z: number;
  yaw: number;
  targetYaw: number;
  speed: number;
  targetTimer: number;
  hopPhase: number;
  randomStep: number;
}

const BUNNY_TURN_RATE = 2.9;
const BUNNY_MIN_SPEED = 0.34;
const BUNNY_MAX_SPEED = 0.78;
const BUNNY_TARGET_INTERVAL_MIN = 0.8;
const BUNNY_TARGET_INTERVAL_MAX = 2.2;
const BUNNY_WANDER_LIMIT_SCALE = 1.34;

function wrapAngle(angle: number): number {
  return Math.atan2(Math.sin(angle), Math.cos(angle));
}

function rotateTowardAngle(current: number, target: number, maxStep: number): number {
  const delta = wrapAngle(target - current);
  return current + MathUtils.clamp(delta, -maxStep, maxStep);
}

function nextDeterministicRandom(state: BunnyRuntimeState, seed: number): number {
  const raw = Math.sin((state.randomStep + 1) * 12.9898 + seed * 78.233) * 43758.5453123;
  state.randomStep += 1;
  return raw - Math.floor(raw);
}

function createInitialState(seed: number, x: number, z: number): BunnyRuntimeState {
  const baseYaw = ((seed * 0.137 + 0.31) % 1) * Math.PI * 2;
  return {
    x,
    z,
    yaw: baseYaw,
    targetYaw: baseYaw,
    speed: BUNNY_MIN_SPEED,
    targetTimer: 0.3,
    hopPhase: seed * 0.11,
    randomStep: 0,
  };
}

export function AmbientCritters() {
  const bunnyRefs = useRef<Array<Group | null>>([]);
  const bunnyStateRef = useRef<BunnyRuntimeState[]>(
    AMBIENT_BUNNY_ANCHORS.map((anchor) => createInitialState(anchor.seed, anchor.x, anchor.z)),
  );

  useFrame((_, delta) => {
    const bunnyStates = bunnyStateRef.current;

    for (let index = 0; index < AMBIENT_BUNNY_ANCHORS.length; index += 1) {
      const anchor = AMBIENT_BUNNY_ANCHORS[index];
      const state = bunnyStates[index];
      const bunnyGroup = bunnyRefs.current[index];
      if (!anchor || !state || !bunnyGroup) {
        continue;
      }

      state.targetTimer -= delta;
      if (state.targetTimer <= 0) {
        const toAnchorX = anchor.x - state.x;
        const toAnchorZ = anchor.z - state.z;
        const distanceFromAnchor = Math.hypot(toAnchorX, toAnchorZ);
        const randomTurn = (nextDeterministicRandom(state, anchor.seed) - 0.5) * 1.8;

        if (distanceFromAnchor > anchor.wanderRadius * 0.95) {
          const returnYaw = Math.atan2(toAnchorX, toAnchorZ);
          const steerJitter = (nextDeterministicRandom(state, anchor.seed) - 0.5) * 0.7;
          state.targetYaw = wrapAngle(returnYaw + steerJitter);
        } else {
          state.targetYaw = wrapAngle(state.yaw + randomTurn);
        }

        const speedMix = nextDeterministicRandom(state, anchor.seed);
        state.speed = MathUtils.lerp(BUNNY_MIN_SPEED, BUNNY_MAX_SPEED, speedMix);
        const intervalMix = nextDeterministicRandom(state, anchor.seed);
        state.targetTimer = MathUtils.lerp(BUNNY_TARGET_INTERVAL_MIN, BUNNY_TARGET_INTERVAL_MAX, intervalMix);
      }

      state.yaw = rotateTowardAngle(state.yaw, state.targetYaw, BUNNY_TURN_RATE * delta);

      const stepDistance = state.speed * delta;
      const candidateX = state.x + Math.sin(state.yaw) * stepDistance;
      const candidateZ = state.z + Math.cos(state.yaw) * stepDistance;
      const outsideWanderRadius =
        Math.hypot(candidateX - anchor.x, candidateZ - anchor.z) > anchor.wanderRadius * BUNNY_WANDER_LIMIT_SCALE;
      const blockedByTerrain =
        !isPointWalkable(candidateX, candidateZ, 0.2) || isPointWaterBlocked(candidateX, candidateZ, 0.2);

      if (outsideWanderRadius || blockedByTerrain) {
        state.targetYaw = Math.atan2(anchor.x - state.x, anchor.z - state.z);
        state.targetTimer = 0;
        state.speed = Math.max(BUNNY_MIN_SPEED, state.speed * 0.65);
      } else {
        state.x = candidateX;
        state.z = candidateZ;
      }

      state.hopPhase += delta * (5.4 + state.speed * 4.8);
      const hop = Math.max(0, Math.sin(state.hopPhase)) * anchor.hopHeight;
      const terrainY = getTerrainHeight(state.x, state.z);
      bunnyGroup.position.set(state.x, terrainY + hop, state.z);
      bunnyGroup.rotation.set(0, state.yaw, 0);
    }
  });

  return (
    <group>
      {AMBIENT_BUNNY_ANCHORS.map((anchor, index) => (
        <group
          key={anchor.id}
          ref={(node) => {
            bunnyRefs.current[index] = node;
          }}
          position={[anchor.x, getTerrainHeight(anchor.x, anchor.z), anchor.z]}
        >
          <mesh castShadow position={[-0.02, 0.16, 0]}>
            <sphereGeometry args={[0.15, 12, 12]} />
            <meshStandardMaterial color="#f5f0e6" roughness={0.84} />
          </mesh>
          <mesh castShadow position={[0, 0.2, 0.11]}>
            <sphereGeometry args={[0.085, 12, 12]} />
            <meshStandardMaterial color="#fdf8f0" roughness={0.82} />
          </mesh>
          <mesh castShadow position={[0.045, 0.39, 0.12]}>
            <capsuleGeometry args={[0.024, 0.13, 4, 8]} />
            <meshStandardMaterial color="#f7f0e2" roughness={0.82} />
          </mesh>
          <mesh castShadow position={[-0.015, 0.39, 0.14]}>
            <capsuleGeometry args={[0.024, 0.13, 4, 8]} />
            <meshStandardMaterial color="#f7f0e2" roughness={0.82} />
          </mesh>
          <mesh castShadow position={[0.03, 0.22, 0.17]}>
            <sphereGeometry args={[0.012, 8, 8]} />
            <meshStandardMaterial color="#1d1f2d" roughness={0.4} />
          </mesh>
          <mesh position={[0, 0.2, 0.19]}>
            <sphereGeometry args={[0.019, 8, 8]} />
            <meshStandardMaterial color="#f4b8ad" roughness={0.55} />
          </mesh>
        </group>
      ))}
    </group>
  );
}
