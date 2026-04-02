import { describe, expect, it } from 'vitest';

import { WORKBENCH_DISTRICTS, WORKBENCH_LAYOUT } from '../../content/workbenches/layout';

import { buildWorkbenchRuntime } from './runtime';

import type { ExperienceRecord } from '../types/experience';

const mockExperience: ExperienceRecord = {
  manifest: {
    id: 'linked-project',
    slug: 'linked-project',
    title: 'Linked Project',
    type: 'project',
    uiContentRef: '/content/experiences/linked-project/story.mdx',
    sceneModuleRef: '/content/experiences/linked-project/scene.tsx',
    status: 'published',
    recruiterCard: {
      roleLabel: 'Linked Project Owner',
      dateRange: '2026',
      summary: 'Links a workbench to the correct experience package.',
      impactBullets: [
        'Joined workbench runtime records to a published experience.',
        'Preserved the recruiter-first content contract for linked panels.',
        'Verified linked scene content resolves from the workbench layer.',
      ],
      techStack: ['React', 'Vitest'],
    },
  },
  loadStory: async () => ({
    default: () => null,
  }),
  loadScene: async () => ({
    default: () => null,
  }),
};

describe('workbench linking', () => {
  it('joins linked workbenches to experience records by experienceId', () => {
    const layout = WORKBENCH_LAYOUT.map((definition, index) =>
      index === 0
        ? {
            ...definition,
            contentMode: 'linked' as const,
            experienceId: mockExperience.manifest.id,
          }
        : definition,
    );

    const records = buildWorkbenchRuntime(layout, WORKBENCH_DISTRICTS, [mockExperience]);
    expect(records[0]?.linkedExperience?.manifest.id).toBe(mockExperience.manifest.id);
  });
});
