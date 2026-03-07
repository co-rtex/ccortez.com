import { useEffect, useMemo, useState } from 'react';

import { bootstrapExperienceRegistry } from '../content/loader';
import { getAllExperiences } from '../content/registry';
import { OverworldScene } from '../scenes/OverworldScene';
import { useGameStore } from '../state/gameStore';
import { WorkbenchEditorOverlay } from '../ui/WorkbenchEditorOverlay';
import { WorkbenchPanel } from '../ui/WorkbenchPanel';
import { WorkbenchPrompt } from '../ui/WorkbenchPrompt';
import { CollisionFeedbackOverlay } from '../ui/CollisionFeedbackOverlay';
import { createDraftWorkbenchDefinition, duplicateWorkbenchDefinition } from '../workbench/editor';
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
  const [selectedWorkbenchId, setSelectedWorkbenchId] = useState<string | null>(
    WORKBENCH_LAYOUT[0]?.id ?? null,
  );
  const playerMode = useGameStore((state) => state.playerMode);
  const nearbyRestSpotId = useGameStore((state) => state.nearbyRestSpotId);
  const nearbyWorkbenchId = useGameStore((state) => state.nearbyWorkbenchId);
  const enterSeatedMode = useGameStore((state) => state.enterSeatedMode);
  const exitSeatedMode = useGameStore((state) => state.exitSeatedMode);
  const setNearbyWorkbenchId = useGameStore((state) => state.setNearbyWorkbenchId);
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
    const onKeyDown = (event: KeyboardEvent): void => {
      if (import.meta.env.DEV && event.ctrlKey && event.shiftKey && event.code === 'KeyW') {
        event.preventDefault();
        setWorkbenchEditorEnabled((current) => !current);
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
    nearbyWorkbenchId,
    nearbyRestSpotId,
    playerMode,
    closeWorkbenchPanel,
    enterSeatedMode,
    exitSeatedMode,
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

  function updateWorkbench(
    workbenchId: string,
    updater: (current: WorkbenchDefinition) => WorkbenchDefinition,
  ): void {
    setWorkbenchDefinitions((current) =>
      current.map((definition) => (definition.id === workbenchId ? updater(definition) : definition)),
    );
  }

  function addWorkbench(): void {
    setWorkbenchDefinitions((current) => {
      const next = createDraftWorkbenchDefinition(new Set(current.map((definition) => definition.id)));
      setSelectedWorkbenchId(next.id);
      return [...current, next];
    });
  }

  function duplicateWorkbench(workbenchId: string): void {
    setWorkbenchDefinitions((current) => {
      const source = current.find((definition) => definition.id === workbenchId);
      if (!source) {
        return current;
      }

      const next = duplicateWorkbenchDefinition(source, new Set(current.map((definition) => definition.id)));
      setSelectedWorkbenchId(next.id);
      return [...current, next];
    });
  }

  function deleteWorkbench(workbenchId: string): void {
    setWorkbenchDefinitions((current) => current.filter((definition) => definition.id !== workbenchId));
    if (selectedWorkbenchId === workbenchId) {
      setSelectedWorkbenchId(null);
    }
    if (panelWorkbenchId === workbenchId) {
      closeWorkbenchPanel();
    }
  }

  return (
    <main className={appClassName}>
      <OverworldScene
        workbenches={visibleWorkbenchRecords}
        editorEnabled={workbenchEditorEnabled}
        selectedWorkbenchId={activeSelectedWorkbenchId}
        onWorkbenchOpen={(workbenchId) => openWorkbenchPanel(workbenchId)}
        onWorkbenchSelect={setSelectedWorkbenchId}
      />
      <CollisionFeedbackOverlay />

      <div className="hud-layer">
        <WorkbenchPrompt workbenches={visibleWorkbenchRecords} />
        {mobileLiteMode ? (
          <div className="mobile-lite-banner">
            Mobile-lite mode: tap landmarks for details. Desktop enables full WASD traversal.
          </div>
        ) : null}
      </div>

      <WorkbenchPanel workbenches={visibleWorkbenchRecords} />
      {workbenchEditorEnabled ? (
        <WorkbenchEditorOverlay
          definitions={workbenchDefinitions}
          records={allWorkbenchRecords}
          experiences={bootstrapState.experiences}
          selectedWorkbenchId={activeSelectedWorkbenchId}
          exportSource={serializedWorkbenchLayout}
          onSelectWorkbench={setSelectedWorkbenchId}
          onAddWorkbench={addWorkbench}
          onDuplicateWorkbench={duplicateWorkbench}
          onDeleteWorkbench={deleteWorkbench}
          onUpdateWorkbench={updateWorkbench}
        />
      ) : null}
    </main>
  );
}
