import { describe, expect, it } from 'vitest';

import {
  WORKBENCH_SCENE_EXIT_DURATION_MS,
  WORKBENCH_SCENE_TOTAL_ENTER_DURATION_MS,
  computeWorkbenchScenePresentation,
} from './presentation';

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
      summary: 'Provides presentation metadata through the workbench runtime.',
      impactBullets: [
        'Rendered scenes only after the player reached the workbench radius.',
        'Kept inspect-selected scenes visible even from farther away.',
        'Replayed the reveal whenever the player returned to the station.',
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

describe('computeWorkbenchScenePresentation', () => {
  it('keeps a preloaded but distant workbench scene hidden until the player enters the interaction radius', () => {
    const presentation = computeWorkbenchScenePresentation(
      [createWorkbenchRecord()],
      { x: 14, y: 0, z: 0 },
      new Set(['linked-project']),
      {},
      null,
      1_000,
    );

    expect(presentation).toEqual({});
  });

  it('marks a loaded in-range workbench scene as entering and then visible after the reveal window', () => {
    const entering = computeWorkbenchScenePresentation(
      [createWorkbenchRecord()],
      { x: 2, y: 0, z: 0 },
      new Set(['linked-project']),
      {},
      null,
      1_000,
    );

    expect(entering['linked-project']).toEqual({
      state: 'entering',
      transitionStartedAtMs: 1_000,
    });

    const visible = computeWorkbenchScenePresentation(
      [createWorkbenchRecord()],
      { x: 2, y: 0, z: 0 },
      new Set(['linked-project']),
      entering,
      null,
      1_000 + WORKBENCH_SCENE_TOTAL_ENTER_DURATION_MS + 1,
    );

    expect(visible['linked-project']).toEqual({
      state: 'visible',
      transitionStartedAtMs: 1_000,
    });
  });

  it('moves a scene into exiting state on leave and removes it after the reverse window', () => {
    const current = {
      'linked-project': {
        state: 'visible' as const,
        transitionStartedAtMs: 1_000,
      },
    };

    const exiting = computeWorkbenchScenePresentation(
      [createWorkbenchRecord()],
      { x: 12, y: 0, z: 0 },
      new Set(['linked-project']),
      current,
      null,
      2_000,
    );

    expect(exiting['linked-project']).toEqual({
      state: 'exiting',
      transitionStartedAtMs: 2_000,
    });

    const removed = computeWorkbenchScenePresentation(
      [createWorkbenchRecord()],
      { x: 12, y: 0, z: 0 },
      new Set(['linked-project']),
      exiting,
      null,
      2_000 + WORKBENCH_SCENE_EXIT_DURATION_MS + 1,
    );

    expect(removed).toEqual({});
  });

  it('keeps the scene presented while the focused inspect workbench is open outside the radius', () => {
    const presentation = computeWorkbenchScenePresentation(
      [createWorkbenchRecord()],
      { x: 48, y: 0, z: 0 },
      new Set(['linked-project']),
      {},
      'linked-project',
      1_000,
    );

    expect(presentation['linked-project']).toEqual({
      state: 'entering',
      transitionStartedAtMs: 1_000,
    });
  });

  it('restarts the reveal when the player re-enters while the scene is exiting', () => {
    const current = {
      'linked-project': {
        state: 'exiting' as const,
        transitionStartedAtMs: 2_000,
      },
    };

    const presentation = computeWorkbenchScenePresentation(
      [createWorkbenchRecord()],
      { x: 2, y: 0, z: 0 },
      new Set(['linked-project']),
      current,
      null,
      2_120,
    );

    expect(presentation['linked-project']).toEqual({
      state: 'entering',
      transitionStartedAtMs: 2_120,
    });
  });
});
