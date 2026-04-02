import { Vector3 } from 'three';

import {
  DataCubeCluster,
  DisplayPanel,
  HologramPitch,
  RevealStage,
  RecruiterSceneShell,
  SignalRibbon,
} from '../_shared/recruiterBenchPrimitives';

import type { ExperienceSceneProps } from '../../../src/types/experience';

const palette = {
  base: '#283a3e',
  surface: '#6c6a58',
  accent: '#71d2ab',
  accentSoft: '#76b2ff',
  glow: '#f1d98e',
  trim: '#eaf2f0',
};

export default function FootymindScene(props: ExperienceSceneProps) {
  const { isNearby, isFocused } = props;

  return (
    <RecruiterSceneShell {...props} palette={palette}>
      <RevealStage stage={2}>
        <HologramPitch position={[0, 0.1, 0.2]} palette={palette} isNearby={isNearby} isFocused={isFocused} />
      </RevealStage>
      <RevealStage stage={3}>
        <DisplayPanel
          position={[-1.16, 1.06, -0.12]}
          palette={palette}
          variant="soccer"
          isNearby={isNearby}
          isFocused={isFocused}
        />
        <DisplayPanel
          position={[1.14, 1.02, -0.18]}
          palette={palette}
          variant="signals"
          isNearby={isNearby}
          isFocused={isFocused}
          rotation={[0, -0.24, 0]}
        />
        <DataCubeCluster
          position={[-0.92, 0.32, 0.88]}
          palette={palette}
          isNearby={isNearby}
          isFocused={isFocused}
        />
        <DataCubeCluster
          position={[1.02, 0.32, 0.84]}
          palette={palette}
          isNearby={isNearby}
          isFocused={isFocused}
        />
        <SignalRibbon
          points={[
            new Vector3(-1.0, 1.02, -0.08),
            new Vector3(-0.34, 1.46, 0),
            new Vector3(0.2, 0.86, 0.18),
            new Vector3(1.02, 0.98, -0.16),
          ]}
          palette={palette}
          isNearby={isNearby}
          isFocused={isFocused}
        />
      </RevealStage>
    </RecruiterSceneShell>
  );
}
