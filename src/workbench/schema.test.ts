import { describe, expect, it } from 'vitest';

import { WORKBENCH_DISTRICTS, WORKBENCH_LAYOUT } from '../../content/workbenches/layout';

import { validateWorkbenchDistricts, validateWorkbenchLayout } from './schema';

describe('workbench schema', () => {
  it('validates the district registry', () => {
    const districts = validateWorkbenchDistricts(WORKBENCH_DISTRICTS);
    expect(districts).toHaveLength(5);
  });

  it('validates the workbench layout registry', () => {
    const layout = validateWorkbenchLayout(WORKBENCH_LAYOUT);
    expect(layout).toHaveLength(WORKBENCH_LAYOUT.length);
    expect(layout.every((definition) => definition.visibility === 'draft')).toBe(true);
  });
});
