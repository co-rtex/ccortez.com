import { describe, expect, it } from 'vitest';

import { validateManifest } from './schema';

describe('validateManifest', () => {
  it('accepts a valid manifest', () => {
    const parsed = validateManifest({
      id: 'valid-experience',
      slug: 'valid-experience',
      title: 'Valid Experience',
      type: 'experience',
      uiContentRef: 'story.mdx',
      sceneModuleRef: 'scene.tsx',
      status: 'published',
      recruiterCard: {
        roleLabel: 'Technical Computing Help Desk',
        organization: 'SSEC',
        dateRange: 'Dec 2025 - Present',
        location: 'Madison, WI',
        summary: 'Supports scientific computing operations, systems access, and infrastructure reliability.',
        impactBullets: [
          'Resolved Linux, Windows, and macOS issues for research staff.',
          'Diagnosed hardware, software, and network failures across shared environments.',
          'Documented fixes and escalated complex issues to improve long-term reliability.',
        ],
        techStack: ['Linux', 'Windows', 'macOS', 'Scientific Computing'],
      },
    });

    expect(parsed.id).toBe('valid-experience');
  });

  it('rejects legacy manifest spatial fields that are no longer part of the contract', () => {
    expect(() =>
      validateManifest({
        id: 'legacy-shape',
        slug: 'legacy-shape',
        title: 'Legacy Shape',
        type: 'project',
        uiContentRef: 'story.mdx',
        status: 'draft',
        worldAnchor: { x: 0, y: 0.2, z: 0 },
        triggerRadius: 3,
        loadDistances: { preload: 10, unload: 10 },
      }),
    ).toThrow(/unrecognized key|worldAnchor/i);
  });

  it('rejects published manifests without recruiter card metadata', () => {
    expect(() =>
      validateManifest({
        id: 'published-without-card',
        slug: 'published-without-card',
        title: 'Missing Recruiter Card',
        type: 'project',
        uiContentRef: 'story.mdx',
        status: 'published',
      }),
    ).toThrow(/recruiterCard/i);
  });
});
