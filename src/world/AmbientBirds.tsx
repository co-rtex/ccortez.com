import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import { MathUtils } from 'three';
import type { Group } from 'three';

import { AMBIENT_BIRD_TRACKS } from './ambientLife';

interface BirdRuntimeState {
  angle: number;
  yaw: number;
}

const BIRD_MAX_TURN_RATE = 2.6;

function wrapAngle(angle: number): number {
  return Math.atan2(Math.sin(angle), Math.cos(angle));
}

function rotateTowardAngle(current: number, target: number, maxStep: number): number {
  const delta = wrapAngle(target - current);
  return current + MathUtils.clamp(delta, -maxStep, maxStep);
}

export function AmbientBirds() {
  const birdRefs = useRef<Array<Group | null>>([]);
  const birdStateRef = useRef<BirdRuntimeState[]>(
    AMBIENT_BIRD_TRACKS.map((track) => {
      const angle = ((track.seed * 0.27) % 1) * Math.PI * 2;
      return {
        angle,
        yaw: angle + Math.PI * 0.5,
      };
    }),
  );

  useFrame((_, delta) => {
    for (let index = 0; index < AMBIENT_BIRD_TRACKS.length; index += 1) {
      const track = AMBIENT_BIRD_TRACKS[index];
      const state = birdStateRef.current[index];
      const birdGroup = birdRefs.current[index];
      if (!track || !state || !birdGroup) {
        continue;
      }

      state.angle += Math.abs(track.speed) * delta;
      const x = track.centerX + Math.cos(state.angle) * track.radiusX;
      const z = track.centerZ + Math.sin(state.angle) * track.radiusZ;
      const y = track.altitude + Math.sin(state.angle * 2.4 + track.seed) * 0.8;

      const nextAngle = state.angle + 0.02;
      const nextX = track.centerX + Math.cos(nextAngle) * track.radiusX;
      const nextZ = track.centerZ + Math.sin(nextAngle) * track.radiusZ;
      const velocityX = nextX - x;
      const velocityZ = nextZ - z;
      const desiredYaw = Math.atan2(velocityX, velocityZ);
      state.yaw = rotateTowardAngle(state.yaw, desiredYaw, BIRD_MAX_TURN_RATE * delta);

      birdGroup.position.set(x, y, z);
      birdGroup.rotation.y = state.yaw;

      const flap = Math.sin(state.angle * 10.2 + track.seed) * 0.5 + 0.5;
      birdGroup.scale.set(1.08, 0.86 + flap * 0.34, 1.08);
    }
  });

  return (
    <group>
      {AMBIENT_BIRD_TRACKS.map((track, index) => (
        <group
          key={track.id}
          ref={(node) => {
            birdRefs.current[index] = node;
          }}
          position={[track.centerX, track.altitude, track.centerZ]}
        >
          <mesh castShadow position={[0, 0, 0]}>
            <sphereGeometry args={[0.09, 8, 8]} />
            <meshStandardMaterial color="#2f3655" roughness={0.6} />
          </mesh>
          <mesh castShadow position={[-0.14, 0.01, 0]}>
            <boxGeometry args={[0.22, 0.022, 0.09]} />
            <meshStandardMaterial color="#495780" roughness={0.56} />
          </mesh>
          <mesh castShadow position={[0.14, 0.01, 0]}>
            <boxGeometry args={[0.22, 0.022, 0.09]} />
            <meshStandardMaterial color="#495780" roughness={0.56} />
          </mesh>
          <mesh position={[0, -0.022, 0.02]}>
            <sphereGeometry args={[0.045, 8, 8]} />
            <meshStandardMaterial color="#cedcf0" roughness={0.74} />
          </mesh>
          <mesh castShadow position={[0, 0.002, 0.14]} rotation={[Math.PI / 2, 0, 0]}>
            <coneGeometry args={[0.022, 0.06, 5]} />
            <meshStandardMaterial color="#f8c47c" roughness={0.42} />
          </mesh>
          <mesh castShadow position={[0, 0, -0.12]} rotation={[-Math.PI / 2, 0, 0]}>
            <coneGeometry args={[0.03, 0.08, 4]} />
            <meshStandardMaterial color="#34425f" roughness={0.62} />
          </mesh>
        </group>
      ))}
    </group>
  );
}
