import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import { BufferAttribute, BufferGeometry, Color, Vector2 } from 'three';
import type { ShaderMaterial } from 'three';

import type { WaterBodyDefinition } from '../constants';
import { SCENIC_FORWARD_XZ } from '../scenic';
import { getLakeBoundaryPolyline, getWaterSurfaceHeight } from '../terrain';

/**
 * Opaque stylized lake: one radial mesh from the lake centre to its shoreline. A per-vertex `shore` value
 * (0 at the centre, 1 at the waterline) drives the deep-to-shallow gradient and a soft animated foam line, so the
 * grassy basin never shows through and the edge matches the walkability boundary exactly.
 */

const RINGS = [0, 0.18, 0.36, 0.52, 0.66, 0.78, 0.87, 0.93, 0.97, 1];
const SEGMENTS = 96;

function buildLakeGeometry(body: WaterBodyDefinition): BufferGeometry {
  const rings = RINGS.map((scale) => getLakeBoundaryPolyline(body, SEGMENTS, Math.max(scale, 0.0001)));
  const columns = SEGMENTS + 1;
  const positions = new Float32Array(RINGS.length * columns * 3);
  const shore = new Float32Array(RINGS.length * columns);
  const indices: number[] = [];

  rings.forEach((ring, ringIndex) => {
    ring.forEach((point, column) => {
      const index = ringIndex * columns + column;
      positions[index * 3] = point.x;
      positions[index * 3 + 1] = 0;
      positions[index * 3 + 2] = point.z;
      shore[index] = RINGS[ringIndex]!;
    });
  });

  for (let ring = 0; ring < RINGS.length - 1; ring += 1) {
    for (let column = 0; column < SEGMENTS; column += 1) {
      const a = ring * columns + column;
      const b = a + 1;
      const c = a + columns;
      const d = c + 1;
      indices.push(a, b, c, b, d, c);
    }
  }

  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new BufferAttribute(positions, 3));
  geometry.setAttribute('shore', new BufferAttribute(shore, 1));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

const VERTEX = /* glsl */ `
attribute float shore;
varying float vShore;
varying vec3 vWorld;
void main() {
  vShore = shore;
  vec4 world = modelMatrix * vec4(position, 1.0);
  vWorld = world.xyz;
  gl_Position = projectionMatrix * viewMatrix * world;
}
`;

const FRAGMENT = /* glsl */ `
uniform float uTime;
uniform float uSeed;
uniform vec3 uDeep;
uniform vec3 uShallow;
uniform vec3 uFoam;
uniform vec3 uGlint;
uniform vec2 uSunDir;
varying float vShore;
varying vec3 vWorld;

void main() {
  vec2 p = vWorld.xz;
  float depth = smoothstep(0.45, 0.97, vShore);
  vec3 color = mix(uDeep, uShallow, depth);

  // Slow drifting ripples, strongest in open water.
  float r1 = sin(dot(p, vec2(0.9, 0.4)) * 1.7 + uTime * 0.9 + uSeed);
  float r2 = sin(dot(p, vec2(-0.3, 1.0)) * 2.3 - uTime * 0.7);
  float ripple = smoothstep(0.82, 1.0, r1 * r2) * (1.0 - depth * 0.6);
  color = mix(color, uGlint, ripple * 0.14);

  // Warm glints on the sunset side of the lake.
  vec3 view = normalize(cameraPosition - vWorld);
  float sunSide = pow(max(dot(normalize(view.xz), -uSunDir), 0.0), 3.0);
  color = mix(color, vec3(1.0, 0.86, 0.66), sunSide * ripple * 0.35);

  // Foam line hugging the shore, breathing slightly.
  float foamBand = smoothstep(0.9, 0.975, vShore) * (1.0 - smoothstep(0.99, 1.0, vShore) * 0.4);
  float breathe = 0.75 + 0.25 * sin(uTime * 1.4 + atan(p.y, p.x) * 6.0 + uSeed);
  color = mix(color, uFoam, foamBand * breathe * 0.75);

  gl_FragColor = vec4(color, 1.0);
  #include <colorspace_fragment>
}
`;

export function LakeWater({ body }: { body: WaterBodyDefinition }) {
  const geometry = useMemo(() => buildLakeGeometry(body), [body]);
  const materialRef = useRef<ShaderMaterial>(null);
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uSeed: { value: body.seed },
      uDeep: { value: new Color('#2a87a8') },
      uShallow: { value: new Color('#62cfc9') },
      uFoam: { value: new Color('#effcf7') },
      uGlint: { value: new Color('#d9f6ff') },
      uSunDir: { value: new Vector2(SCENIC_FORWARD_XZ.x, SCENIC_FORWARD_XZ.z) },
    }),
    [body.seed],
  );

  useFrame(({ clock }) => {
    if (materialRef.current) materialRef.current.uniforms.uTime!.value = clock.elapsedTime;
  });

  return (
    <mesh geometry={geometry} position={[0, getWaterSurfaceHeight(body) + 0.02, 0]} renderOrder={0}>
      <shaderMaterial ref={materialRef} vertexShader={VERTEX} fragmentShader={FRAGMENT} uniforms={uniforms} />
    </mesh>
  );
}
