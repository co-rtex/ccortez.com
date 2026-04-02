import { Vector3 } from 'three';

import {
  DisplayPanel,
  KioskStand,
  RevealStage,
  RecruiterSceneShell,
  SignalRibbon,
  TokenCluster,
} from '../_shared/recruiterBenchPrimitives';

import type { ExperienceSceneProps } from '../../../src/types/experience';

const palette = {
  base: '#35505a',
  surface: '#72685d',
  accent: '#6bcdb6',
  accentSoft: '#8fb7ff',
  glow: '#f0d693',
  trim: '#eef2ea',
};

export default function ElginHelpHubScene(props: ExperienceSceneProps) {
  const { isNearby, isFocused } = props;

  return (
    <RecruiterSceneShell {...props} palette={palette}>
      <RevealStage stage={2}>
        <KioskStand
          position={[0, 0.72, 0.12]}
          palette={palette}
          isNearby={isNearby}
          isFocused={isFocused}
          variant="resource"
        />
        <mesh castShadow position={[0, 1.92, -0.12]}>
          <boxGeometry args={[1.84, 0.08, 0.12]} />
          <meshStandardMaterial color={palette.accent} roughness={0.34} metalness={0.2} />
        </mesh>
        <mesh castShadow position={[-0.84, 1.56, -0.12]}>
          <boxGeometry args={[0.1, 0.82, 0.1]} />
          <meshStandardMaterial color={palette.trim} roughness={0.38} metalness={0.22} />
        </mesh>
        <mesh castShadow position={[0.84, 1.56, -0.12]}>
          <boxGeometry args={[0.1, 0.82, 0.1]} />
          <meshStandardMaterial color={palette.trim} roughness={0.38} metalness={0.22} />
        </mesh>
      </RevealStage>
      <RevealStage stage={3}>
        <DisplayPanel
          position={[1.24, 1, -0.28]}
          palette={palette}
          variant="documents"
          isNearby={isNearby}
          isFocused={isFocused}
          rotation={[0, -0.28, 0]}
          scale={0.84}
        />
        <TokenCluster position={[-1.18, 0.3, 0.54]} palette={palette} kind="services" />
        <TokenCluster position={[1.02, 0.32, 0.74]} palette={palette} kind="services" />
        <SignalRibbon
          points={[
            new Vector3(-1.02, 0.46, 0.48),
            new Vector3(-0.44, 1.48, 0.14),
            new Vector3(0.18, 1.22, 0.18),
            new Vector3(1.08, 0.98, -0.22),
          ]}
          palette={palette}
          isNearby={isNearby}
          isFocused={isFocused}
        />
      </RevealStage>
    </RecruiterSceneShell>
  );
}
