import { describe, expect, it } from 'vitest';

import { __resetBootstrapFlagForTests, bootstrapExperienceRegistry } from '../content/loader';
import { __resetExperienceRegistryForTests, getAllExperiences } from '../content/registry';
import { WORKBENCH_DISTRICTS, WORKBENCH_LAYOUT } from '../../content/workbenches/layout';
import { START_HERE_WORKBENCH_ID } from '../world/hub';

import { buildWorkbenchRuntime } from './runtime';

describe('workbench runtime', () => {
  it('builds runtime records for the central workbench layout', () => {
    const records = buildWorkbenchRuntime(WORKBENCH_LAYOUT, WORKBENCH_DISTRICTS, []);
    expect(records).toHaveLength(WORKBENCH_LAYOUT.length);
    expect(records.every((record) => record.districtDefinition.id === record.definition.district)).toBe(true);
    expect(records[0]?.definition.presentationMode).toBe('scene-owned');
  });

  it('keeps the starter bench layout free of hard placement errors', () => {
    const records = buildWorkbenchRuntime(WORKBENCH_LAYOUT, WORKBENCH_DISTRICTS, []);
    const errors = records.flatMap((record) =>
      record.issues.filter(
        (issue) => issue.severity === 'error' && issue.code !== 'missing-link',
      ),
    );
    expect(errors).toEqual([]);
  });

  it('links every published recruiter bench to a real experience package', () => {
    __resetExperienceRegistryForTests();
    __resetBootstrapFlagForTests();
    bootstrapExperienceRegistry();

    const records = buildWorkbenchRuntime(
      WORKBENCH_LAYOUT,
      WORKBENCH_DISTRICTS,
      getAllExperiences(),
    );
    const publishedRecords = records.filter((record) => record.definition.visibility === 'published');
    const missingLinks = publishedRecords.flatMap((record) =>
      record.issues.filter((issue) => issue.code === 'missing-link'),
    );

    expect(publishedRecords).toHaveLength(14);
    expect(publishedRecords.some((record) => record.definition.id === START_HERE_WORKBENCH_ID)).toBe(true);
    expect(missingLinks).toEqual([]);
    expect(
      publishedRecords.flatMap((record) =>
        record.issues.filter(
          (issue) =>
            issue.severity === 'error' ||
            issue.code === 'district-spacing' ||
            issue.code === 'reserved-start-pad',
        ),
      ),
    ).toEqual([]);
  });

  it('surfaces an error when a linked workbench points at missing experience content', () => {
    const layout = WORKBENCH_LAYOUT.map((definition, index) =>
      index === 0
        ? {
            ...definition,
            contentMode: 'linked' as const,
            experienceId: 'missing-experience',
          }
        : definition,
    );

    const records = buildWorkbenchRuntime(layout, WORKBENCH_DISTRICTS, []);
    expect(records[0]?.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: 'missing-link',
          severity: 'error',
        }),
      ]),
    );
  });
});
