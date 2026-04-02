import { describe, expect, it } from 'vitest';

import {
  RECRUITER_SCENE_PLATFORM_GLOW_RADIUS,
  RECRUITER_SCENE_PLATFORM_HEIGHT,
  RECRUITER_SCENE_PLATFORM_OUTER_BOTTOM_RADIUS,
  RECRUITER_SCENE_PLATFORM_OUTER_TOP_RADIUS,
  RECRUITER_SCENE_PLATFORM_RING_INNER_RADIUS,
  RECRUITER_SCENE_PLATFORM_RING_OUTER_RADIUS,
} from '../../content/experiences/_shared/recruiterBenchPlatform';
import {
  SSEC_PLATFORM_INNER_SIZE,
  SSEC_PLATFORM_OUTER_SIZE,
} from '../../content/experiences/ssec-technical-computing/platform';

describe('workbench platform dimensions', () => {
  it('keeps the shared recruiter scene shell on the widened platform dimensions', () => {
    expect(RECRUITER_SCENE_PLATFORM_OUTER_TOP_RADIUS).toBe(3.85);
    expect(RECRUITER_SCENE_PLATFORM_OUTER_BOTTOM_RADIUS).toBe(4.22);
    expect(RECRUITER_SCENE_PLATFORM_HEIGHT).toBe(0.12);
    expect(RECRUITER_SCENE_PLATFORM_RING_INNER_RADIUS).toBe(3.36);
    expect(RECRUITER_SCENE_PLATFORM_RING_OUTER_RADIUS).toBe(3.68);
    expect(RECRUITER_SCENE_PLATFORM_GLOW_RADIUS).toBe(3.56);
  });

  it('keeps the SSEC custom floor on the widened platform footprint', () => {
    expect(SSEC_PLATFORM_OUTER_SIZE).toEqual([6.4, 0.08, 5.4]);
    expect(SSEC_PLATFORM_INNER_SIZE).toEqual([5.76, 0.02, 4.82]);
  });
});
