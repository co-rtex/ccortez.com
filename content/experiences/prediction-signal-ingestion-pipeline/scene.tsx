import { Vector3 } from 'three';

import {
  DataCubeCluster,
  DisplayPanel,
  PipeRun,
  RevealStage,
  RecruiterSceneShell,
  SignalRibbon,
} from '../_shared/recruiterBenchPrimitives';

import type { ExperienceSceneProps } from '../../../src/types/experience';

const palette = {
  base: '#2f3b47',
  surface: '#5f6568',
  accent: '#73bbe3',
  accentSoft: '#8be3cb',
  glow: '#f4d996',
  trim: '#dae6ef',
};

export default function PredictionSignalIngestionPipelineScene(props: ExperienceSceneProps) {
  const { isNearby, isFocused } = props;

  return (
    <RecruiterSceneShell {...props} palette={palette}>
      <RevealStage stage={2}>
        <PipeRun position={[-1.16, 0.18, 0.18]} palette={palette} rotation={[0, 0.32, 0]} />
        <PipeRun position={[0, 0.18, -0.08]} palette={palette} />
        <PipeRun position={[1.18, 0.18, 0.18]} palette={palette} rotation={[0, -0.32, 0]} />
      </RevealStage>
      <RevealStage stage={3}>
        <DisplayPanel
          position={[-0.52, 1.08, -0.34]}
          palette={palette}
          variant="pipeline"
          isNearby={isNearby}
          isFocused={isFocused}
        />
        <DisplayPanel
          position={[0.56, 1.1, -0.26]}
          palette={palette}
          variant="dataset"
          isNearby={isNearby}
          isFocused={isFocused}
          phase={0.22}
        />
        <DataCubeCluster
          position={[-1.2, 0.32, 0.84]}
          palette={palette}
          isNearby={isNearby}
          isFocused={isFocused}
          count={5}
        />
        <DataCubeCluster
          position={[1.16, 0.32, 0.88]}
          palette={palette}
          isNearby={isNearby}
          isFocused={isFocused}
          count={5}
        />
        <SignalRibbon
          points={[
            new Vector3(-1.08, 0.82, 0.14),
            new Vector3(-0.56, 1.46, -0.1),
            new Vector3(0.1, 1.52, -0.08),
            new Vector3(0.96, 0.82, 0.14),
          ]}
          palette={palette}
          isNearby={isNearby}
          isFocused={isFocused}
        />
      </RevealStage>
    </RecruiterSceneShell>
  );
}
