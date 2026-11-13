import type { WorkbenchRuntimeRecord } from '../workbench/runtime';

export function shouldShowPersistentWorkbenchTitleBadge(
  workbench: WorkbenchRuntimeRecord,
  editorEnabled: boolean,
): boolean {
  return !editorEnabled && workbench.definition.visibility === 'published';
}

export function shouldShowWorkbenchProximityPrompt(
  workbench: WorkbenchRuntimeRecord,
  isNearby: boolean,
): boolean {
  return isNearby && workbench.definition.visibility === 'published';
}

/**
 * Title badges render at a fixed screen size, so only nearby benches show one. A badge is either fully shown or
 * hidden (CSS fades the switch); half-transparent pills read as rendering glitches.
 */
export const TITLE_BADGE_RANGE = 20;
/** Flagship badges read from anywhere on the plaza, so the first screen names the work worth walking to. */
export const FLAGSHIP_TITLE_BADGE_RANGE = 48;
/** Below this canvas width the far flagship badges land half off-screen, so they keep the normal range. */
export const FLAGSHIP_BADGE_MIN_VIEWPORT_WIDTH = 900;

export function getTitleBadgeOpacity(distance: number, flagship = false): number {
  return distance <= (flagship ? FLAGSHIP_TITLE_BADGE_RANGE : TITLE_BADGE_RANGE) ? 1 : 0;
}
