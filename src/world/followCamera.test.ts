import { describe, expect, it } from 'vitest';

import { getFollowLookAhead } from './followCamera';

describe('follow camera look-ahead', () => {
  it('looks furthest ahead on wide screens and least on portrait phones', () => {
    expect(getFollowLookAhead(16 / 9)).toBeCloseTo(-6.2);
    expect(getFollowLookAhead(390 / 844)).toBeCloseTo(-1.2);
    expect(getFollowLookAhead(1)).toBeLessThan(getFollowLookAhead(0.8));
  });
});
