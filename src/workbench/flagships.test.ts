import { describe, expect, it } from 'vitest';

import { WORKBENCH_LAYOUT } from '../../content/workbenches/layout';
import { FLAGSHIP_WORKBENCH_IDS, getCaseStudyUrl, isFlagshipWorkbench } from './flagships';

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
});
