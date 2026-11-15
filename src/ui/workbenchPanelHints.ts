import type { CameraMode } from '../state/gameStore';
import type { WorkbenchRuntimeRecord } from '../workbench/runtime';

export const WORKBENCH_INSPECT_HINT = 'Drag to rotate • Scroll to zoom';
export const WORKBENCH_INSPECT_HINT_TOUCH = 'Drag to rotate • Pinch to zoom';

export function getWorkbenchInspectHint(isTouch: boolean): string {
  return isTouch ? WORKBENCH_INSPECT_HINT_TOUCH : WORKBENCH_INSPECT_HINT;
}

/** The walk-up prompt's second line. Touch screens have no E key, and the bench itself says "Tap to open". */
export function getWorkbenchPromptSubtitle(isTouch: boolean, isDraft: boolean): string {
  const action = isTouch ? 'Tap the workbench' : 'Press E or click workbench';
  return isDraft ? `${action} to preview draft details` : `${action} to open details`;
}

export function shouldShowWorkbenchInspectHint(
  cameraMode: CameraMode,
  workbench: WorkbenchRuntimeRecord | null | undefined,
): boolean {
  return cameraMode === 'workbench-inspect' && Boolean(workbench);
}
