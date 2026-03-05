import type { WorldAnchor } from '../types/experience';

export function distanceXZ(left: WorldAnchor, right: WorldAnchor): number {
  const dx = left.x - right.x;
  const dz = left.z - right.z;
  return Math.hypot(dx, dz);
}

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
