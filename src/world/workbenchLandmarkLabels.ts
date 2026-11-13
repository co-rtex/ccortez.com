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

/** Title badges render at a fixed screen size, so only nearby benches show one: full within 14 m, gone by 24 m. */
export const TITLE_BADGE_FULL_DISTANCE = 14;
export const TITLE_BADGE_HIDDEN_DISTANCE = 24;

export function getTitleBadgeOpacity(distance: number): number {
  const t = (distance - TITLE_BADGE_FULL_DISTANCE) / (TITLE_BADGE_HIDDEN_DISTANCE - TITLE_BADGE_FULL_DISTANCE);
  return 1 - Math.min(Math.max(t, 0), 1);
}
