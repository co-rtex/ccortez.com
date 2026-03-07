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
    worldAnchor: { x: 0, y: 0, z: 0 },
    triggerRadius: 3,
    loadDistances: { preload: 8, unload: 12 },
    uiContentRef: '/content/experiences/linked-project/story.mdx',
    sceneModuleRef: '/content/experiences/linked-project/scene.tsx',
    status: 'published',
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
