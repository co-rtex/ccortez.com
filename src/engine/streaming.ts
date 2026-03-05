import { distanceXZ } from './math';

import type { ExperienceManifest, WorldAnchor } from '../types/experience';

export interface StreamingActions {
  toLoad: string[];
  toUnload: string[];
}

export function computeStreamingActions(
  manifests: ExperienceManifest[],
  playerPosition: WorldAnchor,
  loadedSceneIds: Set<string>,
): StreamingActions {
  const toLoad: string[] = [];
  const toUnload: string[] = [];

  for (const manifest of manifests) {
    if (!manifest.sceneModuleRef) {
      continue;
    }

    const distance = distanceXZ(manifest.worldAnchor, playerPosition);
    const isLoaded = loadedSceneIds.has(manifest.id);

    if (!isLoaded && distance <= manifest.loadDistances.preload) {
      toLoad.push(manifest.id);
      continue;
    }

    if (isLoaded && distance > manifest.loadDistances.unload) {
      toUnload.push(manifest.id);
    }
  }

  return { toLoad, toUnload };
}
