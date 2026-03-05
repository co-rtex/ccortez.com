import { distanceXZ } from './math';

import type { WorldAnchor } from '../types/experience';
import type { ScenicRestSpotDefinition } from '../world/restSpots';

export function getNearestRestSpotInRange(
  restSpots: ScenicRestSpotDefinition[],
  playerPosition: WorldAnchor,
): ScenicRestSpotDefinition | null {
  let closest: ScenicRestSpotDefinition | null = null;
  let closestDistance = Number.POSITIVE_INFINITY;

  for (const restSpot of restSpots) {
    const distance = distanceXZ(
      { x: restSpot.seat.x, y: playerPosition.y, z: restSpot.seat.z },
      playerPosition,
    );
    if (distance <= restSpot.interactionRadius && distance < closestDistance) {
      closest = restSpot;
      closestDistance = distance;
    }
  }

  return closest;
}
