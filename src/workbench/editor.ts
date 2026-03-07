import { WORKBENCH_DISTRICTS } from '../../content/workbenches/layout';

import { projectPointOntoCorridor, resolveWorkbenchPlacement } from './placement';

import type {
  WorkbenchCategory,
  WorkbenchCorridorId,
  WorkbenchDefinition,
  WorkbenchDistrict,
  WorkbenchPlacement,
  WorkbenchVisualRecipe,
} from '../types/workbench';

const districtDefaults: Record<
  WorkbenchDistrict,
  {
    category: WorkbenchCategory;
    corridorId: WorkbenchCorridorId;
    lateralOffset: number;
    visualRecipe: WorkbenchVisualRecipe;
  }
> = {
  'work-experience': {
    category: 'work-experience',
    corridorId: 'southeast-trail',
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
    placement: {
      mode: 'corridor',
      corridorId: defaults.corridorId,
      distanceAlong: 18,
      lateralOffset: defaults.lateralOffset,
      yawMode: 'follow-road',
      yawOffset: 0,
      yOffset: 0.18,
    },
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

  const corridorIds = WORKBENCH_DISTRICTS.find((entry) => entry.id === district)?.corridors ?? [defaults.corridorId];
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

export function switchWorkbenchPlacementMode(
  definition: WorkbenchDefinition,
  nextMode: WorkbenchPlacement['mode'],
): WorkbenchDefinition {
  if (definition.placement.mode === nextMode) {
    return definition;
  }

  const currentPlacement = resolveWorkbenchPlacement(definition.placement);
  if (nextMode === 'freeform') {
    return {
      ...definition,
      placement: {
        mode: 'freeform',
        x: currentPlacement.anchor.x,
        z: currentPlacement.anchor.z,
        rotationY: currentPlacement.rotationY,
        yOffset: definition.placement.yOffset,
      },
    };
  }

  const defaults = districtDefaults[definition.district];
  const projected = projectPointOntoCorridor(defaults.corridorId, currentPlacement.anchor.x, currentPlacement.anchor.z);

  return {
    ...definition,
    placement: {
      mode: 'corridor',
      corridorId: defaults.corridorId,
      distanceAlong: projected.distanceAlong,
      lateralOffset: projected.lateralOffset,
      yawMode: 'follow-road',
      yawOffset: 0,
      yOffset: definition.placement.yOffset,
    },
  };
}

export function withContentMode(definition: WorkbenchDefinition, contentMode: WorkbenchDefinition['contentMode']): WorkbenchDefinition {
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
