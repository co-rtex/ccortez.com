const FULL_TURN = Math.PI * 2;
const ROUNDING_PRECISION = 1000;

function roundCoordinate(value: number): number {
  return Math.round(value * ROUNDING_PRECISION) / ROUNDING_PRECISION;
}

export function getWorkbenchFacingCenterRotationY(x: number, z: number): number {
  return roundCoordinate(Math.atan2(-x, -z));
}

export const START_HERE_WORKBENCH_ID = 'about-me-overview';
// The paved court around the fountain; Start Here sits on it, clear of the fountain basin.
export const CENTRAL_PLAZA_CENTER_PAD_RADIUS = 9.4;
export const CENTRAL_PLAZA_FOUNTAIN_RADIUS = 2.35;
// On the south side of the fountain, between it and the spawn point, so it is the first thing in view on
// arrival (north of the fountain, the basin and armillary hid it from the follow camera).
export const START_HERE_ANCHOR = {
  x: 0,
  z: 5.7,
} as const;
export const START_HERE_PLACEMENT_TOLERANCE = 0.28;
// Faces south, toward the arriving visitor, rather than toward the fountain behind it.
export const START_HERE_ROTATION_Y = 0;

export const SPAWN_HUB_RADIUS = CENTRAL_PLAZA_CENTER_PAD_RADIUS;
export const CENTRAL_PLAZA_ENTRY_GAP_SLOTS = 1;
export const CENTRAL_PLAZA_SLOT_ARC_SPACING = 8.6;
export const CENTRAL_PLAZA_MIN_PERIMETER_RADIUS = 17.6;
export const CENTRAL_PLAZA_OUTER_MARGIN = 5.4;
export const CENTRAL_PLAZA_HEIGHT_OFFSET = 0.72;
export const CENTRAL_PLAZA_EDGE_BLEND = 2.8;
export const CENTRAL_PLAZA_FOUNDATION_DEPTH = 0.76;

export function getCentralPlazaPerimeterRadius(perimeterWorkbenchCount: number): number {
  const slotCount = Math.max(perimeterWorkbenchCount + CENTRAL_PLAZA_ENTRY_GAP_SLOTS, 4);
  const derivedRadius = (slotCount * CENTRAL_PLAZA_SLOT_ARC_SPACING) / FULL_TURN;
  return roundCoordinate(Math.max(CENTRAL_PLAZA_MIN_PERIMETER_RADIUS, derivedRadius));
}

export function getCentralPlazaRadius(perimeterWorkbenchCount: number): number {
  return roundCoordinate(
    getCentralPlazaPerimeterRadius(perimeterWorkbenchCount) + CENTRAL_PLAZA_OUTER_MARGIN,
  );
}
