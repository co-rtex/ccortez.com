import { describe, expect, it } from 'vitest';

import { WORKBENCH_LAYOUT } from '../../content/workbenches/layout';
import {
  FLAGSHIP_TOUR,
  FLAGSHIP_WORKBENCH_IDS,
  getCaseStudyUrl,
  getTourStep,
  hasInteractiveModel,
  hasLongRangeLabel,
  isFlagshipWorkbench,
} from './flagships';

describe('flagship benches', () => {
  it('are published benches, each linked to its case study', () => {
    for (const id of FLAGSHIP_WORKBENCH_IDS) {
      const definition = WORKBENCH_LAYOUT.find((candidate) => candidate.id === id);
      expect(definition?.visibility, id).toBe('published');
      expect(getCaseStudyUrl(id)).toMatch(/^https:\/\/ccortez\.com\/work\/[a-z-]+\/$/);
    }
  });

  it('are a short list, not every anchor bench', () => {
    const anchors = WORKBENCH_LAYOUT.filter(
      (definition) => definition.visibility === 'published' && definition.priorityTier === 'anchor',
    );
    expect(FLAGSHIP_WORKBENCH_IDS.length).toBeLessThan(anchors.length);
    expect(isFlagshipWorkbench('taskforge')).toBe(true);
    expect(isFlagshipWorkbench('hcsc-automation')).toBe(false);
    expect(isFlagshipWorkbench('toString')).toBe(false);
  });

  it('tours Start Here and then every flagship, each a published bench', () => {
    expect(FLAGSHIP_TOUR[0]).toBe('about-me-overview');
    expect([...FLAGSHIP_TOUR.slice(1)].sort()).toEqual([...FLAGSHIP_WORKBENCH_IDS].sort());
    for (const id of FLAGSHIP_TOUR) {
      expect(WORKBENCH_LAYOUT.find((definition) => definition.id === id)?.visibility, id).toBe('published');
    }
  });

  it('knows the neighbours of each stop, and nothing for benches off the route', () => {
    expect(getTourStep('about-me-overview')).toEqual({ position: 1, total: 5, previousId: null, nextId: 'taskforge' });
    expect(getTourStep('quantlab')).toEqual({ position: 4, total: 5, previousId: 'enginex', nextId: 'lidar-phenotyping-research' });
    expect(getTourStep('lidar-phenotyping-research')).toEqual({ position: 5, total: 5, previousId: 'quantlab', nextId: null });
    // The route follows the professional site's case-study order.
    expect(FLAGSHIP_TOUR.slice(1)).toEqual(['taskforge', 'enginex', 'quantlab', 'lidar-phenotyping-research']);
    expect(getTourStep('hcsc-automation')).toBeNull();
  });
});

describe('live models', () => {
  it('counts only the flagships with controls as live models', () => {
    expect(['taskforge', 'enginex', 'quantlab'].every(hasInteractiveModel)).toBe(true);
    expect(hasInteractiveModel('lidar-phenotyping-research')).toBe(false);
    expect(hasInteractiveModel('about-me-overview')).toBe(false);
  });
});

describe('long-range labels', () => {
  it('names the flagships and the main role benches from across the plaza, not every bench', () => {
    for (const id of [...FLAGSHIP_WORKBENCH_IDS, 'hcsc-automation', 'ssec-technical-computing', 'phoenix-aid-qa']) {
      expect(hasLongRangeLabel(id), id).toBe(true);
    }
    expect(hasLongRangeLabel('footymind')).toBe(false);
  });
});
