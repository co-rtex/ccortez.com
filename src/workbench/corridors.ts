import { ROAD_PATH_NETWORK_XZ } from '../world/biome';

import type { WorkbenchCorridorDefinition } from '../types/workbench';

export const WORKBENCH_CORRIDORS: WorkbenchCorridorDefinition[] = [
  {
    id: 'south-spine',
    label: 'South Spine',
    polyline: ROAD_PATH_NETWORK_XZ[0] ?? [],
  },
  {
    id: 'north-rise',
    label: 'North Rise',
    polyline: ROAD_PATH_NETWORK_XZ[1] ?? [],
  },
  {
    id: 'southwest-trail',
    label: 'Southwest Trail',
    polyline: ROAD_PATH_NETWORK_XZ[2] ?? [],
  },
  {
    id: 'southeast-trail',
    label: 'Southeast Trail',
    polyline: ROAD_PATH_NETWORK_XZ[3] ?? [],
  },
  {
    id: 'west-ridge',
    label: 'West Ridge',
    polyline: ROAD_PATH_NETWORK_XZ[4] ?? [],
  },
  {
    id: 'east-promenade',
    label: 'East Promenade',
    polyline: ROAD_PATH_NETWORK_XZ[5] ?? [],
  },
  {
    id: 'southern-link',
    label: 'Southern Link',
    polyline: ROAD_PATH_NETWORK_XZ[6] ?? [],
  },
  {
    id: 'northern-link',
    label: 'Northern Link',
    polyline: ROAD_PATH_NETWORK_XZ[7] ?? [],
  },
];

const corridorMap = new Map(WORKBENCH_CORRIDORS.map((corridor) => [corridor.id, corridor] as const));

export function getWorkbenchCorridorById(id: WorkbenchCorridorDefinition['id']): WorkbenchCorridorDefinition {
  const corridor = corridorMap.get(id);
  if (!corridor) {
    throw new Error(`Unknown workbench corridor "${id}".`);
  }

  return corridor;
}
