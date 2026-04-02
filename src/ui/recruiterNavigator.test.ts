import { describe, expect, it } from 'vitest';

import {
  deriveRecruiterNavigatorData,
  resolveRecruiterNavigatorCategory,
} from './recruiterNavigator';

import type { ExperienceRecord } from '../types/experience';
import type { WorkbenchRuntimeRecord } from '../workbench/runtime';
import type { WorkbenchCategory, WorkbenchDistrict, WorkbenchPriorityTier } from '../types/workbench';

function createLinkedExperienceRecord(
  id: string,
  type: 'experience' | 'project',
): ExperienceRecord {
  return {
    manifest: {
      id,
      slug: id,
      title: id,
      type,
      status: 'published',
      uiContentRef: `/content/experiences/${id}/story.mdx`,
      sceneModuleRef: `/content/experiences/${id}/scene.tsx`,
      recruiterCard: {
        roleLabel: `${id} role`,
        dateRange: '2026',
        summary: `${id} summary`,
        impactBullets: ['Impact'],
        techStack: ['React'],
      },
    },
    loadStory: async () => ({ default: () => null }),
    loadScene: async () => ({ default: () => null }),
  };
}

function createWorkbenchRecord({
  id,
  title,
  category = 'projects',
  district = 'projects',
  priorityTier = 'standard',
  x = 0,
  z = 0,
  linkedType,
  contentMode = 'linked',
}: {
  id: string;
  title: string;
  category?: WorkbenchCategory;
  district?: WorkbenchDistrict;
  priorityTier?: WorkbenchPriorityTier;
  x?: number;
  z?: number;
  linkedType?: 'experience' | 'project';
  contentMode?: 'linked' | 'placeholder';
}): WorkbenchRuntimeRecord {
  return {
    definition: {
      id,
      title,
      category,
      district,
      visibility: 'published',
      contentMode,
      presentationMode: 'scene-owned',
      experienceId: linkedType ? id : undefined,
      placement: {
        mode: 'freeform',
        x,
        z,
        rotationY: 0,
        yOffset: 0.18,
      },
      interactionRadius: 4.2,
      priorityTier,
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
      id: district,
      label:
        district === 'work-experience'
          ? 'Work Experience District'
          : district === 'projects'
            ? 'Projects District'
            : 'Personal Life District',
      corridors: ['east-promenade'],
      paletteDirection: 'Guided recruiter view.',
      defaultSpacing: 3.5,
      preferredLateralSide: 'right',
      decorativeRules: ['planters'],
    },
    placement: {
      anchor: { x, y: 1.2, z },
      rotationY: 0,
    },
    linkedExperience: linkedType ? createLinkedExperienceRecord(id, linkedType) : undefined,
    interactionRadius: 4.2,
    preloadDistance: 8.5,
    unloadDistance: 12.5,
    issues: [],
  };
}

describe('recruiter navigator data', () => {
  it('prefers linked experience types and falls back to workbench categories', () => {
    expect(
      resolveRecruiterNavigatorCategory(
        createWorkbenchRecord({
          id: 'linked-experience',
          title: 'Linked Experience',
          category: 'projects',
          linkedType: 'experience',
        }),
      ),
    ).toBe('experience');

    expect(
      resolveRecruiterNavigatorCategory(
        createWorkbenchRecord({
          id: 'fallback-project',
          title: 'Fallback Project',
          category: 'projects',
          linkedType: undefined,
          contentMode: 'placeholder',
        }),
      ),
    ).toBe('project');

    expect(
      resolveRecruiterNavigatorCategory(
        createWorkbenchRecord({
          id: 'personal-stop',
          title: 'Personal Stop',
          category: 'personal-life',
          district: 'personal-life',
          linkedType: undefined,
          contentMode: 'placeholder',
        }),
      ),
    ).toBe('secondary');
  });

  it('sorts career shortlist entries by priority tier and excludes disabled linked content', () => {
    const data = deriveRecruiterNavigatorData(
      [
        createWorkbenchRecord({
          id: 'standard-project',
          title: 'Standard Project',
          priorityTier: 'standard',
          linkedType: 'project',
          x: -10,
          z: -6,
        }),
        createWorkbenchRecord({
          id: 'anchor-project',
          title: 'Anchor Project',
          priorityTier: 'anchor',
          linkedType: 'project',
          x: 0,
          z: -3,
        }),
        createWorkbenchRecord({
          id: 'broken-project',
          title: 'Broken Project',
          priorityTier: 'anchor',
          linkedType: undefined,
          x: 10,
          z: -2,
          contentMode: 'linked',
        }),
      ],
      { x: 0, y: 0.8, z: 0 },
      null,
      null,
    );

    expect(data.shortlistSections.find((section) => section.id === 'project')?.entries.map((entry) => entry.id)).toEqual([
      'anchor-project',
      'standard-project',
    ]);
    expect(data.markers.find((marker) => marker.id === 'broken-project')?.state).toBe('disabled');
  });

  it('normalizes marker positions into map coordinates and includes the player marker', () => {
    const data = deriveRecruiterNavigatorData(
      [
        createWorkbenchRecord({
          id: 'left-bench',
          title: 'Left Bench',
          linkedType: 'experience',
          category: 'work-experience',
          district: 'work-experience',
          x: -14,
          z: -12,
        }),
        createWorkbenchRecord({
          id: 'right-bench',
          title: 'Right Bench',
          linkedType: 'project',
          x: 14,
          z: 12,
        }),
      ],
      { x: 0, y: 0.8, z: 0 },
      'right-bench',
      'left-bench',
    );

    const leftMarker = data.markers.find((marker) => marker.id === 'left-bench');
    const rightMarker = data.markers.find((marker) => marker.id === 'right-bench');

    expect(leftMarker?.xPercent).toBeLessThan(rightMarker?.xPercent ?? 0);
    expect(leftMarker?.yPercent).toBeLessThan(rightMarker?.yPercent ?? 0);
    expect(data.playerMarker.xPercent).toBeGreaterThan(leftMarker?.xPercent ?? 0);
    expect(data.playerMarker.xPercent).toBeLessThan(rightMarker?.xPercent ?? 100);
    expect(leftMarker?.state).toBe('nearby');
    expect(rightMarker?.state).toBe('active');
  });
});
