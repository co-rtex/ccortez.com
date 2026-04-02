import { describe, expect, it } from 'vitest';

import {
  shouldShowPersistentWorkbenchTitleBadge,
  shouldShowWorkbenchProximityPrompt,
} from './workbenchLandmarkLabels';

import type { WorkbenchRuntimeRecord } from '../workbench/runtime';

function createWorkbenchRecord(
  overrides: Partial<WorkbenchRuntimeRecord['definition']> = {},
): WorkbenchRuntimeRecord {
  return {
    definition: {
      id: 'bench-1',
      title: 'Visible Bench Title',
      category: 'projects',
      district: 'projects',
      visibility: 'published',
      contentMode: 'placeholder',
      presentationMode: 'scene-owned',
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
        palette: 'project-citrine',
        accentMaterial: 'brushed-metal',
        propKit: 'software-station',
        heroProp: 'monitor-stack',
        animationStyle: 'signal-blink',
      },
      ...overrides,
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
      anchor: { x: 14.4, y: 1.2, z: 0 },
      rotationY: 0,
    },
    interactionRadius: 4.2,
    preloadDistance: 8.5,
    unloadDistance: 12.5,
    issues: [],
  };
}

describe('workbench landmark labels', () => {
  it('shows persistent title badges for published recruiter-facing benches', () => {
    expect(shouldShowPersistentWorkbenchTitleBadge(createWorkbenchRecord(), false)).toBe(true);
  });

  it('does not show persistent title badges in editor or for draft benches', () => {
    expect(shouldShowPersistentWorkbenchTitleBadge(createWorkbenchRecord(), true)).toBe(false);
    expect(
      shouldShowPersistentWorkbenchTitleBadge(
        createWorkbenchRecord({
          visibility: 'draft',
        }),
        false,
      ),
    ).toBe(false);
  });

  it('keeps the proximity prompt independent from the persistent title badge', () => {
    const publishedWorkbench = createWorkbenchRecord();

    expect(shouldShowPersistentWorkbenchTitleBadge(publishedWorkbench, false)).toBe(true);
    expect(shouldShowWorkbenchProximityPrompt(publishedWorkbench, false)).toBe(false);
    expect(shouldShowWorkbenchProximityPrompt(publishedWorkbench, true)).toBe(true);
  });
});
