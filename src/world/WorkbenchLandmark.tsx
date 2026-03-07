import { Html } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import type { Group, MeshStandardMaterial } from 'three';

import type { WorkbenchRuntimeRecord } from '../workbench/runtime';
import type {
  WorkbenchAccentMaterial,
  WorkbenchHeroProp,
  WorkbenchPaletteToken,
  WorkbenchPropKit,
} from '../types/workbench';

interface PaletteDefinition {
  base: string;
  top: string;
  accent: string;
  glow: string;
  trim: string;
}

const paletteMap: Record<WorkbenchPaletteToken, PaletteDefinition> = {
  'work-ember': {
    base: '#3f4349',
    top: '#85725d',
    accent: '#ef9650',
    glow: '#f6cf8f',
    trim: '#d6dbe0',
  },
  'project-citrine': {
    base: '#3b4f5c',
    top: '#766153',
    accent: '#efba3f',
    glow: '#f8e4a2',
    trim: '#d0efe3',
  },
  'personal-rose': {
    base: '#54495d',
    top: '#886f6e',
    accent: '#f1a1a9',
    glow: '#f7d4cc',
    trim: '#f4ede4',
  },
  'club-verde': {
    base: '#3b4d44',
    top: '#7f7056',
    accent: '#8fc596',
    glow: '#dbf0c6',
    trim: '#ecf2df',
  },
  'extra-cobalt': {
    base: '#394a5f',
    top: '#5d625f',
    accent: '#67a6db',
    glow: '#d6ebf9',
    trim: '#eff6fb',
  },
  'draft-mist': {
    base: '#49525d',
    top: '#828890',
    accent: '#a4b6c7',
    glow: '#e7edf2',
    trim: '#f4f7fa',
  },
};

const accentMaterialMap: Record<
  WorkbenchAccentMaterial,
  { roughness: number; metalness: number; transmission?: number }
> = {
  'brushed-metal': { roughness: 0.28, metalness: 0.72 },
  'warm-wood': { roughness: 0.66, metalness: 0.04 },
  ceramic: { roughness: 0.48, metalness: 0.02 },
  'frosted-glass': { roughness: 0.08, metalness: 0.1, transmission: 0.28 },
  'powder-coat': { roughness: 0.42, metalness: 0.2 },
};

function renderPropKit(propKit: WorkbenchPropKit, palette: PaletteDefinition) {
  switch (propKit) {
    case 'software-station':
      return (
        <>
          <mesh position={[0, 0.74, -0.08]} castShadow>
            <boxGeometry args={[0.95, 0.48, 0.08]} />
            <meshStandardMaterial color={palette.trim} roughness={0.28} metalness={0.2} />
          </mesh>
          <mesh position={[0, 0.51, 0.32]} castShadow>
            <boxGeometry args={[0.88, 0.03, 0.42]} />
            <meshStandardMaterial color="#1d2630" roughness={0.45} />
          </mesh>
          <mesh position={[0.56, 0.48, 0.22]} castShadow>
            <cylinderGeometry args={[0.08, 0.1, 0.2, 18]} />
            <meshStandardMaterial color={palette.accent} roughness={0.52} />
          </mesh>
        </>
      );
    case 'prototype-lab':
      return (
        <>
          <mesh position={[-0.38, 0.56, 0.08]} castShadow>
            <boxGeometry args={[0.28, 0.24, 0.28]} />
            <meshStandardMaterial color={palette.trim} roughness={0.28} metalness={0.4} />
          </mesh>
          <mesh position={[0.08, 0.56, -0.12]} castShadow rotation={[0.2, 0.4, 0]}>
            <octahedronGeometry args={[0.22, 0]} />
            <meshStandardMaterial color={palette.accent} roughness={0.18} metalness={0.56} />
          </mesh>
          <mesh position={[0.44, 0.54, 0.18]} castShadow>
            <cylinderGeometry args={[0.06, 0.06, 0.54, 14]} />
            <meshStandardMaterial color={palette.glow} roughness={0.42} metalness={0.28} />
          </mesh>
        </>
      );
    case 'reflection-nook':
      return (
        <>
          <mesh position={[-0.22, 0.49, 0.14]} castShadow rotation={[-0.18, 0.3, 0]}>
            <boxGeometry args={[0.62, 0.03, 0.42]} />
            <meshStandardMaterial color="#f6eddc" roughness={0.82} />
          </mesh>
          <mesh position={[0.42, 0.54, -0.08]} castShadow>
            <boxGeometry args={[0.28, 0.18, 0.05]} />
            <meshStandardMaterial color={palette.accent} roughness={0.38} />
          </mesh>
          <mesh position={[0.58, 0.56, 0.22]} castShadow>
            <sphereGeometry args={[0.12, 16, 16]} />
            <meshStandardMaterial color="#6ea07c" roughness={0.78} />
          </mesh>
        </>
      );
    case 'club-circle':
      return (
        <>
          <mesh position={[-0.42, 0.48, 0]} castShadow>
            <boxGeometry args={[0.24, 0.12, 0.32]} />
            <meshStandardMaterial color={palette.trim} roughness={0.64} />
          </mesh>
          <mesh position={[0.06, 0.48, 0.02]} castShadow>
            <boxGeometry args={[0.24, 0.12, 0.32]} />
            <meshStandardMaterial color={palette.glow} roughness={0.64} />
          </mesh>
          <mesh position={[0.52, 0.56, -0.04]} castShadow>
            <cylinderGeometry args={[0.1, 0.1, 0.18, 18]} />
            <meshStandardMaterial color={palette.accent} roughness={0.36} metalness={0.22} />
          </mesh>
        </>
      );
    case 'field-kit':
      return (
        <>
          <mesh position={[-0.36, 0.5, 0.14]} castShadow>
            <boxGeometry args={[0.48, 0.22, 0.28]} />
            <meshStandardMaterial color={palette.trim} roughness={0.46} metalness={0.2} />
          </mesh>
          <mesh position={[0.08, 0.52, -0.1]} castShadow rotation={[0.32, 0, 0]}>
            <cylinderGeometry args={[0.08, 0.08, 0.6, 18]} />
            <meshStandardMaterial color={palette.accent} roughness={0.4} metalness={0.3} />
          </mesh>
          <mesh position={[0.56, 0.5, 0.22]} castShadow>
            <cylinderGeometry args={[0.09, 0.09, 0.22, 14]} />
            <meshStandardMaterial color={palette.glow} roughness={0.28} metalness={0.25} />
          </mesh>
        </>
      );
  }
}

function renderHeroProp(heroProp: WorkbenchHeroProp | undefined, palette: PaletteDefinition) {
  switch (heroProp) {
    case 'monitor-stack':
      return (
        <group position={[0, 1.26, -0.16]}>
          <mesh castShadow position={[-0.28, 0, 0]}>
            <boxGeometry args={[0.36, 0.26, 0.06]} />
            <meshStandardMaterial color={palette.trim} roughness={0.28} metalness={0.35} />
          </mesh>
          <mesh castShadow position={[0.18, 0.08, -0.05]}>
            <boxGeometry args={[0.44, 0.32, 0.06]} />
            <meshStandardMaterial color={palette.glow} roughness={0.22} metalness={0.4} />
          </mesh>
        </group>
      );
    case 'signal-dish':
      return (
        <group position={[0, 1.24, -0.18]}>
          <mesh castShadow rotation={[0.9, 0, 0]}>
            <torusGeometry args={[0.3, 0.04, 10, 24]} />
            <meshStandardMaterial color={palette.accent} roughness={0.28} metalness={0.5} />
          </mesh>
          <mesh castShadow position={[0, 0.04, 0]}>
            <cylinderGeometry args={[0.04, 0.04, 0.44, 12]} />
            <meshStandardMaterial color={palette.trim} roughness={0.35} metalness={0.3} />
          </mesh>
        </group>
      );
    case 'memory-orb':
      return (
        <mesh castShadow position={[0, 1.26, -0.14]}>
          <sphereGeometry args={[0.22, 20, 20]} />
          <meshStandardMaterial color={palette.glow} roughness={0.12} metalness={0.1} />
        </mesh>
      );
    case 'club-banner':
      return (
        <group position={[0, 1.3, -0.2]}>
          <mesh castShadow position={[0, -0.06, 0]}>
            <cylinderGeometry args={[0.03, 0.03, 0.54, 10]} />
            <meshStandardMaterial color={palette.trim} roughness={0.45} metalness={0.35} />
          </mesh>
          <mesh castShadow position={[0.18, 0.12, 0]}>
            <boxGeometry args={[0.44, 0.26, 0.03]} />
            <meshStandardMaterial color={palette.accent} roughness={0.55} />
          </mesh>
        </group>
      );
    case 'wayfinder-arch':
      return (
        <group position={[0, 1.24, -0.15]}>
          <mesh castShadow position={[-0.22, 0, 0]}>
            <boxGeometry args={[0.08, 0.54, 0.08]} />
            <meshStandardMaterial color={palette.trim} roughness={0.34} metalness={0.28} />
          </mesh>
          <mesh castShadow position={[0.22, 0, 0]}>
            <boxGeometry args={[0.08, 0.54, 0.08]} />
            <meshStandardMaterial color={palette.trim} roughness={0.34} metalness={0.28} />
          </mesh>
          <mesh castShadow position={[0, 0.22, 0]}>
            <boxGeometry args={[0.52, 0.08, 0.08]} />
            <meshStandardMaterial color={palette.accent} roughness={0.34} metalness={0.28} />
          </mesh>
        </group>
      );
    default:
      return null;
  }
}

function renderArchetypeTop(archetype: WorkbenchRuntimeRecord['definition']['visualRecipe']['archetype'], palette: PaletteDefinition) {
  switch (archetype) {
    case 'console-desk':
      return (
        <>
          <mesh castShadow receiveShadow position={[0, 0.42, 0]}>
            <boxGeometry args={[2.2, 0.18, 1.18]} />
            <meshStandardMaterial color={palette.top} roughness={0.56} />
          </mesh>
          <mesh castShadow position={[0, 0.84, -0.34]}>
            <boxGeometry args={[1.6, 0.72, 0.14]} />
            <meshStandardMaterial color={palette.base} roughness={0.36} metalness={0.28} />
          </mesh>
        </>
      );
    case 'atelier-worktable':
      return (
        <>
          <mesh castShadow receiveShadow position={[0, 0.4, 0]}>
            <boxGeometry args={[2.44, 0.16, 1.36]} />
            <meshStandardMaterial color={palette.top} roughness={0.62} />
          </mesh>
          <mesh castShadow position={[-0.72, 0.66, -0.24]} rotation={[0, 0, -0.22]}>
            <boxGeometry args={[0.12, 0.56, 0.12]} />
            <meshStandardMaterial color={palette.base} roughness={0.35} metalness={0.28} />
          </mesh>
          <mesh castShadow position={[0.72, 0.66, 0.24]} rotation={[0, 0, 0.22]}>
            <boxGeometry args={[0.12, 0.56, 0.12]} />
            <meshStandardMaterial color={palette.base} roughness={0.35} metalness={0.28} />
          </mesh>
        </>
      );
    case 'journal-console':
      return (
        <>
          <mesh castShadow receiveShadow position={[0, 0.4, 0]}>
            <boxGeometry args={[2.1, 0.14, 1.06]} />
            <meshStandardMaterial color={palette.top} roughness={0.68} />
          </mesh>
          <mesh castShadow position={[0, 0.64, -0.32]} rotation={[0.25, 0, 0]}>
            <boxGeometry args={[1.7, 0.18, 0.12]} />
            <meshStandardMaterial color={palette.trim} roughness={0.56} />
          </mesh>
        </>
      );
    case 'commons-table':
      return (
        <>
          <mesh castShadow receiveShadow position={[0, 0.44, 0]}>
            <cylinderGeometry args={[0.96, 1.02, 0.18, 28]} />
            <meshStandardMaterial color={palette.top} roughness={0.58} />
          </mesh>
          <mesh castShadow position={[-0.94, 0.26, 0]}>
            <cylinderGeometry args={[0.18, 0.22, 0.14, 16]} />
            <meshStandardMaterial color={palette.base} roughness={0.42} metalness={0.22} />
          </mesh>
          <mesh castShadow position={[0.94, 0.26, 0]}>
            <cylinderGeometry args={[0.18, 0.22, 0.14, 16]} />
            <meshStandardMaterial color={palette.base} roughness={0.42} metalness={0.22} />
          </mesh>
        </>
      );
    case 'field-station':
      return (
        <>
          <mesh castShadow receiveShadow position={[0, 0.4, 0]}>
            <boxGeometry args={[2.02, 0.14, 1.02]} />
            <meshStandardMaterial color={palette.top} roughness={0.58} />
          </mesh>
          <mesh castShadow position={[0.68, 0.78, -0.26]} rotation={[0.18, 0, -0.18]}>
            <boxGeometry args={[0.1, 0.84, 0.1]} />
            <meshStandardMaterial color={palette.trim} roughness={0.34} metalness={0.28} />
          </mesh>
        </>
      );
  }
}

interface WorkbenchLandmarkProps {
  workbench: WorkbenchRuntimeRecord;
  isNearby: boolean;
  isSelected: boolean;
  editorEnabled: boolean;
  onOpen: (id: string) => void;
  onSelect: (id: string) => void;
}

export function WorkbenchLandmark({
  workbench,
  isNearby,
  isSelected,
  editorEnabled,
  onOpen,
  onSelect,
}: WorkbenchLandmarkProps) {
  const rootRef = useRef<Group>(null);
  const ringMaterialRef = useRef<MeshStandardMaterial>(null);
  const heroRef = useRef<Group>(null);
  const palette = useMemo(
    () =>
      paletteMap[
        workbench.definition.visibility === 'draft' && !editorEnabled
          ? 'draft-mist'
          : workbench.definition.visualRecipe.palette
      ],
    [editorEnabled, workbench.definition.visualRecipe.palette, workbench.definition.visibility],
  );
  const accentMaterial = accentMaterialMap[workbench.definition.visualRecipe.accentMaterial];
  const issueSeverity = workbench.issues.some((issue) => issue.severity === 'error')
    ? 'error'
    : workbench.issues.length > 0
      ? 'warning'
      : 'valid';

  useFrame(({ clock }) => {
    const ringMaterial = ringMaterialRef.current;
    if (ringMaterial) {
      const pulse = 0.78 + Math.sin(clock.elapsedTime * 3 + workbench.definition.id.length) * 0.24;
      ringMaterial.emissiveIntensity = isSelected ? 1.1 + pulse * 0.75 : isNearby ? 0.85 + pulse * 0.5 : 0.26;
    }

    const hero = heroRef.current;
    if (hero) {
      const style = workbench.definition.visualRecipe.animationStyle ?? 'still';
      if (style === 'soft-orbit') {
        hero.rotation.y = clock.elapsedTime * 0.45;
      }
      if (style === 'paper-breeze') {
        hero.rotation.z = Math.sin(clock.elapsedTime * 1.1) * 0.08;
      }
      if (style === 'idle-pulse') {
        hero.position.y = Math.sin(clock.elapsedTime * 2.4) * 0.05;
      }
      if (style === 'signal-blink') {
        hero.rotation.y = Math.sin(clock.elapsedTime * 1.8) * 0.1;
      }
    }
  });

  const indicatorColor =
    issueSeverity === 'error' ? '#f48f5c' : issueSeverity === 'warning' ? '#f4cc82' : palette.accent;

  return (
    <group
      ref={rootRef}
      position={[
        workbench.placement.anchor.x,
        workbench.placement.anchor.y,
        workbench.placement.anchor.z,
      ]}
      rotation={[0, workbench.placement.rotationY, 0]}
      onPointerDown={(event) => {
        event.stopPropagation();
        onSelect(workbench.definition.id);
        onOpen(workbench.definition.id);
      }}
      onPointerOver={() => {
        document.body.style.cursor = 'pointer';
      }}
      onPointerOut={() => {
        document.body.style.cursor = 'default';
      }}
    >
      <mesh castShadow receiveShadow position={[0, 0.12, 0]}>
        <cylinderGeometry args={[1.18, 1.36, 0.26, 24]} />
        <meshStandardMaterial color={palette.base} roughness={0.52} metalness={0.18} />
      </mesh>

      <mesh position={[0, 0.22, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.08, 0.08, 10, 32]} />
        <meshStandardMaterial
          ref={ringMaterialRef}
          color={indicatorColor}
          emissive={indicatorColor}
          emissiveIntensity={0.34}
          roughness={accentMaterial.roughness}
          metalness={accentMaterial.metalness}
        />
      </mesh>

      <mesh castShadow position={[-0.52, 0.26, -0.26]}>
        <boxGeometry args={[0.12, 0.52, 0.12]} />
        <meshStandardMaterial color={palette.trim} roughness={0.42} metalness={0.2} />
      </mesh>
      <mesh castShadow position={[0.52, 0.26, -0.26]}>
        <boxGeometry args={[0.12, 0.52, 0.12]} />
        <meshStandardMaterial color={palette.trim} roughness={0.42} metalness={0.2} />
      </mesh>
      <mesh castShadow position={[-0.52, 0.26, 0.26]}>
        <boxGeometry args={[0.12, 0.52, 0.12]} />
        <meshStandardMaterial color={palette.trim} roughness={0.42} metalness={0.2} />
      </mesh>
      <mesh castShadow position={[0.52, 0.26, 0.26]}>
        <boxGeometry args={[0.12, 0.52, 0.12]} />
        <meshStandardMaterial color={palette.trim} roughness={0.42} metalness={0.2} />
      </mesh>

      {renderArchetypeTop(workbench.definition.visualRecipe.archetype, palette)}
      {renderPropKit(workbench.definition.visualRecipe.propKit, palette)}

      <group ref={heroRef}>{renderHeroProp(workbench.definition.visualRecipe.heroProp, palette)}</group>

      {editorEnabled && workbench.definition.visibility === 'draft' ? (
        <Html center distanceFactor={16} position={[0, 2.2, 0]}>
          <div className="landmark-tooltip landmark-tooltip--draft">Draft Bench</div>
        </Html>
      ) : null}

      {isNearby && workbench.definition.visibility === 'published' ? (
        <Html center distanceFactor={16} position={[0, 2.7, 0]}>
          <div className="landmark-tooltip">Press E or Click</div>
        </Html>
      ) : null}

      {editorEnabled && isSelected ? (
        <Html center distanceFactor={18} position={[0, 3.3, 0]}>
          <div className="landmark-tooltip landmark-tooltip--editor">{workbench.definition.title}</div>
        </Html>
      ) : null}
    </group>
  );
}
