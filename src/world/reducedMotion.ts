/**
 * The visitor's "reduce motion" preference, read cheaply from per-frame code. The media query is created once
 * and kept current by its change listener, so a useFrame callback can ask every frame without allocating.
 * Under reduced motion the world swaps camera fly-ins for cuts and stills decorative spin and pulse; walking,
 * water and wildlife stay as they are.
 */

const QUERY = '(prefers-reduced-motion: reduce)';

type MatchMedia = (query: string) => Pick<MediaQueryList, 'matches' | 'addEventListener'>;

let cached: boolean | null = null;

function defaultMatchMedia(): MatchMedia | null {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return null;
  return (query) => window.matchMedia(query);
}

export function prefersReducedMotion(matchMedia: MatchMedia | null = defaultMatchMedia()): boolean {
  if (cached !== null) return cached;
  if (!matchMedia) return false;
  const list = matchMedia(QUERY);
  cached = list.matches;
  list.addEventListener('change', (event) => {
    cached = event.matches;
  });
  return cached;
}

/** Test hook: forget the cached answer so the next call reads the media query again. */
export function resetReducedMotionCache(): void {
  cached = null;
}
