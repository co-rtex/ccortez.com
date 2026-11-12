import type { WorkbenchRuntimeRecord } from '../workbench/runtime';
import { formatRecruiterCategoryLabel, resolveRecruiterNavigatorCategory } from './recruiterNavigator';

// Pure helpers for the workbench panel header, kept out of the component module for fast refresh.

export function resolvePanelEyebrow(workbench: WorkbenchRuntimeRecord | undefined): string {
  if (!workbench) {
    return 'Recruiter Guide';
  }

  const category = resolveRecruiterNavigatorCategory(workbench);
  if (category === 'start') {
    return 'Start Here';
  }

  return category === 'secondary' ? 'More About Me' : 'Recruiter Brief';
}

export function buildWorkbenchMetaChips(workbench: WorkbenchRuntimeRecord): Array<{
  label: string;
  tone: 'start' | 'experience' | 'project' | 'secondary' | 'featured' | 'default';
}> {
  const category = resolveRecruiterNavigatorCategory(workbench);
  const chips: Array<{
    label: string;
    tone: 'start' | 'experience' | 'project' | 'secondary' | 'featured' | 'default';
  }> = [];

  if (category === 'secondary') {
    chips.push({
      label: 'More About Me',
      tone: 'secondary',
    });
  } else if (category === 'start') {
    chips.push({
      label: 'Start Here',
      tone: 'start',
    });
  } else {
    chips.push({
      label: `Type: ${formatRecruiterCategoryLabel(category)}`,
      tone: category,
    });
  }

  chips.push({
    label: `District: ${workbench.districtDefinition.label}`,
    tone: 'default',
  });

  if (workbench.definition.priorityTier === 'anchor') {
    chips.push({
      label: 'Featured',
      tone: 'featured',
    });
  }

  return chips;
}
