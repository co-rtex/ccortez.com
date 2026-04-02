import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import type { Group } from 'three';

import {
  DisplayPanel,
  RevealStage,
  RecruiterSceneShell,
  getSceneActivityState,
  useWorkbenchReveal,
} from '../_shared/recruiterBenchPrimitives';

import type { ExperienceSceneProps } from '../../../src/types/experience';

const palette = {
  base: '#2d3442',
  surface: '#69615a',
  accent: '#7dd2ff',
  accentSoft: '#f0b46e',
  glow: '#f6dea4',
  trim: '#eef3f7',
};

function SortingBars({
  isNearby,
  isFocused,
}: {
  isNearby: boolean;
  isFocused: boolean;
}) {
  const rootRef = useRef<Group>(null);
  const reveal = useWorkbenchReveal();

  useFrame(({ clock }) => {
    if (!rootRef.current) {
      return;
    }

    const motionAmount = reveal.getCurrentStageMotionAmount();
    const activity = getSceneActivityState(clock.elapsedTime, isNearby, isFocused, 0.3, motionAmount);
    rootRef.current.rotation.y = Math.sin(clock.elapsedTime * 0.5) * 0.18 * motionAmount;
    rootRef.current.position.y = 0.22 + activity.focused * 0.08;
  });

  return (
    <group ref={rootRef} position={[0, 0.22, 0.18]}>
      {[0.34, 0.62, 0.2, 0.82, 0.48, 0.7].map((height, index) => (
        <mesh
          key={`${height}-${index}`}
          castShadow
          position={[index * 0.22 - 0.55, height * 0.5, 0]}
        >
          <boxGeometry args={[0.14, height, 0.14]} />
          <meshStandardMaterial
            color={index % 2 === 0 ? palette.accent : palette.accentSoft}
            emissive={index % 2 === 0 ? palette.accent : palette.accentSoft}
            emissiveIntensity={0.32 + (isFocused ? 0.28 : isNearby ? 0.14 : 0)}
          />
        </mesh>
      ))}
    </group>
  );
}

export default function IntellisortScene(props: ExperienceSceneProps) {
  const { isNearby, isFocused } = props;

  return (
    <RecruiterSceneShell {...props} palette={palette}>
      <RevealStage stage={2}>
        <mesh castShadow receiveShadow position={[0, 0.2, 0.18]}>
          <cylinderGeometry args={[1.1, 1.22, 0.26, 28]} />
          <meshStandardMaterial color={palette.surface} roughness={0.62} />
        </mesh>
        <SortingBars isNearby={isNearby} isFocused={isFocused} />
      </RevealStage>
      <RevealStage stage={3}>
        <DisplayPanel
          position={[-1.34, 1.02, -0.18]}
          palette={palette}
          variant="runtime"
          isNearby={isNearby}
          isFocused={isFocused}
          rotation={[0, 0.28, 0]}
        />
        <DisplayPanel
          position={[1.34, 1.02, -0.18]}
          palette={palette}
          variant="signals"
          isNearby={isNearby}
          isFocused={isFocused}
          rotation={[0, -0.28, 0]}
        />
      </RevealStage>
    </RecruiterSceneShell>
  );
}
