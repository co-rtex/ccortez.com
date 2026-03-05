export interface MovementSpeedConfig {
  walk: number;
  run: number;
}

export const DEFAULT_MOVEMENT_SPEED_CONFIG: MovementSpeedConfig = {
  walk: 8.2,
  run: 13.4,
};

export function resolveMovementSpeed(
  keyboardModeEnabled: boolean,
  runModifierActive: boolean,
  config: MovementSpeedConfig = DEFAULT_MOVEMENT_SPEED_CONFIG,
): number {
  if (!keyboardModeEnabled) {
    return 0;
  }

  return runModifierActive ? config.run : config.walk;
}

export function blendMovementSpeed(
  currentSpeed: number,
  targetSpeed: number,
  deltaSeconds: number,
  blendRate = 10,
): number {
  const interpolation = 1 - Math.exp(-blendRate * deltaSeconds);
  return currentSpeed + (targetSpeed - currentSpeed) * interpolation;
}
