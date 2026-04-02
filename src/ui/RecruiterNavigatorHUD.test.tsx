import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { RecruiterNavigatorHUD } from './RecruiterNavigatorHUD';
import { START_HERE_WORKBENCH_ID } from '../world/hub';

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

describe('RecruiterNavigatorHUD', () => {
  it('renders the recruiter legend and career shortlist sections', () => {
    const markup = renderToStaticMarkup(
      <RecruiterNavigatorHUD
        workbenches={[
          createWorkbenchRecord({
            id: START_HERE_WORKBENCH_ID,
            title: 'Start Here',
            category: 'personal-life',
            district: 'personal-life',
            linkedType: 'experience',
            x: 0,
            z: 0,
          }),
          createWorkbenchRecord({
            id: 'experience-stop',
            title: 'Experience Stop',
            category: 'work-experience',
            district: 'work-experience',
            linkedType: 'experience',
            x: -8,
            z: -8,
          }),
          createWorkbenchRecord({
            id: 'project-stop',
            title: 'Project Stop',
            linkedType: 'project',
            x: 8,
            z: -4,
          }),
          createWorkbenchRecord({
            id: 'personal-stop',
            title: 'Personal Stop',
            category: 'personal-life',
            district: 'personal-life',
            contentMode: 'placeholder',
            x: 4,
            z: 7,
          }),
        ]}
        playerPosition={{ x: 0, y: 0.8, z: 0 }}
        activeWorkbenchId={null}
        nearbyWorkbenchId={null}
        mobileLiteMode={false}
        onWorkbenchOpen={() => undefined}
      />,
    );

    expect(markup).toContain('Recruiter Guide');
    expect(markup).toContain('Hide');
    expect(markup).toContain('Start Here');
    expect(markup).toContain('Experiences');
    expect(markup).toContain('Projects');
    expect(markup).toContain('More About Me');
    expect(markup).toContain('Open Start Here (Start Here)');
    expect(markup).toContain('Open Experience Stop (Experience)');
    expect(markup).toContain('Open Project Stop (Project)');
  });

  it('renders active and nearby marker states in the schematic map', () => {
    const markup = renderToStaticMarkup(
      <RecruiterNavigatorHUD
        workbenches={[
          createWorkbenchRecord({
            id: START_HERE_WORKBENCH_ID,
            title: 'Start Here',
            category: 'personal-life',
            district: 'personal-life',
            linkedType: 'experience',
            x: 0,
            z: 0,
          }),
          createWorkbenchRecord({
            id: 'experience-stop',
            title: 'Experience Stop',
            category: 'work-experience',
            district: 'work-experience',
            linkedType: 'experience',
            x: -8,
            z: -8,
          }),
          createWorkbenchRecord({
            id: 'project-stop',
            title: 'Project Stop',
            linkedType: 'project',
            x: 8,
            z: -4,
          }),
        ]}
        playerPosition={{ x: 0, y: 0.8, z: 0 }}
        activeWorkbenchId="project-stop"
        nearbyWorkbenchId="experience-stop"
        mobileLiteMode={false}
        onWorkbenchOpen={() => undefined}
      />,
    );

    expect(markup).toContain('recruiter-map-marker--active');
    expect(markup).toContain('recruiter-map-marker--nearby');
    expect(markup).toContain('recruiter-map-marker--start');
    expect(markup).toContain('recruiter-map-marker--experience');
    expect(markup).toContain('recruiter-map-marker--project');
  });
});
