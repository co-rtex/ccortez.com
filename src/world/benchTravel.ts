import type { WorldAnchor } from '../types/experience';

/**
 * Fast travel from the recruiter guide. Opening a bench from the guide used to fly only the camera there, so
 * closing the panel dropped the visitor back wherever they had been standing, often across the island. Now the
 * player is moved to a stand point at the bench's front as well, and closing the panel leaves them at the bench.
 *
 * The stand point is straight in front of the bench (its local +z, the side it faces), just past the plinth and
 * inside the bench's interaction radius, so the "open" prompt is up as soon as the panel closes. The inspect camera
 * looks down over that spot from higher up, so the avatar does not block the props.
 */
export interface BenchStandPoint {
  x: number;
  z: number;
  /** Yaw that turns the avatar to face the bench (0 faces +z). */
  facingYaw: number;
}

/** Plinth top radius (3.05 m) plus room for the avatar. */
const STAND_MIN_DISTANCE = 3.6;
const STAND_MAX_DISTANCE = 4.2;
/** Closer than this, the visitor is already at the bench and is not moved. */
export const BENCH_TRAVEL_MIN_DISTANCE = 7;

export function getBenchStandPoint(
  anchor: Pick<WorldAnchor, 'x' | 'z'>,
  rotationY: number,
  interactionRadius = STAND_MAX_DISTANCE + 0.4,
): BenchStandPoint {
  const distance = Math.min(STAND_MAX_DISTANCE, Math.max(STAND_MIN_DISTANCE, interactionRadius - 0.4));
  // Same rotation as an Object3D's rotation.y: local +z maps to (sin, cos).
  const x = anchor.x + Math.sin(rotationY) * distance;
  const z = anchor.z + Math.cos(rotationY) * distance;
  return { x, z, facingYaw: Math.atan2(anchor.x - x, anchor.z - z) };
}

export function shouldTravelToBench(
  player: Pick<WorldAnchor, 'x' | 'z'>,
  anchor: Pick<WorldAnchor, 'x' | 'z'>,
): boolean {
  return Math.hypot(player.x - anchor.x, player.z - anchor.z) > BENCH_TRAVEL_MIN_DISTANCE;
}
