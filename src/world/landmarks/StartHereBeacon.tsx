import { useFrame } from '@react-three/fiber';
import { useEffect, useRef, useState } from 'react';
import { AdditiveBlending, DoubleSide } from 'three';
import type { Group, MeshBasicMaterial } from 'three';

import { useGameStore } from '../../state/gameStore';
import { START_HERE_ANCHOR, START_HERE_WORKBENCH_ID } from '../hub';
import { prefersReducedMotion } from '../reducedMotion';
import { getCentralPlazaTopHeight } from '../terrain';

/**
 * A soft column of warm light over the Start Here bench that guides a first-time visitor from the spawn
 * point. It fades out for good once the Start Here panel has been opened in this visit.
 */
export function StartHereBeacon() {
  const [dismissed, setDismissed] = useState(false);
  const groupRef = useRef<Group>(null);
  const columnRef = useRef<MeshBasicMaterial>(null);
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
    // Reduced motion: a steady glow, no pulse or spin (the fade-out after Start Here opens is kept).
    const still = prefersReducedMotion();
    const pulse = still ? 0.85 : 0.75 + Math.sin(clock.elapsedTime * 2.2) * 0.25;
    if (columnRef.current) columnRef.current.opacity = 0.22 * pulse * fade.current;
    if (ringRef.current) ringRef.current.opacity = 0.5 * pulse * fade.current;
    if (groupRef.current) {
      groupRef.current.visible = fade.current > 0.01;
      if (!still) groupRef.current.rotation.y = clock.elapsedTime * 0.4;
    }
  });

  return (
    <group ref={groupRef} position={[START_HERE_ANCHOR.x, getCentralPlazaTopHeight(), START_HERE_ANCHOR.z]}>
      {/* Short enough that it never lines up with the lighthouse lamp from the spawn point. */}
      <mesh position={[0, 2.6, 0]}>
        <cylinderGeometry args={[0.7, 1.15, 5.2, 24, 1, true]} />
        <meshBasicMaterial
          ref={columnRef}
          color="#ffb347"
          transparent
          opacity={0.16}
          blending={AdditiveBlending}
          depthWrite={false}
          side={DoubleSide}
          toneMapped={false}
        />
      </mesh>
      <mesh position={[0, 0.14, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.25, 1.45, 48]} />
        <meshBasicMaterial
          ref={ringRef}
          color="#ffc46b"
          transparent
          opacity={0.5}
          blending={AdditiveBlending}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>
    </group>
  );
}
