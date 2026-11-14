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

/**
 * The flagship tour: an optional route through the strongest work, offered from inside the panels rather than
 * as a mode. Whenever a bench on the route is open, its panel shows where it sits on the route and buttons to
 * the previous and next stop (travel and open, as from the guide); closing the panel leaves the visitor free to
 * roam. The last stop hands over to the written case studies and resume.
 */
export const FLAGSHIP_TOUR: readonly string[] = [
  'about-me-overview',
  'lidar-phenotyping-research',
  'taskforge',
  'enginex',
  'quantlab',
];

export interface TourStep {
  /** 1-based position on the route. */
  position: number;
  total: number;
  previousId: string | null;
  nextId: string | null;
}

export function getTourStep(workbenchId: string): TourStep | null {
  const index = FLAGSHIP_TOUR.indexOf(workbenchId);
  if (index === -1) return null;
  return {
    position: index + 1,
    total: FLAGSHIP_TOUR.length,
    previousId: FLAGSHIP_TOUR[index - 1] ?? null,
    nextId: FLAGSHIP_TOUR[index + 1] ?? null,
  };
}
