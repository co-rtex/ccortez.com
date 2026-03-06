import { Line, Sparkles } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import {
  BackSide,
  BufferAttribute,
  Color,
  Group,
  MathUtils,
  MeshBasicMaterial,
  PlaneGeometry,
  Shape,
  ShapeGeometry,
  Vector3,
} from 'three';

import { WORLD_BOUNDS, WORLD_WATER_BODIES } from './constants';
import {
  BOULDER_POINTS,
  BUSH_POINTS,
  COASTAL_ROCK_POINTS,
  FLOWER_POINTS,
  SPAWN_HUB_RADIUS,
  TREE_POINTS,
} from './biome';
import {
  OCEAN_LEVEL,
  LAKE_SHORELINE_SAMPLE_DETAIL,
  getIslandDistanceNormalized,
  getLakeBoundaryPolyline,
  getNearestLakeShoreSignedDistance,
  getTerrainHeight,
  getWaterSurfaceHeight,
  isPointWaterBlocked,
} from './terrain';
import { SCENIC_REST_SPOTS } from './restSpots';
import {
  SCENIC_FORWARD_XZ,
  SCENIC_SUN_LIGHT_DISTANCE,
  SCENIC_SUN_LIGHT_HEIGHT,
} from './scenic';
import { AmbientBirds } from './AmbientBirds';
import { AmbientCritters } from './AmbientCritters';
import { LakeFaunaManager } from './LakeFaunaManager';
import { planeXYToWorldXZ, worldXZToPlaneXY } from './renderSpace';

import type { WaterBodyDefinition } from './constants';
import type { RockPoint, ScatterPoint } from './biome';
import type { ScenicRestSpotDefinition } from './restSpots';

function buildTerrainGeometry(): PlaneGeometry {
  const geometry = new PlaneGeometry(430, 430, 360, 360);
  const positions = geometry.attributes.position;
  const colors = new Float32Array(positions.count * 3);
  const color = new Color();

  for (let index = 0; index < positions.count; index += 1) {
    const worldX = positions.getX(index);
    const worldZ = planeXYToWorldXZ({ x: worldX, y: positions.getY(index) }).z;
    const height = getTerrainHeight(worldX, worldZ);

    positions.setZ(index, height);

    const islandDistance = getIslandDistanceNormalized(worldX, worldZ);
    const moisture = MathUtils.clamp(
      0.58 + Math.sin(worldX * 0.03 - worldZ * 0.024) * 0.26,
      0,
      1,
    );
    const nearOcean = MathUtils.clamp((height - OCEAN_LEVEL) / 1.15, 0, 1);

    if (height < OCEAN_LEVEL + 0.62) {
      const hue = 0.1 + (1 - nearOcean) * 0.03;
      const saturation = 0.58 - (1 - nearOcean) * 0.2;
      const lightness = MathUtils.clamp(0.63 - (1 - nearOcean) * 0.3, 0.31, 0.72);
      color.setHSL(hue, saturation, lightness);
    } else {
      const hue = 0.26 - height * 0.007 + islandDistance * 0.015;
      const saturation = 0.56 + moisture * 0.18;
      const lightness = MathUtils.clamp(0.24 + moisture * 0.25 + height * 0.05, 0.18, 0.7);
      color.setHSL(hue, saturation, lightness);
    }

    colors[index * 3] = color.r;
    colors[index * 3 + 1] = color.g;
    colors[index * 3 + 2] = color.b;
  }

  geometry.setAttribute('color', new BufferAttribute(colors, 3));
  geometry.computeVertexNormals();
  return geometry;
}

const SKY_DOME_RADIUS = 240;
const VISIBLE_SUN_DISTANCE = 180;
const VISIBLE_SUN_ELEVATION = 0.105;

const SUNSET_SKY_VERTEX_SHADER = `
varying vec3 vDirection;

void main() {
  vDirection = normalize(position);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const SUNSET_SKY_FRAGMENT_SHADER = `
uniform vec3 uEdgeBlue;
uniform vec3 uViolet;
uniform vec3 uMauve;
uniform vec3 uRose;
uniform vec3 uAmber;
uniform vec3 uTangerine;
uniform vec3 uGold;
uniform vec3 uYellow;
uniform vec3 uSunWhite;
uniform vec3 uSunDirection;
varying vec3 vDirection;

vec3 sunsetPalette(float t) {
  vec3 color = uSunWhite;
  color = mix(color, uYellow, smoothstep(0.02, 0.08, t));
  color = mix(color, uGold, smoothstep(0.08, 0.15, t));
  color = mix(color, uAmber, smoothstep(0.15, 0.26, t));
  color = mix(color, uTangerine, smoothstep(0.26, 0.4, t));
  color = mix(color, uRose, smoothstep(0.4, 0.56, t));
  color = mix(color, uMauve, smoothstep(0.56, 0.72, t));
  color = mix(color, uViolet, smoothstep(0.72, 0.86, t));
  color = mix(color, uEdgeBlue, smoothstep(0.86, 1.0, t));
  return color;
}

void main() {
  vec3 dir = normalize(vDirection);
  vec3 sunDir = normalize(uSunDirection);
  float up = clamp((dir.y + 1.0) * 0.5, 0.0, 1.0);
  float sunDot = clamp(dot(dir, sunDir), -1.0, 1.0);
  float sunDistance = acos(sunDot);
  float radialT = pow(clamp(sunDistance / 1.7, 0.0, 1.0), 0.92);

  vec3 color = sunsetPalette(radialT);

  float zenithCool = smoothstep(0.74, 1.0, up);
  color = mix(color, uEdgeBlue, zenithCool * 0.14);

  float horizonSoftness = exp(-pow((dir.y + 0.04) / 0.26, 2.0));
  color = mix(color, uRose, horizonSoftness * (1.0 - smoothstep(0.0, 0.34, radialT)) * 0.1);

  float whiteCore = smoothstep(0.11, 0.0, sunDistance);
  color = mix(color, uSunWhite, whiteCore * 0.26);

  gl_FragColor = vec4(color, 1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
`;

const WATER_RENDER_STYLE = {
  seamColor: '#335666',
  seamOpacity: 0.44,
  bedColor: '#173642',
  bedOpacity: 0.9,
  surfaceDeepColor: '#21495d',
  surfaceEdgeCoolColor: '#2d6176',
  surfaceWarmTintColor: '#6b566b',
  surfaceOpacity: 0.84,
  highlightColor: '#8fb8ca',
  highlightOpacity: 0.11,
  edgeColor: '#84aab8',
} as const;

function buildShape(points: Array<{ x: number; z: number }>): Shape {
  const [firstPoint, ...rest] = points;
  const shape = new Shape();
  const firstPlanePoint = firstPoint ? worldXZToPlaneXY(firstPoint) : { x: 0, y: 0 };

  shape.moveTo(firstPlanePoint.x, firstPlanePoint.y);
  for (const point of rest) {
    const planePoint = worldXZToPlaneXY(point);
    shape.lineTo(planePoint.x, planePoint.y);
  }
  shape.closePath();

  return shape;
}

function buildLakeSurfaceGeometry(points: Array<{ x: number; z: number }>, body: WaterBodyDefinition): ShapeGeometry {
  const geometry = new ShapeGeometry(buildShape(points));
  const positions = geometry.attributes.position;
  const colors = new Float32Array(positions.count * 3);
  const deepColor = new Color(WATER_RENDER_STYLE.surfaceDeepColor);
  const edgeCoolColor = new Color(WATER_RENDER_STYLE.surfaceEdgeCoolColor);
  const warmTintColor = new Color(WATER_RENDER_STYLE.surfaceWarmTintColor);
  const color = new Color();

  for (let index = 0; index < positions.count; index += 1) {
    const worldX = positions.getX(index);
    const worldZ = -positions.getY(index);
    const localX = worldX - body.centerX;
    const localZ = worldZ - body.centerZ;
    const radialLength = Math.hypot(localX, localZ) || 1;
    const radialX = localX / radialLength;
    const radialZ = localZ / radialLength;
    const sunFacing = Math.max(0, radialX * SCENIC_FORWARD_XZ.x + radialZ * SCENIC_FORWARD_XZ.z);
    const normalizedDistance = Math.hypot(localX / (body.radiusX * 1.06), localZ / (body.radiusZ * 1.06));
    const shoreBlend = MathUtils.smoothstep(normalizedDistance, 0.56, 1.02);
    const warmBlend = Math.pow(sunFacing, 1.8) * (0.08 + shoreBlend * 0.26);

    color.copy(deepColor);
    color.lerp(edgeCoolColor, shoreBlend * 0.58);
    color.lerp(warmTintColor, warmBlend);

    colors[index * 3] = color.r;
    colors[index * 3 + 1] = color.g;
    colors[index * 3 + 2] = color.b;
  }

  geometry.setAttribute('color', new BufferAttribute(colors, 3));
  return geometry;
}

function StylizedWater({ body }: { body: WaterBodyDefinition }) {
  const materialRef = useRef<MeshBasicMaterial>(null);
  const highlightMaterialRef = useRef<MeshBasicMaterial>(null);

  const lakeBoundary = useMemo(
    () => getLakeBoundaryPolyline(body, LAKE_SHORELINE_SAMPLE_DETAIL),
    [body],
  );
  const seamBoundary = useMemo(
    () => getLakeBoundaryPolyline(body, LAKE_SHORELINE_SAMPLE_DETAIL, 1.018),
    [body],
  );
  const bedGeometry = useMemo(() => new ShapeGeometry(buildShape(lakeBoundary)), [lakeBoundary]);
  const surfaceGeometry = useMemo(() => buildLakeSurfaceGeometry(lakeBoundary, body), [lakeBoundary, body]);
  const seamGeometry = useMemo(() => new ShapeGeometry(buildShape(seamBoundary)), [seamBoundary]);
  const highlightGeometry = useMemo(() => new ShapeGeometry(buildShape(getLakeBoundaryPolyline(body, 52, 0.9))), [body]);
  const edgePoints = useMemo(
    () => lakeBoundary.map((point) => [point.x, 0, point.z] as [number, number, number]),
    [lakeBoundary],
  );

  const waterY = getWaterSurfaceHeight(body);

  useFrame(({ clock }) => {
    const material = materialRef.current;
    const highlightMaterial = highlightMaterialRef.current;
    if (!material || !highlightMaterial) {
      return;
    }

    const shimmer = Math.sin(clock.elapsedTime * 1.2 + body.seed);
    material.opacity = WATER_RENDER_STYLE.surfaceOpacity + shimmer * 0.018;
    highlightMaterial.opacity =
      WATER_RENDER_STYLE.highlightOpacity + Math.sin(clock.elapsedTime * 1.7 + body.seed * 0.37) * 0.04;
  });

  return (
    <>
      <mesh rotation={[-Math.PI / 2, 0, 0]} geometry={seamGeometry} position={[0, waterY - 0.02, 0]}>
        <meshBasicMaterial
          color={WATER_RENDER_STYLE.seamColor}
          transparent
          opacity={WATER_RENDER_STYLE.seamOpacity}
          toneMapped={false}
        />
      </mesh>

      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} geometry={bedGeometry} position={[0, waterY - 0.44, 0]}>
        <meshBasicMaterial
          color={WATER_RENDER_STYLE.bedColor}
          transparent
          opacity={WATER_RENDER_STYLE.bedOpacity}
          toneMapped={false}
        />
      </mesh>

      <mesh rotation={[-Math.PI / 2, 0, 0]} geometry={surfaceGeometry} position={[0, waterY + 0.018, 0]}>
        <meshBasicMaterial
          ref={materialRef}
          vertexColors
          transparent
          opacity={WATER_RENDER_STYLE.surfaceOpacity}
          toneMapped={false}
        />
      </mesh>

      <mesh rotation={[-Math.PI / 2, 0, 0]} geometry={highlightGeometry} position={[0, waterY + 0.03, 0]}>
        <meshBasicMaterial
          ref={highlightMaterialRef}
          color={WATER_RENDER_STYLE.highlightColor}
          transparent
          opacity={WATER_RENDER_STYLE.highlightOpacity}
          toneMapped={false}
        />
      </mesh>

      <Line
        points={edgePoints.map((point) => [point[0], waterY + 0.032, point[2]])}
        color={WATER_RENDER_STYLE.edgeColor}
        lineWidth={1.2}
      />
    </>
  );
}

function StylizedTree({ point }: { point: ScatterPoint }) {
  const trunkHeight = 2.2 + ((point.seed * 0.09) % 1.02);
  const canopyRadius = 1.02 + ((point.seed * 0.04) % 0.45);
  const y = getTerrainHeight(point.x, point.z);

  return (
    <group position={[point.x, y, point.z]}>
      <mesh castShadow position={[0, trunkHeight * 0.5, 0]}>
        <cylinderGeometry args={[0.16, 0.26, trunkHeight, 12]} />
        <meshStandardMaterial color="#835330" roughness={0.9} />
      </mesh>

      <mesh castShadow position={[0, trunkHeight + 0.48, 0]}>
        <sphereGeometry args={[canopyRadius, 18, 18]} />
        <meshStandardMaterial color="#68be72" roughness={0.74} />
      </mesh>

      <mesh castShadow position={[0.42, trunkHeight + 0.2, 0.25]}>
        <sphereGeometry args={[canopyRadius * 0.74, 16, 16]} />
        <meshStandardMaterial color="#5aae69" roughness={0.76} />
      </mesh>

      <mesh castShadow position={[-0.36, trunkHeight + 0.1, -0.2]}>
        <sphereGeometry args={[canopyRadius * 0.68, 16, 16]} />
        <meshStandardMaterial color="#60b66f" roughness={0.76} />
      </mesh>

      <mesh castShadow position={[-0.02, trunkHeight + 0.86, 0.1]}>
        <sphereGeometry args={[canopyRadius * 0.42, 14, 14]} />
        <meshStandardMaterial color="#76cc7d" roughness={0.72} />
      </mesh>
    </group>
  );
}

function Rock({ point, color }: { point: RockPoint; color: string }) {
  const y = getTerrainHeight(point.x, point.z) + point.size;

  return (
    <mesh castShadow receiveShadow position={[point.x, y, point.z]}>
      <dodecahedronGeometry args={[point.size, 0]} />
      <meshStandardMaterial color={color} roughness={0.84} metalness={0.11} />
    </mesh>
  );
}

function ScenicRestSpotBench({ spot }: { spot: ScenicRestSpotDefinition }) {
  const y = getTerrainHeight(spot.seat.x, spot.seat.z);

  return (
    <group position={[spot.seat.x, y, spot.seat.z]} rotation={[0, spot.seat.rotationY, 0]}>
      <mesh castShadow receiveShadow position={[0, 0.42, 0]}>
        <boxGeometry args={[1.6, 0.08, 0.62]} />
        <meshStandardMaterial color="#be9f73" roughness={0.82} />
      </mesh>

      <mesh castShadow receiveShadow position={[0, 0.78, -0.24]}>
        <boxGeometry args={[1.62, 0.58, 0.1]} />
        <meshStandardMaterial color="#b08b61" roughness={0.84} />
      </mesh>

      <mesh castShadow position={[0.66, 0.2, 0.2]}>
        <cylinderGeometry args={[0.06, 0.06, 0.4, 10]} />
        <meshStandardMaterial color="#6d4f2e" roughness={0.86} />
      </mesh>
      <mesh castShadow position={[-0.66, 0.2, 0.2]}>
        <cylinderGeometry args={[0.06, 0.06, 0.4, 10]} />
        <meshStandardMaterial color="#6d4f2e" roughness={0.86} />
      </mesh>
      <mesh castShadow position={[0.66, 0.2, -0.2]}>
        <cylinderGeometry args={[0.06, 0.06, 0.4, 10]} />
        <meshStandardMaterial color="#6d4f2e" roughness={0.86} />
      </mesh>
      <mesh castShadow position={[-0.66, 0.2, -0.2]}>
        <cylinderGeometry args={[0.06, 0.06, 0.4, 10]} />
        <meshStandardMaterial color="#6d4f2e" roughness={0.86} />
      </mesh>
    </group>
  );
}

function NeighborhoodHub() {
  const centerY = useMemo(() => {
    const centerHeight = getTerrainHeight(0, 0);
    let edgeHeightMax = centerHeight;
    const sampleRadius = SPAWN_HUB_RADIUS + 2.3;
    const samples = 28;

    for (let index = 0; index < samples; index += 1) {
      const angle = (index / samples) * Math.PI * 2;
      const sampleX = Math.cos(angle) * sampleRadius;
      const sampleZ = Math.sin(angle) * sampleRadius;
      edgeHeightMax = Math.max(edgeHeightMax, getTerrainHeight(sampleX, sampleZ));
    }

    const lift = MathUtils.clamp(edgeHeightMax - centerHeight, 0, 0.24);
    return centerHeight + lift + 0.04;
  }, []);
  const houseAnchors: Array<[number, number]> = [
    [-4.6, 0],
    [4.6, 0],
    [0, 4.6],
    [0, -4.6],
  ];

  return (
    <group>
      <mesh receiveShadow position={[0, centerY + 0.04, 0]}>
        <cylinderGeometry args={[SPAWN_HUB_RADIUS + 2.2, SPAWN_HUB_RADIUS + 2.9, 0.44, 48]} />
        <meshStandardMaterial color="#c6ab78" roughness={0.9} />
      </mesh>

      <mesh receiveShadow position={[0, centerY + 0.22, 0]}>
        <cylinderGeometry args={[SPAWN_HUB_RADIUS, SPAWN_HUB_RADIUS, 0.2, 48]} />
        <meshStandardMaterial color="#dec9a6" roughness={0.88} />
      </mesh>

      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, centerY + 0.29, 0]}>
        <ringGeometry args={[SPAWN_HUB_RADIUS - 0.8, SPAWN_HUB_RADIUS - 0.35, 48]} />
        <meshStandardMaterial color="#f6e7c8" roughness={0.84} />
      </mesh>

      {houseAnchors.map(([x, z], index) => (
        <group key={`hub-house-${index}`} position={[x, centerY + 0.22, z]}>
          <mesh castShadow receiveShadow>
            <boxGeometry args={[1.55, 1.1, 1.55]} />
            <meshStandardMaterial color="#f5dfbf" roughness={0.82} />
          </mesh>
          <mesh castShadow position={[0, 0.96, 0]}>
            <coneGeometry args={[1.18, 0.85, 4]} />
            <meshStandardMaterial color="#be7256" roughness={0.84} />
          </mesh>
        </group>
      ))}

      <mesh castShadow position={[0, centerY + 0.6, 0]}>
        <cylinderGeometry args={[0.22, 0.28, 1.2, 12]} />
        <meshStandardMaterial color="#6d7577" roughness={0.8} metalness={0.18} />
      </mesh>
      <mesh castShadow position={[0, centerY + 1.42, 0]}>
        <sphereGeometry args={[0.34, 14, 14]} />
        <meshStandardMaterial color="#ffe9b9" emissive="#f8bc6d" emissiveIntensity={0.45} roughness={0.3} />
      </mesh>
    </group>
  );
}

function PuffyCloud({ position, scale, tint }: { position: [number, number, number]; scale: number; tint: string }) {
  const sunwardX = SCENIC_FORWARD_XZ.x * 0.9;
  const sunwardZ = SCENIC_FORWARD_XZ.z * 0.9;

  return (
    <group position={position} scale={scale}>
      <mesh>
        <sphereGeometry args={[1.3, 18, 18]} />
        <meshStandardMaterial color={tint} roughness={0.94} metalness={0.01} emissive="#ffe9d5" emissiveIntensity={0.04} />
      </mesh>
      <mesh position={[-1.12, -0.08, 0.25]}>
        <sphereGeometry args={[1, 16, 16]} />
        <meshStandardMaterial color="#f7fbff" roughness={0.95} metalness={0.01} />
      </mesh>
      <mesh position={[1.08, -0.12, -0.18]}>
        <sphereGeometry args={[0.92, 16, 16]} />
        <meshStandardMaterial color="#fffaf3" roughness={0.95} metalness={0.01} />
      </mesh>
      <mesh position={[0, -0.44, 0]}>
        <sphereGeometry args={[1.02, 16, 16]} />
        <meshStandardMaterial color="#eff6ff" roughness={0.95} metalness={0.01} />
      </mesh>
      <mesh position={[sunwardX, 0.08, sunwardZ]}>
        <sphereGeometry args={[0.54, 14, 14]} />
        <meshStandardMaterial color="#ffd8bb" roughness={0.9} emissive="#ffbc8a" emissiveIntensity={0.06} />
      </mesh>
      <mesh position={[-sunwardX * 0.8, -0.04, -sunwardZ * 0.8]}>
        <sphereGeometry args={[0.5, 14, 14]} />
        <meshStandardMaterial color="#dce7f9" roughness={0.93} />
      </mesh>
    </group>
  );
}

function FlowerPatch({ point }: { point: ScatterPoint }) {
  const y = getTerrainHeight(point.x, point.z);
  const petalColors = ['#ff9fc7', '#ffd875', '#bda8ff', '#ffb687', '#8bd5ff'];

  return (
    <group position={[point.x, y + 0.04, point.z]}>
      {new Array(6).fill(0).map((_, index) => {
        const angle = ((Math.PI * 2) / 6) * index + point.seed;
        const radius = 0.3 + (index % 2) * 0.09;
        const px = Math.cos(angle) * radius;
        const pz = Math.sin(angle) * radius;
        const color = petalColors[(index + Math.floor(point.seed * 10)) % petalColors.length] ?? '#ffd875';

        return (
          <mesh key={`petal-${index}`} castShadow position={[px, 0.07, pz]}>
            <sphereGeometry args={[0.13, 10, 10]} />
            <meshStandardMaterial color={color} roughness={0.54} metalness={0.03} emissive={color} emissiveIntensity={0.03} />
          </mesh>
        );
      })}

      <mesh position={[0, 0.1, 0]}>
        <cylinderGeometry args={[0.02, 0.03, 0.2, 8]} />
        <meshStandardMaterial color="#679a4e" roughness={0.8} />
      </mesh>
      <mesh castShadow position={[0, 0.1, 0]}>
        <sphereGeometry args={[0.1, 10, 10]} />
        <meshStandardMaterial color="#fff1c9" roughness={0.58} metalness={0.02} emissive="#ffdba0" emissiveIntensity={0.04} />
      </mesh>
    </group>
  );
}

export function WorldEnvironment() {
  const terrainGeometry = useMemo(() => buildTerrainGeometry(), []);
  const skyGroupRef = useRef<Group>(null);
  const sunsetLightPosition = useMemo<[number, number, number]>(
    () => [
      SCENIC_FORWARD_XZ.x * SCENIC_SUN_LIGHT_DISTANCE,
      SCENIC_SUN_LIGHT_HEIGHT,
      SCENIC_FORWARD_XZ.z * SCENIC_SUN_LIGHT_DISTANCE,
    ],
    [],
  );
  const visibleSunDirection = useMemo(
    () => new Vector3(SCENIC_FORWARD_XZ.x, VISIBLE_SUN_ELEVATION, SCENIC_FORWARD_XZ.z).normalize(),
    [],
  );
  const visibleSunPosition = useMemo<[number, number, number]>(
    () => [
      visibleSunDirection.x * VISIBLE_SUN_DISTANCE,
      visibleSunDirection.y * VISIBLE_SUN_DISTANCE,
      visibleSunDirection.z * VISIBLE_SUN_DISTANCE,
    ],
    [visibleSunDirection],
  );
  const skyUniforms = useMemo(
    () => ({
      uEdgeBlue: { value: new Color('#1f315d') },
      uViolet: { value: new Color('#4a3d72') },
      uMauve: { value: new Color('#76577b') },
      uRose: { value: new Color('#d07d8f') },
      uAmber: { value: new Color('#f3a34c') },
      uTangerine: { value: new Color('#f17e3b') },
      uGold: { value: new Color('#ffd15f') },
      uYellow: { value: new Color('#ffe78a') },
      uSunWhite: { value: new Color('#fff8ee') },
      uSunDirection: { value: visibleSunDirection },
    }),
    [visibleSunDirection],
  );
  const debugWorldValidation = useMemo(
    () =>
      typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('debugWorldValidation'),
    [],
  );

  useFrame(({ camera }) => {
    const skyGroup = skyGroupRef.current;
    if (!skyGroup) {
      return;
    }

    skyGroup.position.copy(camera.position);
  });

  useEffect(() => {
    if (!debugWorldValidation) {
      return;
    }

    const waterBoundaryMismatches: Array<{ lakeId: string; x: number; z: number; signedDistance: number }> = [];
    const hiddenWaterSamples: Array<{ lakeId: string; x: number; z: number; waterY: number; terrainY: number }> = [];
    const propWaterViolations: Array<{ type: 'tree' | 'rock'; x: number; z: number }> = [];

    for (const body of WORLD_WATER_BODIES) {
      const boundarySamples = getLakeBoundaryPolyline(body, 48);
      for (const sample of boundarySamples) {
        const signedDistance = getNearestLakeShoreSignedDistance(sample.x, sample.z);
        if (Math.abs(signedDistance) > 0.22) {
          waterBoundaryMismatches.push({
            lakeId: body.id,
            x: Number(sample.x.toFixed(2)),
            z: Number(sample.z.toFixed(2)),
            signedDistance: Number(signedDistance.toFixed(3)),
          });
        }
      }

      const waterY = getWaterSurfaceHeight(body);
      const interiorSamples = getLakeBoundaryPolyline(body, 24, 0.72);
      for (const sample of interiorSamples) {
        const terrainY = getTerrainHeight(sample.x, sample.z);
        if (terrainY > waterY - 0.03) {
          hiddenWaterSamples.push({
            lakeId: body.id,
            x: Number(sample.x.toFixed(2)),
            z: Number(sample.z.toFixed(2)),
            waterY: Number(waterY.toFixed(3)),
            terrainY: Number(terrainY.toFixed(3)),
          });
        }
      }
    }

    for (const tree of TREE_POINTS) {
      if (isPointWaterBlocked(tree.x, tree.z, 0.44)) {
        propWaterViolations.push({ type: 'tree', x: Number(tree.x.toFixed(2)), z: Number(tree.z.toFixed(2)) });
      }
    }

    for (const rock of [...BOULDER_POINTS, ...COASTAL_ROCK_POINTS]) {
      if (isPointWaterBlocked(rock.x, rock.z, rock.size * 0.72 + 0.04)) {
        propWaterViolations.push({ type: 'rock', x: Number(rock.x.toFixed(2)), z: Number(rock.z.toFixed(2)) });
      }
    }

    if (
      waterBoundaryMismatches.length === 0 &&
      hiddenWaterSamples.length === 0 &&
      propWaterViolations.length === 0
    ) {
      console.info('[world-validation] water/prop alignment checks passed');
      return;
    }

    console.warn('[world-validation] mismatches found', {
      waterBoundaryMismatches: waterBoundaryMismatches.length,
      hiddenWaterSamples: hiddenWaterSamples.length,
      propWaterViolations: propWaterViolations.length,
    });

    if (waterBoundaryMismatches.length > 0) {
      console.table(waterBoundaryMismatches.slice(0, 20));
    }
    if (hiddenWaterSamples.length > 0) {
      console.table(hiddenWaterSamples.slice(0, 20));
    }
    if (propWaterViolations.length > 0) {
      console.table(propWaterViolations.slice(0, 20));
    }
  }, [debugWorldValidation]);

  return (
    <>
      <color attach="background" args={['#201f49']} />
      <fog attach="fog" args={['#6f5c7a', 98, 322]} />

      <group>
      <group ref={skyGroupRef}>
        <mesh frustumCulled={false}>
          <sphereGeometry args={[SKY_DOME_RADIUS, 96, 64]} />
          <shaderMaterial
            fragmentShader={SUNSET_SKY_FRAGMENT_SHADER}
            uniforms={skyUniforms}
            vertexShader={SUNSET_SKY_VERTEX_SHADER}
            side={BackSide}
            depthWrite={false}
            fog={false}
            toneMapped={false}
          />
        </mesh>

        <mesh position={visibleSunPosition} frustumCulled={false}>
          <sphereGeometry args={[7.8, 30, 30]} />
          <meshBasicMaterial color="#ffd669" toneMapped={false} fog={false} />
        </mesh>
        <mesh position={visibleSunPosition} frustumCulled={false}>
          <sphereGeometry args={[4.8, 30, 30]} />
          <meshBasicMaterial color="#fff8ef" toneMapped={false} fog={false} />
        </mesh>
        <mesh position={visibleSunPosition} frustumCulled={false}>
          <sphereGeometry args={[14.5, 30, 30]} />
          <meshBasicMaterial color="#ffd89c" transparent opacity={0.16} depthWrite={false} toneMapped={false} fog={false} />
        </mesh>
        <mesh position={visibleSunPosition} frustumCulled={false}>
          <sphereGeometry args={[22, 30, 30]} />
          <meshBasicMaterial color="#ffb25f" transparent opacity={0.09} depthWrite={false} toneMapped={false} fog={false} />
        </mesh>
      </group>

      <ambientLight intensity={0.34} color="#ffddc3" />
      <hemisphereLight intensity={0.6} color="#ffbc8a" groundColor="#2f4a73" />
      <directionalLight
        castShadow
        intensity={1.08}
        position={sunsetLightPosition}
        color="#ff9b62"
        shadow-mapSize-width={4096}
        shadow-mapSize-height={4096}
        shadow-bias={-0.00008}
        shadow-normalBias={0.02}
        shadow-camera-near={1}
        shadow-camera-far={280}
        shadow-camera-left={-120}
        shadow-camera-right={120}
        shadow-camera-top={120}
        shadow-camera-bottom={-120}
      />
      <directionalLight intensity={0.3} position={[-48, 30, -46]} color="#6d8cd9" />

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, OCEAN_LEVEL - 0.03, 0]}>
        <planeGeometry args={[980, 980]} />
        <meshStandardMaterial color="#5fcbe3" roughness={0.18} metalness={0.08} emissive="#2f86a5" emissiveIntensity={0.14} />
      </mesh>

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, OCEAN_LEVEL - 0.7, 0]}>
        <planeGeometry args={[1050, 1050]} />
        <meshStandardMaterial color="#2a8aa8" roughness={0.78} metalness={0.03} />
      </mesh>

      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} geometry={terrainGeometry}>
        <meshStandardMaterial vertexColors roughness={0.93} metalness={0.02} />
      </mesh>

      <AmbientBirds />
      <AmbientCritters />

      <NeighborhoodHub />

      {TREE_POINTS.map((point, index) => (
        <StylizedTree key={`tree-${index}`} point={point} />
      ))}

      {BUSH_POINTS.map((point, index) => (
        <group key={`bush-${index}`} position={[point.x, getTerrainHeight(point.x, point.z), point.z]}>
          <mesh castShadow position={[0, 0.38, 0]}>
            <sphereGeometry args={[0.66, 16, 16]} />
            <meshStandardMaterial color="#6bb26f" roughness={0.8} />
          </mesh>
          <mesh castShadow position={[0.42, 0.3, -0.18]}>
            <sphereGeometry args={[0.42, 14, 14]} />
            <meshStandardMaterial color="#62a969" roughness={0.82} />
          </mesh>
        </group>
      ))}

      {FLOWER_POINTS.map((point, index) => (
        <FlowerPatch key={`flower-${index}`} point={point} />
      ))}

      {BOULDER_POINTS.map((point, index) => (
        <Rock key={`boulder-${index}`} point={point} color="#82958f" />
      ))}

      {COASTAL_ROCK_POINTS.map((point, index) => (
        <Rock key={`coastal-rock-${index}`} point={point} color="#869690" />
      ))}

      {SCENIC_REST_SPOTS.map((spot) => (
        <ScenicRestSpotBench key={spot.id} spot={spot} />
      ))}

      {WORLD_WATER_BODIES.map((body) => (
        <StylizedWater key={body.id} body={body} />
      ))}
      <LakeFaunaManager />

      <PuffyCloud position={[-32, 23, -30]} scale={2.6} tint="#fff5ef" />
      <PuffyCloud position={[4, 26, -44]} scale={2.2} tint="#f4f1ff" />
      <PuffyCloud position={[38, 20, 30]} scale={2.4} tint="#fff7ef" />
      <PuffyCloud position={[-12, 18, 42]} scale={2} tint="#f2f1ff" />
      <PuffyCloud position={[52, 24, -18]} scale={2.5} tint="#fff9f2" />
      <PuffyCloud position={[-48, 19, 16]} scale={2.1} tint="#f2f6ff" />

      <Sparkles
        count={260}
        speed={0.14}
        size={2.3}
        color="#fff4cf"
        opacity={0.25}
        scale={[260, 20, 260]}
      />

      <mesh position={[0, OCEAN_LEVEL - 1.6, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[WORLD_BOUNDS.maxX * 4.6, WORLD_BOUNDS.maxZ * 4.6]} />
        <meshStandardMaterial color="#234246" roughness={1} metalness={0} transparent opacity={0.46} />
      </mesh>
      </group>
    </>
  );
}
