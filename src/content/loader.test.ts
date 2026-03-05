import { beforeEach, describe, expect, it } from 'vitest';

import { buildExperienceRecords } from './loader';
import {
  __resetExperienceRegistryForTests,
  getPublishedExperiences,
  registerExperience,
} from './registry';

import type { ContentModuleMaps } from './loader';

function createModuleMaps(): ContentModuleMaps {
  return {
    manifestModules: {
      '/content/experiences/published/manifest.json': {
        id: 'published',
        slug: 'published',
        title: 'Published',
        type: 'experience',
        worldAnchor: { x: 0, y: 0, z: 0 },
        triggerRadius: 3,
        loadDistances: { preload: 8, unload: 12 },
        uiContentRef: 'story.mdx',
        sceneModuleRef: 'scene.tsx',
        status: 'published',
      },
      '/content/experiences/draft/manifest.json': {
        id: 'draft',
        slug: 'draft',
        title: 'Draft',
        type: 'project',
        worldAnchor: { x: 2, y: 0, z: 1 },
        triggerRadius: 3,
        loadDistances: { preload: 8, unload: 12 },
        uiContentRef: 'story.mdx',
        status: 'draft',
      },
    },
    storyModules: {
      '/content/experiences/published/story.mdx': async () => ({
        default: () => null,
      }),
      '/content/experiences/draft/story.mdx': async () => ({
        default: () => null,
      }),
    },
    sceneModules: {
      '/content/experiences/published/scene.tsx': async () => ({
        default: () => null,
      }),
    },
  };
}

describe('buildExperienceRecords', () => {
  beforeEach(() => {
    __resetExperienceRegistryForTests();
  });

  it('parses records and preserves only published entries in published view', () => {
    const records = buildExperienceRecords(createModuleMaps());
    for (const record of records) {
      registerExperience(record);
    }

    const published = getPublishedExperiences();
    expect(published).toHaveLength(1);
    expect(published[0]?.manifest.id).toBe('published');
  });

  it('throws when referenced story module does not exist', () => {
    const maps = createModuleMaps();
    delete maps.storyModules['/content/experiences/published/story.mdx'];

    expect(() => buildExperienceRecords(maps)).toThrow(/missing story module/i);
  });
});
