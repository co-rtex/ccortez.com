import type { PlayerLocomotionMode } from './playerAvatar';

/**
 * Screenshot fixture for the player avatar. `?avatar=yaw[,mode[,time]]` turns the avatar to a fixed yaw (radians;
 * 0 faces +z, toward the default camera), plays the given clip (idle, walk or run) and, with a time, freezes it
 * at that many seconds. Combined with `?shot=` it gives repeatable front, three-quarter, side and back views and
 * stills of any point in a gait. Without the parameter it does nothing, so it is safe to ship.
 */
export interface AvatarInspectFixture {
  yaw: number;
  mode: PlayerLocomotionMode | null;
  time: number | null;
}

const MODES: readonly PlayerLocomotionMode[] = ['idle', 'walk', 'run'];

export function parseAvatarInspect(search: string): AvatarInspectFixture | null {
  const raw = new URLSearchParams(search).get('avatar');
  if (!raw) return null;
  const [yawText, modeText, timeText] = raw.split(',');
  const yaw = Number(yawText);
  if (!Number.isFinite(yaw)) return null;
  const mode = MODES.find((candidate) => candidate === modeText) ?? null;
  const time = timeText !== undefined && Number.isFinite(Number(timeText)) ? Number(timeText) : null;
  return { yaw, mode, time };
}

export function readAvatarInspectFixture(): AvatarInspectFixture | null {
  return typeof window === 'undefined' ? null : parseAvatarInspect(window.location.search);
}
