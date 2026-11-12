import { Vector3 } from 'three';

import {
  DataCubeCluster,
  DeskUnit,
  DisplayPanel,
  RecruiterSceneShell,
  RevealStage,
  ServerRack,
  SignalRibbon,
} from '../_shared/recruiterBenchPrimitives';

import type { ExperienceSceneProps } from '../../../src/types/experience';

const palette = {
  base: '#262e3a',
  surface: '#5f6672',
  accent: '#f0b44c',
  accentSoft: '#7fb6ff',
  glow: '#f8e3a2',
  trim: '#d9e3ec',
};

export default function EnginexScene(props: ExperienceSceneProps) {
  const { isNearby, isFocused } = props;

  return (
    <RecruiterSceneShell {...props} palette={palette}>
      <RevealStage stage={2}>
        <DeskUnit position={[-0.2, 0, 0.3]} palette={palette} width={2.2} drawerSide="right" />
        <ServerRack
          position={[1.36, 0, -0.1]}
          rotation={[0, -0.32, 0]}
          palette={palette}
          isNearby={isNearby}
          isFocused={isFocused}
        />
      </RevealStage>
      <RevealStage stage={3}>
        <DisplayPanel
          position={[-0.74, 1.12, -0.1]}
          palette={palette}
          variant="signals"
          isNearby={isNearby}
          isFocused={isFocused}
          phase={0.1}
        />
        <DisplayPanel
          position={[0.3, 1.14, -0.1]}
          palette={palette}
          variant="runtime"
          isNearby={isNearby}
          isFocused={isFocused}
          phase={0.28}
        />
        <DataCubeCluster
          position={[-1.3, 0.34, 0.86]}
          palette={palette}
          isNearby={isNearby}
          isFocused={isFocused}
          count={6}
        />
        <SignalRibbon
          points={[
            new Vector3(-1.26, 0.64, 0.82),
            new Vector3(-0.72, 1.44, -0.06),
            new Vector3(0.3, 1.3, -0.08),
            new Vector3(1.3, 1.1, -0.06),
          ]}
          palette={palette}
          isNearby={isNearby}
          isFocused={isFocused}
        />
      </RevealStage>
    </RecruiterSceneShell>
  );
}
