import { PROFESSIONAL_SITE_URL } from '../app/siteLinks';

/**
 * The flagship benches: the work that also has a full case study on the professional site. "Featured" used to be
 * every anchor-tier bench (ten of nineteen), which singled nothing out. Flagships get the guide's "Case study" tag,
 * a "Read the case study" link in the panel, and a numbered name badge that reads from across the plaza, and they
 * flank the north gate the spawn camera faces.
 *
 * Keep this map in step with `islandBench` in the professional site's src/content/caseStudies.ts (both repos pin it
 * in a test).
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

/**
 * Flagships whose panel has a model the visitor can operate (crash a worker, send an order, re-run a backtest).
 * LiDAR's bench animates a seeded scan pass but has no controls, so it is not counted as a live model.
 */
const INTERACTIVE_FLAGSHIP_IDS: ReadonlySet<string> = new Set(['taskforge', 'enginex', 'quantlab']);

export function hasInteractiveModel(workbenchId: string): boolean {
  return INTERACTIVE_FLAGSHIP_IDS.has(workbenchId);
}

/**
 * Role benches with authored dioramas (the industry internship, the research-computing job and the QA role). Like
 * the flagships, they are named from across the plaza, so the main roles do not read as scenery. A long-range badge
 * that would sit half off the screen's edge is hidden (`badgeFitsAcross`).
 */
const LANDMARK_ROLE_IDS: ReadonlySet<string> = new Set(['hcsc-automation', 'ssec-technical-computing', 'phoenix-aid-qa']);

/** Benches whose name badge shows from across the plaza (the flagships and the main role benches). */
export function hasLongRangeLabel(workbenchId: string): boolean {
  return isFlagshipWorkbench(workbenchId) || LANDMARK_ROLE_IDS.has(workbenchId);
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
// The same order as the case studies on the professional site (TaskForge, EngineX, QuantLab, LiDAR), after Start Here.
export const FLAGSHIP_TOUR: readonly string[] = [
  'about-me-overview',
  'taskforge',
  'enginex',
  'quantlab',
  'lidar-phenotyping-research',
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
