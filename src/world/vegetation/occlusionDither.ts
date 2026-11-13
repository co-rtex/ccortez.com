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
    vOccluderFade = (1.0 - smoothstep(1.8, 3.4, d)) * step(0.04, t) * (1.0 - step(0.86, t));
  }`,
    );
  shader.fragmentShader = shader.fragmentShader
    .replace('#include <common>', '#include <common>\nvarying float vOccluderFade;')
    // With alpha-to-coverage on a multisampled canvas, alpha becomes sub-pixel coverage: an even fade.
    .replace('#include <dithering_fragment>', '#include <dithering_fragment>\n  gl_FragColor.a = 1.0 - vOccluderFade * 0.8;');
}
