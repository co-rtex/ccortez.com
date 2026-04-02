import { afterEach, describe, expect, it } from 'vitest';

import { useGameStore } from './gameStore';

function resetGameStore(): void {
  useGameStore.setState({
    playerPosition: { x: 0, y: 0.8, z: 18 },
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
  });
}

describe('game store camera state', () => {
  afterEach(() => {
    resetGameStore();
  });

  it('enters inspect mode when a workbench panel opens and exits back to follow mode on close', () => {
    resetGameStore();

    useGameStore.getState().openWorkbenchPanel('bench-1');

    expect(useGameStore.getState().cameraMode).toBe('workbench-inspect');
    expect(useGameStore.getState().panelWorkbenchId).toBe('bench-1');
    expect(useGameStore.getState().inspectedWorkbenchId).toBe('bench-1');

    useGameStore.getState().closeWorkbenchPanel();

    expect(useGameStore.getState().cameraMode).toBe('follow');
    expect(useGameStore.getState().panelWorkbenchId).toBeNull();
    expect(useGameStore.getState().inspectedWorkbenchId).toBeNull();
  });

  it('returns to editor focus when a focused editor target was active before inspect mode', () => {
    resetGameStore();

    useGameStore.getState().setEditorCameraTarget({ x: 4, y: 1, z: -8 });
    useGameStore.getState().openWorkbenchPanel('bench-2');
    useGameStore.getState().closeWorkbenchPanel();

    expect(useGameStore.getState().cameraMode).toBe('editor-focus');
    expect(useGameStore.getState().editorCameraTarget).toEqual({ x: 4, y: 1, z: -8 });
  });

  it('switches seated mode to the seated camera and restores follow mode on exit', () => {
    resetGameStore();

    useGameStore.getState().enterSeatedMode('lake-bench');
    expect(useGameStore.getState().cameraMode).toBe('seated');
    expect(useGameStore.getState().panelWorkbenchId).toBeNull();

    useGameStore.getState().exitSeatedMode();
    expect(useGameStore.getState().cameraMode).toBe('follow');
    expect(useGameStore.getState().playerMode).toBe('exploring');
  });
});
