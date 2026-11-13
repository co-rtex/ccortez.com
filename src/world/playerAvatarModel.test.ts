import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

import {
  PLAYER_AVATAR_ANIMATION_NAMES,
  PLAYER_AVATAR_MODEL_PATH,
  resolveAvailableAvatarClipName,
  resolveGaitPlaybackRate,
  resolvePreferredAvatarClipName,
} from './playerAvatarModel';
import { PLAYER_AVATAR_CLIP_GROUND_SPEED } from './playerAvatarGaitSpeeds';
import { DEFAULT_MOVEMENT_SPEED_CONFIG } from '../engine/playerSpeed';

describe('player avatar model helpers', () => {
  it('keeps the local avatar asset contract stable', () => {
    expect(PLAYER_AVATAR_MODEL_PATH).toBe('/models/player/ccortez-avatar.gltf');
    expect(PLAYER_AVATAR_ANIMATION_NAMES.idle).toBe('AvatarIdle');
    expect(PLAYER_AVATAR_ANIMATION_NAMES.walk).toBe('AvatarWalk');
    expect(PLAYER_AVATAR_ANIMATION_NAMES.run).toBe('AvatarRun');
  });

  it('maps locomotion modes to the expected preferred clips', () => {
    expect(resolvePreferredAvatarClipName('idle')).toBe('AvatarIdle');
    expect(resolvePreferredAvatarClipName('walk')).toBe('AvatarWalk');
    expect(resolvePreferredAvatarClipName('run')).toBe('AvatarRun');
  });

  it('falls back to idle or the first available clip when a preferred clip is unavailable', () => {
    expect(resolveAvailableAvatarClipName('walk', ['AvatarIdle', 'AvatarRun'])).toBe('AvatarIdle');
    expect(resolveAvailableAvatarClipName('run', ['AvatarWave', 'AvatarPose'])).toBe('AvatarWave');
    expect(resolveAvailableAvatarClipName('idle', [])).toBeNull();
  });

  it('matches the generated gltf clips and silhouette support meshes', () => {
    const modelPath = resolve(process.cwd(), 'public', PLAYER_AVATAR_MODEL_PATH.slice(1));
    const gltf = JSON.parse(readFileSync(modelPath, 'utf8')) as {
      animations?: Array<{ name?: string }>;
      nodes?: Array<{ name?: string }>;
    };

    const animationNames = (gltf.animations ?? []).map((animation) => animation.name);
    const nodeNames = (gltf.nodes ?? []).map((node) => node.name);

    expect(animationNames).toEqual([
      PLAYER_AVATAR_ANIMATION_NAMES.idle,
      PLAYER_AVATAR_ANIMATION_NAMES.walk,
      PLAYER_AVATAR_ANIMATION_NAMES.run,
    ]);
    expect(nodeNames).toEqual(
      expect.arrayContaining([
        // The rig the clips animate.
        'Hips',
        'Torso',
        'Head',
        'Arm_L',
        'Arm_R',
        'Forearm_L',
        'Forearm_R',
        'Thigh_L',
        'Thigh_R',
        'Calf_L',
        'Calf_R',
        'Foot_L',
        'Foot_R',
        // One merged mesh per body part.
        'HeadShape',
        'Hair',
        'Polo',
        'Khakis_Seat',
        'Arm_L_Sleeve',
        'Arm_R_Sleeve',
        'Arm_L_Forearm',
        'Arm_R_Forearm',
        'Thigh_L_Khaki',
        'Thigh_R_Khaki',
        'Calf_L_Khaki',
        'Calf_R_Khaki',
        'Foot_L_Sneaker',
        'Foot_R_Sneaker',
      ]),
    );
  });

  it('stays cheap to render: a handful of meshes and materials', () => {
    const modelPath = resolve(process.cwd(), 'public', PLAYER_AVATAR_MODEL_PATH.slice(1));
    const gltf = JSON.parse(readFileSync(modelPath, 'utf8')) as {
      meshes?: unknown[];
      materials?: unknown[];
    };
    expect(gltf.meshes?.length ?? 0).toBeLessThanOrEqual(16);
    expect(gltf.materials?.length ?? 0).toBeLessThanOrEqual(2);
  });

  it('plays gait clips so the planted foot keeps pace with the ground at the default speeds', () => {
    for (const mode of ['walk', 'run'] as const) {
      const speed = DEFAULT_MOVEMENT_SPEED_CONFIG[mode];
      const rate = resolveGaitPlaybackRate(mode, speed);
      // Unclamped at the nominal speed, so foot speed = clip ground speed x rate = movement speed (no slide).
      expect(rate * PLAYER_AVATAR_CLIP_GROUND_SPEED[mode]).toBeCloseTo(speed, 5);
      // And a believable cadence: neither slow motion nor a frantic shuffle.
      expect(rate).toBeGreaterThan(0.9);
      expect(rate).toBeLessThan(1.45);
    }
  });

  it('clamps the playback rate at extreme speeds', () => {
    expect(resolveGaitPlaybackRate('walk', 0.05)).toBe(0.55);
    expect(resolveGaitPlaybackRate('run', 40)).toBe(1.6);
  });
});
