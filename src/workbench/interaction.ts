import { distanceXZ } from '../engine/math';

import type { WorldAnchor } from '../types/experience';

import type { WorkbenchRuntimeRecord } from './runtime';

export function getNearestWorkbenchInRange(
  workbenches: WorkbenchRuntimeRecord[],
  playerPosition: WorldAnchor,
): WorkbenchRuntimeRecord | null {
  let closest: WorkbenchRuntimeRecord | null = null;
  let closestDistance = Number.POSITIVE_INFINITY;

  for (const workbench of workbenches) {
    const distance = distanceXZ(workbench.placement.anchor, playerPosition);
    if (distance <= workbench.interactionRadius && distance < closestDistance) {
      closest = workbench;
      closestDistance = distance;
    }
  }

  return closest;
}
