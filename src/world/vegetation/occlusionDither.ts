import { Vector3 } from 'three';
import type { WebGLProgramParametersWithUniforms } from 'three';

/**
 * Screen-door dither for foliage that stands between the camera and the player, so canopies never hide the
 * avatar. Shared by every foliage material; `OCCLUSION_UNIFORMS.uPlayer` is updated once per frame.
 */
export const OCCLUSION_UNIFORMS = {
  uPlayer: { value: new Vector3(0, -1000, 0) },
};

/**
 * TypeScript mirror of the vertex-shader test below, for tests: how strongly an instance whose centre is at
 * `centre` fades (0..1) because it sits between the camera and the player. Keep the constants in sync.
 */
export const OCCLUSION_INNER_RADIUS = 1.8;
export const OCCLUSION_OUTER_RADIUS = 3.4;
export const OCCLUSION_T_MIN = 0.04;
export const OCCLUSION_T_MAX = 0.86;

export function getOcclusionStrength(
  centre: { x: number; y: number; z: number },
  camera: { x: number; y: number; z: number },
  player: { x: number; y: number; z: number },
): number {
  const sx = player.x - camera.x;
  const sy = player.y + 0.9 - camera.y;
  const sz = player.z - camera.z;
  const len2 = sx * sx + sy * sy + sz * sz || 1;
  const t = Math.min(
    Math.max(((centre.x - camera.x) * sx + (centre.y - camera.y) * sy + (centre.z - camera.z) * sz) / len2, 0),
    1,
  );
  const d = Math.hypot(centre.x - (camera.x + sx * t), centre.y - (camera.y + sy * t), centre.z - (camera.z + sz * t));
  const edge = Math.min(Math.max((d - OCCLUSION_INNER_RADIUS) / (OCCLUSION_OUTER_RADIUS - OCCLUSION_INNER_RADIUS), 0), 1);
  const radial = 1 - edge * edge * (3 - 2 * edge);
  return t >= OCCLUSION_T_MIN && t < OCCLUSION_T_MAX ? radial : 0;
}

export function applyOcclusionDither(shader: WebGLProgramParametersWithUniforms): void {
  shader.uniforms.uPlayer = OCCLUSION_UNIFORMS.uPlayer;
  shader.vertexShader = shader.vertexShader
    .replace('#include <common>', '#include <common>\nvarying float vOccluderFade;\nuniform vec3 uPlayer;')
    .replace(
      '#include <project_vertex>',
      `#include <project_vertex>
  {
    // Fade from the instance's centre, so a whole canopy puff fades evenly instead of streaking per pixel.
#ifdef USE_INSTANCING
    vec3 centre = (modelMatrix * instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0)).xyz;
#else
    vec3 centre = (modelMatrix * vec4(0.0, 0.0, 0.0, 1.0)).xyz;
#endif
    vec3 seg = (uPlayer + vec3(0.0, 0.9, 0.0)) - cameraPosition;
    float t = clamp(dot(centre - cameraPosition, seg) / max(dot(seg, seg), 0.0001), 0.0, 1.0);
    float d = length(centre - (cameraPosition + seg * t));
    vOccluderFade = (1.0 - smoothstep(${OCCLUSION_INNER_RADIUS.toFixed(2)}, ${OCCLUSION_OUTER_RADIUS.toFixed(2)}, d)) * step(${OCCLUSION_T_MIN.toFixed(2)}, t) * (1.0 - step(${OCCLUSION_T_MAX.toFixed(2)}, t));
  }`,
    );
  shader.fragmentShader = shader.fragmentShader
    .replace('#include <common>', '#include <common>\nvarying float vOccluderFade;')
    // With alpha-to-coverage on a multisampled canvas, alpha becomes sub-pixel coverage: an even fade.
    .replace('#include <dithering_fragment>', '#include <dithering_fragment>\n  gl_FragColor.a = 1.0 - vOccluderFade * 0.8;');
}
