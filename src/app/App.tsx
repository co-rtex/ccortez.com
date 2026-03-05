import { useEffect, useMemo, useState } from 'react';

import { bootstrapExperienceRegistry } from '../content/loader';
import { getPublishedExperiences } from '../content/registry';
import { openExperiencePanel } from '../content/runtime';
import { OverworldScene } from '../scenes/OverworldScene';
import { useGameStore } from '../state/gameStore';
import { CollisionFeedbackOverlay } from '../ui/CollisionFeedbackOverlay';
import { ExperiencePanel } from '../ui/ExperiencePanel';
import { ExperiencePrompt } from '../ui/ExperiencePrompt';

import type { ExperienceRecord } from '../types/experience';

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

export default function App() {
  const [bootstrapState] = useState<BootstrapState>(() => {
    try {
      bootstrapExperienceRegistry();
      return {
        experiences: getPublishedExperiences(),
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
  const playerMode = useGameStore((state) => state.playerMode);
  const nearbyRestSpotId = useGameStore((state) => state.nearbyRestSpotId);
  const nearbyExperienceId = useGameStore((state) => state.nearbyExperienceId);
  const enterSeatedMode = useGameStore((state) => state.enterSeatedMode);
  const exitSeatedMode = useGameStore((state) => state.exitSeatedMode);
  const closeExperiencePanel = useGameStore((state) => state.closeExperiencePanel);

  useEffect(() => {
    const updateMode = (): void => setMobileLiteMode(detectMobileLiteMode());
    updateMode();
    window.addEventListener('resize', updateMode);
    return () => {
      window.removeEventListener('resize', updateMode);
    };
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.repeat && (event.code === 'Escape' || event.code === 'KeyE')) {
        return;
      }

      if (event.code === 'Escape') {
        if (playerMode === 'seated') {
          exitSeatedMode();
          return;
        }

        closeExperiencePanel();
        return;
      }

      if (event.code === 'KeyE') {
        if (playerMode === 'seated') {
          exitSeatedMode();
          return;
        }

        if (nearbyRestSpotId) {
          enterSeatedMode(nearbyRestSpotId);
          closeExperiencePanel();
          return;
        }

        if (nearbyExperienceId) {
          openExperiencePanel(nearbyExperienceId);
        }
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [
    nearbyExperienceId,
    nearbyRestSpotId,
    playerMode,
    closeExperiencePanel,
    enterSeatedMode,
    exitSeatedMode,
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

  return (
    <main className={appClassName}>
      <OverworldScene
        experiences={bootstrapState.experiences}
        onLandmarkOpen={(experienceId) => openExperiencePanel(experienceId)}
      />
      <CollisionFeedbackOverlay />

      <div className="hud-layer">
        <ExperiencePrompt />
        {mobileLiteMode ? (
          <div className="mobile-lite-banner">
            Mobile-lite mode: tap landmarks for details. Desktop enables full WASD traversal.
          </div>
        ) : null}
      </div>

      <ExperiencePanel />
    </main>
  );
}
