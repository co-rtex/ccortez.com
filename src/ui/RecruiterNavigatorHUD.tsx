import { useMemo, useState } from 'react';

import {
  deriveRecruiterNavigatorData,
  type RecruiterShortlistSection,
  type RecruiterMapMarker,
} from './recruiterNavigator';

import type { WorldAnchor } from '../types/experience';
import type { WorkbenchRuntimeRecord } from '../workbench/runtime';

interface RecruiterNavigatorHUDProps {
  workbenches: WorkbenchRuntimeRecord[];
  playerPosition: WorldAnchor;
  activeWorkbenchId: string | null;
  nearbyWorkbenchId: string | null;
  mobileLiteMode: boolean;
  onWorkbenchOpen: (workbenchId: string) => void;
}

interface RecruiterNavigatorContentProps {
  counts: {
    experience: number;
    project: number;
    secondary: number;
  };
  markers: RecruiterMapMarker[];
  sections: RecruiterShortlistSection[];
  playerMarker: {
    xPercent: number;
    yPercent: number;
  };
  onWorkbenchOpen: (workbenchId: string) => void;
  onHide?: () => void;
}

function renderShortlistSection(
  section: RecruiterShortlistSection,
  onWorkbenchOpen: (workbenchId: string) => void,
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
              className={`recruiter-navigator__item recruiter-navigator__item--${entry.category} recruiter-navigator__item--${entry.state}`}
              onClick={() => onWorkbenchOpen(entry.id)}
              aria-label={`Open ${entry.title} (${entry.categoryLabel})`}
            >
              <span className="recruiter-navigator__item-title">{entry.title}</span>
              <span className="recruiter-navigator__item-meta">
                {entry.featured ? 'Featured • ' : ''}
                {entry.districtLabel}
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
  sections,
  playerMarker,
  onWorkbenchOpen,
  onHide,
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
          <span>{counts.experience} experiences</span>
          <span>{counts.project} projects</span>
        </div>
      </header>

      <p className="recruiter-navigator__intro">
        Use the map or shortlist to jump straight into career highlights. Personal and campus context
        stays visible, but secondary.
      </p>

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
            className={`recruiter-map-marker recruiter-map-marker--${marker.category} recruiter-map-marker--${marker.state}`}
            style={{
              left: `${marker.xPercent}%`,
              top: `${marker.yPercent}%`,
            }}
            onClick={() => onWorkbenchOpen(marker.id)}
            disabled={!marker.canOpen}
            aria-label={`${marker.canOpen ? 'Open' : 'Unavailable'} ${marker.title} (${marker.categoryLabel})`}
            title={marker.title}
          >
            <span className="recruiter-map-marker__core" />
          </button>
        ))}
      </div>

      <div className="recruiter-navigator__legend" aria-label="Highlight legend">
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
        {sections.map((section) => renderShortlistSection(section, onWorkbenchOpen))}
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
}: RecruiterNavigatorHUDProps) {
  const [isHidden, setIsHidden] = useState(false);
  const data = useMemo(
    () => deriveRecruiterNavigatorData(workbenches, playerPosition, activeWorkbenchId, nearbyWorkbenchId),
    [activeWorkbenchId, nearbyWorkbenchId, playerPosition, workbenches],
  );

  if (data.markers.length === 0) {
    return null;
  }

  const content = (
    <RecruiterNavigatorContent
      counts={data.counts}
      markers={data.markers}
      sections={data.shortlistSections}
      playerMarker={data.playerMarker}
      onWorkbenchOpen={onWorkbenchOpen}
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

  if (isHidden) {
    return (
      <div className="recruiter-navigator recruiter-navigator--collapsed">
        <button
          type="button"
          className="recruiter-navigator__visibility-button recruiter-navigator__visibility-button--show"
          onClick={() => setIsHidden(false)}
          aria-label="Show recruiter guide"
        >
          Show Recruiter Guide
        </button>
      </div>
    );
  }

  return (
    <section className="recruiter-navigator" aria-label="Recruiter guide">
      <RecruiterNavigatorContent
        counts={data.counts}
        markers={data.markers}
        sections={data.shortlistSections}
        playerMarker={data.playerMarker}
        onWorkbenchOpen={onWorkbenchOpen}
        onHide={() => setIsHidden(true)}
      />
    </section>
  );
}
