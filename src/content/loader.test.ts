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
        uiContentRef: 'story.mdx',
        sceneModuleRef: 'scene.tsx',
        status: 'published',
        recruiterCard: {
          roleLabel: 'Published Role',
          organization: 'Published Org',
          dateRange: '2026',
          location: 'Madison, WI',
          summary: 'A published recruiter-facing card.',
          impactBullets: [
            'Improved an important system.',
            'Reduced operational friction for users.',
            'Shipped a validated solution for recruiters.',
          ],
          techStack: ['React', 'TypeScript'],
        },
      },
      '/content/experiences/draft/manifest.json': {
        id: 'draft',
        slug: 'draft',
        title: 'Draft',
        type: 'project',
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

  it('throws when legacy manifest spatial fields are still present', () => {
    const maps = createModuleMaps();
    maps.manifestModules['/content/experiences/draft/manifest.json'] = {
      ...(maps.manifestModules['/content/experiences/draft/manifest.json'] as Record<string, unknown>),
      worldAnchor: { x: 2, y: 0, z: 1 },
      triggerRadius: 3,
      loadDistances: { preload: 8, unload: 12 },
    };

    expect(() => buildExperienceRecords(maps)).toThrow(/unrecognized key|worldAnchor/i);
  });
});
