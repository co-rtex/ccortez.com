import { useEffect } from 'react';

/**
 * The benches' toy models are advanced by their 3D scene, once per frame. Without a scene (no WebGL, or the panel
 * open while the bench's scene is not loaded) nothing would advance them, and the panel's buttons would appear to
 * do nothing. While a panel is mounted, this advances its model on a timer whenever no frame has done so lately.
 */
const CHECK_MS = 250;
/** A scene advances its model every frame (~17 ms); this long without one means no scene is driving it. */
const STALE_MS = 150;

export interface ClockedModel {
  lastAdvancedAt: number;
  advance: (seconds: number) => void;
}

/**
 * Seconds to advance a model that was last advanced at `lastAdvancedAt`, or null while a scene is driving it.
 * It is the real time since the last advance (capped at a second), so the model keeps its normal pace.
 */
export function fallbackAdvanceSeconds(lastAdvancedAt: number, now: number): number | null {
  const since = now - lastAdvancedAt;
  return since > STALE_MS ? Math.min(since, 1000) / 1000 : null;
}

export function useFallbackClock(getState: () => ClockedModel): void {
  useEffect(() => {
    const id = window.setInterval(() => {
      const state = getState();
      const seconds = fallbackAdvanceSeconds(state.lastAdvancedAt, performance.now());
      if (seconds !== null) state.advance(seconds);
    }, CHECK_MS);
    return () => window.clearInterval(id);
  }, [getState]);
}
