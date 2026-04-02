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
        'HeadShape',
        'UpperSkull',
        'Cheek_L',
        'Cheek_R',
        'Smile',
        'HairFrontCap',
        'HairBackCap',
        'HairCrownFill',
        'HairSideSoft_L',
        'HairSideSoft_R',
        'HairTemple_L',
        'HairTemple_R',
        'HairLayer_L',
        'HairLayer_R',
        'EyeLidUpper_L',
        'EyeLidUpper_R',
        'JeanWaist',
        'ShirtWaistOverlap',
        'ShirtBody',
        'ShirtFront',
        'ShirtCollar',
        'Arm_L_Sleeve',
        'Arm_R_Sleeve',
        'Arm_L_Hand',
        'Arm_R_Hand',
        'Arm_L_Thumb',
        'Arm_R_Thumb',
        'Thigh_L_ShoeBody',
        'Thigh_L_ShoeQuarter',
        'Thigh_R_ShoeBody',
        'Thigh_R_ShoeQuarter',
      ]),
    );
  });
});
