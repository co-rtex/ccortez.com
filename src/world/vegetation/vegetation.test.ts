import { describe, expect, it } from 'vitest';

import { BOULDER_POINTS, BUSH_POINTS, COASTAL_ROCK_POINTS, TREE_POINTS, getGroveDensity } from '../biome';
import { buildVegetationInstances, getTreeSpecies } from './vegetation';

describe('instanced vegetation', () => {
  const instances = buildVegetationInstances();

  it('is deterministic', () => {
    expect(buildVegetationInstances()).toEqual(instances);
  });

  it('places one trunk per tree and at least one canopy per tree and bush', () => {
    expect(TREE_POINTS).toHaveLength(128);
    expect(instances.trunks).toHaveLength(TREE_POINTS.length);
    expect(instances.puffs.length + instances.cones.length).toBeGreaterThanOrEqual(TREE_POINTS.length + BUSH_POINTS.length);
    expect(instances.rocks).toHaveLength(BOULDER_POINTS.length + COASTAL_ROCK_POINTS.length);
  });

  it('mixes species with broadleaf trees as the majority', () => {
    const counts = TREE_POINTS.reduce<Record<string, number>>((acc, point) => {
      const species = getTreeSpecies(point);
      acc[species] = (acc[species] ?? 0) + 1;
      return acc;
    }, {});
    expect(counts.broadleaf ?? 0).toBeGreaterThan(TREE_POINTS.length * 0.4);
    expect(counts.conifer ?? 0).toBeGreaterThan(0);
    expect((counts.blossom ?? 0) + (counts.amber ?? 0)).toBeGreaterThan(0);
  });

  it('clusters trees where the grove field is dense', () => {
    const meanDensity = TREE_POINTS.reduce((sum, p) => sum + getGroveDensity(p.x, p.z), 0) / TREE_POINTS.length;
    expect(meanDensity).toBeGreaterThan(0.55);
  });

  it('keeps every instance finite', () => {
    for (const list of [instances.trunks, instances.puffs, instances.cones, instances.blooms, instances.rocks]) {
      for (const instance of list) {
        expect([...instance.position, ...instance.scale].every(Number.isFinite)).toBe(true);
      }
    }
  });
});
