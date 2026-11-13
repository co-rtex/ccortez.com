import { Html } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useLayoutEffect, useMemo, useRef } from 'react';
import { Color, Object3D } from 'three';
import type { Group, InstancedMesh, MeshStandardMaterial } from 'three';

import { RecruiterSceneShell, RevealStage } from '../_shared/recruiterBenchPrimitives';

import type { ExperienceSceneProps } from '../../../src/types/experience';
import { prefersReducedMotion } from '../../../src/world/reducedMotion';

/**
 * The LiDAR phenotyping work as a field pass rather than a desk: a scanner gantry sweeps over a small crop plot,
 * the plants it has passed show up as point clouds, and a per-plot trait bar rises for each plot it finishes. One
 * plot holds an odd plant, and its bar is flagged amber, the way automated quality checks flag an anomalous scan
 * for a person to look at. Each pass uses a newly seeded plot. It illustrates the pipeline's stages, not real data;
 * under reduced motion the finished pass is shown.
 */

const palette = {
  base: '#2f3a33',
  surface: '#6d7462',
  accent: '#8fd27a',
  accentSoft: '#7cc6e8',
  glow: '#e9f2a6',
  trim: '#dfe8dc',
};

const PLOTS = 6;
const ROWS = 3;
const PLANTS = PLOTS * ROWS;
const POINTS_PER_PLANT = 22;
const plotX = (plot: number): number => -1.0 + plot * 0.3;
const rowZ = (row: number): number => -0.42 + row * 0.27;
const GANTRY = { start: -1.32, end: 0.72 };
const PASS_SECONDS = 7;
const HOLD_SECONDS = 2.5;
const BARS = { x: 1.24, z0: -0.52, step: 0.2 };

const COLORS = {
  plant: [new Color('#4f8f45'), new Color('#6aa84f'), new Color('#7fb85a')],
  points: new Color('#7fe0ff'),
  bar: new Color('#3f6fc4'),
  flagged: new Color('#e8b04a'),
};

interface Plot {
  heights: number[];
  flagged: number;
}

function mulberry(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Plant heights per plot (genotypes differ by plot), with one plot holding an outlier plant. */
function seedPlot(seed: number): Plot {
  const random = mulberry(seed);
  const flagged = Math.floor(random() * PLOTS);
  const heights: number[] = [];
  for (let plot = 0; plot < PLOTS; plot += 1) {
    const genotype = 0.24 + random() * 0.26;
    for (let row = 0; row < ROWS; row += 1) {
      const odd = plot === flagged && row === 1;
      heights.push(odd ? genotype + 0.34 : genotype + (random() - 0.5) * 0.06);
    }
  }
  return { heights, flagged };
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

export default function LidarPhenotypingResearchScene(props: ExperienceSceneProps) {
  const { isFocused } = props;
  const plantsRef = useRef<InstancedMesh>(null);
  const pointsRef = useRef<InstancedMesh>(null);
  const barsRef = useRef<InstancedMesh>(null);
  const gantryRef = useRef<Group>(null);
  const beamRef = useRef<MeshStandardMaterial | null>(null);
  const passRef = useRef({ seed: 11, time: 0, plot: seedPlot(11), drawnSeed: -1, scanned: -1 });
  const dummy = useMemo(() => new Object3D(), []);
  // Fixed points on a unit cone (radius 1, height 1), scaled per plant: where the scanner "hits" the canopy.
  const conePoints = useMemo(() => {
    const random = mulberry(5);
    return Array.from({ length: POINTS_PER_PLANT }, () => {
      const h = Math.sqrt(random());
      const angle = random() * Math.PI * 2;
      return [Math.cos(angle) * (1 - h), h, Math.sin(angle) * (1 - h)] as const;
    });
  }, []);

  useLayoutEffect(() => {
    for (const mesh of [plantsRef.current, pointsRef.current, barsRef.current]) {
      if (!mesh) continue;
      dummy.scale.setScalar(0);
      dummy.updateMatrix();
      for (let i = 0; i < mesh.count; i += 1) mesh.setMatrixAt(i, dummy.matrix);
      mesh.instanceMatrix.needsUpdate = true;
    }
  }, [dummy]);

  useFrame((_, delta) => {
    const pass = passRef.current;
    const reduced = prefersReducedMotion();
    pass.time += Math.min(delta, 0.25);
    if (!reduced && pass.time > PASS_SECONDS + HOLD_SECONDS) {
      pass.time = 0;
      pass.seed += 1;
      pass.plot = seedPlot(pass.seed);
    }
    const progress = reduced ? 1 : Math.min(1, pass.time / PASS_SECONDS);
    const gantryX = GANTRY.start + (GANTRY.end - GANTRY.start) * progress;
    // Plots whose centre the beam has passed.
    let scanned = 0;
    while (scanned < PLOTS && plotX(scanned) + 0.1 < gantryX) scanned += 1;
    if (progress >= 1) scanned = PLOTS;

    if (gantryRef.current) gantryRef.current.position.x = gantryX;
    if (beamRef.current) beamRef.current.opacity = progress >= 1 ? 0 : 0.32;

    const { plot } = pass;
    const plants = plantsRef.current;
    if (plants && pass.drawnSeed !== pass.seed) {
      for (let i = 0; i < PLANTS; i += 1) {
        const plotIndex = Math.floor(i / ROWS);
        const row = i % ROWS;
        const height = plot.heights[i]!;
        dummy.position.set(plotX(plotIndex), height / 2, rowZ(row));
        dummy.scale.set(0.11, height, 0.11);
        dummy.updateMatrix();
        plants.setMatrixAt(i, dummy.matrix);
        plants.setColorAt(i, COLORS.plant[(plotIndex + row) % 3]!);
      }
      plants.instanceMatrix.needsUpdate = true;
      if (plants.instanceColor) plants.instanceColor.needsUpdate = true;
      pass.drawnSeed = pass.seed;
      pass.scanned = -1;
    }

    if (scanned === pass.scanned) return;
    pass.scanned = scanned;

    const points = pointsRef.current;
    if (points) {
      for (let i = 0; i < PLANTS; i += 1) {
        const plotIndex = Math.floor(i / ROWS);
        const visible = plotIndex < scanned;
        const height = plot.heights[i]!;
        for (let p = 0; p < POINTS_PER_PLANT; p += 1) {
          const [px, py, pz] = conePoints[p]!;
          // The cone's radius at that height is 0.11 * (1 - h); 1.12x of it puts the point just outside.
          dummy.position.set(plotX(plotIndex) + px * 0.123, py * height + 0.01, rowZ(i % ROWS) + pz * 0.123);
          dummy.scale.setScalar(visible ? 0.022 : 0);
          dummy.updateMatrix();
          points.setMatrixAt(i * POINTS_PER_PLANT + p, dummy.matrix);
        }
      }
      points.instanceMatrix.needsUpdate = true;
    }

    const bars = barsRef.current;
    if (bars) {
      for (let plotIndex = 0; plotIndex < PLOTS; plotIndex += 1) {
        const heights = plot.heights.slice(plotIndex * ROWS, plotIndex * ROWS + ROWS);
        const mean = heights.reduce((sum, value) => sum + value, 0) / ROWS;
        const value = plotIndex < scanned ? mean * 1.25 : 0;
        dummy.position.set(BARS.x, value / 2 + 0.05, BARS.z0 + plotIndex * BARS.step);
        if (value > 0) dummy.scale.set(0.12, value, 0.12);
        else dummy.scale.setScalar(0);
        dummy.updateMatrix();
        bars.setMatrixAt(plotIndex, dummy.matrix);
        bars.setColorAt(plotIndex, plotIndex === plot.flagged && plotIndex < scanned ? COLORS.flagged : COLORS.bar);
      }
      bars.instanceMatrix.needsUpdate = true;
      if (bars.instanceColor) bars.instanceColor.needsUpdate = true;
    }
  });

  return (
    <RecruiterSceneShell {...props} palette={palette}>
      <group position={[0, 0.067, 0]}>
        <RevealStage stage={1}>
          {/* The plot bed and the trait board's base. */}
          <mesh receiveShadow position={[plotX(2.5), 0.02, rowZ(1)]}>
            <boxGeometry args={[PLOTS * 0.3 + 0.08, 0.04, ROWS * 0.27 + 0.1]} />
            <meshStandardMaterial color="#6b5440" roughness={0.95} />
          </mesh>
          <mesh receiveShadow position={[BARS.x, 0.025, BARS.z0 + ((PLOTS - 1) * BARS.step) / 2]}>
            <boxGeometry args={[0.24, 0.05, PLOTS * BARS.step + 0.06]} />
            <meshStandardMaterial color="#3a4250" roughness={0.8} />
          </mesh>
        </RevealStage>

        <RevealStage stage={2}>
          {/* The scanner gantry: two legs, a crossbar carrying the sensor head, and its beam. */}
          <group ref={gantryRef} position={[GANTRY.start, 0, 0]}>
            {[rowZ(0) - 0.24, rowZ(ROWS - 1) + 0.24].map((z) => (
              <mesh key={z} castShadow position={[0, 0.5, z]}>
                <boxGeometry args={[0.05, 1.0, 0.05]} />
                <meshStandardMaterial color="#d9e3ec" roughness={0.5} />
              </mesh>
            ))}
            <mesh castShadow position={[0, 1.0, rowZ(1)]}>
              <boxGeometry args={[0.07, 0.07, ROWS * 0.27 + 0.5]} />
              <meshStandardMaterial color="#d9e3ec" roughness={0.5} />
            </mesh>
            <mesh castShadow position={[0, 0.93, rowZ(1)]}>
              <boxGeometry args={[0.12, 0.1, 0.16]} />
              <meshStandardMaterial color="#2f3a44" roughness={0.4} />
            </mesh>
            <Label show={isFocused} position={[0, 1.22, rowZ(1)]}>LiDAR gantry</Label>
            <mesh position={[0, 0.47, rowZ(1)]}>
              <boxGeometry args={[0.012, 0.86, ROWS * 0.27 + 0.1]} />
              <meshStandardMaterial
                ref={beamRef}
                color="#ff6a4d"
                emissive="#ff6a4d"
                emissiveIntensity={1.2}
                transparent
                opacity={0.32}
                depthWrite={false}
              />
            </mesh>
          </group>
        </RevealStage>

        <RevealStage stage={3}>
          <instancedMesh ref={plantsRef} args={[undefined, undefined, PLANTS]} castShadow frustumCulled={false}>
            <coneGeometry args={[1, 1, 7]} />
            <meshStandardMaterial roughness={0.85} flatShading />
          </instancedMesh>
          <instancedMesh ref={pointsRef} args={[undefined, undefined, PLANTS * POINTS_PER_PLANT]} frustumCulled={false}>
            <boxGeometry args={[1, 1, 1]} />
            <meshStandardMaterial color={COLORS.points} emissive={COLORS.points} emissiveIntensity={0.6} roughness={0.4} />
          </instancedMesh>
          <instancedMesh ref={barsRef} args={[undefined, undefined, PLOTS]} castShadow frustumCulled={false}>
            <boxGeometry args={[1, 1, 1]} />
            <meshStandardMaterial roughness={0.6} />
          </instancedMesh>
        </RevealStage>
      </group>

      <Label show={isFocused} position={[plotX(2.5), 0.85, rowZ(ROWS - 1) + 0.35]}>point clouds per plant</Label>
      <Label show={isFocused} position={[BARS.x, 0.95, BARS.z0 + BARS.step * 2.5]}>trait per plot, QC flag</Label>
    </RecruiterSceneShell>
  );
}
