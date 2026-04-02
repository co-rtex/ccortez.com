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

export function getWorkbenchInspectTarget(anchor: WorldAnchor): Vector3 {
  return new Vector3(anchor.x, anchor.y + WORKBENCH_INSPECT_LOOK_HEIGHT, anchor.z);
}

export function getWorkbenchInspectCameraPosition(anchor: WorldAnchor): Vector3 {
  return getWorkbenchInspectTarget(anchor).add(defaultInspectOffset);
}
