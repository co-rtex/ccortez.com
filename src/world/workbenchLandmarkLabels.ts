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

/** Rough half-width of a long title badge, in CSS pixels. */
const BADGE_HALF_WIDTH_PX = 120;

/**
 * Whether a badge centred at `ndcX` (normalised device x, -1..1) fits across a canvas `viewportWidth` pixels wide.
 * Long-range badges that would land half off the edge are hidden rather than shown cut off.
 */
export function badgeFitsAcross(ndcX: number, viewportWidth: number): boolean {
  const margin = (2 * BADGE_HALF_WIDTH_PX) / Math.max(viewportWidth, 1);
  return Math.abs(ndcX) <= 1 - margin;
}
