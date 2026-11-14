export interface MovementSpeedConfig {
  walk: number;
  run: number;
}

// A brisk walk and a run for a 1.75 m figure (were 8.2 and 13.4 m/s, sprint speeds no stride could cover, so the
// feet slid). The avatar's clips play at (speed / clip ground speed), ~1.3x natural here, so the feet keep pace.
export const DEFAULT_MOVEMENT_SPEED_CONFIG: MovementSpeedConfig = {
  walk: 2.2,
  run: 5.0,
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
