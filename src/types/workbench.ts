import type { WorldAnchor } from './experience';

export type WorkbenchCategory =
  | 'work-experience'
  | 'projects'
  | 'personal-life'
  | 'clubs'
  | 'extracurriculars';

export type WorkbenchDistrict =
  | 'work-experience'
  | 'projects'
  | 'personal-life'
  | 'clubs'
  | 'extracurriculars';

export type WorkbenchVisibility = 'draft' | 'published';
export type WorkbenchContentMode = 'linked' | 'placeholder';
export type WorkbenchPriorityTier = 'anchor' | 'standard' | 'satellite';

export type WorkbenchCorridorId =
  | 'south-spine'
  | 'north-rise'
  | 'southwest-trail'
  | 'southeast-trail'
  | 'west-ridge'
  | 'east-promenade'
  | 'southern-link'
  | 'northern-link';

export type WorkbenchYawMode = 'follow-road' | 'fixed';
export type WorkbenchPreferredLateralSide = 'left' | 'right' | 'alternate';

export type WorkbenchPaletteToken =
  | 'work-ember'
  | 'project-citrine'
  | 'personal-rose'
  | 'club-verde'
  | 'extra-cobalt'
  | 'draft-mist';

export type WorkbenchAccentMaterial =
  | 'brushed-metal'
  | 'warm-wood'
  | 'ceramic'
  | 'frosted-glass'
  | 'powder-coat';

export type WorkbenchArchetype =
  | 'console-desk'
  | 'atelier-worktable'
  | 'journal-console'
  | 'commons-table'
  | 'field-station';

export type WorkbenchPropKit =
  | 'software-station'
  | 'prototype-lab'
  | 'reflection-nook'
  | 'club-circle'
  | 'field-kit';

export type WorkbenchHeroProp =
  | 'monitor-stack'
  | 'signal-dish'
  | 'memory-orb'
  | 'club-banner'
  | 'wayfinder-arch';

export type WorkbenchAnimationStyle =
  | 'idle-pulse'
  | 'soft-orbit'
  | 'signal-blink'
  | 'paper-breeze'
  | 'still';

export type WorkbenchDecorativeRule =
  | 'lanterns'
  | 'planters'
  | 'stone-markers'
  | 'flag-lines'
  | 'utility-crates';

export interface CorridorWorkbenchPlacement {
  mode: 'corridor';
  corridorId: WorkbenchCorridorId;
  distanceAlong: number;
  lateralOffset: number;
  yawMode: WorkbenchYawMode;
  yawOffset: number;
  yOffset: number;
}

export interface FreeformWorkbenchPlacement {
  mode: 'freeform';
  x: number;
  z: number;
  rotationY: number;
  yOffset: number;
}

export type WorkbenchPlacement = CorridorWorkbenchPlacement | FreeformWorkbenchPlacement;

export interface WorkbenchVisualRecipe {
  archetype: WorkbenchArchetype;
  palette: WorkbenchPaletteToken;
  accentMaterial: WorkbenchAccentMaterial;
  propKit: WorkbenchPropKit;
  heroProp?: WorkbenchHeroProp;
  animationStyle?: WorkbenchAnimationStyle;
}

export interface WorkbenchDefinition {
  id: string;
  title: string;
  category: WorkbenchCategory;
  district: WorkbenchDistrict;
  visibility: WorkbenchVisibility;
  contentMode: WorkbenchContentMode;
  experienceId?: string;
  placement: WorkbenchPlacement;
  interactionRadius: number;
  priorityTier: WorkbenchPriorityTier;
  visualRecipe: WorkbenchVisualRecipe;
  draftNotes?: string;
}

export interface WorkbenchDistrictDefinition {
  id: WorkbenchDistrict;
  label: string;
  corridors: WorkbenchCorridorId[];
  paletteDirection: string;
  defaultSpacing: number;
  preferredLateralSide: WorkbenchPreferredLateralSide;
  decorativeRules: WorkbenchDecorativeRule[];
}

export interface WorkbenchCorridorDefinition {
  id: WorkbenchCorridorId;
  label: string;
  polyline: Array<[number, number]>;
}

export interface WorkbenchResolvedPlacement {
  anchor: WorldAnchor;
  rotationY: number;
}

export interface WorkbenchValidationIssue {
  code:
    | 'inside-crossroads'
    | 'water-overlap'
    | 'obstacle-overlap'
    | 'rest-spot-overlap'
    | 'district-spacing'
    | 'missing-link'
    | 'missing-draft-notes'
    | 'missing-district-corridor';
  message: string;
  severity: 'error' | 'warning';
}
