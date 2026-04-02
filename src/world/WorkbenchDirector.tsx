import { useFrame } from '@react-three/fiber';

import { getLoadedSceneIds, loadExperienceScene, unloadExperienceScene } from '../content/runtime';
import { useGameStore } from '../state/gameStore';
import { getNearestWorkbenchInRange } from '../workbench/interaction';
import { computeWorkbenchScenePresentation } from '../workbench/presentation';
import { computeWorkbenchStreamingActions } from '../workbench/streaming';

import type { WorkbenchRuntimeRecord } from '../workbench/runtime';

interface WorkbenchDirectorProps {
  workbenches: WorkbenchRuntimeRecord[];
}

export function WorkbenchDirector({ workbenches }: WorkbenchDirectorProps): null {
  useFrame(() => {
    const state = useGameStore.getState();
    const nearest = getNearestWorkbenchInRange(workbenches, state.playerPosition);
    const nearestId = nearest ? nearest.definition.id : null;

    if (nearestId !== state.nearbyWorkbenchId) {
      state.setNearbyWorkbenchId(nearestId);
    }

    const loadedIds = new Set(state.loadedSceneIds);
    const nextPresentation = computeWorkbenchScenePresentation(
      workbenches,
      state.playerPosition,
      loadedIds,
      state.scenePresentationById,
      state.inspectedWorkbenchId ?? state.panelWorkbenchId,
      performance.now(),
    );

    state.setScenePresentationById(nextPresentation);

    const actions = computeWorkbenchStreamingActions(
      workbenches,
      state.playerPosition,
      loadedIds,
      state.inspectedWorkbenchId,
      new Set(Object.keys(nextPresentation)),
    );

    if (actions.toUnload.length > 0) {
      for (const id of actions.toUnload) {
        unloadExperienceScene(id);
      }
      state.setLoadedSceneIds(getLoadedSceneIds());
    }

    if (actions.toLoad.length > 0) {
      for (const id of actions.toLoad) {
        void loadExperienceScene(id).then(() => {
          useGameStore.getState().setLoadedSceneIds(getLoadedSceneIds());
        });
      }
    }
  });

  return null;
}
