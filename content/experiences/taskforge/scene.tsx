import { Vector3 } from 'three';

import {
  DataCubeCluster,
  DeskUnit,
  DisplayPanel,
  RecruiterSceneShell,
  RevealStage,
  SeatedFigure,
  ServerRack,
  SignalRibbon,
} from '../_shared/recruiterBenchPrimitives';

import type { ExperienceSceneProps } from '../../../src/types/experience';

const palette = {
  base: '#2a3138',
  surface: '#66706b',
  accent: '#58c08f',
  accentSoft: '#e8b04a',
  glow: '#f2e6a8',
  trim: '#d7e4de',
};

export default function TaskforgeScene(props: ExperienceSceneProps) {
  const { isNearby, isFocused } = props;

  return (
    <RecruiterSceneShell {...props} palette={palette}>
      <RevealStage stage={2}>
        <DeskUnit position={[0.1, 0, 0.3]} palette={palette} width={2.3} drawerSide="left" />
        <SeatedFigure position={[0.12, 0.04, 0.72]} shirtColor="#3f7d63" accentColor="#4f5660" />
        <ServerRack
          position={[-1.38, 0, -0.1]}
          rotation={[0, 0.32, 0]}
          palette={palette}
          isNearby={isNearby}
          isFocused={isFocused}
          phase={0.2}
        />
      </RevealStage>
      <RevealStage stage={3}>
        <DisplayPanel
          position={[-0.32, 1.14, -0.1]}
          palette={palette}
          variant="systems"
          isNearby={isNearby}
          isFocused={isFocused}
          phase={0.16}
        />
        <DisplayPanel
          position={[0.74, 1.1, -0.08]}
          palette={palette}
          variant="pipeline"
          isNearby={isNearby}
          isFocused={isFocused}
          phase={0.36}
        />
        <DataCubeCluster
          position={[1.2, 0.34, 0.86]}
          palette={palette}
          isNearby={isNearby}
          isFocused={isFocused}
          count={5}
        />
        <SignalRibbon
          points={[
            new Vector3(-1.3, 1.1, -0.04),
            new Vector3(-0.32, 1.48, -0.08),
            new Vector3(0.72, 1.32, -0.06),
            new Vector3(1.22, 0.66, 0.8),
          ]}
          palette={palette}
          isNearby={isNearby}
          isFocused={isFocused}
        />
      </RevealStage>
    </RecruiterSceneShell>
  );
}
