import { useEffect, useMemo, useRef, useState } from 'react';

import { useGameStore } from '../state/gameStore';

import type { ExperienceStoryComponent } from '../types/experience';
import type { WorkbenchRuntimeRecord } from '../workbench/runtime';

interface WorkbenchPanelProps {
  workbenches: WorkbenchRuntimeRecord[];
}

function formatLabel(value: string): string {
  return value
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export function WorkbenchPanel({ workbenches }: WorkbenchPanelProps) {
  const panelWorkbenchId = useGameStore((state) => state.panelWorkbenchId);
  const closeWorkbenchPanel = useGameStore((state) => state.closeWorkbenchPanel);

  const [storyCache, setStoryCache] = useState<Record<string, ExperienceStoryComponent>>({});
  const [storyErrors, setStoryErrors] = useState<Record<string, string>>({});
  const loadingIdsRef = useRef<Set<string>>(new Set());

  const workbench = useMemo(
    () => workbenches.find((entry) => entry.definition.id === panelWorkbenchId),
    [panelWorkbenchId, workbenches],
  );

  useEffect(() => {
    if (!workbench?.linkedExperience) {
      return;
    }

    const experienceId = workbench.linkedExperience.manifest.id;
    if (
      storyCache[experienceId] ||
      storyErrors[experienceId] ||
      loadingIdsRef.current.has(experienceId)
    ) {
      return;
    }

    loadingIdsRef.current.add(experienceId);

    void workbench.linkedExperience
      .loadStory()
      .then((module) => {
        setStoryCache((current) => ({
          ...current,
          [experienceId]: module.default,
        }));
      })
      .catch((error: unknown) => {
        const message = error instanceof Error ? error.message : 'Failed to load workbench story content.';
        setStoryErrors((current) => ({
          ...current,
          [experienceId]: message,
        }));
      })
      .finally(() => {
        loadingIdsRef.current.delete(experienceId);
      });
  }, [storyCache, storyErrors, workbench]);

  const activeStory = workbench?.linkedExperience
    ? storyCache[workbench.linkedExperience.manifest.id]
    : undefined;
  const activeStoryError = workbench?.linkedExperience
    ? storyErrors[workbench.linkedExperience.manifest.id]
    : undefined;
  const ActiveStory = activeStory;

  return (
    <aside className={`experience-panel ${panelWorkbenchId ? 'experience-panel--open' : ''}`}>
      <header className="experience-panel__header">
        <div>
          <p className="experience-panel__eyebrow">Workbench Details</p>
          <h2>{workbench ? workbench.definition.title : 'Select a Workbench'}</h2>
        </div>
        <button
          type="button"
          className="panel-close"
          aria-label="Close details panel"
          onClick={closeWorkbenchPanel}
        >
          Close
        </button>
      </header>

      <section className="experience-panel__meta">
        {workbench ? (
          <>
            <span>Category: {formatLabel(workbench.definition.category)}</span>
            <span>District: {formatLabel(workbench.definition.district)}</span>
            <span>Visibility: {formatLabel(workbench.definition.visibility)}</span>
            <span>Mode: {formatLabel(workbench.definition.contentMode)}</span>
            <span>Anchor: {`${workbench.placement.anchor.x.toFixed(1)}, ${workbench.placement.anchor.z.toFixed(1)}`}</span>
          </>
        ) : (
          <span>Walk up to any active workbench to open its details.</span>
        )}
      </section>

      <section className="experience-panel__content">
        {!workbench ? <p>Nothing selected yet.</p> : null}
        {workbench && workbench.definition.contentMode === 'linked' && !activeStory && !activeStoryError ? (
          <p>Loading linked story content...</p>
        ) : null}
        {activeStoryError ? <p>{activeStoryError}</p> : null}
        {ActiveStory ? <ActiveStory /> : null}

        {workbench && workbench.definition.contentMode === 'placeholder' ? (
          <div className="workbench-draft-panel">
            <p>{workbench.definition.draftNotes ?? 'No draft notes yet.'}</p>
            <div className="workbench-draft-panel__grid">
              <span>Archetype: {formatLabel(workbench.definition.visualRecipe.archetype)}</span>
              <span>Palette: {formatLabel(workbench.definition.visualRecipe.palette)}</span>
              <span>Prop Kit: {formatLabel(workbench.definition.visualRecipe.propKit)}</span>
              <span>Accent: {formatLabel(workbench.definition.visualRecipe.accentMaterial)}</span>
              <span>Hero Prop: {formatLabel(workbench.definition.visualRecipe.heroProp ?? 'none')}</span>
              <span>Animation: {formatLabel(workbench.definition.visualRecipe.animationStyle ?? 'still')}</span>
            </div>

            {workbench.issues.length > 0 ? (
              <>
                <h3>Editor Notes</h3>
                <ul className="workbench-draft-panel__issues">
                  {workbench.issues.map((issue) => (
                    <li key={`${issue.code}-${issue.message}`}>{issue.message}</li>
                  ))}
                </ul>
              </>
            ) : null}
          </div>
        ) : null}
      </section>
    </aside>
  );
}
