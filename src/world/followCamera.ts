/** Look-ahead shrinks on portrait screens so the player stays clear of the bottom HUD. */
export function getFollowLookAhead(aspect: number): number {
  const t = Math.min(Math.max((aspect - 0.6) / 0.8, 0), 1);
  return -1.2 + (-6.2 + 1.2) * t;
}
