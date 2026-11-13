import { useLayoutEffect, useMemo, useRef } from 'react';
import { BufferGeometry, Color, LatheGeometry, Object3D, Vector2 } from 'three';
import type { InstancedMesh, WebGLProgramParametersWithUniforms } from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

import { getCentralPlazaTopHeight } from '../terrain';
import { PLAZA_WALL, PLAZA_WALL_ARCS, PLAZA_WALL_PIERS } from './plazaWallLayout';

/** Segments per radian of wall: smooth enough on a 32 m circle, cheap enough to merge. */
const SEGMENTS_PER_RADIAN = 22;

function latheArcs(profile: Array<[number, number]>, baseY: number): BufferGeometry {
  const points = profile.map(([r, y]) => new Vector2(r, baseY + y));
  const parts = PLAZA_WALL_ARCS.map(
    (arc) =>
      new LatheGeometry(points, Math.max(4, Math.ceil(arc.thetaLength * SEGMENTS_PER_RADIAN)), arc.thetaStart, arc.thetaLength),
  );
  const merged = mergeGeometries(parts, false) ?? new BufferGeometry();
  parts.forEach((part) => part.dispose());
  return merged;
}

// Coursed stone: two courses of blocks with offset joints, each block a slightly different warm tone, and a
// little darker toward the foot where the wall meets the grass.
const WALL_FRAGMENT_HEADER = /* glsl */ `
varying vec3 vWallWorld;
uniform float uWallBaseY;
float wallHash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
vec3 wallAlbedo(vec3 world) {
  float arc = atan(world.x, world.z) * length(world.xz);
  float h = world.y - uWallBaseY;
  float course = floor(h / 0.23);
  float u = arc / 0.86 + mod(course, 2.0) * 0.5;
  float block = floor(u);
  vec3 light = vec3(0.80, 0.71, 0.57);
  vec3 dark = vec3(0.68, 0.58, 0.45);
  vec3 c = mix(light, dark, wallHash(vec2(block, course)) * 0.85);
  float jointU = abs(fract(u) - 0.5) * 0.86;
  float jointV = abs(fract(h / 0.23) - 0.5) * 0.23;
  // Distance from the block's centre in metres; the last ~1.5 cm toward each edge is mortar.
  float mortar = max(1.0 - smoothstep(0.012, 0.02, 0.43 - jointU), 1.0 - smoothstep(0.012, 0.02, 0.115 - jointV));
  c = mix(c, vec3(0.55, 0.47, 0.37), mortar * 0.8);
  // The tones above are sRGB; lighting works in linear space.
  return pow(c, vec3(2.2)) * mix(0.82, 1.0, smoothstep(0.0, 0.35, h));
}
`;

function applyWallShader(baseY: number) {
  return (shader: WebGLProgramParametersWithUniforms) => {
    shader.uniforms.uWallBaseY = { value: baseY };
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vWallWorld;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvWallWorld = (modelMatrix * vec4(transformed, 1.0)).xyz;');
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', `#include <common>\n${WALL_FRAGMENT_HEADER}`)
      .replace('vec4 diffuseColor = vec4( diffuse, opacity );', 'vec4 diffuseColor = vec4( wallAlbedo(vWallWorld), opacity );');
  };
}

const PIER_BODY = new Color('#c4ad8a');
const PIER_CAP = new Color('#efe3cb');

export function PlazaWall() {
  const floorY = getCentralPlazaTopHeight() + 0.02;
  const { wall, coping } = useMemo(() => {
    const { innerRadius: rIn, outerRadius: rOut, footY, topY } = PLAZA_WALL;
    return {
      wall: latheArcs(
        [
          [rIn, footY],
          [rOut, footY],
          [rOut, topY],
          [rIn, topY],
          [rIn, footY],
        ],
        floorY,
      ),
      coping: latheArcs(
        [
          [PLAZA_WALL.copingInnerRadius, topY],
          [PLAZA_WALL.copingOuterRadius, topY],
          [PLAZA_WALL.copingOuterRadius, PLAZA_WALL.copingTopY],
          [PLAZA_WALL.copingInnerRadius, PLAZA_WALL.copingTopY],
          [PLAZA_WALL.copingInnerRadius, topY],
        ],
        floorY,
      ),
    };
  }, [floorY]);
  const wallShader = useMemo(() => applyWallShader(floorY + PLAZA_WALL.footY), [floorY]);

  const bodyRef = useRef<InstancedMesh>(null);
  const capRef = useRef<InstancedMesh>(null);
  useLayoutEffect(() => {
    const dummy = new Object3D();
    const size = PLAZA_WALL.pierSize;
    const bodyHeight = PLAZA_WALL.pierTopY - 0.08 - PLAZA_WALL.footY;
    PLAZA_WALL_PIERS.forEach((pier, index) => {
      dummy.rotation.set(0, pier.rotationY, 0);
      dummy.position.set(pier.x, floorY + PLAZA_WALL.footY + bodyHeight / 2, pier.z);
      dummy.scale.set(size, bodyHeight, size);
      dummy.updateMatrix();
      bodyRef.current?.setMatrixAt(index, dummy.matrix);
      bodyRef.current?.setColorAt(index, PIER_BODY);
      dummy.position.set(pier.x, floorY + PLAZA_WALL.pierTopY - 0.04, pier.z);
      dummy.scale.set(size + 0.12, 0.1, size + 0.12);
      dummy.updateMatrix();
      capRef.current?.setMatrixAt(index, dummy.matrix);
      capRef.current?.setColorAt(index, PIER_CAP);
    });
    for (const mesh of [bodyRef.current, capRef.current]) {
      if (!mesh) continue;
      mesh.instanceMatrix.needsUpdate = true;
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
      mesh.computeBoundingSphere();
    }
  }, [floorY]);

  return (
    <group>
      <mesh geometry={wall} castShadow receiveShadow>
        <meshStandardMaterial
          roughness={0.92}
          flatShading
          onBeforeCompile={wallShader}
          customProgramCacheKey={() => 'plaza-wall-v2'}
        />
      </mesh>
      <mesh geometry={coping} castShadow receiveShadow>
        <meshStandardMaterial color="#efe3cb" roughness={0.82} flatShading />
      </mesh>
      <instancedMesh ref={bodyRef} args={[undefined, undefined, PLAZA_WALL_PIERS.length]} castShadow receiveShadow>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial roughness={0.9} />
      </instancedMesh>
      <instancedMesh ref={capRef} args={[undefined, undefined, PLAZA_WALL_PIERS.length]} castShadow receiveShadow>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial roughness={0.82} />
      </instancedMesh>
    </group>
  );
}
