import { Vector3 } from 'three';

import {
  DeskUnit,
  DisplayPanel,
  RevealStage,
  RecruiterSceneShell,
  SeatedFigure,
  SignalRibbon,
  TokenCluster,
} from '../_shared/recruiterBenchPrimitives';

import type { ExperienceSceneProps } from '../../../src/types/experience';

const palette = {
  base: '#4a3d56',
  surface: '#7d6f62',
  accent: '#8fb4ff',
  accentSoft: '#f3b76d',
  glow: '#f7e3a6',
  trim: '#f1f2f4',
};

export default function MathnasiumLeadInstructorScene(props: ExperienceSceneProps) {
  const { isNearby, isFocused } = props;

  return (
    <RecruiterSceneShell {...props} palette={palette}>
      <RevealStage stage={2}>
        <DeskUnit position={[0, 0, 0.34]} palette={palette} width={2.02} depth={1} drawerSide="right" />
        <SeatedFigure position={[0.06, 0.04, 0.72]} shirtColor="#7b8fcc" accentColor="#655862" />
        <mesh castShadow position={[-1.42, 1.0, -0.22]}>
          <boxGeometry args={[1.04, 0.72, 0.08]} />
          <meshStandardMaterial color="#f6f2e8" roughness={0.82} />
        </mesh>
        <mesh position={[-1.42, 1.18, -0.16]}>
          <boxGeometry args={[0.6, 0.03, 0.01]} />
          <meshStandardMaterial color={palette.accent} emissive={palette.accent} emissiveIntensity={0.42} />
        </mesh>
        <mesh position={[-1.42, 0.98, -0.16]}>
          <boxGeometry args={[0.54, 0.03, 0.01]} />
          <meshStandardMaterial color={palette.accentSoft} emissive={palette.accentSoft} emissiveIntensity={0.42} />
        </mesh>
        <mesh position={[-1.34, 0.76, -0.15]} rotation={[0, 0, 0.8]}>
          <boxGeometry args={[0.22, 0.03, 0.01]} />
          <meshStandardMaterial color={palette.glow} emissive={palette.glow} emissiveIntensity={0.48} />
        </mesh>
        <mesh position={[-1.24, 0.7, -0.15]} rotation={[0, 0, -0.8]}>
          <boxGeometry args={[0.12, 0.03, 0.01]} />
          <meshStandardMaterial color={palette.glow} emissive={palette.glow} emissiveIntensity={0.48} />
        </mesh>
      </RevealStage>
      <RevealStage stage={3}>
        <DisplayPanel
          position={[0, 1.12, -0.16]}
          palette={palette}
          variant="progress"
          isNearby={isNearby}
          isFocused={isFocused}
        />
        <DisplayPanel
          position={[1.42, 1.08, -0.22]}
          palette={palette}
          variant="runtime"
          isNearby={isNearby}
          isFocused={isFocused}
          rotation={[0, -0.36, 0]}
        />
        <TokenCluster position={[-1.28, 0.36, 0.46]} palette={palette} kind="math" />
        <SignalRibbon
          points={[
            new Vector3(-1.1, 1.04, -0.18),
            new Vector3(-0.42, 1.48, -0.08),
            new Vector3(0.26, 1.16, -0.1),
            new Vector3(1.2, 1.02, -0.22),
          ]}
          palette={palette}
          isNearby={isNearby}
          isFocused={isFocused}
        />
      </RevealStage>
    </RecruiterSceneShell>
  );
}
