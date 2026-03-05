import { describe, expect, it } from 'vitest';

import { computeStreamingActions } from './streaming';

import type { ExperienceManifest } from '../types/experience';

const manifests: ExperienceManifest[] = [
  {
    id: 'zone-a',
    slug: 'zone-a',
    title: 'Zone A',
    type: 'experience',
    worldAnchor: { x: 0, y: 0, z: 0 },
    triggerRadius: 3,
    loadDistances: { preload: 5, unload: 8 },
    uiContentRef: '/content/experiences/zone-a/story.mdx',
    sceneModuleRef: '/content/experiences/zone-a/scene.tsx',
    status: 'published',
  },
  {
    id: 'zone-b',
    slug: 'zone-b',
    title: 'Zone B',
    type: 'experience',
    worldAnchor: { x: 14, y: 0, z: 0 },
    triggerRadius: 3,
    loadDistances: { preload: 4, unload: 10 },
    uiContentRef: '/content/experiences/zone-b/story.mdx',
    status: 'published',
  },
];

describe('computeStreamingActions', () => {
  it('loads unloaded scene modules once player enters preload range', () => {
    const actions = computeStreamingActions(manifests, { x: 3, y: 0, z: 0 }, new Set());
    expect(actions.toLoad).toEqual(['zone-a']);
    expect(actions.toUnload).toEqual([]);
  });

  it('unloads loaded scenes once player passes unload distance', () => {
    const actions = computeStreamingActions(manifests, { x: 20, y: 0, z: 0 }, new Set(['zone-a']));
    expect(actions.toLoad).toEqual([]);
    expect(actions.toUnload).toEqual(['zone-a']);
  });

  it('ignores experiences without scene modules', () => {
    const actions = computeStreamingActions(manifests, { x: 14, y: 0, z: 0 }, new Set());
    expect(actions.toLoad).toEqual([]);
  });
});
