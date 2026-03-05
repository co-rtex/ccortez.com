import { getExperienceById } from '../content/registry';
import { getLoadedSceneComponent } from '../content/runtime';
import { useGameStore } from '../state/gameStore';

export function LoadedExperienceScenes() {
  const loadedSceneIds = useGameStore((state) => state.loadedSceneIds);
  const focusedExperienceId = useGameStore((state) => state.panelExperienceId);

  return (
    <>
      {loadedSceneIds.map((experienceId) => {
        const sceneComponent = getLoadedSceneComponent(experienceId);
        const experience = getExperienceById(experienceId);
        if (!sceneComponent || !experience) {
          return null;
        }

        const SceneComponent = sceneComponent;

        return (
          <SceneComponent
            key={experienceId}
            anchor={experience.manifest.worldAnchor}
            isFocused={focusedExperienceId === experienceId}
          />
        );
      })}
    </>
  );
}
