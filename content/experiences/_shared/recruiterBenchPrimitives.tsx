/* eslint-disable react-refresh/only-export-components */

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
import { CatmullRomCurve3, TubeGeometry, Vector3 } from 'three';

import type { ExperienceSceneProps } from '../../../src/types/experience';
import {
  RECRUITER_SCENE_PLATFORM_GLOW_RADIUS,
  RECRUITER_SCENE_PLATFORM_HEIGHT,
  RECRUITER_SCENE_PLATFORM_OUTER_BOTTOM_RADIUS,
  RECRUITER_SCENE_PLATFORM_OUTER_TOP_RADIUS,
  RECRUITER_SCENE_PLATFORM_RING_INNER_RADIUS,
  RECRUITER_SCENE_PLATFORM_RING_OUTER_RADIUS,
} from './recruiterBenchPlatform';
import {
  RECRUITER_SCENE_REVEAL_TOTAL_ENTER_MS,
  getRecruiterRevealMotionAmount,
  getRecruiterRevealStageProgress,
  type RevealStageIndex,
} from './recruiterBenchReveal';

interface RecruiterSceneRevealRuntime {
  getStageProgress: (stage: RevealStageIndex) => number;
  getStageMotionAmount: (stage: RevealStageIndex) => number;
}

const RecruiterSceneRevealContext = createContext<RecruiterSceneRevealRuntime>({
  getStageProgress: () => 1,
  getStageMotionAmount: () => 1,
});
const CurrentRevealStageContext = createContext<RevealStageIndex>(1);

export function useWorkbenchReveal(): RecruiterSceneRevealRuntime & {
  getCurrentStageProgress: () => number;
  getCurrentStageMotionAmount: () => number;
} {
  const runtime = useContext(RecruiterSceneRevealContext);
  const currentStage = useContext(CurrentRevealStageContext);

  return {
    ...runtime,
    getCurrentStageProgress: () => runtime.getStageProgress(currentStage),
    getCurrentStageMotionAmount: () => runtime.getStageMotionAmount(currentStage),
  };
}

export function RevealStage({
  stage,
  children,
}: {
  stage: RevealStageIndex;
  children: ReactNode;
}) {
  const runtime = useContext(RecruiterSceneRevealContext);
  const groupRef = useRef<Group>(null);

  useFrame(() => {
    const group = groupRef.current;
    if (!group) {
      return;
    }

    const progress = runtime.getStageProgress(stage);
    const translationY = (1 - Math.min(progress, 1)) * -0.36;
    const scale = 0.94 + Math.max(progress, 0) * 0.06;

    group.visible = progress > 0.001;
    group.position.y = translationY;
    group.scale.setScalar(scale);
  });

  return (
    <CurrentRevealStageContext.Provider value={stage}>
      <group ref={groupRef}>{children}</group>
    </CurrentRevealStageContext.Provider>
  );
}

export interface ScenePalette {
  base: string;
  surface: string;
  accent: string;
  accentSoft: string;
  glow: string;
  trim: string;
}

export interface SceneActivityState {
  ambient: number;
  nearby: number;
  focused: number;
  pulse: number;
  orbit: number;
}

export type DisplayVariant =
  | 'tickets'
  | 'systems'
  | 'qa'
  | 'api'
  | 'dataset'
  | 'cad'
  | 'progress'
  | 'recipe'
  | 'nutrition'
  | 'signals'
  | 'research'
  | 'reconciliation'
  | 'pipeline'
  | 'runtime'
  | 'soccer'
  | 'resource'
  | 'documents';

export function getSceneActivityState(
  elapsedTime: number,
  isNearby: boolean,
  isFocused: boolean,
  phase = 0,
  revealAmount = 1,
): SceneActivityState {
  const pulse = Math.sin(elapsedTime * 1.55 + phase * 6.1) * 0.5 + 0.5;
  return {
    ambient: (isFocused ? 1 : isNearby ? 0.58 : 0.2) * revealAmount,
    nearby: (isNearby ? 1 : 0) * revealAmount,
    focused: (isFocused ? 1 : 0) * revealAmount,
    pulse: pulse * revealAmount,
    orbit: (Math.sin(elapsedTime * 0.8 + phase * Math.PI * 2) * 0.5 + 0.5) * revealAmount,
  };
}

function renderDisplayContent(
  variant: DisplayVariant,
  palette: ScenePalette,
): React.ReactNode {
  switch (variant) {
    case 'tickets':
      return (
        <>
          <mesh position={[-0.22, 0.12, 0.012]}>
            <boxGeometry args={[0.18, 0.12, 0.01]} />
            <meshStandardMaterial color={palette.glow} emissive={palette.glow} emissiveIntensity={0.5} />
          </mesh>
          {[
            { y: 0.12, width: 0.36, color: '#f7c87a' },
            { y: 0, width: 0.42, color: '#78d1d2' },
            { y: -0.12, width: 0.3, color: '#f2a287' },
          ].map((row) => (
            <mesh key={`${row.y}-${row.width}`} position={[0.13, row.y, 0.012]}>
              <boxGeometry args={[row.width, 0.05, 0.01]} />
              <meshStandardMaterial color={row.color} emissive={row.color} emissiveIntensity={0.55} />
            </mesh>
          ))}
        </>
      );
    case 'systems':
    case 'signals':
    case 'runtime':
      return (
        <>
          {[-0.2, -0.05, 0.1, 0.25].map((x, index) => (
            <mesh key={`${variant}-${x}`} position={[x, -0.1 + index * 0.03, 0.012]}>
              <boxGeometry args={[0.08, 0.16 + index * 0.08, 0.01]} />
              <meshStandardMaterial
                color={index % 2 === 0 ? palette.accent : palette.glow}
                emissive={index % 2 === 0 ? palette.accent : palette.glow}
                emissiveIntensity={0.6}
              />
            </mesh>
          ))}
          <mesh position={[0.02, 0.18, 0.012]} rotation={[0, 0, 0.08]}>
            <boxGeometry args={[0.5, 0.03, 0.01]} />
            <meshStandardMaterial color={palette.accentSoft} emissive={palette.accentSoft} emissiveIntensity={0.45} />
          </mesh>
        </>
      );
    case 'qa':
      return (
        <>
          <mesh position={[-0.16, 0.08, 0.012]}>
            <boxGeometry args={[0.26, 0.22, 0.01]} />
            <meshStandardMaterial color="#233344" emissive="#233344" emissiveIntensity={0.25} />
          </mesh>
          <mesh position={[0.18, 0.08, 0.012]}>
            <boxGeometry args={[0.34, 0.22, 0.01]} />
            <meshStandardMaterial color="#243b33" emissive="#243b33" emissiveIntensity={0.25} />
          </mesh>
          {[
            [-0.2, -0.18, '#ef8468'],
            [0.02, -0.18, '#f6d98b'],
            [0.24, -0.18, '#7fd8b9'],
          ].map(([x, y, color]) => (
            <mesh key={`${x}-${y}-${color}`} position={[Number(x), Number(y), 0.012]}>
              <boxGeometry args={[0.16, 0.06, 0.01]} />
              <meshStandardMaterial color={String(color)} emissive={String(color)} emissiveIntensity={0.55} />
            </mesh>
          ))}
        </>
      );
    case 'api':
    case 'pipeline':
    case 'research':
      return (
        <>
          {[-0.22, 0, 0.22].map((x, index) => (
            <mesh key={`${variant}-${x}`} position={[x, 0.06 - index * 0.12, 0.012]}>
              <cylinderGeometry args={[0.06, 0.06, 0.06, 12]} />
              <meshStandardMaterial
                color={index === 1 ? palette.glow : palette.accentSoft}
                emissive={index === 1 ? palette.glow : palette.accentSoft}
                emissiveIntensity={0.7}
              />
            </mesh>
          ))}
          {[
            { x: -0.11, y: 0.0, rotation: 0.45 },
            { x: 0.11, y: -0.12, rotation: -0.45 },
          ].map((edge) => (
            <mesh key={`${edge.x}-${edge.y}`} position={[edge.x, edge.y, 0.011]} rotation={[0, 0, edge.rotation]}>
              <boxGeometry args={[0.28, 0.025, 0.01]} />
              <meshStandardMaterial color={palette.glow} emissive={palette.glow} emissiveIntensity={0.4} />
            </mesh>
          ))}
        </>
      );
    case 'dataset':
    case 'documents':
      return (
        <>
          {[-0.14, 0.02, 0.18].map((x, index) => (
            <mesh key={`${variant}-${x}`} position={[x, 0.1 - index * 0.16, 0.012]}>
              <boxGeometry args={[0.18 + index * 0.06, 0.08, 0.01]} />
              <meshStandardMaterial
                color={index === 1 ? palette.glow : palette.trim}
                emissive={index === 1 ? palette.glow : palette.trim}
                emissiveIntensity={0.35}
              />
            </mesh>
          ))}
          {[-0.22, -0.04, 0.14].map((x) => (
            <mesh key={`${variant}-line-${x}`} position={[x, -0.22, 0.012]}>
              <boxGeometry args={[0.16, 0.02, 0.01]} />
              <meshStandardMaterial color={palette.accentSoft} emissive={palette.accentSoft} emissiveIntensity={0.35} />
            </mesh>
          ))}
        </>
      );
    case 'cad':
    case 'resource':
    case 'soccer':
      return (
        <>
          <mesh position={[0, 0, 0.012]}>
            <boxGeometry args={[0.54, 0.32, 0.01]} />
            <meshStandardMaterial color="#223846" emissive="#223846" emissiveIntensity={0.15} />
          </mesh>
          {variant === 'soccer' ? (
            <>
              <mesh position={[0, 0, 0.013]}>
                <boxGeometry args={[0.5, 0.28, 0.01]} />
                <meshStandardMaterial color="#1e5f46" emissive="#1e5f46" emissiveIntensity={0.25} />
              </mesh>
              <mesh position={[0, 0, 0.014]}>
                <ringGeometry args={[0.08, 0.092, 18]} />
                <meshStandardMaterial color={palette.trim} emissive={palette.trim} emissiveIntensity={0.28} />
              </mesh>
            </>
          ) : null}
          {[
            { w: 0.42, h: 0.02, y: 0.12 },
            { w: 0.02, h: 0.22, y: 0 },
          ].map((line) => (
            <mesh key={`${variant}-${line.w}-${line.h}-${line.y}`} position={[0, line.y, 0.014]}>
              <boxGeometry args={[line.w, line.h, 0.01]} />
              <meshStandardMaterial color={palette.glow} emissive={palette.glow} emissiveIntensity={0.42} />
            </mesh>
          ))}
        </>
      );
    case 'progress':
    case 'reconciliation':
      return (
        <>
          {[-0.18, 0.02, 0.22].map((x, index) => (
            <mesh key={`${variant}-${x}`} position={[x, 0.04 - index * 0.13, 0.012]}>
              <boxGeometry args={[0.18, 0.08, 0.01]} />
              <meshStandardMaterial
                color={index === 2 ? palette.glow : palette.accent}
                emissive={index === 2 ? palette.glow : palette.accent}
                emissiveIntensity={0.55}
              />
            </mesh>
          ))}
          <mesh position={[0.24, -0.18, 0.013]} rotation={[0, 0, -0.7]}>
            <boxGeometry args={[0.18, 0.03, 0.01]} />
            <meshStandardMaterial color="#7fe0b0" emissive="#7fe0b0" emissiveIntensity={0.6} />
          </mesh>
          <mesh position={[0.13, -0.13, 0.013]} rotation={[0, 0, 0.7]}>
            <boxGeometry args={[0.1, 0.03, 0.01]} />
            <meshStandardMaterial color="#7fe0b0" emissive="#7fe0b0" emissiveIntensity={0.6} />
          </mesh>
        </>
      );
    case 'recipe':
    case 'nutrition':
      return (
        <>
          <mesh position={[-0.14, 0.05, 0.012]}>
            <boxGeometry args={[0.26, 0.3, 0.01]} />
            <meshStandardMaterial color="#f6efe1" emissive="#f6efe1" emissiveIntensity={0.22} />
          </mesh>
          {variant === 'recipe' ? (
            <>
              <mesh position={[-0.18, 0.14, 0.013]}>
                <boxGeometry args={[0.12, 0.06, 0.01]} />
                <meshStandardMaterial color={palette.accent} emissive={palette.accent} emissiveIntensity={0.48} />
              </mesh>
              {[-0.12, 0, -0.12].map((y, index) => (
                <mesh key={`${variant}-${y}`} position={[-0.1, y, 0.013]}>
                  <boxGeometry args={[0.18, 0.03, 0.01]} />
                  <meshStandardMaterial
                    color={index === 1 ? palette.glow : palette.accentSoft}
                    emissive={index === 1 ? palette.glow : palette.accentSoft}
                    emissiveIntensity={0.45}
                  />
                </mesh>
              ))}
            </>
          ) : (
            <>
              {[[-0.08, 0.04], [0.1, 0.06], [0.26, -0.02]].map(([x, y], index) => (
                <mesh key={`${variant}-${x}-${y}`} position={[Number(x), Number(y), 0.013]}>
                  <cylinderGeometry args={[0.08, 0.08, 0.03, 18]} />
                  <meshStandardMaterial
                    color={index === 1 ? palette.glow : palette.accentSoft}
                    emissive={index === 1 ? palette.glow : palette.accentSoft}
                    emissiveIntensity={0.52}
                  />
                </mesh>
              ))}
            </>
          )}
        </>
      );
  }
}

interface SceneShellProps extends ExperienceSceneProps {
  palette: ScenePalette;
  children: ReactNode;
}

export function RecruiterSceneShell({
  anchor,
  rotationY,
  isNearby,
  isFocused,
  presentationState,
  palette,
  children,
}: SceneShellProps) {
  const platformGroupRef = useRef<Group>(null);
  const ringMaterialRef = useRef<MeshStandardMaterial>(null);
  const glowMaterialRef = useRef<MeshStandardMaterial>(null);
  const presentationStateRef = useRef(presentationState);
  const transitionElapsedMsRef = useRef(
    presentationState === 'visible' ? RECRUITER_SCENE_REVEAL_TOTAL_ENTER_MS : 0,
  );
  const stageProgressRef = useRef<[number, number, number]>([1, 1, 1]);
  const revealRuntime = useMemo<RecruiterSceneRevealRuntime>(
    () => ({
      getStageProgress: (stage) => stageProgressRef.current[stage - 1],
      getStageMotionAmount: (stage) => getRecruiterRevealMotionAmount(stageProgressRef.current[stage - 1]),
    }),
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

    const stageOneProgress = stageProgressRef.current[0];
    const activity = getSceneActivityState(
      clock.elapsedTime,
      isNearby,
      isFocused,
      0.2,
      getRecruiterRevealMotionAmount(stageOneProgress),
    );

    if (platformGroupRef.current) {
      platformGroupRef.current.position.y = (1 - Math.min(stageOneProgress, 1)) * -0.12;
      platformGroupRef.current.scale.setScalar(0.96 + Math.max(stageOneProgress, 0) * 0.04);
    }

    if (ringMaterialRef.current) {
      ringMaterialRef.current.emissiveIntensity =
        0.08 + stageOneProgress * 0.16 + activity.ambient * 0.52 + activity.focused * 0.68;
    }
    if (glowMaterialRef.current) {
      glowMaterialRef.current.opacity =
        stageOneProgress * (0.12 + activity.nearby * 0.08 + activity.focused * 0.12);
    }
  });

  return (
    <RecruiterSceneRevealContext.Provider value={revealRuntime}>
      <group position={[anchor.x, anchor.y, anchor.z]} rotation={[0, rotationY, 0]}>
        <group ref={platformGroupRef}>
          <mesh receiveShadow position={[0, 0.04, 0]}>
            <cylinderGeometry
              args={[
                RECRUITER_SCENE_PLATFORM_OUTER_TOP_RADIUS,
                RECRUITER_SCENE_PLATFORM_OUTER_BOTTOM_RADIUS,
                RECRUITER_SCENE_PLATFORM_HEIGHT,
                48,
              ]}
            />
            <meshStandardMaterial color={palette.base} roughness={0.86} metalness={0.08} />
          </mesh>
          <mesh receiveShadow position={[0, 0.06, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry
              args={[
                RECRUITER_SCENE_PLATFORM_RING_INNER_RADIUS,
                RECRUITER_SCENE_PLATFORM_RING_OUTER_RADIUS,
                48,
              ]}
            />
            <meshStandardMaterial
              ref={ringMaterialRef}
              color={palette.accent}
              emissive={palette.accent}
              emissiveIntensity={0.28}
              roughness={0.22}
              metalness={0.24}
            />
          </mesh>
          <mesh position={[0, 0.08, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <circleGeometry args={[RECRUITER_SCENE_PLATFORM_GLOW_RADIUS, 40]} />
            <meshStandardMaterial
              ref={glowMaterialRef}
              color={palette.glow}
              emissive={palette.glow}
              emissiveIntensity={0.18}
              transparent
              opacity={0.14}
              depthWrite={false}
            />
          </mesh>
        </group>
        {children}
      </group>
    </RecruiterSceneRevealContext.Provider>
  );
}

export function DeskUnit({
  position,
  palette,
  width = 2.2,
  depth = 1.14,
  drawerSide = 'right',
}: {
  position: [number, number, number];
  palette: ScenePalette;
  width?: number;
  depth?: number;
  drawerSide?: 'left' | 'right';
}) {
  const drawerX = drawerSide === 'left' ? -0.54 : 0.54;

  return (
    <group position={position}>
      <mesh castShadow receiveShadow position={[0, 0.44, 0]}>
        <boxGeometry args={[width, 0.16, depth]} />
        <meshStandardMaterial color={palette.surface} roughness={0.62} />
      </mesh>
      {[-0.82, 0.82].map((x) => (
        <mesh key={x} castShadow position={[x, 0.2, -0.32]}>
          <boxGeometry args={[0.12, 0.48, 0.12]} />
          <meshStandardMaterial color={palette.trim} roughness={0.38} metalness={0.28} />
        </mesh>
      ))}
      {[-0.82, 0.82].map((x) => (
        <mesh key={`${x}-front`} castShadow position={[x, 0.2, 0.32]}>
          <boxGeometry args={[0.12, 0.48, 0.12]} />
          <meshStandardMaterial color={palette.trim} roughness={0.38} metalness={0.28} />
        </mesh>
      ))}
      <mesh castShadow position={[drawerX, 0.28, 0.12]}>
        <boxGeometry args={[0.4, 0.46, 0.6]} />
        <meshStandardMaterial color={palette.base} roughness={0.42} metalness={0.24} />
      </mesh>
      <mesh castShadow position={[0, 0.52, 0.28]}>
        <boxGeometry args={[0.76, 0.03, 0.24]} />
        <meshStandardMaterial color="#1c2630" roughness={0.52} />
      </mesh>
      <mesh castShadow position={[0.54, 0.52, 0.24]}>
        <boxGeometry args={[0.18, 0.03, 0.14]} />
        <meshStandardMaterial color="#5f6671" roughness={0.36} metalness={0.18} />
      </mesh>
    </group>
  );
}

export function SeatedFigure({
  position,
  shirtColor,
  accentColor,
}: {
  position: [number, number, number];
  shirtColor: string;
  accentColor: string;
}) {
  return (
    <group position={position}>
      <mesh castShadow position={[0, 0.9, 0]}>
        <sphereGeometry args={[0.18, 18, 18]} />
        <meshStandardMaterial color="#b78666" roughness={0.7} />
      </mesh>
      <mesh castShadow position={[0, 0.55, -0.02]}>
        <capsuleGeometry args={[0.18, 0.46, 8, 12]} />
        <meshStandardMaterial color={shirtColor} roughness={0.56} />
      </mesh>
      <mesh castShadow position={[0.2, 0.58, 0.05]} rotation={[0.2, 0.1, -0.7]}>
        <capsuleGeometry args={[0.05, 0.34, 6, 10]} />
        <meshStandardMaterial color="#b78666" roughness={0.72} />
      </mesh>
      <mesh castShadow position={[-0.2, 0.58, 0.05]} rotation={[0.2, -0.1, 0.7]}>
        <capsuleGeometry args={[0.05, 0.34, 6, 10]} />
        <meshStandardMaterial color="#b78666" roughness={0.72} />
      </mesh>
      <mesh castShadow position={[0.09, 0.15, 0.04]} rotation={[0.95, 0.1, 0.1]}>
        <capsuleGeometry args={[0.055, 0.36, 6, 10]} />
        <meshStandardMaterial color="#2a3138" roughness={0.72} />
      </mesh>
      <mesh castShadow position={[-0.09, 0.15, 0.04]} rotation={[0.95, -0.1, -0.1]}>
        <capsuleGeometry args={[0.055, 0.36, 6, 10]} />
        <meshStandardMaterial color="#2a3138" roughness={0.72} />
      </mesh>
      <mesh castShadow position={[0, 0.32, -0.28]}>
        <boxGeometry args={[0.4, 0.36, 0.4]} />
        <meshStandardMaterial color={accentColor} roughness={0.62} />
      </mesh>
      <mesh castShadow position={[0, 0.05, -0.28]}>
        <boxGeometry args={[0.5, 0.08, 0.5]} />
        <meshStandardMaterial color="#4c535d" roughness={0.6} />
      </mesh>
    </group>
  );
}

export function DisplayPanel({
  position,
  palette,
  variant,
  phase = 0,
  isNearby,
  isFocused,
  rotation = [0, 0, 0] as [number, number, number],
  scale = 1,
  screenColor = '#162432',
}: {
  position: [number, number, number];
  palette: ScenePalette;
  variant: DisplayVariant;
  phase?: number;
  isNearby: boolean;
  isFocused: boolean;
  rotation?: [number, number, number];
  scale?: number;
  screenColor?: string;
}) {
  const groupRef = useRef<Group>(null);
  const screenMaterialRef = useRef<MeshStandardMaterial>(null);
  const reveal = useWorkbenchReveal();

  useFrame(({ clock }) => {
    const motionAmount = reveal.getCurrentStageMotionAmount();
    const activity = getSceneActivityState(clock.elapsedTime, isNearby, isFocused, phase, motionAmount);
    if (groupRef.current) {
      groupRef.current.position.y =
        position[1] + Math.sin(clock.elapsedTime * 0.8 + phase * 10) * 0.02 * motionAmount;
    }
    if (screenMaterialRef.current) {
      screenMaterialRef.current.emissiveIntensity = 0.24 + activity.ambient * 0.34 + activity.focused * 0.55;
    }
  });

  return (
    <group ref={groupRef} position={position} rotation={rotation} scale={scale}>
      <mesh castShadow>
        <boxGeometry args={[1, 0.6, 0.08]} />
        <meshStandardMaterial color="#2b3138" roughness={0.32} metalness={0.42} />
      </mesh>
      <mesh position={[0, 0, 0.025]}>
        <boxGeometry args={[0.88, 0.48, 0.02]} />
        <meshStandardMaterial
          ref={screenMaterialRef}
          color={screenColor}
          emissive={screenColor}
          emissiveIntensity={0.3}
          roughness={0.18}
        />
      </mesh>
      {renderDisplayContent(variant, palette)}
      <mesh castShadow position={[0, -0.28, -0.01]}>
        <boxGeometry args={[0.1, 0.28, 0.06]} />
        <meshStandardMaterial color="#7d8995" roughness={0.34} metalness={0.36} />
      </mesh>
      <mesh castShadow position={[0, -0.42, 0.02]}>
        <boxGeometry args={[0.32, 0.04, 0.2]} />
        <meshStandardMaterial color="#57616a" roughness={0.42} metalness={0.22} />
      </mesh>
    </group>
  );
}

export function ServerRack({
  position,
  rotation = [0, 0, 0] as [number, number, number],
  palette,
  phase = 0,
  isNearby,
  isFocused,
}: {
  position: [number, number, number];
  rotation?: [number, number, number];
  palette: ScenePalette;
  phase?: number;
  isNearby: boolean;
  isFocused: boolean;
}) {
  const lightRefs = useRef<Array<MeshStandardMaterial | null>>([]);
  const reveal = useWorkbenchReveal();

  useFrame(({ clock }) => {
    const activity = getSceneActivityState(
      clock.elapsedTime,
      isNearby,
      isFocused,
      phase,
      reveal.getCurrentStageMotionAmount(),
    );
    lightRefs.current.forEach((material, index) => {
      if (!material) {
        return;
      }

      material.emissiveIntensity =
        0.18 +
        activity.ambient * 0.26 +
        activity.focused * 0.44 +
        (Math.sin(clock.elapsedTime * 3.6 + index * 0.6 + phase * 5) * 0.5 + 0.5) * 0.45;
    });
  });

  return (
    <group position={position} rotation={rotation}>
      <mesh castShadow receiveShadow>
        <boxGeometry args={[0.92, 2.24, 0.82]} />
        <meshStandardMaterial color="#22282e" roughness={0.42} metalness={0.5} />
      </mesh>
      <mesh castShadow position={[0, 0.04, 0.38]}>
        <boxGeometry args={[0.78, 2.04, 0.05]} />
        <meshStandardMaterial color="#2d3641" roughness={0.26} metalness={0.2} />
      </mesh>
      {Array.from({ length: 10 }, (_, index) => {
        const y = 0.82 - index * 0.18;
        return (
          <mesh key={y} position={[index % 2 === 0 ? -0.16 : 0.16, y, 0.41]}>
            <boxGeometry args={[0.16, 0.05, 0.01]} />
            <meshStandardMaterial
              ref={(material) => {
                lightRefs.current[index] = material;
              }}
              color={index % 3 === 0 ? palette.glow : palette.accent}
              emissive={index % 3 === 0 ? palette.glow : palette.accent}
              emissiveIntensity={0.32}
            />
          </mesh>
        );
      })}
    </group>
  );
}

export function OrbitCraft({
  radiusX,
  radiusZ,
  baseHeight,
  phase,
  speed,
  palette,
  isNearby,
  isFocused,
}: {
  radiusX: number;
  radiusZ: number;
  baseHeight: number;
  phase: number;
  speed: number;
  palette: ScenePalette;
  isNearby: boolean;
  isFocused: boolean;
}) {
  const rootRef = useRef<Group>(null);
  const engineRef = useRef<MeshStandardMaterial>(null);
  const reveal = useWorkbenchReveal();

  useFrame(({ clock }) => {
    const motionAmount = reveal.getCurrentStageMotionAmount();
    const activity = getSceneActivityState(clock.elapsedTime, isNearby, isFocused, phase, motionAmount);
    const angle = clock.elapsedTime * speed + phase * Math.PI * 2;

    if (rootRef.current) {
      rootRef.current.position.set(
        Math.cos(angle) * radiusX * motionAmount,
        baseHeight + Math.sin(clock.elapsedTime * 0.9 + phase * 6) * 0.16 * motionAmount,
        Math.sin(angle) * radiusZ * motionAmount,
      );
      rootRef.current.rotation.y = (-angle + Math.PI * 0.5) * motionAmount;
      rootRef.current.rotation.z = Math.sin(clock.elapsedTime * 0.6 + phase * 4) * 0.1 * motionAmount;
    }

    if (engineRef.current) {
      engineRef.current.emissiveIntensity = 0.32 + activity.ambient * 0.34 + activity.focused * 0.58;
    }
  });

  return (
    <group ref={rootRef}>
      <mesh castShadow rotation={[0, 0, Math.PI * 0.5]}>
        <cylinderGeometry args={[0.1, 0.14, 0.64, 16]} />
        <meshStandardMaterial color={palette.trim} roughness={0.24} metalness={0.46} />
      </mesh>
      <mesh castShadow position={[0.2, 0.04, 0]}>
        <sphereGeometry args={[0.12, 14, 14]} />
        <meshStandardMaterial color={palette.accentSoft} roughness={0.36} metalness={0.2} />
      </mesh>
      <mesh castShadow position={[-0.22, 0, 0]}>
        <coneGeometry args={[0.11, 0.18, 12]} />
        <meshStandardMaterial color="#788493" roughness={0.32} metalness={0.36} />
      </mesh>
      <mesh castShadow position={[0, 0, 0.24]}>
        <boxGeometry args={[0.42, 0.03, 0.16]} />
        <meshStandardMaterial color="#627181" roughness={0.42} metalness={0.3} />
      </mesh>
      <mesh castShadow position={[0, 0, -0.24]}>
        <boxGeometry args={[0.42, 0.03, 0.16]} />
        <meshStandardMaterial color="#627181" roughness={0.42} metalness={0.3} />
      </mesh>
      <mesh position={[-0.3, 0, 0]}>
        <sphereGeometry args={[0.07, 12, 12]} />
        <meshStandardMaterial
          ref={engineRef}
          color={palette.glow}
          emissive={palette.glow}
          emissiveIntensity={0.44}
          roughness={0.12}
        />
      </mesh>
    </group>
  );
}

export function SignalRibbon({
  points,
  palette,
  phase = 0,
  isNearby,
  isFocused,
}: {
  points: [Vector3, Vector3, Vector3, Vector3?];
  palette: ScenePalette;
  phase?: number;
  isNearby: boolean;
  isFocused: boolean;
}) {
  const materialRef = useRef<MeshStandardMaterial>(null);
  const geometry = useMemo(() => {
    const filteredPoints = points.filter(Boolean) as Vector3[];
    const curve = new CatmullRomCurve3(filteredPoints);
    return new TubeGeometry(curve, 28, 0.028, 8, false);
  }, [points]);
  const reveal = useWorkbenchReveal();

  useFrame(({ clock }) => {
    const activity = getSceneActivityState(
      clock.elapsedTime,
      isNearby,
      isFocused,
      phase,
      reveal.getCurrentStageMotionAmount(),
    );
    if (materialRef.current) {
      materialRef.current.emissiveIntensity = 0.12 + activity.ambient * 0.24 + activity.focused * 0.65;
      materialRef.current.opacity = 0.2 + activity.nearby * 0.12 + activity.focused * 0.18;
    }
  });

  return (
    <mesh geometry={geometry}>
      <meshStandardMaterial
        ref={materialRef}
        color={palette.glow}
        emissive={palette.glow}
        emissiveIntensity={0.3}
        transparent
        opacity={0.28}
        roughness={0.14}
        metalness={0.16}
      />
    </mesh>
  );
}

export function DataCubeCluster({
  position,
  palette,
  phase = 0,
  isNearby,
  isFocused,
  count = 4,
}: {
  position: [number, number, number];
  palette: ScenePalette;
  phase?: number;
  isNearby: boolean;
  isFocused: boolean;
  count?: number;
}) {
  const rootRef = useRef<Group>(null);
  const reveal = useWorkbenchReveal();

  useFrame(({ clock }) => {
    const motionAmount = reveal.getCurrentStageMotionAmount();
    if (rootRef.current) {
      rootRef.current.position.y =
        position[1] + Math.sin(clock.elapsedTime * 1.05 + phase * 5) * 0.05 * motionAmount;
      rootRef.current.rotation.y = Math.sin(clock.elapsedTime * 0.45 + phase * 8) * 0.22 * motionAmount;
    }
  });

  return (
    <group ref={rootRef} position={position}>
      {Array.from({ length: count }, (_, index) => (
        <mesh
          key={`${position.join('-')}-${index}`}
          castShadow
          position={[
            (index % 2) * 0.24 - 0.12,
            Math.floor(index / 2) * 0.22,
            (index % 3) * 0.08 - 0.08,
          ]}
        >
          <boxGeometry args={[0.18, 0.18, 0.18]} />
          <meshStandardMaterial
            color={index % 2 === 0 ? palette.accentSoft : palette.glow}
            emissive={index % 2 === 0 ? palette.accentSoft : palette.glow}
            emissiveIntensity={(isFocused ? 0.46 : isNearby ? 0.32 : 0.18) * reveal.getCurrentStageMotionAmount()}
            roughness={0.22}
            metalness={0.22}
          />
        </mesh>
      ))}
    </group>
  );
}

export function ClipboardProp({
  position,
  palette,
  rotation = [0, 0, 0] as [number, number, number],
}: {
  position: [number, number, number];
  palette: ScenePalette;
  rotation?: [number, number, number];
}) {
  return (
    <group position={position} rotation={rotation}>
      <mesh castShadow>
        <boxGeometry args={[0.38, 0.02, 0.28]} />
        <meshStandardMaterial color="#f5eddc" roughness={0.78} />
      </mesh>
      <mesh castShadow position={[0, 0.02, -0.1]}>
        <boxGeometry args={[0.18, 0.03, 0.05]} />
        <meshStandardMaterial color={palette.accent} roughness={0.36} metalness={0.18} />
      </mesh>
    </group>
  );
}

export function DocumentStack({
  position,
  palette,
}: {
  position: [number, number, number];
  palette: ScenePalette;
}) {
  return (
    <group position={position}>
      {[0, 0.03, 0.06].map((y, index) => (
        <mesh key={y} castShadow position={[0, y, 0]}>
          <boxGeometry args={[0.34, 0.02, 0.24]} />
          <meshStandardMaterial
            color={index === 1 ? palette.trim : '#f3ecdf'}
            roughness={0.82}
          />
        </mesh>
      ))}
    </group>
  );
}

export function PrinterUnit({
  position,
  palette,
  isNearby,
  isFocused,
}: {
  position: [number, number, number];
  palette: ScenePalette;
  isNearby: boolean;
  isFocused: boolean;
}) {
  const paperRef = useRef<Group>(null);
  const reveal = useWorkbenchReveal();

  useFrame(({ clock }) => {
    if (paperRef.current) {
      paperRef.current.position.y =
        0.12 +
        Math.sin(clock.elapsedTime * 0.7) *
          (isFocused ? 0.05 : isNearby ? 0.03 : 0.015) *
          reveal.getCurrentStageMotionAmount();
    }
  });

  return (
    <group position={position}>
      <mesh castShadow>
        <boxGeometry args={[0.62, 0.28, 0.54]} />
        <meshStandardMaterial color={palette.base} roughness={0.46} metalness={0.22} />
      </mesh>
      <group ref={paperRef} position={[0, 0.12, 0]}>
        <mesh castShadow>
          <boxGeometry args={[0.36, 0.02, 0.26]} />
          <meshStandardMaterial color="#f6efe4" roughness={0.88} />
        </mesh>
      </group>
      <mesh position={[0.2, 0.02, 0.28]}>
        <boxGeometry args={[0.12, 0.04, 0.02]} />
        <meshStandardMaterial color={palette.glow} emissive={palette.glow} emissiveIntensity={0.4} />
      </mesh>
    </group>
  );
}

export function PipeRun({
  position,
  palette,
  rotation = [0, 0, 0] as [number, number, number],
}: {
  position: [number, number, number];
  palette: ScenePalette;
  rotation?: [number, number, number];
}) {
  return (
    <group position={position} rotation={rotation}>
      <mesh castShadow position={[0, 0.34, 0]}>
        <cylinderGeometry args={[0.09, 0.09, 1.08, 16]} />
        <meshStandardMaterial color={palette.trim} roughness={0.3} metalness={0.5} />
      </mesh>
      <mesh castShadow position={[0.28, 0.72, 0]} rotation={[0, 0, Math.PI * 0.5]}>
        <cylinderGeometry args={[0.07, 0.07, 0.56, 16]} />
        <meshStandardMaterial color={palette.accent} roughness={0.28} metalness={0.3} />
      </mesh>
      <mesh castShadow position={[0.54, 0.72, 0]}>
        <sphereGeometry args={[0.1, 14, 14]} />
        <meshStandardMaterial color={palette.glow} roughness={0.18} metalness={0.16} />
      </mesh>
    </group>
  );
}

export function FridgeConsole({
  position,
  palette,
  isNearby,
  isFocused,
}: {
  position: [number, number, number];
  palette: ScenePalette;
  isNearby: boolean;
  isFocused: boolean;
}) {
  const materialRef = useRef<MeshStandardMaterial>(null);
  const reveal = useWorkbenchReveal();

  useFrame(({ clock }) => {
    const activity = getSceneActivityState(
      clock.elapsedTime,
      isNearby,
      isFocused,
      0.1,
      reveal.getCurrentStageMotionAmount(),
    );
    if (materialRef.current) {
      materialRef.current.emissiveIntensity = 0.16 + activity.ambient * 0.32 + activity.focused * 0.42;
    }
  });

  return (
    <group position={position}>
      <mesh castShadow receiveShadow>
        <boxGeometry args={[1.18, 2.1, 0.82]} />
        <meshStandardMaterial color="#d6dbde" roughness={0.34} metalness={0.14} />
      </mesh>
      <mesh castShadow position={[0.18, 0.22, 0.42]}>
        <boxGeometry args={[0.48, 0.72, 0.04]} />
        <meshStandardMaterial
          ref={materialRef}
          color="#1d3138"
          emissive="#1d3138"
          roughness={0.18}
        />
      </mesh>
      <mesh castShadow position={[0, 0, 0.42]}>
        <boxGeometry args={[0.02, 2, 0.05]} />
        <meshStandardMaterial color="#b9c0c6" roughness={0.36} />
      </mesh>
      <mesh castShadow position={[0.18, 0.58, 0.45]}>
        <boxGeometry args={[0.28, 0.08, 0.01]} />
        <meshStandardMaterial color={palette.accent} emissive={palette.accent} emissiveIntensity={0.45} />
      </mesh>
      <mesh castShadow position={[0.18, 0.38, 0.45]}>
        <boxGeometry args={[0.32, 0.04, 0.01]} />
        <meshStandardMaterial color={palette.glow} emissive={palette.glow} emissiveIntensity={0.45} />
      </mesh>
    </group>
  );
}

export function KioskStand({
  position,
  palette,
  isNearby,
  isFocused,
  variant,
}: {
  position: [number, number, number];
  palette: ScenePalette;
  isNearby: boolean;
  isFocused: boolean;
  variant: DisplayVariant;
}) {
  return (
    <group position={position}>
      <mesh castShadow>
        <boxGeometry args={[0.92, 1.42, 0.76]} />
        <meshStandardMaterial color={palette.base} roughness={0.4} metalness={0.22} />
      </mesh>
      <DisplayPanel
        position={[0, 0.34, 0.38]}
        palette={palette}
        variant={variant}
        isNearby={isNearby}
        isFocused={isFocused}
        rotation={[0.08, 0, 0]}
        scale={0.9}
      />
    </group>
  );
}

export function HologramPitch({
  position,
  palette,
  isNearby,
  isFocused,
}: {
  position: [number, number, number];
  palette: ScenePalette;
  isNearby: boolean;
  isFocused: boolean;
}) {
  const materialRef = useRef<MeshStandardMaterial>(null);
  const reveal = useWorkbenchReveal();

  useFrame(({ clock }) => {
    const activity = getSceneActivityState(
      clock.elapsedTime,
      isNearby,
      isFocused,
      0.3,
      reveal.getCurrentStageMotionAmount(),
    );
    if (materialRef.current) {
      materialRef.current.opacity = 0.24 + activity.ambient * 0.12 + activity.focused * 0.22;
    }
  });

  return (
    <group position={position}>
      <mesh castShadow receiveShadow>
        <cylinderGeometry args={[0.8, 0.88, 0.2, 24]} />
        <meshStandardMaterial color={palette.base} roughness={0.48} metalness={0.2} />
      </mesh>
      <mesh position={[0, 0.2, 0]}>
        <boxGeometry args={[1.1, 0.02, 0.72]} />
        <meshStandardMaterial
          ref={materialRef}
          color="#60e0b0"
          emissive="#60e0b0"
          emissiveIntensity={0.42}
          transparent
          opacity={0.34}
        />
      </mesh>
      <mesh position={[0, 0.22, 0]}>
        <ringGeometry args={[0.08, 0.095, 18]} />
        <meshStandardMaterial color={palette.trim} emissive={palette.trim} emissiveIntensity={0.4} />
      </mesh>
      {[-0.36, 0, 0.36].map((x, index) => (
        <mesh key={x} position={[x, 0.22, index === 1 ? 0 : index === 0 ? -0.14 : 0.14]}>
          <sphereGeometry args={[0.05, 12, 12]} />
          <meshStandardMaterial color={index === 1 ? palette.glow : palette.accent} emissive={index === 1 ? palette.glow : palette.accent} emissiveIntensity={0.5} />
        </mesh>
      ))}
    </group>
  );
}

export function TokenCluster({
  position,
  palette,
  kind,
}: {
  position: [number, number, number];
  palette: ScenePalette;
  kind: 'math' | 'ingredients' | 'services';
}) {
  const colors =
    kind === 'math'
      ? [palette.glow, palette.accent, palette.trim]
      : kind === 'ingredients'
        ? ['#f08b52', '#f6d37f', '#71ba74']
        : [palette.accentSoft, palette.glow, '#88d8c9'];

  return (
    <group position={position}>
      {colors.map((color, index) => (
        <mesh
          key={`${kind}-${color}`}
          castShadow
          position={[index * 0.18 - 0.18, (index % 2) * 0.06, index === 1 ? -0.08 : 0.08]}
        >
          {kind === 'math' ? (
            <boxGeometry args={[0.14, 0.14, 0.14]} />
          ) : (
            <sphereGeometry args={[0.09, 12, 12]} />
          )}
          <meshStandardMaterial color={color} roughness={0.3} metalness={0.08} />
        </mesh>
      ))}
    </group>
  );
}
