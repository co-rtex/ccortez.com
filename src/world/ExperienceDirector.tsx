import { useFrame } from '@react-three/fiber';
import { useMemo } from 'react';

import { getNearestExperienceInRange } from '../engine/interaction';
import { computeStreamingActions } from '../engine/streaming';
import { useGameStore } from '../state/gameStore';
import { getLoadedSceneIds, loadExperienceScene, unloadExperienceScene } from '../content/runtime';

import type { ExperienceRecord } from '../types/experience';

interface ExperienceDirectorProps {
  experiences: ExperienceRecord[];
}

export function ExperienceDirector({ experiences }: ExperienceDirectorProps): null {
  const manifests = useMemo(() => experiences.map((experience) => experience.manifest), [experiences]);

  useFrame(() => {
    const state = useGameStore.getState();
    const nearest = getNearestExperienceInRange(manifests, state.playerPosition);
    const nearestId = nearest ? nearest.id : null;

    if (nearestId !== state.nearbyExperienceId) {
      state.setNearbyExperienceId(nearestId);
    }

    const loadedIds = new Set(state.loadedSceneIds);
    const actions = computeStreamingActions(manifests, state.playerPosition, loadedIds);

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
