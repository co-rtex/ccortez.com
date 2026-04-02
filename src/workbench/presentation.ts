import { distanceXZ } from '../engine/math';

import type { ExperienceScenePresentationState, WorldAnchor } from '../types/experience';

import type { WorkbenchRuntimeRecord } from './runtime';

export const WORKBENCH_SCENE_ENTER_STAGE_STAGGER_MS = 110;
export const WORKBENCH_SCENE_ENTER_DURATION_MS = 320;
export const WORKBENCH_SCENE_EXIT_DURATION_MS = 220;
export const WORKBENCH_SCENE_TOTAL_ENTER_DURATION_MS =
  WORKBENCH_SCENE_ENTER_DURATION_MS + WORKBENCH_SCENE_ENTER_STAGE_STAGGER_MS * 2;

export interface WorkbenchScenePresentationEntry {
  state: ExperienceScenePresentationState;
  transitionStartedAtMs: number;
}

export type WorkbenchScenePresentationMap = Record<string, WorkbenchScenePresentationEntry>;

function resolveWorkbenchExperienceId(workbench: WorkbenchRuntimeRecord): string | null {
  const experienceId = workbench.linkedExperience?.manifest.id;
  if (!experienceId || !workbench.linkedExperience?.loadScene) {
    return null;
  }

  return experienceId;
}

export function shouldPresentWorkbenchScene(
  workbench: WorkbenchRuntimeRecord,
  playerPosition: WorldAnchor,
  focusedWorkbenchId: string | null,
): boolean {
  return (
    focusedWorkbenchId === workbench.definition.id ||
    distanceXZ(workbench.placement.anchor, playerPosition) <= workbench.interactionRadius
  );
}

export function scenePresentationMapsEqual(
  left: WorkbenchScenePresentationMap,
  right: WorkbenchScenePresentationMap,
): boolean {
  const leftKeys = Object.keys(left);
  const rightKeys = Object.keys(right);

  if (leftKeys.length !== rightKeys.length) {
    return false;
  }

  return leftKeys.every((key) => {
    const leftEntry = left[key];
    const rightEntry = right[key];

    return (
      Boolean(leftEntry) &&
      Boolean(rightEntry) &&
      leftEntry.state === rightEntry.state &&
      leftEntry.transitionStartedAtMs === rightEntry.transitionStartedAtMs
    );
  });
}

export function computeWorkbenchScenePresentation(
  workbenches: WorkbenchRuntimeRecord[],
  playerPosition: WorldAnchor,
  loadedExperienceIds: Set<string>,
  currentPresentation: WorkbenchScenePresentationMap,
  focusedWorkbenchId: string | null,
  nowMs: number,
): WorkbenchScenePresentationMap {
  const nextPresentation: WorkbenchScenePresentationMap = {};

  for (const workbench of workbenches) {
    const experienceId = resolveWorkbenchExperienceId(workbench);
    if (!experienceId) {
      continue;
    }

    const currentEntry = currentPresentation[experienceId];
    const isLoaded = loadedExperienceIds.has(experienceId);
    const shouldPresent =
      isLoaded && shouldPresentWorkbenchScene(workbench, playerPosition, focusedWorkbenchId);

    if (shouldPresent) {
      if (!currentEntry || currentEntry.state === 'exiting') {
        nextPresentation[experienceId] = {
          state: 'entering',
          transitionStartedAtMs: nowMs,
        };
        continue;
      }

      if (
        currentEntry.state === 'entering' &&
        nowMs - currentEntry.transitionStartedAtMs >= WORKBENCH_SCENE_TOTAL_ENTER_DURATION_MS
      ) {
        nextPresentation[experienceId] = {
          state: 'visible',
          transitionStartedAtMs: currentEntry.transitionStartedAtMs,
        };
        continue;
      }

      nextPresentation[experienceId] = currentEntry;
      continue;
    }

    if (!currentEntry) {
      continue;
    }

    if (currentEntry.state === 'exiting') {
      if (nowMs - currentEntry.transitionStartedAtMs < WORKBENCH_SCENE_EXIT_DURATION_MS) {
        nextPresentation[experienceId] = currentEntry;
      }
      continue;
    }

    nextPresentation[experienceId] = {
      state: 'exiting',
      transitionStartedAtMs: nowMs,
    };
  }

  return nextPresentation;
}
