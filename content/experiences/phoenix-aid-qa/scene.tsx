import { Vector3 } from 'three';

import {
  ClipboardProp,
  DataCubeCluster,
  DeskUnit,
  DisplayPanel,
  PrinterUnit,
  RevealStage,
  RecruiterSceneShell,
  SeatedFigure,
  SignalRibbon,
} from '../_shared/recruiterBenchPrimitives';

import type { ExperienceSceneProps } from '../../../src/types/experience';

const palette = {
  base: '#2e3239',
  surface: '#6e727d',
  accent: '#e6785e',
  accentSoft: '#f3b17a',
  glow: '#f7e29b',
  trim: '#c8d6df',
};

export default function PhoenixAidQaScene(props: ExperienceSceneProps) {
  const { isNearby, isFocused } = props;

  return (
    <RecruiterSceneShell {...props} palette={palette}>
      <RevealStage stage={2}>
        <DeskUnit position={[0, 0, 0.3]} palette={palette} width={2.4} drawerSide="left" />
        <SeatedFigure position={[-0.1, 0.04, 0.7]} shirtColor="#7084aa" accentColor="#515866" />
        <PrinterUnit position={[0.96, 0.16, 0.62]} palette={palette} isNearby={isNearby} isFocused={isFocused} />
      </RevealStage>
      <RevealStage stage={3}>
        <DisplayPanel
          position={[-0.56, 1.16, -0.12]}
          palette={palette}
          variant="qa"
          isNearby={isNearby}
          isFocused={isFocused}
          phase={0.12}
        />
        <DisplayPanel
          position={[0.54, 1.12, -0.06]}
          palette={palette}
          variant="api"
          isNearby={isNearby}
          isFocused={isFocused}
          phase={0.28}
        />
        <DisplayPanel
          position={[1.5, 1.08, -0.36]}
          palette={palette}
          variant="progress"
          isNearby={isNearby}
          isFocused={isFocused}
          rotation={[0, -0.34, 0]}
          scale={0.92}
        />
        <ClipboardProp position={[-0.74, 0.56, 0.16]} palette={palette} rotation={[0.18, 0.28, -0.22]} />
        <DataCubeCluster
          position={[-1.28, 0.46, -0.54]}
          palette={palette}
          isNearby={isNearby}
          isFocused={isFocused}
          count={5}
        />
        <SignalRibbon
          points={[
            new Vector3(-0.54, 1.12, -0.08),
            new Vector3(-0.1, 1.46, -0.22),
            new Vector3(0.44, 1.2, -0.08),
            new Vector3(1.36, 1.02, -0.34),
          ]}
          palette={palette}
          isNearby={isNearby}
          isFocused={isFocused}
        />
      </RevealStage>
    </RecruiterSceneShell>
  );
}
