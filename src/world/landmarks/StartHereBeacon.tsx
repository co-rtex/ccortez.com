import { useFrame } from '@react-three/fiber';
import { useEffect, useRef, useState } from 'react';
import type { Group, MeshBasicMaterial } from 'three';

import { useGameStore } from '../../state/gameStore';
import { START_HERE_ANCHOR, START_HERE_WORKBENCH_ID } from '../hub';
import { prefersReducedMotion } from '../reducedMotion';
import { getCentralPlazaTopHeight } from '../terrain';

/**
 * A pulsing ring of warm light just outside the base of the Start Here bench, which stands in plain view of the
 * spawn point. (A light column used to mark it from afar; in front of the camera it washed the board out.)
 * It fades out for good once the Start Here panel has been opened in this visit.
 */
export function StartHereBeacon() {
  const [dismissed, setDismissed] = useState(false);
  const groupRef = useRef<Group>(null);
  const ringRef = useRef<MeshBasicMaterial>(null);
  const fade = useRef(1);

  useEffect(
    () =>
      useGameStore.subscribe((state) => {
        if (state.panelWorkbenchId === START_HERE_WORKBENCH_ID) setDismissed(true);
      }),
    [],
  );

  useFrame(({ clock }, delta) => {
    fade.current = Math.max(0, fade.current - (dismissed ? delta * 1.5 : 0));
    // Reduced motion: a steady glow, no pulse (the fade-out after Start Here opens is kept).
    const pulse = prefersReducedMotion() ? 0.85 : 0.75 + Math.sin(clock.elapsedTime * 2.2) * 0.25;
    if (ringRef.current) ringRef.current.opacity = 0.85 * pulse * fade.current;
    if (groupRef.current) groupRef.current.visible = fade.current > 0.01;
  });

  return (
    <group ref={groupRef} position={[START_HERE_ANCHOR.x, getCentralPlazaTopHeight(), START_HERE_ANCHOR.z]}>
      <mesh position={[0, 0.06, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[3.95, 4.25, 80]} />
        <meshBasicMaterial
          ref={ringRef}
          // Normal blending: additive light vanishes on the pale court paving.
          color="#f0a23a"
          transparent
          opacity={0.6}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>
    </group>
  );
}
