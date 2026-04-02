import { clamp } from '../../../src/engine/math';
import type { ExperienceScenePresentationState } from '../../../src/types/experience';

export type RevealStageIndex = 1 | 2 | 3;

export const RECRUITER_SCENE_REVEAL_STAGE_STAGGER_MS = 110;
export const RECRUITER_SCENE_REVEAL_STAGE_DURATION_MS = 320;
export const RECRUITER_SCENE_REVEAL_EXIT_STAGE_STAGGER_MS = 40;
export const RECRUITER_SCENE_REVEAL_EXIT_STAGE_DURATION_MS = 140;
export const RECRUITER_SCENE_REVEAL_TOTAL_ENTER_MS =
  RECRUITER_SCENE_REVEAL_STAGE_DURATION_MS + RECRUITER_SCENE_REVEAL_STAGE_STAGGER_MS * 2;

function easeOutBack(value: number): number {
  const overshoot = 1.70158;
  const adjusted = overshoot + 1;
  const t = value - 1;
  return 1 + adjusted * t * t * t + overshoot * t * t;
}

function easeInCubic(value: number): number {
  return value * value * value;
}

function smoothstep(value: number): number {
  return value * value * (3 - 2 * value);
}

export function getRecruiterRevealStageProgress(
  stage: RevealStageIndex,
  presentationState: ExperienceScenePresentationState,
  elapsedMs: number,
): number {
  if (presentationState === 'visible') {
    return 1;
  }

  if (presentationState === 'entering') {
    const delayMs = (stage - 1) * RECRUITER_SCENE_REVEAL_STAGE_STAGGER_MS;
    const normalized = clamp((elapsedMs - delayMs) / RECRUITER_SCENE_REVEAL_STAGE_DURATION_MS, 0, 1);
    return easeOutBack(normalized);
  }

  const reverseDelayMs = (3 - stage) * RECRUITER_SCENE_REVEAL_EXIT_STAGE_STAGGER_MS;
  const normalized = clamp((elapsedMs - reverseDelayMs) / RECRUITER_SCENE_REVEAL_EXIT_STAGE_DURATION_MS, 0, 1);
  return 1 - easeInCubic(normalized);
}

export function getRecruiterRevealMotionAmount(stageProgress: number): number {
  return smoothstep(clamp((stageProgress - 0.65) / 0.35, 0, 1));
}
