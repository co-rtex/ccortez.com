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

interface Rect {
  left: number;
  top: number;
  right: number;
  bottom: number;
  width: number;
  height: number;
}

/**
 * How far to shift the rendered view so the bench sits in the middle of what an open panel leaves visible:
 * half the covered width for a side panel (content moves left), half the covered height for a bottom sheet
 * (content moves up), nothing when the panel covers (nearly) everything.
 */
export function getPanelViewOffset(canvas: Rect, panel: Rect): { x: number; y: number } {
  const coveredWidth = Math.max(0, canvas.right - panel.left);
  const coveredHeight = Math.max(0, canvas.bottom - panel.top);
  if (coveredWidth >= canvas.width * 0.95 && coveredHeight >= canvas.height * 0.95) return { x: 0, y: 0 };
  if (panel.height >= canvas.height * 0.9) return { x: Math.min(coveredWidth, canvas.width * 0.6) / 2, y: 0 };
  return { x: 0, y: Math.min(coveredHeight, canvas.height * 0.7) / 2 };
}
