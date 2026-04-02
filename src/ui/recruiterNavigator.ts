import type { WorldAnchor } from '../types/experience';
import type { WorkbenchRuntimeRecord } from '../workbench/runtime';
import { START_HERE_WORKBENCH_ID } from '../world/hub';

export type RecruiterNavigatorCategory = 'start' | 'experience' | 'project' | 'secondary';
export type RecruiterMarkerState = 'default' | 'nearby' | 'active' | 'disabled';

export interface RecruiterMapMarker {
  id: string;
  title: string;
  districtLabel: string;
  category: RecruiterNavigatorCategory;
  categoryLabel: string;
  featured: boolean;
  state: RecruiterMarkerState;
  xPercent: number;
  yPercent: number;
  canOpen: boolean;
}

export interface RecruiterShortlistEntry {
  id: string;
  title: string;
  districtLabel: string;
  category: Extract<RecruiterNavigatorCategory, 'experience' | 'project'>;
  categoryLabel: string;
  featured: boolean;
  state: Exclude<RecruiterMarkerState, 'disabled'>;
}

export interface RecruiterStartEntry {
  id: string;
  title: string;
  districtLabel: string;
  state: Exclude<RecruiterMarkerState, 'disabled'>;
}

export interface RecruiterShortlistSection {
  id: Extract<RecruiterNavigatorCategory, 'experience' | 'project'>;
  label: string;
  entries: RecruiterShortlistEntry[];
}

export interface RecruiterNavigatorData {
  markers: RecruiterMapMarker[];
  startEntry: RecruiterStartEntry | null;
  shortlistSections: RecruiterShortlistSection[];
  playerMarker: {
    xPercent: number;
    yPercent: number;
  };
  counts: {
    start: number;
    experience: number;
    project: number;
    secondary: number;
  };
}

const MAP_PADDING_PERCENT = 9;
const PRIORITY_TIER_ORDER = {
  anchor: 0,
  standard: 1,
  satellite: 2,
} as const;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function normalizeMapCoordinate(value: number, min: number, max: number): number {
  if (max - min < 0.001) {
    return 50;
  }

  const normalized = (value - min) / (max - min);
  return clamp(
    MAP_PADDING_PERCENT + normalized * (100 - MAP_PADDING_PERCENT * 2),
    MAP_PADDING_PERCENT,
    100 - MAP_PADDING_PERCENT,
  );
}

function getPublishedWorkbenches(workbenches: WorkbenchRuntimeRecord[]): WorkbenchRuntimeRecord[] {
  return workbenches.filter((workbench) => workbench.definition.visibility === 'published');
}

function getMapBounds(workbenches: WorkbenchRuntimeRecord[]): {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
} {
  if (workbenches.length === 0) {
    return {
      minX: -1,
      maxX: 1,
      minZ: -1,
      maxZ: 1,
    };
  }

  const anchors = workbenches.map((workbench) => workbench.placement.anchor);
  return {
    minX: Math.min(...anchors.map((anchor) => anchor.x)),
    maxX: Math.max(...anchors.map((anchor) => anchor.x)),
    minZ: Math.min(...anchors.map((anchor) => anchor.z)),
    maxZ: Math.max(...anchors.map((anchor) => anchor.z)),
  };
}

export function resolveRecruiterNavigatorCategory(
  workbench: WorkbenchRuntimeRecord,
): RecruiterNavigatorCategory {
  if (workbench.definition.id === START_HERE_WORKBENCH_ID) {
    return 'start';
  }

  const linkedType = workbench.linkedExperience?.manifest.type;
  if (linkedType === 'experience' || linkedType === 'project') {
    return linkedType;
  }

  if (workbench.definition.category === 'work-experience') {
    return 'experience';
  }

  if (workbench.definition.category === 'projects') {
    return 'project';
  }

  return 'secondary';
}

export function formatRecruiterCategoryLabel(category: RecruiterNavigatorCategory): string {
  switch (category) {
    case 'start':
      return 'Start Here';
    case 'experience':
      return 'Experience';
    case 'project':
      return 'Project';
    case 'secondary':
      return 'More About Me';
    default:
      return 'Highlight';
  }
}

export function canOpenRecruiterWorkbench(workbench: WorkbenchRuntimeRecord): boolean {
  return !(workbench.definition.contentMode === 'linked' && !workbench.linkedExperience);
}

function resolveMarkerState(
  workbench: WorkbenchRuntimeRecord,
  activeWorkbenchId: string | null,
  nearbyWorkbenchId: string | null,
): RecruiterMarkerState {
  if (!canOpenRecruiterWorkbench(workbench)) {
    return 'disabled';
  }

  if (activeWorkbenchId === workbench.definition.id) {
    return 'active';
  }

  if (nearbyWorkbenchId === workbench.definition.id) {
    return 'nearby';
  }

  return 'default';
}

function sortShortlistEntries(
  left: RecruiterShortlistEntry & { order: number; priorityOrder: number },
  right: RecruiterShortlistEntry & { order: number; priorityOrder: number },
): number {
  if (left.priorityOrder !== right.priorityOrder) {
    return left.priorityOrder - right.priorityOrder;
  }

  return left.order - right.order;
}

export function deriveRecruiterNavigatorData(
  workbenches: WorkbenchRuntimeRecord[],
  playerPosition: WorldAnchor,
  activeWorkbenchId: string | null,
  nearbyWorkbenchId: string | null,
): RecruiterNavigatorData {
  const publishedWorkbenches = getPublishedWorkbenches(workbenches);
  const bounds = getMapBounds(publishedWorkbenches);
  const counts = {
    start: 0,
    experience: 0,
    project: 0,
    secondary: 0,
  };
  let startEntry: RecruiterStartEntry | null = null;

  const shortlistSource: Array<
    RecruiterShortlistEntry & {
      order: number;
      priorityOrder: number;
    }
  > = [];

  const markers = publishedWorkbenches.map((workbench, order) => {
    const category = resolveRecruiterNavigatorCategory(workbench);
    const state = resolveMarkerState(workbench, activeWorkbenchId, nearbyWorkbenchId);
    const featured = workbench.definition.priorityTier === 'anchor';

    counts[category] += 1;

    const marker: RecruiterMapMarker = {
      id: workbench.definition.id,
      title: workbench.definition.title,
      districtLabel: workbench.districtDefinition.label,
      category,
      categoryLabel: formatRecruiterCategoryLabel(category),
      featured,
      state,
      xPercent: normalizeMapCoordinate(workbench.placement.anchor.x, bounds.minX, bounds.maxX),
      yPercent: normalizeMapCoordinate(workbench.placement.anchor.z, bounds.minZ, bounds.maxZ),
      canOpen: state !== 'disabled',
    };

    if (category === 'start' && state !== 'disabled') {
      startEntry = {
        id: marker.id,
        title: marker.title,
        districtLabel: marker.districtLabel,
        state,
      };
    }

    if ((category === 'experience' || category === 'project') && state !== 'disabled') {
      shortlistSource.push({
        id: marker.id,
        title: marker.title,
        districtLabel: marker.districtLabel,
        category,
        categoryLabel: marker.categoryLabel,
        featured,
        state,
        order,
        priorityOrder: PRIORITY_TIER_ORDER[workbench.definition.priorityTier],
      });
    }

    return marker;
  });

  const shortlistSections: RecruiterShortlistSection[] = [
    {
      id: 'experience',
      label: 'Experiences',
      entries: shortlistSource
        .filter((entry) => entry.category === 'experience')
        .sort(sortShortlistEntries)
        .map(({ order: _order, priorityOrder: _priorityOrder, ...entry }) => entry),
    },
    {
      id: 'project',
      label: 'Projects',
      entries: shortlistSource
        .filter((entry) => entry.category === 'project')
        .sort(sortShortlistEntries)
        .map(({ order: _order, priorityOrder: _priorityOrder, ...entry }) => entry),
    },
  ];

  return {
    markers,
    startEntry,
    shortlistSections,
    playerMarker: {
      xPercent: normalizeMapCoordinate(playerPosition.x, bounds.minX, bounds.maxX),
      yPercent: normalizeMapCoordinate(playerPosition.z, bounds.minZ, bounds.maxZ),
    },
    counts,
  };
}
