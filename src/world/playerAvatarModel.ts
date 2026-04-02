import type { PlayerLocomotionMode } from './playerAvatar';

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
