import { Vector3 } from 'three';
import type { WebGLProgramParametersWithUniforms } from 'three';

/**
 * Screen-door dither for foliage that stands between the camera and the player, so canopies never hide the
 * avatar. Shared by every foliage material; `OCCLUSION_UNIFORMS.uPlayer` is updated once per frame.
 */
export const OCCLUSION_UNIFORMS = {
  uPlayer: { value: new Vector3(0, -1000, 0) },
};

/** Fragment-space test, mirrored in TypeScript for tests: how strongly a point occludes the player (0..1). */
export function getOcclusionStrength(
  point: { x: number; y: number; z: number },
  camera: { x: number; y: number; z: number },
  player: { x: number; y: number; z: number },
): number {
  const sx = player.x - camera.x;
  const sy = player.y + 0.9 - camera.y;
  const sz = player.z - camera.z;
  const len2 = sx * sx + sy * sy + sz * sz || 1;
  const t = Math.min(Math.max(((point.x - camera.x) * sx + (point.y - camera.y) * sy + (point.z - camera.z) * sz) / len2, 0), 1);
  const dx = point.x - (camera.x + sx * t);
  const dy = point.y - (camera.y + sy * t);
  const dz = point.z - (camera.z + sz * t);
  const d = Math.hypot(dx, dy, dz);
  const radial = 1 - Math.min(Math.max((d - 1.6) / 1.4, 0), 1);
  return t > 0.04 && t < 0.88 ? radial : 0;
}

export function applyOcclusionDither(shader: WebGLProgramParametersWithUniforms): void {
  shader.uniforms.uPlayer = OCCLUSION_UNIFORMS.uPlayer;
  shader.vertexShader = shader.vertexShader
    .replace('#include <common>', '#include <common>\nvarying vec3 vOccluderWorld;')
    .replace(
      '#include <project_vertex>',
      `#include <project_vertex>
#ifdef USE_INSTANCING
  vOccluderWorld = (modelMatrix * instanceMatrix * vec4(transformed, 1.0)).xyz;
#else
  vOccluderWorld = (modelMatrix * vec4(transformed, 1.0)).xyz;
#endif`,
    );
  shader.fragmentShader = shader.fragmentShader
    .replace('#include <common>', '#include <common>\nvarying vec3 vOccluderWorld;\nuniform vec3 uPlayer;')
    .replace(
      '#include <clipping_planes_fragment>',
      `#include <clipping_planes_fragment>
  {
    vec3 seg = (uPlayer + vec3(0.0, 0.9, 0.0)) - cameraPosition;
    float t = clamp(dot(vOccluderWorld - cameraPosition, seg) / max(dot(seg, seg), 0.0001), 0.0, 1.0);
    float d = length(vOccluderWorld - (cameraPosition + seg * t));
    float strength = (1.0 - smoothstep(1.6, 3.0, d)) * step(0.04, t) * (1.0 - step(0.88, t));
    // Ordered 4x4 Bayer threshold: an even stipple instead of grainy noise.
    ivec2 cell = ivec2(mod(gl_FragCoord.xy, 4.0));
    int index = cell.x + cell.y * 4;
    float bayer[16] = float[16](0.0, 8.0, 2.0, 10.0, 12.0, 4.0, 14.0, 6.0, 3.0, 11.0, 1.0, 9.0, 15.0, 7.0, 13.0, 5.0);
    float threshold = (bayer[index] + 0.5) / 16.0;
    if (strength * 0.85 > threshold) discard;
  }`,
    );
}
