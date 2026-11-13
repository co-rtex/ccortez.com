import { MathUtils, Vector3 } from 'three';

import type { WorldAnchor } from '../types/experience';

export const WORKBENCH_INSPECT_LOOK_HEIGHT = 1.4;
export const WORKBENCH_INSPECT_MIN_DISTANCE = 6;
export const WORKBENCH_INSPECT_MAX_DISTANCE = 14;
export const WORKBENCH_INSPECT_MIN_ELEVATION_DEG = 18;
export const WORKBENCH_INSPECT_MAX_ELEVATION_DEG = 55;
export const WORKBENCH_INSPECT_MIN_POLAR_ANGLE = MathUtils.degToRad(
  90 - WORKBENCH_INSPECT_MAX_ELEVATION_DEG,
);
export const WORKBENCH_INSPECT_MAX_POLAR_ANGLE = MathUtils.degToRad(
  90 - WORKBENCH_INSPECT_MIN_ELEVATION_DEG,
);
export const WORKBENCH_INSPECT_TRANSITION_SECONDS = 0.38;

const defaultInspectOffset = new Vector3(4.6, 5.1, 8.9);
const UP = new Vector3(0, 1, 0);

export function getWorkbenchInspectTarget(anchor: WorldAnchor): Vector3 {
  return new Vector3(anchor.x, anchor.y + WORKBENCH_INSPECT_LOOK_HEIGHT, anchor.z);
}

/**
 * The inspect camera sits in front of the bench (its local +z, where it faces), a little to one side and above.
 * The offset turns with the bench: a fixed world offset put the camera behind every bench on the south side of
 * the ring (they face north), so a visitor opening a flagship project saw the backs of its monitors.
 */
export function getWorkbenchInspectCameraPosition(anchor: WorldAnchor, rotationY = 0): Vector3 {
  return getWorkbenchInspectTarget(anchor).add(defaultInspectOffset.clone().applyAxisAngle(UP, rotationY));
}
