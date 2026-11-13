// Generates the player avatar (Christian) as a GLTF with three clips: AvatarIdle, AvatarWalk, AvatarRun.
//
// Stylized realism for the golden-hour island: sculpted (lathed and deformed) shapes rather than stacked
// primitives, a compact wavy mop with a curly fringe, a light-blue polo, khaki straight-leg trousers and off-white
// canvas sneakers. Flat-shaded like the rest of the island. Each joint's parts are merged into one vertex-coloured
// mesh, so the whole avatar is 14 meshes sharing one material.
//
// Rig contract (used by the game): joints Hips > Torso > Head, Torso > Arm_L/R > Forearm_L/R, Hips > Thigh_L/R >
// Calf_L/R > Foot_L/R. The model faces +z. The player group sits 0.82 m above the ground, so the soles rest at
// y = -0.82 in model space; walk and run are solved so the lowest sole touches that plane at every key.
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import * as THREE from 'three';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';
import { mergeGeometries, mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

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

// ---------------------------------------------------------------------------------------------- palette ----
const COLORS = {
  skin: '#dcac8c',
  skinShade: '#c89676',
  skinLight: '#e6b99b',
  lip: '#9c5a4c',
  mouth: '#4b2420',
  teeth: '#f1ebe2',
  brow: '#2e1d14',
  lash: '#1d120c',
  eyeWhite: '#eee5da',
  iris: '#2e1c13',
  hair: '#3a2418',
  hairDeep: '#2a1a11',
  hairLight: '#5a3a26',
  polo: '#8fc0f7',
  poloShade: '#7eaee8',
  poloRib: '#7fb0ec',
  button: '#f3f1ea',
  khaki: '#cdb48c',
  khakiShade: '#b59d76',
  canvas: '#e4e0d8',
  canvasShade: '#bdb9b0',
  sole: '#f0e9db',
  laces: '#ece9e2',
};

const GROUND_Y = -0.82;

// Body layout (model space, metres). Leg chain from the hip joint to the sole: 0.06 + 0.38 + 0.37 + 0.075.
const HIPS_Y = GROUND_Y + 0.06 + 0.38 + 0.37 + 0.075;
const THIGH_OFFSET = [0.078, -0.06, 0];
const KNEE_Y = -0.38;
const ANKLE_Y = -0.37;
const SOLE_DEPTH = 0.075;
const TORSO_OFFSET = [0, 0.08, 0];
const SHOULDER = [0.185, 0.405, -0.005];
const ELBOW_Y = -0.29;
const NECK_TOP = 0.478;

// --------------------------------------------------------------------------------------------- materials ---
// One flat-shaded material for everything (the island's faceted look). Smooth normals are still stored: the sun's
// shadow normal-bias offsets along them, and without them the avatar would show shadow acne.
const AVATAR_MATERIAL = new THREE.MeshStandardMaterial({
  name: 'Avatar',
  vertexColors: true,
  roughness: 0.86,
  metalness: 0,
  flatShading: true,
});

// ---------------------------------------------------------------------------------------------- builders ---
/** Collects geometry for one joint, baked into the joint's space, then merged into one mesh. */
class PartSet {
  constructor() {
    this.parts = [];
  }

  add(geometry, color, { position = [0, 0, 0], rotation = [0, 0, 0], order = 'XYZ', scale = [1, 1, 1] } = {}) {
    const g = flatten(geometry);
    for (const name of Object.keys(g.attributes)) {
      if (name !== 'position' && name !== 'color') g.deleteAttribute(name);
    }
    const matrix = new THREE.Matrix4().compose(
      new THREE.Vector3(...position),
      new THREE.Quaternion().setFromEuler(new THREE.Euler(...rotation, order)),
      new THREE.Vector3(...scale),
    );
    g.applyMatrix4(matrix);
    if (!g.getAttribute('color')) paint(g, color);
    this.parts.push(g);
    return this;
  }

  build(joint, name) {
    // Weld shared vertices (same position and colour), then give the welded mesh smooth normals for the shadow bias.
    const geometry = mergeVertices(mergeGeometries(this.parts, false), 1e-5);
    geometry.computeVertexNormals();
    geometry.setAttribute('color', quantizeColors(geometry.getAttribute('color')));
    const mesh = new THREE.Mesh(geometry, AVATAR_MATERIAL);
    mesh.name = name;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    joint.add(mesh);
    return mesh;
  }
}

function paint(geometry, color, jitter = 0, seed = 1) {
  const base = new THREE.Color(color);
  const count = geometry.getAttribute('position').count;
  const colors = new Float32Array(count * 3);
  for (let i = 0; i < count; i += 1) {
    const k = jitter ? 1 + (hash(seed * 31 + Math.floor(i / 3)) - 0.5) * jitter : 1;
    colors[i * 3] = base.r * k;
    colors[i * 3 + 1] = base.g * k;
    colors[i * 3 + 2] = base.b * k;
  }
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  return geometry;
}

/** Vertex colours as normalised bytes: a quarter of the float size, and plenty for flat colour regions. */
function quantizeColors(attribute) {
  const bytes = new Uint8Array(attribute.count * 3);
  for (let i = 0; i < attribute.count; i += 1) {
    bytes[i * 3] = Math.round(Math.min(1, attribute.getX(i)) * 255);
    bytes[i * 3 + 1] = Math.round(Math.min(1, attribute.getY(i)) * 255);
    bytes[i * 3 + 2] = Math.round(Math.min(1, attribute.getZ(i)) * 255);
  }
  return new THREE.BufferAttribute(bytes, 3, true);
}

function flatten(geometry) {
  return geometry.index ? geometry.toNonIndexed() : geometry.clone();
}

function hash(n) {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
}

function smoothstep(edge0, edge1, x) {
  const t = Math.min(1, Math.max(0, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

/** A lathe from [radius, y] pairs, squashed front-to-back by `depth` (bodies are wider than deep). */
function lathe(profile, { segments = 20, depth = 1, phiStart = 0, phiLength = Math.PI * 2 } = {}) {
  // LatheGeometry faces outward only when the profile runs bottom to top; a profile written top to bottom (as
  // limbs naturally are) would render inside out. Closed loops (first point repeated) are left as written.
  const closed = profile.length > 2 && profile[0][0] === profile.at(-1)[0] && profile[0][1] === profile.at(-1)[1];
  const ordered = !closed && profile[0][1] > profile.at(-1)[1] ? [...profile].reverse() : profile;
  const points = ordered.map(([r, y]) => new THREE.Vector2(Math.max(r, 0.0001), y));
  const geometry = new THREE.LatheGeometry(points, segments, phiStart, phiLength);
  geometry.scale(1, 1, depth);
  geometry.computeVertexNormals();
  return geometry;
}

function ellipsoid(rx, ry, rz, w = 14, h = 10) {
  const geometry = new THREE.SphereGeometry(1, w, h);
  geometry.scale(rx, ry, rz);
  geometry.computeVertexNormals();
  return geometry;
}

function capsule(radius, length, radial = 10) {
  return new THREE.CapsuleGeometry(radius, length, 4, radial);
}

function addJoint(parent, name, position) {
  const joint = new THREE.Group();
  joint.name = name;
  joint.position.set(...position);
  parent.add(joint);
  return joint;
}

// ------------------------------------------------------------------------------------------------- head ---
// Head-local space: origin at the head centre. A rounded oval: a touch narrower than deep, the jaw tapering to a
// soft chin, fuller at the cheekbones, a slightly flattened face plane and a cranium that extends back.
const HEAD = { rx: 0.114, ry: 0.134, rz: 0.13, centerY: 0.122 };

function headDeform(nx, ny, nz) {
  let x = nx * HEAD.rx;
  let y = ny * HEAD.ry;
  let z = nz * HEAD.rz;
  const jaw = smoothstep(0.05, -1, ny);
  x *= 1 - 0.08 * jaw;
  z *= nz > 0 ? 1 - 0.05 * jaw : 1 - 0.3 * jaw;
  if (nz < 0 && ny > -0.3) z *= 1 + 0.1 * smoothstep(-0.3, 0.4, ny);
  x *= 1 + 0.1 * Math.exp(-(((ny + 0.2) / 0.32) ** 2)) * Math.max(nz, 0);
  if (nz > 0.45) z *= 1 - 0.07 * smoothstep(0.45, 1, nz);
  if (ny > 0.55) y *= 0.97;
  return [x, y, z];
}

function headGeometry() {
  const geometry = new THREE.SphereGeometry(1, 28, 22);
  const p = geometry.getAttribute('position');
  for (let i = 0; i < p.count; i += 1) {
    const [x, y, z] = headDeform(p.getX(i), p.getY(i), p.getZ(i));
    p.setXYZ(i, x, y, z);
  }
  geometry.computeVertexNormals();
  return geometry;
}

/** Point on the face surface at head-local (x, y), nudged out by `lift`. */
function onFace(x, y, lift = 0.001) {
  // Search the deformed sphere along its front for the point whose (x, y) matches.
  let best = null;
  for (let a = -1; a <= 1; a += 0.01) {
    for (let b = -1; b <= 1; b += 0.01) {
      const nz2 = 1 - a * a - b * b;
      if (nz2 < 0) continue;
      const [px, py, pz] = headDeform(a, b, Math.sqrt(nz2));
      const d = (px - x) ** 2 + (py - y) ** 2;
      if (!best || d < best.d) best = { d, z: pz };
    }
  }
  return [x, y, best.z + lift];
}

function buildHead(head) {
  const parts = new PartSet();
  const c = HEAD.centerY;
  parts.add(headGeometry(), COLORS.skin, { position: [0, c, 0] });
  // Ears, set back a little and tilted.
  for (const side of [1, -1]) {
    parts.add(ellipsoid(0.012, 0.03, 0.02, 10, 8), COLORS.skinShade, {
      position: [side * HEAD.rx * 0.97, c - 0.004, -0.006],
      rotation: [0.1, 0, side * 0.12],
    });
  }

  // Eyes: open almonds (sclera, dark iris, an upper lash line set high), brows gently arched.
  for (const side of [1, -1]) {
    const [x, y, z] = onFace(side * 0.042, 0.008);
    parts.add(ellipsoid(0.0185, 0.0128, 0.0045, 14, 8), COLORS.eyeWhite, { position: [x, c + y, z - 0.002] });
    parts.add(ellipsoid(0.0115, 0.0118, 0.003, 12, 8), COLORS.iris, { position: [x, c + y - 0.0004, z + 0.0006] });
    parts.add(ellipsoid(0.0195, 0.0028, 0.0038, 12, 6), COLORS.lash, { position: [x, c + y + 0.0118, z + 0.0002] });
    const [bx, by, bz] = onFace(side * 0.044, 0.04, 0.0015);
    const brow = new THREE.TorusGeometry(0.03, 0.0034, 5, 10, 1.0);
    parts.add(brow, COLORS.brow, { position: [bx, c + by - 0.024, bz], rotation: [0, -side * 0.12, Math.PI / 2 - 0.5] });
  }

  // Nose: small and soft.
  const [, ny, nz] = onFace(0, -0.024, 0);
  parts.add(ellipsoid(0.0048, 0.012, 0.0048, 8, 6), COLORS.skin, { position: [0, c + ny + 0.004, nz] });
  parts.add(ellipsoid(0.0068, 0.005, 0.0042, 8, 6), COLORS.skin, { position: [0, c + ny - 0.005, nz + 0.0018] });

  // A friendly grin: a crescent showing the upper teeth, corners turned up.
  const [, my, mz] = onFace(0, -0.062, 0);
  const grin = new THREE.SphereGeometry(1, 16, 8, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2); // lower half: a bowl
  grin.scale(0.03, 0.012, 0.004);
  parts.add(grin, COLORS.mouth, { position: [0, c + my + 0.006, mz - 0.0012] });
  parts.add(ellipsoid(0.0265, 0.0045, 0.0042, 16, 6), COLORS.teeth, { position: [0, c + my + 0.0028, mz - 0.0004] });
  const lip = new THREE.TorusGeometry(0.031, 0.0022, 5, 18, Math.PI);
  parts.add(lip, COLORS.lip, { position: [0, c + my + 0.0062, mz - 0.0012], rotation: [0, 0, Math.PI], scale: [1, 0.45, 1] });
  parts.build(head, 'HeadShape');

  buildHair(head);
}

// ------------------------------------------------------------------------------------------------- hair ---
// Thick, dark, wavy hair with volume on top, shorter sides and a layered fringe of curling locks on the forehead.
// A faceted cap gives the base mass; long, flattened, curved locks laid along the scalp from the crown forward give
// the waves and volume; the fringe locks hang from the front hairline and curl at the tips.
function hairlineY(theta) {
  // theta: 0 at the front, ±π at the back. Returns the lowest normalised height the cap covers.
  const a = Math.abs(theta);
  if (a < 0.75) return 0.42;
  if (a < 1.75) return 0.42 - (a - 0.75) * 0.4; // past the temples to just above the ears (short sides)
  return 0.02 - (a - 1.75) * 0.5; // lower at the back, to the nape
}

function hairCap() {
  const geometry = new THREE.IcosahedronGeometry(1, 4);
  const p = geometry.getAttribute('position');
  for (let i = 0; i < p.count; i += 1) {
    const nx = p.getX(i);
    const ny = p.getY(i);
    const nz = p.getZ(i);
    const covered = ny > hairlineY(Math.atan2(nx, nz));
    const [hx, hy, hz] = headDeform(nx, ny, nz);
    const bump = 1 + 0.35 * (hash(Math.round(nx * 7) * 13 + Math.round(ny * 7) * 7 + Math.round(nz * 7) * 3) - 0.5);
    // Thicker on top (volume), thin at the short sides and nape; uncovered vertices sink inside the head.
    const top = smoothstep(0.1, 0.95, ny);
    const thickness = covered ? (0.005 + 0.016 * top) * bump : -0.014;
    const len = Math.hypot(hx, hy, hz);
    const k = (len + thickness) / len;
    p.setXYZ(i, hx * k, hy * k, hz * k);
  }
  return paint(flatten(geometry), COLORS.hair, 0.25, 3);
}

/** Scalp point (head-local, at the cap's outer surface) for normalised direction (theta, ny). */
function scalp(theta, ny, lift = 0) {
  const r = Math.sqrt(Math.max(0, 1 - ny * ny));
  const [x, y, z] = headDeform(r * Math.sin(theta), ny, r * Math.cos(theta));
  const len = Math.hypot(x, y, z);
  const k = (len + 0.012 + 0.02 * smoothstep(0.1, 0.95, ny) + lift) / len;
  return [x * k, y * k, z * k];
}

/**
 * A rounded clump of hair: a low-poly blob, flattened, with one side drawn down into a curling tip (toward -y and
 * +z in its own frame). `stretch` lengthens the tip for fringe curls.
 */
function clump(size, seed, stretch = 1) {
  const geometry = new THREE.IcosahedronGeometry(1, 1);
  const p = geometry.getAttribute('position');
  for (let i = 0; i < p.count; i += 1) {
    let x = p.getX(i);
    let y = p.getY(i);
    let z = p.getZ(i);
    const front = Math.max(0, z);
    // Pull the front-lower part down and in to make the curl.
    y -= front * 0.55 * stretch;
    z += front * 0.15 - Math.max(0, -y) * 0.25;
    x *= 1.25;
    p.setXYZ(i, x * size, y * size * 0.62, z * size * 0.95);
  }
  const tone = hash(seed);
  const color = tone > 0.7 ? COLORS.hairLight : tone < 0.22 ? COLORS.hairDeep : COLORS.hair;
  return paint(flatten(geometry), color, 0.12, seed);
}

function buildHair(head) {
  const parts = new PartSet();
  const c = HEAD.centerY;
  parts.add(hairCap(), COLORS.hair, { position: [0, c, 0] });

  // Top: short, wide, rounded clumps over the crown and down the sides, tips curling down and in, so the hair
  // reads as a compact wavy mop with volume on top rather than spikes.
  let seed = 10;
  const rows = [
    { ny: 0.95, count: 3, size: 0.04, spread: 1.6 },
    { ny: 0.8, count: 6, size: 0.04, spread: 3.3 },
    { ny: 0.62, count: 7, size: 0.036, spread: 4.4 },
    { ny: 0.44, count: 6, size: 0.028, spread: 5.0 },
  ];
  for (const row of rows) {
    for (let i = 0; i < row.count; i += 1) {
      seed += 1;
      const theta = -row.spread / 2 + (row.spread * (i + 0.5)) / row.count + (hash(seed) - 0.5) * 0.3;
      // Fuller on top and at the front, tighter at the sides and back.
      const sideness = Math.abs(Math.sin(theta));
      const size = row.size * (1 - 0.3 * sideness * (1 - row.ny)) * (0.85 + 0.3 * hash(seed + 1));
      const [x, y, z] = scalp(theta, row.ny, -0.024 + size * 0.15 - 0.012 * Math.abs(Math.sin(theta)));
      parts.add(clump(size, seed), COLORS.hair, {
        position: [x, c + y, z],
        rotation: [-0.6 + (1 - row.ny) * 0.5, theta, (hash(seed + 2) - 0.5) * 0.6],
        order: 'YXZ',
      });
    }
  }

  // Fringe: five soft curls falling forward over the upper forehead, just above the brows.
  [-0.072, -0.048, -0.022, 0.004, 0.03, 0.054, 0.076].forEach((x, index) => {
    const [fx, fy, fz] = onFace(x, 0.066 - Math.abs(x) * 0.2 - (index % 2) * 0.01, 0.012);
    const size = 0.026 + 0.005 * hash(200 + index);
    parts.add(clump(size, 200 + index, 1.45), COLORS.hair, {
      position: [fx, c + fy, fz],
      rotation: [0.5, 0, (index - 2) * 0.2],
      order: 'YXZ',
    });
  });
  parts.build(head, 'Hair');
}

// ---------------------------------------------------------------------------------------------- torso ----
function buildTorso(torso) {
  const parts = new PartSet();
  // Polo body: untucked hem, a slim waist, chest and shoulders; wider than deep.
  parts.add(
    lathe(
      [
        [0.152, -0.132],
        [0.162, -0.124],
        [0.158, -0.09],
        [0.152, 0.0],
        [0.15, 0.08],
        [0.157, 0.19],
        [0.165, 0.29],
        [0.168, 0.35],
        [0.162, 0.4],
        [0.14, 0.44],
        [0.1, 0.468],
        [0.062, 0.48],
      ],
      { segments: 14, depth: 0.66 },
    ),
    COLORS.polo,
  );
  // Neck.
  parts.add(capsule(0.052, 0.02, 10), COLORS.skin, { position: [0, 0.478, 0.0] });
  // Collar: a band standing around the neck, open at the front, and a fold-down that rests on the shoulders.
  const opening = 0.38;
  // Closed profiles (a band with thickness), so no inside faces show and single-sided rendering is enough.
  parts.add(
    lathe(
      [
        [0.052, 0.462],
        [0.054, 0.484],
        [0.06, 0.492],
        [0.06, 0.484],
        [0.058, 0.464],
        [0.052, 0.462],
      ],
      { segments: 20, phiStart: opening, phiLength: Math.PI * 2 - opening * 2 },
    ),
    COLORS.poloRib,
  );
  parts.add(
    lathe(
      [
        [0.058, 0.494],
        [0.078, 0.484],
        [0.096, 0.468],
        [0.093, 0.462],
        [0.076, 0.477],
        [0.058, 0.488],
        [0.058, 0.494],
      ],
      { segments: 20, phiStart: opening * 0.6, phiLength: Math.PI * 2 - opening * 1.2 },
    ),
    COLORS.poloRib,
  );
  // Collar points, folding down either side of the placket.
  for (const side of [1, -1]) {
    const point = new THREE.ConeGeometry(0.028, 0.05, 3);
    point.computeVertexNormals();
    parts.add(point, COLORS.poloRib, {
      position: [side * 0.03, 0.452, 0.088],
      rotation: [Math.PI - 0.55, 0, side * 0.42],
      scale: [0.85, 0.85, 0.32],
    });
  }
  // Placket with two buttons, following the chest's lean.
  parts.add(new THREE.BoxGeometry(0.03, 0.115, 0.006), COLORS.poloShade, { position: [0, 0.395, 0.107], rotation: [-0.2, 0, 0] });
  for (const y of [0.42, 0.375]) {
    const button = new THREE.CylinderGeometry(0.0055, 0.0055, 0.004, 10);
    parts.add(button, COLORS.button, { position: [0, y, 0.111 + (0.42 - y) * 0.2], rotation: [Math.PI / 2 - 0.2, 0, 0] });
  }
  parts.build(torso, 'Polo');
}

function buildArm(torso, side) {
  const suffix = side > 0 ? 'L' : 'R';
  const arm = addJoint(torso, `Arm_${suffix}`, [side * SHOULDER[0], SHOULDER[1], SHOULDER[2]]);
  const upper = new PartSet();
  // Short sleeve to mid upper arm, with a ribbed hem band.
  upper.add(
    lathe(
      [
        [0.0, 0.05],
        [0.03, 0.045],
        [0.05, 0.022],
        [0.057, -0.01],
        [0.058, -0.05],
        [0.056, -0.122],
        [0.0, -0.125],
      ],
      { segments: 10, depth: 0.92 },
    ),
    COLORS.polo,
  );
  upper.add(lathe([[0.0, -0.118], [0.0585, -0.12], [0.0595, -0.15], [0.052, -0.154], [0.0, -0.155]], { segments: 10, depth: 0.92 }), COLORS.poloRib);
  // Upper arm below the sleeve: slim, slightly tapering.
  upper.add(lathe([[0.048, -0.12], [0.047, -0.2], [0.042, -0.29], [0.041, -0.33]], { segments: 14 }), COLORS.skin);
  upper.build(arm, `Arm_${suffix}_Sleeve`);

  const forearm = addJoint(arm, `Forearm_${suffix}`, [0, ELBOW_Y, 0]);
  const lower = new PartSet();
  lower.add(lathe([[0.0, 0.035], [0.034, 0.03], [0.042, 0.0], [0.042, -0.07], [0.035, -0.2], [0.03, -0.25], [0.0, -0.255]], { segments: 14, depth: 0.92 }), COLORS.skin);
  // Hand: one tapered paddle overlapping the wrist, palm toward the thigh, fingers gently curled, plus a thumb.
  const hand = new THREE.SphereGeometry(1, 10, 10);
  const hp = hand.getAttribute('position');
  for (let i = 0; i < hp.count; i += 1) {
    const y = hp.getY(i);
    const t = (1 - y) / 2; // 0 at the wrist, 1 at the fingertips
    hp.setXYZ(i, hp.getX(i) * 0.026 * (1 - 0.25 * t), y * 0.064, hp.getZ(i) * 0.044 * (1 - 0.3 * t) + t * t * 0.016);
  }
  lower.add(hand, COLORS.skin, { position: [0, -0.308, 0.004], rotation: [-0.12, side * 0.45, 0] });
  const thumb = new THREE.ConeGeometry(0.014, 0.05, 6);
  lower.add(thumb, COLORS.skin, { position: [-side * 0.008, -0.29, 0.04], rotation: [-0.6 + Math.PI, 0, side * 0.25] });
  lower.build(forearm, `Arm_${suffix}_Forearm`);
  return { upper: arm, forearm };
}

// ------------------------------------------------------------------------------------------------- legs ---
function buildHips(hips) {
  const parts = new PartSet();
  // Khaki seat and waist under the untucked polo hem.
  parts.add(
    lathe(
      [
        [0.0, -0.05],
        [0.09, -0.05],
        [0.128, -0.03],
        [0.136, 0.0],
        [0.132, 0.04],
        [0.11, 0.08],
      ],
      { segments: 20, depth: 0.68 },
    ),
    COLORS.khaki,
  );
  parts.build(hips, 'Khakis_Seat');
}

function buildLeg(hips, side) {
  const suffix = side > 0 ? 'L' : 'R';
  const thigh = addJoint(hips, `Thigh_${suffix}`, [side * THIGH_OFFSET[0], THIGH_OFFSET[1], THIGH_OFFSET[2]]);
  const upper = new PartSet();
  // Straight-leg khakis: an easy fit through the thigh, no taper to speak of.
  upper.add(
    lathe(
      [
        [0.0, 0.07],
        [0.084, 0.06],
        [0.09, 0.0],
        [0.088, -0.12],
        [0.084, -0.24],
        [0.082, -0.38],
        [0.0, -0.381],
      ],
      { segments: 10, depth: 0.95 },
    ),
    COLORS.khaki,
  );
  // Front crease and a pocket edge.
  upper.build(thigh, `Thigh_${suffix}_Khaki`);

  const calf = addJoint(thigh, `Calf_${suffix}`, [0, KNEE_Y, 0.004]);
  const lower = new PartSet();
  // Knee: a sphere a little inside the trouser radius at the joint, so it fills the gap when the knee bends and
  // stays hidden when the leg is straight (thigh and calf shells meet edge to edge at the same radius).
  lower.add(ellipsoid(0.076, 0.076, 0.072, 10, 8), COLORS.khaki);
  // A soft fold ring at the knee: a believable crease that also hides where the two shells meet.
  lower.add(lathe([[0.0, 0.016], [0.0855, 0.014], [0.087, 0.0], [0.0855, -0.014], [0.0, -0.016]], { segments: 10, depth: 0.95 }), COLORS.khaki);
  lower.add(
    lathe(
      [
        [0.0, 0.001],
        [0.082, 0.0],
        [0.081, -0.06],
        [0.078, -0.2],
        [0.078, -0.3],
        [0.081, -0.345],
        [0.083, -0.362],
        [0.0, -0.364],
      ],
      { segments: 10, depth: 0.95 },
    ),
    COLORS.khaki,
  );
  // The hem breaking over the shoe.
  lower.build(calf, `Calf_${suffix}_Khaki`);

  const foot = addJoint(calf, `Foot_${suffix}`, [0, ANKLE_Y, 0]);
  const shoe = new PartSet();
  // Cream rubber sole band: a rounded footprint, heel behind the ankle, toe well forward.
  const outline = new THREE.Shape();
  outline.absellipse(0, 0.072, 0.05, 0.133, 0, Math.PI * 2, false, 0);
  const sole = new THREE.ExtrudeGeometry(outline, { depth: 0.03, bevelEnabled: true, bevelThickness: 0.003, bevelSize: 0.003, bevelSegments: 1, curveSegments: 18 });
  sole.rotateX(Math.PI / 2);
  shoe.add(sole, COLORS.sole, { position: [0, -SOLE_DEPTH + 0.033, 0] });
  // Canvas upper: low, rounded at the toe, with a defined, near-vertical heel.
  const upperShell = new THREE.SphereGeometry(1, 16, 10);
  const sp = upperShell.getAttribute('position');
  for (let i = 0; i < sp.count; i += 1) {
    const x = sp.getX(i);
    let y = sp.getY(i);
    let z = sp.getZ(i);
    if (y < 0) y *= 0.1;
    if (z < -0.55) z = -0.55 - (z + 0.55) * 0.35; // squared-off heel
    const toeDrop = smoothstep(0.15, 1, z) * 0.45;
    const heelRise = 1 + 0.45 * smoothstep(0.2, -0.6, z); // higher at the heel and ankle collar
    sp.setXYZ(i, x * 0.051, (y - toeDrop * Math.max(y, 0)) * 0.064 * (y > 0 ? heelRise : 1), z * 0.128);
  }
  shoe.add(upperShell, COLORS.canvas, { position: [0, -SOLE_DEPTH + 0.031, 0.072] });
  // Rubber toe cap.
  shoe.add(ellipsoid(0.045, 0.016, 0.024, 12, 6), COLORS.sole, { position: [0, -SOLE_DEPTH + 0.036, 0.172] });
  // Grey lace panel lying on the instep.
  shoe.add(ellipsoid(0.021, 0.006, 0.042, 10, 6), COLORS.canvasShade, { position: [0, -SOLE_DEPTH + 0.074, 0.095], rotation: [-0.3, 0, 0] });
  shoe.build(foot, `Foot_${suffix}_Sneaker`);
  return { upper: thigh, calf, foot };
}

// -------------------------------------------------------------------------------------------- assemble ----
const scene = new THREE.Group();
scene.name = 'CcortezAvatarRoot';
const hips = addJoint(scene, 'Hips', [0, HIPS_Y, 0]);
buildHips(hips);
const torso = addJoint(hips, 'Torso', TORSO_OFFSET);
buildTorso(torso);
const head = addJoint(torso, 'Head', [0, NECK_TOP, -0.004]);
buildHead(head);
const armLeft = buildArm(torso, 1);
const armRight = buildArm(torso, -1);
const legLeft = buildLeg(hips, 1);
const legRight = buildLeg(hips, -1);
const rig = { hips, torso, head, armLeft, armRight, legLeft, legRight };

// ------------------------------------------------------------------------------------------- animation ----
// Poses are functions of a cycle phase; clips sample them densely, and every sampled pose is grounded: the hips
// drop by however much the lowest sole would float (or rise if it would sink), so feet never hover or clip.
const SOLE_POINTS = [
  [0, -SOLE_DEPTH, -0.06],
  [0, -SOLE_DEPTH, 0.21],
];

function applyPose(pose) {
  const set = (joint, [x, y, z]) => joint.quaternion.setFromEuler(new THREE.Euler(x, y, z, 'XYZ'));
  rig.hips.position.set(pose.hipsX ?? 0, HIPS_Y, 0);
  set(rig.hips, pose.hips ?? [0, 0, 0]);
  set(rig.torso, pose.torso);
  set(rig.head, pose.head);
  set(rig.armLeft.upper, pose.armL);
  set(rig.armRight.upper, pose.armR);
  set(rig.armLeft.forearm, pose.forearmL);
  set(rig.armRight.forearm, pose.forearmR);
  set(rig.legLeft.upper, pose.thighL);
  set(rig.legRight.upper, pose.thighR);
  set(rig.legLeft.calf, pose.calfL);
  set(rig.legRight.calf, pose.calfR);
  set(rig.legLeft.foot, pose.footL);
  set(rig.legRight.foot, pose.footR);
  scene.updateMatrixWorld(true);
  let lowest = Infinity;
  for (const foot of [rig.legLeft.foot, rig.legRight.foot]) {
    for (const point of SOLE_POINTS) {
      lowest = Math.min(lowest, new THREE.Vector3(...point).applyMatrix4(foot.matrixWorld).y);
    }
  }
  rig.hips.position.y = HIPS_Y + (GROUND_Y - lowest) + (pose.lift ?? 0);
}

const TRACKED = () => [
  rig.torso,
  rig.head,
  rig.armLeft.upper,
  rig.armRight.upper,
  rig.armLeft.forearm,
  rig.armRight.forearm,
  rig.legLeft.upper,
  rig.legRight.upper,
  rig.legLeft.calf,
  rig.legRight.calf,
  rig.legLeft.foot,
  rig.legRight.foot,
];

function sampleClip(name, duration, samples, poseAt) {
  const times = [];
  const hipsPositions = [];
  const hipsRotations = [];
  const rotations = new Map(TRACKED().map((joint) => [joint.name, []]));
  for (let i = 0; i <= samples; i += 1) {
    const phase = i / samples;
    applyPose(poseAt(phase % 1));
    times.push(phase * duration);
    hipsPositions.push(...rig.hips.position.toArray());
    hipsRotations.push(...rig.hips.quaternion.toArray());
    for (const joint of TRACKED()) rotations.get(joint.name).push(...joint.quaternion.toArray());
  }
  const tracks = [
    new THREE.VectorKeyframeTrack('Hips.position', times, hipsPositions),
    new THREE.QuaternionKeyframeTrack('Hips.quaternion', times, hipsRotations),
    ...[...rotations].map(([jointName, values]) => new THREE.QuaternionKeyframeTrack(`${jointName}.quaternion`, times, values)),
  ];
  return new THREE.AnimationClip(name, duration, tracks);
}

const TAU = Math.PI * 2;
const ARM_OUT = 0.085;

/** One leg through a gait cycle: thigh swing (forward positive), knee bend and foot pitch (toe up positive). */
function legCycle(p, { stance, swing, kneeStance, kneeSwing, toeOff }) {
  // Thigh: forward at heel strike (p = 0), back at toe-off (p = stance), forward again by the end of swing.
  let thigh;
  if (p < stance) thigh = swing * Math.cos((p / stance) * Math.PI);
  else thigh = -swing * Math.cos(((p - stance) / (1 - stance)) * Math.PI);
  // Knee: a small loading bend early in stance, a big bend mid-swing to clear the ground.
  const knee =
    p < stance
      ? kneeStance * Math.sin((p / stance) * Math.PI) * 0.9 + 0.04
      : 0.04 + kneeSwing * Math.sin(((p - stance) / (1 - stance)) * Math.PI) ** 1.4;
  // Foot pitch (toe up positive) relative to the calf. `flat` cancels the thigh and knee so the sole stays level
  // through stance; the heel lifts at toe-off, the toe is up at heel strike, and swing eases from pointed to level.
  const flat = knee - thigh;
  let foot;
  if (p < 0.1) foot = flat + 0.26 * (1 - p / 0.1);
  else if (p < stance - 0.1) foot = flat;
  else if (p < stance) foot = flat - toeOff * ((p - (stance - 0.1)) / 0.1);
  else {
    const s = (p - stance) / (1 - stance);
    foot = flat * 0.8 - toeOff * 0.5 * (1 - s) + 0.1 * s;
  }
  return { thigh, knee, foot };
}

function gaitPose(phase, gait) {
  const left = legCycle(phase, gait);
  const right = legCycle((phase + 0.5) % 1, gait);
  const swingL = Math.cos(phase * TAU); // +1 when the left leg is forward
  return {
    hips: [0, -gait.hipYaw * swingL, gait.hipRoll * Math.sin(phase * TAU * 2 + Math.PI / 2) * 0.5],
    hipsX: 0,
    torso: [gait.lean, gait.hipYaw * 1.6 * swingL, 0],
    head: [-gait.lean * 0.45 + 0.015 * Math.cos(phase * TAU * 2), -gait.hipYaw * 0.6 * swingL, 0],
    // Arms swing opposite their own side's leg; elbows bend more on the forward swing.
    armL: [gait.arm * swingL - gait.armBase, 0, ARM_OUT + 0.02],
    armR: [-gait.arm * swingL - gait.armBase, 0, -ARM_OUT - 0.02],
    forearmL: [-(gait.elbow + gait.elbowSwing * Math.max(0, -swingL)), 0, -0.05],
    forearmR: [-(gait.elbow + gait.elbowSwing * Math.max(0, swingL)), 0, 0.05],
    // A little width keeps the feet on their own lines, so they never pass through each other.
    thighL: [-left.thigh, 0, gait.stanceWidth],
    thighR: [-right.thigh, 0, -gait.stanceWidth],
    calfL: [left.knee, 0, 0],
    calfR: [right.knee, 0, 0],
    footL: [-left.foot, 0, 0],
    footR: [-right.foot, 0, 0],
    lift: gait.bounce * Math.max(0, Math.sin(phase * TAU * 2 - 0.6)),
  };
}

const WALK = {
  stance: 0.6,
  swing: 0.42,
  kneeStance: 0.07,
  kneeSwing: 0.72,
  toeOff: 0.32,
  lean: 0.05,
  hipYaw: 0.06,
  hipRoll: 0.03,
  arm: 0.26,
  armBase: -0.02,
  elbow: 0.2,
  elbowSwing: 0.14,
  bounce: 0.0,
  stanceWidth: 0.025,
};

const RUN = {
  stance: 0.38,
  swing: 0.62,
  kneeStance: 0.16,
  kneeSwing: 1.4,
  toeOff: 0.5,
  lean: 0.24,
  hipYaw: 0.08,
  hipRoll: 0.035,
  arm: 0.32,
  armBase: 0.02,
  elbow: 1.0,
  elbowSwing: 0.12,
  bounce: 0.06,
  stanceWidth: 0.04,
};

function idlePose(phase) {
  const breath = Math.sin(phase * TAU);
  const sway = Math.sin(phase * TAU + 0.6);
  return {
    hips: [0, 0, 0.008 * sway],
    hipsX: 0.006 * sway,
    torso: [0.01 + 0.008 * breath, 0.012 * Math.sin(phase * TAU * 0.5), -0.006 * sway],
    head: [-0.02 - 0.006 * breath, 0.035 * Math.sin(phase * TAU + 1.3), 0.008 * sway],
    armL: [0.04 + 0.012 * breath, 0, ARM_OUT + 0.006 * breath],
    armR: [0.04 + 0.012 * breath, 0, -ARM_OUT - 0.006 * breath],
    forearmL: [-0.16 - 0.015 * breath, 0, -0.06],
    forearmR: [-0.16 - 0.015 * breath, 0, 0.06],
    // Weight a touch more on the left leg: the right knee eases.
    thighL: [-0.01, 0, 0.03],
    thighR: [-0.03, 0, -0.03],
    calfL: [0.02, 0, 0],
    calfR: [0.07, 0, 0],
    footL: [-0.01, 0, -0.03],
    footR: [-0.04, 0, 0.03],
  };
}

const clips = [
  sampleClip('AvatarIdle', 2.2, 22, idlePose),
  sampleClip('AvatarWalk', 0.72, 24, (p) => gaitPose(p, WALK)),
  sampleClip('AvatarRun', 0.56, 24, (p) => gaitPose(p, RUN)),
];

// Rest pose for anything that renders the model before a clip starts: the first idle frame.
applyPose(idlePose(0));

const exporter = new GLTFExporter();
mkdirSync(dirname(outputPath), { recursive: true });
exporter.parse(
  scene,
  (result) => {
    writeFileSync(outputPath, `${JSON.stringify(result)}\n`, 'utf8');
    console.log(`Generated ${outputPath}`);
  },
  (error) => {
    console.error(error);
    process.exitCode = 1;
  },
  { binary: false, onlyVisible: false, animations: clips },
);
