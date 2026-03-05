import { distanceXZ } from './math';

import type { ExperienceManifest, WorldAnchor } from '../types/experience';

export function getNearestExperienceInRange(
  manifests: ExperienceManifest[],
  playerPosition: WorldAnchor,
): ExperienceManifest | null {
  let closest: ExperienceManifest | null = null;
  let closestDistance = Number.POSITIVE_INFINITY;

  for (const manifest of manifests) {
    const distance = distanceXZ(manifest.worldAnchor, playerPosition);
    if (distance <= manifest.triggerRadius && distance < closestDistance) {
      closest = manifest;
      closestDistance = distance;
    }
  }

  return closest;
}
