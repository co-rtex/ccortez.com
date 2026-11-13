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

export function getTitleBadgeOpacity(distance: number): number {
  return distance <= TITLE_BADGE_RANGE ? 1 : 0;
}
