import { Vector3 } from 'three';

import {
  DataCubeCluster,
  DeskUnit,
  DisplayPanel,
  RevealStage,
  RecruiterSceneShell,
  SignalRibbon,
} from '../_shared/recruiterBenchPrimitives';

import type { ExperienceSceneProps } from '../../../src/types/experience';

const palette = {
  base: '#27313c',
  surface: '#665d56',
  accent: '#72d4c2',
  accentSoft: '#8bb0ff',
  glow: '#f5d685',
  trim: '#dce8ef',
};

/**
 * A calibration-curve board beside the desk: the dashed diagonal is perfect calibration, the dots a model's predicted
 * against observed rates bowing around it. The project evaluates its signals with calibration curves (and ROC-AUC,
 * PR-AUC and Brier scores); the dots are illustrative, not its results.
 */
const CALIBRATION_DOTS: Array<[number, number]> = [
  [0.1, 0.06],
  [0.26, 0.2],
  [0.42, 0.44],
  [0.58, 0.63],
  [0.74, 0.8],
  [0.9, 0.93],
];

function CalibrationBoard({ position, rotationY }: { position: [number, number, number]; rotationY: number }) {
  const W = 0.62;
  const H = 0.48;
  const toBoard = ([u, v]: [number, number]): [number, number, number] => [(u - 0.5) * (W - 0.1), (v - 0.5) * (H - 0.1), 0.012];
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      {[-0.24, 0.24].map((x) => (
        <mesh key={x} castShadow position={[x, 0.36, -0.04]}>
          <boxGeometry args={[0.04, 0.72, 0.04]} />
          <meshStandardMaterial color="#7a6a58" roughness={0.85} />
        </mesh>
      ))}
      <group position={[0, 0.82, 0]}>
        <mesh castShadow>
          <boxGeometry args={[W, H, 0.02]} />
          <meshStandardMaterial color="#f3ecdf" roughness={0.8} />
        </mesh>
        {/* Perfect calibration: the diagonal. */}
        <mesh position={[0, 0, 0.012]} rotation={[0, 0, Math.atan2(H - 0.1, W - 0.1)]}>
          <boxGeometry args={[Math.hypot(W - 0.1, H - 0.1), 0.008, 0.004]} />
          <meshStandardMaterial color="#9aa3a8" roughness={0.6} />
        </mesh>
        {CALIBRATION_DOTS.map((dot) => (
          <mesh key={dot[0]} position={toBoard(dot)}>
            <sphereGeometry args={[0.022, 10, 8]} />
            <meshStandardMaterial color="#2f8f8a" roughness={0.5} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

export default function QuantSignalWorkstationScene(props: ExperienceSceneProps) {
  const { isNearby, isFocused } = props;

  return (
    <RecruiterSceneShell {...props} palette={palette}>
      <RevealStage stage={2}>
        <DeskUnit position={[0, 0, 0.3]} palette={palette} width={2.56} drawerSide="right" />
      </RevealStage>
      <RevealStage stage={3}>
        <CalibrationBoard position={[1.08, 0, 0.86]} rotationY={0.35} />
      </RevealStage>
      <RevealStage stage={3}>
        <DisplayPanel
          position={[-0.68, 1.12, -0.08]}
          palette={palette}
          variant="signals"
          isNearby={isNearby}
          isFocused={isFocused}
          phase={0.14}
        />
        <DisplayPanel
          position={[0.38, 1.12, -0.1]}
          palette={palette}
          variant="runtime"
          isNearby={isNearby}
          isFocused={isFocused}
          phase={0.3}
        />
        <DisplayPanel
          position={[1.5, 1.02, -0.34]}
          palette={palette}
          variant="research"
          isNearby={isNearby}
          isFocused={isFocused}
          rotation={[0, -0.36, 0]}
          scale={0.92}
        />
        <DataCubeCluster
          position={[-1.18, 0.4, 0.8]}
          palette={palette}
          isNearby={isNearby}
          isFocused={isFocused}
          count={6}
        />
        <SignalRibbon
          points={[
            new Vector3(-1.08, 0.66, 0.72),
            new Vector3(-0.28, 1.48, -0.08),
            new Vector3(0.68, 1.18, -0.06),
            new Vector3(1.4, 1, -0.32),
          ]}
          palette={palette}
          isNearby={isNearby}
          isFocused={isFocused}
        />
        <SignalRibbon
          points={[
            new Vector3(1.04, 0.9, 0.86),
            new Vector3(0.66, 1.46, 0.24),
            new Vector3(-0.22, 1.14, -0.08),
            new Vector3(-1.02, 0.7, 0.72),
          ]}
          palette={palette}
          isNearby={isNearby}
          isFocused={isFocused}
          phase={0.3}
        />
      </RevealStage>
    </RecruiterSceneShell>
  );
}
