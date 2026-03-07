import { z } from 'zod';

import {
  WORKBENCH_CORRIDORS,
} from './corridors';

import type {
  WorkbenchDefinition,
  WorkbenchDistrictDefinition,
} from '../types/workbench';

const workbenchCorridorIds = WORKBENCH_CORRIDORS.map((corridor) => corridor.id) as [
  string,
  ...string[],
];

const categorySchema = z.enum([
  'work-experience',
  'projects',
  'personal-life',
  'clubs',
  'extracurriculars',
]);

const districtSchema = z.enum([
  'work-experience',
  'projects',
  'personal-life',
  'clubs',
  'extracurriculars',
]);

const paletteSchema = z.enum([
  'work-ember',
  'project-citrine',
  'personal-rose',
  'club-verde',
  'extra-cobalt',
  'draft-mist',
]);

const accentMaterialSchema = z.enum([
  'brushed-metal',
  'warm-wood',
  'ceramic',
  'frosted-glass',
  'powder-coat',
]);

const archetypeSchema = z.enum([
  'console-desk',
  'atelier-worktable',
  'journal-console',
  'commons-table',
  'field-station',
]);

const propKitSchema = z.enum([
  'software-station',
  'prototype-lab',
  'reflection-nook',
  'club-circle',
  'field-kit',
]);

const heroPropSchema = z.enum([
  'monitor-stack',
  'signal-dish',
  'memory-orb',
  'club-banner',
  'wayfinder-arch',
]);

const animationStyleSchema = z.enum([
  'idle-pulse',
  'soft-orbit',
  'signal-blink',
  'paper-breeze',
  'still',
]);

const corridorPlacementSchema = z.object({
  mode: z.literal('corridor'),
  corridorId: z.enum(workbenchCorridorIds),
  distanceAlong: z.number().finite().nonnegative(),
  lateralOffset: z.number().finite(),
  yawMode: z.enum(['follow-road', 'fixed']),
  yawOffset: z.number().finite(),
  yOffset: z.number().finite(),
});

const freeformPlacementSchema = z.object({
  mode: z.literal('freeform'),
  x: z.number().finite(),
  z: z.number().finite(),
  rotationY: z.number().finite(),
  yOffset: z.number().finite(),
});

const visualRecipeSchema = z.object({
  archetype: archetypeSchema,
  palette: paletteSchema,
  accentMaterial: accentMaterialSchema,
  propKit: propKitSchema,
  heroProp: heroPropSchema.optional(),
  animationStyle: animationStyleSchema.optional(),
});

export const workbenchDefinitionSchema = z
  .object({
    id: z.string().min(3),
    title: z.string().min(3),
    category: categorySchema,
    district: districtSchema,
    visibility: z.enum(['draft', 'published']),
    contentMode: z.enum(['linked', 'placeholder']),
    experienceId: z.string().min(3).optional(),
    placement: z.union([corridorPlacementSchema, freeformPlacementSchema]),
    interactionRadius: z.number().positive(),
    priorityTier: z.enum(['anchor', 'standard', 'satellite']),
    visualRecipe: visualRecipeSchema,
    draftNotes: z.string().min(3).optional(),
  })
  .superRefine((value, ctx) => {
    if (value.contentMode === 'linked' && !value.experienceId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Linked workbenches must define experienceId.',
        path: ['experienceId'],
      });
    }

    if (value.contentMode === 'placeholder' && value.experienceId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Placeholder workbenches must not define experienceId.',
        path: ['experienceId'],
      });
    }
  });

export const workbenchDistrictDefinitionSchema = z.object({
  id: districtSchema,
  label: z.string().min(3),
  corridors: z.array(z.enum(workbenchCorridorIds)).min(1),
  paletteDirection: z.string().min(3),
  defaultSpacing: z.number().positive(),
  preferredLateralSide: z.enum(['left', 'right', 'alternate']),
  decorativeRules: z
    .array(z.enum(['lanterns', 'planters', 'stone-markers', 'flag-lines', 'utility-crates']))
    .min(1),
});

export function validateWorkbenchLayout(raw: unknown): WorkbenchDefinition[] {
  return z.array(workbenchDefinitionSchema).parse(raw) as WorkbenchDefinition[];
}

export function validateWorkbenchDistricts(raw: unknown): WorkbenchDistrictDefinition[] {
  const districts = z
    .array(workbenchDistrictDefinitionSchema)
    .parse(raw) as WorkbenchDistrictDefinition[];
  const seenIds = new Set<string>();

  for (const district of districts) {
    if (seenIds.has(district.id)) {
      throw new Error(`Duplicate workbench district id "${district.id}".`);
    }

    seenIds.add(district.id);
  }

  return districts;
}
