import { useEffect, useMemo, useRef, useState } from 'react';

import { getExperienceById } from '../content/registry';
import { useGameStore } from '../state/gameStore';

import type { ExperienceStoryComponent } from '../types/experience';

export function ExperiencePanel() {
  const panelExperienceId = useGameStore((state) => state.panelExperienceId);
  const closeExperiencePanel = useGameStore((state) => state.closeExperiencePanel);

  const [storyCache, setStoryCache] = useState<Record<string, ExperienceStoryComponent>>({});
  const [storyErrors, setStoryErrors] = useState<Record<string, string>>({});
  const loadingIdsRef = useRef<Set<string>>(new Set());

  const experience = useMemo(
    () => (panelExperienceId ? getExperienceById(panelExperienceId) : undefined),
    [panelExperienceId],
  );

  useEffect(() => {
    if (!experience) {
      return;
    }

    const experienceId = experience.manifest.id;
    if (
      storyCache[experienceId] ||
      storyErrors[experienceId] ||
      loadingIdsRef.current.has(experienceId)
    ) {
      return;
    }

    loadingIdsRef.current.add(experienceId);

    void experience
      .loadStory()
      .then((module) => {
        setStoryCache((current) => {
          if (current[experienceId]) {
            return current;
          }

          return {
            ...current,
            [experienceId]: module.default,
          };
        });
      })
      .catch((error: unknown) => {
        const message = error instanceof Error ? error.message : 'Failed to load story content.';
        setStoryErrors((current) => ({
          ...current,
          [experienceId]: message,
        }));
      })
      .finally(() => {
        loadingIdsRef.current.delete(experienceId);
      });
  }, [experience, storyCache, storyErrors]);

  const activeStory = experience ? storyCache[experience.manifest.id] : undefined;
  const activeStoryError = experience ? storyErrors[experience.manifest.id] : undefined;
  const ActiveStory = activeStory;

  return (
    <aside className={`experience-panel ${panelExperienceId ? 'experience-panel--open' : ''}`}>
      <header className="experience-panel__header">
        <div>
          <p className="experience-panel__eyebrow">Experience Details</p>
          <h2>{experience ? experience.manifest.title : 'Select a Landmark'}</h2>
        </div>
        <button
          type="button"
          className="panel-close"
          aria-label="Close details panel"
          onClick={closeExperiencePanel}
        >
          Close
        </button>
      </header>

      <section className="experience-panel__meta">
        {experience ? (
          <>
            <span>Type: {experience.manifest.type}</span>
            <span>Status: {experience.manifest.status}</span>
            <span>Anchor: {`${experience.manifest.worldAnchor.x.toFixed(1)}, ${
              experience.manifest.worldAnchor.z
            .toFixed(1)}`}</span>
          </>
        ) : (
          <span>Walk up to any active landmark to open its details.</span>
        )}
      </section>

      <section className="experience-panel__content">
        {!experience ? <p>Nothing selected yet.</p> : null}
        {experience && !activeStory && !activeStoryError ? <p>Loading story content...</p> : null}
        {activeStoryError ? <p>{activeStoryError}</p> : null}
        {ActiveStory ? <ActiveStory /> : null}
      </section>
    </aside>
  );
}
