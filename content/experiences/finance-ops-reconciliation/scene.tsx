import { Vector3 } from 'three';

import {
  DataCubeCluster,
  DeskUnit,
  DisplayPanel,
  DocumentStack,
  PrinterUnit,
  RevealStage,
  RecruiterSceneShell,
  SignalRibbon,
} from '../_shared/recruiterBenchPrimitives';

import type { ExperienceSceneProps } from '../../../src/types/experience';

const palette = {
  base: '#303640',
  surface: '#73675e',
  accent: '#7bd7c8',
  accentSoft: '#8ab0ff',
  glow: '#f4ddaa',
  trim: '#edf0f4',
};

export default function FinanceOpsReconciliationScene(props: ExperienceSceneProps) {
  const { isNearby, isFocused } = props;

  return (
    <RecruiterSceneShell {...props} palette={palette}>
      <RevealStage stage={2}>
        <DeskUnit position={[0, 0, 0.24]} palette={palette} width={2.36} depth={1.1} drawerSide="right" />
        <PrinterUnit position={[1.0, 0.16, 0.6]} palette={palette} isNearby={isNearby} isFocused={isFocused} />
      </RevealStage>
      <RevealStage stage={3}>
        <DisplayPanel
          position={[-0.52, 1.08, -0.08]}
          palette={palette}
          variant="reconciliation"
          isNearby={isNearby}
          isFocused={isFocused}
        />
        <DisplayPanel
          position={[0.56, 1.1, -0.04]}
          palette={palette}
          variant="dataset"
          isNearby={isNearby}
          isFocused={isFocused}
          phase={0.24}
        />
        <DocumentStack position={[-0.82, 0.54, 0.18]} palette={palette} />
        <DataCubeCluster
          position={[-1.22, 0.34, 0.72]}
          palette={palette}
          isNearby={isNearby}
          isFocused={isFocused}
        />
        <DataCubeCluster
          position={[1.22, 0.34, 0.78]}
          palette={palette}
          isNearby={isNearby}
          isFocused={isFocused}
        />
        <SignalRibbon
          points={[
            new Vector3(-1.08, 0.66, 0.68),
            new Vector3(-0.24, 1.48, -0.02),
            new Vector3(0.54, 1.12, -0.04),
            new Vector3(1.04, 0.62, 0.56),
          ]}
          palette={palette}
          isNearby={isNearby}
          isFocused={isFocused}
        />
      </RevealStage>
    </RecruiterSceneShell>
  );
}
