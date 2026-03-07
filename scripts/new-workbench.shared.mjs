export const DISTRICT_DEFAULTS = {
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
  const marker = 'export const WORKBENCH_LAYOUT: WorkbenchDefinition[] = [';
  const startIndex = source.indexOf(marker);
  if (startIndex < 0) {
    throw new Error('Unable to locate WORKBENCH_LAYOUT array in content/workbenches/layout.ts');
  }

  const closingIndex = source.lastIndexOf('\n];');
  if (closingIndex < 0) {
    throw new Error('Unable to locate end of WORKBENCH_LAYOUT array in content/workbenches/layout.ts');
  }

  const arrayBody = source.slice(startIndex + marker.length, closingIndex).trim();
  const separator = arrayBody ? ',\n' : '\n';
  return `${source.slice(0, closingIndex)}${separator}${entryBlock}\n${source.slice(closingIndex)}`;
}
