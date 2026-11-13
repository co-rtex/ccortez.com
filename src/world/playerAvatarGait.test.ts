import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { AnimationMixer, Vector3 } from 'three';
import type { AnimationClip, Object3D } from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { beforeAll, describe, expect, it } from 'vitest';

import { PLAYER_AVATAR_MODEL_PATH } from './playerAvatarModel';

// The player group sits 0.82 m above the terrain, so the model's ground plane is y = -0.82.
const GROUND_Y = -0.82;
const SOLE_POINTS = [new Vector3(0, -0.075, -0.06), new Vector3(0, -0.075, 0.21)];

interface ClipStats {
  soleMin: number;
  lowestSoleMax: number;
  hipsBounce: number;
  swingClearance: number;
}

let scene: Object3D;
let clips: AnimationClip[];

beforeAll(async () => {
  // GLTFLoader reports progress with a browser-only event.
  (globalThis as { ProgressEvent?: unknown }).ProgressEvent ??= class extends Event {};
  const json = readFileSync(resolve(process.cwd(), 'public', PLAYER_AVATAR_MODEL_PATH.slice(1)), 'utf8');
  const gltf = await new GLTFLoader().parseAsync(json, '');
  scene = gltf.scene;
  clips = gltf.animations;
});

function sample(name: string): ClipStats {
  const clip = clips.find((candidate) => candidate.name === name)!;
  const mixer = new AnimationMixer(scene);
  mixer.clipAction(clip).play();
  const feet = ['Foot_L', 'Foot_R'].map((footName) => scene.getObjectByName(footName)!);
  const hips = scene.getObjectByName('Hips')!;
  const stats = { soleMin: Infinity, lowestSoleMax: -Infinity, hipsBounce: 0, swingClearance: 0 };
  let hipsMin = Infinity;
  let hipsMax = -Infinity;
  for (let i = 0; i <= 200; i += 1) {
    mixer.setTime((i / 200) * clip.duration);
    scene.updateMatrixWorld(true);
    const lows = feet.map((foot) => Math.min(...SOLE_POINTS.map((point) => point.clone().applyMatrix4(foot.matrixWorld).y)));
    const lowest = Math.min(...lows);
    stats.soleMin = Math.min(stats.soleMin, lowest);
    stats.lowestSoleMax = Math.max(stats.lowestSoleMax, lowest);
    stats.swingClearance = Math.max(stats.swingClearance, Math.max(...lows) - GROUND_Y);
    hipsMin = Math.min(hipsMin, hips.position.y);
    hipsMax = Math.max(hipsMax, hips.position.y);
  }
  mixer.stopAllAction();
  stats.hipsBounce = hipsMax - hipsMin;
  return stats;
}

describe('player avatar gait (exported GLTF)', () => {
  it('never pushes a sole into the ground', () => {
    for (const name of ['AvatarIdle', 'AvatarWalk', 'AvatarRun']) {
      expect(sample(name).soleMin, name).toBeGreaterThan(GROUND_Y - 0.006);
    }
  });

  it('keeps a foot planted while standing and walking (no floating)', () => {
    expect(sample('AvatarIdle').lowestSoleMax).toBeLessThan(GROUND_Y + 0.004);
    expect(sample('AvatarWalk').lowestSoleMax).toBeLessThan(GROUND_Y + 0.03);
  });

  it('bounces the body believably and lifts the swing foot clear', () => {
    const walk = sample('AvatarWalk');
    const run = sample('AvatarRun');
    expect(walk.hipsBounce).toBeLessThan(0.07);
    expect(run.hipsBounce).toBeLessThan(0.13);
    expect(walk.swingClearance).toBeGreaterThan(0.04);
    expect(run.swingClearance).toBeGreaterThan(0.1);
  });
});
