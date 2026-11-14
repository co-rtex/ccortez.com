import { useEffect, useMemo, useState } from 'react';

import { useGameStore } from '../state/gameStore';
import { getScenicRestSpotById } from '../world/restSpots';

import type { WorkbenchRuntimeRecord } from '../workbench/runtime';

interface WorkbenchPromptProps {
  workbenches: WorkbenchRuntimeRecord[];
  editorEnabled: boolean;
  mobileLiteMode: boolean;
  /** Starts the flagship tour (opens its first stop); offered on the arrival card. */
  onStartTour?: () => void;
}

export function WorkbenchPrompt({ workbenches, editorEnabled, mobileLiteMode, onStartTour }: WorkbenchPromptProps) {
  const cameraMode = useGameStore((state) => state.cameraMode);
  const playerMode = useGameStore((state) => state.playerMode);
  const activeRestSpotId = useGameStore((state) => state.activeRestSpotId);
  const nearbyRestSpotId = useGameStore((state) => state.nearbyRestSpotId);
  const nearbyWorkbenchId = useGameStore((state) => state.nearbyWorkbenchId);

  // The idle hint only teaches the controls; once the visitor has walked a few metres it gets out of the way.
  const [hasWalked, setHasWalked] = useState(false);
  useEffect(() => {
    let origin: { x: number; z: number } | null = null;
    return useGameStore.subscribe((state) => {
      origin ??= { x: state.playerPosition.x, z: state.playerPosition.z };
      if (Math.hypot(state.playerPosition.x - origin.x, state.playerPosition.z - origin.z) > 3) setHasWalked(true);
    });
  }, []);

  const nearbyWorkbench = useMemo(
    () => workbenches.find((workbench) => workbench.definition.id === nearbyWorkbenchId),
    [nearbyWorkbenchId, workbenches],
  );

  if (cameraMode === 'workbench-inspect') {
    return null;
  }

  if (playerMode === 'seated' && activeRestSpotId) {
    const activeRestSpot = getScenicRestSpotById(activeRestSpotId);
    return (
      <div className="prompt-card">
        <p className="prompt-card__title">{activeRestSpot?.label ?? 'Scenic Rest Spot'}</p>
        <p className="prompt-card__subtitle">Press E or Esc to stand up</p>
      </div>
    );
  }

  if (nearbyRestSpotId) {
    const nearbyRestSpot = getScenicRestSpotById(nearbyRestSpotId);
    return (
      <div className="prompt-card">
        <p className="prompt-card__title">{nearbyRestSpot?.label ?? 'Scenic Rest Spot'}</p>
        <p className="prompt-card__subtitle">Press E to sit</p>
      </div>
    );
  }

  if (!nearbyWorkbench) {
    // Mobile-lite already shows its own banner, and the guide says where to start.
    if (hasWalked || (mobileLiteMode && !editorEnabled)) return null;
    if (!editorEnabled && onStartTour) {
      // The arrival card: the one invitation on the first screen. It goes once the visitor starts walking.
      return (
        <section className="arrival-card" aria-labelledby="arrival-card-title">
          <h2 id="arrival-card-title" className="arrival-card__title">
            Four of these projects run live models.
          </h2>
          <button type="button" className="arrival-card__tour" onClick={onStartTour}>
            Take the flagship tour <span>5 stops</span>
          </button>
          <p className="arrival-card__keys">
            Or walk anywhere: <kbd>W</kbd>
            <kbd>A</kbd>
            <kbd>S</kbd>
            <kbd>D</kbd> to walk, <kbd>Shift</kbd> to run, <kbd>E</kbd> to open a bench.
          </p>
        </section>
      );
    }
    return (
      <div className="prompt-card prompt-card--idle">
        <p>
          {editorEnabled
            ? 'Move with WASD. Hold Shift to run. Explore the island and open workbenches when a prompt appears.'
            : 'Walk with WASD or the arrow keys, hold Shift to run, and press E at a workbench to open it.'}
        </p>
      </div>
    );
  }

  return (
    <div className="prompt-card">
      <p className="prompt-card__title">{nearbyWorkbench.definition.title}</p>
      <p className="prompt-card__subtitle">
        {editorEnabled
          ? 'Click to select. Press E or use the editor to open.'
          : nearbyWorkbench.definition.contentMode === 'placeholder'
            ? 'Press E or click workbench to preview draft details'
            : 'Press E or click workbench to open details'}
      </p>
    </div>
  );
}
