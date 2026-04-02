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
