import { Vector3 } from 'three';

import {
  DataCubeCluster,
  DisplayPanel,
  FridgeConsole,
  RevealStage,
  RecruiterSceneShell,
  SignalRibbon,
  TokenCluster,
} from '../_shared/recruiterBenchPrimitives';

import type { ExperienceSceneProps } from '../../../src/types/experience';

const palette = {
  base: '#2f5560',
  surface: '#7d8c95',
  accent: '#f08d52',
  accentSoft: '#78c77a',
  glow: '#f6d690',
  trim: '#edf2f4',
};

export default function FridgefinderScene(props: ExperienceSceneProps) {
  const { isNearby, isFocused } = props;

  return (
    <RecruiterSceneShell {...props} palette={palette}>
      <RevealStage stage={2}>
        <FridgeConsole
          position={[-0.3, 1.08, -0.14]}
          palette={palette}
          isNearby={isNearby}
          isFocused={isFocused}
        />
      </RevealStage>
      <RevealStage stage={3}>
        <DisplayPanel
          position={[1.08, 1.04, -0.08]}
          palette={palette}
          variant="recipe"
          isNearby={isNearby}
          isFocused={isFocused}
          phase={0.12}
        />
        <DisplayPanel
          position={[1.64, 0.86, -0.46]}
          palette={palette}
          variant="nutrition"
          isNearby={isNearby}
          isFocused={isFocused}
          rotation={[0, -0.46, 0]}
          scale={0.84}
        />
        <TokenCluster position={[-1.28, 0.34, 0.44]} palette={palette} kind="ingredients" />
        <TokenCluster position={[0.72, 0.34, 0.68]} palette={palette} kind="ingredients" />
        <DataCubeCluster
          position={[1.18, 0.36, 0.88]}
          palette={palette}
          isNearby={isNearby}
          isFocused={isFocused}
          count={4}
        />
        <SignalRibbon
          points={[
            new Vector3(-0.12, 1.58, 0.28),
            new Vector3(0.38, 1.78, 0.02),
            new Vector3(1.12, 1.12, -0.08),
            new Vector3(1.56, 0.88, -0.46),
          ]}
          palette={palette}
          isNearby={isNearby}
          isFocused={isFocused}
        />
      </RevealStage>
    </RecruiterSceneShell>
  );
}
