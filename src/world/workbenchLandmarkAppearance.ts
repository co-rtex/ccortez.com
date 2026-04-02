import type { WorkbenchRuntimeRecord } from '../workbench/runtime';

export const EXPERIENCE_RING_COLOR = '#ea8f2b';
export const PROJECT_RING_COLOR = '#5f9cff';
export const ISSUE_ERROR_RING_COLOR = '#f48f5c';
export const ISSUE_WARNING_RING_COLOR = '#f4cc82';

export function getWorkbenchRingColor(
  workbench: WorkbenchRuntimeRecord,
  issueSeverity: 'error' | 'warning' | 'valid',
  fallbackColor: string,
): string {
  if (issueSeverity === 'error') {
    return ISSUE_ERROR_RING_COLOR;
  }

  if (issueSeverity === 'warning') {
    return ISSUE_WARNING_RING_COLOR;
  }

  const linkedType = workbench.linkedExperience?.manifest.type;
  if (linkedType === 'experience' || workbench.definition.category === 'work-experience') {
    return EXPERIENCE_RING_COLOR;
  }

  if (linkedType === 'project' || workbench.definition.category === 'projects') {
    return PROJECT_RING_COLOR;
  }

  return fallbackColor;
}
