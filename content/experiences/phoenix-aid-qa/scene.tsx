import { Html } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import { Color, Object3D } from 'three';
import type { InstancedMesh, Mesh, MeshStandardMaterial } from 'three';

import { RecruiterSceneShell, RevealStage } from '../_shared/recruiterBenchPrimitives';

import type { ExperienceSceneProps } from '../../../src/types/experience';
import { FIELD_SCRIPT, extractionAt } from '../../../src/sim/extractionLoop';
import { prefersReducedMotion } from '../../../src/world/reducedMotion';

/**
 * The Phoenix-Aid bench as an extraction line. Each field of a made-up protocol leaves the protocol binder, rides
 * the queue conveyor into the extractor and comes out drafted; at the validation gate a valid draft goes onto the
 * draft eCRF board, an invalid one turns amber and goes back through the queue to be retried. A fixed script drives
 * it (src/sim/extractionLoop.ts). It illustrates the pipeline's shape, with no study, patient or sponsor data.
 */

const palette = {
  base: '#2e3239',
  surface: '#6e727d',
  accent: '#e6785e',
  accentSoft: '#f3b17a',
  glow: '#f7e29b',
  trim: '#c8d6df',
};

const BINDER = { x: -1.18, z: -0.05 };
const BELT = { y: 0.09, z: 0.42, from: -0.95, to: -0.12 };
const EXTRACTOR = { x: 0.12, z: 0.42 };
const GATE = { x: 0.6, z: 0.42 };
const BOARD = { x: 1.0, y: 0.62, z: -0.42, cols: 4, rows: 3, cellW: 0.19, cellH: 0.16 };
const TILE = 0.11;
const COLORS = {
  raw: new Color('#f1ead8'),
  draft: new Color('#5aa3e8'),
  invalid: new Color('#e8b04a'),
  placed: new Color('#2f8f63'),
};
const LAMP = { idle: '#9aa39e', pass: '#58c08f', fail: '#e8b04a' } as const;
/** Under reduced motion the bench holds a moment with most of the board filled. */
const STILL_SECONDS = 26;

const ease = (t: number): number => t * t * (3 - 2 * t);
const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

/** Centre of a board slot, on the board's front face. */
function slot(index: number): [number, number, number] {
  const col = index % BOARD.cols;
  const row = Math.floor(index / BOARD.cols);
  return [
    BOARD.x + (col - (BOARD.cols - 1) / 2) * BOARD.cellW,
    BOARD.y + ((BOARD.rows - 1) / 2 - row) * BOARD.cellH,
    BOARD.z + 0.05,
  ];
}

function Label({ position, children, show }: { position: [number, number, number]; children: string; show: boolean }) {
  if (!show) return null;
  return (
    <Html center position={position} distanceFactor={9}>
      {/* The panel explains the scene in text; these labels are visual only. */}
      <span className="taskforge-label" aria-hidden="true">
        {children}
      </span>
    </Html>
  );
}

export default function PhoenixAidScene(props: ExperienceSceneProps) {
  const { isFocused } = props;
  const tileRef = useRef<Mesh>(null);
  const tileMaterialRef = useRef<MeshStandardMaterial | null>(null);
  const lampRef = useRef<MeshStandardMaterial | null>(null);
  const extractorGlowRef = useRef<MeshStandardMaterial | null>(null);
  const boardRef = useRef<InstancedMesh>(null);
  const clockRef = useRef({ seconds: 0, placed: -1 });
  const dummy = useMemo(() => new Object3D(), []);

  useFrame((_, delta) => {
    const reduced = prefersReducedMotion();
    const clock = clockRef.current;
    clock.seconds = reduced ? STILL_SECONDS : clock.seconds + Math.min(delta, 0.25);
    const { phase, placed } = extractionAt(clock.seconds);
    const e = ease(phase.t);

    // The moving field: its position and colour for each stage of its trip.
    const tile = tileRef.current;
    if (tile) {
      let position: [number, number, number] = [BINDER.x, 0.58, BINDER.z];
      let color = COLORS.raw;
      let visible = true;
      switch (phase.stage) {
        case 'pick':
          position = [lerp(BINDER.x, BELT.from, e), lerp(0.58, BELT.y + TILE / 2, e), lerp(BINDER.z, BELT.z, e)];
          break;
        case 'queue':
          position = [lerp(BELT.from, BELT.to, phase.t), BELT.y + TILE / 2, BELT.z];
          color = phase.attempt > 0 ? COLORS.invalid : COLORS.raw;
          break;
        case 'extract':
          position = [lerp(BELT.to, GATE.x, e), BELT.y + TILE / 2, BELT.z];
          // Inside the extractor for the middle of the stage; it comes out drafted.
          visible = phase.t < 0.25 || phase.t > 0.75;
          color = phase.t > 0.5 ? COLORS.draft : phase.attempt > 0 ? COLORS.invalid : COLORS.raw;
          break;
        case 'validate':
          position = [GATE.x, BELT.y + TILE / 2, BELT.z];
          color = phase.t > 0.5 ? (phase.passes ? COLORS.placed : COLORS.invalid) : COLORS.draft;
          break;
        case 'requeue':
          // Back along the front of the belt to the start of the queue.
          position = [lerp(GATE.x, BELT.from, e), BELT.y + TILE / 2 + Math.sin(phase.t * Math.PI) * 0.18, BELT.z + 0.16];
          color = COLORS.invalid;
          break;
        case 'place': {
          const [sx, sy, sz] = slot(phase.index);
          position = [lerp(GATE.x, sx, e), lerp(BELT.y + TILE / 2, sy, e) + Math.sin(phase.t * Math.PI) * 0.25, lerp(BELT.z, sz, e)];
          color = COLORS.placed;
          break;
        }
        case 'hold':
          visible = false;
          break;
      }
      tile.position.set(position[0], position[1], position[2]);
      tile.visible = visible;
      tileMaterialRef.current?.color.copy(color);
    }

    if (lampRef.current) {
      const atGate = phase.stage === 'validate' && phase.t > 0.4;
      const color = atGate ? (phase.passes ? LAMP.pass : LAMP.fail) : LAMP.idle;
      lampRef.current.color.set(color);
      lampRef.current.emissive.set(color);
      lampRef.current.emissiveIntensity = atGate ? 0.9 : 0.2;
    }
    if (extractorGlowRef.current) {
      extractorGlowRef.current.emissiveIntensity = phase.stage === 'extract' && !reduced ? 0.6 + Math.sin(phase.t * Math.PI) * 0.5 : 0.25;
    }

    // Fields already on the board: only rebuilt when the count changes.
    const board = boardRef.current;
    if (board && placed !== clock.placed) {
      clock.placed = placed;
      for (let i = 0; i < FIELD_SCRIPT.length; i += 1) {
        const [x, y, z] = slot(i);
        dummy.position.set(x, y, z);
        dummy.scale.setScalar(i < placed ? 1 : 0);
        dummy.updateMatrix();
        board.setMatrixAt(i, dummy.matrix);
        board.setColorAt(i, COLORS.placed);
      }
      board.instanceMatrix.needsUpdate = true;
      if (board.instanceColor) board.instanceColor.needsUpdate = true;
    }
  });

  return (
    <RecruiterSceneShell {...props} palette={palette}>
      <group position={[0, 0.067, 0]} scale={1.1}>
        <RevealStage stage={1}>
          {/* Protocol binder: a thick stack of pages with a cover. */}
          <mesh castShadow receiveShadow position={[BINDER.x, 0.26, BINDER.z]}>
            <boxGeometry args={[0.34, 0.52, 0.26]} />
            <meshStandardMaterial color="#f1ead8" roughness={0.9} />
          </mesh>
          <mesh castShadow position={[BINDER.x, 0.26, BINDER.z - 0.135]}>
            <boxGeometry args={[0.36, 0.54, 0.02]} />
            <meshStandardMaterial color="#e6785e" roughness={0.7} />
          </mesh>
          {/* Queue conveyor. */}
          <mesh receiveShadow position={[(BELT.from + BELT.to) / 2, BELT.y / 2, BELT.z]}>
            <boxGeometry args={[BELT.to - BELT.from + 0.16, BELT.y, 0.2]} />
            <meshStandardMaterial color="#3a4250" roughness={0.85} />
          </mesh>
          {/* Extractor: a housing with a lit intake. */}
          <mesh castShadow position={[EXTRACTOR.x, 0.2, EXTRACTOR.z]}>
            <boxGeometry args={[0.34, 0.4, 0.3]} />
            <meshStandardMaterial color="#2e3239" roughness={0.6} />
          </mesh>
          <mesh position={[EXTRACTOR.x, 0.3, EXTRACTOR.z + 0.152]}>
            <boxGeometry args={[0.24, 0.08, 0.01]} />
            <meshStandardMaterial ref={extractorGlowRef} color="#5aa3e8" emissive="#5aa3e8" emissiveIntensity={0.25} />
          </mesh>
          {/* Validation gate. */}
          {[-0.12, 0.12].map((dz) => (
            <mesh key={dz} castShadow position={[GATE.x, 0.2, GATE.z + dz]}>
              <boxGeometry args={[0.05, 0.4, 0.05]} />
              <meshStandardMaterial color="#6e727d" roughness={0.6} />
            </mesh>
          ))}
          <mesh castShadow position={[GATE.x, 0.42, GATE.z]}>
            <boxGeometry args={[0.07, 0.06, 0.3]} />
            <meshStandardMaterial color="#6e727d" roughness={0.6} />
          </mesh>
          <mesh position={[GATE.x, 0.5, GATE.z]}>
            <sphereGeometry args={[0.06, 14, 12]} />
            <meshStandardMaterial ref={lampRef} color={LAMP.idle} emissive={LAMP.idle} emissiveIntensity={0.2} />
          </mesh>
          {/* Draft eCRF board on an easel, with empty slots. */}
          <mesh castShadow receiveShadow position={[BOARD.x, BOARD.y, BOARD.z]}>
            <boxGeometry args={[BOARD.cols * BOARD.cellW + 0.12, BOARD.rows * BOARD.cellH + 0.12, 0.06]} />
            <meshStandardMaterial color="#f7f3ea" roughness={0.8} />
          </mesh>
          {Array.from({ length: FIELD_SCRIPT.length }, (_, i) => {
            const [x, y, z] = slot(i);
            return (
              <mesh key={i} position={[x, y, z - 0.02]}>
                <boxGeometry args={[TILE + 0.03, TILE * 0.8 + 0.02, 0.008]} />
                <meshStandardMaterial color="#d8d2c4" roughness={0.9} />
              </mesh>
            );
          })}
          {[-0.36, 0.36].map((dx) => (
            <mesh key={dx} castShadow position={[BOARD.x + dx, BOARD.y / 2, BOARD.z - 0.05]}>
              <boxGeometry args={[0.04, BOARD.y, 0.04]} />
              <meshStandardMaterial color="#6b5440" roughness={0.9} />
            </mesh>
          ))}
        </RevealStage>

        <RevealStage stage={3}>
          <mesh ref={tileRef} castShadow>
            <boxGeometry args={[TILE, TILE * 0.8, 0.04]} />
            <meshStandardMaterial ref={tileMaterialRef} color="#f1ead8" roughness={0.6} />
          </mesh>
          <instancedMesh ref={boardRef} args={[undefined, undefined, FIELD_SCRIPT.length]} castShadow frustumCulled={false}>
            <boxGeometry args={[TILE, TILE * 0.8, 0.04]} />
            <meshStandardMaterial roughness={0.6} />
          </instancedMesh>
        </RevealStage>
      </group>

      <Label show={isFocused} position={[BINDER.x * 1.1, 0.95, BINDER.z * 1.1]}>protocol</Label>
      <Label show={isFocused} position={[-0.5 * 1.1, 0.42, BELT.z * 1.1]}>queue</Label>
      <Label show={isFocused} position={[EXTRACTOR.x * 1.1, 0.72, EXTRACTOR.z * 1.1]}>extractor</Label>
      <Label show={isFocused} position={[GATE.x * 1.1, 0.8, GATE.z * 1.1]}>validation</Label>
      <Label show={isFocused} position={[BOARD.x * 1.1, 1.15, BOARD.z * 1.1]}>draft eCRF, for review</Label>
    </RecruiterSceneShell>
  );
}
