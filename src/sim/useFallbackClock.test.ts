import { describe, expect, it } from 'vitest';

import { fallbackAdvanceSeconds } from './useFallbackClock';
import { TASKFORGE_TICK_SECONDS, useTaskforgeSim } from './taskforgeSimStore';

describe('panel fallback clock', () => {
  it('leaves a model alone while a scene advances it every frame', () => {
    expect(fallbackAdvanceSeconds(1000, 1016)).toBeNull();
    expect(fallbackAdvanceSeconds(1000, 1140)).toBeNull();
  });

  it('advances a stale model by the real time since its last advance, at most a second', () => {
    expect(fallbackAdvanceSeconds(1000, 1250)).toBeCloseTo(0.25, 6);
    expect(fallbackAdvanceSeconds(0, 50_000)).toBe(1);
  });

  it('keeps a model at its normal pace when driven only by the fallback', () => {
    useTaskforgeSim.getState().restart();
    let now = 10_000;
    // Seed the clock as a first fallback tick would, then tick every 250 ms for 7 seconds.
    useTaskforgeSim.setState({ lastAdvancedAt: now });
    const start = useTaskforgeSim.getState().sim.tick;
    for (let i = 0; i < 28; i += 1) {
      now += 250;
      const seconds = fallbackAdvanceSeconds(useTaskforgeSim.getState().lastAdvancedAt, now);
      if (seconds !== null) {
        useTaskforgeSim.getState().advance(seconds);
        useTaskforgeSim.setState({ lastAdvancedAt: now });
      }
    }
    expect(useTaskforgeSim.getState().sim.tick - start).toBe(Math.floor(7 / TASKFORGE_TICK_SECONDS));
  });
});
