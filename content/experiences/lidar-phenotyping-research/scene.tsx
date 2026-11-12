import { Vector3 } from 'three';

import {
  DataCubeCluster,
  DeskUnit,
  DisplayPanel,
  DocumentStack,
  RecruiterSceneShell,
  RevealStage,
  SeatedFigure,
  SignalRibbon,
} from '../_shared/recruiterBenchPrimitives';

import type { ExperienceSceneProps } from '../../../src/types/experience';

const palette = {
  base: '#2f3a33',
  surface: '#6d7462',
  accent: '#8fd27a',
  accentSoft: '#7cc6e8',
  glow: '#e9f2a6',
  trim: '#dfe8dc',
};

export default function LidarPhenotypingResearchScene(props: ExperienceSceneProps) {
  const { isNearby, isFocused } = props;

  return (
    <RecruiterSceneShell {...props} palette={palette}>
      <RevealStage stage={2}>
        <DeskUnit position={[0, 0, 0.3]} palette={palette} width={2.5} drawerSide="right" />
        <SeatedFigure position={[0.06, 0.04, 0.72]} shirtColor="#4f7a52" accentColor="#4b5560" />
        <DocumentStack position={[1.02, 0.54, 0.22]} palette={palette} />
      </RevealStage>
      <RevealStage stage={3}>
        <DisplayPanel
          position={[-0.62, 1.12, -0.1]}
          palette={palette}
          variant="dataset"
          isNearby={isNearby}
          isFocused={isFocused}
          phase={0.08}
        />
        <DisplayPanel
          position={[0.46, 1.14, -0.1]}
          palette={palette}
          variant="pipeline"
          isNearby={isNearby}
          isFocused={isFocused}
          phase={0.26}
        />
        <DataCubeCluster
          position={[-1.22, 0.36, 0.84]}
          palette={palette}
          isNearby={isNearby}
          isFocused={isFocused}
          count={7}
        />
        <SignalRibbon
          points={[
            new Vector3(-1.2, 0.62, 0.8),
            new Vector3(-0.66, 1.4, -0.04),
            new Vector3(0.44, 1.2, -0.06),
            new Vector3(1.18, 0.86, 0.3),
          ]}
          palette={palette}
          isNearby={isNearby}
          isFocused={isFocused}
        />
      </RevealStage>
    </RecruiterSceneShell>
  );
}
