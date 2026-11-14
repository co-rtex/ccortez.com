import { Html } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import { Color, Object3D } from 'three';
import type { InstancedMesh, MeshStandardMaterial } from 'three';

import { RecruiterSceneShell, RevealStage } from '../_shared/recruiterBenchPrimitives';

import type { ExperienceSceneProps } from '../../../src/types/experience';
import { MAX_PRICE, MIN_PRICE, type BookSim, type Level } from '../../../src/sim/orderBookSim';
import { useEnginexBook } from '../../../src/sim/enginexBookStore';
import { prefersReducedMotion } from '../../../src/world/reducedMotion';

/**
 * EngineX as a working model: a toy limit-order book (not EngineX's code) played out on the bench.
 *
 * Orders wait in a single file at the sequencer gate, which takes one at a time. Each sequenced order is first
 * written to the journal (the row of slabs on the left, newest at the front) and only then touches the book: the
 * ladder in the middle, bids stacked to the left of the price spine and asks to the right, one cube per lot, with
 * alternating shades marking separate orders queued at a price (oldest nearest the spine fills first). Fills drop
 * into the trades tray on the right. The panel can send limit orders priced to cross the book (EngineX accepts only
 * limit orders) and replay the journal to the same state.
 */

const palette = {
  base: '#262e3a',
  surface: '#5f6672',
  accent: '#f0b44c',
  accentSoft: '#7fb6ff',
  glow: '#f8e3a2',
  trim: '#d9e3ec',
};

const LOT = 0.105;
const LOT_STEP = 0.12;
const MAX_LOTS_SHOWN = 8;
const OVERFLOW_COLOR = new Color('#f0b44c');
const LEVELS = MAX_PRICE - MIN_PRICE + 1;
const LADDER_Z = -0.32;
const levelY = (price: number): number => 0.17 + (price - MIN_PRICE) * 0.135;

const GATE = { x: 0, z: 0.86 };
const INBOX_SHOWN = 6;
const JOURNAL = { x: -1.22, zFront: 0.74, step: 0.115 };
const JOURNAL_SHOWN = 14;
const TRADES = { x: 1.18, z: 0.24 };
const TRADES_SHOWN = 12;

const COLORS = {
  bid: [new Color('#3f9e6e'), new Color('#86cfa5')],
  ask: [new Color('#d8664f'), new Color('#f2a691')],
  buyToken: new Color('#3f9e6e'),
  sellToken: new Color('#d8664f'),
  visitor: new Color('#f0b44c'),
  trade: new Color('#f3ecd8'),
};

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

/** Lay out one side of the ladder: per level, one cube per lot, orders alternating shades, oldest at the spine. */
function placeSide(
  mesh: InstancedMesh,
  levels: Level[],
  direction: -1 | 1,
  shades: Color[],
  dummy: Object3D,
): void {
  let instance = 0;
  for (const level of levels) {
    let lot = 0;
    level.orders.forEach((order, orderIndex) => {
      for (let q = 0; q < order.qty && lot < MAX_LOTS_SHOWN; q += 1, lot += 1) {
        dummy.position.set(direction * (0.13 + lot * LOT_STEP), levelY(level.price), LADDER_Z);
        dummy.scale.setScalar(LOT);
        dummy.updateMatrix();
        mesh.setMatrixAt(instance, dummy.matrix);
        mesh.setColorAt(instance, shades[orderIndex % 2]!);
        instance += 1;
      }
    });
    // A deeper level than the ladder shows gets a small flat marker past its last cube, so it is not undercounted.
    const total = level.orders.reduce((sum, order) => sum + order.qty, 0);
    if (total > MAX_LOTS_SHOWN) {
      dummy.position.set(direction * (0.13 + MAX_LOTS_SHOWN * LOT_STEP - 0.02), levelY(level.price), LADDER_Z);
      dummy.scale.set(0.03, LOT, LOT);
      dummy.updateMatrix();
      mesh.setMatrixAt(instance, dummy.matrix);
      mesh.setColorAt(instance, OVERFLOW_COLOR);
      instance += 1;
    }
  }
  dummy.scale.setScalar(0);
  dummy.updateMatrix();
  for (; instance < mesh.count; instance += 1) mesh.setMatrixAt(instance, dummy.matrix);
  mesh.instanceMatrix.needsUpdate = true;
  if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
}

export default function EnginexScene(props: ExperienceSceneProps) {
  const { isFocused } = props;
  const bidsRef = useRef<InstancedMesh>(null);
  const asksRef = useRef<InstancedMesh>(null);
  const inboxRef = useRef<InstancedMesh>(null);
  const journalRef = useRef<InstancedMesh>(null);
  const tradesRef = useRef<InstancedMesh>(null);
  const gateLampRef = useRef<MeshStandardMaterial | null>(null);
  const drawnRef = useRef<{ sim: BookSim | null; inbox: number[]; journal: number[]; flash: number }>({
    sim: null,
    inbox: [],
    journal: [],
    flash: 0,
  });
  const dummy = useMemo(() => new Object3D(), []);

  useFrame((_, delta) => {
    useEnginexBook.getState().advance(Math.min(delta, 0.25));
    const sim = useEnginexBook.getState().sim;
    const drawn = drawnRef.current;
    const snap = prefersReducedMotion();
    const ease = 1 - Math.exp(-8 * delta);
    const previous = drawn.sim;
    const changed = previous !== sim;
    // Keep each token and slab attached to its order: sequencing shifts the inbox forward and the journal back.
    const sequenced = previous && changed ? Math.max(0, sim.nextSeq - previous.nextSeq) : 0;
    if (sequenced > 0) {
      drawn.inbox = drawn.inbox.slice(sequenced);
      for (let n = 0; n < sequenced; n += 1) drawn.journal = [JOURNAL.zFront + JOURNAL.step, ...drawn.journal];
      drawn.journal = drawn.journal.slice(0, JOURNAL_SHOWN);
    }

    if (changed) {
      if (bidsRef.current) placeSide(bidsRef.current, sim.bids, -1, COLORS.bid, dummy);
      if (asksRef.current) placeSide(asksRef.current, sim.asks, 1, COLORS.ask, dummy);
      if (sequenced > 0) drawn.flash = 1;
      const trades = tradesRef.current;
      if (trades) {
        const recent = sim.trades.slice(-TRADES_SHOWN);
        for (let i = 0; i < trades.count; i += 1) {
          if (i < recent.length) {
            dummy.position.set(TRADES.x + ((i % 3) - 1) * 0.1, 0.1 + Math.floor(i / 3) * 0.085, TRADES.z + (i % 2) * 0.02);
            dummy.scale.setScalar(0.07);
          } else {
            dummy.scale.setScalar(0);
          }
          dummy.updateMatrix();
          trades.setMatrixAt(i, dummy.matrix);
          trades.setColorAt(i, COLORS.trade);
        }
        trades.instanceMatrix.needsUpdate = true;
        if (trades.instanceColor) trades.instanceColor.needsUpdate = true;
      }
      drawn.sim = sim;
    }

    // The inbox slides toward the gate as the sequencer takes the head of the line.
    const inbox = inboxRef.current;
    if (inbox) {
      for (let i = 0; i < INBOX_SHOWN; i += 1) {
        const order = sim.inbox[i];
        const targetX = GATE.x + 0.34 + i * 0.15;
        // A new arrival rides in from the end of the conveyor.
        const current = drawn.inbox[i] ?? GATE.x + 0.34 + INBOX_SHOWN * 0.15;
        const x = snap ? targetX : current + (targetX - current) * ease;
        if (order) drawn.inbox[i] = x;
        else drawn.inbox.length = Math.min(drawn.inbox.length, i);
        dummy.position.set(x, 0.075, GATE.z);
        dummy.scale.setScalar(order ? 0.1 : 0);
        dummy.updateMatrix();
        inbox.setMatrixAt(i, dummy.matrix);
        inbox.setColorAt(i, order?.visitor ? COLORS.visitor : order?.side === 'buy' ? COLORS.buyToken : COLORS.sellToken);
      }
      inbox.instanceMatrix.needsUpdate = true;
      if (inbox.instanceColor) inbox.instanceColor.needsUpdate = true;
    }

    // The journal: newest slab at the front, older ones pushed back one place per sequenced order.
    const journal = journalRef.current;
    if (journal) {
      const entries = sim.journal.slice(-JOURNAL_SHOWN).reverse();
      for (let i = 0; i < JOURNAL_SHOWN; i += 1) {
        const entry = entries[i];
        const targetZ = JOURNAL.zFront - i * JOURNAL.step;
        const current = drawn.journal[i] ?? targetZ;
        drawn.journal[i] = snap ? targetZ : current + (targetZ - current) * ease;
        dummy.position.set(JOURNAL.x, 0.15, drawn.journal[i]!);
        dummy.scale.set(entry ? 1 : 0, entry ? 1 : 0, entry ? 1 : 0);
        dummy.updateMatrix();
        journal.setMatrixAt(i, dummy.matrix);
        journal.setColorAt(i, entry?.visitor ? COLORS.visitor : entry?.side === 'buy' ? COLORS.bid[0]! : COLORS.ask[0]!);
      }
      journal.instanceMatrix.needsUpdate = true;
      if (journal.instanceColor) journal.instanceColor.needsUpdate = true;
    }

    drawn.flash = Math.max(0, drawn.flash - delta * 2.2);
    if (gateLampRef.current) gateLampRef.current.emissiveIntensity = 0.25 + (snap ? 0 : drawn.flash * 1.1);
  });

  return (
    <RecruiterSceneShell {...props} palette={palette}>
      <group position={[0, 0.067, 0]}>
        <RevealStage stage={1}>
          {/* The price spine with a rung per price level. */}
          <mesh castShadow position={[0, levelY(MAX_PRICE) / 2 + 0.06, LADDER_Z]}>
            <boxGeometry args={[0.05, levelY(MAX_PRICE) + 0.12, 0.05]} />
            <meshStandardMaterial color="#d9e3ec" roughness={0.6} />
          </mesh>
          {Array.from({ length: LEVELS }, (_, i) => (
            <mesh key={i} position={[0, levelY(MIN_PRICE + i), LADDER_Z]}>
              <boxGeometry args={[0.2, 0.014, 0.08]} />
              <meshStandardMaterial color="#9aa6b2" roughness={0.7} />
            </mesh>
          ))}
          {/* The sequencer gate: one way in, one order at a time. */}
          {[-0.17, 0.17].map((x) => (
            <mesh key={x} castShadow position={[GATE.x + x, 0.27, GATE.z]}>
              <boxGeometry args={[0.06, 0.54, 0.06]} />
              <meshStandardMaterial color="#5f6672" roughness={0.6} />
            </mesh>
          ))}
          <mesh castShadow position={[GATE.x, 0.56, GATE.z]}>
            <boxGeometry args={[0.44, 0.07, 0.08]} />
            <meshStandardMaterial ref={gateLampRef} color="#f0b44c" emissive="#f0b44c" emissiveIntensity={0.25} roughness={0.45} />
          </mesh>
          {/* The inbox conveyor leading into the gate. */}
          <mesh receiveShadow position={[GATE.x + 0.62, 0.012, GATE.z]}>
            <boxGeometry args={[1.0, 0.024, 0.16]} />
            <meshStandardMaterial color="#3a4250" roughness={0.85} />
          </mesh>
          {/* Flow chevrons: along the conveyor into the gate, then on to the journal (written before the book). */}
          {[GATE.x + 0.95, GATE.x + 0.55, GATE.x - 0.32, GATE.x - 0.62].map((x) => (
            <mesh key={x} position={[x, 0.03, GATE.z]} rotation={[-Math.PI / 2, 0, Math.PI / 2]}>
              <coneGeometry args={[0.05, 0.09, 3]} />
              <meshStandardMaterial color="#f0b44c" emissive="#f0b44c" emissiveIntensity={0.25} roughness={0.6} />
            </mesh>
          ))}
          {/* Journal plank and trades tray. */}
          <mesh receiveShadow position={[JOURNAL.x, 0.02, JOURNAL.zFront - (JOURNAL_SHOWN - 1) * JOURNAL.step * 0.5]}>
            <boxGeometry args={[0.26, 0.04, JOURNAL_SHOWN * JOURNAL.step + 0.08]} />
            <meshStandardMaterial color="#6b5440" roughness={0.9} />
          </mesh>
          <mesh receiveShadow position={[TRADES.x, 0.03, TRADES.z]}>
            <boxGeometry args={[0.42, 0.06, 0.3]} />
            <meshStandardMaterial color="#3a4250" roughness={0.8} />
          </mesh>
        </RevealStage>

        <RevealStage stage={3}>
          <instancedMesh ref={bidsRef} args={[undefined, undefined, LEVELS * (MAX_LOTS_SHOWN + 1)]} castShadow frustumCulled={false}>
            <boxGeometry args={[1, 1, 1]} />
            <meshStandardMaterial roughness={0.55} />
          </instancedMesh>
          <instancedMesh ref={asksRef} args={[undefined, undefined, LEVELS * (MAX_LOTS_SHOWN + 1)]} castShadow frustumCulled={false}>
            <boxGeometry args={[1, 1, 1]} />
            <meshStandardMaterial roughness={0.55} />
          </instancedMesh>
          <instancedMesh ref={inboxRef} args={[undefined, undefined, INBOX_SHOWN]} castShadow frustumCulled={false}>
            <boxGeometry args={[1, 1, 1]} />
            <meshStandardMaterial roughness={0.5} />
          </instancedMesh>
          <instancedMesh ref={journalRef} args={[undefined, undefined, JOURNAL_SHOWN]} castShadow frustumCulled={false}>
            <boxGeometry args={[0.2, 0.2, 0.05]} />
            <meshStandardMaterial roughness={0.7} />
          </instancedMesh>
          <instancedMesh ref={tradesRef} args={[undefined, undefined, TRADES_SHOWN]} castShadow frustumCulled={false}>
            <boxGeometry args={[1, 1, 1]} />
            <meshStandardMaterial roughness={0.4} metalness={0.2} />
          </instancedMesh>
        </RevealStage>
      </group>

      <Label show={isFocused} position={[-0.6, 1.45, LADDER_Z]}>bids</Label>
      <Label show={isFocused} position={[0.6, 1.45, LADDER_Z]}>asks</Label>
      <Label show={isFocused} position={[GATE.x, 0.82, GATE.z]}>sequencer</Label>
      <Label show={isFocused} position={[JOURNAL.x, 0.5, 0]}>journal</Label>
      <Label show={isFocused} position={[TRADES.x, 0.55, TRADES.z]}>trades</Label>
    </RecruiterSceneShell>
  );
}
