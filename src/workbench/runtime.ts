import { SPAWN_HUB_RADIUS, TREE_COLLIDER_RADIUS, WORLD_COLLISION_OBSTACLES } from '../world/biome';
import { SCENIC_REST_SPOTS, getRestSpotSeatAnchor } from '../world/restSpots';
import { isPointWalkable, isPointWaterBlocked } from '../world/terrain';
import { isInsideObstacle } from '../engine/movement';

import { resolveWorkbenchPlacement } from './placement';
import { validateWorkbenchDistricts, validateWorkbenchLayout } from './schema';

import type { ExperienceRecord } from '../types/experience';
import type {
  WorkbenchDefinition,
  WorkbenchDistrictDefinition,
  WorkbenchResolvedPlacement,
  WorkbenchValidationIssue,
} from '../types/workbench';

const WORKBENCH_FOOTPRINT_RADIUS = 1.28;
const STREAMING_PRELOAD_PADDING = 7.5;
const STREAMING_UNLOAD_PADDING = 14;

export interface WorkbenchRuntimeRecord {
  definition: WorkbenchDefinition;
  districtDefinition: WorkbenchDistrictDefinition;
  placement: WorkbenchResolvedPlacement;
  linkedExperience?: ExperienceRecord;
  interactionRadius: number;
  preloadDistance: number;
  unloadDistance: number;
  issues: WorkbenchValidationIssue[];
}

function getSpacingIssueThreshold(
  record: WorkbenchRuntimeRecord,
  other: WorkbenchRuntimeRecord,
): number {
  return Math.max(record.districtDefinition.defaultSpacing, other.districtDefinition.defaultSpacing);
}

function distanceXZ(
  left: WorkbenchRuntimeRecord['placement']['anchor'],
  right: WorkbenchRuntimeRecord['placement']['anchor'],
): number {
  return Math.hypot(left.x - right.x, left.z - right.z);
}

function validateSingleWorkbench(record: WorkbenchRuntimeRecord): WorkbenchValidationIssue[] {
  const issues: WorkbenchValidationIssue[] = [];
  const { anchor } = record.placement;

  if (Math.hypot(anchor.x, anchor.z) < SPAWN_HUB_RADIUS + 1.6) {
    issues.push({
      code: 'inside-crossroads',
      message: 'Bench sits inside the neutral crossroads hub.',
      severity: 'warning',
    });
  }

  if (!isPointWalkable(anchor.x, anchor.z, WORKBENCH_FOOTPRINT_RADIUS)) {
    issues.push({
      code: 'water-overlap',
      message: 'Bench footprint is not on stable walkable terrain.',
      severity: 'error',
    });
  } else if (isPointWaterBlocked(anchor.x, anchor.z, WORKBENCH_FOOTPRINT_RADIUS)) {
    issues.push({
      code: 'water-overlap',
      message: 'Bench footprint overlaps water or shoreline water blockage.',
      severity: 'error',
    });
  }

  if (WORLD_COLLISION_OBSTACLES.some((obstacle) => isInsideObstacle(anchor, obstacle, TREE_COLLIDER_RADIUS + 0.5))) {
    issues.push({
      code: 'obstacle-overlap',
      message: 'Bench overlaps an existing tree or rock collider.',
      severity: 'error',
    });
  }

  for (const spot of SCENIC_REST_SPOTS) {
    const seatAnchor = getRestSpotSeatAnchor(spot);
    const minDistance = spot.benchFootprintRadius + WORKBENCH_FOOTPRINT_RADIUS + 0.55;
    if (distanceXZ(anchor, seatAnchor) < minDistance) {
      issues.push({
        code: 'rest-spot-overlap',
        message: `Bench overlaps scenic rest spot "${spot.label}".`,
        severity: 'error',
      });
      break;
    }
  }

  if (record.definition.contentMode === 'linked' && !record.linkedExperience) {
    issues.push({
      code: 'missing-link',
      message: 'Linked workbench is missing a matching experience record.',
      severity: 'warning',
    });
  }

  if (record.definition.contentMode === 'placeholder' && !record.definition.draftNotes?.trim()) {
    issues.push({
      code: 'missing-draft-notes',
      message: 'Placeholder bench should include draftNotes for planning context.',
      severity: 'warning',
    });
  }

  if (
    record.definition.placement.mode === 'corridor' &&
    !record.districtDefinition.corridors.includes(record.definition.placement.corridorId)
  ) {
    issues.push({
      code: 'missing-district-corridor',
      message: 'Selected corridor is outside the district corridor set.',
      severity: 'warning',
    });
  }

  return issues;
}

export function buildWorkbenchRuntime(
  definitions: WorkbenchDefinition[],
  districtDefinitions: WorkbenchDistrictDefinition[],
  experiences: ExperienceRecord[],
): WorkbenchRuntimeRecord[] {
  const validatedDefinitions = validateWorkbenchLayout(definitions);
  const validatedDistricts = validateWorkbenchDistricts(districtDefinitions);
  const experienceById = new Map(experiences.map((experience) => [experience.manifest.id, experience] as const));
  const districtById = new Map(validatedDistricts.map((district) => [district.id, district] as const));

  const records = validatedDefinitions.map((definition) => {
    const districtDefinition = districtById.get(definition.district);
    if (!districtDefinition) {
      throw new Error(`Unknown district "${definition.district}" in workbench "${definition.id}".`);
    }

    return {
      definition,
      districtDefinition,
      placement: resolveWorkbenchPlacement(definition.placement),
      linkedExperience: definition.experienceId ? experienceById.get(definition.experienceId) : undefined,
      interactionRadius: definition.interactionRadius,
      preloadDistance: definition.interactionRadius + STREAMING_PRELOAD_PADDING,
      unloadDistance: definition.interactionRadius + STREAMING_UNLOAD_PADDING,
      issues: [] as WorkbenchValidationIssue[],
    };
  });

  for (const record of records) {
    record.issues.push(...validateSingleWorkbench(record));
  }

  for (let leftIndex = 0; leftIndex < records.length; leftIndex += 1) {
    const left = records[leftIndex];
    if (!left) {
      continue;
    }

    for (let rightIndex = leftIndex + 1; rightIndex < records.length; rightIndex += 1) {
      const right = records[rightIndex];
      if (!right || left.definition.district !== right.definition.district) {
        continue;
      }

      const spacingThreshold = getSpacingIssueThreshold(left, right);
      const distance = distanceXZ(left.placement.anchor, right.placement.anchor);
      if (distance >= spacingThreshold) {
        continue;
      }

      const message = `Too close to "${right.definition.title}" for district spacing (${distance.toFixed(1)} < ${spacingThreshold.toFixed(1)}).`;
      left.issues.push({
        code: 'district-spacing',
        message,
        severity: 'warning',
      });
      right.issues.push({
        code: 'district-spacing',
        message: `Too close to "${left.definition.title}" for district spacing (${distance.toFixed(1)} < ${spacingThreshold.toFixed(1)}).`,
        severity: 'warning',
      });
    }
  }

  return records;
}

export function serializeWorkbenchLayout(definitions: WorkbenchDefinition[]): string {
  const serialized = JSON.stringify(definitions, null, 2)
    .replace(/"([^"]+)":/g, '$1:')
    .replace(/"/g, "'");

  return `export const WORKBENCH_LAYOUT: WorkbenchDefinition[] = ${serialized};`;
}
