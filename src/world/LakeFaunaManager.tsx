import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import { MathUtils } from 'three';
import type { Group, Mesh } from 'three';

import { getLakeFaunaPlanByLakeId } from './ambientLife';
import { WORLD_WATER_BODIES } from './constants';
import { getLakeBoundaryPoint, getWaterSurfaceHeight } from './terrain';

import type { WaterBodyDefinition } from './constants';

const FISH_JUMP_INTERVAL = 3.6;
const FISH_JUMP_DURATION = 0.74;
const DUCK_MAX_TURN_RATE = 3;
const FISH_BODY_SCALE: [number, number, number] = [0.14, 0.08, 0.38];
const FISH_HEAD_SCALE: [number, number, number] = [0.09, 0.065, 0.18];
const FISH_TAIL_FIN_RADIUS = 0.082;
const FISH_TAIL_FIN_LENGTH = 0.16;

interface DuckRuntimeState {
  angle: number;
  yaw: number;
  speed: number;
  laneScale: number;
  bobPhase: number;
}

function wrapAngle(angle: number): number {
  return Math.atan2(Math.sin(angle), Math.cos(angle));
}

function rotateTowardAngle(current: number, target: number, maxStep: number): number {
  const delta = wrapAngle(target - current);
  return current + MathUtils.clamp(delta, -maxStep, maxStep);
}

function LakeDucks({ body, seed }: { body: WaterBodyDefinition; seed: number }) {
  const duckRefs = useRef<Array<Group | null>>([]);
  const wakeRefs = useRef<Array<Mesh | null>>([]);
  const duckStatesRef = useRef<DuckRuntimeState[]>(
    new Array(2).fill(0).map((_, index) => {
      const angle = seed * 0.29 + index * 2.05;
      const speed = 0.2 + index * 0.04 + (Math.sin(seed + index * 1.3) * 0.03 + 0.03);
      return {
        angle,
        yaw: angle + Math.PI * 0.5,
        speed: Math.max(0.16, speed),
        laneScale: 0.56 + index * 0.08,
        bobPhase: seed * 0.21 + index * 1.6,
      };
    }),
  );
  const waterY = useMemo(() => getWaterSurfaceHeight(body) + 0.035, [body]);

  useFrame((_, delta) => {
    for (let index = 0; index < 2; index += 1) {
      const duckGroup = duckRefs.current[index];
      const duckState = duckStatesRef.current[index];
      if (!duckGroup) {
        continue;
      }
      if (!duckState) {
        continue;
      }

      duckState.angle += Math.abs(duckState.speed) * delta;
      duckState.bobPhase += delta * 2.8;
      const point = getLakeBoundaryPoint(body, duckState.angle, duckState.laneScale);
      const lookAhead = getLakeBoundaryPoint(body, duckState.angle + 0.03, duckState.laneScale);
      const velocityX = lookAhead.x - point.x;
      const velocityZ = lookAhead.z - point.z;
      const desiredYaw = Math.atan2(velocityX, velocityZ);
      duckState.yaw = rotateTowardAngle(duckState.yaw, desiredYaw, DUCK_MAX_TURN_RATE * delta);

      duckGroup.position.set(point.x, waterY + Math.sin(duckState.bobPhase) * 0.018, point.z);
      duckGroup.rotation.y = duckState.yaw;

      const wake = wakeRefs.current[index];
      if (wake) {
        const headingLength = Math.hypot(velocityX, velocityZ) || 1;
        const dirX = velocityX / headingLength;
        const dirZ = velocityZ / headingLength;
        wake.position.set(point.x - dirX * 0.16, waterY - 0.012, point.z - dirZ * 0.16);
        const wakeScale = 0.7 + Math.sin(duckState.bobPhase * 1.4) * 0.08;
        wake.scale.setScalar(wakeScale);
      }
    }
  });

  return (
    <group>
      {new Array(2).fill(0).map((_, index) => (
        <group
          key={`${body.id}-duck-${index}`}
          ref={(node) => {
            duckRefs.current[index] = node;
          }}
          position={[body.centerX, waterY, body.centerZ]}
        >
          <mesh castShadow position={[0, 0.045, 0]}>
            <sphereGeometry args={[0.1, 10, 10]} />
            <meshStandardMaterial color="#f7ebcf" roughness={0.55} />
          </mesh>
          <mesh castShadow position={[0, 0.07, 0.1]}>
            <sphereGeometry args={[0.058, 10, 10]} />
            <meshStandardMaterial color="#fdf3dc" roughness={0.56} />
          </mesh>
          <mesh castShadow position={[0, 0.066, 0.17]} rotation={[Math.PI / 2, 0, 0]}>
            <coneGeometry args={[0.024, 0.055, 8]} />
            <meshStandardMaterial color="#ff9f47" roughness={0.49} />
          </mesh>
          <mesh castShadow position={[0.02, 0.08, 0.12]}>
            <sphereGeometry args={[0.011, 8, 8]} />
            <meshStandardMaterial color="#2a2d40" roughness={0.42} />
          </mesh>
          <mesh castShadow position={[0, 0.047, -0.11]} rotation={[-Math.PI / 2, 0, 0]}>
            <coneGeometry args={[0.032, 0.07, 4]} />
            <meshStandardMaterial color="#d0c3a0" roughness={0.66} />
          </mesh>
        </group>
      ))}
      {new Array(2).fill(0).map((_, index) => (
        <mesh
          key={`${body.id}-wake-${index}`}
          ref={(node) => {
            wakeRefs.current[index] = node;
          }}
          rotation={[-Math.PI / 2, 0, 0]}
          position={[body.centerX, waterY - 0.01, body.centerZ]}
        >
          <ringGeometry args={[0.13, 0.2, 14]} />
          <meshBasicMaterial color="#d5f4ff" transparent opacity={0.2} toneMapped={false} />
        </mesh>
      ))}
    </group>
  );
}

function LakeFishJump({ body, seed }: { body: WaterBodyDefinition; seed: number }) {
  const fishRef = useRef<Group>(null);
  const fishBodyRef = useRef<Group>(null);
  const fishTailRef = useRef<Group>(null);
  const launchRippleRef = useRef<Mesh>(null);
  const entryRippleRef = useRef<Mesh>(null);
  const waterY = useMemo(() => getWaterSurfaceHeight(body) + 0.02, [body]);

  useFrame(({ clock }) => {
    const fish = fishRef.current;
    const fishBody = fishBodyRef.current;
    const fishTail = fishTailRef.current;
    const launchRipple = launchRippleRef.current;
    const entryRipple = entryRippleRef.current;
    if (!fish || !fishBody || !fishTail || !launchRipple || !entryRipple) {
      return;
    }

    const elapsedTime = clock.elapsedTime;
    const jumpCycleTime = (elapsedTime + seed * 0.19) % FISH_JUMP_INTERVAL;
    const jumpAngle = elapsedTime * 0.18 + seed;
    const launchPoint = getLakeBoundaryPoint(body, jumpAngle, 0.5);
    const landingPoint = getLakeBoundaryPoint(body, jumpAngle + 0.05, 0.54);

    if (jumpCycleTime <= FISH_JUMP_DURATION) {
      const progress = jumpCycleTime / FISH_JUMP_DURATION;
      const jumpHeight = Math.sin(progress * Math.PI) * 0.86;
      const horizontalX = MathUtils.lerp(launchPoint.x, landingPoint.x, progress);
      const horizontalZ = MathUtils.lerp(launchPoint.z, landingPoint.z, progress);
      const travelX = landingPoint.x - launchPoint.x;
      const travelZ = landingPoint.z - launchPoint.z;
      const heading = Math.atan2(travelX, travelZ);
      const tailWave = Math.sin(progress * Math.PI * 3.4 + elapsedTime * 8.6) * 0.32;
      fish.visible = true;
      fish.position.set(horizontalX, waterY + jumpHeight, horizontalZ);
      fish.rotation.set(-0.4 + progress * Math.PI * 0.88 + tailWave * 0.18, heading, tailWave * 0.18);
      fishBody.rotation.y = tailWave * 0.2;
      fishTail.rotation.y = -tailWave * 1.75;
    } else {
      fish.visible = false;
    }

    const launchRippleProgress = Math.min(1, jumpCycleTime / 0.48);
    launchRipple.position.set(launchPoint.x, waterY - 0.014, launchPoint.z);
    launchRipple.scale.setScalar(0.5 + launchRippleProgress * 1.45);
    launchRipple.visible = jumpCycleTime < 0.66;

    const landingWindowStart = FISH_JUMP_DURATION - 0.18;
    if (jumpCycleTime >= landingWindowStart && jumpCycleTime <= FISH_JUMP_DURATION + 0.24) {
      const landingProgress = MathUtils.clamp((jumpCycleTime - landingWindowStart) / 0.42, 0, 1);
      entryRipple.position.set(landingPoint.x, waterY - 0.014, landingPoint.z);
      entryRipple.scale.setScalar(0.45 + landingProgress * 1.5);
      entryRipple.visible = true;
    } else {
      entryRipple.visible = false;
    }
  });

  return (
    <group>
      <group ref={fishRef} visible={false}>
        <group ref={fishBodyRef}>
          <mesh castShadow scale={FISH_BODY_SCALE}>
            <sphereGeometry args={[1, 14, 14]} />
            <meshStandardMaterial color="#ffb173" roughness={0.36} metalness={0.06} />
          </mesh>
          <mesh castShadow position={[0, 0, 0.19]} scale={FISH_HEAD_SCALE}>
            <sphereGeometry args={[1, 12, 12]} />
            <meshStandardMaterial color="#ffc08a" roughness={0.34} metalness={0.05} />
          </mesh>
          <mesh castShadow position={[0, 0.062, 0.03]} rotation={[Math.PI / 2, 0, 0]}>
            <coneGeometry args={[0.022, 0.08, 3]} />
            <meshStandardMaterial color="#f09d63" roughness={0.42} />
          </mesh>
          <mesh castShadow position={[0.024, 0.018, 0.23]}>
            <sphereGeometry args={[0.012, 8, 8]} />
            <meshStandardMaterial color="#2f3f63" roughness={0.34} />
          </mesh>
          <mesh castShadow position={[-0.024, 0.018, 0.23]}>
            <sphereGeometry args={[0.012, 8, 8]} />
            <meshStandardMaterial color="#2f3f63" roughness={0.34} />
          </mesh>
        </group>

        <group ref={fishTailRef} position={[0, 0, -0.3]}>
          <mesh castShadow position={[0, 0.03, 0]} rotation={[Math.PI / 2 - 0.2, 0, 0]}>
            <coneGeometry args={[FISH_TAIL_FIN_RADIUS, FISH_TAIL_FIN_LENGTH, 3]} />
            <meshStandardMaterial color="#e8945a" roughness={0.43} />
          </mesh>
          <mesh castShadow position={[0, -0.03, 0]} rotation={[Math.PI / 2 + 0.2, 0, Math.PI]}>
            <coneGeometry args={[FISH_TAIL_FIN_RADIUS, FISH_TAIL_FIN_LENGTH, 3]} />
            <meshStandardMaterial color="#e8945a" roughness={0.43} />
          </mesh>
          <mesh castShadow position={[0, 0, 0.055]} rotation={[Math.PI / 2, 0, 0]}>
            <coneGeometry args={[0.028, 0.085, 5]} />
            <meshStandardMaterial color="#f6a56b" roughness={0.42} />
          </mesh>
        </group>
      </group>
      <mesh ref={launchRippleRef} rotation={[-Math.PI / 2, 0, 0]} visible={false}>
        <ringGeometry args={[0.12, 0.18, 18]} />
        <meshBasicMaterial color="#b9f1ff" transparent opacity={0.34} toneMapped={false} />
      </mesh>
      <mesh ref={entryRippleRef} rotation={[-Math.PI / 2, 0, 0]} visible={false}>
        <ringGeometry args={[0.12, 0.2, 18]} />
        <meshBasicMaterial color="#d8f8ff" transparent opacity={0.3} toneMapped={false} />
      </mesh>
    </group>
  );
}

export function LakeFaunaManager() {
  return (
    <group>
      {WORLD_WATER_BODIES.map((body) => {
        const plan = getLakeFaunaPlanByLakeId(body.id);
        if (!plan) {
          return null;
        }

        return plan.kind === 'ducks' ? (
          <LakeDucks key={`${body.id}-ducks`} body={body} seed={plan.seed} />
        ) : (
          <LakeFishJump key={`${body.id}-fish`} body={body} seed={plan.seed} />
        );
      })}
    </group>
  );
}
