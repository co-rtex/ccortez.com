import { Vector3 } from 'three';

import {
  DataCubeCluster,
  DeskUnit,
  DisplayPanel,
  OrbitCraft,
  RevealStage,
  RecruiterSceneShell,
  SeatedFigure,
  SignalRibbon,
} from '../_shared/recruiterBenchPrimitives';

import type { ExperienceSceneProps } from '../../../src/types/experience';

const palette = {
  base: '#363246',
  surface: '#67616d',
  accent: '#a894ff',
  accentSoft: '#7fdac8',
  glow: '#f4d79d',
  trim: '#ecedf4',
};

export default function LlmResearchAgentScene(props: ExperienceSceneProps) {
  const { isNearby, isFocused } = props;

  return (
    <RecruiterSceneShell {...props} palette={palette}>
      <RevealStage stage={2}>
        <DeskUnit position={[0, 0, 0.28]} palette={palette} width={2.34} depth={1.08} />
        <SeatedFigure position={[-0.06, 0.04, 0.68]} shirtColor="#7569ab" accentColor="#59536a" />
      </RevealStage>
      <RevealStage stage={3}>
        <DisplayPanel
          position={[-0.56, 1.08, -0.1]}
          palette={palette}
          variant="research"
          isNearby={isNearby}
          isFocused={isFocused}
        />
        <DisplayPanel
          position={[0.56, 1.1, -0.04]}
          palette={palette}
          variant="documents"
          isNearby={isNearby}
          isFocused={isFocused}
          phase={0.24}
        />
        <DisplayPanel
          position={[1.38, 1, -0.34]}
          palette={palette}
          variant="pipeline"
          isNearby={isNearby}
          isFocused={isFocused}
          rotation={[0, -0.32, 0]}
          scale={0.88}
        />
        <DataCubeCluster
          position={[-1.24, 0.42, 0.76]}
          palette={palette}
          isNearby={isNearby}
          isFocused={isFocused}
          count={5}
        />
        <mesh position={[0.22, 1.84, 0]}>
          <sphereGeometry args={[0.18, 16, 16]} />
          <meshStandardMaterial color={palette.glow} emissive={palette.glow} emissiveIntensity={0.46} />
        </mesh>
        <OrbitCraft
          radiusX={1.76}
          radiusZ={0.78}
          baseHeight={2.2}
          phase={0.15}
          speed={0.48}
          palette={palette}
          isNearby={isNearby}
          isFocused={isFocused}
        />
        <SignalRibbon
          points={[
            new Vector3(-0.48, 1.06, -0.08),
            new Vector3(-0.12, 1.46, 0.08),
            new Vector3(0.18, 1.84, 0),
            new Vector3(1.22, 1.02, -0.28),
          ]}
          palette={palette}
          isNearby={isNearby}
          isFocused={isFocused}
        />
      </RevealStage>
    </RecruiterSceneShell>
  );
}
