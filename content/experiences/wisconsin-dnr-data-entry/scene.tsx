import { Vector3 } from 'three';

import {
  ClipboardProp,
  DataCubeCluster,
  DeskUnit,
  DisplayPanel,
  DocumentStack,
  RevealStage,
  RecruiterSceneShell,
  SeatedFigure,
  SignalRibbon,
} from '../_shared/recruiterBenchPrimitives';

import type { ExperienceSceneProps } from '../../../src/types/experience';

const palette = {
  base: '#3b473d',
  surface: '#7d7f67',
  accent: '#7db39d',
  accentSoft: '#8acac7',
  glow: '#e3d4a2',
  trim: '#d9e1d5',
};

export default function WisconsinDnrDataEntryScene(props: ExperienceSceneProps) {
  const { isNearby, isFocused } = props;

  return (
    <RecruiterSceneShell {...props} palette={palette}>
      <RevealStage stage={2}>
        <DeskUnit position={[0, 0, 0.26]} palette={palette} width={2.24} depth={1.06} drawerSide="right" />
        <SeatedFigure position={[0.04, 0.04, 0.68]} shirtColor="#698976" accentColor="#5f6657" />
      </RevealStage>
      <RevealStage stage={3}>
        <DisplayPanel
          position={[-0.48, 1.1, -0.12]}
          palette={palette}
          variant="documents"
          isNearby={isNearby}
          isFocused={isFocused}
          phase={0.16}
        />
        <DisplayPanel
          position={[0.52, 1.1, -0.02]}
          palette={palette}
          variant="dataset"
          isNearby={isNearby}
          isFocused={isFocused}
          phase={0.31}
        />
        <DisplayPanel
          position={[1.36, 0.96, -0.3]}
          palette={palette}
          variant="resource"
          isNearby={isNearby}
          isFocused={isFocused}
          rotation={[0, -0.3, 0]}
          scale={0.84}
        />
        <DocumentStack position={[-0.8, 0.54, 0.18]} palette={palette} />
        <ClipboardProp position={[0.72, 0.56, 0.18]} palette={palette} rotation={[0.2, -0.28, 0.16]} />
        <DataCubeCluster
          position={[1.14, 0.3, 0.9]}
          palette={palette}
          isNearby={isNearby}
          isFocused={isFocused}
        />
        <mesh castShadow position={[-1.42, 0.42, -0.34]}>
          <cylinderGeometry args={[0.12, 0.16, 0.74, 16]} />
          <meshStandardMaterial color="#4f7b57" roughness={0.7} />
        </mesh>
        <mesh castShadow position={[-1.42, 0.92, -0.34]}>
          <sphereGeometry args={[0.34, 16, 16]} />
          <meshStandardMaterial color="#7bb27f" roughness={0.76} />
        </mesh>
        <SignalRibbon
          points={[
            new Vector3(-0.3, 1, -0.08),
            new Vector3(0.22, 1.42, -0.08),
            new Vector3(1.0, 1.06, -0.12),
          ]}
          palette={palette}
          isNearby={isNearby}
          isFocused={isFocused}
          phase={0.22}
        />
      </RevealStage>
    </RecruiterSceneShell>
  );
}
