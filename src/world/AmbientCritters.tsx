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
        (() => {
          const furMix = Math.sin(anchor.seed * 0.19) * 0.5 + 0.5;
          const furColor = furMix > 0.5 ? '#d9d6d0' : '#efede8';
          const backColor = furMix > 0.5 ? '#b8b3ad' : '#d6d2cb';
          const bellyColor = '#f6f4f0';
          const earColor = furMix > 0.5 ? '#d6d0c9' : '#ebe6df';

          return (
            <group
              key={anchor.id}
              ref={(node) => {
                bunnyRefs.current[index] = node;
              }}
              position={[anchor.x, getTerrainHeight(anchor.x, anchor.z), anchor.z]}
            >
              <mesh castShadow position={[-0.045, 0.16, -0.01]} scale={[0.18, 0.13, 0.24]}>
                <sphereGeometry args={[1, 14, 12]} />
                <meshStandardMaterial color={backColor} roughness={0.86} />
              </mesh>
              <mesh castShadow position={[0.035, 0.16, 0.03]} scale={[0.15, 0.11, 0.2]}>
                <sphereGeometry args={[1, 14, 12]} />
                <meshStandardMaterial color={furColor} roughness={0.84} />
              </mesh>
              <mesh castShadow position={[0, 0.13, 0.045]} scale={[0.12, 0.055, 0.16]}>
                <sphereGeometry args={[1, 12, 10]} />
                <meshStandardMaterial color={bellyColor} roughness={0.88} />
              </mesh>
              <mesh castShadow position={[0.03, 0.21, 0.17]} scale={[0.09, 0.08, 0.11]}>
                <sphereGeometry args={[1, 12, 12]} />
                <meshStandardMaterial color={furColor} roughness={0.82} />
              </mesh>
              <mesh castShadow position={[0.055, 0.375, 0.165]} rotation={[0.06, 0, -0.08]}>
                <capsuleGeometry args={[0.018, 0.14, 4, 8]} />
                <meshStandardMaterial color={earColor} roughness={0.84} />
              </mesh>
              <mesh castShadow position={[0.01, 0.365, 0.185]} rotation={[-0.02, 0.03, 0.06]}>
                <capsuleGeometry args={[0.017, 0.13, 4, 8]} />
                <meshStandardMaterial color={earColor} roughness={0.84} />
              </mesh>
              <mesh castShadow position={[-0.11, 0.09, -0.02]} scale={[0.05, 0.07, 0.06]}>
                <sphereGeometry args={[1, 10, 10]} />
                <meshStandardMaterial color={backColor} roughness={0.9} />
              </mesh>
              <mesh castShadow position={[-0.02, 0.06, 0.12]} scale={[0.03, 0.045, 0.05]}>
                <sphereGeometry args={[1, 10, 10]} />
                <meshStandardMaterial color={furColor} roughness={0.9} />
              </mesh>
              <mesh castShadow position={[0.06, 0.06, 0.11]} scale={[0.03, 0.045, 0.05]}>
                <sphereGeometry args={[1, 10, 10]} />
                <meshStandardMaterial color={furColor} roughness={0.9} />
              </mesh>
              <mesh castShadow position={[0.055, 0.225, 0.23]}>
                <sphereGeometry args={[0.01, 8, 8]} />
                <meshStandardMaterial color="#1d1f2d" roughness={0.4} />
              </mesh>
              <mesh position={[0.03, 0.205, 0.245]}>
                <sphereGeometry args={[0.014, 8, 8]} />
                <meshStandardMaterial color="#f3b7ad" roughness={0.58} />
              </mesh>
              <mesh position={[0.03, 0.192, 0.255]} rotation={[Math.PI / 2, 0, 0]}>
                <coneGeometry args={[0.01, 0.028, 5]} />
                <meshStandardMaterial color="#f4ddd4" roughness={0.76} />
              </mesh>
            </group>
          );
        })()
      ))}
    </group>
  );
}
