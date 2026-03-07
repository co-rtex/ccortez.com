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
  nearbyWorkbenchId: string | null;
  panelWorkbenchId: string | null;
  loadedSceneIds: string[];
  collisionFeedbackEvent: CollisionFeedbackEvent | null;
  setPlayerPosition: (position: WorldAnchor) => void;
  setNearbyRestSpotId: (id: string | null) => void;
  enterSeatedMode: (restSpotId: string) => void;
  exitSeatedMode: () => void;
  setNearbyWorkbenchId: (id: string | null) => void;
  openWorkbenchPanel: (id: string) => void;
  closeWorkbenchPanel: () => void;
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
  nearbyWorkbenchId: null,
  panelWorkbenchId: null,
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
  setNearbyWorkbenchId: (id) => {
    set((state) => (state.nearbyWorkbenchId === id ? state : { nearbyWorkbenchId: id }));
  },
  openWorkbenchPanel: (id) => {
    set((state) => (state.panelWorkbenchId === id ? state : { panelWorkbenchId: id }));
  },
  closeWorkbenchPanel: () => {
    set((state) => (state.panelWorkbenchId === null ? state : { panelWorkbenchId: null }));
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
