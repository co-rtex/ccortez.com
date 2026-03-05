import { describe, expect, it } from 'vitest';

import { getNearestRestSpotInRange } from './restSpot';

describe('rest spot interaction', () => {
  const spots = [
    {
      id: 'north-bench',
      label: 'North Bench',
      lakeId: 'north',
      interactionRadius: 2.6,
      benchFootprintRadius: 0.72,
      seat: { x: 10, z: 8, yOffset: 0.46, rotationY: 0 },
      exit: { x: 8, z: 7 },
      scenicCamera: {
        lookDistance: 18,
        eyeHeight: 0.72,
        blendSpeed: 4.5,
      },
    },
    {
      id: 'south-bench',
      label: 'South Bench',
      lakeId: 'south',
      interactionRadius: 2.2,
      benchFootprintRadius: 0.72,
      seat: { x: -6, z: -9, yOffset: 0.46, rotationY: 0 },
      exit: { x: -8, z: -10 },
      scenicCamera: {
        lookDistance: 18,
        eyeHeight: 0.72,
        blendSpeed: 4.5,
      },
    },
  ];

  it('returns nearest rest spot when inside interaction range', () => {
    const nearest = getNearestRestSpotInRange(spots, { x: 9.2, y: 0, z: 8.1 });
    expect(nearest?.id).toBe('north-bench');
  });

  it('returns null when player is outside all interaction ranges', () => {
    const nearest = getNearestRestSpotInRange(spots, { x: 30, y: 0, z: 30 });
    expect(nearest).toBeNull();
  });
});
