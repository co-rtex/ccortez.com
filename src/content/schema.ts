import { z } from 'zod';

import type { ExperienceManifest } from '../types/experience';

const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const recruiterCardSchema = z.object({
  roleLabel: z.string().min(2),
  organization: z.string().min(2).optional(),
  dateRange: z.string().min(2),
  location: z.string().min(2).optional(),
  summary: z.string().min(12),
  impactBullets: z.array(z.string().min(8)).min(3).max(6),
  techStack: z.array(z.string().min(2)).min(2).max(12),
});

export const experienceManifestSchema = z
  .object({
    id: z.string().min(3),
    slug: z.string().regex(slugRegex, 'slug must be kebab-case'),
    title: z.string().min(3),
    type: z.enum(['experience', 'project']),
    uiContentRef: z.string().min(1),
    sceneModuleRef: z.string().min(1).optional(),
    status: z.enum(['draft', 'published']),
    recruiterCard: recruiterCardSchema.optional(),
  })
  .strict()
  .superRefine((value, ctx) => {
    if (value.status === 'published' && !value.recruiterCard) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['recruiterCard'],
        message: 'Published experiences must include recruiterCard metadata.',
      });
    }
  });

export function validateManifest(raw: unknown): ExperienceManifest {
  return experienceManifestSchema.parse(raw);
}
