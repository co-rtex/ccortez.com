import { Html } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { Color, Object3D } from 'three';
import type { Group, InstancedMesh, Mesh, MeshStandardMaterial } from 'three';

import { RecruiterSceneShell, RevealStage } from '../_shared/recruiterBenchPrimitives';

import type { ExperienceSceneProps } from '../../../src/types/experience';
import { addInput, createSim, step, type Job, type Sim } from '../../../src/sim/jobSim';
import { useTaskforgeSim } from '../../../src/sim/taskforgeSimStore';
import { prefersReducedMotion } from '../../../src/world/reducedMotion';

/**
 * TaskForge as a working model rather than a desk: the same deterministic simulation as the homepage of
 * ccortez.com, played out in 3D. Jobs wait on the queue pallet, a worker pod pulls one and holds it under a lease
 * (the ring around the pod), renewals keep the ring full, and a crashed pod's lease runs down until the
 * reconciler puts the job back in the queue. Failed attempts wait on the backoff shelf; jobs that keep failing
 * land in the dead-letter bin. PostgreSQL, the only authoritative store, flashes on every committed event.
 * It is a toy model of TaskForge's rules, not the real system; the panel says so.
 */

const palette = {
  base: '#2a3138',
  surface: '#66706b',
  accent: '#58c08f',
  accentSoft: '#e8b04a',
  glow: '#f2e6a8',
  trim: '#d7e4de',
};

const JOB = 0.13;
const SPACING = 0.155;
const QUEUE = { x: -1.15, z: -0.32 };
const RETRY = { x: -1.15, y: 1.02, z: -0.32 };
const DONE = { x: 1.12, z: 0.04 };
const DEAD = { x: 1.2, z: 0.66 };
// The tall database stack stands in the back corner, not the middle: south-ring benches are approached from
// behind, and a centred stack hid the workers from that side.
const LEDGER = { x: 1.02, z: -0.9 };
const PODS: Array<[number, number]> = [
  [-0.64, 0.48],
  [0, 0.68],
  [0.64, 0.48],
];

const JOB_COLORS = {
  queued: new Color('#ebe4d4'),
  running: new Color('#58c08f'),
  stalled: new Color('#8d918c'),
  retry_wait: new Color('#e8b04a'),
  succeeded: new Color('#2f8f63'),
  dead_letter: new Color('#d4513c'),
};

/** Where a job should sit given the whole simulation state. */
function jobTarget(job: Job, index: Map<number, number>, sim: Sim): [number, number, number] {
  const slot = index.get(job.id) ?? 0;
  const grid = (originX: number, originZ: number, baseY: number): [number, number, number] => [
    originX + ((slot % 3) - 1) * SPACING,
    baseY + Math.floor(slot / 3) * (JOB + 0.015),
    originZ + (Math.floor(slot / 9) % 2) * -SPACING,
  ];
  switch (job.state) {
    case 'queued':
      return grid(QUEUE.x, QUEUE.z, 0.14);
    case 'retry_wait':
      return [RETRY.x + (slot - 1) * SPACING, RETRY.y, RETRY.z];
    case 'succeeded':
      return grid(DONE.x, DONE.z, 0.1);
    case 'dead_letter':
      // Stacked on the bin's lid (the bin is 0.26 tall), so even the first dead-lettered job is visible.
      return [DEAD.x + ((slot % 2) - 0.5) * SPACING, 0.26 + JOB / 2 + Math.floor(slot / 2) * (JOB + 0.01), DEAD.z];
    case 'running': {
      const pod = PODS[(job.workerId ?? 1) - 1] ?? PODS[0]!;
      // A crashed worker drops its job beside it; the lease still claims it until the reconciler takes it back.
      const alive = sim.workers[(job.workerId ?? 1) - 1]?.alive ?? true;
      return alive ? [pod[0], 0.56, pod[1]] : [pod[0] + 0.3, JOB / 2, pod[1] + 0.12];
    }
  }
  return [0, 0, 0];
}

/** Slot index of each job within its state's group, so groups stack neatly. */
function slotIndex(sim: Sim): Map<number, number> {
  const counters = new Map<string, number>();
  const index = new Map<number, number>();
  for (const job of sim.jobs) {
    const n = counters.get(job.state) ?? 0;
    index.set(job.id, n);
    counters.set(job.state, n + 1);
  }
  return index;
}

/** `?tfsim=ticks[,worker@tick]`: screenshot fixture that freezes the run at a tick, optionally after a crash. */
function readFixture(): Sim | null {
  if (typeof window === 'undefined') return null;
  const raw = new URLSearchParams(window.location.search).get('tfsim');
  if (!raw) return null;
  const [ticksText, crashText] = raw.split(',');
  const ticks = Number(ticksText);
  if (!Number.isFinite(ticks)) return null;
  const [workerText, atText] = (crashText ?? '').split('@');
  let sim = createSim(2027);
  for (let t = 0; t < ticks; t += 1) {
    if (crashText && t === Number(atText)) sim = addInput(sim, { type: 'kill', workerId: Number(workerText) });
    sim = step(sim);
  }
  return sim;
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

export default function TaskforgeScene(props: ExperienceSceneProps) {
  const { isFocused } = props;
  const fixture = useMemo(() => readFixture(), []);
  const jobsRef = useRef<InstancedMesh>(null);
  const positionsRef = useRef<Array<[number, number, number]> | null>(null);
  const podRefs = useRef<Array<Group | null>>([]);
  const lampRefs = useRef<Array<MeshStandardMaterial | null>>([]);
  const ringRefs = useRef<Array<Mesh | null>>([]);
  const ringMaterialRefs = useRef<Array<MeshStandardMaterial | null>>([]);
  const ledgerRef = useRef<MeshStandardMaterial | null>(null);
  const flashRef = useRef({ events: 0, level: 0 });
  const dummy = useMemo(() => new Object3D(), []);

  useEffect(() => {
    if (fixture) useTaskforgeSim.setState({ sim: fixture, pending: 0, settledFor: 0 });
  }, [fixture]);

  useLayoutEffect(() => {
    const mesh = jobsRef.current;
    if (!mesh) return;
    for (let i = 0; i < mesh.count; i += 1) mesh.setColorAt(i, JOB_COLORS.queued);
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }, []);

  useFrame((_, delta) => {
    const store = useTaskforgeSim.getState();
    if (!fixture) store.advance(Math.min(delta, 0.25));
    const sim = useTaskforgeSim.getState().sim;
    const index = slotIndex(sim);
    const snap = prefersReducedMotion();
    const ease = 1 - Math.exp(-9 * delta);

    const mesh = jobsRef.current;
    if (mesh) {
      positionsRef.current ??= sim.jobs.map((job) => jobTarget(job, index, sim));
      sim.jobs.forEach((job, i) => {
        const target = jobTarget(job, index, sim);
        const current = positionsRef.current![i]!;
        for (let k = 0; k < 3; k += 1) current[k] = snap ? target[k]! : current[k]! + (target[k]! - current[k]!) * ease;
        dummy.position.set(current[0], current[1], current[2]);
        dummy.rotation.set(0, job.state === 'running' ? sim.tick * 0.4 : 0, 0);
        dummy.scale.setScalar(JOB);
        dummy.updateMatrix();
        mesh.setMatrixAt(i, dummy.matrix);
        const stalled = job.state === 'running' && !sim.workers[(job.workerId ?? 1) - 1]?.alive;
        mesh.setColorAt(i, stalled ? JOB_COLORS.stalled : JOB_COLORS[job.state]);
      });
      mesh.instanceMatrix.needsUpdate = true;
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    }

    sim.workers.forEach((worker, i) => {
      const pod = podRefs.current[i];
      const job = worker.jobId ? sim.jobs[worker.jobId - 1] : sim.jobs.find((candidate) => candidate.workerId === worker.id && candidate.state === 'running');
      if (pod) {
        // A crashed worker keels over; a restarted one stands back up.
        const tilt = worker.alive ? 0 : 0.42;
        pod.rotation.z = snap ? tilt : pod.rotation.z + (tilt - pod.rotation.z) * ease;
      }
      const lamp = lampRefs.current[i];
      if (lamp) {
        const color = !worker.alive ? '#d4513c' : worker.jobId ? '#58c08f' : '#9aa39e';
        lamp.color.set(color);
        lamp.emissive.set(color);
        lamp.emissiveIntensity = worker.alive ? 0.9 : 0.5;
      }
      // The lease ring: how much of the lease is left on the job this pod holds.
      const ring = ringRefs.current[i];
      const ringMaterial = ringMaterialRefs.current[i];
      if (ring && ringMaterial) {
        const holding = Boolean(job && job.state === 'running');
        const remaining = holding && job ? (job.leaseUntil - sim.tick) / sim.config.leaseTicks : 0;
        // Shown while the job is still claimed: full and green while the worker renews, shrinking red once it stops.
        ring.visible = holding;
        ring.scale.setScalar(0.35 + 0.65 * Math.max(0, Math.min(1, remaining)));
        const color = worker.alive ? '#58c08f' : '#d4513c';
        ringMaterial.color.set(color);
        ringMaterial.emissive.set(color);
      }
    });

    // PostgreSQL flashes when something is committed.
    const flash = flashRef.current;
    if (sim.events.length !== flash.events) {
      flash.level = sim.events.length > flash.events ? 1 : 0;
      flash.events = sim.events.length;
    }
    flash.level = Math.max(0, flash.level - delta * 2.4);
    if (ledgerRef.current) ledgerRef.current.emissiveIntensity = 0.12 + (snap ? 0 : flash.level * 0.9);
  });

  return (
    <RecruiterSceneShell {...props} palette={palette}>
      {/* Everything stands on the plinth deck (0.1 m above the anchor, i.e. 0.067 in this 1.5x content space). */}
      <group position={[0, 0.067, 0]}>
      <RevealStage stage={1}>
        {/* Queue pallet and the backoff shelf above it. */}
        <mesh castShadow receiveShadow position={[QUEUE.x, 0.05, QUEUE.z - 0.08]}>
          <boxGeometry args={[0.6, 0.08, 0.5]} />
          <meshStandardMaterial color="#8a6f52" roughness={0.9} />
        </mesh>
        <mesh castShadow position={[RETRY.x, RETRY.y - 0.09, RETRY.z]}>
          <boxGeometry args={[0.62, 0.035, 0.24]} />
          <meshStandardMaterial color="#c99a3e" roughness={0.7} />
        </mesh>
        {[-0.29, 0.29].map((x) => (
          <mesh key={x} castShadow position={[RETRY.x + x, (RETRY.y - 0.09) / 2, RETRY.z]}>
            <boxGeometry args={[0.035, RETRY.y - 0.09, 0.035]} />
            <meshStandardMaterial color="#7d6a52" roughness={0.8} />
          </mesh>
        ))}
        {/* Done pallet and the dead-letter bin. */}
        <mesh castShadow receiveShadow position={[DONE.x, 0.03, DONE.z - 0.08]}>
          <boxGeometry args={[0.6, 0.05, 0.5]} />
          <meshStandardMaterial color="#5f7d6c" roughness={0.9} />
        </mesh>
        <mesh castShadow receiveShadow position={[DEAD.x, 0.13, DEAD.z]}>
          <boxGeometry args={[0.42, 0.26, 0.3]} />
          <meshStandardMaterial color="#b0493b" roughness={0.85} />
        </mesh>
                {/* The database symbol: three stacked disks, the store that flashes as events commit. */}
        {[0.13, 0.4, 0.67].map((y, i) => (
          <mesh key={y} castShadow receiveShadow position={[LEDGER.x, y, LEDGER.z]}>
            <cylinderGeometry args={[0.32, 0.32, 0.22, 24]} />
            <meshStandardMaterial
              ref={i === 2 ? ledgerRef : undefined}
              color="#3f6f8f"
              emissive="#7cc3ff"
              emissiveIntensity={0.12}
              roughness={0.5}
            />
          </mesh>
        ))}
      </RevealStage>
      <RevealStage stage={2}>
        {PODS.map(([x, z], i) => (
          <group key={i} position={[x, 0, z]}>
            <group
              ref={(node) => {
                podRefs.current[i] = node;
              }}
            >
              <mesh castShadow receiveShadow position={[0, 0.06, 0]}>
                <cylinderGeometry args={[0.17, 0.19, 0.12, 16]} />
                <meshStandardMaterial color="#5b6670" roughness={0.7} />
              </mesh>
              <mesh castShadow position={[0, 0.27, 0]}>
                <capsuleGeometry args={[0.1, 0.18, 4, 10]} />
                <meshStandardMaterial color="#dfe8e3" roughness={0.6} />
              </mesh>
              <mesh position={[0, 0.43, 0.06]}>
                <sphereGeometry args={[0.045, 10, 8]} />
                <meshStandardMaterial
                  ref={(material) => {
                    lampRefs.current[i] = material;
                  }}
                  color="#9aa39e"
                  emissive="#9aa39e"
                  emissiveIntensity={0.9}
                />
              </mesh>
            </group>
            <mesh
              ref={(mesh) => {
                ringRefs.current[i] = mesh;
              }}
              position={[0, 0.02, 0]}
              rotation={[-Math.PI / 2, 0, 0]}
            >
              <torusGeometry args={[0.26, 0.022, 6, 32]} />
              <meshStandardMaterial
                ref={(material) => {
                  ringMaterialRefs.current[i] = material;
                }}
                color="#58c08f"
                emissive="#58c08f"
                emissiveIntensity={0.6}
              />
            </mesh>
          </group>
        ))}
      </RevealStage>
      <RevealStage stage={3}>
        <instancedMesh ref={jobsRef} args={[undefined, undefined, 18]} castShadow frustumCulled={false}>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial roughness={0.55} />
        </instancedMesh>
      </RevealStage>
      <Label show={isFocused} position={[QUEUE.x, 1.3, QUEUE.z]}>queue, backoff shelf</Label>
      <Label show={isFocused} position={[0, 0.95, 0.62]}>workers (leases)</Label>
      <Label show={isFocused} position={[LEDGER.x, 1.05, LEDGER.z]}>PostgreSQL</Label>
      <Label show={isFocused} position={[DONE.x - 0.05, 0.5, DONE.z + 0.1]}>succeeded</Label>
      <Label show={isFocused} position={[DEAD.x, 0.55, DEAD.z]}>dead-letter</Label>
      </group>
    </RecruiterSceneShell>
  );
}
