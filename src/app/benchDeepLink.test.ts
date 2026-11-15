import { describe, expect, it } from 'vitest';

import { BENCH_ID_ALIASES, parseBenchDeepLink } from './benchDeepLink';
import { WORKBENCH_LAYOUT } from '../../content/workbenches/layout';

const ids = new Set(['taskforge', 'enginex']);

describe('bench deep link', () => {
  it('opens a published bench', () => {
    expect(parseBenchDeepLink('?bench=taskforge', ids)).toBe('taskforge');
  });

  it('ignores unknown benches, no parameter and screenshot fixtures', () => {
    expect(parseBenchDeepLink('?bench=nope', ids)).toBeNull();
    expect(parseBenchDeepLink('', ids)).toBeNull();
    expect(parseBenchDeepLink('?bench=taskforge&shot=1,2,3,4,5,6', ids)).toBeNull();
  });

  it('opens a renamed project by its new name, and still by its original id', () => {
    expect(parseBenchDeepLink('?bench=lockstep', ids)).toBe('enginex');
    expect(parseBenchDeepLink('?bench=enginex', ids)).toBe('enginex');
  });

  it('ignores an alias whose bench is not published', () => {
    expect(parseBenchDeepLink('?bench=hindsight', ids)).toBeNull();
    expect(parseBenchDeepLink('?bench=constructor', ids)).toBeNull();
  });

  it('points every alias at a real bench, and no alias shadows a real bench id', () => {
    const published = new Set(WORKBENCH_LAYOUT.filter((d) => d.visibility === 'published').map((d) => d.id));
    for (const [alias, id] of Object.entries(BENCH_ID_ALIASES)) {
      expect(published.has(id), `${alias} -> ${id}`).toBe(true);
      expect(published.has(alias), alias).toBe(false);
    }
  });
});
