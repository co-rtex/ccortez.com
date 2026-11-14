import type { PlayerLocomotionMode } from './playerAvatar';
import { PLAYER_AVATAR_CLIP_GROUND_SPEED } from './playerAvatarGaitSpeeds';

export const PLAYER_AVATAR_MODEL_PATH = '/models/player/ccortez-avatar.gltf';
export const PLAYER_AVATAR_MODEL_SCALE = 1;
export const PLAYER_AVATAR_MODEL_YAW_OFFSET = 0;
export const PLAYER_AVATAR_ANIMATION_CROSSFADE_SECONDS = 0.2;

export const PLAYER_AVATAR_ANIMATION_NAMES = {
  idle: 'AvatarIdle',
  walk: 'AvatarWalk',
  run: 'AvatarRun',
} as const satisfies Record<PlayerLocomotionMode, string>;

export function resolvePreferredAvatarClipName(mode: PlayerLocomotionMode): string {
  return PLAYER_AVATAR_ANIMATION_NAMES[mode];
}

export function resolveAvailableAvatarClipName(
  mode: PlayerLocomotionMode,
  availableClipNames: readonly string[],
): string | null {
  const preferredClip = resolvePreferredAvatarClipName(mode);
  if (availableClipNames.includes(preferredClip)) {
    return preferredClip;
  }

  const idleClip = PLAYER_AVATAR_ANIMATION_NAMES.idle;
  if (availableClipNames.includes(idleClip)) {
    return idleClip;
  }

  return availableClipNames[0] ?? null;
}

/**
 * Playback rate for a gait clip at a given movement speed: speed / the clip's natural ground speed, so the planted
 * foot keeps pace with the ground. Clamped so a sudden stop or start never plays the clip absurdly slow or fast.
 */
export function resolveGaitPlaybackRate(mode: Exclude<PlayerLocomotionMode, 'idle'>, planarSpeed: number): number {
  const rate = planarSpeed / PLAYER_AVATAR_CLIP_GROUND_SPEED[mode];
  return Math.min(1.6, Math.max(0.55, rate));
}
