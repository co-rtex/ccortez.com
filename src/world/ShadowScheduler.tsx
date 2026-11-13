import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useRef } from 'react';

import { hasPerfFlag } from './perfFlags';

/** Experimental: re-render the shadow map every other frame (the sun never moves). */
export function ShadowScheduler(): null {
  const gl = useThree((state) => state.gl);
  const frame = useRef(0);
  const enabled = hasPerfFlag('shadowhalf');

  useEffect(() => {
    if (!enabled) return;
    gl.shadowMap.autoUpdate = false;
    gl.shadowMap.needsUpdate = true;
    return () => {
      gl.shadowMap.autoUpdate = true;
    };
  }, [enabled, gl]);

  useFrame(() => {
    if (!enabled) return;
    frame.current += 1;
    if (frame.current % 2 === 0) gl.shadowMap.needsUpdate = true;
  });

  return null;
}
