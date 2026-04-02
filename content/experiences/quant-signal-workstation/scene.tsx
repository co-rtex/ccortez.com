import { Vector3 } from 'three';

import {
  DataCubeCluster,
  DeskUnit,
  DisplayPanel,
  RevealStage,
  RecruiterSceneShell,
  SeatedFigure,
  SignalRibbon,
} from '../_shared/recruiterBenchPrimitives';

import type { ExperienceSceneProps } from '../../../src/types/experience';

const palette = {
  base: '#27313c',
  surface: '#665d56',
  accent: '#72d4c2',
  accentSoft: '#8bb0ff',
  glow: '#f5d685',
  trim: '#dce8ef',
};

export default function QuantSignalWorkstationScene(props: ExperienceSceneProps) {
  const { isNearby, isFocused } = props;

  return (
    <RecruiterSceneShell {...props} palette={palette}>
      <RevealStage stage={2}>
        <DeskUnit position={[0, 0, 0.3]} palette={palette} width={2.56} drawerSide="right" />
        <SeatedFigure position={[0.02, 0.04, 0.72]} shirtColor="#3f6175" accentColor="#545b65" />
      </RevealStage>
      <RevealStage stage={3}>
        <DisplayPanel
          position={[-0.68, 1.12, -0.08]}
          palette={palette}
          variant="signals"
          isNearby={isNearby}
          isFocused={isFocused}
          phase={0.14}
        />
        <DisplayPanel
          position={[0.38, 1.12, -0.1]}
          palette={palette}
          variant="runtime"
          isNearby={isNearby}
          isFocused={isFocused}
          phase={0.3}
        />
        <DisplayPanel
          position={[1.5, 1.02, -0.34]}
          palette={palette}
          variant="research"
          isNearby={isNearby}
          isFocused={isFocused}
          rotation={[0, -0.36, 0]}
          scale={0.92}
        />
        <DataCubeCluster
          position={[-1.18, 0.4, 0.8]}
          palette={palette}
          isNearby={isNearby}
          isFocused={isFocused}
          count={6}
        />
        <DataCubeCluster
          position={[1.02, 0.32, 0.86]}
          palette={palette}
          isNearby={isNearby}
          isFocused={isFocused}
          count={5}
        />
        <SignalRibbon
          points={[
            new Vector3(-1.08, 0.66, 0.72),
            new Vector3(-0.28, 1.48, -0.08),
            new Vector3(0.68, 1.18, -0.06),
            new Vector3(1.4, 1, -0.32),
          ]}
          palette={palette}
          isNearby={isNearby}
          isFocused={isFocused}
        />
        <SignalRibbon
          points={[
            new Vector3(1.04, 0.68, 0.78),
            new Vector3(0.66, 1.46, 0.24),
            new Vector3(-0.22, 1.14, -0.08),
            new Vector3(-1.02, 0.7, 0.72),
          ]}
          palette={palette}
          isNearby={isNearby}
          isFocused={isFocused}
          phase={0.3}
        />
      </RevealStage>
    </RecruiterSceneShell>
  );
}
