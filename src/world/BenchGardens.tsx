import { useLayoutEffect, useMemo, useRef } from 'react';
import { BufferAttribute, BufferGeometry, Color, Object3D } from 'three';
import type { InstancedMesh } from 'three';

import {
  BENCH_ANCHOR_LIFT,
  BENCH_PLANTER,
  benchLocalToWorld,
  getHedgeBushes,
  isPlanterBlockedByPath,
  type BenchPlacementXZ,
} from './benchPlinth';

import type { WorkbenchRuntimeRecord } from '../workbench/runtime';

/**
 * Crescent planters with hedges behind every ring workbench. All planters are one merged mesh and all bushes
 * one instanced mesh, so the whole ring's landscaping costs two draw calls.
 */

const SEGMENTS_PER_CRESCENT = 22;
const RIM = 0.09;
const CURB_TOP = new Color('#e6d7bb');
const CURB_SIDE = new Color('#b39b7a');
const SOIL = new Color('#5e4630');
// Close to the tree greens, so hedges read as part of the same planting.
const HEDGE_TONES = ['#4c8a3d', '#5a9844', '#4f9047'].map((hex) => new Color(hex));

interface GardenBench extends BenchPlacementXZ {
  floorY: number;
}

function buildPlanterGeometry(benches: readonly GardenBench[]): BufferGeometry {
  const positions: number[] = [];
  const colors: number[] = [];
  const push = (points: Array<[number, number, number]>, color: Color) => {
    for (const [x, y, z] of points) {
      positions.push(x, y, z);
      colors.push(color.r, color.g, color.b);
    }
  };
  // Two triangles for the quad a-b-c-d (counter-clockwise seen from the side the face points to).
  const quad = (
    a: [number, number, number],
    b: [number, number, number],
    c: [number, number, number],
    d: [number, number, number],
    color: Color,
  ) => push([a, b, c, a, c, d], color);

  const { innerRadius: rIn, outerRadius: rOut, halfSpan, curbHeight } = BENCH_PLANTER;
  for (const bench of benches) {
    const y0 = bench.floorY;
    const y1 = bench.floorY + curbHeight;
    const ySoil = y1 - 0.03;
    for (let i = 0; i < SEGMENTS_PER_CRESCENT; i += 1) {
      const p0 = -halfSpan + (i / SEGMENTS_PER_CRESCENT) * halfSpan * 2;
      const p1 = -halfSpan + ((i + 1) / SEGMENTS_PER_CRESCENT) * halfSpan * 2;
      const [mx, mz] = benchLocalToWorld(bench, (p0 + p1) / 2, (rIn + rOut) / 2);
      if (isPlanterBlockedByPath(mx, mz)) continue;
      const at = (phi: number, r: number, y: number): [number, number, number] => {
        const [x, z] = benchLocalToWorld(bench, phi, r);
        return [x, y, z];
      };
      // Soil between the two curb rims, curb tops, then the outer and inner curb faces.
      quad(at(p0, rIn + RIM, ySoil), at(p0, rOut - RIM, ySoil), at(p1, rOut - RIM, ySoil), at(p1, rIn + RIM, ySoil), SOIL);
      quad(at(p0, rIn, y1), at(p0, rIn + RIM, y1), at(p1, rIn + RIM, y1), at(p1, rIn, y1), CURB_TOP);
      quad(at(p0, rOut - RIM, y1), at(p0, rOut, y1), at(p1, rOut, y1), at(p1, rOut - RIM, y1), CURB_TOP);
      quad(at(p0, rOut, y0), at(p1, rOut, y0), at(p1, rOut, y1), at(p0, rOut, y1), CURB_SIDE);
      quad(at(p1, rIn, y0), at(p0, rIn, y0), at(p0, rIn, y1), at(p1, rIn, y1), CURB_SIDE);
    }
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new BufferAttribute(new Float32Array(positions), 3));
  geometry.setAttribute('color', new BufferAttribute(new Float32Array(colors), 3));
  geometry.computeVertexNormals();
  return geometry;
}

export function BenchGardens({ workbenches }: { workbenches: WorkbenchRuntimeRecord[] }) {
  const benches = useMemo<GardenBench[]>(
    () =>
      workbenches.map((workbench) => ({
        x: workbench.placement.anchor.x,
        z: workbench.placement.anchor.z,
        rotationY: workbench.placement.rotationY,
        floorY: workbench.placement.anchor.y - BENCH_ANCHOR_LIFT,
      })),
    [workbenches],
  );
  const planterGeometry = useMemo(() => buildPlanterGeometry(benches), [benches]);
  const bushes = useMemo(() => {
    const floorById = benches;
    return getHedgeBushes(benches).map((bush) => {
      // Each bush stands on the soil of the nearest bench's planter.
      const owner = floorById.reduce((best, bench) =>
        Math.hypot(bench.x - bush.x, bench.z - bush.z) < Math.hypot(best.x - bush.x, best.z - bush.z) ? bench : best,
      );
      return { ...bush, y: owner.floorY + BENCH_PLANTER.curbHeight - 0.03 };
    });
  }, [benches]);
  const hedgeRef = useRef<InstancedMesh>(null);

  useLayoutEffect(() => {
    const mesh = hedgeRef.current;
    if (!mesh) return;
    const dummy = new Object3D();
    bushes.forEach((bush, index) => {
      // Sunk about a third into the planter soil, and kept low: they frame the bench without hiding it.
      dummy.position.set(bush.x, bush.y + bush.size * 0.38, bush.z);
      dummy.rotation.set(0, bush.rotationY, 0);
      dummy.scale.set(bush.size, bush.size * 0.74, bush.size);
      dummy.updateMatrix();
      mesh.setMatrixAt(index, dummy.matrix);
      mesh.setColorAt(index, HEDGE_TONES[bush.tone]!);
    });
    mesh.count = bushes.length;
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    mesh.computeBoundingSphere();
  }, [bushes]);

  return (
    <group>
      <mesh geometry={planterGeometry} receiveShadow castShadow>
        <meshStandardMaterial vertexColors roughness={0.92} flatShading />
      </mesh>
      <instancedMesh
        key={bushes.length}
        ref={hedgeRef}
        args={[undefined, undefined, Math.max(bushes.length, 1)]}
        castShadow
        receiveShadow
      >
        <dodecahedronGeometry args={[1, 0]} />
        <meshStandardMaterial roughness={0.9} flatShading />
      </instancedMesh>
    </group>
  );
}
