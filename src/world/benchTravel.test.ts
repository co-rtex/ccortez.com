import { Object3D, Vector3 } from 'three';
import { describe, expect, it } from 'vitest';

import { getBenchStandPoint, shouldTravelToBench } from './benchTravel';
import { getWorkbenchFacingCenterRotationY } from './hub';

describe('fast travel stand point', () => {
  it('matches an Object3D rotated by the bench yaw', () => {
    const anchor = { x: -4.28, z: 25.651 };
    const rotationY = getWorkbenchFacingCenterRotationY(anchor.x, anchor.z);
    const bench = new Object3D();
    bench.position.set(anchor.x, 0, anchor.z);
    bench.rotation.y = rotationY;
    bench.updateMatrixWorld(true);
    const expected = bench.localToWorld(new Vector3(0, 0, 4.2));
    const stand = getBenchStandPoint(anchor, rotationY);
    expect(stand.x).toBeCloseTo(expected.x, 6);
    expect(stand.z).toBeCloseTo(expected.z, 6);
  });

  it('stands a ring bench visitor on the plaza side, facing the bench', () => {
    const anchor = { x: -4.28, z: 25.651 };
    const stand = getBenchStandPoint(anchor, getWorkbenchFacingCenterRotationY(anchor.x, anchor.z));
    // Inside the ring (closer to the plaza centre) and just past the 3.05 m plinth.
    expect(Math.hypot(stand.x, stand.z)).toBeLessThan(Math.hypot(anchor.x, anchor.z) - 3);
    const distance = Math.hypot(stand.x - anchor.x, stand.z - anchor.z);
    expect(distance).toBeGreaterThan(3.5);
    // Walking along the facing yaw for that distance reaches the bench.
    expect(stand.x + Math.sin(stand.facingYaw) * distance).toBeCloseTo(anchor.x, 6);
    expect(stand.z + Math.cos(stand.facingYaw) * distance).toBeCloseTo(anchor.z, 6);
  });

  it('stays inside a small interaction radius but clear of the plinth', () => {
    const anchor = { x: 0, z: 0 };
    const near = getBenchStandPoint(anchor, 0, 4.3);
    expect(Math.hypot(near.x, near.z)).toBeLessThanOrEqual(4.3 - 0.35);
    const tight = getBenchStandPoint(anchor, 0, 3.2);
    expect(Math.hypot(tight.x, tight.z)).toBeGreaterThanOrEqual(3.6);
  });

  it('does not move a visitor who is already at the bench', () => {
    expect(shouldTravelToBench({ x: 0, z: 21 }, { x: -4.28, z: 25.651 })).toBe(false);
    expect(shouldTravelToBench({ x: 0, z: 0 }, { x: -4.28, z: 25.651 })).toBe(true);
  });
});

describe('fast travel to every published bench', () => {
  it('lands on walkable ground inside the bench interaction radius', async () => {
    const { WORKBENCH_LAYOUT } = await import('../../content/workbenches/layout');
    const { isPointWalkable } = await import('./terrain');
    const published = WORKBENCH_LAYOUT.filter((definition) => definition.visibility === 'published');
    expect(published.length).toBeGreaterThan(10);
    for (const definition of published) {
      if (definition.placement.mode !== 'freeform') continue;
      const anchor = { x: definition.placement.x, z: definition.placement.z };
      const stand = getBenchStandPoint(anchor, definition.placement.rotationY, definition.interactionRadius);
      expect(isPointWalkable(stand.x, stand.z, 0.42), definition.id).toBe(true);
      expect(Math.hypot(stand.x - anchor.x, stand.z - anchor.z), definition.id).toBeLessThanOrEqual(
        definition.interactionRadius,
      );
    }
  });
});
