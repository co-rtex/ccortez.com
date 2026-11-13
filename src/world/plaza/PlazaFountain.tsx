import { Sparkles } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import { Color, DoubleSide, LatheGeometry, QuadraticBezierCurve3, TubeGeometry, Vector2, Vector3 } from 'three';
import type { Group, ShaderMaterial } from 'three';

import { CENTRAL_PLAZA_FOUNTAIN_RADIUS } from '../hub';

/**
 * The plaza centrepiece: a moulded stone fountain with a lower basin, a raised bowl that spills eight arcs of
 * water, and a slowly turning brass armillary sphere on a column, tall enough to read from anywhere on the
 * island.
 */

const STONE = '#efe1c4';
const STONE_SHADE = '#d8c29b';
const TERRACOTTA = '#cf7c55';
const BRASS = '#d9a441';

const BASIN_OUTER = CENTRAL_PLAZA_FOUNTAIN_RADIUS + 0.2;
const BASIN_WATER_Y = 0.46;
const BOWL_Y = 1.62;
const BOWL_RADIUS = 1.05;
const ARMILLARY_Y = 4.55;

function lathe(points: Array<[number, number]>, segments = 56): LatheGeometry {
  return new LatheGeometry(points.map(([x, y]) => new Vector2(x, y)), segments);
}

const WATER_VERTEX = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const POOL_FRAGMENT = /* glsl */ `
uniform float uTime;
uniform vec3 uDeep;
uniform vec3 uShallow;
uniform vec3 uFoam;
varying vec2 vUv;
void main() {
  vec2 p = vUv - 0.5;
  float r = length(p) * 2.0;
  float ripples = sin(r * 34.0 - uTime * 3.2) * 0.5 + 0.5;
  ripples *= smoothstep(1.0, 0.25, r);
  float glints = pow(max(sin(p.x * 61.0 + uTime * 1.3) * sin(p.y * 57.0 - uTime * 1.1), 0.0), 8.0);
  vec3 color = mix(uDeep, uShallow, smoothstep(0.0, 1.0, r));
  color = mix(color, uFoam, ripples * 0.18 + glints * 0.5);
  color = mix(color, uFoam, smoothstep(0.86, 1.0, r) * 0.55);
  gl_FragColor = vec4(color, 0.94);
  #include <colorspace_fragment>
}
`;

const JET_FRAGMENT = /* glsl */ `
uniform float uTime;
uniform vec3 uColor;
varying vec2 vUv;
void main() {
  float flow = sin(vUv.x * 40.0 - uTime * 9.0) * 0.5 + 0.5;
  float fade = smoothstep(0.0, 0.08, vUv.x) * smoothstep(1.0, 0.82, vUv.x);
  gl_FragColor = vec4(uColor, (0.42 + flow * 0.36) * fade);
  #include <colorspace_fragment>
}
`;

function useWaterMaterialUniforms(colors: Record<string, string>) {
  return useMemo(
    () => ({
      uTime: { value: 0 },
      ...Object.fromEntries(Object.entries(colors).map(([key, value]) => [key, { value: new Color(value) }])),
    }),
    // Colours are module constants; build once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );
}

function Armillary() {
  const outerRef = useRef<Group>(null);
  const innerRef = useRef<Group>(null);

  useFrame((_, delta) => {
    if (outerRef.current) outerRef.current.rotation.y += delta * 0.18;
    if (innerRef.current) innerRef.current.rotation.x += delta * 0.32;
  });

  return (
    <group position={[0, ARMILLARY_Y, 0]}>
      <group ref={outerRef}>
        <mesh castShadow rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[1.02, 0.055, 12, 64]} />
          <meshStandardMaterial color={BRASS} metalness={0.75} roughness={0.32} />
        </mesh>
        <mesh castShadow>
          <torusGeometry args={[1.02, 0.055, 12, 64]} />
          <meshStandardMaterial color={BRASS} metalness={0.75} roughness={0.32} />
        </mesh>
        <group ref={innerRef}>
          <mesh castShadow rotation={[Math.PI / 2 - 0.41, 0, 0]}>
            <torusGeometry args={[0.84, 0.075, 12, 64]} />
            <meshStandardMaterial color={TERRACOTTA} metalness={0.2} roughness={0.5} />
          </mesh>
        </group>
        <mesh rotation={[0, 0, 0.41]}>
          <cylinderGeometry args={[0.025, 0.025, 2.6, 8]} />
          <meshStandardMaterial color={BRASS} metalness={0.75} roughness={0.32} />
        </mesh>
      </group>
      <mesh>
        <sphereGeometry args={[0.34, 32, 24]} />
        <meshStandardMaterial color="#ffd27a" emissive="#ffb347" emissiveIntensity={1.6} toneMapped={false} />
      </mesh>
    </group>
  );
}

export function PlazaFountain({ y }: { y: number }) {
  const geometries = useMemo(() => {
    const basin = lathe([
      [BASIN_OUTER - 0.42, 0],
      [BASIN_OUTER, 0],
      [BASIN_OUTER + 0.06, 0.08],
      [BASIN_OUTER, 0.16],
      [BASIN_OUTER - 0.04, 0.5],
      [BASIN_OUTER + 0.12, 0.56],
      [BASIN_OUTER + 0.12, 0.66],
      [BASIN_OUTER - 0.26, 0.66],
      [BASIN_OUTER - 0.3, 0.3],
    ]);
    const column = lathe([
      [0.62, 0],
      [0.62, 0.18],
      [0.42, 0.3],
      [0.32, 0.7],
      [0.3, 1.2],
      [0.44, 1.42],
      [BOWL_RADIUS, 1.58],
      [BOWL_RADIUS + 0.06, 1.7],
      [BOWL_RADIUS - 0.08, 1.74],
      [0.3, 1.66],
      [0.22, 1.9],
      [0.2, 3.2],
      [0.34, 3.36],
      [0.34, 3.5],
      [0.12, 3.62],
      [0.1, 3.95],
      [0, 3.95],
    ]);
    const jets = new Array(8).fill(0).map((_, index) => {
      const angle = (index / 8) * Math.PI * 2 + Math.PI / 8;
      const dir = new Vector3(Math.cos(angle), 0, Math.sin(angle));
      const start = dir.clone().multiplyScalar(BOWL_RADIUS + 0.04).setY(BOWL_Y + 0.08);
      const end = dir.clone().multiplyScalar(BASIN_OUTER - 0.62).setY(BASIN_WATER_Y + 0.02);
      const control = dir.clone().multiplyScalar(BOWL_RADIUS + 0.75).setY(BOWL_Y + 0.55);
      return new TubeGeometry(new QuadraticBezierCurve3(start, control, end), 24, 0.045, 6, false);
    });
    return { basin, column, jets };
  }, []);

  const poolUniforms = useWaterMaterialUniforms({ uDeep: '#2f9fbf', uShallow: '#6fd8de', uFoam: '#f4fdff' });
  const bowlUniforms = useWaterMaterialUniforms({ uDeep: '#43b3cc', uShallow: '#86e2e6', uFoam: '#f4fdff' });
  const jetUniforms = useWaterMaterialUniforms({ uColor: '#e6fbff' });
  const poolRef = useRef<ShaderMaterial>(null);
  const bowlRef = useRef<ShaderMaterial>(null);
  const jetRef = useRef<ShaderMaterial>(null);

  useFrame(({ clock }) => {
    for (const ref of [poolRef, bowlRef, jetRef]) {
      if (ref.current) ref.current.uniforms.uTime!.value = clock.elapsedTime;
    }
  });

  return (
    <group position={[0, y, 0]}>
      <mesh castShadow receiveShadow geometry={geometries.basin}>
        <meshStandardMaterial color={STONE} roughness={0.82} />
      </mesh>
      <mesh position={[0, 0.6, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[BASIN_OUTER - 0.24, BASIN_OUTER + 0.1, 64]} />
        <meshStandardMaterial color={TERRACOTTA} roughness={0.7} side={DoubleSide} polygonOffset polygonOffsetFactor={-2} />
      </mesh>
      <mesh position={[0, BASIN_WATER_Y, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[BASIN_OUTER - 0.27, 64]} />
        <shaderMaterial ref={poolRef} vertexShader={WATER_VERTEX} fragmentShader={POOL_FRAGMENT} uniforms={poolUniforms} transparent />
      </mesh>

      <mesh castShadow receiveShadow geometry={geometries.column}>
        <meshStandardMaterial color={STONE_SHADE} roughness={0.78} />
      </mesh>
      <mesh position={[0, BOWL_Y + 0.08, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[BOWL_RADIUS - 0.06, 48]} />
        <shaderMaterial ref={bowlRef} vertexShader={WATER_VERTEX} fragmentShader={POOL_FRAGMENT} uniforms={bowlUniforms} transparent />
      </mesh>

      {geometries.jets.map((geometry, index) => (
        <mesh key={index} geometry={geometry}>
          <shaderMaterial
            ref={index === 0 ? jetRef : undefined}
            vertexShader={WATER_VERTEX}
            fragmentShader={JET_FRAGMENT}
            uniforms={jetUniforms}
            transparent
            depthWrite={false}
          />
        </mesh>
      ))}

      <Armillary />

      <Sparkles count={26} speed={0.3} size={2.2} color="#f2feff" opacity={0.5} scale={[4.6, 1.2, 4.6]} position={[0, 0.9, 0]} />
      <pointLight position={[0, ARMILLARY_Y, 0]} color="#ffbe6b" intensity={6} distance={14} decay={1.6} />
    </group>
  );
}
