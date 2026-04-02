import { Text } from '@react-three/drei';

import { getTerrainHeight } from './terrain';

const MARKERS = [
  {
    id: 'work',
    label: 'Work Experience',
    sublabel: 'Roles and operational impact',
    x: -11.6,
    z: 4.2,
    color: '#f0b06a',
  },
  {
    id: 'projects',
    label: 'Projects',
    sublabel: 'Products, systems, and experiments',
    x: 11.4,
    z: 10.2,
    color: '#83d0e9',
  },
];

export function RecruiterArcMarkers() {
  return (
    <>
      {MARKERS.map((marker) => {
        const y = getTerrainHeight(marker.x, marker.z);
        return (
          <group key={marker.id} position={[marker.x, y, marker.z]}>
            <mesh receiveShadow position={[0, 0.06, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <circleGeometry args={[1.2, 24]} />
              <meshStandardMaterial color="#27353d" transparent opacity={0.55} roughness={0.88} />
            </mesh>
            <mesh position={[0, 0.065, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <ringGeometry args={[1.02, 1.12, 32]} />
              <meshStandardMaterial
                color={marker.color}
                emissive={marker.color}
                emissiveIntensity={0.3}
                roughness={0.22}
              />
            </mesh>
            <Text
              position={[0, 0.92, 0]}
              fontSize={0.48}
              color="#f6f0e5"
              anchorX="center"
              anchorY="middle"
              outlineWidth={0.02}
              outlineColor="#132026"
            >
              {marker.label}
            </Text>
            <Text
              position={[0, 0.46, 0]}
              fontSize={0.18}
              color="#dce7ea"
              anchorX="center"
              anchorY="middle"
              maxWidth={4}
            >
              {marker.sublabel}
            </Text>
          </group>
        );
      })}
    </>
  );
}
