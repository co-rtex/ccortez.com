import { PROFESSIONAL_SITE_URL } from '../app/siteLinks';

/**
 * The flagship benches: the work that also has a full case study on the professional site. "Featured" used to be
 * every anchor-tier bench (ten of nineteen), which singled nothing out. Flagships get the guide's tag, a "Case
 * study" chip in the panel, and a name badge that reads from across the plaza, and they flank the north gate the
 * spawn camera faces.
 */
const CASE_STUDY_SLUG_BY_WORKBENCH_ID: Readonly<Record<string, string>> = {
  taskforge: 'taskforge',
  enginex: 'enginex',
  quantlab: 'quantlab',
  'lidar-phenotyping-research': 'lidar-phenotyping',
};

export const FLAGSHIP_WORKBENCH_IDS: readonly string[] = Object.keys(CASE_STUDY_SLUG_BY_WORKBENCH_ID);

export function isFlagshipWorkbench(workbenchId: string): boolean {
  return Object.hasOwn(CASE_STUDY_SLUG_BY_WORKBENCH_ID, workbenchId);
}

export function getCaseStudyUrl(workbenchId: string): string | null {
  const slug = CASE_STUDY_SLUG_BY_WORKBENCH_ID[workbenchId];
  return slug ? `${PROFESSIONAL_SITE_URL}/work/${slug}/` : null;
}
