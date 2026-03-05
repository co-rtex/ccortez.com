import { describe, expect, it } from 'vitest';

import { WORLD_WATER_BODIES } from './constants';
import {
  OCEAN_LEVEL,
  findNearestWalkablePoint,
  getLakeBoundaryPoint,
  getLakeBoundaryPolyline,
  getLakeDistance,
  getNearestLakeShoreSignedDistance,
  getTerrainHeight,
  getWalkabilityBlockReason,
  getWaterSurfaceHeight,
  isPointWaterBlocked,
  isPointWalkable,
} from './terrain';

describe('terrain water carving', () => {
  it('keeps water surface above the carved basin center', () => {
    for (const waterBody of WORLD_WATER_BODIES) {
      const waterY = getWaterSurfaceHeight(waterBody);
      const terrainY = getTerrainHeight(waterBody.centerX, waterBody.centerZ);

      expect(waterY).toBeGreaterThan(terrainY + 0.1);
    }
  });

  it('keeps shoreline near water elevation without rectangular cliffs', () => {
    for (const waterBody of WORLD_WATER_BODIES) {
      const angle = 0;
      const cos = Math.cos(waterBody.rotation + angle);
      const sin = Math.sin(waterBody.rotation + angle);

      let low = 0.4;
      let high = 1.8;
      for (let iteration = 0; iteration < 20; iteration += 1) {
        const mid = (low + high) * 0.5;
        const sampleX = waterBody.centerX + cos * waterBody.radiusX * mid;
        const sampleZ = waterBody.centerZ + sin * waterBody.radiusZ * mid;
        const distance = getLakeDistance(waterBody, sampleX, sampleZ);

        if (distance < 1) {
          low = mid;
        } else {
          high = mid;
        }
      }

      const edgeScale = (low + high) * 0.5;
      const nearInsideX = waterBody.centerX + cos * waterBody.radiusX * edgeScale * 0.999;
      const nearInsideZ = waterBody.centerZ + sin * waterBody.radiusZ * edgeScale * 0.999;
      const nearOutsideX = waterBody.centerX + cos * waterBody.radiusX * edgeScale * 1.001;
      const nearOutsideZ = waterBody.centerZ + sin * waterBody.radiusZ * edgeScale * 1.001;

      const insideY = getTerrainHeight(nearInsideX, nearInsideZ);
      const outsideY = getTerrainHeight(nearOutsideX, nearOutsideZ);

      expect(outsideY).toBeGreaterThan(OCEAN_LEVEL - 0.55);
      expect(Math.abs(outsideY - insideY)).toBeLessThan(0.9);
    }
  });

  it('uses organic lake boundaries (distance differs by direction)', () => {
    for (const waterBody of WORLD_WATER_BODIES) {
      const east = getLakeDistance(
        waterBody,
        waterBody.centerX + waterBody.radiusX,
        waterBody.centerZ,
      );
      const north = getLakeDistance(
        waterBody,
        waterBody.centerX,
        waterBody.centerZ + waterBody.radiusZ,
      );

      expect(Math.abs(east - north)).toBeGreaterThan(0.01);
    }
  });

  it('ensures lakes do not overlap', () => {
    for (let leftIndex = 0; leftIndex < WORLD_WATER_BODIES.length; leftIndex += 1) {
      const left = WORLD_WATER_BODIES[leftIndex];
      if (!left) {
        continue;
      }

      for (let rightIndex = leftIndex + 1; rightIndex < WORLD_WATER_BODIES.length; rightIndex += 1) {
        const right = WORLD_WATER_BODIES[rightIndex];
        if (!right) {
          continue;
        }

        let hasOverlap = false;
        const samples = 48;

        for (let sample = 0; sample < samples; sample += 1) {
          const angle = (sample / samples) * Math.PI * 2;
          const leftBoundary = getLakeBoundaryPoint(left, angle);
          const rightBoundary = getLakeBoundaryPoint(right, angle);

          if (getLakeDistance(right, leftBoundary.x, leftBoundary.z) < 0.985) {
            hasOverlap = true;
            break;
          }

          if (getLakeDistance(left, rightBoundary.x, rightBoundary.z) < 0.985) {
            hasOverlap = true;
            break;
          }
        }

        expect(hasOverlap).toBe(false);
      }
    }
  });

  it('blocks walking at lake centers and coastline water zone', () => {
    for (const waterBody of WORLD_WATER_BODIES) {
      expect(isPointWalkable(waterBody.centerX, waterBody.centerZ, 0.72)).toBe(false);
    }

    expect(isPointWalkable(65, 0, 0.72)).toBe(false);
  });

  it('finds a safe recovery point when starting inside a lake', () => {
    for (const waterBody of WORLD_WATER_BODIES) {
      const recovery = findNearestWalkablePoint(waterBody.centerX, waterBody.centerZ, 0.72);
      expect(recovery).not.toBeNull();
      if (!recovery) {
        continue;
      }

      expect(isPointWalkable(recovery.x, recovery.z, 0.72)).toBe(true);
      expect(isPointWaterBlocked(recovery.x, recovery.z, 0.72)).toBe(false);
      expect(getNearestLakeShoreSignedDistance(recovery.x, recovery.z)).toBeGreaterThan(0);
    }
  });

  it('allows approaching curved shorelines closely without invisible wide blocking', () => {
    const playerRadius = 0.42;

    for (const waterBody of WORLD_WATER_BODIES) {
      const angle = 0.83;
      const boundary = getLakeBoundaryPoint(waterBody, angle);
      const dx = boundary.x - waterBody.centerX;
      const dz = boundary.z - waterBody.centerZ;
      const length = Math.hypot(dx, dz) || 1;
      const outwardX = dx / length;
      const outwardZ = dz / length;

      let firstWalkableDistance = Number.POSITIVE_INFINITY;
      for (let distance = 0.06; distance <= 0.85; distance += 0.02) {
        const sampleX = boundary.x + outwardX * distance;
        const sampleZ = boundary.z + outwardZ * distance;
        if (isPointWalkable(sampleX, sampleZ, playerRadius)) {
          firstWalkableDistance = distance;
          break;
        }
      }

      expect(
        firstWalkableDistance,
        `Expected a near-shore walkable point for ${waterBody.id}`,
      ).toBeLessThanOrEqual(0.56);
    }
  });

  it('blocks entering water near shoreline with player footprint', () => {
    const playerRadius = 0.42;

    for (const waterBody of WORLD_WATER_BODIES) {
      const angle = 1.67;
      const boundary = getLakeBoundaryPoint(waterBody, angle);
      const dx = boundary.x - waterBody.centerX;
      const dz = boundary.z - waterBody.centerZ;
      const length = Math.hypot(dx, dz) || 1;
      const outwardX = dx / length;
      const outwardZ = dz / length;

      const enteringX = boundary.x + outwardX * 0.16;
      const enteringZ = boundary.z + outwardZ * 0.16;

      expect(
        isPointWalkable(enteringX, enteringZ, playerRadius),
        `Expected blocked near shoreline entry for ${waterBody.id} at x=${enteringX.toFixed(2)} z=${enteringZ.toFixed(2)}`,
      ).toBe(false);
    }
  });

  it('keeps authoritative shoreline boundary aligned with shore signed distance', () => {
    for (const waterBody of WORLD_WATER_BODIES) {
      const boundary = getLakeBoundaryPolyline(waterBody, 48);
      for (const point of boundary) {
        const signedDistance = getNearestLakeShoreSignedDistance(point.x, point.z);
        expect(
          Math.abs(signedDistance),
          `Expected boundary alignment near 0 for ${waterBody.id} at x=${point.x.toFixed(2)} z=${point.z.toFixed(2)}`,
        ).toBeLessThanOrEqual(0.22);
      }
    }
  });

  it('keeps interior lake samples below visible water surface', () => {
    for (const waterBody of WORLD_WATER_BODIES) {
      const waterY = getWaterSurfaceHeight(waterBody);
      const interiorSamples = getLakeBoundaryPolyline(waterBody, 36, 0.72);

      for (const sample of interiorSamples) {
        const terrainY = getTerrainHeight(sample.x, sample.z);
        expect(
          terrainY,
          `Expected interior terrain below water for ${waterBody.id} at x=${sample.x.toFixed(2)} z=${sample.z.toFixed(2)}`,
        ).toBeLessThan(waterY - 0.03);
      }
    }
  });

  it('classifies walkability blocks for feedback routing', () => {
    const sampleLake = WORLD_WATER_BODIES[0];
    if (!sampleLake) {
      return;
    }

    expect(getWalkabilityBlockReason(sampleLake.centerX, sampleLake.centerZ, 0.42)).toBe('water');
    expect(getWalkabilityBlockReason(0, 0, 0.42)).toBe('none');
  });
});
