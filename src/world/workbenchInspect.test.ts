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

  it('exposes the requested orbit pitch limits', () => {
    expect(WORKBENCH_INSPECT_MIN_ELEVATION_DEG).toBe(18);
    expect(WORKBENCH_INSPECT_MAX_ELEVATION_DEG).toBe(55);
    expect(WORKBENCH_INSPECT_MIN_POLAR_ANGLE).toBeLessThan(WORKBENCH_INSPECT_MAX_POLAR_ANGLE);
  });
});
