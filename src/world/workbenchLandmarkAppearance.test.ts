import { describe, expect, it } from 'vitest';

import {
  EXPERIENCE_RING_COLOR,
  ISSUE_ERROR_RING_COLOR,
  ISSUE_WARNING_RING_COLOR,
  PROJECT_RING_COLOR,
  getWorkbenchRingColor,
} from './workbenchLandmarkAppearance';

import type { ExperienceRecord } from '../types/experience';
import type { WorkbenchRuntimeRecord } from '../workbench/runtime';

const linkedExperience: ExperienceRecord = {
  manifest: {
    id: 'linked-experience',
    slug: 'linked-experience',
    title: 'Linked Experience',
    type: 'experience',
    uiContentRef: '/content/experiences/linked-experience/story.mdx',
    sceneModuleRef: '/content/experiences/linked-experience/scene.tsx',
    status: 'published',
    recruiterCard: {
      roleLabel: 'Experience Role',
      dateRange: '2026',
      summary: 'Differentiates work experience rings from project rings.',
      impactBullets: ['Shows orange for experience workbenches.'],
      techStack: ['React'],
    },
  },
  loadStory: async () => ({ default: () => null }),
  loadScene: async () => ({ default: () => null }),
};

function createWorkbenchRecord(
  overrides: Partial<WorkbenchRuntimeRecord> = {},
): WorkbenchRuntimeRecord {
  return {
    definition: {
      id: 'bench-1',
      title: 'Visible Bench Title',
      category: 'work-experience',
      district: 'work-experience',
      visibility: 'published',
      contentMode: 'linked',
      presentationMode: 'scene-owned',
      experienceId: linkedExperience.manifest.id,
      placement: {
        mode: 'freeform',
        x: 14.4,
        z: 0,
        rotationY: 0,
        yOffset: 0.18,
      },
      interactionRadius: 4.2,
      priorityTier: 'anchor',
      visualRecipe: {
        archetype: 'console-desk',
        palette: 'work-ember',
        accentMaterial: 'brushed-metal',
        propKit: 'software-station',
        heroProp: 'monitor-stack',
        animationStyle: 'signal-blink',
      },
    },
    districtDefinition: {
      id: 'work-experience',
      label: 'Work Experience',
      corridors: ['west-ridge'],
      paletteDirection: 'Recruiter-ready stations.',
      defaultSpacing: 3.5,
      preferredLateralSide: 'left',
      decorativeRules: ['planters'],
    },
    placement: {
      anchor: { x: 14.4, y: 1.2, z: 0 },
      rotationY: 0,
    },
    linkedExperience,
    interactionRadius: 4.2,
    preloadDistance: 8.5,
    unloadDistance: 12.5,
    issues: [],
    ...overrides,
  };
}

describe('workbench landmark appearance', () => {
  it('uses orange rings for work experience benches and blue rings for projects', () => {
    expect(getWorkbenchRingColor(createWorkbenchRecord(), 'valid', '#000')).toBe(EXPERIENCE_RING_COLOR);

    expect(
      getWorkbenchRingColor(
        createWorkbenchRecord({
          definition: {
            ...createWorkbenchRecord().definition,
            category: 'projects',
          },
          linkedExperience: {
            ...linkedExperience,
            manifest: {
              ...linkedExperience.manifest,
              type: 'project',
            },
          },
        }),
        'valid',
        '#000',
      ),
    ).toBe(PROJECT_RING_COLOR);
  });

  it('keeps warning and error colors as higher-priority overrides', () => {
    const workbench = createWorkbenchRecord();

    expect(getWorkbenchRingColor(workbench, 'warning', '#000')).toBe(ISSUE_WARNING_RING_COLOR);
    expect(getWorkbenchRingColor(workbench, 'error', '#000')).toBe(ISSUE_ERROR_RING_COLOR);
  });
});
