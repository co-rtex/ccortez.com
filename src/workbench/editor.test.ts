import { describe, expect, it } from 'vitest';

import { WORKBENCH_DISTRICTS } from '../../content/workbenches/layout';

import {
  convertWorkbenchToFreeformAtCurrentPose,
  isWorkbenchEditorTypingTarget,
  createDraftWorkbenchDefinition,
  MAX_WORKBENCH_Y_OFFSET,
  MIN_WORKBENCH_Y_OFFSET,
  resetWorkbenchPlacementToDistrictSeed,
  snapWorkbenchToDistrictCorridor,
  updateWorkbenchHeightOffset,
  updateWorkbenchPlacementFromGroundPoint,
  updateWorkbenchRotationFromResolvedYaw,
} from './editor';
import { resolveWorkbenchPlacement } from './placement';

describe('workbench editor helpers', () => {
  it('creates new draft benches as scene-owned freeform seeds', () => {
    const bench = createDraftWorkbenchDefinition(new Set(), 'work-experience');

    expect(bench.presentationMode).toBe('scene-owned');
    expect(bench.placement.mode).toBe('freeform');
    if (bench.placement.mode !== 'freeform') {
      throw new Error('expected freeform placement');
    }
    expect(bench.placement.x).toBeCloseTo(6.899, 3);
    expect(bench.placement.z).toBeCloseTo(-22.488, 3);
  });

  it('snaps a freeform bench back onto a district corridor', () => {
    const bench = createDraftWorkbenchDefinition(new Set(), 'projects');
    const moved = updateWorkbenchPlacementFromGroundPoint(bench, 19.4, 8.4);
    const snapped = snapWorkbenchToDistrictCorridor(moved);

    expect(snapped.placement.mode).toBe('corridor');
    if (snapped.placement.mode !== 'corridor') {
      throw new Error('expected corridor placement');
    }
    expect(
      WORKBENCH_DISTRICTS.find((district) => district.id === snapped.district)?.corridors,
    ).toContain(snapped.placement.corridorId);
  });

  it('preserves the resolved pose when converting a corridor bench to freeform', () => {
    const bench = snapWorkbenchToDistrictCorridor(
      updateWorkbenchRotationFromResolvedYaw(
        updateWorkbenchPlacementFromGroundPoint(createDraftWorkbenchDefinition(new Set(), 'projects'), 18.6, 9.1),
        1.14,
      ),
    );
    const before = resolveWorkbenchPlacement(bench.placement);
    const converted = convertWorkbenchToFreeformAtCurrentPose(bench);
    const after = resolveWorkbenchPlacement(converted.placement);

    expect(converted.placement.mode).toBe('freeform');
    expect(after.anchor.x).toBeCloseTo(before.anchor.x, 5);
    expect(after.anchor.y).toBeCloseTo(before.anchor.y, 5);
    expect(after.anchor.z).toBeCloseTo(before.anchor.z, 5);
    expect(after.rotationY).toBeCloseTo(before.rotationY, 5);
  });

  it('preserves visible yaw when snapping back to a district corridor', () => {
    const bench = updateWorkbenchRotationFromResolvedYaw(
      updateWorkbenchPlacementFromGroundPoint(createDraftWorkbenchDefinition(new Set(), 'extracurriculars'), -9.8, 14.2),
      -1.32,
    );
    const before = resolveWorkbenchPlacement(bench.placement);
    const snapped = snapWorkbenchToDistrictCorridor(bench);
    const after = resolveWorkbenchPlacement(snapped.placement);

    expect(snapped.placement.mode).toBe('corridor');
    expect(after.rotationY).toBeCloseTo(before.rotationY, 5);
  });

  it('updates move, rotate, and height values deterministically', () => {
    const bench = createDraftWorkbenchDefinition(new Set(), 'clubs');
    const moved = updateWorkbenchPlacementFromGroundPoint(bench, -14.6, 7.8);
    const rotated = updateWorkbenchRotationFromResolvedYaw(moved, 0.85);
    const raised = updateWorkbenchHeightOffset(rotated, 0.72);
    const reset = resetWorkbenchPlacementToDistrictSeed(raised);

    expect(raised.placement.mode).toBe('freeform');
    if (raised.placement.mode !== 'freeform') {
      throw new Error('expected freeform placement');
    }
    expect(raised.placement.rotationY).toBeCloseTo(0.85, 5);
    expect(raised.placement.yOffset).toBeCloseTo(0.72, 5);
    expect(reset.placement.mode).toBe('freeform');
    if (reset.placement.mode !== 'freeform') {
      throw new Error('expected freeform placement');
    }
    expect(reset.placement.x).toBeCloseTo(-15.782, 3);
  });

  it('normalizes yaw and clamps height offsets', () => {
    const bench = createDraftWorkbenchDefinition(new Set(), 'clubs');
    const rotated = updateWorkbenchRotationFromResolvedYaw(bench, Math.PI * 5.5);
    const raised = updateWorkbenchHeightOffset(rotated, MAX_WORKBENCH_Y_OFFSET + 8);
    const lowered = updateWorkbenchHeightOffset(raised, MIN_WORKBENCH_Y_OFFSET - 8);

    if (rotated.placement.mode !== 'freeform') {
      throw new Error('expected freeform placement');
    }

    expect(rotated.placement.rotationY).toBeGreaterThanOrEqual(-Math.PI);
    expect(rotated.placement.rotationY).toBeLessThanOrEqual(Math.PI);
    expect(raised.placement.yOffset).toBe(MAX_WORKBENCH_Y_OFFSET);
    expect(lowered.placement.yOffset).toBe(MIN_WORKBENCH_Y_OFFSET);
  });

  it('detects typing targets for editor shortcut suppression', () => {
    expect(isWorkbenchEditorTypingTarget({ tagName: 'INPUT' } as unknown as EventTarget)).toBe(true);
    expect(isWorkbenchEditorTypingTarget({ tagName: 'TEXTAREA' } as unknown as EventTarget)).toBe(true);
    expect(isWorkbenchEditorTypingTarget({ tagName: 'SELECT' } as unknown as EventTarget)).toBe(true);
    expect(isWorkbenchEditorTypingTarget({ isContentEditable: true } as unknown as EventTarget)).toBe(true);
    expect(isWorkbenchEditorTypingTarget({ tagName: 'DIV' } as unknown as EventTarget)).toBe(false);
    expect(isWorkbenchEditorTypingTarget(null)).toBe(false);
  });
});
