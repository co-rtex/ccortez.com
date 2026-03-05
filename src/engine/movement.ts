import { clamp } from './math';

import type { WorldAnchor } from '../types/experience';

export interface WorldBounds {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
}

export interface RectObstacle {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
}

export interface CircleObstacle {
  centerX: number;
  centerZ: number;
  radius: number;
}

export interface EllipseObstacle {
  centerX: number;
  centerZ: number;
  radiusX: number;
  radiusZ: number;
  rotation: number;
}

export type CollisionObstacle = RectObstacle | CircleObstacle | EllipseObstacle;

export interface MovementDelta {
  x: number;
  z: number;
}

function isRectObstacle(obstacle: CollisionObstacle): obstacle is RectObstacle {
  return 'minX' in obstacle;
}

function isCircleObstacle(obstacle: CollisionObstacle): obstacle is CircleObstacle {
  return 'radius' in obstacle;
}

function isInsideRectObstacle(
  position: Pick<WorldAnchor, 'x' | 'z'>,
  obstacle: RectObstacle,
  radius: number,
): boolean {
  return (
    position.x > obstacle.minX - radius &&
    position.x < obstacle.maxX + radius &&
    position.z > obstacle.minZ - radius &&
    position.z < obstacle.maxZ + radius
  );
}

function isInsideCircleObstacle(
  position: Pick<WorldAnchor, 'x' | 'z'>,
  obstacle: CircleObstacle,
  radius: number,
): boolean {
  const dx = position.x - obstacle.centerX;
  const dz = position.z - obstacle.centerZ;
  return Math.hypot(dx, dz) < obstacle.radius + radius;
}

function isInsideEllipseObstacle(
  position: Pick<WorldAnchor, 'x' | 'z'>,
  obstacle: EllipseObstacle,
  radius: number,
): boolean {
  const cos = Math.cos(-obstacle.rotation);
  const sin = Math.sin(-obstacle.rotation);
  const dx = position.x - obstacle.centerX;
  const dz = position.z - obstacle.centerZ;

  const localX = dx * cos - dz * sin;
  const localZ = dx * sin + dz * cos;

  const normalizedX = localX / (obstacle.radiusX + radius);
  const normalizedZ = localZ / (obstacle.radiusZ + radius);
  return normalizedX * normalizedX + normalizedZ * normalizedZ < 1;
}

export function isInsideObstacle(
  position: Pick<WorldAnchor, 'x' | 'z'>,
  obstacle: CollisionObstacle,
  radius: number,
): boolean {
  if (isRectObstacle(obstacle)) {
    return isInsideRectObstacle(position, obstacle, radius);
  }

  if (isCircleObstacle(obstacle)) {
    return isInsideCircleObstacle(position, obstacle, radius);
  }

  return isInsideEllipseObstacle(position, obstacle, radius);
}

function collidesWithAnyObstacle(
  position: Pick<WorldAnchor, 'x' | 'z'>,
  obstacles: CollisionObstacle[],
  radius: number,
): boolean {
  return obstacles.some((obstacle) => isInsideObstacle(position, obstacle, radius));
}

export function resolvePlayerMovement(
  currentPosition: WorldAnchor,
  delta: MovementDelta,
  bounds: WorldBounds,
  obstacles: CollisionObstacle[],
  radius = 0.7,
): WorldAnchor {
  let nextX = clamp(currentPosition.x + delta.x, bounds.minX + radius, bounds.maxX - radius);
  const nextY = currentPosition.y;
  let nextZ = clamp(currentPosition.z + delta.z, bounds.minZ + radius, bounds.maxZ - radius);

  if (collidesWithAnyObstacle({ x: nextX, z: currentPosition.z }, obstacles, radius)) {
    nextX = currentPosition.x;
  }

  if (collidesWithAnyObstacle({ x: nextX, z: nextZ }, obstacles, radius)) {
    nextZ = currentPosition.z;
  }

  return {
    x: nextX,
    y: nextY,
    z: nextZ,
  };
}
