import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import { MathUtils, Quaternion, Vector3 } from 'three';
import type { Group, Mesh } from 'three';

import { getLakeFaunaPlanByLakeId } from './ambientLife';
import { WORLD_WATER_BODIES } from './constants';
import { getLakeBoundaryPoint, getWaterSurfaceHeight } from './terrain';

import type { WaterBodyDefinition } from './constants';

const FISH_JUMP_DURATION = 0.88;
const FISH_PER_LAKE = 4;
const FISH_JUMP_SLOT_GAP = 4.3;
const FISH_JUMP_SLOT_JITTER = 0.28;
const DUCK_MAX_TURN_RATE = 3;
const FISH_BODY_SCALE: [number, number, number] = [0.09, 0.055, 0.36];
const FISH_TAIL_FIN_RADIUS = 0.05;
const FISH_TAIL_FIN_LENGTH = 0.135;

interface DuckRuntimeState {
  angle: number;
  yaw: number;
  speed: number;
  laneScale: number;
  bobPhase: number;
}

interface FishJumpProfile {
  angleOffset: number;
  swimSpeed: number;
  arcSpan: number;
  laneScale: number;
  jumpHeight: number;
  phaseOffset: number;
}

interface FishJumpRuntimeState {
  active: boolean;
  jumpIndex: number;
  jumpStartTime: number;
  nextJumpTime: number;
  launchPoint: { x: number; z: number };
  landingPoint: { x: number; z: number };
}

function wrapAngle(angle: number): number {
  return Math.atan2(Math.sin(angle), Math.cos(angle));
}

function rotateTowardAngle(current: number, target: number, maxStep: number): number {
  const delta = wrapAngle(target - current);
  return current + MathUtils.clamp(delta, -maxStep, maxStep);
}

function normalizedNoise(seed: number, index: number): number {
  const value = Math.sin(seed * 12.9898 + index * 78.233) * 43758.5453;
  return value - Math.floor(value);
}

function createFishJumpProfile(seed: number, fishIndex: number, fishCount: number): FishJumpProfile {
  const oscillationA = Math.sin(seed * 0.73) * 0.5 + 0.5;
  const oscillationB = Math.cos(seed * 1.11) * 0.5 + 0.5;
  const oscillationC = Math.sin(seed * 1.67) * 0.5 + 0.5;
  const schoolOffset = fishCount <= 0 ? 0 : (fishIndex / fishCount) * Math.PI * 2;
  const timingOffset = fishIndex * FISH_JUMP_SLOT_GAP;

  return {
    angleOffset: schoolOffset + seed * 0.08,
    swimSpeed: 0.105 + oscillationA * 0.022,
    arcSpan: 0.152 + oscillationB * 0.028,
    laneScale: 0.33 + (oscillationC - 0.5) * 0.05,
    jumpHeight: 0.38 + oscillationB * 0.1,
    phaseOffset: timingOffset + seed * 0.09,
  };
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

function LakeFishJump({
  body,
  seed,
  fishIndex,
  fishCount,
}: {
  body: WaterBodyDefinition;
  seed: number;
  fishIndex: number;
  fishCount: number;
}) {
  const fishRef = useRef<Group>(null);
  const fishBodyRef = useRef<Group>(null);
  const fishTailRef = useRef<Group>(null);
  const launchRippleRef = useRef<Mesh>(null);
  const entryRippleRef = useRef<Mesh>(null);
  const waterY = useMemo(() => getWaterSurfaceHeight(body) + 0.02, [body]);
  const jumpProfile = useMemo(
    () => createFishJumpProfile(seed, fishIndex, fishCount),
    [seed, fishIndex, fishCount],
  );
  const schoolCycleDuration = useMemo(() => fishCount * FISH_JUMP_SLOT_GAP, [fishCount]);
  const forwardVector = useMemo(() => new Vector3(0, 0, 1), []);
  const tangentVector = useMemo(() => new Vector3(), []);
  const fishOrientation = useMemo(() => new Quaternion(), []);
  const fishRoll = useMemo(() => new Quaternion(), []);
  const jumpStateRef = useRef<FishJumpRuntimeState>({
    active: false,
    jumpIndex: 0,
    jumpStartTime: 0,
    nextJumpTime: jumpProfile.phaseOffset,
    launchPoint: { x: body.centerX, z: body.centerZ },
    landingPoint: { x: body.centerX, z: body.centerZ },
  });

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
    const jumpState = jumpStateRef.current;

    if (!jumpState.active && elapsedTime >= jumpState.nextJumpTime) {
      const arcNoise = normalizedNoise(seed, jumpState.jumpIndex * 2 + 1);
      const laneNoise = normalizedNoise(seed, jumpState.jumpIndex * 2 + 2);
      const launchAngle = jumpProfile.angleOffset + jumpState.nextJumpTime * jumpProfile.swimSpeed;
      const landingAngle = launchAngle + jumpProfile.arcSpan * (0.94 + arcNoise * 0.16);
      const laneScale = MathUtils.clamp(
        jumpProfile.laneScale + (laneNoise - 0.5) * 0.035,
        0.26,
        0.42,
      );

      jumpState.active = true;
      jumpState.jumpStartTime = jumpState.nextJumpTime;
      jumpState.launchPoint = getLakeBoundaryPoint(body, launchAngle, laneScale);
      jumpState.landingPoint = getLakeBoundaryPoint(body, landingAngle, laneScale);
    }

    const launchPoint = jumpState.launchPoint;
    const landingPoint = jumpState.landingPoint;
    const travelX = landingPoint.x - launchPoint.x;
    const travelZ = landingPoint.z - launchPoint.z;
    const heading = Math.atan2(travelX, travelZ);

    if (jumpState.active) {
      const jumpCycleTime = elapsedTime - jumpState.jumpStartTime;
      if (jumpCycleTime <= FISH_JUMP_DURATION) {
        const progress = jumpCycleTime / FISH_JUMP_DURATION;
        const easedProgress = progress * progress * (3 - 2 * progress);
        const jumpHeight = Math.sin(easedProgress * Math.PI) * jumpProfile.jumpHeight;
        const horizontalX = MathUtils.lerp(launchPoint.x, landingPoint.x, easedProgress);
        const horizontalZ = MathUtils.lerp(launchPoint.z, landingPoint.z, easedProgress);
        const sampleStep = 0.035;
        const prevProgress = Math.max(0, progress - sampleStep);
        const nextProgress = Math.min(1, progress + sampleStep);
        const prevEased = prevProgress * prevProgress * (3 - 2 * prevProgress);
        const nextEased = nextProgress * nextProgress * (3 - 2 * nextProgress);
        const prevY = Math.sin(prevEased * Math.PI) * jumpProfile.jumpHeight;
        const nextY = Math.sin(nextEased * Math.PI) * jumpProfile.jumpHeight;
        const tailWave = Math.sin(easedProgress * Math.PI * 4.8 + elapsedTime * 13.2) * 0.16;
        const bodyCurve = Math.sin(progress * Math.PI) * 0.16;
        const bodySway = Math.sin(easedProgress * Math.PI * 2 + elapsedTime * 6.4) * 0.035;
        const prevX = MathUtils.lerp(launchPoint.x, landingPoint.x, prevEased);
        const prevZ = MathUtils.lerp(launchPoint.z, landingPoint.z, prevEased);
        const nextX = MathUtils.lerp(launchPoint.x, landingPoint.x, nextEased);
        const nextZ = MathUtils.lerp(launchPoint.z, landingPoint.z, nextEased);
        fish.visible = true;
        fish.position.set(horizontalX, waterY + jumpHeight, horizontalZ);
        tangentVector.set(nextX - prevX, nextY - prevY, nextZ - prevZ);
        if (tangentVector.lengthSq() > 0.000001) {
          tangentVector.normalize();
          fishOrientation.setFromUnitVectors(forwardVector, tangentVector);
          fishRoll.setFromAxisAngle(forwardVector, bodySway);
          fish.quaternion.copy(fishOrientation).multiply(fishRoll);
        } else {
          fish.rotation.set(0, heading, 0);
        }
        fishBody.rotation.x = -bodyCurve * 0.55;
        fishBody.rotation.y = tailWave * 0.06;
        fishBody.rotation.z = bodySway * 0.4;
        fishTail.rotation.x = bodyCurve * 0.42;
        fishTail.rotation.y = -tailWave * 3.1;
      } else {
        jumpState.active = false;
        jumpState.jumpIndex += 1;
        const slotNoise = normalizedNoise(seed, jumpState.jumpIndex * 5 + 11) - 0.5;
        const slotJitter = slotNoise * FISH_JUMP_SLOT_JITTER * 2;
        jumpState.nextJumpTime =
          jumpProfile.phaseOffset + jumpState.jumpIndex * schoolCycleDuration + slotJitter;
        fish.visible = false;
        fishBody.rotation.set(0, 0, 0);
        fishTail.rotation.set(0, 0, 0);
      }
    } else {
      fish.visible = false;
      fishBody.rotation.set(0, 0, 0);
      fishTail.rotation.set(0, 0, 0);
    }

    if (jumpState.active) {
      const jumpCycleTime = elapsedTime - jumpState.jumpStartTime;
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
    } else {
      launchRipple.visible = false;
      entryRipple.visible = false;
    }
  });

  return (
    <group>
      <group ref={fishRef} visible={false}>
        <group ref={fishBodyRef}>
          <mesh castShadow scale={FISH_BODY_SCALE}>
            <sphereGeometry args={[1, 20, 16]} />
            <meshStandardMaterial color="#cc7a3f" roughness={0.34} metalness={0.04} />
          </mesh>
          <mesh castShadow position={[0, -0.02, 0.01]} scale={[0.064, 0.022, 0.22]}>
            <sphereGeometry args={[1, 16, 10]} />
            <meshStandardMaterial color="#efc691" roughness={0.44} metalness={0.02} />
          </mesh>
          <mesh castShadow position={[0, 0.002, 0.27]} rotation={[-Math.PI / 2, 0, 0]}>
            <coneGeometry args={[0.038, 0.105, 12]} />
            <meshStandardMaterial color="#d88a4d" roughness={0.32} metalness={0.04} />
          </mesh>
          <mesh castShadow position={[0, 0.068, -0.02]} rotation={[Math.PI / 2, 0, 0]}>
            <coneGeometry args={[0.014, 0.085, 4]} />
            <meshStandardMaterial color="#98592f" roughness={0.5} />
          </mesh>
          <mesh castShadow position={[0.04, -0.01, 0.015]} rotation={[Math.PI / 2 - 0.08, 0.42, -0.28]}>
            <coneGeometry args={[0.012, 0.056, 4]} />
            <meshStandardMaterial color="#b96f3d" roughness={0.46} />
          </mesh>
          <mesh castShadow position={[-0.04, -0.01, 0.015]} rotation={[Math.PI / 2 - 0.08, -0.42, 0.28]}>
            <coneGeometry args={[0.012, 0.056, 4]} />
            <meshStandardMaterial color="#b96f3d" roughness={0.46} />
          </mesh>
          <mesh castShadow position={[0.018, 0.01, 0.225]}>
            <sphereGeometry args={[0.009, 8, 8]} />
            <meshStandardMaterial color="#2f3f63" roughness={0.34} />
          </mesh>
          <mesh castShadow position={[-0.018, 0.01, 0.225]}>
            <sphereGeometry args={[0.009, 8, 8]} />
            <meshStandardMaterial color="#2f3f63" roughness={0.34} />
          </mesh>
        </group>

        <group ref={fishTailRef} position={[0, 0, -0.31]}>
          <mesh castShadow position={[0.022, 0.02, 0]} rotation={[Math.PI / 2 - 0.08, 0.12, 0.22]}>
            <coneGeometry args={[FISH_TAIL_FIN_RADIUS, FISH_TAIL_FIN_LENGTH, 3]} />
            <meshStandardMaterial color="#93552f" roughness={0.46} />
          </mesh>
          <mesh castShadow position={[-0.022, -0.02, 0]} rotation={[Math.PI / 2 + 0.08, -0.12, Math.PI - 0.22]}>
            <coneGeometry args={[FISH_TAIL_FIN_RADIUS, FISH_TAIL_FIN_LENGTH, 3]} />
            <meshStandardMaterial color="#93552f" roughness={0.46} />
          </mesh>
          <mesh castShadow position={[0, 0, 0.04]} rotation={[Math.PI / 2, 0, 0]}>
            <coneGeometry args={[0.013, 0.1, 5]} />
            <meshStandardMaterial color="#c97d46" roughness={0.42} />
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
          <group key={`${body.id}-fish-school`}>
            {new Array(FISH_PER_LAKE).fill(0).map((_, index) => (
              <LakeFishJump
                key={`${body.id}-fish-${index}`}
                body={body}
                fishCount={FISH_PER_LAKE}
                fishIndex={index}
                seed={plan.seed + index * 6.173}
              />
            ))}
          </group>
        );
      })}
    </group>
  );
}
