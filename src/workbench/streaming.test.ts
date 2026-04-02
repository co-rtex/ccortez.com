import { describe, expect, it } from 'vitest';

import { computeWorkbenchStreamingActions } from './streaming';

import type { ExperienceRecord } from '../types/experience';
import type { WorkbenchRuntimeRecord } from './runtime';

const linkedExperience: ExperienceRecord = {
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
      summary: 'Provides streaming metadata through the workbench runtime.',
      impactBullets: [
        'Loaded experience scenes when the player entered range.',
        'Unloaded scenes once the player moved well past the workbench.',
        'Ignored unlinked workbenches during streaming decisions.',
      ],
      techStack: ['React', 'Three.js'],
    },
  },
  loadStory: async () => ({
    default: () => null,
  }),
  loadScene: async () => ({
    default: () => null,
  }),
};

function createWorkbenchRecord(overrides: Partial<WorkbenchRuntimeRecord> = {}): WorkbenchRuntimeRecord {
  return {
    definition: {
      id: 'linked-project',
      title: 'Linked Project',
      category: 'projects',
      district: 'projects',
      visibility: 'published',
      contentMode: 'linked',
      presentationMode: 'scene-owned',
      experienceId: linkedExperience.manifest.id,
      placement: {
        mode: 'freeform',
        x: 0,
        z: 0,
        rotationY: 0,
        yOffset: 0.18,
      },
      interactionRadius: 4.2,
      priorityTier: 'anchor',
      visualRecipe: {
        archetype: 'console-desk',
        palette: 'project-citrine',
        accentMaterial: 'brushed-metal',
        propKit: 'software-station',
        heroProp: 'monitor-stack',
        animationStyle: 'signal-blink',
      },
    },
    districtDefinition: {
      id: 'projects',
      label: 'Projects',
      corridors: ['east-promenade'],
      paletteDirection: 'Prototype-forward stations.',
      defaultSpacing: 3.5,
      preferredLateralSide: 'right',
      decorativeRules: ['planters'],
    },
    placement: {
      anchor: { x: 0, y: 0, z: 0 },
      rotationY: 0,
    },
    linkedExperience,
    interactionRadius: 4.2,
    preloadDistance: 8,
    unloadDistance: 12,
    issues: [],
    ...overrides,
  };
}

describe('computeWorkbenchStreamingActions', () => {
  it('loads an experience scene when the player enters the workbench preload range', () => {
    const actions = computeWorkbenchStreamingActions(
      [createWorkbenchRecord()],
      { x: 3, y: 0, z: 0 },
      new Set(),
    );

    expect(actions.toLoad).toEqual(['linked-project']);
    expect(actions.toUnload).toEqual([]);
  });

  it('unloads a loaded scene after the player leaves the workbench unload range', () => {
    const actions = computeWorkbenchStreamingActions(
      [createWorkbenchRecord()],
      { x: 20, y: 0, z: 0 },
      new Set(['linked-project']),
    );

    expect(actions.toLoad).toEqual([]);
    expect(actions.toUnload).toEqual(['linked-project']);
  });

  it('ignores workbenches without linked scene content', () => {
    const actions = computeWorkbenchStreamingActions(
      [
        createWorkbenchRecord({
          definition: {
            ...createWorkbenchRecord().definition,
            contentMode: 'placeholder',
            experienceId: undefined,
          },
          linkedExperience: undefined,
        }),
      ],
      { x: 0, y: 0, z: 0 },
      new Set(),
    );

    expect(actions).toEqual({
      toLoad: [],
      toUnload: [],
    });
  });

  it('loads a pinned inspect workbench scene even when the player is outside preload range', () => {
    const actions = computeWorkbenchStreamingActions(
      [createWorkbenchRecord()],
      { x: 48, y: 0, z: 0 },
      new Set(),
      'linked-project',
    );

    expect(actions.toLoad).toEqual(['linked-project']);
    expect(actions.toUnload).toEqual([]);
  });

  it('keeps a pinned inspect workbench scene loaded while the panel is open', () => {
    const actions = computeWorkbenchStreamingActions(
      [createWorkbenchRecord()],
      { x: 48, y: 0, z: 0 },
      new Set(['linked-project']),
      'linked-project',
    );

    expect(actions.toLoad).toEqual([]);
    expect(actions.toUnload).toEqual([]);
  });

  it('keeps an exiting presented scene loaded until the reverse animation can finish', () => {
    const actions = computeWorkbenchStreamingActions(
      [createWorkbenchRecord()],
      { x: 48, y: 0, z: 0 },
      new Set(['linked-project']),
      null,
      new Set(['linked-project']),
    );

    expect(actions.toLoad).toEqual([]);
    expect(actions.toUnload).toEqual([]);
  });
});
