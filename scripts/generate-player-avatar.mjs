import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import * as THREE from 'three';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const outputPath = join(__dirname, '..', 'public', 'models', 'player', 'ccortez-avatar.gltf');

class NodeFileReader {
  constructor() {
    this.result = null;
    this.onloadend = null;
  }

  async readAsArrayBuffer(blob) {
    this.result = await blob.arrayBuffer();
    this.onloadend?.();
  }

  async readAsDataURL(blob) {
    const buffer = Buffer.from(await blob.arrayBuffer());
    const type = blob.type || 'application/octet-stream';
    this.result = `data:${type};base64,${buffer.toString('base64')}`;
    this.onloadend?.();
  }
}

globalThis.FileReader = NodeFileReader;

const MATERIALS = {
  skin: flatMaterial('#d4a27f'),
  skinWarm: flatMaterial('#e1b79a'),
  cheek: flatMaterial('#db9a89'),
  hair: flatMaterial('#24130f'),
  hairHighlight: flatMaterial('#5e3d31'),
  brow: flatMaterial('#3a241c'),
  eyeWhite: flatMaterial('#f8f3ee'),
  iris: flatMaterial('#5c4c45'),
  pupil: flatMaterial('#191210'),
  shirtMain: flatMaterial('#5f88bc'),
  shirtTrim: flatMaterial('#769dca'),
  jeansMain: flatMaterial('#aec8e6'),
  jeansTrim: flatMaterial('#7da6d1'),
  shoeMain: flatMaterial('#f4f2ee'),
  shoeAccent: flatMaterial('#d8dde3'),
  shoeSole: flatMaterial('#a8b2bf'),
};

const scene = new THREE.Group();
scene.name = 'CcortezAvatarRoot';

const hips = addJoint(scene, 'Hips', [0, 0, 0]);
addMesh(hips, 'Pelvis', new THREE.BoxGeometry(0.27, 0.12, 0.15), MATERIALS.jeansMain, [0, -0.015, 0.02], [0, 0, 0], [1, 1, 1]);
addMesh(hips, 'JeanWaist', new THREE.CapsuleGeometry(0.138, 0.05, 5, 8), MATERIALS.jeansMain, [0, 0.028, 0.022], [0.02, 0, 0], [1.18, 0.74, 0.8]);

const torso = addJoint(hips, 'Torso', [0, 0.205, 0.02]);
addMesh(torso, 'ShirtBody', new THREE.CapsuleGeometry(0.224, 0.11, 6, 8), MATERIALS.shirtMain, [0, 0.12, 0.018], [0.02, 0, 0], [1.04, 1.0, 0.92]);
addMesh(torso, 'ShirtFront', new THREE.SphereGeometry(0.176, 10, 8), MATERIALS.shirtMain, [0, 0.1, 0.078], [0, 0, 0], [1.0, 0.68, 0.56]);
addMesh(torso, 'ShirtHem', new THREE.BoxGeometry(0.37, 0.028, 0.15), MATERIALS.shirtTrim, [0, 0.024, 0.03], [0.02, 0, 0], [1, 1, 1]);
addMesh(torso, 'ShirtWaistOverlap', new THREE.SphereGeometry(0.15, 10, 8), MATERIALS.shirtMain, [0, 0.038, 0.03], [0.02, 0, 0], [1.12, 0.42, 0.82]);
addMesh(torso, 'ShirtCollar', new THREE.TorusGeometry(0.082, 0.011, 6, 16, Math.PI * 2), MATERIALS.shirtTrim, [0, 0.282, 0.038], [Math.PI / 2, 0, 0], [1.0, 0.8, 0.68]);
const neck = addMesh(torso, 'Neck', new THREE.CylinderGeometry(0.08, 0.086, 0.09, 8), MATERIALS.skin, [0, 0.35, 0.02]);
neck.scale.set(0.92, 1, 0.92);

const head = addJoint(torso, 'Head', [0, 0.48, 0.03]);
addMesh(head, 'HeadShape', new THREE.SphereGeometry(0.246, 16, 14), MATERIALS.skin, [0, 0.018, 0.012], [0, 0, 0], [1.0, 0.99, 0.92]);
addMesh(head, 'UpperSkull', new THREE.SphereGeometry(0.198, 14, 12), MATERIALS.skin, [0, 0.1, -0.01], [0.02, 0, 0], [1.05, 0.84, 0.95]);
addMesh(head, 'FaceWarmth', new THREE.SphereGeometry(0.194, 12, 10), MATERIALS.skinWarm, [0, -0.004, 0.102], [0, 0, 0], [0.93, 0.62, 0.56]);
addMesh(head, 'ChinSoft', new THREE.SphereGeometry(0.068, 8, 8), MATERIALS.skinWarm, [0, -0.132, 0.098], [0, 0, 0], [0.82, 0.54, 0.66]);
addMesh(head, 'Cheek_L', new THREE.SphereGeometry(0.072, 8, 8), MATERIALS.cheek, [0.103, -0.028, 0.128], [0, 0, 0], [1.0, 0.76, 0.56]);
addMesh(head, 'Cheek_R', new THREE.SphereGeometry(0.072, 8, 8), MATERIALS.cheek, [-0.103, -0.028, 0.128], [0, 0, 0], [1.0, 0.76, 0.56]);
addMesh(head, 'Ear_L', new THREE.SphereGeometry(0.044, 8, 8), MATERIALS.skinWarm, [0.206, 0.008, 0.012], [0, 0, 0], [0.34, 0.56, 0.22]);
addMesh(head, 'Ear_R', new THREE.SphereGeometry(0.044, 8, 8), MATERIALS.skinWarm, [-0.206, 0.008, 0.012], [0, 0, 0], [0.34, 0.56, 0.22]);

addMesh(head, 'HairBackCap', new THREE.SphereGeometry(0.242, 14, 12), MATERIALS.hair, [0, 0.147, -0.018], [0.02, 0, 0], [1.04, 0.9, 0.97]);
addMesh(head, 'HairFrontCap', new THREE.SphereGeometry(0.212, 14, 12), MATERIALS.hair, [0, 0.158, 0.024], [0.02, 0, 0], [1.0, 0.42, 0.68]);
addMesh(head, 'HairSideSoft_L', new THREE.SphereGeometry(0.086, 10, 8), MATERIALS.hair, [0.156, 0.09, -0.002], [0.06, 0.05, 0.08], [0.48, 0.92, 0.76]);
addMesh(head, 'HairSideSoft_R', new THREE.SphereGeometry(0.086, 10, 8), MATERIALS.hair, [-0.15, 0.082, -0.002], [0.06, -0.05, -0.08], [0.48, 0.9, 0.72]);
addMesh(head, 'HairTemple_L', new THREE.SphereGeometry(0.05, 8, 8), MATERIALS.hair, [0.11, 0.11, 0.074], [0.04, 0.02, 0.08], [0.62, 0.5, 0.46]);
addMesh(head, 'HairTemple_R', new THREE.SphereGeometry(0.05, 8, 8), MATERIALS.hair, [-0.11, 0.11, 0.074], [0.04, -0.02, -0.08], [0.62, 0.5, 0.46]);
addMesh(head, 'HairLayer_L', new THREE.CapsuleGeometry(0.034, 0.06, 4, 8), MATERIALS.hair, [0.126, 0.094, 0.086], [0.44, 0.08, 0.28], [0.7, 1.02, 0.54]);
addMesh(head, 'HairLayer_R', new THREE.CapsuleGeometry(0.03, 0.052, 4, 8), MATERIALS.hair, [-0.092, 0.102, 0.084], [0.32, -0.04, -0.18], [0.62, 0.92, 0.5]);
addMesh(head, 'HairBackSoft', new THREE.CapsuleGeometry(0.078, 0.11, 5, 8), MATERIALS.hair, [0, 0.028, -0.104], [Math.PI / 2 + 0.08, 0, 0], [0.96, 0.9, 0.72]);
addMesh(head, 'HairNape', new THREE.SphereGeometry(0.068, 10, 8), MATERIALS.hair, [0, -0.018, -0.088], [0.12, 0, 0], [0.9, 0.44, 0.3]);
addMesh(head, 'HairCrownFill', new THREE.SphereGeometry(0.132, 10, 8), MATERIALS.hair, [0, 0.208, 0.0], [0.02, 0, 0], [0.98, 0.68, 0.84]);
addMesh(head, 'HairHighlight', new THREE.IcosahedronGeometry(0.046, 0), MATERIALS.hairHighlight, [0.022, 0.223, 0.024], [0.06, 0, -0.08], [0.82, 0.38, 0.6]);

const frontCurlPlacements = [
  { position: [0.108, 0.126, 0.086], rotation: [0.16, 0, 0.18], scale: [0.34, 0.42, 0.3], highlight: false },
  { position: [0.054, 0.142, 0.088], rotation: [0.1, 0, 0.06], scale: [0.34, 0.34, 0.28], highlight: true },
  { position: [0.006, 0.15, 0.084], rotation: [0.08, 0, 0.02], scale: [0.36, 0.28, 0.28], highlight: true },
  { position: [-0.042, 0.138, 0.086], rotation: [0.11, 0, -0.04], scale: [0.32, 0.38, 0.28], highlight: true },
  { position: [-0.096, 0.12, 0.078], rotation: [0.16, 0, -0.16], scale: [0.28, 0.46, 0.28], highlight: false },
];

frontCurlPlacements.forEach(({ position, rotation, scale, highlight }, index) => {
  addMesh(
    head,
    `HairCurl_${index + 1}`,
    new THREE.IcosahedronGeometry(0.038, 0),
    highlight ? MATERIALS.hairHighlight : MATERIALS.hair,
    position,
    rotation,
    scale,
  );
});

addMesh(head, 'Eyebrow_L', new THREE.BoxGeometry(0.05, 0.007, 0.01), MATERIALS.brow, [0.09, 0.086, 0.223], [0.02, 0.014, -0.11], [1, 1, 1]);
addMesh(head, 'Eyebrow_R', new THREE.BoxGeometry(0.05, 0.007, 0.01), MATERIALS.brow, [-0.09, 0.086, 0.223], [0.02, -0.014, 0.11], [1, 1, 1]);
addMesh(head, 'EyeWhite_L', new THREE.SphereGeometry(0.04, 12, 12), MATERIALS.eyeWhite, [0.09, 0.034, 0.232], [0, 0, 0], [0.92, 0.94, 0.36]);
addMesh(head, 'EyeWhite_R', new THREE.SphereGeometry(0.04, 12, 12), MATERIALS.eyeWhite, [-0.09, 0.034, 0.232], [0, 0, 0], [0.92, 0.94, 0.36]);
addMesh(head, 'EyeLidUpper_L', new THREE.SphereGeometry(0.034, 8, 8), MATERIALS.skin, [0.09, 0.05, 0.236], [0.02, 0, 0], [1.12, 0.42, 0.28]);
addMesh(head, 'EyeLidUpper_R', new THREE.SphereGeometry(0.034, 8, 8), MATERIALS.skin, [-0.09, 0.05, 0.236], [0.02, 0, 0], [1.12, 0.42, 0.28]);
addMesh(head, 'Iris_L', new THREE.CylinderGeometry(0.0245, 0.0245, 0.016, 10), MATERIALS.iris, [0.09, 0.032, 0.247], [Math.PI / 2, 0, 0], [1.04, 1.1, 1]);
addMesh(head, 'Iris_R', new THREE.CylinderGeometry(0.0245, 0.0245, 0.016, 10), MATERIALS.iris, [-0.09, 0.032, 0.247], [Math.PI / 2, 0, 0], [1.04, 1.1, 1]);
addMesh(head, 'Pupil_L', new THREE.CylinderGeometry(0.011, 0.011, 0.02, 8), MATERIALS.pupil, [0.09, 0.03, 0.253], [Math.PI / 2, 0, 0]);
addMesh(head, 'Pupil_R', new THREE.CylinderGeometry(0.011, 0.011, 0.02, 8), MATERIALS.pupil, [-0.09, 0.03, 0.253], [Math.PI / 2, 0, 0]);
addMesh(head, 'NoseTip', new THREE.SphereGeometry(0.01, 8, 8), MATERIALS.skinWarm, [0, -0.024, 0.223], [0, 0, 0], [1.0, 0.82, 0.76]);
addMesh(head, 'SmileShadow', new THREE.BoxGeometry(0.048, 0.006, 0.008), MATERIALS.skinWarm, [0, -0.059, 0.225], [0.02, 0, 0], [0.86, 1, 1]);
addMesh(head, 'Smile', new THREE.TorusGeometry(0.046, 0.0058, 8, 16, Math.PI * 0.98), MATERIALS.brow, [0, -0.067, 0.226], [Math.PI / 2, 0, Math.PI], [1, 0.74, 1]);

const armLeft = addArm(torso, 'Arm_L', [0.2, 0.164, 0.018], 1);
const armRight = addArm(torso, 'Arm_R', [-0.2, 0.164, 0.018], -1);
const legLeft = addLeg(hips, 'Thigh_L', [0.098, -0.05, 0.02], 1);
const legRight = addLeg(hips, 'Thigh_R', [-0.098, -0.05, 0.02], -1);

const clips = [
  createIdleClip({ hips, torso, head, armLeft, armRight, legLeft, legRight }),
  createWalkClip({ hips, torso, head, armLeft, armRight, legLeft, legRight }),
  createRunClip({ hips, torso, head, armLeft, armRight, legLeft, legRight }),
];

const exporter = new GLTFExporter();

mkdirSync(dirname(outputPath), { recursive: true });

exporter.parse(
  scene,
  (result) => {
    writeFileSync(outputPath, `${JSON.stringify(result, null, 2)}\n`, 'utf8');
    console.log(`Generated ${outputPath}`);
  },
  (error) => {
    console.error(error);
    process.exitCode = 1;
  },
  {
    binary: false,
    onlyVisible: false,
    animations: clips,
  },
);

function flatMaterial(color) {
  return new THREE.MeshStandardMaterial({
    color,
    flatShading: true,
    roughness: 0.94,
    metalness: 0.02,
  });
}

function addJoint(parent, name, position) {
  const joint = new THREE.Group();
  joint.name = name;
  joint.position.set(...position);
  parent.add(joint);
  return joint;
}

function addMesh(parent, name, geometry, material, position, rotation = [0, 0, 0], scale = [1, 1, 1]) {
  geometry.computeVertexNormals();
  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = name;
  mesh.position.set(...position);
  mesh.rotation.set(...rotation);
  mesh.scale.set(...scale);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

function addArm(parent, name, position, side) {
  const arm = addJoint(parent, name, position);
  addMesh(arm, `${name}_SleeveCap`, new THREE.SphereGeometry(0.078, 10, 8), MATERIALS.shirtMain, [0.012 * side, -0.002, 0.012], [0.04, 0, -0.08 * side], [0.86, 0.72, 0.82]);
  addMesh(arm, `${name}_Sleeve`, new THREE.CapsuleGeometry(0.074, 0.042, 5, 8), MATERIALS.shirtMain, [0.006 * side, -0.032, 0.002], [0, 0, -0.02 * side], [1.0, 0.94, 0.9]);
  addMesh(arm, `${name}_SleeveCuff`, new THREE.BoxGeometry(0.074, 0.014, 0.058), MATERIALS.shirtTrim, [0.006 * side, -0.064, 0.004], [0.02, 0, -0.015 * side], [1, 1, 1]);

  const forearm = addJoint(arm, name === 'Arm_L' ? 'Forearm_L' : 'Forearm_R', [0.012 * side, -0.118, 0.012]);
  addMesh(forearm, `${name}_Forearm`, new THREE.CapsuleGeometry(0.06, 0.1, 5, 8), MATERIALS.skinWarm, [0, -0.06, 0], [0, 0, -0.012 * side], [0.92, 1.02, 0.86]);
  addMesh(forearm, `${name}_Hand`, new THREE.SphereGeometry(0.046, 8, 8), MATERIALS.skin, [0.014 * side, -0.114, 0.018], [0.04, 0, 0], [1.28, 1.02, 0.84]);
  addMesh(forearm, `${name}_Thumb`, new THREE.SphereGeometry(0.018, 8, 8), MATERIALS.skinWarm, [0.042 * side, -0.104, 0.03], [0, 0, 0], [1.12, 0.88, 0.76]);

  return { upper: arm, forearm };
}

function addLeg(parent, name, position, side) {
  const thigh = addJoint(parent, name, position);
  addMesh(thigh, `${name}_Upper`, new THREE.CapsuleGeometry(0.092, 0.13, 5, 8), MATERIALS.jeansMain, [0, -0.094, 0.015], [0.02, 0, 0], [1.06, 1.02, 0.98]);
  addMesh(thigh, `${name}_Trim`, new THREE.BoxGeometry(0.018, 0.11, 0.018), MATERIALS.jeansTrim, [0.05 * side, -0.074, 0.068], [0.02, 0, 0.04 * side], [1, 1, 1]);

  const calf = addJoint(thigh, name === 'Thigh_L' ? 'Calf_L' : 'Calf_R', [0, -0.18, 0.015]);
  addMesh(calf, `${name}_Lower`, new THREE.CapsuleGeometry(0.08, 0.11, 5, 8), MATERIALS.jeansMain, [0, -0.074, 0.008], [0.01, 0, 0], [1.02, 1.0, 0.94]);

  const foot = addJoint(calf, name === 'Thigh_L' ? 'Foot_L' : 'Foot_R', [0, -0.15, 0.055]);
  addMesh(foot, `${name}_ShoeBody`, new THREE.CapsuleGeometry(0.056, 0.09, 5, 8), MATERIALS.shoeMain, [0, -0.006, 0.082], [Math.PI / 2 - 0.02, 0, 0], [1.16, 0.96, 1.04]);
  addMesh(foot, `${name}_ShoeToe`, new THREE.SphereGeometry(0.06, 10, 8), MATERIALS.shoeMain, [0, 0.004, 0.146], [0.04, 0, 0], [1.08, 0.78, 1.0]);
  addMesh(foot, `${name}_ShoeQuarter`, new THREE.SphereGeometry(0.052, 10, 8), MATERIALS.shoeMain, [0, 0.0, 0.064], [0.02, 0, 0], [1.12, 0.74, 0.92]);
  addMesh(foot, `${name}_ShoeSole`, new THREE.BoxGeometry(0.132, 0.022, 0.176), MATERIALS.shoeSole, [0, -0.05, 0.082], [0, 0, 0], [1, 1, 1]);
  addMesh(foot, `${name}_ShoeAccent`, new THREE.BoxGeometry(0.018, 0.028, 0.066), MATERIALS.shoeAccent, [0.036 * side, -0.002, 0.086], [0, 0, 0.05 * side], [1, 1, 1]);
  addMesh(foot, `${name}_Laces`, new THREE.BoxGeometry(0.04, 0.01, 0.05), MATERIALS.shoeMain, [0, 0.024, 0.096], [0.02, 0, 0], [1, 1, 1]);

  return { upper: thigh, calf, foot };
}

function createIdleClip(parts) {
  const times = [0, 1.1, 2.2];
  const tracks = [
    vectorTrack('Hips.position', times, [
      [0, 0, 0],
      [0, 0.01, 0],
      [0, 0, 0],
    ]),
    quaternionTrack('Torso.quaternion', times, [
      [0.012, 0.006, 0.001],
      [0.016, 0.002, 0],
      [0.012, 0.006, 0.001],
    ]),
    quaternionTrack('Head.quaternion', times, [
      [0.002, 0.01, 0],
      [0.008, 0.018, 0.004],
      [0.002, 0.01, 0],
    ]),
    quaternionTrack(parts.armLeft.upper.name + '.quaternion', times, [
      [-0.022, 0, 0.14],
      [-0.014, 0, 0.13],
      [-0.022, 0, 0.14],
    ]),
    quaternionTrack(parts.armRight.upper.name + '.quaternion', times, [
      [-0.022, 0, -0.14],
      [-0.014, 0, -0.13],
      [-0.022, 0, -0.14],
    ]),
    quaternionTrack(parts.armLeft.forearm.name + '.quaternion', times, [
      [0.078, 0, 0.014],
      [0.092, 0, 0.014],
      [0.078, 0, 0.014],
    ]),
    quaternionTrack(parts.armRight.forearm.name + '.quaternion', times, [
      [0.078, 0, -0.014],
      [0.092, 0, -0.014],
      [0.078, 0, -0.014],
    ]),
    quaternionTrack(parts.legLeft.upper.name + '.quaternion', times, [
      [0.008, 0, 0.042],
      [0.006, 0, 0.038],
      [0.008, 0, 0.042],
    ]),
    quaternionTrack(parts.legRight.upper.name + '.quaternion', times, [
      [0.008, 0, -0.042],
      [0.006, 0, -0.038],
      [0.008, 0, -0.042],
    ]),
  ];

  return new THREE.AnimationClip('AvatarIdle', -1, tracks);
}

function createWalkClip(parts) {
  const times = [0, 0.25, 0.5, 0.75, 1];
  const tracks = [
    vectorTrack('Hips.position', times, [
      [0, 0, 0],
      [0, 0.022, 0],
      [0, 0, 0],
      [0, 0.022, 0],
      [0, 0, 0],
    ]),
    quaternionTrack('Torso.quaternion', times, [
      [0.014, 0.012, 0.01],
      [0.02, -0.012, -0.008],
      [0.014, 0.012, 0.01],
      [0.02, -0.012, -0.008],
      [0.014, 0.012, 0.01],
    ]),
    quaternionTrack('Head.quaternion', times, [
      [-0.01, 0, 0],
      [0, 0.015, 0.008],
      [-0.01, 0, 0],
      [0, -0.015, -0.008],
      [-0.01, 0, 0],
    ]),
    limbTracks(parts, {
      arm: 0.36,
      forearm: 0.08,
      thigh: 0.42,
      calf: 0.18,
      foot: 0.08,
      armRoll: 0.14,
      run: false,
      times,
    }),
  ];

  return new THREE.AnimationClip('AvatarWalk', -1, tracks.flat());
}

function createRunClip(parts) {
  const times = [0, 0.2, 0.4, 0.6, 0.8];
  const tracks = [
    vectorTrack('Hips.position', times, [
      [0, 0, 0],
      [0, 0.034, 0],
      [0, 0, 0],
      [0, 0.034, 0],
      [0, 0, 0],
    ]),
    quaternionTrack('Torso.quaternion', times, [
      [0.034, 0.016, 0.012],
      [0.05, -0.016, -0.012],
      [0.034, 0.016, 0.012],
      [0.05, -0.016, -0.012],
      [0.034, 0.016, 0.012],
    ]),
    quaternionTrack('Head.quaternion', times, [
      [-0.02, 0, 0],
      [-0.008, 0.012, 0.008],
      [-0.02, 0, 0],
      [-0.008, -0.012, -0.008],
      [-0.02, 0, 0],
    ]),
    limbTracks(parts, {
      arm: 0.56,
      forearm: 0.14,
      thigh: 0.62,
      calf: 0.28,
      foot: 0.12,
      armRoll: 0.16,
      run: true,
      times,
    }),
  ];

  return new THREE.AnimationClip('AvatarRun', -1, tracks.flat());
}

function limbTracks(parts, config) {
  const swing = config.times.map((_, index) => (index % 2 === 0 ? 1 : -1));
  const opposite = swing.map((value) => value * -1);
  const armRoll = config.armRoll ?? 0.12;

  return [
    quaternionTrack(parts.armLeft.upper.name + '.quaternion', config.times, swing.map((value) => [
      -config.arm * value - (config.run ? 0.1 : 0.02),
      0,
      armRoll,
    ])),
    quaternionTrack(parts.armRight.upper.name + '.quaternion', config.times, opposite.map((value) => [
      -config.arm * value - (config.run ? 0.1 : 0.02),
      0,
      -armRoll,
    ])),
    quaternionTrack(parts.armLeft.forearm.name + '.quaternion', config.times, swing.map((value) => [
      0.08 + Math.max(0, value) * config.forearm,
      0,
      0,
    ])),
    quaternionTrack(parts.armRight.forearm.name + '.quaternion', config.times, opposite.map((value) => [
      0.08 + Math.max(0, value) * config.forearm,
      0,
      0,
    ])),
    quaternionTrack(parts.legLeft.upper.name + '.quaternion', config.times, swing.map((value) => [
      config.thigh * value,
      0,
      config.run ? 0.015 : 0,
    ])),
    quaternionTrack(parts.legRight.upper.name + '.quaternion', config.times, opposite.map((value) => [
      config.thigh * value,
      0,
      config.run ? -0.015 : 0,
    ])),
    quaternionTrack(parts.legLeft.calf.name + '.quaternion', config.times, swing.map((value) => [
      0.035 + Math.max(0, -value) * config.calf,
      0,
      0,
    ])),
    quaternionTrack(parts.legRight.calf.name + '.quaternion', config.times, opposite.map((value) => [
      0.035 + Math.max(0, -value) * config.calf,
      0,
      0,
    ])),
    quaternionTrack(parts.legLeft.foot.name + '.quaternion', config.times, swing.map((value) => [
      -Math.max(0, value) * config.foot,
      0,
      0,
    ])),
    quaternionTrack(parts.legRight.foot.name + '.quaternion', config.times, opposite.map((value) => [
      -Math.max(0, value) * config.foot,
      0,
      0,
    ])),
  ];
}

function quaternionTrack(path, times, eulers) {
  return new THREE.QuaternionKeyframeTrack(path, times, eulersToQuaternionValues(eulers));
}

function vectorTrack(path, times, vectors) {
  return new THREE.VectorKeyframeTrack(path, times, vectors.flat());
}

function eulersToQuaternionValues(eulers) {
  return eulers.flatMap(([x, y, z]) => {
    const quaternion = new THREE.Quaternion().setFromEuler(new THREE.Euler(x, y, z, 'XYZ'));
    return [quaternion.x, quaternion.y, quaternion.z, quaternion.w];
  });
}
