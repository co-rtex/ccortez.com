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
  const leftWingRefs = useRef<Array<Group | null>>([]);
  const rightWingRefs = useRef<Array<Group | null>>([]);
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
      const nextY = track.altitude + Math.sin(nextAngle * 2.4 + track.seed) * 0.8;
      const velocityX = nextX - x;
      const velocityZ = nextZ - z;
      const desiredYaw = Math.atan2(velocityX, velocityZ);
      state.yaw = rotateTowardAngle(state.yaw, desiredYaw, BIRD_MAX_TURN_RATE * delta);

      birdGroup.position.set(x, y, z);
      const yawDelta = wrapAngle(desiredYaw - state.yaw);
      const pitch = MathUtils.clamp((nextY - y) * 0.6, -0.22, 0.22);
      const bank = MathUtils.clamp(yawDelta * 1.8, -0.34, 0.34);
      birdGroup.rotation.set(pitch, state.yaw, -bank);

      const flap = Math.sin(state.angle * 10.2 + track.seed) * 0.5 + 0.5;
      const leftWing = leftWingRefs.current[index];
      const rightWing = rightWingRefs.current[index];
      if (leftWing && rightWing) {
        const wingAngle = MathUtils.lerp(-0.28, 0.62, flap);
        leftWing.rotation.z = wingAngle;
        rightWing.rotation.z = -wingAngle;
      }
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
          <mesh castShadow scale={[0.11, 0.085, 0.28]}>
            <sphereGeometry args={[1, 12, 10]} />
            <meshStandardMaterial color="#39425d" roughness={0.62} />
          </mesh>
          <mesh castShadow position={[0, -0.012, 0.02]} scale={[0.07, 0.048, 0.16]}>
            <sphereGeometry args={[1, 12, 10]} />
            <meshStandardMaterial color="#dce3ee" roughness={0.72} />
          </mesh>
          <mesh castShadow position={[0, 0.01, 0.2]} scale={[0.055, 0.052, 0.09]}>
            <sphereGeometry args={[1, 10, 10]} />
            <meshStandardMaterial color="#4a536d" roughness={0.58} />
          </mesh>
          <mesh castShadow position={[0, 0.018, 0.285]} rotation={[Math.PI / 2, 0, 0]}>
            <coneGeometry args={[0.018, 0.065, 6]} />
            <meshStandardMaterial color="#e6bf74" roughness={0.42} />
          </mesh>
          <mesh castShadow position={[0.02, 0.02, 0.225]}>
            <sphereGeometry args={[0.01, 8, 8]} />
            <meshStandardMaterial color="#1f2535" roughness={0.34} />
          </mesh>
          <mesh castShadow position={[-0.02, 0.02, 0.225]}>
            <sphereGeometry args={[0.01, 8, 8]} />
            <meshStandardMaterial color="#1f2535" roughness={0.34} />
          </mesh>
          <mesh castShadow position={[0, -0.004, -0.16]} rotation={[-Math.PI / 2, 0, 0]}>
            <coneGeometry args={[0.028, 0.09, 4]} />
            <meshStandardMaterial color="#334059" roughness={0.66} />
          </mesh>
          <group
            ref={(node) => {
              leftWingRefs.current[index] = node;
            }}
            position={[-0.07, 0.008, -0.015]}
          >
            <mesh castShadow rotation={[0.04, 0.12, -0.12]}>
              <boxGeometry args={[0.18, 0.018, 0.085]} />
              <meshStandardMaterial color="#4d5877" roughness={0.56} />
            </mesh>
          </group>
          <group
            ref={(node) => {
              rightWingRefs.current[index] = node;
            }}
            position={[0.07, 0.008, -0.015]}
          >
            <mesh castShadow rotation={[0.04, -0.12, 0.12]}>
              <boxGeometry args={[0.18, 0.018, 0.085]} />
              <meshStandardMaterial color="#4d5877" roughness={0.56} />
            </mesh>
          </group>
        </group>
      ))}
    </group>
  );
}
