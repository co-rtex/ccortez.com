import { useEffect, useMemo, useRef, useState } from 'react';

import { useGameStore } from '../state/gameStore';
import { WORKBENCH_INSPECT_HINT, shouldShowWorkbenchInspectHint } from './workbenchPanelHints';

import type { ExperienceStoryComponent } from '../types/experience';
import type { WorkbenchRuntimeRecord } from '../workbench/runtime';
import type { ExperienceRecruiterCard } from '../types/experience';
import { formatRecruiterCategoryLabel, resolveRecruiterNavigatorCategory } from './recruiterNavigator';

interface WorkbenchPanelProps {
  workbenches: WorkbenchRuntimeRecord[];
}

function formatLabel(value: string): string {
  return value
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function buildRecruiterMetaLine(parts: Array<string | undefined>): string {
  return parts.filter((part) => part && part.trim().length > 0).join(' • ');
}

export function resolvePanelEyebrow(workbench: WorkbenchRuntimeRecord | undefined): string {
  if (!workbench) {
    return 'Recruiter Guide';
  }

  const category = resolveRecruiterNavigatorCategory(workbench);
  if (category === 'start') {
    return 'Start Here';
  }

  return category === 'secondary' ? 'More About Me' : 'Recruiter Brief';
}

export function buildWorkbenchMetaChips(workbench: WorkbenchRuntimeRecord): Array<{
  label: string;
  tone: 'start' | 'experience' | 'project' | 'secondary' | 'featured' | 'default';
}> {
  const category = resolveRecruiterNavigatorCategory(workbench);
  const chips: Array<{
    label: string;
    tone: 'start' | 'experience' | 'project' | 'secondary' | 'featured' | 'default';
  }> = [];

  if (category === 'secondary') {
    chips.push({
      label: 'More About Me',
      tone: 'secondary',
    });
  } else if (category === 'start') {
    chips.push({
      label: 'Start Here',
      tone: 'start',
    });
  } else {
    chips.push({
      label: `Type: ${formatRecruiterCategoryLabel(category)}`,
      tone: category,
    });
  }

  chips.push({
    label: `District: ${workbench.districtDefinition.label}`,
    tone: 'default',
  });

  if (workbench.definition.priorityTier === 'anchor') {
    chips.push({
      label: 'Featured',
      tone: 'featured',
    });
  }

  return chips;
}

interface LinkedWorkbenchContentProps {
  recruiterCard?: ExperienceRecruiterCard;
  activeStoryError?: string;
  ActiveStory?: ExperienceStoryComponent;
  isLoading: boolean;
}

export function LinkedWorkbenchContent({
  recruiterCard,
  activeStoryError,
  ActiveStory,
  isLoading,
}: LinkedWorkbenchContentProps) {
  const recruiterMetaLine = recruiterCard
    ? buildRecruiterMetaLine([
        recruiterCard.roleLabel,
        recruiterCard.organization,
        recruiterCard.dateRange,
        recruiterCard.location,
      ])
    : null;

  return (
    <>
      {recruiterCard ? (
        <section className="recruiter-card">
          {recruiterMetaLine ? <p className="recruiter-card__meta">{recruiterMetaLine}</p> : null}
          <p className="recruiter-card__summary">{recruiterCard.summary}</p>

          <div className="recruiter-card__section">
            <h3>Impact</h3>
            <ul className="recruiter-card__bullets">
              {recruiterCard.impactBullets.map((bullet) => (
                <li key={bullet}>{bullet}</li>
              ))}
            </ul>
          </div>

          <div className="recruiter-card__section">
            <h3>Tech Stack</h3>
            <div className="recruiter-card__chips">
              {recruiterCard.techStack.map((item) => (
                <span key={item}>{item}</span>
              ))}
            </div>
          </div>
        </section>
      ) : null}
      {isLoading ? <p>Loading linked story content...</p> : null}
      {activeStoryError ? <p>{activeStoryError}</p> : null}
      {ActiveStory ? (
        <section className="experience-panel__story">
          {recruiterCard ? <h3 className="experience-panel__story-heading">Story</h3> : null}
          <ActiveStory />
        </section>
      ) : null}
    </>
  );
}

export function WorkbenchPanel({ workbenches }: WorkbenchPanelProps) {
  const cameraMode = useGameStore((state) => state.cameraMode);
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
  const linkedContentError = workbench?.definition.contentMode === 'linked' && !workbench.linkedExperience
    ? 'This published workbench is missing its linked experience content.'
    : undefined;
  const activeStoryError = workbench?.linkedExperience
    ? storyErrors[workbench.linkedExperience.manifest.id]
    : linkedContentError;
  const ActiveStory = activeStory;
  const recruiterCard = workbench?.linkedExperience?.manifest.recruiterCard;
  const metaChips = workbench ? buildWorkbenchMetaChips(workbench) : [];

  return (
    <aside className={`experience-panel ${panelWorkbenchId ? 'experience-panel--open' : ''}`}>
      <header className="experience-panel__header">
        <div>
          <p className="experience-panel__eyebrow">{resolvePanelEyebrow(workbench)}</p>
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
            {metaChips.map((chip) => (
              <span
                key={chip.label}
                className={`experience-panel__meta-chip experience-panel__meta-chip--${chip.tone}`}
              >
                {chip.label}
              </span>
            ))}
          </>
        ) : (
          <span className="experience-panel__meta-chip experience-panel__meta-chip--default">
            Use the recruiter guide or walk up to any highlight to open its details.
          </span>
        )}
      </section>

      <section className="experience-panel__content">
        {!workbench ? <p>Nothing selected yet.</p> : null}
        {shouldShowWorkbenchInspectHint(cameraMode, workbench) ? (
          <p className="experience-panel__inspect-hint">{WORKBENCH_INSPECT_HINT}</p>
        ) : null}
        {workbench?.definition.contentMode === 'linked' ? (
          <LinkedWorkbenchContent
            recruiterCard={recruiterCard}
            activeStoryError={activeStoryError}
            ActiveStory={ActiveStory}
            isLoading={Boolean(workbench.linkedExperience && !activeStory && !activeStoryError)}
          />
        ) : null}

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
