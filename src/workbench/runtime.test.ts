import { describe, expect, it } from 'vitest';

import { WORKBENCH_DISTRICTS, WORKBENCH_LAYOUT } from '../../content/workbenches/layout';

import { buildWorkbenchRuntime } from './runtime';

describe('workbench runtime', () => {
  it('builds runtime records for the central workbench layout', () => {
    const records = buildWorkbenchRuntime(WORKBENCH_LAYOUT, WORKBENCH_DISTRICTS, []);
    expect(records).toHaveLength(WORKBENCH_LAYOUT.length);
    expect(records.every((record) => record.districtDefinition.id === record.definition.district)).toBe(true);
  });

  it('keeps the starter draft benches free of hard placement errors', () => {
    const records = buildWorkbenchRuntime(WORKBENCH_LAYOUT, WORKBENCH_DISTRICTS, []);
    const errors = records.flatMap((record) => record.issues.filter((issue) => issue.severity === 'error'));
    expect(errors).toEqual([]);
  });
});
