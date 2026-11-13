import { describe, expect, it } from 'vitest';

import {
  WORKBENCH_INSPECT_LOOK_HEIGHT,
  WORKBENCH_INSPECT_MAX_DISTANCE,
  WORKBENCH_INSPECT_MAX_POLAR_ANGLE,
  WORKBENCH_INSPECT_MAX_ELEVATION_DEG,
  WORKBENCH_INSPECT_MIN_DISTANCE,
  WORKBENCH_INSPECT_MIN_POLAR_ANGLE,
  WORKBENCH_INSPECT_MIN_ELEVATION_DEG,
  getWorkbenchInspectCameraPosition,
  getWorkbenchInspectDistanceScale,
  getWorkbenchInspectTarget,
} from './workbenchInspect';

describe('workbench inspect camera helpers', () => {
  it('targets the linked workbench anchor at a consistent look height', () => {
    const target = getWorkbenchInspectTarget({ x: 12, y: 1.8, z: -4 });

    expect(target.x).toBe(12);
    expect(target.y).toBeCloseTo(1.8 + WORKBENCH_INSPECT_LOOK_HEIGHT, 8);
    expect(target.z).toBe(-4);
  });

  it('starts from a front-facing three-quarter pose within the zoom clamps', () => {
    const anchor = { x: -7, y: 2.1, z: 9 };
    const target = getWorkbenchInspectTarget(anchor);
    const cameraPosition = getWorkbenchInspectCameraPosition(anchor);
    const distance = cameraPosition.distanceTo(target);

    expect(cameraPosition.x).toBeGreaterThan(target.x);
    expect(cameraPosition.z).toBeGreaterThan(target.z);
    expect(distance).toBeGreaterThanOrEqual(WORKBENCH_INSPECT_MIN_DISTANCE);
    expect(distance).toBeLessThanOrEqual(WORKBENCH_INSPECT_MAX_DISTANCE);
  });

  it('turns with the bench, so a bench facing north (south side of the ring) is seen from its front', () => {
    const anchor = { x: 0, y: 2, z: 25 };
    const target = getWorkbenchInspectTarget(anchor);
    const cameraPosition = getWorkbenchInspectCameraPosition(anchor, Math.PI);
    // Facing -z, so the camera is on the -z side (toward the plaza), not behind the bench.
    expect(cameraPosition.z).toBeLessThan(target.z);
    expect(cameraPosition.distanceTo(target)).toBeCloseTo(getWorkbenchInspectCameraPosition(anchor).distanceTo(target), 6);
  });

  it('starts further back on portrait screens', () => {
    expect(getWorkbenchInspectDistanceScale(1440, 900)).toBe(1);
    expect(getWorkbenchInspectDistanceScale(390, 844)).toBe(1.5);
    const anchor = { x: 0, y: 0, z: 0 };
    const target = getWorkbenchInspectTarget(anchor);
    expect(getWorkbenchInspectCameraPosition(anchor, 0, 1.5).distanceTo(target)).toBeCloseTo(
      getWorkbenchInspectCameraPosition(anchor).distanceTo(target) * 1.5,
      6,
    );
  });

  it('exposes the requested orbit pitch limits', () => {
    expect(WORKBENCH_INSPECT_MIN_ELEVATION_DEG).toBe(18);
    expect(WORKBENCH_INSPECT_MAX_ELEVATION_DEG).toBe(55);
    expect(WORKBENCH_INSPECT_MIN_POLAR_ANGLE).toBeLessThan(WORKBENCH_INSPECT_MAX_POLAR_ANGLE);
  });
});
