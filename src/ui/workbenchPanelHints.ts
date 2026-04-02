import type { CameraMode } from '../state/gameStore';
import type { WorkbenchRuntimeRecord } from '../workbench/runtime';

export const WORKBENCH_INSPECT_HINT = 'Drag to rotate • Scroll to zoom';

export function shouldShowWorkbenchInspectHint(
  cameraMode: CameraMode,
  workbench: WorkbenchRuntimeRecord | null | undefined,
): boolean {
  return cameraMode === 'workbench-inspect' && Boolean(workbench);
}
