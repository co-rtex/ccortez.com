import { getLoadedSceneComponent } from '../content/runtime';
import { useGameStore } from '../state/gameStore';

import type { WorkbenchRuntimeRecord } from '../workbench/runtime';

interface LoadedExperienceScenesProps {
  workbenches: WorkbenchRuntimeRecord[];
}

export function LoadedExperienceScenes({ workbenches }: LoadedExperienceScenesProps) {
  const loadedSceneIds = useGameStore((state) => state.loadedSceneIds);
  const focusedWorkbenchId = useGameStore((state) => state.panelWorkbenchId);

  return (
    <>
      {loadedSceneIds.map((experienceId) => {
        const sceneComponent = getLoadedSceneComponent(experienceId);
        const workbench = workbenches.find(
          (entry) => entry.linkedExperience?.manifest.id === experienceId,
        );
        if (!sceneComponent || !workbench) {
          return null;
        }

        const SceneComponent = sceneComponent;

        return (
          <SceneComponent
            key={experienceId}
            anchor={workbench.placement.anchor}
            isFocused={focusedWorkbenchId === workbench.definition.id}
          />
        );
      })}
    </>
  );
}
