import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import type { Group } from 'three';

import { RecruiterSceneShell, RevealStage } from '../_shared/recruiterBenchPrimitives';

import type { ExperienceSceneProps } from '../../../src/types/experience';

/**
 * Start Here: a welcome board with a small map of the island (the same ring of orange experience and blue
 * project stops the recruiter guide shows), flanked by two planters.
 */

const palette = {
  base: '#5a4a5f',
  surface: '#efe3cc',
  accent: '#f1a1a9',
  accentSoft: '#f6c39a',
  glow: '#ffe0a3',
  trim: '#f4ede4',
};

const STONE = '#efe3cc';
const WOOD = '#8f6342';
const EXPERIENCE = '#ea8f2b';
const PROJECT = '#5f9cff';

function IslandMapBoard() {
  const starRef = useRef<Group>(null);
  // Seven experience stops on one side of the ring and eleven projects on the other, with the north gap.
  const stops = useMemo(() => {
    const slots = 19;
    return Array.from({ length: slots - 1 }, (_, index) => {
      const slot = index + 1;
      const angle = (slot / slots) * Math.PI * 2;
      return {
        x: -Math.sin(angle) * 0.42,
        y: Math.cos(angle) * 0.3,
        color: slot <= 7 ? EXPERIENCE : PROJECT,
      };
    });
  }, []);

  useFrame(({ clock }) => {
    if (starRef.current) starRef.current.rotation.z = Math.sin(clock.elapsedTime * 0.6) * 0.15;
  });

  return (
    <group position={[0, 0, -0.55]}>
      {[-0.7, 0.7].map((x) => (
        <mesh key={x} castShadow position={[x, 0.62, 0]}>
          <cylinderGeometry args={[0.05, 0.06, 1.24, 8]} />
          <meshStandardMaterial color={WOOD} roughness={0.85} />
        </mesh>
      ))}
      <group position={[0, 1.18, 0.02]} rotation={[-0.12, 0, 0]}>
        <mesh castShadow>
          <boxGeometry args={[1.62, 0.98, 0.06]} />
          <meshStandardMaterial color={WOOD} roughness={0.8} />
        </mesh>
        <mesh position={[0, 0, 0.032]}>
          <planeGeometry args={[1.48, 0.84]} />
          <meshStandardMaterial color="#7fd0cf" roughness={0.9} />
        </mesh>
        {/* Island, plaza and lawn. */}
        <mesh position={[0, 0, 0.036]} scale={[1, 0.74, 1]}>
          <circleGeometry args={[0.56, 40]} />
          <meshStandardMaterial color="#9ccc58" roughness={0.9} />
        </mesh>
        <mesh position={[0, 0, 0.038]} scale={[1, 0.72, 1]}>
          <ringGeometry args={[0.36, 0.48, 40]} />
          <meshStandardMaterial color={STONE} roughness={0.85} />
        </mesh>
        {stops.map((stop, index) => (
          <mesh key={index} position={[stop.x, stop.y, 0.042]}>
            <circleGeometry args={[0.032, 12]} />
            <meshStandardMaterial color={stop.color} emissive={stop.color} emissiveIntensity={0.35} />
          </mesh>
        ))}
        {/* "You are here": the Start Here stop just south of the fountain. */}
        <mesh position={[0, 0.06, 0.042]}>
          <circleGeometry args={[0.05, 16]} />
          <meshStandardMaterial color="#ffe0a3" emissive="#ffc46b" emissiveIntensity={0.9} toneMapped={false} />
        </mesh>
        <group ref={starRef} position={[0, -0.04, 0.042]}>
          <mesh rotation={[0, 0, Math.PI / 4]}>
            <circleGeometry args={[0.07, 4]} />
            <meshStandardMaterial color="#d98a5f" />
          </mesh>
        </group>
      </group>
    </group>
  );
}

function Planter({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh castShadow receiveShadow position={[0, 0.22, 0]}>
        <cylinderGeometry args={[0.32, 0.26, 0.44, 16]} />
        <meshStandardMaterial color="#d98a5f" roughness={0.8} />
      </mesh>
      <mesh castShadow position={[0, 0.66, 0]}>
        <icosahedronGeometry args={[0.38, 1]} />
        <meshStandardMaterial color="#5fae55" roughness={0.8} flatShading />
      </mesh>
      {[0, 1, 2, 3].map((index) => (
        <mesh key={index} position={[Math.cos(index * 1.7) * 0.28, 0.78 + (index % 2) * 0.1, Math.sin(index * 1.7) * 0.28]}>
          <icosahedronGeometry args={[0.06, 0]} />
          <meshStandardMaterial color={index % 2 ? '#ff9fc7' : '#ffd875'} flatShading />
        </mesh>
      ))}
    </group>
  );
}

export default function AboutMeOverviewScene(props: ExperienceSceneProps) {
  return (
    <RecruiterSceneShell {...props} palette={palette}>
      <RevealStage stage={2}>
        <IslandMapBoard />
      </RevealStage>
      <RevealStage stage={3}>
        <Planter position={[-1.25, 0, -0.35]} />
        <Planter position={[1.25, 0, -0.35]} />
      </RevealStage>
    </RecruiterSceneShell>
  );
}
