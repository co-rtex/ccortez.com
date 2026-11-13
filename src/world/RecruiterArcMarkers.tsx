import { Text } from '@react-three/drei';
// Self-hosted label fonts: without a `font`, troika downloads fallback fonts from a public CDN at runtime.
// troika reads woff/ttf/otf, not woff2.
import labelFontBold from '@fontsource/manrope/files/manrope-latin-700-normal.woff?url';
import labelFontRegular from '@fontsource/manrope/files/manrope-latin-500-normal.woff?url';

import { PLAZA_DISTRICT_MARKER_ANGLES, PLAZA_DISTRICT_MARKER_RADIUS, plazaPoint } from './islandPaths';
import { getTerrainHeight } from './terrain';

const [workX, workZ] = plazaPoint(PLAZA_DISTRICT_MARKER_ANGLES.work, PLAZA_DISTRICT_MARKER_RADIUS);
const [projectsX, projectsZ] = plazaPoint(PLAZA_DISTRICT_MARKER_ANGLES.projects, PLAZA_DISTRICT_MARKER_RADIUS);

const MARKERS = [
  {
    id: 'work',
    label: 'Work Experience',
    sublabel: 'Roles and operational impact',
    x: workX,
    z: workZ,
    color: '#f4b46e',
  },
  {
    id: 'projects',
    label: 'Projects',
    sublabel: 'Products, systems, and experiments',
    x: projectsX,
    z: projectsZ,
    color: '#9cc8f4',
  },
];

export function RecruiterArcMarkers() {
  return (
    <>
      {MARKERS.map((marker) => {
        const y = getTerrainHeight(marker.x, marker.z);
        return (
          <group key={marker.id} position={[marker.x, y, marker.z]}>
            {/* A standing district sign: two posts and a painted board facing the spawn side. */}
            {[-1.7, 1.7].map((x) => (
              <mesh key={x} castShadow position={[x, 0.75, 0]}>
                <cylinderGeometry args={[0.07, 0.09, 1.5, 8]} />
                <meshStandardMaterial color="#8f6342" roughness={0.85} />
              </mesh>
            ))}
            <mesh castShadow position={[0, 1.18, 0]}>
              <boxGeometry args={[3.9, 1.12, 0.12]} />
              <meshStandardMaterial color={marker.color} roughness={0.7} />
            </mesh>
            <mesh position={[0, 1.18, -0.065]}>
              <boxGeometry args={[3.98, 1.2, 0.02]} />
              <meshStandardMaterial color="#f3e3c3" roughness={0.8} />
            </mesh>
            <Text
              font={labelFontBold}
              position={[0, 1.32, 0.07]}
              fontSize={0.4}
              color="#2a2118"
              anchorX="center"
              anchorY="middle"
            >
              {marker.label}
            </Text>
            <Text
              font={labelFontRegular}
              position={[0, 0.95, 0.07]}
              fontSize={0.17}
              color="#3b2f22"
              anchorX="center"
              anchorY="middle"
              maxWidth={3.6}
            >
              {marker.sublabel}
            </Text>
          </group>
        );
      })}
    </>
  );
}
