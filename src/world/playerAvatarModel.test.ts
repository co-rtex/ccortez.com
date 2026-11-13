import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

import {
  PLAYER_AVATAR_ANIMATION_NAMES,
  PLAYER_AVATAR_MODEL_PATH,
  resolveAvailableAvatarClipName,
  resolvePreferredAvatarClipName,
} from './playerAvatarModel';

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
});
