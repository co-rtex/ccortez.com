import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import type { Group } from 'three';

import type { ExperienceSceneProps } from '../../../src/types/experience';

const orbitOffsets: Array<[number, number, number]> = [
  [3.2, 2.4, 0],
  [-2.8, 2.1, 1.7],
  [1.1, 3.1, -2.6],
];

export default function OrbitalWorkbenchScene({ anchor, isFocused }: ExperienceSceneProps) {
  const rootRef = useRef<Group>(null);

  useFrame(({ clock }) => {
    const root = rootRef.current;
    if (!root) {
      return;
    }

    root.rotation.y = clock.elapsedTime * 0.18;
  });

  return (
    <group ref={rootRef} position={[anchor.x, anchor.y, anchor.z]}>
      <mesh castShadow receiveShadow position={[0, 0.5, 0]}>
        <cylinderGeometry args={[2.4, 2.8, 1.1, 22]} />
        <meshStandardMaterial color={isFocused ? '#f4c16d' : '#95b9b9'} roughness={0.45} metalness={0.3} />
      </mesh>

      <mesh castShadow receiveShadow position={[0, 1.35, 0]}>
        <boxGeometry args={[2.9, 0.35, 2.1]} />
        <meshStandardMaterial color="#e9e1d2" roughness={0.65} />
      </mesh>

      {orbitOffsets.map((offset, index) => (
        <mesh key={`orbiter-${index}`} castShadow position={offset}>
          <icosahedronGeometry args={[0.45, 1]} />
          <meshStandardMaterial
            color={isFocused ? '#ef8e2b' : '#587a8d'}
            emissive={isFocused ? '#cf6522' : '#173443'}
            emissiveIntensity={isFocused ? 0.55 : 0.2}
            roughness={0.22}
            metalness={0.65}
          />
        </mesh>
      ))}
    </group>
  );
}
