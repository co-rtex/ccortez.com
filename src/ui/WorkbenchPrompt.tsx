import { useMemo } from 'react';

import { useGameStore } from '../state/gameStore';
import { getScenicRestSpotById } from '../world/restSpots';

import type { WorkbenchRuntimeRecord } from '../workbench/runtime';

interface WorkbenchPromptProps {
  workbenches: WorkbenchRuntimeRecord[];
}

export function WorkbenchPrompt({ workbenches }: WorkbenchPromptProps) {
  const playerMode = useGameStore((state) => state.playerMode);
  const activeRestSpotId = useGameStore((state) => state.activeRestSpotId);
  const nearbyRestSpotId = useGameStore((state) => state.nearbyRestSpotId);
  const nearbyWorkbenchId = useGameStore((state) => state.nearbyWorkbenchId);

  const nearbyWorkbench = useMemo(
    () => workbenches.find((workbench) => workbench.definition.id === nearbyWorkbenchId),
    [nearbyWorkbenchId, workbenches],
  );

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
    return (
      <div className="prompt-card prompt-card--idle">
        <p>Move with WASD. Hold Shift to run. Explore the island and open workbenches when a prompt appears.</p>
      </div>
    );
  }

  return (
    <div className="prompt-card">
      <p className="prompt-card__title">{nearbyWorkbench.definition.title}</p>
      <p className="prompt-card__subtitle">
        {nearbyWorkbench.definition.contentMode === 'placeholder'
          ? 'Press E or click workbench to preview draft details'
          : 'Press E or click workbench to open details'}
      </p>
    </div>
  );
}
