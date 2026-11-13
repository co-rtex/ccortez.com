import { Text } from '@react-three/drei';
import { useMemo } from 'react';
import { Shape } from 'three';
import labelFontBold from '@fontsource/manrope/files/manrope-latin-700-normal.woff?url';

import { getTerrainHeight } from '../terrain';
import { TRAIL_SIGNS } from './trailSignLayout';

/** Wooden fingerposts where each trail leaves the plaza, naming where it goes. */

const BOARD_LENGTH = 1.9;
const BOARD_HEIGHT = 0.42;

function arrowShape(): Shape {
  const shape = new Shape();
  const half = BOARD_HEIGHT / 2;
  shape.moveTo(-BOARD_LENGTH / 2, -half);
  shape.lineTo(BOARD_LENGTH / 2 - 0.25, -half);
  shape.lineTo(BOARD_LENGTH / 2, 0);
  shape.lineTo(BOARD_LENGTH / 2 - 0.25, half);
  shape.lineTo(-BOARD_LENGTH / 2, half);
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
          rotation={[0, sign.rotationY - Math.PI / 2, 0]}
        >
          <mesh castShadow position={[-BOARD_LENGTH / 2 + 0.15, 0.85, 0]}>
            <cylinderGeometry args={[0.06, 0.075, 1.7, 8]} />
            <meshStandardMaterial color="#7a5236" roughness={0.9} />
          </mesh>
          <mesh castShadow position={[0, 1.42, 0]}>
            <extrudeGeometry args={[shape, { depth: 0.06, bevelEnabled: false }]} />
            <meshStandardMaterial color="#c99a68" roughness={0.85} />
          </mesh>
          {[0, Math.PI].map((turn) => (
            <Text
              key={turn}
              font={labelFontBold}
              position={[0, 1.42, turn === 0 ? 0.065 : -0.005]}
              rotation={[0, turn, 0]}
              fontSize={0.2}
              color="#3a2a1c"
              anchorX="center"
              anchorY="middle"
              maxWidth={BOARD_LENGTH - 0.4}
            >
              {sign.label}
            </Text>
          ))}
        </group>
      ))}
    </group>
  );
}
