import { describe, expect, it } from 'vitest';

import {
  SSEC_FLOOR_LIFT,
  SSEC_PLATFORM_OUTER_SIZE,
  SSEC_PLATFORM_OUTER_Y,
} from '../../content/experiences/ssec-technical-computing/platform';
import { PUBLISHED_WORKBENCH_PLAZA_METRICS, WORKBENCH_LAYOUT } from '../../content/workbenches/layout';
import { BENCH_PLANTER, BENCH_PLINTH, distanceToPathNetwork, getHedgeBushes } from './benchPlinth';
import { START_HERE_WORKBENCH_ID } from './hub';
import { PLAZA_RADII } from './islandPaths';

const ringBenches = WORKBENCH_LAYOUT.flatMap((definition) => {
  const { placement } = definition;
  if (definition.visibility !== 'published' || definition.id === START_HERE_WORKBENCH_ID) return [];
  if (!('x' in placement)) return [];
  return [{ x: placement.x, z: placement.z, rotationY: placement.rotationY }];
});

describe('bench plinth', () => {
  it('puts its deck where scene props were authored to stand', () => {
    expect(BENCH_PLINTH.deckY).toBeCloseTo(0.1);
    expect(BENCH_PLINTH.footY).toBeLessThan(-0.18);
  });

  it('is narrow enough that neighbouring plinths and planters leave the promenade open between them', () => {
    const spacing = (2 * Math.PI * PUBLISHED_WORKBENCH_PLAZA_METRICS.perimeterRadius) / (ringBenches.length + 1);
    expect(2 * BENCH_PLINTH.baseRadius).toBeLessThan(spacing - 1.5);
  });

  it('carries the SSEC slab without overhanging the drum', () => {
    const [width, height, depth] = SSEC_PLATFORM_OUTER_SIZE;
    expect(Math.hypot(width / 2, depth / 2 + 0.1)).toBeLessThan(BENCH_PLINTH.topRadius);
    expect(SSEC_FLOOR_LIFT + SSEC_PLATFORM_OUTER_Y - height / 2).toBeGreaterThanOrEqual(BENCH_PLINTH.deckY - 0.001);
  });
});

describe('bench hedges', () => {
  const bushes = getHedgeBushes(ringBenches);

  it('frames most benches with a full crescent', () => {
    expect(bushes.length).toBeGreaterThan(ringBenches.length * BENCH_PLANTER.bushesPerCrescent * 0.7);
  });

  it('never stands on a path', () => {
    for (const bush of bushes) expect(distanceToPathNetwork(bush.x, bush.z)).toBeGreaterThan(1.9);
  });

  it('stays on the promenade, inside the plaza edge', () => {
    for (const bush of bushes) expect(Math.hypot(bush.x, bush.z) + bush.size).toBeLessThan(PLAZA_RADII.edge);
  });
});
