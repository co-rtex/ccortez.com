import { distanceXZ } from '../engine/math';

import type { WorldAnchor } from '../types/experience';

import type { WorkbenchRuntimeRecord } from './runtime';

export interface WorkbenchStreamingActions {
  toLoad: string[];
  toUnload: string[];
}

export function computeWorkbenchStreamingActions(
  workbenches: WorkbenchRuntimeRecord[],
  playerPosition: WorldAnchor,
  loadedExperienceIds: Set<string>,
): WorkbenchStreamingActions {
  const toLoad: string[] = [];
  const toUnload: string[] = [];

  for (const workbench of workbenches) {
    const experienceId = workbench.linkedExperience?.manifest.id;
    if (!experienceId || !workbench.linkedExperience?.loadScene) {
      continue;
    }

    const distance = distanceXZ(workbench.placement.anchor, playerPosition);
    const isLoaded = loadedExperienceIds.has(experienceId);

    if (!isLoaded && distance <= workbench.preloadDistance) {
      toLoad.push(experienceId);
      continue;
    }

    if (isLoaded && distance > workbench.unloadDistance) {
      toUnload.push(experienceId);
    }
  }

  return {
    toLoad,
    toUnload,
  };
}
