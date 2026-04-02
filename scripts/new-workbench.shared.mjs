export const DISTRICT_DEFAULTS = {
  'work-experience': {
    category: 'work-experience',
    corridorId: 'southeast-trail',
    distanceAlong: 24,
    lateralOffset: 2.8,
    seedX: 6.899,
    seedZ: -22.488,
    seedRotationY: 2.881,
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
    seedX: 17.632,
    seedZ: 6.943,
    seedRotationY: 1.144,
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
    seedX: -3.672,
    seedZ: 20.111,
    seedRotationY: -0.322,
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
    seedX: -15.782,
    seedZ: 6.664,
    seedRotationY: -1.043,
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
    seedX: -6.43,
    seedZ: -14.678,
    seedRotationY: -2.911,
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

export function sanitizeId(value) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^-|-$/g, '');
}

export function defaultTitleFromId(id) {
  return id
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export function createWorkbenchTemplate({
  id,
  title,
  district,
  category,
  draftNotes,
}) {
  const defaults = DISTRICT_DEFAULTS[district];
  return {
    id,
    title,
    category: category || defaults.category,
    district,
    visibility: 'draft',
    contentMode: 'placeholder',
    presentationMode: 'scene-owned',
    placement: {
      mode: 'freeform',
      x: defaults.seedX,
      z: defaults.seedZ,
      rotationY: defaults.seedRotationY,
      yOffset: 0.18,
    },
    interactionRadius: 3.2,
    priorityTier: 'standard',
    visualRecipe: defaults.visualRecipe,
    draftNotes:
      draftNotes || 'Describe the story, props, and why this item belongs in the district.',
  };
}

export function renderWorkbenchEntry(entry) {
  return JSON.stringify(entry, null, 2)
    .replace(/"([^"]+)":/g, '$1:')
    .replace(/"/g, "'");
}

export function insertWorkbenchIntoLayoutSource(source, entryBlock) {
  const marker = 'const RAW_WORKBENCH_LAYOUT: WorkbenchDefinition[] = [';
  const startIndex = source.indexOf(marker);
  if (startIndex < 0) {
    throw new Error('Unable to locate RAW_WORKBENCH_LAYOUT array in content/workbenches/layout.ts');
  }

  const closingIndex = source.lastIndexOf('\n];');
  if (closingIndex < 0) {
    throw new Error('Unable to locate end of RAW_WORKBENCH_LAYOUT array in content/workbenches/layout.ts');
  }

  const arrayBody = source.slice(startIndex + marker.length, closingIndex).trim();
  const separator = arrayBody ? ',\n' : '\n';
  return `${source.slice(0, closingIndex)}${separator}${entryBlock}\n${source.slice(closingIndex)}`;
}
