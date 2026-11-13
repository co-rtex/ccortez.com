/** Look-ahead shrinks on portrait screens so the player stays clear of the bottom HUD. */
export function getFollowLookAhead(aspect: number): number {
  const t = Math.min(Math.max((aspect - 0.6) / 0.8, 0), 1);
  return -1.2 + (-6.2 + 1.2) * t;
}

/**
 * The follow camera never turns: it always looks north from south of the player. A bench south of the player (the
 * whole south half of the ring, seen from the plaza) therefore sat below the bottom of the frame while the visitor
 * stood at it. While the player is in a bench's range, the look target eases toward the bench in proportion to how
 * far south of the player it is; benches to the north are already in view and get no assist.
 */
export function getBenchFramingWeight(
  player: { x: number; z: number },
  bench: { x: number; z: number } | null,
): number {
  if (!bench) return 0;
  const south = bench.z - player.z;
  return Math.min(Math.max((south - 0.5) / 2.5, 0), 1);
}
