import { useFrame } from '@react-three/fiber';

import { getNearestRestSpotInRange } from '../engine/restSpot';
import { useGameStore } from '../state/gameStore';

import { SCENIC_REST_SPOTS } from './restSpots';

export function RestSpotDirector(): null {
  useFrame(() => {
    const state = useGameStore.getState();

    if (state.playerMode === 'seated') {
      if (state.nearbyRestSpotId !== state.activeRestSpotId) {
        state.setNearbyRestSpotId(state.activeRestSpotId);
      }
      return;
    }

    const nearest = getNearestRestSpotInRange(SCENIC_REST_SPOTS, state.playerPosition);
    const nearestId = nearest ? nearest.id : null;
    if (nearestId !== state.nearbyRestSpotId) {
      state.setNearbyRestSpotId(nearestId);
    }
  });

  return null;
}
