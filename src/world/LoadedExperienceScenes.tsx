import { getLoadedSceneComponent } from '../content/runtime';
import { useGameStore } from '../state/gameStore';

import type { WorkbenchRuntimeRecord } from '../workbench/runtime';

interface LoadedExperienceScenesProps {
  workbenches: WorkbenchRuntimeRecord[];
}

export function LoadedExperienceScenes({ workbenches }: LoadedExperienceScenesProps) {
  const scenePresentationById = useGameStore((state) => state.scenePresentationById);
  const focusedWorkbenchId = useGameStore((state) => state.inspectedWorkbenchId ?? state.panelWorkbenchId);
  const nearbyWorkbenchId = useGameStore((state) => state.nearbyWorkbenchId);

  return (
    <>
      {workbenches.map((workbench) => {
        const experienceId = workbench.linkedExperience?.manifest.id;
        if (!experienceId) {
          return null;
        }

        const presentation = scenePresentationById[experienceId];
        if (!presentation) {
          return null;
        }

        const sceneComponent = getLoadedSceneComponent(experienceId);
        if (!sceneComponent) {
          return null;
        }

        const SceneComponent = sceneComponent;

        return (
          <SceneComponent
            key={experienceId}
            anchor={workbench.placement.anchor}
            rotationY={workbench.placement.rotationY}
            isNearby={nearbyWorkbenchId === workbench.definition.id}
            isFocused={focusedWorkbenchId === workbench.definition.id}
            presentationState={presentation.state}
          />
        );
      })}
    </>
  );
}
