import { Color } from 'three';
import type { WebGLProgramParametersWithUniforms } from 'three';

import { PLAZA_PATH_SPOKES, PLAZA_RADII } from '../islandPaths';

/**
 * Procedural plaza floor, injected into MeshStandardMaterial so it keeps lighting, shadows and fog.
 * Zones by radius: a paved court around the fountain with a terracotta compass inlay, lawns cut by paved
 * spokes, a paved promenade that carries the bench ring, and a kerb at the edge.
 */
export const PLAZA_FLOOR_COLORS = {
  stoneLight: '#f1e3c4',
  stoneDark: '#dcc59c',
  mortar: '#c9ae88',
  terracotta: '#d98a5f',
  terracottaDark: '#c4714c',
  lawnLight: '#9ccc58',
  lawnDark: '#6fa94a',
  kerb: '#c7ac83',
} as const;

const SPOKE_COUNT = PLAZA_PATH_SPOKES.length;

const VERTEX_HEADER = /* glsl */ `
varying vec3 vPlazaWorld;
`;

const VERTEX_BODY = /* glsl */ `
#include <begin_vertex>
vPlazaWorld = (modelMatrix * vec4(transformed, 1.0)).xyz;
`;

const FRAGMENT_HEADER = /* glsl */ `
varying vec3 vPlazaWorld;
uniform float uCourt;
uniform float uLawnOuter;
uniform float uPromenadeOuter;
uniform float uEdge;
uniform float uSpokeAngle[${SPOKE_COUNT}];
uniform float uSpokeHalfWidth[${SPOKE_COUNT}];
uniform vec3 uStoneLight;
uniform vec3 uStoneDark;
uniform vec3 uMortar;
uniform vec3 uTerracotta;
uniform vec3 uTerracottaDark;
uniform vec3 uLawnLight;
uniform vec3 uLawnDark;
uniform vec3 uKerb;

float plazaHash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

float plazaNoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(plazaHash(i), plazaHash(i + vec2(1.0, 0.0)), u.x),
    mix(plazaHash(i + vec2(0.0, 1.0)), plazaHash(i + vec2(1.0, 1.0)), u.x),
    u.y
  );
}

// 1 inside a mortar joint, 0 on the tile face; joints are roughly 6 cm, anti-aliased.
float joint(float coord, float tileSize) {
  float f = abs(fract(coord / tileSize + 0.5) - 0.5) * tileSize;
  float w = max(fwidth(coord), 0.0001);
  return 1.0 - smoothstep(0.03, 0.03 + w * 1.5, f);
}

vec3 tile(vec2 cell, float wear) {
  float h = plazaHash(cell);
  vec3 c = mix(uStoneLight, uStoneDark, h * 0.75);
  return c * (0.94 + wear * 0.08);
}

// Polar running-bond paving: rings of tiles whose count grows with radius.
vec3 polarPaving(float r, float a, float ringSize, float tileLength, float wear) {
  float ring = floor(r / ringSize);
  float count = max(6.0, floor(6.2831853 * (ring + 0.5) * ringSize / tileLength));
  float offset = mod(ring, 2.0) * 0.5;
  float t = (a / 6.2831853 + 0.5) * count + offset;
  float seg = floor(t);
  vec3 c = tile(vec2(ring, mod(seg, count)), wear);
  float arc = t * (6.2831853 * max(r, 0.001) / count);
  float m = max(joint(r, ringSize), joint(arc, 6.2831853 * max(r, 0.001) / count));
  return mix(c, uMortar, m * 0.7);
}

vec3 plazaAlbedo(vec2 xz) {
  float r = length(xz);
  float a = atan(-xz.x, -xz.y);
  float wear = plazaNoise(xz * 0.35);

  // Nearest spoke: signed lateral distance (negative inside the paved strip) and coordinates along it.
  float spokeEdge = 1e5;
  float along = 0.0;
  float lateral = 0.0;
  for (int i = 0; i < ${SPOKE_COUNT}; i++) {
    float d = a - uSpokeAngle[i];
    d = atan(sin(d), cos(d));
    if (cos(d) > 0.0) {
      float lat = sin(d) * r;
      float e = abs(lat) - uSpokeHalfWidth[i];
      if (e < spokeEdge) {
        spokeEdge = e;
        along = cos(d) * r;
        lateral = lat;
      }
    }
  }

  float aa = max(fwidth(r), 0.002);

  // Court: paving with a terracotta eight-point compass and a banded rim.
  vec3 court = polarPaving(r, a, 0.82, 1.05, wear);
  float star = abs(cos((a - 0.3927) * 4.0));
  float starRadius = mix(3.6, uCourt - 1.4, pow(star, 6.0));
  float inStar = (1.0 - smoothstep(starRadius - aa, starRadius + aa, r)) * smoothstep(3.0 - aa, 3.0 + aa, r);
  float starSide = step(0.0, sin((a - 0.3927) * 8.0));
  court = mix(court, mix(uTerracotta, uTerracottaDark, starSide) * (0.95 + wear * 0.08), inStar * 0.88);
  float band = smoothstep(uCourt - 0.75 - aa, uCourt - 0.75 + aa, r) * (1.0 - smoothstep(uCourt - 0.35 - aa, uCourt - 0.35 + aa, r));
  court = mix(court, uTerracotta * (0.92 + wear * 0.1), band);

  // Lawn: two greens broken up by low-frequency noise, with faint mowing rings.
  float grassNoise = plazaNoise(xz * 0.22) * 0.6 + plazaNoise(xz * 1.3) * 0.4;
  vec3 lawn = mix(uLawnDark, uLawnLight, grassNoise);
  lawn *= 0.96 + 0.05 * step(0.5, fract(r / 1.6));

  // Spoke paving: rectangular stones laid along the path.
  vec2 cell = vec2(floor(along / 0.9), floor((lateral + 8.0) / 0.7 + mod(floor(along / 0.9), 2.0) * 0.5));
  vec3 spoke = tile(cell, wear);
  float spokeJoint = max(joint(along, 0.9), joint(lateral + 8.0 + mod(floor(along / 0.9), 2.0) * 0.35, 0.7));
  spoke = mix(spoke, uMortar, spokeJoint * 0.7);

  // Promenade paving, slightly larger stones.
  vec3 promenade = polarPaving(r, a, 1.0, 1.25, wear);

  vec3 color = court;
  float lawnZone = smoothstep(uCourt - aa, uCourt + aa, r) * (1.0 - smoothstep(uLawnOuter - aa, uLawnOuter + aa, r));
  float spokeMask = 1.0 - smoothstep(-aa, aa, spokeEdge);
  color = mix(color, mix(lawn, spoke, spokeMask), lawnZone);
  float promenadeZone = smoothstep(uLawnOuter - aa, uLawnOuter + aa, r);
  color = mix(color, promenade, promenadeZone);

  // Kerbs: where lawn meets stone, and the outer edge band.
  float lawnKerb = lawnZone * (1.0 - smoothstep(0.12, 0.12 + aa * 2.0, abs(spokeEdge)));
  float ringKerb = 1.0 - smoothstep(0.14, 0.14 + aa * 2.0, min(abs(r - uCourt), abs(r - uLawnOuter)));
  color = mix(color, uKerb, max(lawnKerb, ringKerb * (1.0 - spokeMask * lawnZone)));
  float edgeBand = smoothstep(uPromenadeOuter - aa, uPromenadeOuter + aa, r);
  color = mix(color, uKerb * (0.9 + wear * 0.1), edgeBand);

  return color;
}
`;

export function applyPlazaFloorShader(shader: WebGLProgramParametersWithUniforms): void {
  shader.uniforms.uCourt = { value: PLAZA_RADII.court };
  shader.uniforms.uLawnOuter = { value: PLAZA_RADII.lawnOuter };
  shader.uniforms.uPromenadeOuter = { value: PLAZA_RADII.promenadeOuter };
  shader.uniforms.uEdge = { value: PLAZA_RADII.edge };
  shader.uniforms.uSpokeAngle = { value: PLAZA_PATH_SPOKES.map((spoke) => spoke.angle) };
  shader.uniforms.uSpokeHalfWidth = { value: PLAZA_PATH_SPOKES.map((spoke) => spoke.width / 2) };
  const colorUniform = (hex: string) => ({ value: new Color(hex) });
  shader.uniforms.uStoneLight = colorUniform(PLAZA_FLOOR_COLORS.stoneLight);
  shader.uniforms.uStoneDark = colorUniform(PLAZA_FLOOR_COLORS.stoneDark);
  shader.uniforms.uMortar = colorUniform(PLAZA_FLOOR_COLORS.mortar);
  shader.uniforms.uTerracotta = colorUniform(PLAZA_FLOOR_COLORS.terracotta);
  shader.uniforms.uTerracottaDark = colorUniform(PLAZA_FLOOR_COLORS.terracottaDark);
  shader.uniforms.uLawnLight = colorUniform(PLAZA_FLOOR_COLORS.lawnLight);
  shader.uniforms.uLawnDark = colorUniform(PLAZA_FLOOR_COLORS.lawnDark);
  shader.uniforms.uKerb = colorUniform(PLAZA_FLOOR_COLORS.kerb);

  shader.vertexShader = shader.vertexShader
    .replace('#include <common>', `#include <common>\n${VERTEX_HEADER}`)
    .replace('#include <begin_vertex>', VERTEX_BODY);
  shader.fragmentShader = shader.fragmentShader
    .replace('#include <common>', `#include <common>\n${FRAGMENT_HEADER}`)
    .replace(
      'vec4 diffuseColor = vec4( diffuse, opacity );',
      'vec4 diffuseColor = vec4( plazaAlbedo(vPlazaWorld.xz), opacity );',
    );
}
