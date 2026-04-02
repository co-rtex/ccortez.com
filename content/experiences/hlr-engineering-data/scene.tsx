import { Vector3 } from 'three';

import {
  ClipboardProp,
  DataCubeCluster,
  DeskUnit,
  DisplayPanel,
  DocumentStack,
  PipeRun,
  RevealStage,
  RecruiterSceneShell,
  SignalRibbon,
} from '../_shared/recruiterBenchPrimitives';

import type { ExperienceSceneProps } from '../../../src/types/experience';

const palette = {
  base: '#323845',
  surface: '#78695c',
  accent: '#e3a14c',
  accentSoft: '#7cb3cf',
  glow: '#f4d9a4',
  trim: '#dde6ea',
};

export default function HlrEngineeringDataScene(props: ExperienceSceneProps) {
  const { isNearby, isFocused } = props;

  return (
    <RecruiterSceneShell {...props} palette={palette}>
      <RevealStage stage={2}>
        <DeskUnit position={[0, 0, 0.2]} palette={palette} width={2.48} depth={1.18} drawerSide="left" />
        <PipeRun position={[1.38, 0.18, 0.18]} palette={palette} rotation={[0, -0.42, 0]} />
      </RevealStage>
      <RevealStage stage={3}>
        <DisplayPanel
          position={[-0.54, 1.08, -0.16]}
          palette={palette}
          variant="cad"
          isNearby={isNearby}
          isFocused={isFocused}
          phase={0.1}
        />
        <DisplayPanel
          position={[0.52, 1.1, -0.04]}
          palette={palette}
          variant="resource"
          isNearby={isNearby}
          isFocused={isFocused}
          phase={0.32}
        />
        <DisplayPanel
          position={[-1.44, 1.02, -0.34]}
          palette={palette}
          variant="dataset"
          isNearby={isNearby}
          isFocused={isFocused}
          rotation={[0, 0.3, 0]}
          scale={0.92}
        />
        <DocumentStack position={[-0.7, 0.54, 0.2]} palette={palette} />
        <ClipboardProp position={[0.72, 0.56, 0.16]} palette={palette} rotation={[0.24, -0.2, 0.08]} />
        <DataCubeCluster
          position={[1.0, 0.32, 0.9]}
          palette={palette}
          isNearby={isNearby}
          isFocused={isFocused}
          count={5}
        />
        <SignalRibbon
          points={[
            new Vector3(-1.24, 1.0, -0.28),
            new Vector3(-0.42, 1.38, -0.22),
            new Vector3(0.54, 1.08, -0.08),
            new Vector3(1.32, 0.82, 0.22),
          ]}
          palette={palette}
          isNearby={isNearby}
          isFocused={isFocused}
        />
      </RevealStage>
    </RecruiterSceneShell>
  );
}
