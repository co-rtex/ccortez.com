import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useRef } from 'react';

import { hasPerfFlag } from './perfFlags';

/** Experimental (`?perf=shadowhalf`): re-render the shadow map every other frame (the sun never moves). */
export function ShadowScheduler(): null {
  const getState = useThree((state) => state.get);
  const frame = useRef(0);
  const enabled = hasPerfFlag('shadowhalf');

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
