import { getExperienceById } from '../content/registry';
import { useGameStore } from '../state/gameStore';
import { getScenicRestSpotById } from '../world/restSpots';

export function ExperiencePrompt() {
  const playerMode = useGameStore((state) => state.playerMode);
  const activeRestSpotId = useGameStore((state) => state.activeRestSpotId);
  const nearbyRestSpotId = useGameStore((state) => state.nearbyRestSpotId);
  const nearbyExperienceId = useGameStore((state) => state.nearbyExperienceId);

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

  if (!nearbyExperienceId) {
    return (
      <div className="prompt-card prompt-card--idle">
        <p>Move with WASD. Hold Shift to run. Explore landmarks and press E when a prompt appears.</p>
      </div>
    );
  }

  const nearbyExperience = getExperienceById(nearbyExperienceId);
  if (!nearbyExperience) {
    return null;
  }

  return (
    <div className="prompt-card">
      <p className="prompt-card__title">{nearbyExperience.manifest.title}</p>
      <p className="prompt-card__subtitle">Press E or click landmark to open details</p>
    </div>
  );
}
