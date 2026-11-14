/**
 * The arrival vista: the first view of the island. The follow camera's usual pose (low, behind the avatar) stacked
 * the fountain, the Start Here board and the lighthouse into one column down the middle of the screen, with the
 * four flagship benches a thin band beyond. On a plain first visit the camera instead opens higher and further back,
 * so the plaza reads like a map: Start Here in front of the avatar, the Work Experience and Projects signs either
 * side, and the named flagships beside the north gate. The moment the visitor moves, opens a bench or travels, it
 * eases down to the follow pose; under reduced motion it cuts. Nothing waits on it: there is no cinematic.
 */
export const VISTA_CAMERA_OFFSET = { x: 0, y: 16.2, z: 20 } as const;
export const VISTA_LOOK_OFFSET = { x: 0, y: 0, z: -15.5 } as const;
/** Seconds the camera takes to settle from the vista into the follow pose. */
export const VISTA_SETTLE_SECONDS = 1.1;
/** On portrait and narrow screens the vista shows only the middle of the plaza, so it is not used there. */
export const VISTA_MIN_ASPECT = 1.2;
/** Movement this far from the spawn point ends the vista. */
export const VISTA_END_DISTANCE = 0.3;

/** Parameters that set up a particular view (screenshots, deep links); with any of them, there is no vista. */
const VIEW_PARAMS = ['shot', 'bench', 'spawn', 'avatar', 'tfsim', 'workbenchEditor'];

export function shouldOpenWithVista(search: string, aspect: number): boolean {
  const params = new URLSearchParams(search);
  return aspect >= VISTA_MIN_ASPECT && !VIEW_PARAMS.some((name) => params.has(name));
}

/** Remaining vista progress (1 = full vista, 0 = follow pose) after `delta` seconds of settling. */
export function settleVista(progress: number, delta: number, reducedMotion: boolean): number {
  if (reducedMotion) return 0;
  return Math.max(0, progress - delta / VISTA_SETTLE_SECONDS);
}

/** Eased blend weight for a progress value, so the settle starts and ends gently. */
export function vistaBlend(progress: number): number {
  const t = Math.min(1, Math.max(0, progress));
  return t * t * (3 - 2 * t);
}
