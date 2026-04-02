import { describe, expect, it } from 'vitest';

// @ts-expect-error script helper lives outside the app TS project
import * as workbenchScript from '../../scripts/new-workbench.shared.mjs';

const { createWorkbenchTemplate, insertWorkbenchIntoLayoutSource, renderWorkbenchEntry } =
  workbenchScript;

describe('new workbench script helpers', () => {
  it('creates draft placeholder entries with seeded freeform defaults', () => {
    const entry = createWorkbenchTemplate({
      id: 'bcbs-swe',
      title: 'BCBS SWE',
      district: 'work-experience',
    });

    expect(entry.visibility).toBe('draft');
    expect(entry.contentMode).toBe('placeholder');
    expect(entry.presentationMode).toBe('scene-owned');
    expect(entry.placement.mode).toBe('freeform');
    expect(entry.placement.x).toBeCloseTo(6.899, 3);
  });

  it('inserts a rendered workbench block into the layout source', () => {
    const source = `import type { WorkbenchDefinition } from '../../src/types/workbench';

const RAW_WORKBENCH_LAYOUT: WorkbenchDefinition[] = [
];
`;
    const block = renderWorkbenchEntry(
      createWorkbenchTemplate({
        id: 'new-bench',
        title: 'New Bench',
        district: 'projects',
      }),
    );
    const nextSource = insertWorkbenchIntoLayoutSource(source, block);

    expect(nextSource).toContain("id: 'new-bench'");
    expect(nextSource).toContain('const RAW_WORKBENCH_LAYOUT');
  });
});
