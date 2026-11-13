import { useMemo } from 'react';
import { LatheGeometry, Vector2 } from 'three';

import { LIGHTHOUSE } from '../islandPaths';
import { getTerrainHeight } from '../terrain';

/**
 * North-shore lighthouse at the end of the north trail. Cream tower with terracotta bands and a warm lantern: a
 * second landmark that is visible from the plaza and gives the trail a destination.
 */

const TOWER_HEIGHT = 7.4;
const BASE_RADIUS = 1.22;
const TOP_RADIUS = 0.82;
const CREAM = '#f4ead6';
const TERRACOTTA = '#d27a52';
const BRASS = '#d4a24c';

function towerRadiusAt(y: number): number {
  return BASE_RADIUS + (TOP_RADIUS - BASE_RADIUS) * (y / TOWER_HEIGHT);
}

export function Lighthouse() {
  const groundY = getTerrainHeight(LIGHTHOUSE.x, LIGHTHOUSE.z);
  // Door faces the island centre, where the trail arrives.
  const facing = Math.atan2(-LIGHTHOUSE.x, -LIGHTHOUSE.z);
  const tower = useMemo(
    () =>
      new LatheGeometry(
        [
          [BASE_RADIUS, 0],
          [towerRadiusAt(TOWER_HEIGHT * 0.5), TOWER_HEIGHT * 0.5],
          [TOP_RADIUS, TOWER_HEIGHT],
          [0, TOWER_HEIGHT],
        ].map(([x, y]) => new Vector2(x, y)),
        40,
      ),
    [],
  );

  const bands = [1.9, 3.9, 5.9];

  return (
    <group position={[LIGHTHOUSE.x, groundY, LIGHTHOUSE.z]} rotation={[0, facing, 0]}>
      <mesh castShadow receiveShadow position={[0, 0.2, 0]}>
        <cylinderGeometry args={[1.75, 1.9, 0.4, 32]} />
        <meshStandardMaterial color="#d9c6a1" roughness={0.9} />
      </mesh>
      <mesh castShadow receiveShadow position={[0, 0.4, 0]} geometry={tower}>
        <meshStandardMaterial color={CREAM} roughness={0.75} />
      </mesh>
      {bands.map((y) => {
        const r = towerRadiusAt(y) + 0.015;
        return (
          <mesh key={y} castShadow position={[0, 0.4 + y, 0]}>
            <cylinderGeometry args={[towerRadiusAt(y + 0.35) + 0.015, r, 0.7, 40, 1, true]} />
            <meshStandardMaterial color={TERRACOTTA} roughness={0.7} />
          </mesh>
        );
      })}
      {/* Door and a round window, on the trail side. */}
      <mesh position={[0, 1.15, BASE_RADIUS - 0.02]}>
        <boxGeometry args={[0.7, 1.3, 0.12]} />
        <meshStandardMaterial color="#7a5236" roughness={0.8} />
      </mesh>
      <mesh position={[0, 4.6, towerRadiusAt(4.6 - 0.4) + 0.03]} rotation={[-Math.atan((BASE_RADIUS - TOP_RADIUS) / TOWER_HEIGHT), 0, 0]}>
        <circleGeometry args={[0.2, 20]} />
        <meshStandardMaterial color="#ffe0a3" emissive="#ffc46b" emissiveIntensity={0.8} toneMapped={false} />
      </mesh>

      {/* Gallery, lantern room, roof. */}
      <group position={[0, 0.4 + TOWER_HEIGHT, 0]}>
        <mesh castShadow receiveShadow position={[0, 0.06, 0]}>
          <cylinderGeometry args={[1.18, 1.1, 0.14, 32]} />
          <meshStandardMaterial color="#5b5148" roughness={0.6} />
        </mesh>
        <mesh position={[0, 0.42, 0]}>
          <torusGeometry args={[1.12, 0.03, 6, 40]} />
          <meshStandardMaterial color="#5b5148" roughness={0.6} />
        </mesh>
        <mesh position={[0, 0.62, 0]}>
          <cylinderGeometry args={[0.62, 0.62, 0.95, 16]} />
          <meshStandardMaterial
            color="#fff1c8"
            emissive="#ffc970"
            emissiveIntensity={1.3}
            toneMapped={false}
            transparent
            opacity={0.92}
          />
        </mesh>
        <mesh castShadow position={[0, 1.42, 0]}>
          <coneGeometry args={[0.88, 0.75, 16]} />
          <meshStandardMaterial color={TERRACOTTA} roughness={0.65} />
        </mesh>
        <mesh position={[0, 1.88, 0]}>
          <sphereGeometry args={[0.12, 16, 12]} />
          <meshStandardMaterial color={BRASS} metalness={0.8} roughness={0.25} />
        </mesh>
      </group>
    </group>
  );
}
