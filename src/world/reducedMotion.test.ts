import { afterEach, describe, expect, it } from 'vitest';

import { prefersReducedMotion, resetReducedMotionCache } from './reducedMotion';

function fakeMatchMedia(initial: boolean) {
  let listener: ((event: { matches: boolean }) => void) | null = null;
  let calls = 0;
  const matchMedia = (query: string) => {
    calls += 1;
    expect(query).toBe('(prefers-reduced-motion: reduce)');
    return {
      matches: initial,
      addEventListener: (_type: string, fn: (event: { matches: boolean }) => void) => {
        listener = fn;
      },
    } as unknown as MediaQueryList;
  };
  return {
    matchMedia,
    change: (matches: boolean) => listener?.({ matches }),
    calls: () => calls,
  };
}

describe('prefersReducedMotion', () => {
  afterEach(() => resetReducedMotionCache());

  it('is false where there is no matchMedia (server, tests)', () => {
    expect(prefersReducedMotion(null)).toBe(false);
  });

  it('reads the media query once and then answers from the cache', () => {
    const fake = fakeMatchMedia(true);
    expect(prefersReducedMotion(fake.matchMedia)).toBe(true);
    expect(prefersReducedMotion(fake.matchMedia)).toBe(true);
    expect(fake.calls()).toBe(1);
  });

  it('follows the preference when the visitor changes it', () => {
    const fake = fakeMatchMedia(false);
    expect(prefersReducedMotion(fake.matchMedia)).toBe(false);
    fake.change(true);
    expect(prefersReducedMotion(fake.matchMedia)).toBe(true);
  });
});
