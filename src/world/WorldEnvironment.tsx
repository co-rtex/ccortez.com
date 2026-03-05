import { Line, Sparkles } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import {
  BackSide,
  BufferAttribute,
  Color,
  MathUtils,
  MeshBasicMaterial,
  PlaneGeometry,
  Shape,
  ShapeGeometry,
  SphereGeometry,
  Vector2,
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
  SCENIC_SUN_DISTANCE,
  SCENIC_SUN_HEIGHT,
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

function buildSunsetSkyDomeGeometry(sunDirectionXZ: { x: number; z: number }): SphereGeometry {
  const geometry = new SphereGeometry(430, 52, 30);
  const positions = geometry.attributes.position;
  const colors = new Float32Array(positions.count * 3);

  const skyTop = new Color('#172654');
  const skyUpper = new Color('#2a3a72');
  const skyMid = new Color('#4b4b84');
  const horizonCool = new Color('#685a8e');
  const horizonWarm = new Color('#ff9d66');
  const horizonPink = new Color('#f48ba5');
  const horizonHaze = new Color('#ccb7c2');
  const color = new Color();
  const sunDirection = new Vector2(sunDirectionXZ.x, sunDirectionXZ.z);
  if (sunDirection.lengthSq() <= 0.0001) {
    sunDirection.set(0, 1);
  }
  sunDirection.normalize();

  for (let index = 0; index < positions.count; index += 1) {
    const x = positions.getX(index);
    const y = positions.getY(index);
    const z = positions.getZ(index);
    const inverseLength = 1 / Math.max(0.0001, Math.hypot(x, y, z));
    const nx = x * inverseLength;
    const ny = y * inverseLength;
    const nz = z * inverseLength;
    const up = MathUtils.clamp((ny + 1) * 0.5, 0, 1);

    color.copy(horizonCool);
    color.lerp(skyMid, MathUtils.smoothstep(up, 0.26, 0.54));
    color.lerp(skyUpper, MathUtils.smoothstep(up, 0.54, 0.77));
    color.lerp(skyTop, MathUtils.smoothstep(up, 0.77, 1));

    const xzLength = Math.hypot(nx, nz);
    const dirX = xzLength > 0.0001 ? nx / xzLength : sunDirection.x;
    const dirZ = xzLength > 0.0001 ? nz / xzLength : sunDirection.y;
    const sunFacing = Math.max(0, dirX * sunDirection.x + dirZ * sunDirection.y);
    const horizonBand = Math.exp(-Math.pow((ny + 0.1) / 0.24, 2));
    const warmAmount = horizonBand * Math.pow(sunFacing, 2.15);
    const pinkAmount = horizonBand * Math.pow(sunFacing, 1.6);

    color.lerp(horizonHaze, horizonBand * 0.16);
    color.lerp(horizonWarm, warmAmount * 0.88);
    color.lerp(horizonPink, pinkAmount * 0.45 + horizonBand * 0.06);

    colors[index * 3] = color.r;
    colors[index * 3 + 1] = color.g;
    colors[index * 3 + 2] = color.b;
  }

  geometry.setAttribute('color', new BufferAttribute(colors, 3));
  return geometry;
}

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
  const skyDomeGeometry = useMemo(() => buildSunsetSkyDomeGeometry(SCENIC_FORWARD_XZ), []);
  const sunsetLightPosition = useMemo<[number, number, number]>(
    () => [
      SCENIC_FORWARD_XZ.x * SCENIC_SUN_LIGHT_DISTANCE,
      SCENIC_SUN_LIGHT_HEIGHT,
      SCENIC_FORWARD_XZ.z * SCENIC_SUN_LIGHT_DISTANCE,
    ],
    [],
  );
  const sunsetDiskPosition = useMemo<[number, number, number]>(
    () => [SCENIC_FORWARD_XZ.x * SCENIC_SUN_DISTANCE, SCENIC_SUN_HEIGHT, SCENIC_FORWARD_XZ.z * SCENIC_SUN_DISTANCE],
    [],
  );
  const debugWorldValidation = useMemo(
    () =>
      typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('debugWorldValidation'),
    [],
  );

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
    <group>
      <color attach="background" args={['#1d2855']} />
      <fog attach="fog" args={['#735786', 98, 322]} />

      <mesh geometry={skyDomeGeometry} position={[0, 28, 0]}>
        <meshBasicMaterial vertexColors side={BackSide} toneMapped={false} depthWrite={false} />
      </mesh>

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

      <mesh position={sunsetDiskPosition}>
        <sphereGeometry args={[8, 26, 26]} />
        <meshBasicMaterial color="#ff9a5b" toneMapped={false} />
      </mesh>
      <mesh position={sunsetDiskPosition}>
        <sphereGeometry args={[14.2, 26, 26]} />
        <meshBasicMaterial color="#ffc17b" transparent opacity={0.2} depthWrite={false} toneMapped={false} />
      </mesh>
      <mesh position={[sunsetDiskPosition[0], sunsetDiskPosition[1] - 1.4, sunsetDiskPosition[2]]}>
        <sphereGeometry args={[22, 26, 26]} />
        <meshBasicMaterial color="#bd74bf" transparent opacity={0.12} depthWrite={false} toneMapped={false} />
      </mesh>

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
  );
}
