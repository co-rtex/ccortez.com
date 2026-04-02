import { describe, expect, it } from 'vitest';

import {
  PLAYER_AVATAR_APPEARANCE,
  PLAYER_AVATAR_HEAD_TOP_Y,
  PLAYER_CAMERA_LOOK_HEIGHT,
  advanceGaitPhase,
  createInitialPlayerLocomotionState,
  normalizeAngle,
  resolveCameraAwareMovementInput,
  resolvePlayerLocomotionMode,
  shouldRenderPlayerAvatar,
  stepPlayerLocomotionState,
  stepYawTowards,
} from './playerAvatar';

import { DEFAULT_MOVEMENT_SPEED_CONFIG } from '../engine/playerSpeed';

describe('player avatar helpers', () => {
  it('selects idle, walk, and run modes from planar speed', () => {
    expect(resolvePlayerLocomotionMode(0.05)).toBe('idle');
    expect(resolvePlayerLocomotionMode(DEFAULT_MOVEMENT_SPEED_CONFIG.walk * 0.72)).toBe('walk');
    expect(resolvePlayerLocomotionMode(DEFAULT_MOVEMENT_SPEED_CONFIG.run * 0.96)).toBe('run');
  });

  it('advances gait phase only while moving', () => {
    const walkPhase = advanceGaitPhase(0, 0.16, 'walk', 0.6, false);
    const runPhase = advanceGaitPhase(0, 0.16, 'run', 1, false);
    const idlePhase = advanceGaitPhase(0.4, 0.16, 'idle', 0, false);
    const frozenPhase = advanceGaitPhase(0.7, 0.16, 'walk', 0.8, true);

    expect(walkPhase).not.toBe(0);
    expect(Math.abs(runPhase)).toBeGreaterThan(Math.abs(walkPhase));
    expect(idlePhase).toBe(0.4);
    expect(frozenPhase).toBe(0.7);
  });

  it('smoothly turns facing yaw toward the movement heading without wrapping the long way around', () => {
    const nextYaw = stepYawTowards(3.05, -3.05, 0.1);
    expect(Math.abs(normalizeAngle(nextYaw - 3.05))).toBeLessThan(0.2);
  });

  it('steps locomotion state using planar movement and preserves facing when frozen', () => {
    const initial = createInitialPlayerLocomotionState();
    const moving = stepPlayerLocomotionState(initial, { x: 0.5, z: 0 }, 0.1, false);
    const frozen = stepPlayerLocomotionState(moving, { x: 0, z: 0 }, 0.1, true);

    expect(moving.mode).toBe('walk');
    expect(moving.isMoving).toBe(true);
    expect(moving.facingYaw).not.toBe(initial.facingYaw);
    expect(frozen.mode).toBe('idle');
    expect(frozen.facingYaw).toBe(moving.facingYaw);
  });

  it('keeps the appearance palette and camera look height aligned with the avatar proportions', () => {
    expect(PLAYER_AVATAR_APPEARANCE.skinTone).toBe('#d3a27f');
    expect(PLAYER_AVATAR_APPEARANCE.hairColor).toBe('#4a3528');
    expect(PLAYER_AVATAR_APPEARANCE.hairHighlightColor).toBe('#6b4d3b');
    expect(PLAYER_AVATAR_APPEARANCE.eyeWhiteColor).toBe('#f8f2ea');
    expect(PLAYER_AVATAR_APPEARANCE.irisColor).toBe('#6a4734');
    expect(PLAYER_AVATAR_APPEARANCE.eyeColor).toBe('#261a15');
    expect(PLAYER_AVATAR_APPEARANCE.shirtColor).toBe('#20324f');
    expect(PLAYER_AVATAR_APPEARANCE.undershirtColor).toBe('#6d737b');
    expect(PLAYER_AVATAR_APPEARANCE.jeansColor).toBe('#6488be');
    expect(PLAYER_AVATAR_APPEARANCE.shoeColor).toBe('#92979f');
    expect(PLAYER_AVATAR_APPEARANCE.headRadius).toBeGreaterThan(0.28);
    expect(PLAYER_AVATAR_APPEARANCE.headRadius).toBeLessThan(0.32);
    expect(PLAYER_AVATAR_APPEARANCE.eyebrowY).toBeGreaterThan(PLAYER_AVATAR_APPEARANCE.eyeY + 0.05);
    expect(PLAYER_AVATAR_APPEARANCE.bangY).toBeGreaterThan(PLAYER_AVATAR_APPEARANCE.eyeY + 0.04);
    expect(PLAYER_CAMERA_LOOK_HEIGHT).toBeGreaterThan(PLAYER_AVATAR_APPEARANCE.eyeY);
    expect(PLAYER_CAMERA_LOOK_HEIGHT).toBeLessThan(PLAYER_AVATAR_HEAD_TOP_Y + 0.02);
  });

  it('keeps inspect movement locked and hides the avatar while seated', () => {
    expect(resolveCameraAwareMovementInput({ x: 1, z: -1 }, 'workbench-inspect')).toEqual({ x: 0, z: 0 });
    expect(resolveCameraAwareMovementInput({ x: 1, z: -1 }, 'follow')).toEqual({ x: 1, z: -1 });
    expect(shouldRenderPlayerAvatar('exploring')).toBe(true);
    expect(shouldRenderPlayerAvatar('seated')).toBe(false);
  });
});
