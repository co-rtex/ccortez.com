import { describe, expect, it } from 'vitest';

import {
  RECRUITER_SCENE_REVEAL_STAGE_DURATION_MS,
  RECRUITER_SCENE_REVEAL_STAGE_STAGGER_MS,
  getRecruiterRevealMotionAmount,
  getRecruiterRevealStageProgress,
} from '../../content/experiences/_shared/recruiterBenchReveal';

describe('workbench scene reveal timing', () => {
  it('stages later reveal groups after earlier ones during entry', () => {
    const earlyStageOne = getRecruiterRevealStageProgress(1, 'entering', 120);
    const earlyStageTwo = getRecruiterRevealStageProgress(2, 'entering', 120);
    const earlyStageThree = getRecruiterRevealStageProgress(3, 'entering', 120);

    expect(earlyStageOne).toBeGreaterThan(earlyStageTwo);
    expect(earlyStageTwo).toBeGreaterThanOrEqual(earlyStageThree);

    const settledStageThree = getRecruiterRevealStageProgress(
      3,
      'entering',
      RECRUITER_SCENE_REVEAL_STAGE_DURATION_MS + RECRUITER_SCENE_REVEAL_STAGE_STAGGER_MS * 2,
    );
    expect(settledStageThree).toBeGreaterThan(0.99);
  });

  it('starts the reverse from the late accent stage first on exit', () => {
    const stageOne = getRecruiterRevealStageProgress(1, 'exiting', 40);
    const stageThree = getRecruiterRevealStageProgress(3, 'exiting', 40);

    expect(stageThree).toBeLessThan(stageOne);
  });

  it('keeps idle motion suppressed until a reveal stage is mostly built', () => {
    expect(getRecruiterRevealMotionAmount(0.2)).toBe(0);
    expect(getRecruiterRevealMotionAmount(0.7)).toBeGreaterThan(0);
    expect(getRecruiterRevealMotionAmount(1)).toBe(1);
  });
});
