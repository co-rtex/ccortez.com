import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useRef } from 'react';

import { hasPerfFlag } from './perfFlags';

/**
 * Re-render the shadow map every other frame. The sun never moves and only a few small things (the player,
 * critters) cast moving shadows, so a 30 Hz shadow update is invisible but halves the frame-time spikes measured on
 * an M3 (uncapped p95 30 → 16 ms at spawn). `?perf=shadowfull` restores per-frame updates for comparison.
 */
export function ShadowScheduler(): null {
  const getState = useThree((state) => state.get);
  const frame = useRef(0);
  const enabled = !hasPerfFlag('shadowfull');

  useEffect(() => {
    if (!enabled) return;
    const { shadowMap } = getState().gl;
    shadowMap.autoUpdate = false;
    shadowMap.needsUpdate = true;
    return () => {
      shadowMap.autoUpdate = true;
    };
  }, [enabled, getState]);

  useFrame((state) => {
    if (!enabled) return;
    frame.current += 1;
    if (frame.current % 2 === 0) state.gl.shadowMap.needsUpdate = true;
  });

  return null;
}
