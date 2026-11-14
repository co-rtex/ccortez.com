import { Text } from '@react-three/drei';
import { useMemo } from 'react';
import { Shape } from 'three';
import labelFontBold from '@fontsource/manrope/files/manrope-latin-700-normal.woff?url';

import { getTerrainHeight } from '../terrain';
import { TRAIL_SIGNS } from './trailSignLayout';

/** Wooden fingerposts where each trail leaves the plaza, naming where it goes. */

const BOARD_LENGTH = 1.9;
const BOARD_HEIGHT = 0.42;

/** A small upward arrowhead above the board: "this way, ahead". */
function arrowShape(): Shape {
  const shape = new Shape();
  shape.moveTo(-0.16, -0.1);
  shape.lineTo(0.16, -0.1);
  shape.lineTo(0, 0.12);
  shape.closePath();
  return shape;
}

export function TrailSigns() {
  const shape = useMemo(() => arrowShape(), []);
  return (
    <group>
      {TRAIL_SIGNS.map((sign) => (
        <group
          key={sign.trailId}
          position={[sign.x, getTerrainHeight(sign.x, sign.z), sign.z]}
          // Face back toward the plaza, where visitors approach; the arrowhead on top points down the trail.
          rotation={[0, sign.rotationY + Math.PI, 0]}
        >
          <mesh castShadow position={[0, 0.85, -0.06]}>
            <cylinderGeometry args={[0.06, 0.075, 1.7, 8]} />
            <meshStandardMaterial color="#7a5236" roughness={0.9} />
          </mesh>
          <mesh castShadow position={[0, 1.42, 0]}>
            <boxGeometry args={[BOARD_LENGTH - 0.3, BOARD_HEIGHT, 0.06]} />
            <meshStandardMaterial color="#c99a68" roughness={0.85} />
          </mesh>
          <mesh castShadow position={[0, 1.42 + BOARD_HEIGHT / 2 + 0.12, 0]}>
            <extrudeGeometry args={[shape, { depth: 0.06, bevelEnabled: false }]} />
            <meshStandardMaterial color="#d27a52" roughness={0.8} />
          </mesh>
          {[0, Math.PI].map((turn) => (
            <Text
              key={turn}
              font={labelFontBold}
              position={[0, 1.42, turn === 0 ? 0.035 : -0.035]}
              rotation={[0, turn, 0]}
              fontSize={0.2}
              color="#3a2a1c"
              anchorX="center"
              anchorY="middle"
              maxWidth={BOARD_LENGTH - 0.5}
            >
              {sign.label}
            </Text>
          ))}
        </group>
      ))}
    </group>
  );
}
