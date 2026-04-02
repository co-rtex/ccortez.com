import { create } from 'zustand';

import type { WorldAnchor } from '../types/experience';
import type { CollisionFeedbackReason } from '../types/collisionFeedback';
import type { WorkbenchScenePresentationMap } from '../workbench/presentation';
import { scenePresentationMapsEqual } from '../workbench/presentation';

interface CollisionFeedbackEvent {
  id: number;
  reason: CollisionFeedbackReason;
  timestampMs: number;
}

export type PlayerMode = 'exploring' | 'seated';
export type CameraMode = 'follow' | 'seated' | 'editor-focus' | 'workbench-inspect';

interface GameStore {
  playerPosition: WorldAnchor;
  playerMode: PlayerMode;
  cameraMode: CameraMode;
  editorCameraTarget: WorldAnchor | null;
  inspectedWorkbenchId: string | null;
  nearbyRestSpotId: string | null;
  activeRestSpotId: string | null;
  nearbyWorkbenchId: string | null;
  panelWorkbenchId: string | null;
  loadedSceneIds: string[];
  scenePresentationById: WorkbenchScenePresentationMap;
  collisionFeedbackEvent: CollisionFeedbackEvent | null;
  setPlayerPosition: (position: WorldAnchor) => void;
  setEditorCameraTarget: (target: WorldAnchor | null) => void;
  clearEditorCameraTarget: () => void;
  setNearbyRestSpotId: (id: string | null) => void;
  enterSeatedMode: (restSpotId: string) => void;
  exitSeatedMode: () => void;
  setNearbyWorkbenchId: (id: string | null) => void;
  openWorkbenchPanel: (id: string) => void;
  closeWorkbenchPanel: () => void;
  setLoadedSceneIds: (ids: string[]) => void;
  setScenePresentationById: (presentation: WorkbenchScenePresentationMap) => void;
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

function resolveFallbackCameraMode(state: {
  playerMode: PlayerMode;
  editorCameraTarget: WorldAnchor | null;
}): CameraMode {
  if (state.playerMode === 'seated') {
    return 'seated';
  }

  if (state.editorCameraTarget) {
    return 'editor-focus';
  }

  return 'follow';
}

export const useGameStore = create<GameStore>((set) => ({
  playerPosition: initialPlayerPosition,
  playerMode: 'exploring',
  cameraMode: 'follow',
  editorCameraTarget: null,
  inspectedWorkbenchId: null,
  nearbyRestSpotId: null,
  activeRestSpotId: null,
  nearbyWorkbenchId: null,
  panelWorkbenchId: null,
  loadedSceneIds: [],
  scenePresentationById: {},
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
  setEditorCameraTarget: (target) => {
    set((state) => {
      if (
        state.editorCameraTarget?.x === target?.x &&
        state.editorCameraTarget?.y === target?.y &&
        state.editorCameraTarget?.z === target?.z
      ) {
        return state;
      }

      if (!target) {
        return {
          editorCameraTarget: null,
          cameraMode:
            state.cameraMode === 'editor-focus'
              ? resolveFallbackCameraMode({ ...state, editorCameraTarget: null })
              : state.cameraMode,
        };
      }

      return {
        editorCameraTarget: target,
        cameraMode: state.cameraMode === 'workbench-inspect' ? state.cameraMode : 'editor-focus',
      };
    });
  },
  clearEditorCameraTarget: () => {
    set((state) => {
      if (state.editorCameraTarget === null) {
        return state;
      }

      return {
        editorCameraTarget: null,
        cameraMode:
          state.cameraMode === 'editor-focus'
            ? resolveFallbackCameraMode({ ...state, editorCameraTarget: null })
            : state.cameraMode,
      };
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
        cameraMode: 'seated',
        activeRestSpotId: restSpotId,
        nearbyRestSpotId: restSpotId,
        inspectedWorkbenchId: null,
        panelWorkbenchId: null,
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
        cameraMode: resolveFallbackCameraMode({ ...state, playerMode: 'exploring' }),
        activeRestSpotId: null,
      };
    });
  },
  setNearbyWorkbenchId: (id) => {
    set((state) => (state.nearbyWorkbenchId === id ? state : { nearbyWorkbenchId: id }));
  },
  openWorkbenchPanel: (id) => {
    set((state) => {
      if (
        state.panelWorkbenchId === id &&
        state.inspectedWorkbenchId === id &&
        state.cameraMode === 'workbench-inspect'
      ) {
        return state;
      }

      return {
        panelWorkbenchId: id,
        inspectedWorkbenchId: id,
        cameraMode: 'workbench-inspect',
      };
    });
  },
  closeWorkbenchPanel: () => {
    set((state) => {
      if (state.panelWorkbenchId === null && state.inspectedWorkbenchId === null) {
        return state;
      }

      return {
        panelWorkbenchId: null,
        inspectedWorkbenchId: null,
        cameraMode:
          state.cameraMode === 'workbench-inspect'
            ? resolveFallbackCameraMode(state)
            : state.cameraMode,
      };
    });
  },
  setLoadedSceneIds: (ids) => {
    const nextIds = [...ids].sort();
    set((state) => (arraysEqual(state.loadedSceneIds, nextIds) ? state : { loadedSceneIds: nextIds }));
  },
  setScenePresentationById: (presentation) => {
    set((state) =>
      scenePresentationMapsEqual(state.scenePresentationById, presentation)
        ? state
        : { scenePresentationById: presentation },
    );
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
