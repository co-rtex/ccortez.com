import { useEffect, useMemo, useState } from 'react';

import { useGameStore } from '../state/gameStore';

function detectReducedMotion(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return false;
  }

  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function CollisionFeedbackOverlay() {
  const collisionFeedbackEvent = useGameStore((state) => state.collisionFeedbackEvent);
  const [reducedMotion, setReducedMotion] = useState(detectReducedMotion);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return;
    }

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handleChange = (): void => {
      setReducedMotion(mediaQuery.matches);
    };

    handleChange();
    mediaQuery.addEventListener('change', handleChange);
    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, []);

  const overlayClassName = useMemo(
    () => {
      if (!collisionFeedbackEvent) {
        return '';
      }

      return `collision-feedback-overlay collision-feedback-overlay--${collisionFeedbackEvent.reason} ${
        reducedMotion ? 'collision-feedback-overlay--reduced' : ''
      }`.trim();
    },
    [collisionFeedbackEvent, reducedMotion],
  );

  if (!collisionFeedbackEvent) {
    return null;
  }

  return (
    <div className="collision-feedback-layer" aria-hidden="true">
      <div key={`collision-feedback-${collisionFeedbackEvent.id}`} className={overlayClassName} />
    </div>
  );
}
