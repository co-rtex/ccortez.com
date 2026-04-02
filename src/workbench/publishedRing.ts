import {
  CENTRAL_PLAZA_CENTER_PAD_RADIUS,
  START_HERE_ROTATION_Y,
  START_HERE_WORKBENCH_ID,
  getCentralPlazaPerimeterRadius,
  getCentralPlazaRadius,
  getWorkbenchFacingCenterRotationY,
} from '../world/hub';

import type { WorkbenchDefinition, WorkbenchPlacement } from '../types/workbench';

export const WORKBENCH_CLEAR_RADIUS = 4.5;
const SOUTH_ENTRY_ANGLE = -Math.PI / 2;

const DISTRICT_ORDER = {
  'work-experience': 0,
  projects: 1,
  'personal-life': 2,
  clubs: 3,
  extracurriculars: 4,
} as const;

const PRIORITY_ORDER = {
  anchor: 0,
  standard: 1,
  satellite: 2,
} as const;

export interface WorkbenchClearZone {
  x: number;
  z: number;
  radius: number;
  workbenchId: string;
}

export interface PublishedWorkbenchPlazaMetrics {
  centerWorkbenchId: string | null;
  perimeterWorkbenchIds: string[];
  perimeterWorkbenchCount: number;
  centerPadRadius: number;
  perimeterRadius: number;
  plazaRadius: number;
}

function getPlacementYOffset(placement: WorkbenchPlacement): number {
  return placement.yOffset;
}

function isPublishedWorkbench(definition: WorkbenchDefinition): boolean {
  return definition.visibility === 'published';
}

function isStartHereWorkbench(definition: WorkbenchDefinition): boolean {
  return definition.id === START_HERE_WORKBENCH_ID;
}

function getOrderedPerimeterWorkbenches(definitions: WorkbenchDefinition[]): WorkbenchDefinition[] {
  const published = definitions
    .map((definition, order) => ({ definition, order }))
    .filter(({ definition }) => isPublishedWorkbench(definition) && !isStartHereWorkbench(definition));

  return published
    .sort((left, right) => {
      const districtDelta = DISTRICT_ORDER[left.definition.district] - DISTRICT_ORDER[right.definition.district];
      if (districtDelta !== 0) {
        return districtDelta;
      }

      const priorityDelta =
        PRIORITY_ORDER[left.definition.priorityTier] - PRIORITY_ORDER[right.definition.priorityTier];
      if (priorityDelta !== 0) {
        return priorityDelta;
      }

      return left.order - right.order;
    })
    .map(({ definition }) => definition);
}

export function getPublishedWorkbenchPlazaMetrics(
  definitions: WorkbenchDefinition[],
): PublishedWorkbenchPlazaMetrics {
  const centerWorkbench = definitions.find(
    (definition) => isPublishedWorkbench(definition) && isStartHereWorkbench(definition),
  );
  const perimeterWorkbenches = getOrderedPerimeterWorkbenches(definitions);

  return {
    centerWorkbenchId: centerWorkbench?.id ?? null,
    perimeterWorkbenchIds: perimeterWorkbenches.map((definition) => definition.id),
    perimeterWorkbenchCount: perimeterWorkbenches.length,
    centerPadRadius: CENTRAL_PLAZA_CENTER_PAD_RADIUS,
    perimeterRadius: getCentralPlazaPerimeterRadius(perimeterWorkbenches.length),
    plazaRadius: getCentralPlazaRadius(perimeterWorkbenches.length),
  };
}

export function applyPublishedWorkbenchRingLayout(
  definitions: WorkbenchDefinition[],
): WorkbenchDefinition[] {
  const published = definitions.filter(isPublishedWorkbench);
  if (published.length === 0) {
    return definitions;
  }

  const metrics = getPublishedWorkbenchPlazaMetrics(definitions);
  const perimeterWorkbenches = getOrderedPerimeterWorkbenches(definitions);
  const slotStep = (Math.PI * 2) / Math.max(perimeterWorkbenches.length + 1, 4);
  const placementsById = new Map<string, WorkbenchPlacement>();

  for (const definition of definitions) {
    if (!isPublishedWorkbench(definition)) {
      continue;
    }

    if (isStartHereWorkbench(definition)) {
      placementsById.set(definition.id, {
        mode: 'freeform',
        x: 0,
        z: 0,
        rotationY: START_HERE_ROTATION_Y,
        yOffset: getPlacementYOffset(definition.placement),
      });
    }
  }

  perimeterWorkbenches.forEach((definition, index) => {
    const angle = SOUTH_ENTRY_ANGLE - slotStep * (index + 1);
    const x = Number((Math.cos(angle) * metrics.perimeterRadius).toFixed(3));
    const z = Number((Math.sin(angle) * metrics.perimeterRadius).toFixed(3));

    placementsById.set(definition.id, {
      mode: 'freeform',
      x,
      z,
      rotationY: getWorkbenchFacingCenterRotationY(x, z),
      yOffset: getPlacementYOffset(definition.placement),
    });
  });

  return definitions.map((definition) =>
    isPublishedWorkbench(definition)
      ? {
          ...definition,
          placement: placementsById.get(definition.id) ?? definition.placement,
        }
      : definition,
  );
}

export function getPublishedWorkbenchClearZones(
  definitions: WorkbenchDefinition[],
): WorkbenchClearZone[] {
  return definitions.flatMap((definition) => {
    if (!isPublishedWorkbench(definition) || definition.placement.mode !== 'freeform') {
      return [];
    }

    return [
      {
        x: definition.placement.x,
        z: definition.placement.z,
        radius: WORKBENCH_CLEAR_RADIUS,
        workbenchId: definition.id,
      },
    ];
  });
}
