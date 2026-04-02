import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it } from 'vitest';

import { LinkedWorkbenchContent, buildWorkbenchMetaChips, resolvePanelEyebrow } from './WorkbenchPanel';
import { WORKBENCH_INSPECT_HINT, shouldShowWorkbenchInspectHint } from './workbenchPanelHints';
import { useGameStore } from '../state/gameStore';

import type { WorkbenchRuntimeRecord } from '../workbench/runtime';

function resetGameStore(): void {
  useGameStore.setState({
    playerPosition: { x: 0, y: 0.8, z: 18 },
    playerMode: 'exploring',
    cameraMode: 'follow',
    editorCameraTarget: null,
    inspectedWorkbenchId: null,
    nearbyRestSpotId: null,
    activeRestSpotId: null,
    nearbyWorkbenchId: null,
    panelWorkbenchId: null,
    loadedSceneIds: [],
    scenePresentationById: {},
    collisionFeedbackEvent: null,
  });
}

function createWorkbenchRecord(): WorkbenchRuntimeRecord {
  return {
    definition: {
      id: 'bench-1',
      title: 'Inspect Bench',
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
      draftNotes: 'Inspect mode test bench.',
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

function createLinkedWorkbenchRecord(): WorkbenchRuntimeRecord {
  return {
    ...createWorkbenchRecord(),
    definition: {
      ...createWorkbenchRecord().definition,
      title: 'Recruiter Project',
      contentMode: 'linked',
      priorityTier: 'anchor',
    },
    districtDefinition: {
      ...createWorkbenchRecord().districtDefinition,
      label: 'Projects District',
    },
    linkedExperience: {
      manifest: {
        id: 'recruiter-project',
        slug: 'recruiter-project',
        title: 'Recruiter Project',
        type: 'project',
        status: 'published',
        uiContentRef: '/content/experiences/recruiter-project/story.mdx',
        sceneModuleRef: '/content/experiences/recruiter-project/scene.tsx',
        recruiterCard: {
          roleLabel: 'Project Builder',
          organization: 'Open Source',
          dateRange: '2026',
          summary: 'A recruiter-friendly project summary.',
          impactBullets: ['Clarified the project story for hiring review.'],
          techStack: ['React', 'TypeScript'],
        },
      },
      loadStory: async () => ({
        default: () => null,
      }),
      loadScene: async () => ({
        default: () => null,
      }),
    },
  };
}

describe('LinkedWorkbenchContent', () => {
  afterEach(() => {
    resetGameStore();
  });

  it('renders recruiter card content before the long-form story', () => {
    const markup = renderToStaticMarkup(
      <LinkedWorkbenchContent
        recruiterCard={{
          roleLabel: 'Technical Computing Help Desk',
          organization: 'SSEC',
          dateRange: 'Dec 2025 - Present',
          location: 'Madison, WI',
          summary: 'Supports scientific computing operations and systems reliability.',
          impactBullets: [
            'Resolved research computing support issues.',
            'Maintained infrastructure reliability for shared environments.',
            'Documented solutions and escalations for long-term stability.',
          ],
          techStack: ['Linux', 'Windows', 'macOS'],
        }}
        ActiveStory={() => <p>Long-form story content.</p>}
        isLoading={false}
      />,
    );

    expect(markup.indexOf('Supports scientific computing operations and systems reliability.')).toBeGreaterThan(-1);
    expect(markup.indexOf('Long-form story content.')).toBeGreaterThan(-1);
    expect(markup.indexOf('Supports scientific computing operations and systems reliability.')).toBeLessThan(
      markup.indexOf('Long-form story content.'),
    );
  });

  it('renders an explicit error state without showing the loading copy', () => {
    const markup = renderToStaticMarkup(
      <LinkedWorkbenchContent
        activeStoryError="This published workbench is missing its linked experience content."
        isLoading={false}
      />,
    );

    expect(markup).toContain('This published workbench is missing its linked experience content.');
    expect(markup).not.toContain('Loading linked story content...');
  });

  it('shows the inspect hint only while workbench inspect mode is active', () => {
    expect(shouldShowWorkbenchInspectHint('workbench-inspect', createWorkbenchRecord())).toBe(true);
    expect(WORKBENCH_INSPECT_HINT).toBe('Drag to rotate • Scroll to zoom');
    expect(shouldShowWorkbenchInspectHint('follow', createWorkbenchRecord())).toBe(false);
    expect(shouldShowWorkbenchInspectHint('workbench-inspect', null)).toBe(false);
  });

  it('renders recruiter-first panel metadata without internal editor labels', () => {
    const record = createLinkedWorkbenchRecord();
    const chipLabels = buildWorkbenchMetaChips(record).map((chip) => chip.label);
    const flattened = chipLabels.join(' | ');

    expect(resolvePanelEyebrow(record)).toBe('Recruiter Brief');
    expect(chipLabels).toEqual(expect.arrayContaining(['Type: Project', 'District: Projects District', 'Featured']));
    expect(flattened).not.toContain('Visibility:');
    expect(flattened).not.toContain('Presentation:');
    expect(flattened).not.toContain('Anchor:');
    expect(flattened).not.toContain('Mode:');
  });
});
