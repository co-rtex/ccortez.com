import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { bootstrapExperienceRegistry } from '../content/loader';
import { getAllExperiences } from '../content/registry';
import { OverworldScene } from '../scenes/OverworldScene';
import { useGameStore } from '../state/gameStore';
import { WorkbenchEditorOverlay } from '../ui/WorkbenchEditorOverlay';
import { WorkbenchPanel } from '../ui/WorkbenchPanel';
import { WorkbenchPrompt } from '../ui/WorkbenchPrompt';
import { CollisionFeedbackOverlay } from '../ui/CollisionFeedbackOverlay';
import { RecruiterNavigatorHUD } from '../ui/RecruiterNavigatorHUD';
import {
  createDraftWorkbenchDefinition,
  duplicateWorkbenchDefinition,
  convertWorkbenchToFreeformAtCurrentPose,
  isWorkbenchEditorTypingTarget,
  resetWorkbenchPlacementToDistrictSeed,
  snapWorkbenchToDistrictCorridor,
  type WorkbenchEditorTransformMode,
} from '../workbench/editor';
import { buildWorkbenchRuntime, serializeWorkbenchLayout } from '../workbench/runtime';

import type { ExperienceRecord } from '../types/experience';
import type { WorkbenchDefinition } from '../types/workbench';

import { WORKBENCH_DISTRICTS, WORKBENCH_LAYOUT } from '../../content/workbenches/layout';

interface BootstrapState {
  experiences: ExperienceRecord[];
  error: string | null;
}

function detectMobileLiteMode(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  return window.innerWidth < 900 || window.matchMedia('(pointer: coarse)').matches;
}

function detectWorkbenchEditorMode(): boolean {
  if (typeof window === 'undefined' || !import.meta.env.DEV) {
    return false;
  }

  return new URLSearchParams(window.location.search).get('workbenchEditor') === '1';
}

export default function App() {
  const [bootstrapState] = useState<BootstrapState>(() => {
    try {
      bootstrapExperienceRegistry();
      return {
        experiences: getAllExperiences(),
        error: null,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to bootstrap experiences.';
      return {
        experiences: [],
        error: message,
      };
    }
  });

  const [mobileLiteMode, setMobileLiteMode] = useState<boolean>(detectMobileLiteMode);
  const [workbenchDefinitions, setWorkbenchDefinitions] = useState<WorkbenchDefinition[]>(WORKBENCH_LAYOUT);
  const [workbenchEditorEnabled, setWorkbenchEditorEnabled] = useState<boolean>(detectWorkbenchEditorMode);
  const [editorTransformMode, setEditorTransformMode] = useState<WorkbenchEditorTransformMode>('move');
  const [selectedWorkbenchId, setSelectedWorkbenchId] = useState<string | null>(
    WORKBENCH_LAYOUT[0]?.id ?? null,
  );
  const focusedWorkbenchIdRef = useRef<string | null>(null);
  const playerMode = useGameStore((state) => state.playerMode);
  const playerPosition = useGameStore((state) => state.playerPosition);
  const nearbyRestSpotId = useGameStore((state) => state.nearbyRestSpotId);
  const nearbyWorkbenchId = useGameStore((state) => state.nearbyWorkbenchId);
  const editorCameraTarget = useGameStore((state) => state.editorCameraTarget);
  const enterSeatedMode = useGameStore((state) => state.enterSeatedMode);
  const exitSeatedMode = useGameStore((state) => state.exitSeatedMode);
  const setNearbyWorkbenchId = useGameStore((state) => state.setNearbyWorkbenchId);
  const setEditorCameraTarget = useGameStore((state) => state.setEditorCameraTarget);
  const clearEditorCameraTarget = useGameStore((state) => state.clearEditorCameraTarget);
  const panelWorkbenchId = useGameStore((state) => state.panelWorkbenchId);
  const openWorkbenchPanel = useGameStore((state) => state.openWorkbenchPanel);
  const closeWorkbenchPanel = useGameStore((state) => state.closeWorkbenchPanel);

  const allWorkbenchRecords = useMemo(
    () => buildWorkbenchRuntime(workbenchDefinitions, WORKBENCH_DISTRICTS, bootstrapState.experiences),
    [bootstrapState.experiences, workbenchDefinitions],
  );
  const visibleWorkbenchRecords = useMemo(
    () =>
      allWorkbenchRecords.filter((record) =>
        workbenchEditorEnabled ? true : record.definition.visibility === 'published',
      ),
    [allWorkbenchRecords, workbenchEditorEnabled],
  );
  const serializedWorkbenchLayout = useMemo(
    () => serializeWorkbenchLayout(workbenchDefinitions),
    [workbenchDefinitions],
  );
  const activeSelectedWorkbenchId = useMemo(() => {
    if (selectedWorkbenchId && workbenchDefinitions.some((definition) => definition.id === selectedWorkbenchId)) {
      return selectedWorkbenchId;
    }

    return workbenchDefinitions[0]?.id ?? null;
  }, [selectedWorkbenchId, workbenchDefinitions]);
  const activeSelectedWorkbenchRecord = useMemo(
    () => allWorkbenchRecords.find((record) => record.definition.id === activeSelectedWorkbenchId) ?? null,
    [activeSelectedWorkbenchId, allWorkbenchRecords],
  );

  function updateWorkbench(
    workbenchId: string,
    updater: (current: WorkbenchDefinition) => WorkbenchDefinition,
  ): void {
    setWorkbenchDefinitions((current) =>
      current.map((definition) => (definition.id === workbenchId ? updater(definition) : definition)),
    );
  }

  useEffect(() => {
    const updateMode = (): void => setMobileLiteMode(detectMobileLiteMode());
    updateMode();
    window.addEventListener('resize', updateMode);
    return () => {
      window.removeEventListener('resize', updateMode);
    };
  }, []);

  useEffect(() => {
    const visibleIds = new Set(visibleWorkbenchRecords.map((record) => record.definition.id));

    if (panelWorkbenchId && !visibleIds.has(panelWorkbenchId)) {
      closeWorkbenchPanel();
    }

    if (nearbyWorkbenchId && !visibleIds.has(nearbyWorkbenchId)) {
      setNearbyWorkbenchId(null);
    }
  }, [
    closeWorkbenchPanel,
    nearbyWorkbenchId,
    panelWorkbenchId,
    setNearbyWorkbenchId,
    visibleWorkbenchRecords,
  ]);

  useEffect(() => {
    if (!workbenchEditorEnabled) {
      focusedWorkbenchIdRef.current = null;
      clearEditorCameraTarget();
    }
  }, [clearEditorCameraTarget, workbenchEditorEnabled]);

  useEffect(() => {
    const focusedWorkbenchId = focusedWorkbenchIdRef.current;
    if (!focusedWorkbenchId) {
      return;
    }

    const focusedRecord =
      allWorkbenchRecords.find((record) => record.definition.id === focusedWorkbenchId) ?? null;

    if (!focusedRecord) {
      focusedWorkbenchIdRef.current = null;
      clearEditorCameraTarget();
      return;
    }

    setEditorCameraTarget(focusedRecord.placement.anchor);
  }, [
    allWorkbenchRecords,
    clearEditorCameraTarget,
    setEditorCameraTarget,
  ]);

  useEffect(() => {
    if (focusedWorkbenchIdRef.current && editorCameraTarget === null) {
      focusedWorkbenchIdRef.current = null;
    }
  }, [editorCameraTarget]);

  const clearWorkbenchFocus = useCallback((): void => {
    focusedWorkbenchIdRef.current = null;
    clearEditorCameraTarget();
  }, [clearEditorCameraTarget]);

  const focusSelectedWorkbench = useCallback((): void => {
    if (!activeSelectedWorkbenchId || !activeSelectedWorkbenchRecord) {
      return;
    }

    focusedWorkbenchIdRef.current = activeSelectedWorkbenchId;
    setEditorCameraTarget(activeSelectedWorkbenchRecord.placement.anchor);
  }, [activeSelectedWorkbenchId, activeSelectedWorkbenchRecord, setEditorCameraTarget]);

  const selectWorkbench = useCallback((workbenchId: string): void => {
    if (focusedWorkbenchIdRef.current && focusedWorkbenchIdRef.current !== workbenchId) {
      clearWorkbenchFocus();
    }

    setSelectedWorkbenchId(workbenchId);
  }, [clearWorkbenchFocus]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent): void => {
      const typingTarget = isWorkbenchEditorTypingTarget(event.target);

      if (import.meta.env.DEV && event.ctrlKey && event.shiftKey && event.code === 'KeyW') {
        event.preventDefault();
        setWorkbenchEditorEnabled((current) => !current);
        return;
      }

      if (workbenchEditorEnabled && !typingTarget) {
        if (event.code === 'KeyG') {
          event.preventDefault();
          setEditorTransformMode('move');
          return;
        }

        if (event.code === 'KeyR') {
          event.preventDefault();
          setEditorTransformMode('rotate');
          return;
        }

        if (event.code === 'KeyT') {
          event.preventDefault();
          setEditorTransformMode('height');
          return;
        }

        if (event.code === 'KeyC') {
          event.preventDefault();
          if (activeSelectedWorkbenchId) {
            updateWorkbench(activeSelectedWorkbenchId, snapWorkbenchToDistrictCorridor);
            setEditorTransformMode('move');
          }
          return;
        }

        if (event.code === 'KeyF') {
          event.preventDefault();
          focusSelectedWorkbench();
          return;
        }

        if (event.code === 'KeyE' && activeSelectedWorkbenchId && playerMode === 'exploring') {
          event.preventDefault();
          openWorkbenchPanel(activeSelectedWorkbenchId);
          return;
        }
      }

      if (typingTarget) {
        return;
      }

      if (event.repeat && (event.code === 'Escape' || event.code === 'KeyE')) {
        return;
      }

      if (event.code === 'Escape') {
        if (playerMode === 'seated') {
          exitSeatedMode();
          return;
        }

        closeWorkbenchPanel();
        return;
      }

      if (event.code === 'KeyE') {
        if (playerMode === 'seated') {
          exitSeatedMode();
          return;
        }

        if (nearbyRestSpotId) {
          enterSeatedMode(nearbyRestSpotId);
          closeWorkbenchPanel();
          return;
        }

        if (nearbyWorkbenchId) {
          openWorkbenchPanel(nearbyWorkbenchId);
        }
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [
    activeSelectedWorkbenchId,
    nearbyWorkbenchId,
    nearbyRestSpotId,
    playerMode,
    workbenchEditorEnabled,
    closeWorkbenchPanel,
    enterSeatedMode,
    exitSeatedMode,
    focusSelectedWorkbench,
    openWorkbenchPanel,
  ]);

  const appClassName = useMemo(
    () => `app-shell ${mobileLiteMode ? 'app-shell--mobile-lite' : ''}`,
    [mobileLiteMode],
  );

  if (bootstrapState.error) {
    return (
      <main className={appClassName}>
        <section className="bootstrap-error">
          <h1>Backbone Failed to Load</h1>
          <p>{bootstrapState.error}</p>
          <p>Fix content manifests and restart the app.</p>
        </section>
      </main>
    );
  }

  function addWorkbench(): void {
    const seedDistrict =
      workbenchDefinitions.find((definition) => definition.id === activeSelectedWorkbenchId)?.district ??
      'projects';
    const next = createDraftWorkbenchDefinition(
      new Set(workbenchDefinitions.map((definition) => definition.id)),
      seedDistrict,
    );

    clearWorkbenchFocus();
    setSelectedWorkbenchId(next.id);
    setWorkbenchDefinitions((current) => [...current, next]);
  }

  function duplicateWorkbench(workbenchId: string): void {
    const source = workbenchDefinitions.find((definition) => definition.id === workbenchId);
    if (!source) {
      return;
    }

    const next = duplicateWorkbenchDefinition(
      source,
      new Set(workbenchDefinitions.map((definition) => definition.id)),
    );

    clearWorkbenchFocus();
    setSelectedWorkbenchId(next.id);
    setWorkbenchDefinitions((current) => [...current, next]);
  }

  function deleteWorkbench(workbenchId: string): void {
    setWorkbenchDefinitions((current) => current.filter((definition) => definition.id !== workbenchId));
    if (selectedWorkbenchId === workbenchId) {
      setSelectedWorkbenchId(null);
    }
    if (focusedWorkbenchIdRef.current === workbenchId) {
      clearWorkbenchFocus();
    }
    if (panelWorkbenchId === workbenchId) {
      closeWorkbenchPanel();
    }
  }

  function convertSelectedWorkbenchToFreeform(): void {
    if (!activeSelectedWorkbenchId) {
      return;
    }

    updateWorkbench(activeSelectedWorkbenchId, convertWorkbenchToFreeformAtCurrentPose);
    setEditorTransformMode('move');
  }

  function snapSelectedWorkbench(): void {
    if (!activeSelectedWorkbenchId) {
      return;
    }

    updateWorkbench(activeSelectedWorkbenchId, snapWorkbenchToDistrictCorridor);
    setEditorTransformMode('move');
  }

  function resetSelectedWorkbench(): void {
    if (!activeSelectedWorkbenchId) {
      return;
    }

    updateWorkbench(activeSelectedWorkbenchId, resetWorkbenchPlacementToDistrictSeed);
    setEditorTransformMode('move');
  }

  function openSelectedWorkbench(): void {
    if (!activeSelectedWorkbenchId) {
      return;
    }

    openWorkbenchPanel(activeSelectedWorkbenchId);
  }

  return (
    <main className={appClassName}>
      <OverworldScene
        workbenches={visibleWorkbenchRecords}
        editorEnabled={workbenchEditorEnabled}
        editorTransformMode={editorTransformMode}
        selectedWorkbenchId={activeSelectedWorkbenchId}
        onWorkbenchOpen={(workbenchId) => openWorkbenchPanel(workbenchId)}
        onWorkbenchSelect={selectWorkbench}
        onWorkbenchUpdate={updateWorkbench}
      />
      <CollisionFeedbackOverlay />

      <div className="hud-layer">
        {!workbenchEditorEnabled ? (
          <RecruiterNavigatorHUD
            workbenches={visibleWorkbenchRecords}
            playerPosition={playerPosition}
            activeWorkbenchId={panelWorkbenchId}
            nearbyWorkbenchId={nearbyWorkbenchId}
            mobileLiteMode={mobileLiteMode}
            onWorkbenchOpen={openWorkbenchPanel}
          />
        ) : null}

        <div className="hud-layer__footer">
          <WorkbenchPrompt
            workbenches={visibleWorkbenchRecords}
            editorEnabled={workbenchEditorEnabled}
            mobileLiteMode={mobileLiteMode}
          />
          {mobileLiteMode ? (
            <div className="mobile-lite-banner">
              Mobile-lite mode: tap landmarks for details. The recruiter guide collapses into a quick jump list.
            </div>
          ) : null}
        </div>
      </div>

      <WorkbenchPanel workbenches={visibleWorkbenchRecords} />
      {workbenchEditorEnabled ? (
        <WorkbenchEditorOverlay
          definitions={workbenchDefinitions}
          records={allWorkbenchRecords}
          experiences={bootstrapState.experiences}
          selectedWorkbenchId={activeSelectedWorkbenchId}
          transformMode={editorTransformMode}
          exportSource={serializedWorkbenchLayout}
          onSelectWorkbench={selectWorkbench}
          onAddWorkbench={addWorkbench}
          onDuplicateWorkbench={duplicateWorkbench}
          onDeleteWorkbench={deleteWorkbench}
          onUpdateWorkbench={updateWorkbench}
          onTransformModeChange={setEditorTransformMode}
          onOpenSelectedWorkbench={openSelectedWorkbench}
          onConvertSelectedToFreeform={convertSelectedWorkbenchToFreeform}
          onSnapSelected={snapSelectedWorkbench}
          onResetSelected={resetSelectedWorkbench}
          onFocusSelected={focusSelectedWorkbench}
        />
      ) : null}
    </main>
  );
}
