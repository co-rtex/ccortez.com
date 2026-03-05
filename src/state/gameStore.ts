import { create } from 'zustand';

import type { WorldAnchor } from '../types/experience';
import type { CollisionFeedbackReason } from '../types/collisionFeedback';

interface CollisionFeedbackEvent {
  id: number;
  reason: CollisionFeedbackReason;
  timestampMs: number;
}

export type PlayerMode = 'exploring' | 'seated';

interface GameStore {
  playerPosition: WorldAnchor;
  playerMode: PlayerMode;
  nearbyRestSpotId: string | null;
  activeRestSpotId: string | null;
  nearbyExperienceId: string | null;
  panelExperienceId: string | null;
  loadedSceneIds: string[];
  collisionFeedbackEvent: CollisionFeedbackEvent | null;
  setPlayerPosition: (position: WorldAnchor) => void;
  setNearbyRestSpotId: (id: string | null) => void;
  enterSeatedMode: (restSpotId: string) => void;
  exitSeatedMode: () => void;
  setNearbyExperienceId: (id: string | null) => void;
  openExperiencePanel: (id: string) => void;
  closeExperiencePanel: () => void;
  setLoadedSceneIds: (ids: string[]) => void;
  emitCollisionFeedback: (reason: CollisionFeedbackReason) => void;
}

const initialPlayerPosition: WorldAnchor = {
  x: 0,
  y: 0.8,
  z: 18,
};

function arraysEqual(left: string[], right: string[]): boolean {
  if (left.length !== right.length) {
    return false;
  }

  return left.every((value, index) => value === right[index]);
}

export const useGameStore = create<GameStore>((set) => ({
  playerPosition: initialPlayerPosition,
  playerMode: 'exploring',
  nearbyRestSpotId: null,
  activeRestSpotId: null,
  nearbyExperienceId: null,
  panelExperienceId: null,
  loadedSceneIds: [],
  collisionFeedbackEvent: null,
  setPlayerPosition: (position) => {
    set((state) => {
      if (
        state.playerPosition.x === position.x &&
        state.playerPosition.y === position.y &&
        state.playerPosition.z === position.z
      ) {
        return state;
      }

      return { playerPosition: position };
    });
  },
  setNearbyRestSpotId: (id) => {
    set((state) => (state.nearbyRestSpotId === id ? state : { nearbyRestSpotId: id }));
  },
  enterSeatedMode: (restSpotId) => {
    set((state) => {
      if (state.playerMode === 'seated' && state.activeRestSpotId === restSpotId) {
        return state;
      }

      return {
        playerMode: 'seated',
        activeRestSpotId: restSpotId,
        nearbyRestSpotId: restSpotId,
      };
    });
  },
  exitSeatedMode: () => {
    set((state) => {
      if (state.playerMode !== 'seated') {
        return state;
      }

      return {
        playerMode: 'exploring',
        activeRestSpotId: null,
      };
    });
  },
  setNearbyExperienceId: (id) => {
    set((state) => (state.nearbyExperienceId === id ? state : { nearbyExperienceId: id }));
  },
  openExperiencePanel: (id) => {
    set((state) => (state.panelExperienceId === id ? state : { panelExperienceId: id }));
  },
  closeExperiencePanel: () => {
    set((state) => (state.panelExperienceId === null ? state : { panelExperienceId: null }));
  },
  setLoadedSceneIds: (ids) => {
    const nextIds = [...ids].sort();
    set((state) => (arraysEqual(state.loadedSceneIds, nextIds) ? state : { loadedSceneIds: nextIds }));
  },
  emitCollisionFeedback: (reason) => {
    set((state) => ({
      collisionFeedbackEvent: {
        id: (state.collisionFeedbackEvent?.id ?? 0) + 1,
        reason,
        timestampMs: performance.now(),
      },
    }));
  },
}));
