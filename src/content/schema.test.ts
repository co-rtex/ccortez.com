import { describe, expect, it } from 'vitest';

import { validateManifest } from './schema';

describe('validateManifest', () => {
  it('accepts a valid manifest', () => {
    const parsed = validateManifest({
      id: 'valid-experience',
      slug: 'valid-experience',
      title: 'Valid Experience',
      type: 'experience',
      worldAnchor: { x: 0, y: 0.2, z: 0 },
      triggerRadius: 3,
      loadDistances: { preload: 8, unload: 12 },
      uiContentRef: 'story.mdx',
      sceneModuleRef: 'scene.tsx',
      status: 'published',
    });

    expect(parsed.id).toBe('valid-experience');
  });

  it('rejects load distances where preload is not lower than unload', () => {
    expect(() =>
      validateManifest({
        id: 'bad-load-distances',
        slug: 'bad-load-distances',
        title: 'Invalid Distances',
        type: 'project',
        worldAnchor: { x: 0, y: 0.2, z: 0 },
        triggerRadius: 3,
        loadDistances: { preload: 10, unload: 10 },
        uiContentRef: 'story.mdx',
        status: 'draft',
      }),
    ).toThrow(/preload must be lower/i);
  });
});
