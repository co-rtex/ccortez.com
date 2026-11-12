import { Vector3 } from 'three';

import {
  ClipboardProp,
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
  base: '#2b3442',
  surface: '#6a7383',
  accent: '#5aa3e8',
  accentSoft: '#e7a35a',
  glow: '#f3dd9c',
  trim: '#d6e2ec',
};

export default function HcscAutomationScene(props: ExperienceSceneProps) {
  const { isNearby, isFocused } = props;

  return (
    <RecruiterSceneShell {...props} palette={palette}>
      <RevealStage stage={2}>
        <DeskUnit position={[0, 0, 0.3]} palette={palette} width={2.42} drawerSide="left" />
        <SeatedFigure position={[-0.08, 0.04, 0.7]} shirtColor="#5b7fae" accentColor="#4d5563" />
        <DocumentStack position={[-1.0, 0.54, 0.2]} palette={palette} />
      </RevealStage>
      <RevealStage stage={3}>
        <DisplayPanel
          position={[-0.58, 1.14, -0.1]}
          palette={palette}
          variant="reconciliation"
          isNearby={isNearby}
          isFocused={isFocused}
          phase={0.12}
        />
        <DisplayPanel
          position={[0.5, 1.12, -0.08]}
          palette={palette}
          variant="api"
          isNearby={isNearby}
          isFocused={isFocused}
          phase={0.34}
        />
        <ClipboardProp position={[0.86, 0.56, 0.18]} palette={palette} rotation={[0.24, -0.2, 0.08]} />
        <SignalRibbon
          points={[
            new Vector3(-0.96, 0.7, 0.3),
            new Vector3(-0.4, 1.42, -0.1),
            new Vector3(0.48, 1.36, -0.06),
            new Vector3(1.08, 0.74, 0.22),
          ]}
          palette={palette}
          isNearby={isNearby}
          isFocused={isFocused}
        />
      </RevealStage>
    </RecruiterSceneShell>
  );
}
