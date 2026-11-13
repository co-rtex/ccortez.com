import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useRef } from 'react';

declare global {
  interface Window {
    __sceneStats?: { calls: number; triangles: number; geometries: number; textures: number; programs: number };
  }
}

/**
 * Records `scene:created` and `scene:first-frame` performance marks so load time can be measured in any browser,
 * and with `?stats` in the URL publishes renderer counters on `window.__sceneStats` once per second.
 */
export function SceneTelemetry(): null {
  const gl = useThree((state) => state.gl);
  const firstFrame = useRef(false);
  const lastPublish = useRef(0);
  const publishStats = useRef(
    typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('stats'),
  );

  useEffect(() => {
    performance.mark('scene:created');
  }, []);

  useFrame(({ clock }) => {
    if (!firstFrame.current) {
      firstFrame.current = true;
      performance.mark('scene:first-frame');
    }
    if (publishStats.current && clock.elapsedTime - lastPublish.current > 1) {
      lastPublish.current = clock.elapsedTime;
      const { render, memory, programs } = gl.info;
      window.__sceneStats = {
        calls: render.calls,
        triangles: render.triangles,
        geometries: memory.geometries,
        textures: memory.textures,
        programs: programs?.length ?? 0,
      };
    }
  });

  return null;
}
