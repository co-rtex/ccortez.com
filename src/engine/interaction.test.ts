import { describe, expect, it } from 'vitest';

import { getNearestExperienceInRange } from './interaction';

import type { ExperienceManifest } from '../types/experience';

const manifests: ExperienceManifest[] = [
  {
    id: 'alpha',
    slug: 'alpha',
    title: 'Alpha',
    type: 'experience',
    worldAnchor: { x: 0, y: 0, z: 0 },
    triggerRadius: 4,
    loadDistances: { preload: 8, unload: 12 },
    uiContentRef: '/content/experiences/alpha/story.mdx',
    sceneModuleRef: '/content/experiences/alpha/scene.tsx',
    status: 'published',
  },
  {
    id: 'beta',
    slug: 'beta',
    title: 'Beta',
    type: 'project',
    worldAnchor: { x: 2, y: 0, z: 0 },
    triggerRadius: 3,
    loadDistances: { preload: 7, unload: 11 },
    uiContentRef: '/content/experiences/beta/story.mdx',
    status: 'published',
  },
];

describe('getNearestExperienceInRange', () => {
  it('returns closest landmark within trigger range', () => {
    const nearest = getNearestExperienceInRange(manifests, { x: 1.7, y: 0, z: 0 });
    expect(nearest?.id).toBe('beta');
  });

  it('returns null when outside all trigger radii', () => {
    const nearest = getNearestExperienceInRange(manifests, { x: 20, y: 0, z: 20 });
    expect(nearest).toBeNull();
  });
});
