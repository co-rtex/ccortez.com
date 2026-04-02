import { WORKBENCH_DISTRICTS } from '../../content/workbenches/layout';

import { projectPointOntoCorridor, resolveWorkbenchPlacement } from './placement';

import type {
  WorkbenchCategory,
  WorkbenchCorridorId,
  WorkbenchDefinition,
  WorkbenchDistrict,
  WorkbenchPlacement,
  WorkbenchResolvedPlacement,
  WorkbenchVisualRecipe,
} from '../types/workbench';

export type WorkbenchEditorTransformMode = 'move' | 'rotate' | 'height' | 'snap';

export const MIN_WORKBENCH_Y_OFFSET = -0.4;
export const MAX_WORKBENCH_Y_OFFSET = 4;

interface DistrictSeedDefinition {
  category: WorkbenchCategory;
  corridorId: WorkbenchCorridorId;
  distanceAlong: number;
  lateralOffset: number;
  visualRecipe: WorkbenchVisualRecipe;
}

export const districtDefaults: Record<WorkbenchDistrict, DistrictSeedDefinition> = {
  'work-experience': {
    category: 'work-experience',
    corridorId: 'southeast-trail',
    distanceAlong: 24,
    lateralOffset: 2.8,
    visualRecipe: {
      archetype: 'console-desk',
      palette: 'work-ember',
      accentMaterial: 'brushed-metal',
      propKit: 'software-station',
      heroProp: 'monitor-stack',
      animationStyle: 'signal-blink',
    },
  },
  projects: {
    category: 'projects',
    corridorId: 'east-promenade',
    distanceAlong: 19,
    lateralOffset: 2.3,
    visualRecipe: {
      archetype: 'atelier-worktable',
      palette: 'project-citrine',
      accentMaterial: 'powder-coat',
      propKit: 'prototype-lab',
      heroProp: 'signal-dish',
      animationStyle: 'soft-orbit',
    },
  },
  'personal-life': {
    category: 'personal-life',
    corridorId: 'north-rise',
    distanceAlong: 21,
    lateralOffset: -2.5,
    visualRecipe: {
      archetype: 'journal-console',
      palette: 'personal-rose',
      accentMaterial: 'ceramic',
      propKit: 'reflection-nook',
      heroProp: 'memory-orb',
      animationStyle: 'paper-breeze',
    },
  },
  clubs: {
    category: 'clubs',
    corridorId: 'west-ridge',
    distanceAlong: 17,
    lateralOffset: -2.7,
    visualRecipe: {
      archetype: 'commons-table',
      palette: 'club-verde',
      accentMaterial: 'warm-wood',
      propKit: 'club-circle',
      heroProp: 'club-banner',
      animationStyle: 'idle-pulse',
    },
  },
  extracurriculars: {
    category: 'extracurriculars',
    corridorId: 'southwest-trail',
    distanceAlong: 17,
    lateralOffset: -2.6,
    visualRecipe: {
      archetype: 'field-station',
      palette: 'extra-cobalt',
      accentMaterial: 'frosted-glass',
      propKit: 'field-kit',
      heroProp: 'wayfinder-arch',
      animationStyle: 'soft-orbit',
    },
  },
};

function toSlug(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^-|-$/g, '');
}

function createUniqueId(baseId: string, existingIds: Set<string>): string {
  if (!existingIds.has(baseId)) {
    return baseId;
  }

  let suffix = 2;
  while (existingIds.has(`${baseId}-${suffix}`)) {
    suffix += 1;
  }

  return `${baseId}-${suffix}`;
}

function normalizeAngle(angle: number): number {
  return Math.atan2(Math.sin(angle), Math.cos(angle));
}

function clampWorkbenchHeightOffsetValue(yOffset: number): number {
  return Math.min(MAX_WORKBENCH_Y_OFFSET, Math.max(MIN_WORKBENCH_Y_OFFSET, yOffset));
}

function resolveFromPlacement(placement: WorkbenchPlacement): WorkbenchResolvedPlacement {
  return resolveWorkbenchPlacement(placement);
}

function getDistrictCorridorIds(district: WorkbenchDistrict): WorkbenchCorridorId[] {
  return WORKBENCH_DISTRICTS.find((entry) => entry.id === district)?.corridors ?? [districtDefaults[district].corridorId];
}

export function createDistrictSeedCorridorPlacement(
  district: WorkbenchDistrict,
  yOffset = 0.18,
): Extract<WorkbenchPlacement, { mode: 'corridor' }> {
  const defaults = districtDefaults[district];
  return {
    mode: 'corridor',
    corridorId: defaults.corridorId,
    distanceAlong: defaults.distanceAlong,
    lateralOffset: defaults.lateralOffset,
    yawMode: 'follow-road',
    yawOffset: 0,
    yOffset,
  };
}

export function createSeededFreeformPlacement(
  district: WorkbenchDistrict,
  yOffset = 0.18,
): Extract<WorkbenchPlacement, { mode: 'freeform' }> {
  const resolved = resolveFromPlacement(createDistrictSeedCorridorPlacement(district, yOffset));
  return {
    mode: 'freeform',
    x: resolved.anchor.x,
    z: resolved.anchor.z,
    rotationY: resolved.rotationY,
    yOffset,
  };
}

function projectToNearestDistrictCorridor(district: WorkbenchDistrict, x: number, z: number) {
  let best:
    | {
        corridorId: WorkbenchCorridorId;
        distanceAlong: number;
        lateralOffset: number;
        rotationY: number;
        distanceSquared: number;
      }
    | undefined;

  for (const corridorId of getDistrictCorridorIds(district)) {
    const projected = projectPointOntoCorridor(corridorId, x, z);
    const resolved = resolveFromPlacement({
      mode: 'corridor',
      corridorId,
      distanceAlong: projected.distanceAlong,
      lateralOffset: projected.lateralOffset,
      yawMode: 'follow-road',
      yawOffset: 0,
      yOffset: 0,
    });
    const distanceSquared =
      (resolved.anchor.x - x) * (resolved.anchor.x - x) +
      (resolved.anchor.z - z) * (resolved.anchor.z - z);

    if (!best || distanceSquared < best.distanceSquared) {
      best = {
        corridorId,
        distanceAlong: projected.distanceAlong,
        lateralOffset: projected.lateralOffset,
        rotationY: projected.rotationY,
        distanceSquared,
      };
    }
  }

  return best;
}

export function createDraftWorkbenchDefinition(
  existingIds: Set<string>,
  district: WorkbenchDistrict = 'projects',
): WorkbenchDefinition {
  const defaults = districtDefaults[district];
  const baseId = `${district}-placeholder`;

  return {
    id: createUniqueId(baseId, existingIds),
    title: `${WORKBENCH_DISTRICTS.find((entry) => entry.id === district)?.label ?? district} Placeholder`,
    category: defaults.category,
    district,
    visibility: 'draft',
    contentMode: 'placeholder',
    presentationMode: 'scene-owned',
    placement: createSeededFreeformPlacement(district, 0.18),
    interactionRadius: 3.2,
    priorityTier: 'standard',
    visualRecipe: defaults.visualRecipe,
    draftNotes: 'Describe the story, props, and reasons this bench belongs in the district.',
  };
}

export function duplicateWorkbenchDefinition(
  source: WorkbenchDefinition,
  existingIds: Set<string>,
): WorkbenchDefinition {
  return {
    ...source,
    id: createUniqueId(`${source.id}-copy`, existingIds),
    title: `${source.title} Copy`,
    visibility: 'draft',
  };
}

export function withDistrictDefaults(
  definition: WorkbenchDefinition,
  district: WorkbenchDistrict,
): WorkbenchDefinition {
  const defaults = districtDefaults[district];
  if (definition.placement.mode !== 'corridor') {
    return {
      ...definition,
      district,
      category: defaults.category,
      visualRecipe: {
        ...definition.visualRecipe,
        palette: defaults.visualRecipe.palette,
      },
    };
  }

  const corridorIds = getDistrictCorridorIds(district);
  const currentPlacement = definition.placement;
  const corridorId = corridorIds.includes(currentPlacement.corridorId) ? currentPlacement.corridorId : defaults.corridorId;

  return {
    ...definition,
    district,
    category: defaults.category,
    placement: {
      ...currentPlacement,
      corridorId,
      lateralOffset: corridorIds.includes(currentPlacement.corridorId)
        ? currentPlacement.lateralOffset
        : defaults.lateralOffset,
    },
    visualRecipe: {
      ...definition.visualRecipe,
      palette: defaults.visualRecipe.palette,
    },
  };
}

export function convertWorkbenchToFreeformAtCurrentPose(
  definition: WorkbenchDefinition,
): WorkbenchDefinition {
  const currentPlacement = resolveFromPlacement(definition.placement);
  return {
    ...definition,
    placement: {
      mode: 'freeform',
      x: currentPlacement.anchor.x,
      z: currentPlacement.anchor.z,
      rotationY: normalizeAngle(currentPlacement.rotationY),
      yOffset: clampWorkbenchHeightOffsetValue(definition.placement.yOffset),
    },
  };
}

export function switchWorkbenchPlacementMode(
  definition: WorkbenchDefinition,
  nextMode: WorkbenchPlacement['mode'],
): WorkbenchDefinition {
  if (definition.placement.mode === nextMode) {
    return definition;
  }

  if (nextMode === 'freeform') {
    return convertWorkbenchToFreeformAtCurrentPose(definition);
  }

  return snapWorkbenchToDistrictCorridor(definition);
}

export function resetWorkbenchPlacementToDistrictSeed(
  definition: WorkbenchDefinition,
): WorkbenchDefinition {
  const yOffset = definition.placement.yOffset;
  return {
    ...definition,
    placement:
      definition.placement.mode === 'corridor'
        ? createDistrictSeedCorridorPlacement(definition.district, yOffset)
        : createSeededFreeformPlacement(definition.district, yOffset),
  };
}

export function snapWorkbenchToDistrictCorridor(definition: WorkbenchDefinition): WorkbenchDefinition {
  const resolved = resolveFromPlacement(definition.placement);
  const projected = projectToNearestDistrictCorridor(definition.district, resolved.anchor.x, resolved.anchor.z);
  if (!projected) {
    return definition;
  }

  const yawMode = definition.placement.mode === 'corridor' ? definition.placement.yawMode : 'follow-road';

  return {
    ...definition,
    placement: {
      mode: 'corridor',
      corridorId: projected.corridorId,
      distanceAlong: projected.distanceAlong,
      lateralOffset: projected.lateralOffset,
      yawMode,
      yawOffset:
        yawMode === 'follow-road'
          ? normalizeAngle(resolved.rotationY - projected.rotationY)
          : normalizeAngle(resolved.rotationY),
      yOffset: definition.placement.yOffset,
    },
  };
}

export function updateWorkbenchPlacementFromGroundPoint(
  definition: WorkbenchDefinition,
  x: number,
  z: number,
): WorkbenchDefinition {
  if (definition.placement.mode === 'freeform') {
    return {
      ...definition,
      placement: {
        ...definition.placement,
        x,
        z,
      },
    };
  }

  const projected = projectPointOntoCorridor(definition.placement.corridorId, x, z);
  return {
    ...definition,
    placement: {
      ...definition.placement,
      distanceAlong: projected.distanceAlong,
      lateralOffset: projected.lateralOffset,
    },
  };
}

export function updateWorkbenchRotationFromResolvedYaw(
  definition: WorkbenchDefinition,
  rotationY: number,
): WorkbenchDefinition {
  const normalizedRotationY = normalizeAngle(rotationY);

  if (definition.placement.mode === 'freeform') {
    return {
      ...definition,
      placement: {
        ...definition.placement,
        rotationY: normalizedRotationY,
      },
    };
  }

  const currentPlacement = resolveFromPlacement(definition.placement);
  const projected = projectPointOntoCorridor(
    definition.placement.corridorId,
    currentPlacement.anchor.x,
    currentPlacement.anchor.z,
  );

  return {
    ...definition,
    placement: {
      ...definition.placement,
      yawOffset:
        definition.placement.yawMode === 'follow-road'
          ? normalizeAngle(normalizedRotationY - projected.rotationY)
          : normalizedRotationY,
    },
  };
}

export function updateWorkbenchHeightOffset(
  definition: WorkbenchDefinition,
  yOffset: number,
): WorkbenchDefinition {
  return {
    ...definition,
    placement: {
      ...definition.placement,
      yOffset: clampWorkbenchHeightOffsetValue(yOffset),
    },
  };
}

export function withContentMode(
  definition: WorkbenchDefinition,
  contentMode: WorkbenchDefinition['contentMode'],
): WorkbenchDefinition {
  if (contentMode === 'placeholder') {
    return {
      ...definition,
      contentMode,
      experienceId: undefined,
    };
  }

  return {
    ...definition,
    contentMode,
  };
}

export function getWorkbenchTitleSlug(definition: WorkbenchDefinition): string {
  return toSlug(definition.title || definition.id);
}

export function isWorkbenchEditorTypingTarget(target: EventTarget | null): boolean {
  if (!target || typeof target !== 'object') {
    return false;
  }

  const editableTarget = target as {
    tagName?: unknown;
    isContentEditable?: unknown;
  };
  const tagName = typeof editableTarget.tagName === 'string' ? editableTarget.tagName : null;

  return (
    tagName === 'INPUT' ||
    tagName === 'TEXTAREA' ||
    tagName === 'SELECT' ||
    editableTarget.isContentEditable === true
  );
}
