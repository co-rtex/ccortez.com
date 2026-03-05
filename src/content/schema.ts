import { z } from 'zod';

import type { ExperienceManifest } from '../types/experience';

const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const worldAnchorSchema = z.object({
  x: z.number().finite(),
  y: z.number().finite(),
  z: z.number().finite(),
});

export const loadDistancesSchema = z
  .object({
    preload: z.number().positive(),
    unload: z.number().positive(),
  })
  .superRefine((value, ctx) => {
    if (value.preload >= value.unload) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'loadDistances.preload must be lower than loadDistances.unload',
        path: ['preload'],
      });
    }
  });

export const experienceManifestSchema = z.object({
  id: z.string().min(3),
  slug: z.string().regex(slugRegex, 'slug must be kebab-case'),
  title: z.string().min(3),
  type: z.enum(['experience', 'project']),
  worldAnchor: worldAnchorSchema,
  triggerRadius: z.number().positive(),
  loadDistances: loadDistancesSchema,
  uiContentRef: z.string().min(1),
  sceneModuleRef: z.string().min(1).optional(),
  status: z.enum(['draft', 'published']),
});

export function validateManifest(raw: unknown): ExperienceManifest {
  return experienceManifestSchema.parse(raw);
}
