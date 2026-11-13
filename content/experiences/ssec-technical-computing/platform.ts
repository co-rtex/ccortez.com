/**
 * SSEC's floor is an inset slab resting on the shared bench plinth (see src/world/benchPlinth.ts): its corners
 * stay inside the plinth's top radius, so nothing overhangs the drum.
 */
export const SSEC_PLATFORM_OUTER_SIZE = [4.9, 0.05, 4.0] as const;
export const SSEC_PLATFORM_INNER_SIZE = [4.5, 0.02, 3.6] as const;
/** Centre heights above the anchor: the slab sits just above the plinth deck (0.10). */
export const SSEC_PLATFORM_OUTER_Y = 0.105;
export const SSEC_PLATFORM_INNER_Y = 0.135;
/** The floor group's resting lift above the anchor (it eases up into place as the scene reveals). */
export const SSEC_FLOOR_LIFT = 0.02;
