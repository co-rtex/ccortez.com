import { Html } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import { Color, Object3D } from 'three';
import type { Group, InstancedMesh, MeshStandardMaterial } from 'three';

import { RecruiterSceneShell, RevealStage } from '../_shared/recruiterBenchPrimitives';

import type { ExperienceSceneProps } from '../../../src/types/experience';
import { DATASET_VERSIONS, DAYS, drawdownDays } from '../../../src/sim/backtestSim';
import { useQuantlabRuns, type Run } from '../../../src/sim/quantlabRunStore';
import { prefersReducedMotion } from '../../../src/world/reducedMotion';

/**
 * QuantLab as a working model: a toy backtest on synthetic prices (not QuantLab's code). The dataset shelf holds
 * immutable versions, with the run's version pulled out; the worker block glows while the run is going; the equity
 * curve grows a column per day, tinted where it stands below its running peak (drawdown); and the manifest plaque
 * lights green when a re-run of the same dataset version reproduces the previous run exactly.
 */

const palette = {
  base: '#2b2f3d',
  surface: '#69667a',
  accent: '#9b8cff',
  accentSoft: '#72d4c2',
  glow: '#efe6ff',
  trim: '#e1def0',
};

const CURVE = { x0: -0.55, step: 0.052, z: -0.18 };
const SHELF = { x: -1.22, z: -0.2 };
const WORKER = { x: -0.86, z: 0.62 };
const PLAQUE = { x: 1.0, z: 0.72 };
const equityHeight = (equity: number): number => 0.1 + Math.max(0, equity - 0.88) * 3;

const COLORS = {
  up: new Color('#72d4c2'),
  drawdown: new Color('#b98aa6'),
  flat: new Color('#8e8aa6'),
  version: new Color('#6f6a8c'),
  pinned: new Color('#9b8cff'),
};

function Label({ position, children, show }: { position: [number, number, number]; children: string; show: boolean }) {
  if (!show) return null;
  return (
    <Html center position={position} distanceFactor={9}>
      <span className="taskforge-label">{children}</span>
    </Html>
  );
}

export default function QuantlabScene(props: ExperienceSceneProps) {
  const { isFocused } = props;
  const curveRef = useRef<InstancedMesh>(null);
  const versionRefs = useRef<Array<Group | null>>([]);
  const versionMaterialRefs = useRef<Array<MeshStandardMaterial | null>>([]);
  const workerLampRef = useRef<MeshStandardMaterial | null>(null);
  const plaqueRef = useRef<MeshStandardMaterial | null>(null);
  const drawnRef = useRef<{ run: Run | null; shown: number }>({ run: null, shown: -1 });
  const dummy = useMemo(() => new Object3D(), []);

  useFrame(({ clock }, delta) => {
    useQuantlabRuns.getState().advance(Math.min(delta, 0.25));
    const { run, shown: liveShown } = useQuantlabRuns.getState();
    const reduced = prefersReducedMotion();
    const shown = reduced ? DAYS : liveShown;
    const drawn = drawnRef.current;
    const ease = 1 - Math.exp(-8 * delta);

    // The shelf: the run's dataset version slides out toward the worker.
    versionRefs.current.forEach((group, index) => {
      if (!group) return;
      const pinned = index + 1 === run.result.version;
      const target = pinned ? 0.16 : 0;
      group.position.x = reduced ? target : group.position.x + (target - group.position.x) * ease;
      const material = versionMaterialRefs.current[index];
      if (material) {
        material.color.copy(pinned ? COLORS.pinned : COLORS.version);
        material.emissive.copy(pinned ? COLORS.pinned : COLORS.version);
        material.emissiveIntensity = pinned ? 0.35 : 0;
      }
    });

    const running = shown < DAYS;
    if (workerLampRef.current) {
      workerLampRef.current.emissiveIntensity = running && !reduced ? 0.6 + Math.sin(clock.elapsedTime * 8) * 0.3 : 0.25;
    }
    if (plaqueRef.current) {
      const matched = !running && run.reproduces?.same === true;
      plaqueRef.current.color.set(matched ? '#58c08f' : '#e1def0');
      plaqueRef.current.emissive.set(matched ? '#58c08f' : '#000000');
      plaqueRef.current.emissiveIntensity = matched ? 0.5 : 0;
    }

    if (drawn.run === run && drawn.shown === shown) return;
    drawn.run = run;
    drawn.shown = shown;
    const curve = curveRef.current;
    if (!curve) return;
    const below = drawdownDays(run.result.equity);
    for (let day = 0; day < DAYS; day += 1) {
      if (day < shown) {
        const height = equityHeight(run.result.equity[day]!);
        dummy.position.set(CURVE.x0 + day * CURVE.step, height / 2, CURVE.z);
        dummy.scale.set(0.042, height, 0.09);
        curve.setColorAt(day, below[day] ? COLORS.drawdown : run.result.invested[day] ? COLORS.up : COLORS.flat);
      } else {
        dummy.scale.setScalar(0);
      }
      dummy.updateMatrix();
      curve.setMatrixAt(day, dummy.matrix);
    }
    curve.instanceMatrix.needsUpdate = true;
    if (curve.instanceColor) curve.instanceColor.needsUpdate = true;
  });

  return (
    <RecruiterSceneShell {...props} palette={palette}>
      <group position={[0, 0.067, 0]}>
        <RevealStage stage={1}>
          {/* Chart base with a baseline rule at equity 1.0. */}
          <mesh receiveShadow position={[CURVE.x0 + ((DAYS - 1) * CURVE.step) / 2, 0.02, CURVE.z]}>
            <boxGeometry args={[DAYS * CURVE.step + 0.1, 0.04, 0.3]} />
            <meshStandardMaterial color="#3a3f52" roughness={0.85} />
          </mesh>
          <mesh position={[CURVE.x0 + ((DAYS - 1) * CURVE.step) / 2, equityHeight(1), CURVE.z - 0.07]}>
            <boxGeometry args={[DAYS * CURVE.step + 0.1, 0.01, 0.01]} />
            <meshStandardMaterial color="#e1def0" roughness={0.6} />
          </mesh>
          {/* The dataset shelf. */}
          <mesh castShadow receiveShadow position={[SHELF.x - 0.02, 0.02, SHELF.z]}>
            <boxGeometry args={[0.34, 0.04, DATASET_VERSIONS * 0.13 + 0.08]} />
            <meshStandardMaterial color="#6b5440" roughness={0.9} />
          </mesh>
          {/* The worker block and the manifest plaque. */}
          <mesh castShadow position={[WORKER.x, 0.17, WORKER.z]}>
            <boxGeometry args={[0.3, 0.34, 0.26]} />
            <meshStandardMaterial color="#4a4f63" roughness={0.6} />
          </mesh>
          <mesh position={[WORKER.x, 0.36, WORKER.z + 0.08]}>
            <sphereGeometry args={[0.045, 12, 10]} />
            <meshStandardMaterial ref={workerLampRef} color="#9b8cff" emissive="#9b8cff" emissiveIntensity={0.25} />
          </mesh>
          <group position={[PLAQUE.x, 0.2, PLAQUE.z]} rotation={[-0.5, 0, 0]}>
            <mesh castShadow>
              <boxGeometry args={[0.42, 0.28, 0.04]} />
              <meshStandardMaterial ref={plaqueRef} color="#e1def0" roughness={0.5} />
            </mesh>
          </group>
          <mesh castShadow position={[PLAQUE.x, 0.08, PLAQUE.z + 0.06]}>
            <boxGeometry args={[0.06, 0.16, 0.06]} />
            <meshStandardMaterial color="#4a4f63" roughness={0.6} />
          </mesh>
        </RevealStage>

        <RevealStage stage={2}>
          {Array.from({ length: DATASET_VERSIONS }, (_, index) => (
            <group
              key={index}
              ref={(group) => {
                versionRefs.current[index] = group;
              }}
            >
              <mesh castShadow position={[SHELF.x, 0.16, SHELF.z - ((DATASET_VERSIONS - 1) * 0.13) / 2 + index * 0.13]}>
                <boxGeometry args={[0.26, 0.24, 0.09]} />
                <meshStandardMaterial
                  ref={(material) => {
                    versionMaterialRefs.current[index] = material;
                  }}
                  color="#6f6a8c"
                  roughness={0.6}
                />
              </mesh>
            </group>
          ))}
        </RevealStage>

        <RevealStage stage={3}>
          <instancedMesh ref={curveRef} args={[undefined, undefined, DAYS]} castShadow frustumCulled={false}>
            <boxGeometry args={[1, 1, 1]} />
            <meshStandardMaterial roughness={0.55} />
          </instancedMesh>
        </RevealStage>
      </group>

      <Label show={isFocused} position={[SHELF.x, 0.62, SHELF.z]}>dataset versions</Label>
      <Label show={isFocused} position={[WORKER.x, 0.66, WORKER.z]}>worker</Label>
      <Label show={isFocused} position={[CURVE.x0 + DAYS * CURVE.step * 0.5, 1.02, CURVE.z]}>equity, drawdown tinted</Label>
      <Label show={isFocused} position={[PLAQUE.x, 0.55, PLAQUE.z]}>manifest</Label>
    </RecruiterSceneShell>
  );
}
