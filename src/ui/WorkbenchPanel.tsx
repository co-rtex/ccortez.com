import { useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';

import { useGameStore } from '../state/gameStore';
import { getWorkbenchInspectHint, shouldShowWorkbenchInspectHint } from './workbenchPanelHints';

import type { ExperienceStoryComponent } from '../types/experience';
import type { WorkbenchRuntimeRecord } from '../workbench/runtime';
import type { ExperienceRecruiterCard } from '../types/experience';
import { buildWorkbenchMetaChips, resolvePanelEyebrow } from './workbenchPanelMeta';
import { isFlagshipWorkbench } from '../workbench/flagships';
import { prefersReducedMotion } from '../world/reducedMotion';

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

interface LinkedWorkbenchContentProps {
  /** The panel's title: a story heading that only repeats it is left out. */
  title?: string;
  recruiterCard?: ExperienceRecruiterCard;
  activeStoryError?: string;
  ActiveStory?: ExperienceStoryComponent;
  isLoading: boolean;
}

/**
 * Story headings sit under the panel's own title (h2) and its "Story" heading (h3), so a story's `##` renders as
 * an h4; one that only repeats the panel title (most stories open with their title) is left out.
 */
function StoryHeading(title: string | undefined) {
  return function Heading({ children }: { children?: ReactNode }) {
    if (typeof children === 'string' && children.trim() === title?.trim()) return null;
    return <h4 className="experience-panel__story-title">{children}</h4>;
  };
}

export function LinkedWorkbenchContent({
  title,
  recruiterCard,
  activeStoryError,
  ActiveStory,
  isLoading,
}: LinkedWorkbenchContentProps) {
  const storyComponents = useMemo(() => ({ h2: StoryHeading(title) }), [title]);
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
          <ActiveStory components={storyComponents} />
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

  // Keyboard and screen-reader users land in the panel when it opens (its heading is announced), and go back to
  // where they were when it closes.
  const panelRef = useRef<HTMLElement>(null);
  const jumpToDemo = (): void => {
    const demo = panelRef.current?.querySelector<HTMLElement>('.taskforge-sim');
    if (!demo) return;
    demo.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block: 'start' });
    // Move focus to the demo's heading so keyboard and screen-reader users land there too.
    const heading = demo.querySelector<HTMLElement>('h4');
    if (heading) {
      heading.tabIndex = -1;
      heading.focus({ preventScroll: true });
    }
  };
  const headingRef = useRef<HTMLHeadingElement>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);
  // The last element focused outside the panel. Opening from the recruiter guide folds the guide in the same
  // render, removing the button (and blurring it) before the open effect runs, so focus is tracked as it moves.
  // Pressing on something that cannot take focus (the 3D world) clears it.
  const lastFocusedOutsideRef = useRef<HTMLElement | null>(null);
  useEffect(() => {
    const onFocusIn = (event: FocusEvent) => {
      if (event.target instanceof HTMLElement && !panelRef.current?.contains(event.target)) {
        lastFocusedOutsideRef.current = event.target;
      }
    };
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target instanceof Element ? event.target : null;
      if (target && !panelRef.current?.contains(target) && !target.closest('button, a, input, select, textarea, [tabindex]')) {
        lastFocusedOutsideRef.current = null;
      }
    };
    document.addEventListener('focusin', onFocusIn);
    document.addEventListener('pointerdown', onPointerDown);
    return () => {
      document.removeEventListener('focusin', onFocusIn);
      document.removeEventListener('pointerdown', onPointerDown);
    };
  }, []);
  useEffect(() => {
    if (panelWorkbenchId) {
      const active = document.activeElement;
      const opener =
        active instanceof HTMLElement && active !== document.body && !panelRef.current?.contains(active)
          ? active
          : lastFocusedOutsideRef.current;
      if (opener) returnFocusRef.current = opener;
      headingRef.current?.focus({ preventScroll: true });
      return;
    }
    const target = returnFocusRef.current;
    returnFocusRef.current = null;
    if (!target || !(panelRef.current?.contains(document.activeElement) || document.activeElement === document.body)) return;
    if (target.isConnected) {
      target.focus({ preventScroll: true });
      return;
    }
    const workbenchId = target.dataset.workbenchId;
    const twin = workbenchId
      ? document.querySelector<HTMLElement>(`[data-workbench-id="${CSS.escape(workbenchId)}"]`)
      : null;
    // The guide may have folded away (it collapses after a bench is opened from it); then its show button is the
    // nearest control to where the visitor was, rather than leaving focus on the page body.
    (twin ?? document.querySelector<HTMLElement>('.recruiter-navigator__visibility-button--show'))?.focus({
      preventScroll: true,
    });
  }, [panelWorkbenchId]);

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
    <aside
      ref={panelRef}
      className={`experience-panel ${panelWorkbenchId ? 'experience-panel--open' : ''}`}
      aria-labelledby="experience-panel-title"
      // Closed, the panel only slides off screen; inert keeps its controls out of the tab order.
      inert={!panelWorkbenchId}
    >
      <header className="experience-panel__header">
        <div>
          <p className="experience-panel__eyebrow">{resolvePanelEyebrow(workbench)}</p>
          <h2 id="experience-panel-title" ref={headingRef} tabIndex={-1}>
            {workbench ? workbench.definition.title : 'Select a Workbench'}
          </h2>
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

      <section className="experience-panel__meta" hidden={Boolean(workbench) && metaChips.length === 0}>
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
            {/* Flagships carry a live model further down the story; this jumps to it (on phones it is below the fold). */}
            {isFlagshipWorkbench(workbench.definition.id) ? (
              <button type="button" className="experience-panel__demo-jump" onClick={jumpToDemo}>
                Try the live model
              </button>
            ) : null}
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
          <p className="experience-panel__inspect-hint">
            {getWorkbenchInspectHint(
              typeof window !== 'undefined' && window.matchMedia?.('(pointer: coarse)').matches === true,
            )}
          </p>
        ) : null}
        {workbench?.definition.contentMode === 'linked' ? (
          <LinkedWorkbenchContent
            title={workbench.definition.title}
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
