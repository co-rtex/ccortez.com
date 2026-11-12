import { Vector3 } from 'three';

import {
  DataCubeCluster,
  DeskUnit,
  DisplayPanel,
  RecruiterSceneShell,
  RevealStage,
  SeatedFigure,
  SignalRibbon,
} from '../_shared/recruiterBenchPrimitives';

import type { ExperienceSceneProps } from '../../../src/types/experience';

const palette = {
  base: '#2b2f3d',
  surface: '#69667a',
  accent: '#9b8cff',
  accentSoft: '#72d4c2',
  glow: '#f3e0a0',
  trim: '#dfe0ef',
};

export default function QuantlabScene(props: ExperienceSceneProps) {
  const { isNearby, isFocused } = props;

  return (
    <RecruiterSceneShell {...props} palette={palette}>
      <RevealStage stage={2}>
        <DeskUnit position={[0, 0, 0.3]} palette={palette} width={2.5} drawerSide="right" />
        <SeatedFigure position={[-0.04, 0.04, 0.72]} shirtColor="#5d5a8c" accentColor="#4f5462" />
      </RevealStage>
      <RevealStage stage={3}>
        <DisplayPanel
          position={[-0.7, 1.12, -0.1]}
          palette={palette}
          variant="research"
          isNearby={isNearby}
          isFocused={isFocused}
          phase={0.12}
        />
        <DisplayPanel
          position={[0.4, 1.14, -0.1]}
          palette={palette}
          variant="signals"
          isNearby={isNearby}
          isFocused={isFocused}
          phase={0.3}
        />
        <DisplayPanel
          position={[1.46, 1.02, -0.34]}
          palette={palette}
          variant="runtime"
          isNearby={isNearby}
          isFocused={isFocused}
          rotation={[0, -0.36, 0]}
          scale={0.9}
        />
        <DataCubeCluster
          position={[-1.18, 0.38, 0.82]}
          palette={palette}
          isNearby={isNearby}
          isFocused={isFocused}
          count={6}
        />
        <SignalRibbon
          points={[
            new Vector3(-1.12, 0.66, 0.76),
            new Vector3(-0.3, 1.46, -0.08),
            new Vector3(0.66, 1.2, -0.06),
            new Vector3(1.4, 1.0, -0.32),
          ]}
          palette={palette}
          isNearby={isNearby}
          isFocused={isFocused}
        />
      </RevealStage>
    </RecruiterSceneShell>
  );
}
