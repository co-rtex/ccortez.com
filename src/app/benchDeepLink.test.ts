import { describe, expect, it } from 'vitest';

import { parseBenchDeepLink } from './benchDeepLink';

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
});
