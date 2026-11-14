import { Html } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import { Color, Object3D } from 'three';
import type { Group, InstancedMesh, Mesh, MeshStandardMaterial } from 'three';

import { RecruiterSceneShell, RevealStage } from '../_shared/recruiterBenchPrimitives';

import type { ExperienceSceneProps } from '../../../src/types/experience';
import { reconcileAt, trayFor, type Tray } from '../../../src/sim/reconcileLoop';
import { prefersReducedMotion } from '../../../src/world/reducedMotion';

/**
 * The HCSC Automation Team bench as a reconciliation pass. A shuttle on a rail takes each check record from the
 * records cabinet (SQL Server) to the payment-status service and back, and files it: matched (green), a mismatch
 * flagged for a person (amber), or, when the service is down, set aside with a fallback message (grey). When the
 * service is slow, its lamp turns amber and a timeout ring runs down before the call is retried. A fixed script of
 * made-up records drives it (src/sim/reconcileLoop.ts); it is an illustration, not HCSC data or code.
 */

const palette = {
  base: '#2b3442',
  surface: '#6a7383',
  accent: '#5aa3e8',
  accentSoft: '#e7a35a',
  glow: '#f3dd9c',
  trim: '#d6e2ec',
};

const RAIL = { y: 0.66, z: -0.22, from: -0.72, to: 0.72 };
const CABINET = { x: -1.08, z: -0.22 };
const BOOTH = { x: 1.08, z: -0.22 };
const CARD_Y = 0.47;
const TRAYS: Record<Tray, { x: number; z: number; color: Color }> = {
  matched: { x: -0.62, z: 0.56, color: new Color('#2f8f63') },
  flagged: { x: 0.05, z: 0.66, color: new Color('#e8b04a') },
  fallback: { x: 0.74, z: 0.56, color: new Color('#8d918c') },
};
const TRAY_ORDER: Tray[] = ['matched', 'flagged', 'fallback'];
const PER_TRAY = 8;
const CARD_COLOR = new Color('#f1ead8');
const LAMP = { idle: '#9aa39e', ok: '#58c08f', slow: '#e8b04a', down: '#d4513c' } as const;
/** Under reduced motion the bench holds this moment of the pass: several records filed, the next one on its way out. */
const STILL_SECONDS = 24.3;

const ease = (t: number): number => t * t * (3 - 2 * t);
const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

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

export default function HcscAutomationScene(props: ExperienceSceneProps) {
  const { isFocused } = props;
  const shuttleRef = useRef<Group>(null);
  const cardRef = useRef<Mesh>(null);
  const cardMaterialRef = useRef<MeshStandardMaterial | null>(null);
  const lampRef = useRef<MeshStandardMaterial | null>(null);
  const windowRef = useRef<MeshStandardMaterial | null>(null);
  const ringRef = useRef<Mesh>(null);
  const filedRef = useRef<InstancedMesh>(null);
  const clockRef = useRef({ seconds: 0, filedKey: '' });
  const dummy = useMemo(() => new Object3D(), []);

  useFrame((_, delta) => {
    const reduced = prefersReducedMotion();
    const clock = clockRef.current;
    clock.seconds = reduced ? STILL_SECONDS : clock.seconds + Math.min(delta, 0.25);
    const { phase, filed } = reconcileAt(clock.seconds);
    const tray = TRAYS[trayFor(phase.outcome)];

    // Shuttle position along the rail for each stage of the record's trip.
    let x = RAIL.to;
    if (phase.stage === 'pick') x = RAIL.from;
    else if (phase.stage === 'out') x = lerp(RAIL.from, RAIL.to, ease(phase.t));
    else if (phase.stage === 'back') x = lerp(RAIL.to, tray.x, ease(phase.t));
    else if (phase.stage === 'file') x = tray.x;
    if (shuttleRef.current) shuttleRef.current.position.x = x;

    // The card: appears at the cabinet, rides the shuttle, takes its tray's colour once the answer is in, drops.
    const card = cardRef.current;
    if (card) {
      const answered = phase.stage === 'back' || phase.stage === 'file';
      const scale = phase.stage === 'pick' ? Math.max(0.001, ease(phase.t)) : phase.stage === 'file' ? 1 - phase.t * 0.15 : 1;
      card.scale.setScalar(scale);
      const filedHeight = 0.06 + Math.min(filed[trayFor(phase.outcome)], PER_TRAY - 1) * 0.028;
      if (phase.stage === 'file') {
        // Drop from the carriage onto the top of its tray's stack (the shuttle is above the tray by now).
        const e = ease(phase.t);
        card.position.set(0, lerp(CARD_Y, filedHeight, e) - RAIL.y, lerp(0, tray.z - RAIL.z, e));
      } else {
        card.position.set(0, CARD_Y - RAIL.y, 0);
      }
      if (phase.stage === 'call' && !reduced) card.rotation.z = Math.sin(phase.t * Math.PI * 4) * 0.12;
      else card.rotation.z = 0;
      cardMaterialRef.current?.color.copy(answered ? tray.color : CARD_COLOR);
    }

    // The service's lamp and window, and the timeout ring while a slow or down call waits.
    const lampColor = LAMP[phase.lamp];
    if (lampRef.current) {
      lampRef.current.color.set(lampColor);
      lampRef.current.emissive.set(lampColor);
      lampRef.current.emissiveIntensity = phase.lamp === 'idle' ? 0.2 : 0.9;
    }
    if (windowRef.current) windowRef.current.emissiveIntensity = phase.stage === 'call' && phase.lamp === 'ok' ? 0.8 : 0.25;
    const ring = ringRef.current;
    if (ring) {
      ring.visible = phase.stage === 'wait';
      ring.scale.setScalar(0.35 + 0.65 * (1 - phase.t));
    }

    // Filed cards in the trays: only rebuilt when the counts change.
    const key = `${filed.matched}/${filed.flagged}/${filed.fallback}`;
    const mesh = filedRef.current;
    if (mesh && key !== clock.filedKey) {
      clock.filedKey = key;
      let instance = 0;
      for (const name of TRAY_ORDER) {
        const target = TRAYS[name];
        for (let n = 0; n < PER_TRAY; n += 1, instance += 1) {
          const shown = n < filed[name];
          dummy.position.set(target.x + (n % 2) * 0.012, 0.06 + n * 0.028, target.z + (n % 3) * 0.008);
          dummy.rotation.set(0, (n % 3 - 1) * 0.08, 0);
          dummy.scale.setScalar(shown ? 1 : 0);
          dummy.updateMatrix();
          mesh.setMatrixAt(instance, dummy.matrix);
          mesh.setColorAt(instance, target.color);
        }
      }
      mesh.instanceMatrix.needsUpdate = true;
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    }
  });

  return (
    <RecruiterSceneShell {...props} palette={palette}>
      {/* 15% larger than the other dioramas' base layout: its props are small pieces on a wide plinth. */}
      <group position={[0, 0.067, 0]} scale={1.15}>
        <RevealStage stage={1}>
          {/* Records cabinet (SQL Server): drawers and a stack of check records on top. */}
          <mesh castShadow receiveShadow position={[CABINET.x, 0.31, CABINET.z]}>
            <boxGeometry args={[0.5, 0.62, 0.42]} />
            <meshStandardMaterial color="#5a6476" roughness={0.7} />
          </mesh>
          {[0.14, 0.32, 0.5].map((y) => (
            <mesh key={y} position={[CABINET.x, y, CABINET.z + 0.212]}>
              <boxGeometry args={[0.4, 0.13, 0.01]} />
              <meshStandardMaterial color="#6f7a8d" roughness={0.6} />
            </mesh>
          ))}
          {[0, 1, 2, 3].map((n) => (
            <mesh key={n} castShadow position={[CABINET.x + (n % 2) * 0.015, 0.635 + n * 0.024, CABINET.z]} rotation={[0, (n - 1.5) * 0.06, 0]}>
              <boxGeometry args={[0.16, 0.02, 0.11]} />
              <meshStandardMaterial color="#f1ead8" roughness={0.8} />
            </mesh>
          ))}
          {/* Payment-status service: a booth with a lit window and a status lamp. */}
          <mesh castShadow receiveShadow position={[BOOTH.x, 0.4, BOOTH.z]}>
            <boxGeometry args={[0.48, 0.8, 0.42]} />
            <meshStandardMaterial color="#2b3442" roughness={0.6} />
          </mesh>
          <mesh position={[BOOTH.x, 0.48, BOOTH.z + 0.212]}>
            <boxGeometry args={[0.3, 0.2, 0.01]} />
            <meshStandardMaterial ref={windowRef} color="#5aa3e8" emissive="#5aa3e8" emissiveIntensity={0.25} roughness={0.4} />
          </mesh>
          <mesh position={[BOOTH.x, 0.88, BOOTH.z]}>
            <sphereGeometry args={[0.07, 14, 12]} />
            <meshStandardMaterial ref={lampRef} color={LAMP.idle} emissive={LAMP.idle} emissiveIntensity={0.2} />
          </mesh>
          <mesh ref={ringRef} position={[BOOTH.x, 0.48, BOOTH.z + 0.24]} visible={false}>
            <torusGeometry args={[0.2, 0.018, 8, 36]} />
            <meshStandardMaterial color="#e8b04a" emissive="#e8b04a" emissiveIntensity={0.7} />
          </mesh>
          {/* The rail between them, on two posts. */}
          <mesh castShadow position={[0, RAIL.y, RAIL.z]}>
            <boxGeometry args={[RAIL.to - RAIL.from + 0.2, 0.04, 0.06]} />
            <meshStandardMaterial color="#d6e2ec" roughness={0.5} />
          </mesh>
          {[RAIL.from - 0.06, RAIL.to + 0.06].map((x) => (
            <mesh key={x} castShadow position={[x, RAIL.y / 2, RAIL.z]}>
              <boxGeometry args={[0.04, RAIL.y, 0.04]} />
              <meshStandardMaterial color="#9aa6b2" roughness={0.6} />
            </mesh>
          ))}
          {/* Trays: matched, flagged for a person, fallback. */}
          {TRAY_ORDER.map((name) => (
            <group key={name} position={[TRAYS[name].x, 0, TRAYS[name].z]}>
              <mesh receiveShadow position={[0, 0.02, 0]}>
                <boxGeometry args={[0.32, 0.04, 0.24]} />
                <meshStandardMaterial color="#7d7366" roughness={0.85} />
              </mesh>
              <mesh position={[0, 0.042, 0.125]}>
                <boxGeometry args={[0.32, 0.03, 0.012]} />
                <meshStandardMaterial color={TRAYS[name].color} roughness={0.5} />
              </mesh>
            </group>
          ))}
        </RevealStage>

        <RevealStage stage={3}>
          <group ref={shuttleRef} position={[RAIL.from, RAIL.y, RAIL.z]}>
            {/* Carriage hanging from the rail, carrying the current record. */}
            <mesh castShadow position={[0, -0.07, 0]}>
              <boxGeometry args={[0.2, 0.06, 0.12]} />
              <meshStandardMaterial color="#5aa3e8" roughness={0.5} />
            </mesh>
            <mesh ref={cardRef} castShadow position={[0, CARD_Y - RAIL.y, 0]}>
              <boxGeometry args={[0.16, 0.02, 0.11]} />
              <meshStandardMaterial ref={cardMaterialRef} color="#f1ead8" roughness={0.8} />
            </mesh>
          </group>
          <instancedMesh ref={filedRef} args={[undefined, undefined, PER_TRAY * TRAY_ORDER.length]} castShadow frustumCulled={false}>
            <boxGeometry args={[0.16, 0.02, 0.11]} />
            <meshStandardMaterial roughness={0.8} />
          </instancedMesh>
        </RevealStage>
      </group>

      <Label show={isFocused} position={[CABINET.x, 1.05, CABINET.z]}>check records (SQL Server)</Label>
      <Label show={isFocused} position={[BOOTH.x, 1.18, BOOTH.z]}>payment-status API</Label>
      <Label show={isFocused} position={[TRAYS.matched.x, 0.42, TRAYS.matched.z]}>matched</Label>
      <Label show={isFocused} position={[TRAYS.flagged.x, 0.42, TRAYS.flagged.z]}>flagged</Label>
      <Label show={isFocused} position={[TRAYS.fallback.x, 0.42, TRAYS.fallback.z]}>fallback</Label>
    </RecruiterSceneShell>
  );
}
