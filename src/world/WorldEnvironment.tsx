import { Sparkles } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import {
  AdditiveBlending,
  BackSide,
  BufferAttribute,
  Color,
  Group,
  MathUtils,
  PlaneGeometry,
  Vector3,
} from 'three';
import type { ShaderMaterial } from 'three';

import { WORLD_BOUNDS, WORLD_WATER_BODIES } from './constants';
import { BOULDER_POINTS, COASTAL_ROCK_POINTS, TREE_POINTS, getGroveDensity } from './biome';
import { CentralPlaza } from './plaza/CentralPlaza';
import { InstancedVegetation } from './vegetation/InstancedVegetation';
import { hasPerfFlag } from './perfFlags';
import { IslandTrails } from './plaza/IslandTrails';
import { LakeWater } from './water/LakeWater';
import { OCEAN_DEPTH_MAP_EXTENT, createOceanDepthTexture } from './water/oceanDepthMap';
import { Lighthouse } from './landmarks/Lighthouse';
import { LakeDocks } from './landmarks/LakeDocks';
import { TrailSigns } from './landmarks/TrailSigns';
import {
  OCEAN_LEVEL,
  getIslandDistanceNormalized,
  getLakeBoundaryPolyline,
  getNearestLakeShoreSignedDistance,
  getTerrainHeight,
  getWaterSurfaceHeight,
  isPointWaterBlocked,
} from './terrain';
import { SCENIC_REST_SPOTS } from './restSpots';
import { valueNoise2D } from './groundNoise';
import {
  SCENIC_FORWARD_XZ,
  SCENIC_SUN_LIGHT_DISTANCE,
  SCENIC_SUN_LIGHT_HEIGHT,
} from './scenic';
import { AmbientBirds } from './AmbientBirds';
import { AmbientCritters } from './AmbientCritters';
import { LakeFaunaManager } from './LakeFaunaManager';
import { planeXYToWorldXZ } from './renderSpace';
import { TERRAIN_MESH_SEGMENTS, TERRAIN_MESH_SIZE } from './terrainMesh';

import type { ScenicRestSpotDefinition } from './restSpots';

/**
 * Grass colour (HSL) for a terrain vertex: the old height/moisture base, plus sun-dried meadow patches,
 * deeper and cooler green under groves, and fine mottling so open ground is not one flat tone.
 */
function getGrassHSL(x: number, z: number, height: number, islandDistance: number, moisture: number): [number, number, number] {
  const grove = getGroveDensity(x, z);
  const dry = MathUtils.smoothstep(valueNoise2D(x * 0.045 + 40, z * 0.045 - 12), 0.55, 0.85);
  const fine = valueNoise2D(x * 0.42, z * 0.42) - 0.5;
  const hue = 0.26 - height * 0.007 + islandDistance * 0.015 - dry * 0.045 + grove * 0.018;
  const saturation = 0.56 + moisture * 0.18 - dry * 0.06;
  const lightness = MathUtils.clamp(
    0.24 + moisture * 0.25 + height * 0.05 + dry * 0.06 - grove * 0.05 + fine * 0.05,
    0.18,
    0.7,
  );
  return [hue, saturation, lightness];
}

function buildTerrainGeometry(): PlaneGeometry {
  const geometry = new PlaneGeometry(
    TERRAIN_MESH_SIZE,
    TERRAIN_MESH_SIZE,
    TERRAIN_MESH_SEGMENTS,
    TERRAIN_MESH_SEGMENTS,
  );
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

    if (height < OCEAN_LEVEL + 0.85) {
      // Beach: pale dry sand above the water line, darker wet sand just below it.
      const wet = MathUtils.clamp((OCEAN_LEVEL + 0.12 - height) / 0.6, 0, 1);
      const hue = 0.11 - wet * 0.01;
      const saturation = 0.62 - wet * 0.14;
      const lightness = MathUtils.clamp(0.76 - wet * 0.22 - (1 - nearOcean) * 0.06, 0.4, 0.78);
      color.setHSL(hue, saturation, lightness);
    } else if (height < OCEAN_LEVEL + 1.15) {
      // Short blend from sand into grass so the beach edge is soft.
      const t = (height - (OCEAN_LEVEL + 0.85)) / 0.3;
      const [grassHue, grassSaturation, grassLightness] = getGrassHSL(worldX, worldZ, height, islandDistance, moisture);
      color.setHSL(MathUtils.lerp(0.11, grassHue, t), MathUtils.lerp(0.5, grassSaturation, t), MathUtils.lerp(0.74, grassLightness, t));
    } else {
      color.setHSL(...getGrassHSL(worldX, worldZ, height, islandDistance, moisture));
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
const VISIBLE_SUN_ELEVATION = 0.015;

const SUNSET_SKY_VERTEX_SHADER = `
varying vec3 vDirection;

void main() {
  vDirection = normalize(position);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const SKY_PALETTE_CHUNK = `
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

// Warm golden-hour haze along the whole horizon, strongest at eye level.
vec3 applyHorizonHaze(vec3 color, float elevation) {
  float band = exp(-pow((elevation - 0.01) / 0.16, 2.0));
  return mix(color, mix(uAmber, uRose, 0.55), band * 0.3);
}

// Sky colour just above the horizon in a given direction (used to fade the ocean into the sky).
vec3 horizonSky(vec3 dir) {
  vec3 flatDir = normalize(vec3(dir.x, 0.0, dir.z));
  float sunDistance = acos(clamp(dot(flatDir, normalize(vec3(uSunDirection.x, 0.0, uSunDirection.z))), -1.0, 1.0));
  vec3 color = sunsetPalette(pow(clamp(sunDistance / 1.7, 0.0, 1.0), 0.92));
  color = mix(color, uRose, (1.0 - smoothstep(0.0, 0.34, sunDistance / 1.7)) * 0.1);
  return applyHorizonHaze(color, 0.0);
}
`;

const SUNSET_SKY_FRAGMENT_SHADER = `
${SKY_PALETTE_CHUNK}
varying vec3 vDirection;

void main() {
  vec3 dir = normalize(vDirection);
  vec3 sunDir = normalize(uSunDirection);
  float up = clamp((dir.y + 1.0) * 0.5, 0.0, 1.0);
  float sunDot = clamp(dot(dir, sunDir), -1.0, 1.0);
  float sunDistance = acos(sunDot);
  float radialT = pow(clamp(sunDistance / 1.7, 0.0, 1.0), 0.92);
  float lowSun = 1.0 - smoothstep(0.022, 0.085, sunDir.y);

  vec3 color = sunsetPalette(radialT);

  float zenithCool = smoothstep(0.74, 1.0, up);
  color = mix(color, uEdgeBlue, zenithCool * 0.14);

  float horizonSoftness = exp(-pow((dir.y + 0.04) / 0.26, 2.0));
  color = mix(color, uRose, horizonSoftness * (1.0 - smoothstep(0.0, 0.34, radialT)) * 0.1);

  float horizonOcclusion = smoothstep(-0.004, 0.012, dir.y);
  float sunOuterGlow = smoothstep(0.4, 0.09, sunDistance) * horizonOcclusion;
  float sunInnerGlow = smoothstep(0.22, 0.04, sunDistance) * horizonOcclusion;
  float sunDisk = smoothstep(0.078, 0.006, sunDistance) * horizonOcclusion;
  float whiteCore = smoothstep(0.03, 0.0, sunDistance) * horizonOcclusion;
  float solarHaze = smoothstep(0.58, 0.1, sunDistance) * horizonOcclusion * lowSun;
  float horizonBloom =
    exp(-pow((dir.y - sunDir.y) / 0.08, 2.0)) *
    smoothstep(0.46, 0.08, sunDistance) *
    lowSun;

  color = mix(color, uAmber, sunOuterGlow * (0.12 + lowSun * 0.08));
  color = mix(color, uGold, sunInnerGlow * (0.2 + lowSun * 0.08));
  color = mix(color, uYellow, sunDisk * mix(0.44, 0.34, lowSun));
  color = mix(color, uSunWhite, whiteCore * mix(0.92, 0.68, lowSun));
  color = mix(color, uGold, solarHaze * 0.14);
  color = mix(color, uSunWhite, horizonBloom * 0.08);
  color = applyHorizonHaze(color, dir.y);

  gl_FragColor = vec4(color, 1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
`;


const OCEAN_VERTEX_SHADER = `
varying vec3 vWorld;
void main() {
  vec4 world = modelMatrix * vec4(position, 1.0);
  vWorld = world.xyz;
  gl_Position = projectionMatrix * viewMatrix * world;
}
`;

const OCEAN_FRAGMENT_SHADER = `
${SKY_PALETTE_CHUNK}
uniform float uTime;
uniform vec3 uShallow;
uniform vec3 uDeep;
uniform vec3 uFar;
uniform vec3 uLagoon;
uniform vec3 uFoam;
uniform sampler2D uDepth;
uniform float uDepthExtent;
varying vec3 vWorld;

void main() {
  vec3 toFragment = vWorld - cameraPosition;
  float distanceXZ = length(toFragment.xz);
  vec3 dir = normalize(toFragment);
  float fromIsland = length(vWorld.xz / vec2(1.0, 0.94));

  vec3 water = mix(uShallow, uDeep, smoothstep(64.0, 112.0, fromIsland));
  water = mix(water, uFar, smoothstep(150.0, 320.0, fromIsland));
  // Domain-warped swell so highlights fall irregularly instead of in rows of identical ovals.
  vec2 warp = vec2(sin(vWorld.z * 0.053 + 1.7) * 2.1, sin(vWorld.x * 0.061 - 0.4) * 1.9);
  float swell = sin(vWorld.x * 0.21 + warp.x + uTime * 0.6) * sin(vWorld.z * 0.17 + warp.y - uTime * 0.45);
  float patchy = 0.5 + 0.5 * sin(vWorld.x * 0.031 + vWorld.z * 0.027);
  float crest = smoothstep(0.88, 0.99, swell) * patchy * (1.0 - smoothstep(60.0, 180.0, distanceXZ));
  water = mix(water, vec3(0.92, 0.98, 1.0), crest * 0.16);

  // Shallows and surf from the baked depth map (metres below the water line).
  vec2 depthUv = vWorld.xz / uDepthExtent + 0.5;
  float depth = texture2D(uDepth, depthUv).r * 4.0 - 1.0;
  float shallow = 1.0 - smoothstep(0.0, 1.8, depth);
  water = mix(water, uLagoon, shallow * 0.75);
  float surfBand = (1.0 - smoothstep(0.04, 0.42, depth)) * step(-0.02, depth);
  float surfWave = 0.55 + 0.45 * smoothstep(0.2, 0.95, sin(depth * 26.0 - uTime * 1.7 + vWorld.x * 0.15));
  water = mix(water, uFoam, surfBand * surfWave * 0.85);

  float horizon = smoothstep(90.0, 520.0, distanceXZ);
  vec3 color = mix(water, horizonSky(dir), pow(horizon, 1.15));
  float alpha = mix(1.0, 0.78, shallow * (1.0 - surfBand));
  gl_FragColor = vec4(color, alpha);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
`;

const SUNSET_REFLECTION_VERTEX_SHADER = `
varying vec3 vWorldPosition;

void main() {
  vec4 worldPosition = modelMatrix * vec4(position, 1.0);
  vWorldPosition = worldPosition.xyz;
  gl_Position = projectionMatrix * viewMatrix * worldPosition;
}
`;

const SUNSET_REFLECTION_FRAGMENT_SHADER = `
uniform vec3 uSunDirection;
uniform vec3 uAmber;
uniform vec3 uGold;
uniform vec3 uSunWhite;
varying vec3 vWorldPosition;

void main() {
  vec2 sunXZ = normalize(uSunDirection.xz);
  vec2 crossXZ = vec2(-sunXZ.y, sunXZ.x);
  vec2 waterXZ = vWorldPosition.xz;

  float along = max(dot(waterXZ, sunXZ), 0.0);
  float across = dot(waterXZ, crossXZ);
  float forwardFade = smoothstep(10.0, 48.0, along);
  float distanceFade = 1.0 - smoothstep(170.0, 410.0, along);
  float width = mix(3.2, 18.0, smoothstep(0.0, 220.0, along));
  float tightStrip = exp(-pow(across / width, 2.0));
  float softGlow = exp(-pow(across / (width * 2.8), 2.0));
  float shimmer =
    0.88 +
    0.1 * sin(waterXZ.x * 0.33 + waterXZ.y * 0.19) +
    0.06 * sin(waterXZ.x * 0.78 - waterXZ.y * 0.41);
  shimmer = clamp(shimmer, 0.74, 1.06);

  float alpha =
    forwardFade *
    distanceFade *
    shimmer *
    (tightStrip * 0.16 + softGlow * 0.07);

  vec3 color = mix(uAmber, uGold, softGlow * 0.48);
  color = mix(color, uSunWhite, tightStrip * 0.42);

  gl_FragColor = vec4(color, alpha);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
`;

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

function PuffyCloud({ position, scale, tint }: { position: [number, number, number]; scale: number; tint: string }) {
  const sunwardX = SCENIC_FORWARD_XZ.x * 0.9;
  const sunwardZ = SCENIC_FORWARD_XZ.z * 0.9;

  return (
    // Flattened and widened so distant clouds read as soft banks rather than balls.
    <group position={position} scale={[scale * 1.7, scale * 0.62, scale * 1.1]}>
      <mesh>
        <sphereGeometry args={[1.3, 18, 18]} />
        <meshStandardMaterial color={tint} roughness={1} emissive="#ffd8cc" emissiveIntensity={0.55} />
      </mesh>
      <mesh position={[-1.12, -0.08, 0.25]}>
        <sphereGeometry args={[1, 16, 16]} />
        <meshStandardMaterial color={tint} roughness={1} emissive="#ffd8cc" emissiveIntensity={0.55} />
      </mesh>
      <mesh position={[1.08, -0.12, -0.18]}>
        <sphereGeometry args={[0.92, 16, 16]} />
        <meshStandardMaterial color={tint} roughness={1} emissive="#ffd8cc" emissiveIntensity={0.55} />
      </mesh>
      <mesh position={[0, -0.44, 0]}>
        <sphereGeometry args={[1.02, 16, 16]} />
        <meshStandardMaterial color={tint} roughness={1} emissive="#ffd8cc" emissiveIntensity={0.55} />
      </mesh>
      <mesh position={[sunwardX, 0.08, sunwardZ]}>
        <sphereGeometry args={[0.54, 14, 14]} />
        <meshStandardMaterial color={tint} roughness={1} emissive="#ffd8cc" emissiveIntensity={0.55} />
      </mesh>
      <mesh position={[-sunwardX * 0.8, -0.04, -sunwardZ * 0.8]}>
        <sphereGeometry args={[0.5, 14, 14]} />
        <meshStandardMaterial color={tint} roughness={1} emissive="#ffd8cc" emissiveIntensity={0.55} />
      </mesh>
    </group>
  );
}

export function WorldEnvironment() {
  const terrainGeometry = useMemo(() => buildTerrainGeometry(), []);
  const skyGroupRef = useRef<Group>(null);
  const oceanMaterialRef = useRef<ShaderMaterial>(null);
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
  const skyUniforms = useMemo(
    () => ({
      uEdgeBlue: { value: new Color('#7f93d6') },
      uViolet: { value: new Color('#a59ad8') },
      uMauve: { value: new Color('#d5a3be') },
      uRose: { value: new Color('#e99aa6') },
      uAmber: { value: new Color('#f3a34c') },
      uTangerine: { value: new Color('#f17e3b') },
      uGold: { value: new Color('#ffd15f') },
      uYellow: { value: new Color('#ffe78a') },
      uSunWhite: { value: new Color('#fff8ee') },
      uSunDirection: { value: visibleSunDirection },
    }),
    [visibleSunDirection],
  );
  const oceanUniforms = useMemo(
    () => ({
      ...skyUniforms,
      uTime: { value: 0 },
      uShallow: { value: new Color('#5fd2cf') },
      uDeep: { value: new Color('#2b8fb3') },
      uFar: { value: new Color('#3f78b0') },
      uLagoon: { value: new Color('#7fe2d6') },
      uFoam: { value: new Color('#f6fffb') },
      uDepth: { value: createOceanDepthTexture() },
      uDepthExtent: { value: OCEAN_DEPTH_MAP_EXTENT },
    }),
    [skyUniforms],
  );
  const sunReflectionUniforms = useMemo(
    () => ({
      uSunDirection: { value: visibleSunDirection },
      uAmber: { value: new Color('#f2a14d') },
      uGold: { value: new Color('#ffd165') },
      uSunWhite: { value: new Color('#fff7e7') },
    }),
    [visibleSunDirection],
  );
  const debugWorldValidation = useMemo(
    () =>
      typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('debugWorldValidation'),
    [],
  );

  useFrame(({ camera, clock }) => {
    if (oceanMaterialRef.current) oceanMaterialRef.current.uniforms.uTime!.value = clock.elapsedTime;
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
      <color attach="background" args={['#7f93d6']} />
      <fog attach="fog" args={['#f0c9a8', 150, 460]} />

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
      </group>

      {/* Golden hour: a warm, not orange, key light; cool skylight fills the shadows with blue-violet. */}
      <ambientLight intensity={0.18} color="#fff1e3" />
      <hemisphereLight intensity={1.05} color="#c3c0f2" groundColor="#7d8a5a" />
      <directionalLight
        castShadow
        intensity={2.35}
        position={sunsetLightPosition}
        color="#ffd2a1"
        shadow-mapSize-width={hasPerfFlag('shadow2048') ? 2048 : 4096}
        shadow-mapSize-height={hasPerfFlag('shadow2048') ? 2048 : 4096}
        shadow-bias={-0.00008}
        shadow-normalBias={0.02}
        shadow-camera-near={1}
        shadow-camera-far={280}
        shadow-camera-left={-120}
        shadow-camera-right={120}
        shadow-camera-top={120}
        shadow-camera-bottom={-120}
      />
      {/* Cool fill from opposite the sun so faces turned away from it (the west benches) are not lost in shadow. */}
      <directionalLight intensity={0.85} position={[96, 38, -46]} color="#c4cbff" />

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, OCEAN_LEVEL - 0.03, 0]}>
        <planeGeometry args={[2400, 2400]} />
        <shaderMaterial
          ref={oceanMaterialRef}
          vertexShader={OCEAN_VERTEX_SHADER}
          fragmentShader={OCEAN_FRAGMENT_SHADER}
          uniforms={oceanUniforms}
          transparent
          fog={false}
          toneMapped={false}
        />
      </mesh>

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, OCEAN_LEVEL + 0.028, 0]}>
        <planeGeometry args={[2400, 2400]} />
        <shaderMaterial
          vertexShader={SUNSET_REFLECTION_VERTEX_SHADER}
          fragmentShader={SUNSET_REFLECTION_FRAGMENT_SHADER}
          uniforms={sunReflectionUniforms}
          transparent
          depthWrite={false}
          fog={false}
          toneMapped={false}
          blending={AdditiveBlending}
        />
      </mesh>

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, OCEAN_LEVEL - 0.7, 0]}>
        <planeGeometry args={[2400, 2400]} />
        <meshStandardMaterial color="#2a8aa8" roughness={0.78} metalness={0.03} />
      </mesh>

      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} geometry={terrainGeometry}>
        <meshStandardMaterial vertexColors roughness={0.93} metalness={0.02} />
      </mesh>

      <AmbientBirds />
      <AmbientCritters />

      <CentralPlaza />
      <IslandTrails />
      <Lighthouse />
      <LakeDocks />
      <TrailSigns />

      {hasPerfFlag('noveg') ? null : <InstancedVegetation />}

      {SCENIC_REST_SPOTS.map((spot) => (
        <ScenicRestSpotBench key={spot.id} spot={spot} />
      ))}

      {WORLD_WATER_BODIES.map((body) => (
        <LakeWater key={body.id} body={body} />
      ))}
      <LakeFaunaManager />

      {/* Clouds sit in a ring around the island so they frame the horizon instead of covering the land. */}
      <PuffyCloud position={[-60, 30, 110]} scale={4.2} tint="#fff6f1" />
      <PuffyCloud position={[-20, 40, -120]} scale={3.6} tint="#f6f2ff" />
      <PuffyCloud position={[80, 36, -96]} scale={4} tint="#fff7ef" />
      <PuffyCloud position={[118, 31, 20]} scale={3.4} tint="#f4f1ff" />
      <PuffyCloud position={[96, 30, 84]} scale={3.8} tint="#fff3ec" />
      <PuffyCloud position={[30, 38, 126]} scale={3.2} tint="#f3f5ff" />

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
