// Prints the generated avatar's bounds, mesh/material/triangle counts and clips: a quick check that a
// regenerated model still stands on the ground (soles at y = -0.82, where the player group sits) and stays cheap.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

// The loader decodes embedded data-URI buffers with fetch and reports progress with a browser-only event.
globalThis.ProgressEvent ??= class ProgressEvent extends Event {
  constructor(type, init = {}) {
    super(type);
    Object.assign(this, init);
  }
};

const path = process.argv[2] ?? join(import.meta.dirname, '..', 'public', 'models', 'player', 'ccortez-avatar.gltf');
new GLTFLoader().parse(
  readFileSync(path, 'utf8'),
  '',
  (gltf) => {
    const scene = gltf.scene;
    scene.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(scene);
    let meshes = 0;
    let triangles = 0;
    const materials = new Set();
    scene.traverse((object) => {
      if (!object.isMesh) return;
      meshes += 1;
      materials.add(object.material.uuid);
      const geometry = object.geometry;
      triangles += (geometry.index ? geometry.index.count : geometry.attributes.position.count) / 3;
    });
    const span = (name) => {
      const object = scene.getObjectByName(name);
      if (!object) return null;
      const b = new THREE.Box3().setFromObject(object);
      return [+b.min.y.toFixed(3), +b.max.y.toFixed(3)];
    };
    console.log(
      JSON.stringify(
        {
          min: box.min.toArray().map((v) => +v.toFixed(3)),
          max: box.max.toArray().map((v) => +v.toFixed(3)),
          meshes,
          materials: materials.size,
          triangles: Math.round(triangles),
          head: span('Head'),
          clips: gltf.animations.map((clip) => `${clip.name} ${clip.duration.toFixed(2)}s`),
        },
        null,
        1,
      ),
    );
  },
  (error) => {
    console.error(error);
    process.exitCode = 1;
  },
);
