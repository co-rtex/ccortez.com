import { SPAWN_HUB_RADIUS } from '../world/hub';

import type { WorkbenchDefinition, WorkbenchPlacement } from '../types/workbench';

export const HUB_RING_RADIUS = SPAWN_HUB_RADIUS + 6;
export const HUB_RING_FACING_YAW = 0;
export const WORKBENCH_CLEAR_RADIUS = 4.5;

export interface WorkbenchClearZone {
  x: number;
  z: number;
  radius: number;
  workbenchId: string;
}

function getPlacementYOffset(placement: WorkbenchPlacement): number {
  return placement.yOffset;
}

function isPublishedWorkbench(definition: WorkbenchDefinition): boolean {
  return definition.visibility === 'published';
}

function isWorkExperienceWorkbench(definition: WorkbenchDefinition): boolean {
  return definition.district === 'work-experience';
}

export function applyPublishedWorkbenchRingLayout(
  definitions: WorkbenchDefinition[],
): WorkbenchDefinition[] {
  const published = definitions.filter(isPublishedWorkbench);
  if (published.length === 0) {
    return definitions;
  }

  const workExperience = published.filter(isWorkExperienceWorkbench);
  const remainingPublished = published.filter((definition) => !isWorkExperienceWorkbench(definition));
  const orderedPublished = [...workExperience, ...remainingPublished];
  const slotStep = (Math.PI * 2) / orderedPublished.length;
  const ringStartAngle = Math.PI - slotStep * ((workExperience.length - 1) / 2);

  const placementsById = new Map(
    orderedPublished.map((definition, index) => {
      const angle = ringStartAngle + slotStep * index;
      return [
        definition.id,
        {
          mode: 'freeform' as const,
          x: Number((Math.cos(angle) * HUB_RING_RADIUS).toFixed(3)),
          z: Number((Math.sin(angle) * HUB_RING_RADIUS).toFixed(3)),
          rotationY: HUB_RING_FACING_YAW,
          yOffset: getPlacementYOffset(definition.placement),
        },
      ] as const;
    }),
  );

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
