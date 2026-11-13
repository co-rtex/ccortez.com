import { WORLD_WATER_BODIES } from '../constants';
import { SCENIC_REST_SPOTS } from '../restSpots';
import { SCENIC_RIGHT_XZ } from '../scenic';
import { getLakeDistance, getWaterSurfaceHeight } from '../terrain';

export interface LakeDock {
  lakeId: string;
  /** Point on land where the dock starts. */
  start: { x: number; z: number };
  /** Unit direction the dock runs, out over the water toward the lake centre. */
  direction: { x: number; z: number };
  length: number;
  deckY: number;
}

const SIDE_OFFSET = 2.7;
const OVER_WATER = 4.6;
const ON_LAND = 0.6;

/**
 * A short wooden dock beside each lake's scenic bench, jutting toward the lake centre. Decorative: the water
 * already blocks walking.
 */
export const LAKE_DOCKS: LakeDock[] = SCENIC_REST_SPOTS.flatMap((spot) => {
  const lake = WORLD_WATER_BODIES.find((body) => body.id === spot.lakeId);
  if (!lake) return [];
  const baseX = spot.seat.x + SCENIC_RIGHT_XZ.x * SIDE_OFFSET;
  const baseZ = spot.seat.z + SCENIC_RIGHT_XZ.z * SIDE_OFFSET;
  // Run from beside the bench straight toward the lake centre, so the dock always juts out over the water.
  const toCenterX = lake.centerX - baseX;
  const toCenterZ = lake.centerZ - baseZ;
  const length = Math.hypot(toCenterX, toCenterZ) || 1;
  const direction = { x: toCenterX / length, z: toCenterZ / length };
  for (let step = 0; step < 200; step += 1) {
    const x = baseX + direction.x * step * 0.1;
    const z = baseZ + direction.z * step * 0.1;
    if (getLakeDistance(lake, x, z) <= 1) {
      return [
        {
          lakeId: lake.id,
          start: { x: x - direction.x * ON_LAND, z: z - direction.z * ON_LAND },
          direction,
          length: ON_LAND + OVER_WATER,
          deckY: getWaterSurfaceHeight(lake) + 0.32,
        },
      ];
    }
  }
  return [];
});
