import { useFrame } from '@react-three/fiber';
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  type ReactNode,
} from 'react';
import type { Group, MeshStandardMaterial } from 'three';
import { MathUtils, QuadraticBezierCurve3, Vector3 } from 'three';

import type { ExperienceSceneProps } from '../../../src/types/experience';
import { SSEC_PLATFORM_INNER_SIZE, SSEC_PLATFORM_OUTER_SIZE } from './platform';
import {
  RECRUITER_SCENE_REVEAL_TOTAL_ENTER_MS,
  getRecruiterRevealMotionAmount,
  getRecruiterRevealStageProgress,
  type RevealStageIndex,
} from '../_shared/recruiterBenchReveal';

interface SsecRevealRuntime {
  getStageProgress: (stage: RevealStageIndex) => number;
  getStageMotionAmount: (stage: RevealStageIndex) => number;
}

const SsecRevealContext = createContext<SsecRevealRuntime>({
  getStageProgress: () => 1,
  getStageMotionAmount: () => 1,
});
const SsecCurrentStageContext = createContext<RevealStageIndex>(1);

function useSsecReveal(): SsecRevealRuntime & {
  getCurrentStageProgress: () => number;
  getCurrentStageMotionAmount: () => number;
} {
  const runtime = useContext(SsecRevealContext);
  const currentStage = useContext(SsecCurrentStageContext);

  return {
    ...runtime,
    getCurrentStageProgress: () => runtime.getStageProgress(currentStage),
    getCurrentStageMotionAmount: () => runtime.getStageMotionAmount(currentStage),
  };
}

function SsecRevealStage({
  stage,
  children,
}: {
  stage: RevealStageIndex;
  children: ReactNode;
}) {
  const runtime = useContext(SsecRevealContext);
  const groupRef = useRef<Group>(null);

  useFrame(() => {
    const group = groupRef.current;
    if (!group) {
      return;
    }

    const progress = runtime.getStageProgress(stage);
    group.visible = progress > 0.001;
    group.position.y = (1 - Math.min(progress, 1)) * -0.36;
    group.scale.setScalar(0.94 + Math.max(progress, 0) * 0.06);
  });

  return (
    <SsecCurrentStageContext.Provider value={stage}>
      <group ref={groupRef}>{children}</group>
    </SsecCurrentStageContext.Provider>
  );
}

function stagePulse(sequence: number, start: number, end: number): number {
  if (sequence <= start || sequence >= end) {
    return 0;
  }

  const midpoint = (start + end) * 0.5;
  const halfWidth = (end - start) * 0.5;
  return 1 - Math.abs(sequence - midpoint) / halfWidth;
}

function getActivity(
  elapsedTime: number,
  isNearby: boolean,
  isFocused: boolean,
  phaseOffset = 0,
  revealAmount = 1,
) {
  const sequence = (elapsedTime * 0.16 + phaseOffset) % 1;
  return {
    ambient: (isFocused ? 1 : isNearby ? 0.58 : 0.22) * revealAmount,
    deskStage: (isFocused ? stagePulse(sequence, 0.03, 0.28) : 0) * revealAmount,
    rackStage: (isFocused ? stagePulse(sequence, 0.3, 0.58) : 0) * revealAmount,
    orbitStage: (isFocused ? stagePulse(sequence, 0.62, 0.94) : 0) * revealAmount,
  };
}

function DeskMonitor({
  position,
  rotation = [0, 0, 0] as [number, number, number],
  variant,
  isNearby,
  isFocused,
  phaseOffset,
}: {
  position: [number, number, number];
  rotation?: [number, number, number];
  variant: 'tickets' | 'systems';
  isNearby: boolean;
  isFocused: boolean;
  phaseOffset: number;
}) {
  const groupRef = useRef<Group>(null);
  const screenMaterialRef = useRef<MeshStandardMaterial>(null);
  const scanlineRef = useRef<Group>(null);
  const reveal = useSsecReveal();

  useFrame(({ clock }) => {
    const motionAmount = reveal.getCurrentStageMotionAmount();
    const activity = getActivity(clock.elapsedTime, isNearby, isFocused, phaseOffset, motionAmount);
    const screenMaterial = screenMaterialRef.current;
    const group = groupRef.current;
    const scanline = scanlineRef.current;

    if (screenMaterial) {
      screenMaterial.emissiveIntensity = 0.35 + activity.ambient * 0.45 + activity.deskStage * 1.35;
    }

    if (group) {
      group.rotation.z = rotation[2] + Math.sin(clock.elapsedTime * 0.7 + phaseOffset * 6) * 0.015 * motionAmount;
      group.position.y = position[1] + Math.sin(clock.elapsedTime * 0.85 + phaseOffset * 8) * 0.02 * motionAmount;
    }

    if (scanline) {
      scanline.position.y = -0.16 + ((clock.elapsedTime * 0.2 * motionAmount + phaseOffset) % 1) * 0.32;
    }
  });

  return (
    <group ref={groupRef} position={position} rotation={rotation}>
      <mesh castShadow position={[0, 0, -0.02]}>
        <boxGeometry args={[1.02, 0.62, 0.08]} />
        <meshStandardMaterial color="#2c3139" roughness={0.35} metalness={0.5} />
      </mesh>
      <mesh castShadow position={[0, -0.36, -0.01]}>
        <boxGeometry args={[0.12, 0.42, 0.08]} />
        <meshStandardMaterial color="#848f99" roughness={0.32} metalness={0.44} />
      </mesh>
      <mesh castShadow position={[0, -0.56, 0.04]}>
        <boxGeometry args={[0.38, 0.05, 0.26]} />
        <meshStandardMaterial color="#56606c" roughness={0.35} metalness={0.28} />
      </mesh>

      <mesh position={[0, 0, 0.025]}>
        <boxGeometry args={[0.92, 0.52, 0.03]} />
        <meshStandardMaterial
          ref={screenMaterialRef}
          color={variant === 'tickets' ? '#173437' : '#152639'}
          emissive={variant === 'tickets' ? '#4cc6c1' : '#7fbaff'}
          emissiveIntensity={0.6}
          roughness={0.2}
          metalness={0.08}
        />
      </mesh>

      {variant === 'tickets' ? (
        <group position={[-0.24, 0.1, 0.05]}>
          {[
            { y: 0.1, width: 0.36, color: '#f8c972' },
            { y: 0, width: 0.42, color: '#79d9d0' },
            { y: -0.1, width: 0.31, color: '#f4a887' },
          ].map((row) => (
            <mesh key={row.y} position={[0.02, row.y, 0]}>
              <boxGeometry args={[row.width, 0.055, 0.012]} />
              <meshStandardMaterial color={row.color} emissive={row.color} emissiveIntensity={0.65} />
            </mesh>
          ))}
          <mesh position={[-0.24, 0.02, 0]}>
            <cylinderGeometry args={[0.08, 0.08, 0.02, 18]} />
            <meshStandardMaterial color="#f3efe3" emissive="#f3efe3" emissiveIntensity={0.35} />
          </mesh>
        </group>
      ) : (
        <group position={[-0.22, 0.02, 0.05]}>
          {[
            { x: -0.12, y: -0.12, h: 0.16, color: '#79b7ff' },
            { x: 0, y: -0.08, h: 0.24, color: '#f3d17c' },
            { x: 0.12, y: -0.04, h: 0.32, color: '#80efd7' },
          ].map((bar) => (
            <mesh key={`${bar.x}-${bar.y}`} position={[bar.x, bar.y + bar.h * 0.5, 0]}>
              <boxGeometry args={[0.07, bar.h, 0.012]} />
              <meshStandardMaterial color={bar.color} emissive={bar.color} emissiveIntensity={0.75} />
            </mesh>
          ))}
          <mesh position={[0.02, 0.12, 0]} rotation={[0, 0, 0.08]}>
            <boxGeometry args={[0.44, 0.035, 0.01]} />
            <meshStandardMaterial color="#f4a887" emissive="#f4a887" emissiveIntensity={0.55} />
          </mesh>
        </group>
      )}

      <group ref={scanlineRef} position={[0, -0.16, 0.048]}>
        <mesh>
          <boxGeometry args={[0.82, 0.02, 0.01]} />
          <meshStandardMaterial
            color="#f6fbff"
            emissive="#f6fbff"
            emissiveIntensity={variant === 'tickets' ? 0.45 : 0.38}
            transparent
            opacity={0.35}
          />
        </mesh>
      </group>
    </group>
  );
}

function RackCabinet({
  position,
  rotation,
  phaseOffset,
  isNearby,
  isFocused,
}: {
  position: [number, number, number];
  rotation: [number, number, number];
  phaseOffset: number;
  isNearby: boolean;
  isFocused: boolean;
}) {
  const lightMaterialRefs = useRef<Array<MeshStandardMaterial | null>>([]);
  const doorMaterialRef = useRef<MeshStandardMaterial>(null);
  const reveal = useSsecReveal();
  const slotLayout = useMemo(
    () =>
      Array.from({ length: 12 }, (_, index) => ({
        x: index % 3 === 0 ? -0.22 : index % 3 === 1 ? 0 : 0.22,
        y: 0.85 - Math.floor(index / 3) * 0.38,
        color: index % 2 === 0 ? '#7cd7df' : '#efb05c',
      })),
    [],
  );

  useFrame(({ clock }) => {
    const activity = getActivity(
      clock.elapsedTime,
      isNearby,
      isFocused,
      phaseOffset,
      reveal.getCurrentStageMotionAmount(),
    );
    const doorMaterial = doorMaterialRef.current;

    if (doorMaterial) {
      doorMaterial.emissiveIntensity = 0.05 + activity.ambient * 0.12 + activity.rackStage * 0.45;
    }

    lightMaterialRefs.current.forEach((material, index) => {
      if (!material) {
        return;
      }

      const blink = 0.45 + Math.sin(clock.elapsedTime * 3.4 + phaseOffset * 7 + index * 0.6) * 0.25;
      material.emissiveIntensity = 0.18 + activity.ambient * 0.22 + activity.rackStage * 0.82 + blink;
    });
  });

  return (
    <group position={position} rotation={rotation}>
      <mesh castShadow receiveShadow>
        <boxGeometry args={[0.98, 2.36, 0.96]} />
        <meshStandardMaterial color="#20252b" roughness={0.42} metalness={0.55} />
      </mesh>
      <mesh castShadow position={[0, 0.02, 0.45]}>
        <boxGeometry args={[0.88, 2.18, 0.06]} />
        <meshStandardMaterial
          ref={doorMaterialRef}
          color="#2b3340"
          emissive="#68cbd4"
          emissiveIntensity={0.12}
          roughness={0.24}
          metalness={0.22}
        />
      </mesh>
      {slotLayout.map((slot, index) => (
        <group key={`${slot.x}-${slot.y}`}>
          <mesh position={[slot.x, slot.y, 0.49]}>
            <boxGeometry args={[0.16, 0.08, 0.02]} />
            <meshStandardMaterial
              ref={(material) => {
                lightMaterialRefs.current[index] = material;
              }}
              color={slot.color}
              emissive={slot.color}
              emissiveIntensity={0.4}
              roughness={0.24}
              metalness={0.1}
            />
          </mesh>
          <mesh position={[slot.x, slot.y - 0.1, 0.47]}>
            <boxGeometry args={[0.2, 0.06, 0.01]} />
            <meshStandardMaterial color="#6a7480" roughness={0.42} metalness={0.3} />
          </mesh>
        </group>
      ))}
      <mesh position={[0, -1.02, 0]}>
        <boxGeometry args={[1.08, 0.18, 1.02]} />
        <meshStandardMaterial color="#313943" roughness={0.46} metalness={0.34} />
      </mesh>
    </group>
  );
}

function OrbitCraft({
  radiusX,
  radiusZ,
  baseHeight,
  phase,
  speed,
  isNearby,
  isFocused,
}: {
  radiusX: number;
  radiusZ: number;
  baseHeight: number;
  phase: number;
  speed: number;
  isNearby: boolean;
  isFocused: boolean;
}) {
  const groupRef = useRef<Group>(null);
  const engineMaterialRef = useRef<MeshStandardMaterial>(null);
  const reveal = useSsecReveal();

  useFrame(({ clock }) => {
    const motionAmount = reveal.getCurrentStageMotionAmount();
    const activity = getActivity(clock.elapsedTime, isNearby, isFocused, phase, motionAmount);
    const group = groupRef.current;
    const engineMaterial = engineMaterialRef.current;

    if (group) {
      const angle = clock.elapsedTime * speed + phase * Math.PI * 2;
      group.position.set(
        Math.cos(angle) * radiusX * motionAmount,
        baseHeight + Math.sin(clock.elapsedTime * 1.2 + phase * 5) * 0.18 * motionAmount,
        Math.sin(angle) * radiusZ * motionAmount - 0.2,
      );
      group.rotation.y = (-angle + Math.PI * 0.5) * motionAmount;
      group.rotation.z = Math.sin(clock.elapsedTime * 0.9 + phase * 4) * 0.12 * motionAmount;
    }

    if (engineMaterial) {
      engineMaterial.emissiveIntensity = 0.35 + activity.ambient * 0.32 + activity.orbitStage * 1.2;
    }
  });

  return (
    <group ref={groupRef}>
      <mesh castShadow rotation={[0, 0, Math.PI * 0.5]}>
        <cylinderGeometry args={[0.11, 0.15, 0.64, 14]} />
        <meshStandardMaterial color="#d8dde5" roughness={0.28} metalness={0.46} />
      </mesh>
      <mesh castShadow position={[0.24, 0.03, 0]}>
        <sphereGeometry args={[0.12, 14, 14]} />
        <meshStandardMaterial color="#f0b470" roughness={0.32} metalness={0.16} />
      </mesh>
      <mesh castShadow position={[-0.22, 0, 0]}>
        <coneGeometry args={[0.11, 0.18, 10]} />
        <meshStandardMaterial color="#8d97a6" roughness={0.28} metalness={0.42} />
      </mesh>
      <mesh castShadow position={[0, 0, 0.26]}>
        <boxGeometry args={[0.44, 0.03, 0.18]} />
        <meshStandardMaterial color="#5e6a78" roughness={0.38} metalness={0.35} />
      </mesh>
      <mesh castShadow position={[0, 0, -0.26]}>
        <boxGeometry args={[0.44, 0.03, 0.18]} />
        <meshStandardMaterial color="#5e6a78" roughness={0.38} metalness={0.35} />
      </mesh>
      <mesh position={[-0.3, 0, 0]}>
        <sphereGeometry args={[0.07, 12, 12]} />
        <meshStandardMaterial
          ref={engineMaterialRef}
          color="#f6d089"
          emissive="#f6d089"
          emissiveIntensity={0.65}
          roughness={0.18}
          metalness={0.04}
        />
      </mesh>
    </group>
  );
}

function SignalLink({
  points,
  phaseOffset,
  isNearby,
  isFocused,
}: {
  points: [Vector3, Vector3, Vector3];
  phaseOffset: number;
  isNearby: boolean;
  isFocused: boolean;
}) {
  const curve = useMemo(
    () => new QuadraticBezierCurve3(points[0], points[1], points[2]),
    [points],
  );
  const tubeMaterialRef = useRef<MeshStandardMaterial>(null);
  const nodeRefs = useRef<Array<Group | null>>([]);
  const nodeMaterials = useRef<Array<MeshStandardMaterial | null>>([]);
  const reveal = useSsecReveal();

  useFrame(({ clock }) => {
    const motionAmount = reveal.getCurrentStageMotionAmount();
    const activity = getActivity(clock.elapsedTime, isNearby, isFocused, phaseOffset, motionAmount);
    const tubeMaterial = tubeMaterialRef.current;

    if (tubeMaterial) {
      tubeMaterial.opacity = 0.08 + activity.ambient * 0.1 + activity.rackStage * 0.14 + activity.orbitStage * 0.18;
      tubeMaterial.emissiveIntensity = 0.22 + activity.ambient * 0.24 + activity.orbitStage * 0.48;
    }

    nodeRefs.current.forEach((node, index) => {
      if (!node) {
        return;
      }

      const travel = (clock.elapsedTime * 0.16 * motionAmount + phaseOffset + index * 0.2) % 1;
      const point = curve.getPointAt(travel);
      node.position.copy(point);

      const material = nodeMaterials.current[index];
      if (material) {
        material.emissiveIntensity = 0.35 + activity.ambient * 0.35 + activity.orbitStage * 1.1;
        material.opacity = 0.25 + activity.ambient * 0.25 + activity.orbitStage * 0.45;
      }
    });
  });

  return (
    <group>
      <mesh>
        <tubeGeometry args={[curve, 36, 0.025, 8, false]} />
        <meshStandardMaterial
          ref={tubeMaterialRef}
          color="#f3ca80"
          emissive="#f3ca80"
          emissiveIntensity={0.25}
          transparent
          opacity={0.18}
          roughness={0.3}
          metalness={0.05}
        />
      </mesh>
      {Array.from({ length: 3 }, (_, index) => (
        <group
          key={index}
          ref={(node) => {
            nodeRefs.current[index] = node;
          }}
        >
          <mesh>
            <sphereGeometry args={[0.05, 12, 12]} />
            <meshStandardMaterial
              ref={(material) => {
                nodeMaterials.current[index] = material;
              }}
              color="#fff4ca"
              emissive="#fff4ca"
              emissiveIntensity={0.75}
              transparent
              opacity={0.55}
              roughness={0.18}
              metalness={0.02}
            />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function AccessBadge({ isNearby, isFocused }: { isNearby: boolean; isFocused: boolean }) {
  const groupRef = useRef<Group>(null);
  const badgeMaterialRef = useRef<MeshStandardMaterial>(null);
  const reveal = useSsecReveal();

  useFrame(({ clock }) => {
    const motionAmount = reveal.getCurrentStageMotionAmount();
    const activity = getActivity(clock.elapsedTime, isNearby, isFocused, 0.12, motionAmount);
    const group = groupRef.current;
    const badgeMaterial = badgeMaterialRef.current;

    if (group) {
      group.position.y = 1.02 + Math.sin(clock.elapsedTime * 1.5) * 0.05 * motionAmount;
      group.rotation.y = clock.elapsedTime * 0.6 * motionAmount;
    }

    if (badgeMaterial) {
      badgeMaterial.emissiveIntensity = 0.28 + activity.ambient * 0.32 + activity.deskStage * 0.85;
    }
  });

  return (
    <group ref={groupRef} position={[1.22, 1.02, 0.24]}>
      <mesh castShadow>
        <boxGeometry args={[0.28, 0.4, 0.05]} />
        <meshStandardMaterial
          ref={badgeMaterialRef}
          color="#f2c989"
          emissive="#f2c989"
          emissiveIntensity={0.42}
          roughness={0.34}
          metalness={0.12}
        />
      </mesh>
      <mesh position={[0, 0.05, 0.03]}>
        <torusGeometry args={[0.06, 0.016, 8, 16]} />
        <meshStandardMaterial color="#f6f3ea" roughness={0.18} metalness={0.18} />
      </mesh>
      <mesh position={[0, -0.1, 0.03]}>
        <boxGeometry args={[0.16, 0.05, 0.01]} />
        <meshStandardMaterial color="#755d45" roughness={0.48} metalness={0.02} />
      </mesh>
    </group>
  );
}

function StylizedOperator({ isNearby, isFocused }: { isNearby: boolean; isFocused: boolean }) {
  const groupRef = useRef<Group>(null);
  const headRef = useRef<Group>(null);
  const reveal = useSsecReveal();

  useFrame(({ clock }) => {
    const group = groupRef.current;
    const head = headRef.current;
    const motionAmount = reveal.getCurrentStageMotionAmount();
    const activity = getActivity(clock.elapsedTime, isNearby, isFocused, 0.05, motionAmount);

    if (group) {
      group.rotation.x = MathUtils.lerp(group.rotation.x, isFocused ? -0.06 : isNearby ? -0.03 : -0.015, 0.08);
      group.position.z = 0.68 + Math.sin(clock.elapsedTime * 1.1) * 0.015 * motionAmount;
    }

    if (head) {
      head.rotation.y = Math.sin(clock.elapsedTime * 0.8) * 0.05 * motionAmount;
      head.rotation.x = -0.08 - activity.deskStage * 0.08;
    }
  });

  return (
    <group ref={groupRef} position={[0.02, 0.28, 0.68]}>
      <mesh castShadow position={[0, 0.3, 0.02]}>
        <boxGeometry args={[0.7, 0.1, 0.7]} />
        <meshStandardMaterial color="#46505a" roughness={0.56} metalness={0.22} />
      </mesh>
      <mesh castShadow position={[0, 0.58, -0.08]}>
        <boxGeometry args={[0.48, 0.52, 0.22]} />
        <meshStandardMaterial color="#2d3c48" roughness={0.62} />
      </mesh>
      <mesh castShadow position={[0, 0.06, -0.18]}>
        <boxGeometry args={[0.12, 0.58, 0.12]} />
        <meshStandardMaterial color="#46505a" roughness={0.58} metalness={0.18} />
      </mesh>

      <mesh castShadow position={[0, 1.18, -0.02]}>
        <cylinderGeometry args={[0.24, 0.3, 0.64, 18]} />
        <meshStandardMaterial color="#42515e" roughness={0.72} />
      </mesh>
      <mesh castShadow position={[-0.22, 1.02, -0.16]} rotation={[0.24, 0.1, 1.2]}>
        <cylinderGeometry args={[0.06, 0.06, 0.48, 12]} />
        <meshStandardMaterial color="#c58662" roughness={0.74} />
      </mesh>
      <mesh castShadow position={[0.24, 1.0, -0.12]} rotation={[0.26, -0.1, -1.16]}>
        <cylinderGeometry args={[0.06, 0.06, 0.5, 12]} />
        <meshStandardMaterial color="#c58662" roughness={0.74} />
      </mesh>
      <mesh castShadow position={[-0.12, 0.64, 0.16]} rotation={[1.28, 0.06, 0.12]}>
        <cylinderGeometry args={[0.08, 0.08, 0.54, 12]} />
        <meshStandardMaterial color="#2d3c48" roughness={0.7} />
      </mesh>
      <mesh castShadow position={[0.14, 0.64, 0.16]} rotation={[1.24, -0.08, -0.12]}>
        <cylinderGeometry args={[0.08, 0.08, 0.54, 12]} />
        <meshStandardMaterial color="#2d3c48" roughness={0.7} />
      </mesh>

      <group ref={headRef} position={[0, 1.62, -0.08]}>
        <mesh castShadow>
          <sphereGeometry args={[0.21, 20, 20]} />
          <meshStandardMaterial color="#cf9a76" roughness={0.72} />
        </mesh>
        <mesh castShadow position={[0, 0.05, -0.02]}>
          <sphereGeometry args={[0.22, 20, 20]} />
          <meshStandardMaterial color="#2f2a2b" roughness={0.82} />
        </mesh>
        <mesh position={[-0.07, -0.02, 0.18]}>
          <sphereGeometry args={[0.02, 8, 8]} />
          <meshStandardMaterial color="#1d2124" emissive="#1d2124" emissiveIntensity={0.2} />
        </mesh>
        <mesh position={[0.07, -0.02, 0.18]}>
          <sphereGeometry args={[0.02, 8, 8]} />
          <meshStandardMaterial color="#1d2124" emissive="#1d2124" emissiveIntensity={0.2} />
        </mesh>
      </group>
    </group>
  );
}

export default function SsecTechnicalComputingScene({
  anchor,
  rotationY,
  isNearby,
  isFocused,
  presentationState,
}: ExperienceSceneProps) {
  const floorGroupRef = useRef<Group>(null);
  const deskGlowRef = useRef<MeshStandardMaterial>(null);
  const presentationStateRef = useRef(presentationState);
  const transitionElapsedMsRef = useRef(
    presentationState === 'visible' ? RECRUITER_SCENE_REVEAL_TOTAL_ENTER_MS : 0,
  );
  const stageProgressRef = useRef<[number, number, number]>([1, 1, 1]);
  const revealRuntime = useMemo<SsecRevealRuntime>(
    () => ({
      getStageProgress: (stage) => stageProgressRef.current[stage - 1],
      getStageMotionAmount: (stage) => getRecruiterRevealMotionAmount(stageProgressRef.current[stage - 1]),
    }),
    [],
  );
  const rackLinkPoints = useMemo(
    () => [
      [new Vector3(0.58, 1.12, -0.08), new Vector3(1.24, 1.72, -0.68), new Vector3(1.74, 2.02, -0.88)] as [Vector3, Vector3, Vector3],
      [new Vector3(-0.48, 1.08, -0.14), new Vector3(-1.12, 1.7, -0.82), new Vector3(-1.72, 2.02, -0.94)] as [Vector3, Vector3, Vector3],
      [new Vector3(0.1, 1.36, -0.38), new Vector3(0.18, 2.38, -0.98), new Vector3(0.22, 3.22, -0.2)] as [Vector3, Vector3, Vector3],
    ],
    [],
  );

  useEffect(() => {
    presentationStateRef.current = presentationState;
    transitionElapsedMsRef.current =
      presentationState === 'visible' ? RECRUITER_SCENE_REVEAL_TOTAL_ENTER_MS : 0;
  }, [presentationState]);

  useFrame(({ clock }, delta) => {
    if (presentationStateRef.current !== 'visible') {
      transitionElapsedMsRef.current += delta * 1000;
    }

    stageProgressRef.current = [
      getRecruiterRevealStageProgress(1, presentationStateRef.current, transitionElapsedMsRef.current),
      getRecruiterRevealStageProgress(2, presentationStateRef.current, transitionElapsedMsRef.current),
      getRecruiterRevealStageProgress(3, presentationStateRef.current, transitionElapsedMsRef.current),
    ];

    const floorGroup = floorGroupRef.current;
    const deskGlow = deskGlowRef.current;
    const stageOneProgress = stageProgressRef.current[0];
    const activity = getActivity(
      clock.elapsedTime,
      isNearby,
      isFocused,
      0,
      getRecruiterRevealMotionAmount(stageOneProgress),
    );

    if (floorGroup) {
      floorGroup.position.y =
        (1 - Math.min(stageOneProgress, 1)) * -0.12 +
        0.02 +
        Math.sin(clock.elapsedTime * 0.45) * 0.01 * getRecruiterRevealMotionAmount(stageOneProgress);
      floorGroup.scale.setScalar(0.96 + Math.max(stageOneProgress, 0) * 0.04);
    }

    if (deskGlow) {
      deskGlow.emissiveIntensity =
        0.08 + stageOneProgress * 0.1 + activity.ambient * 0.14 + activity.deskStage * 0.42;
    }
  });

  return (
    <SsecRevealContext.Provider value={revealRuntime}>
      <group position={[anchor.x, anchor.y, anchor.z]} rotation={[0, rotationY, 0]}>
        <group ref={floorGroupRef}>
          <mesh receiveShadow position={[0, 0.04, -0.1]}>
            <boxGeometry args={SSEC_PLATFORM_OUTER_SIZE} />
            <meshStandardMaterial color="#37414a" roughness={0.54} metalness={0.18} />
          </mesh>
          <mesh receiveShadow position={[0, 0.08, -0.1]}>
            <boxGeometry args={SSEC_PLATFORM_INNER_SIZE} />
            <meshStandardMaterial
              ref={deskGlowRef}
              color="#485560"
              emissive="#efaa58"
              emissiveIntensity={0.18}
              roughness={0.42}
              metalness={0.18}
            />
          </mesh>
        </group>

        <SsecRevealStage stage={2}>
          <mesh castShadow receiveShadow position={[0, 0.5, 0.06]}>
            <boxGeometry args={[2.3, 0.16, 1.16]} />
            <meshStandardMaterial color="#7b6654" roughness={0.68} />
          </mesh>
          <mesh castShadow position={[0, 0.92, -0.28]}>
            <boxGeometry args={[2.0, 0.72, 0.12]} />
            <meshStandardMaterial color="#2a3138" roughness={0.38} metalness={0.35} />
          </mesh>
          {[
            [-0.9, 0.24, -0.26],
            [0.9, 0.24, -0.26],
            [-0.9, 0.24, 0.26],
            [0.9, 0.24, 0.26],
          ].map((leg) => (
            <mesh key={leg.join(',')} castShadow position={leg as [number, number, number]}>
              <boxGeometry args={[0.12, 0.48, 0.12]} />
              <meshStandardMaterial color="#d6dbe0" roughness={0.34} metalness={0.38} />
            </mesh>
          ))}
          <DeskMonitor
            position={[-0.54, 1.24, -0.12]}
            rotation={[-0.04, 0.18, 0]}
            variant="tickets"
            isNearby={isNearby}
            isFocused={isFocused}
            phaseOffset={0.04}
          />
          <DeskMonitor
            position={[0.52, 1.26, -0.16]}
            rotation={[-0.02, -0.14, 0]}
            variant="systems"
            isNearby={isNearby}
            isFocused={isFocused}
            phaseOffset={0.18}
          />
          <mesh castShadow position={[0.82, 0.58, 0.18]}>
            <boxGeometry args={[0.52, 0.2, 0.46]} />
            <meshStandardMaterial color="#2a2f36" roughness={0.4} metalness={0.5} />
          </mesh>
          {[-0.12, 0, 0.12].map((x, index) => (
            <mesh key={x} position={[0.82 + x, 0.6, 0.43]}>
              <boxGeometry args={[0.08, 0.06, 0.02]} />
              <meshStandardMaterial
                color={index === 1 ? '#80efd7' : '#efb05c'}
                emissive={index === 1 ? '#80efd7' : '#efb05c'}
                emissiveIntensity={0.6}
              />
            </mesh>
          ))}
          <mesh castShadow position={[0.08, 0.56, 0.28]}>
            <boxGeometry args={[0.82, 0.025, 0.22]} />
            <meshStandardMaterial color="#232a31" roughness={0.58} />
          </mesh>
          <mesh castShadow position={[0.54, 0.56, 0.28]}>
            <cylinderGeometry args={[0.045, 0.045, 0.04, 14]} />
            <meshStandardMaterial color="#d0d5db" roughness={0.28} metalness={0.22} />
          </mesh>
          <AccessBadge isNearby={isNearby} isFocused={isFocused} />
          <StylizedOperator isNearby={isNearby} isFocused={isFocused} />
        </SsecRevealStage>

        <SsecRevealStage stage={3}>
          <RackCabinet
            position={[-1.76, 1.2, -1.0]}
            rotation={[0, 0.18, 0]}
            phaseOffset={0.12}
            isNearby={isNearby}
            isFocused={isFocused}
          />
          <RackCabinet
            position={[0.04, 1.24, -1.52]}
            rotation={[0, 0, 0]}
            phaseOffset={0.3}
            isNearby={isNearby}
            isFocused={isFocused}
          />
          <RackCabinet
            position={[1.84, 1.18, -0.96]}
            rotation={[0, -0.2, 0]}
            phaseOffset={0.48}
            isNearby={isNearby}
            isFocused={isFocused}
          />
        </SsecRevealStage>

        <SsecRevealStage stage={3}>
          <OrbitCraft
            radiusX={2.18}
            radiusZ={1.08}
            baseHeight={3.36}
            phase={0.06}
            speed={0.22}
            isNearby={isNearby}
            isFocused={isFocused}
          />
          <OrbitCraft
            radiusX={1.54}
            radiusZ={1.74}
            baseHeight={3.88}
            phase={0.42}
            speed={0.18}
            isNearby={isNearby}
            isFocused={isFocused}
          />
          <OrbitCraft
            radiusX={2.46}
            radiusZ={1.34}
            baseHeight={3.62}
            phase={0.78}
            speed={0.2}
            isNearby={isNearby}
            isFocused={isFocused}
          />
          <SignalLink points={rackLinkPoints[0]} phaseOffset={0.08} isNearby={isNearby} isFocused={isFocused} />
          <SignalLink points={rackLinkPoints[1]} phaseOffset={0.28} isNearby={isNearby} isFocused={isFocused} />
          <SignalLink points={rackLinkPoints[2]} phaseOffset={0.62} isNearby={isNearby} isFocused={isFocused} />
        </SsecRevealStage>
      </group>
    </SsecRevealContext.Provider>
  );
}
