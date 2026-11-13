import { useEffect, useMemo, useRef, useState } from 'react';

import { useGameStore } from '../state/gameStore';

import {
  deriveRecruiterNavigatorData,
  summarizeOpenedProgress,
  type RecruiterShortlistSection,
  type RecruiterMapMarker,
  type RecruiterStartEntry,
} from './recruiterNavigator';
import { PROFESSIONAL_SITE_URL } from '../app/siteLinks';

import type { WorldAnchor } from '../types/experience';
import type { WorkbenchRuntimeRecord } from '../workbench/runtime';

interface RecruiterNavigatorHUDProps {
  workbenches: WorkbenchRuntimeRecord[];
  playerPosition: WorldAnchor;
  activeWorkbenchId: string | null;
  nearbyWorkbenchId: string | null;
  mobileLiteMode: boolean;
  onWorkbenchOpen: (workbenchId: string) => void;
  /** Fold the guide to its button while a bench panel is open (default on). */
  foldWhilePanelOpen?: boolean;
}

interface RecruiterNavigatorContentProps {
  counts: {
    start: number;
    experience: number;
    project: number;
    secondary: number;
  };
  markers: RecruiterMapMarker[];
  startEntry: RecruiterStartEntry | null;
  sections: RecruiterShortlistSection[];
  playerMarker: {
    xPercent: number;
    yPercent: number;
  };
  onWorkbenchOpen: (workbenchId: string) => void;
  onHide?: () => void;
  openedIds: ReadonlySet<string>;
  progress: { opened: number; total: number };
}

function renderShortlistSection(
  section: RecruiterShortlistSection,
  onWorkbenchOpen: (workbenchId: string) => void,
  openedIds: ReadonlySet<string>,
) {
  return (
    <section key={section.id} className="recruiter-navigator__section">
      <div className="recruiter-navigator__section-header">
        <h3>{section.label}</h3>
        <span>{section.entries.length}</span>
      </div>

      {section.entries.length === 0 ? (
        <p className="recruiter-navigator__empty">No published highlights yet.</p>
      ) : (
        <div className="recruiter-navigator__shortlist">
          {section.entries.map((entry) => (
            <button
              key={entry.id}
              type="button"
              data-workbench-id={entry.id}
              className={`recruiter-navigator__item recruiter-navigator__item--${entry.category} recruiter-navigator__item--${entry.state}${openedIds.has(entry.id) ? ' recruiter-navigator__item--opened' : ''}`}
              onClick={() => onWorkbenchOpen(entry.id)}
            >
              <span className="recruiter-navigator__item-title">{entry.title}</span>
              <span className="recruiter-navigator__item-meta">
                {entry.featured ? 'Featured • ' : ''}
                {entry.districtLabel}
                {openedIds.has(entry.id) ? ' • Opened' : ''}
              </span>
            </button>
          ))}
        </div>
      )}
    </section>
  );
}

function RecruiterNavigatorContent({
  counts,
  markers,
  startEntry,
  sections,
  playerMarker,
  onWorkbenchOpen,
  onHide,
  openedIds,
  progress,
}: RecruiterNavigatorContentProps) {
  return (
    <>
      <header className="recruiter-navigator__header">
        <div className="recruiter-navigator__header-row">
          <div>
            <p className="recruiter-navigator__eyebrow">Recruiter Guide</p>
            <h2>Start Here</h2>
          </div>

          {onHide ? (
            <button
              type="button"
              className="recruiter-navigator__visibility-button"
              onClick={onHide}
              aria-label="Hide recruiter guide"
            >
              Hide
            </button>
          ) : null}
        </div>

        <div className="recruiter-navigator__counts" aria-label="Published highlight counts">
          <span>{counts.start} start</span>
          <span>{counts.experience} experiences</span>
          <span>{counts.project} projects</span>
          {progress.opened > 0 ? (
            <span className="recruiter-navigator__progress">
              {progress.opened} of {progress.total} opened
            </span>
          ) : null}
        </div>
      </header>

      <p className="recruiter-navigator__intro">
        Walk to any workbench, or pick one here to jump straight to it.
      </p>
      <p className="recruiter-navigator__alt-link">
        Short on time?{' '}
        <a href={PROFESSIONAL_SITE_URL}>Read the text portfolio and resume</a>
      </p>

      {startEntry ? (
        <section className="recruiter-navigator__section recruiter-navigator__section--start">
          <div className="recruiter-navigator__section-header">
            <h3>Start Here</h3>
            <span>Welcome</span>
          </div>

          <button
            type="button"
            data-workbench-id={startEntry.id}
            className={`recruiter-navigator__item recruiter-navigator__item--start recruiter-navigator__item--${startEntry.state}`}
            onClick={() => onWorkbenchOpen(startEntry.id)}
          >
            <span className="recruiter-navigator__item-title">{startEntry.title}</span>
            <span className="recruiter-navigator__item-meta">
              {startEntry.districtLabel}
              {openedIds.has(startEntry.id) ? ' • Opened' : ''}
            </span>
          </button>
        </section>
      ) : null}

      <div className="recruiter-navigator__map" aria-label="Schematic island map of highlights">
        <div
          className="recruiter-navigator__player"
          style={{
            left: `${playerMarker.xPercent}%`,
            top: `${playerMarker.yPercent}%`,
          }}
          aria-hidden="true"
        />

        {markers.map((marker) => (
          <button
            key={marker.id}
            type="button"
            className={`recruiter-map-marker recruiter-map-marker--${marker.category} recruiter-map-marker--${marker.state}${openedIds.has(marker.id) ? ' recruiter-map-marker--opened' : ''}`}
            style={{
              left: `${marker.xPercent}%`,
              top: `${marker.yPercent}%`,
            }}
            onClick={() => onWorkbenchOpen(marker.id)}
            disabled={!marker.canOpen}
            aria-label={`${marker.canOpen ? 'Open' : 'Unavailable'} ${marker.title} (${marker.categoryLabel}${openedIds.has(marker.id) ? ', opened' : ''})`}
            title={marker.title}
          >
            <span className="recruiter-map-marker__core" />
          </button>
        ))}
      </div>

      <div className="recruiter-navigator__legend" aria-label="Highlight legend">
        <span className="recruiter-navigator__legend-item">
          <span className="recruiter-navigator__swatch recruiter-navigator__swatch--start" />
          Start Here
        </span>
        <span className="recruiter-navigator__legend-item">
          <span className="recruiter-navigator__swatch recruiter-navigator__swatch--experience" />
          Experiences
        </span>
        <span className="recruiter-navigator__legend-item">
          <span className="recruiter-navigator__swatch recruiter-navigator__swatch--project" />
          Projects
        </span>
        <span className="recruiter-navigator__legend-item">
          <span className="recruiter-navigator__swatch recruiter-navigator__swatch--secondary" />
          More About Me
        </span>
      </div>

      <div className="recruiter-navigator__sections">
        {sections.map((section) => renderShortlistSection(section, onWorkbenchOpen, openedIds))}
      </div>
    </>
  );
}

export function RecruiterNavigatorHUD({
  workbenches,
  playerPosition,
  activeWorkbenchId,
  nearbyWorkbenchId,
  mobileLiteMode,
  onWorkbenchOpen,
  foldWhilePanelOpen = true,
}: RecruiterNavigatorHUDProps) {
  const [isHidden, setIsHidden] = useState(false);
  const guideRef = useRef<HTMLElement>(null);
  const showButtonRef = useRef<HTMLButtonElement>(null);
  const focusShowButtonRef = useRef(false);
  // Fold once, the first time the visitor walks off: by then they have seen it, and the world gets the space.
  // Never fold while keyboard focus is inside the guide (that would drop focus to the page).
  useEffect(() => {
    if (!foldWhilePanelOpen) return;
    let origin: { x: number; z: number } | null = null;
    let folded = false;
    return useGameStore.subscribe((state) => {
      origin ??= { x: state.playerPosition.x, z: state.playerPosition.z };
      if (folded || Math.hypot(state.playerPosition.x - origin.x, state.playerPosition.z - origin.z) <= 4) return;
      if (guideRef.current?.contains(document.activeElement)) return;
      folded = true;
      setIsHidden(true);
    });
  }, [foldWhilePanelOpen]);
  // While a bench panel is open the guide folds away so the scene and the panel have room; the visitor can
  // still reopen it for that panel.
  const [shownForPanelId, setShownForPanelId] = useState<string | null>(null);
  // Once the panel closes, forget the 'show it anyway' choice so the next panel folds the guide again.
  useEffect(() => {
    if (activeWorkbenchId === null) setShownForPanelId(null);
  }, [activeWorkbenchId]);
  // After an explicit Hide, keep keyboard focus on the button that brings the guide back.
  useEffect(() => {
    if (isHidden && focusShowButtonRef.current) {
      focusShowButtonRef.current = false;
      showButtonRef.current?.focus();
    }
  }, [isHidden]);
  const openedWorkbenchIds = useGameStore((state) => state.openedWorkbenchIds);
  const openedIds = useMemo(() => new Set(openedWorkbenchIds), [openedWorkbenchIds]);
  const foldedForPanel = foldWhilePanelOpen && activeWorkbenchId !== null && shownForPanelId !== activeWorkbenchId;
  const data = useMemo(
    () => deriveRecruiterNavigatorData(workbenches, playerPosition, activeWorkbenchId, nearbyWorkbenchId),
    [activeWorkbenchId, nearbyWorkbenchId, playerPosition, workbenches],
  );

  if (data.markers.length === 0) {
    return null;
  }

  const progress = summarizeOpenedProgress(data.markers, openedWorkbenchIds);

  const content = (
    <RecruiterNavigatorContent
      counts={data.counts}
      markers={data.markers}
      startEntry={data.startEntry}
      sections={data.shortlistSections}
      playerMarker={data.playerMarker}
      onWorkbenchOpen={onWorkbenchOpen}
      openedIds={openedIds}
      progress={progress}
    />
  );

  if (mobileLiteMode) {
    return (
      <details className="recruiter-navigator recruiter-navigator--mobile">
        <summary className="recruiter-navigator__toggle">Recruiter Guide</summary>
        <div className="recruiter-navigator__mobile-content">{content}</div>
      </details>
    );
  }

  if (isHidden || foldedForPanel) {
    return (
      <div className="recruiter-navigator recruiter-navigator--collapsed">
        <button
          ref={showButtonRef}
          type="button"
          className="recruiter-navigator__visibility-button recruiter-navigator__visibility-button--show"
          onClick={() => {
            setIsHidden(false);
            setShownForPanelId(activeWorkbenchId);
          }}
          aria-label="Show recruiter guide"
        >
          Show Recruiter Guide
        </button>
      </div>
    );
  }

  return (
    <section ref={guideRef} className="recruiter-navigator" aria-label="Recruiter guide">
      <RecruiterNavigatorContent
        counts={data.counts}
        markers={data.markers}
        startEntry={data.startEntry}
        sections={data.shortlistSections}
        playerMarker={data.playerMarker}
        onWorkbenchOpen={onWorkbenchOpen}
        openedIds={openedIds}
        progress={progress}
        onHide={() => {
          focusShowButtonRef.current = true;
          setIsHidden(true);
        }}
      />
    </section>
  );
}
