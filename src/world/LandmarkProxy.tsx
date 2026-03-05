import { Float, Html } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import type { Group, MeshStandardMaterial, PointLight } from 'three';

import type { ExperienceManifest } from '../types/experience';

interface LandmarkProxyProps {
  manifest: ExperienceManifest;
  isNearby: boolean;
  onOpen: (id: string) => void;
}

function makeSeed(id: string): number {
  return id.split('').reduce((total, char) => total + char.charCodeAt(0), 0) * 0.06;
}

export function LandmarkProxy({ manifest, isNearby, onOpen }: LandmarkProxyProps) {
  const groupRef = useRef<Group>(null);
  const haloMaterialRef = useRef<MeshStandardMaterial>(null);
  const coreLightRef = useRef<PointLight>(null);
  const bobSeed = useMemo(() => makeSeed(manifest.id), [manifest.id]);

  useFrame(({ clock }) => {
    const group = groupRef.current;
    if (!group) {
      return;
    }

    const bob = Math.sin(clock.elapsedTime * 1.8 + bobSeed) * 0.11;
    group.position.y = manifest.worldAnchor.y + bob;

    const haloMaterial = haloMaterialRef.current;
    if (haloMaterial) {
      const pulse = 0.55 + Math.sin(clock.elapsedTime * 3.2 + bobSeed) * 0.2;
      haloMaterial.emissiveIntensity = isNearby ? 1.2 + pulse * 0.9 : 0.55 + pulse * 0.35;
    }

    const light = coreLightRef.current;
    if (light) {
      const pulse = 0.5 + Math.sin(clock.elapsedTime * 3.4 + bobSeed) * 0.2;
      light.intensity = isNearby ? 2.4 + pulse * 1.8 : 0.9 + pulse * 0.55;
    }
  });

  return (
    <group
      ref={groupRef}
      position={[manifest.worldAnchor.x, manifest.worldAnchor.y, manifest.worldAnchor.z]}
      onPointerDown={(event) => {
        event.stopPropagation();
        onOpen(manifest.id);
      }}
      onPointerOver={() => {
        document.body.style.cursor = 'pointer';
      }}
      onPointerOut={() => {
        document.body.style.cursor = 'default';
      }}
    >
      <pointLight
        ref={coreLightRef}
        position={[0, 1.8, 0]}
        distance={10}
        color={isNearby ? '#ffc07f' : '#7cbfd1'}
        decay={2}
      />

      <mesh castShadow receiveShadow position={[0, 0.22, 0]}>
        <cylinderGeometry args={[1.45, 1.68, 0.44, 30]} />
        <meshStandardMaterial
          color={isNearby ? '#78573d' : '#36474f'}
          roughness={0.46}
          metalness={0.4}
          emissive={isNearby ? '#62391f' : '#122229'}
          emissiveIntensity={0.35}
        />
      </mesh>

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.48, 0]}>
        <torusGeometry args={[1.18, 0.12, 14, 36]} />
        <meshStandardMaterial
          ref={haloMaterialRef}
          color={isNearby ? '#ffc470' : '#6ca9bf'}
          emissive={isNearby ? '#f0852a' : '#2a7088'}
          emissiveIntensity={0.9}
          roughness={0.3}
          metalness={0.6}
        />
      </mesh>

      <Float speed={1.6} rotationIntensity={0.35} floatIntensity={0.45}>
        <mesh castShadow position={[0, 1.55, 0]}>
          <octahedronGeometry args={[0.68, 0]} />
          <meshPhysicalMaterial
            color={isNearby ? '#ffcf92' : '#7bc5d8'}
            roughness={0.08}
            metalness={0.25}
            clearcoat={1}
            clearcoatRoughness={0.05}
            transmission={0.35}
            thickness={0.9}
            ior={1.42}
            emissive={isNearby ? '#d86b23' : '#1f5f75'}
            emissiveIntensity={isNearby ? 0.75 : 0.35}
          />
        </mesh>
      </Float>

      {isNearby ? (
        <Html center distanceFactor={14} position={[0, 3.1, 0]}>
          <div className="landmark-tooltip">Press E or Click</div>
        </Html>
      ) : null}
    </group>
  );
}
