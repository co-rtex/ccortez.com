import { DEFAULT_MOVEMENT_SPEED_CONFIG, type MovementSpeedConfig } from '../engine/playerSpeed';

export interface PlayerAvatarAppearance {
  skinTone: string;
  hairColor: string;
  hairHighlightColor: string;
  eyebrowColor: string;
  eyeWhiteColor: string;
  irisColor: string;
  eyeColor: string;
  shirtColor: string;
  undershirtColor: string;
  jeansColor: string;
  jeansFadeColor: string;
  shoeColor: string;
  shoeSoleColor: string;
  headRadius: number;
  headCenterY: number;
  eyeY: number;
  eyeZ: number;
  eyeXOffset: number;
  eyebrowY: number;
  eyebrowZ: number;
  browWidth: number;
  bangY: number;
  mouthY: number;
  mouthZ: number;
  footY: number;
}

export type PlayerLocomotionMode = 'idle' | 'walk' | 'run';

export interface PlayerLocomotionState {
  planarSpeed: number;
  gaitIntensity: number;
  movementHeading: number;
  facingYaw: number;
  gaitPhase: number;
  mode: PlayerLocomotionMode;
  isMoving: boolean;
  isRunning: boolean;
}

export interface MovementInputVector {
  x: number;
  z: number;
}

const PLAYER_IDLE_SPEED_EPSILON = 0.18;
const PLAYER_FACING_BLEND_RATE = 10;
const PLAYER_WALK_CADENCE = Math.PI * 3.2;
const PLAYER_RUN_CADENCE = Math.PI * 5.2;

export const PLAYER_AVATAR_APPEARANCE: PlayerAvatarAppearance = {
  skinTone: '#d3a27f',
  hairColor: '#4a3528',
  hairHighlightColor: '#6b4d3b',
  eyebrowColor: '#37261c',
  eyeWhiteColor: '#f8f2ea',
  irisColor: '#6a4734',
  eyeColor: '#261a15',
  shirtColor: '#20324f',
  undershirtColor: '#6d737b',
  jeansColor: '#6488be',
  jeansFadeColor: '#88a8d0',
  shoeColor: '#92979f',
  shoeSoleColor: '#555b63',
  headRadius: 0.3,
  headCenterY: 1.07,
  eyeY: 1.09,
  eyeZ: 0.248,
  eyeXOffset: 0.112,
  eyebrowY: 1.165,
  eyebrowZ: 0.252,
  browWidth: 0.074,
  bangY: 1.205,
  mouthY: 0.958,
  mouthZ: 0.246,
  footY: -0.82,
};

export const PLAYER_AVATAR_HEAD_TOP_Y =
  PLAYER_AVATAR_APPEARANCE.headCenterY + PLAYER_AVATAR_APPEARANCE.headRadius;
export const PLAYER_CAMERA_LOOK_HEIGHT = PLAYER_AVATAR_APPEARANCE.eyeY + 0.12;

export function normalizeAngle(angle: number): number {
  let next = angle;

  while (next <= -Math.PI) {
    next += Math.PI * 2;
  }

  while (next > Math.PI) {
    next -= Math.PI * 2;
  }

  return next;
}

export function stepYawTowards(
  currentYaw: number,
  targetYaw: number,
  deltaSeconds: number,
  blendRate = PLAYER_FACING_BLEND_RATE,
): number {
  const difference = normalizeAngle(targetYaw - currentYaw);
  const interpolation = 1 - Math.exp(-blendRate * deltaSeconds);
  return normalizeAngle(currentYaw + difference * interpolation);
}

export function resolvePlayerLocomotionMode(
  planarSpeed: number,
  speedConfig: MovementSpeedConfig = DEFAULT_MOVEMENT_SPEED_CONFIG,
): PlayerLocomotionMode {
  if (planarSpeed < PLAYER_IDLE_SPEED_EPSILON) {
    return 'idle';
  }

  const runThreshold = speedConfig.walk + (speedConfig.run - speedConfig.walk) * 0.56;
  return planarSpeed >= runThreshold ? 'run' : 'walk';
}

export function resolveGaitIntensity(
  planarSpeed: number,
  speedConfig: MovementSpeedConfig = DEFAULT_MOVEMENT_SPEED_CONFIG,
): number {
  return Math.max(0, Math.min(planarSpeed / speedConfig.run, 1));
}

export function advanceGaitPhase(
  currentPhase: number,
  deltaSeconds: number,
  mode: PlayerLocomotionMode,
  gaitIntensity: number,
  frozen = false,
): number {
  if (frozen || mode === 'idle') {
    return currentPhase;
  }

  const cadence = mode === 'run' ? PLAYER_RUN_CADENCE : PLAYER_WALK_CADENCE;
  const speedScale = mode === 'run' ? 0.84 + gaitIntensity * 0.32 : 0.72 + gaitIntensity * 0.44;
  return normalizeAngle(currentPhase + cadence * speedScale * deltaSeconds);
}

export function createInitialPlayerLocomotionState(initialFacingYaw = 0): PlayerLocomotionState {
  return {
    planarSpeed: 0,
    gaitIntensity: 0,
    movementHeading: initialFacingYaw,
    facingYaw: initialFacingYaw,
    gaitPhase: 0,
    mode: 'idle',
    isMoving: false,
    isRunning: false,
  };
}

export function stepPlayerLocomotionState(
  current: PlayerLocomotionState,
  movementDelta: MovementInputVector,
  deltaSeconds: number,
  gaitFrozen: boolean,
  speedConfig: MovementSpeedConfig = DEFAULT_MOVEMENT_SPEED_CONFIG,
): PlayerLocomotionState {
  const safeDelta = Math.max(deltaSeconds, 1e-6);
  const planarSpeed = Math.hypot(movementDelta.x, movementDelta.z) / safeDelta;
  const mode = gaitFrozen ? 'idle' : resolvePlayerLocomotionMode(planarSpeed, speedConfig);
  const gaitIntensity = gaitFrozen ? 0 : resolveGaitIntensity(planarSpeed, speedConfig);
  const isMoving = !gaitFrozen && planarSpeed >= PLAYER_IDLE_SPEED_EPSILON;
  const movementHeading = isMoving
    ? Math.atan2(movementDelta.x, movementDelta.z)
    : current.movementHeading;
  const facingYaw = isMoving
    ? stepYawTowards(current.facingYaw, movementHeading, deltaSeconds)
    : current.facingYaw;

  return {
    planarSpeed,
    gaitIntensity,
    movementHeading,
    facingYaw,
    gaitPhase: advanceGaitPhase(current.gaitPhase, deltaSeconds, mode, gaitIntensity, gaitFrozen),
    mode,
    isMoving,
    isRunning: mode === 'run',
  };
}

export function resolveCameraAwareMovementInput(
  rawInput: MovementInputVector,
  cameraMode: 'follow' | 'seated' | 'editor-focus' | 'workbench-inspect',
): MovementInputVector {
  if (cameraMode === 'workbench-inspect') {
    return {
      x: 0,
      z: 0,
    };
  }

  return rawInput;
}

export function shouldRenderPlayerAvatar(playerMode: 'exploring' | 'seated'): boolean {
  return playerMode !== 'seated';
}
