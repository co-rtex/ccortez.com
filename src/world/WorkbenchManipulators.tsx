import { useFrame, useThree } from '@react-three/fiber';
import type { ThreeEvent } from '@react-three/fiber';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import { Group, MeshStandardMaterial, Plane, Raycaster, Vector2, Vector3 } from 'three';

import {
  updateWorkbenchHeightOffset,
  updateWorkbenchPlacementFromGroundPoint,
  updateWorkbenchRotationFromResolvedYaw,
  type WorkbenchEditorTransformMode,
} from '../workbench/editor';
import { WORKBENCH_FOOTPRINT_RADIUS, type WorkbenchRuntimeRecord } from '../workbench/runtime';

import type { WorkbenchDefinition } from '../types/workbench';

interface WorkbenchManipulatorsProps {
  workbench: WorkbenchRuntimeRecord;
  transformMode: WorkbenchEditorTransformMode;
  onUpdateWorkbench: (updater: (current: WorkbenchDefinition) => WorkbenchDefinition) => void;
  onManipulationChange?: (active: boolean) => void;
}

type DragState =
  | {
      kind: 'move';
      pointerId: number;
      planeY: number;
    }
  | {
      kind: 'rotate';
      pointerId: number;
      planeY: number;
      anchorX: number;
      anchorZ: number;
      startRotationY: number;
      startAngle: number;
    }
  | {
      kind: 'height';
      pointerId: number;
      startClientY: number;
      startYOffset: number;
    };

function normalizeAngle(angle: number): number {
  return Math.atan2(Math.sin(angle), Math.cos(angle));
}

function getIssueColor(workbench: WorkbenchRuntimeRecord): string {
  if (workbench.issues.some((issue) => issue.severity === 'error')) {
    return '#f48f5c';
  }

  if (workbench.issues.length > 0) {
    return '#f4cc82';
  }

  return '#91d5ff';
}

function getDragCursor(dragState: DragState | null, transformMode: WorkbenchEditorTransformMode): string {
  const activeKind = dragState?.kind ?? transformMode;
  if (activeKind === 'height') {
    return 'ns-resize';
  }

  return activeKind === 'rotate' ? 'grabbing' : 'move';
}

export function WorkbenchManipulators({
  workbench,
  transformMode,
  onUpdateWorkbench,
  onManipulationChange,
}: WorkbenchManipulatorsProps) {
  const rootRef = useRef<Group>(null);
  const groundRingMaterialRef = useRef<MeshStandardMaterial>(null);
  const clearanceRingMaterialRef = useRef<MeshStandardMaterial>(null);
  const moveHandleMaterialRef = useRef<MeshStandardMaterial>(null);
  const rotateRingMaterialRef = useRef<MeshStandardMaterial>(null);
  const heightHandleMaterialRef = useRef<MeshStandardMaterial>(null);
  const dragStateRef = useRef<DragState | null>(null);
  const workbenchRef = useRef(workbench);
  const raycasterRef = useRef(new Raycaster());
  const pointerRef = useRef(new Vector2());
  const intersectionRef = useRef(new Vector3());
  const planeRef = useRef(new Plane(new Vector3(0, 1, 0), 0));
  const issueColor = useMemo(() => getIssueColor(workbench), [workbench]);
  const clearanceRadius = Math.max(workbench.interactionRadius, WORKBENCH_FOOTPRINT_RADIUS + 0.85);
  const { camera, gl } = useThree();

  useEffect(() => {
    workbenchRef.current = workbench;
  }, [workbench]);

  useFrame(({ clock }) => {
    const pulse = 0.65 + Math.sin(clock.elapsedTime * 2.6) * 0.2;
    if (groundRingMaterialRef.current) {
      groundRingMaterialRef.current.emissiveIntensity = 0.2 + pulse * 0.2;
    }
    if (clearanceRingMaterialRef.current) {
      clearanceRingMaterialRef.current.emissiveIntensity = 0.15 + pulse * 0.18;
    }
    if (moveHandleMaterialRef.current) {
      moveHandleMaterialRef.current.emissiveIntensity = transformMode === 'move' ? 0.78 + pulse * 0.35 : 0.22;
    }
    if (rotateRingMaterialRef.current) {
      rotateRingMaterialRef.current.emissiveIntensity = transformMode === 'rotate' ? 0.72 + pulse * 0.38 : 0.18;
    }
    if (heightHandleMaterialRef.current) {
      heightHandleMaterialRef.current.emissiveIntensity = transformMode === 'height' ? 0.84 + pulse * 0.32 : 0.2;
    }
  });

  const setManipulationActive = useCallback((active: boolean): void => {
    onManipulationChange?.(active);
    document.body.style.cursor = active ? getDragCursor(dragStateRef.current, transformMode) : 'default';
  }, [onManipulationChange, transformMode]);

  const resolveGroundPoint = useCallback((
    clientX: number,
    clientY: number,
    planeY: number,
  ): { x: number; z: number } | null => {
    const bounds = gl.domElement.getBoundingClientRect();
    if (bounds.width <= 0 || bounds.height <= 0) {
      return null;
    }

    pointerRef.current.set(
      ((clientX - bounds.left) / bounds.width) * 2 - 1,
      -(((clientY - bounds.top) / bounds.height) * 2 - 1),
    );
    planeRef.current.setComponents(0, 1, 0, -planeY);
    raycasterRef.current.setFromCamera(pointerRef.current, camera);

    const intersection = raycasterRef.current.ray.intersectPlane(planeRef.current, intersectionRef.current);
    return intersection ? { x: intersection.x, z: intersection.z } : null;
  }, [camera, gl]);

  const clearDragState = useCallback((): void => {
    if (dragStateRef.current === null) {
      return;
    }

    dragStateRef.current = null;
    setManipulationActive(false);
  }, [setManipulationActive]);

  useEffect(() => {
    const handlePointerMove = (event: PointerEvent): void => {
      const dragState = dragStateRef.current;
      if (!dragState || dragState.pointerId !== event.pointerId) {
        return;
      }

      if (event.cancelable) {
        event.preventDefault();
      }

      if (dragState.kind === 'height') {
        onUpdateWorkbench((current) =>
          updateWorkbenchHeightOffset(
            current,
            dragState.startYOffset + (dragState.startClientY - event.clientY) * 0.012,
          ),
        );
        return;
      }

      const groundPoint = resolveGroundPoint(event.clientX, event.clientY, dragState.planeY);
      if (!groundPoint) {
        return;
      }

      if (dragState.kind === 'move') {
        onUpdateWorkbench((current) =>
          updateWorkbenchPlacementFromGroundPoint(current, groundPoint.x, groundPoint.z),
        );
        return;
      }

      const angle = Math.atan2(groundPoint.x - dragState.anchorX, groundPoint.z - dragState.anchorZ);
      const nextRotationY = dragState.startRotationY + normalizeAngle(angle - dragState.startAngle);
      onUpdateWorkbench((current) => updateWorkbenchRotationFromResolvedYaw(current, nextRotationY));
    };

    const handlePointerUp = (event: PointerEvent): void => {
      const dragState = dragStateRef.current;
      if (!dragState || dragState.pointerId !== event.pointerId) {
        return;
      }

      if (event.cancelable) {
        event.preventDefault();
      }
      clearDragState();
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('pointercancel', handlePointerUp);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointercancel', handlePointerUp);
      clearDragState();
    };
  }, [clearDragState, onUpdateWorkbench, resolveGroundPoint]);

  function beginGroundDrag(event: ThreeEvent<PointerEvent>): void {
    if (transformMode !== 'move' && transformMode !== 'rotate') {
      return;
    }

    event.stopPropagation();
    if (event.nativeEvent.cancelable) {
      event.nativeEvent.preventDefault();
    }

    const activeWorkbench = workbenchRef.current;
    const groundPoint =
      resolveGroundPoint(
        event.nativeEvent.clientX,
        event.nativeEvent.clientY,
        activeWorkbench.placement.anchor.y,
      ) ?? { x: event.point.x, z: event.point.z };

    if (transformMode === 'move') {
      dragStateRef.current = {
        kind: 'move',
        pointerId: event.pointerId,
        planeY: activeWorkbench.placement.anchor.y,
      };
    } else {
      dragStateRef.current = {
        kind: 'rotate',
        pointerId: event.pointerId,
        planeY: activeWorkbench.placement.anchor.y,
        anchorX: activeWorkbench.placement.anchor.x,
        anchorZ: activeWorkbench.placement.anchor.z,
        startRotationY: activeWorkbench.placement.rotationY,
        startAngle: Math.atan2(
          groundPoint.x - activeWorkbench.placement.anchor.x,
          groundPoint.z - activeWorkbench.placement.anchor.z,
        ),
      };
    }

    setManipulationActive(true);
  }

  function beginHeightDrag(event: ThreeEvent<PointerEvent>): void {
    if (transformMode !== 'height') {
      return;
    }

    event.stopPropagation();
    if (event.nativeEvent.cancelable) {
      event.nativeEvent.preventDefault();
    }

    dragStateRef.current = {
      kind: 'height',
      pointerId: event.pointerId,
      startClientY: event.nativeEvent.clientY,
      startYOffset: workbench.definition.placement.yOffset,
    };
    setManipulationActive(true);
  }

  return (
    <group
      ref={rootRef}
      position={[
        workbench.placement.anchor.x,
        workbench.placement.anchor.y,
        workbench.placement.anchor.z,
      ]}
    >
      <mesh position={[0, 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[WORKBENCH_FOOTPRINT_RADIUS, 48]} />
        <meshStandardMaterial
          ref={groundRingMaterialRef}
          color="#203544"
          emissive="#4ab8ff"
          emissiveIntensity={0.28}
          transparent
          opacity={0.32}
        />
      </mesh>

      <mesh position={[0, 0.07, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <torusGeometry args={[clearanceRadius, 0.045, 10, 48]} />
        <meshStandardMaterial
          ref={clearanceRingMaterialRef}
          color={issueColor}
          emissive={issueColor}
          emissiveIntensity={0.25}
          transparent
          opacity={0.9}
        />
      </mesh>

      <group rotation={[0, workbench.placement.rotationY, 0]}>
        <mesh position={[0, 0.16, -1.25]}>
          <coneGeometry args={[0.18, 0.36, 16]} />
          <meshStandardMaterial color="#f9ddb2" emissive="#f9ddb2" emissiveIntensity={0.38} />
        </mesh>
        <mesh position={[0, 0.1, -0.68]}>
          <boxGeometry args={[0.08, 0.08, 0.96]} />
          <meshStandardMaterial color="#f9ddb2" emissive="#f9ddb2" emissiveIntensity={0.22} />
        </mesh>
      </group>

      <mesh position={[0, 0.16, 0]} onPointerDown={beginGroundDrag}>
        <sphereGeometry args={[0.22, 20, 20]} />
        <meshStandardMaterial
          ref={moveHandleMaterialRef}
          color={transformMode === 'move' ? '#7fe0ff' : '#5a6f7b'}
          emissive={transformMode === 'move' ? '#7fe0ff' : '#5a6f7b'}
          emissiveIntensity={0.32}
          roughness={0.28}
          metalness={0.18}
        />
      </mesh>

      <mesh position={[0, 0.14, 0]} rotation={[-Math.PI / 2, 0, 0]} onPointerDown={beginGroundDrag}>
        <torusGeometry args={[clearanceRadius - 0.34, 0.05, 10, 56]} />
        <meshStandardMaterial
          ref={rotateRingMaterialRef}
          color={transformMode === 'rotate' ? '#f8ca74' : '#6a6772'}
          emissive={transformMode === 'rotate' ? '#f8ca74' : '#6a6772'}
          emissiveIntensity={0.24}
          transparent
          opacity={0.88}
          roughness={0.28}
          metalness={0.18}
        />
      </mesh>

      <mesh position={[0, 1.08, 0]}>
        <cylinderGeometry args={[0.045, 0.045, 1.74, 14]} />
        <meshStandardMaterial color="#93a6b5" emissive="#93a6b5" emissiveIntensity={0.18} />
      </mesh>
      <mesh position={[0, 1.96, 0]} onPointerDown={beginHeightDrag}>
        <sphereGeometry args={[0.18, 20, 20]} />
        <meshStandardMaterial
          ref={heightHandleMaterialRef}
          color={transformMode === 'height' ? '#9ef5c5' : '#61706a'}
          emissive={transformMode === 'height' ? '#9ef5c5' : '#61706a'}
          emissiveIntensity={0.28}
          roughness={0.26}
          metalness={0.14}
        />
      </mesh>
      <mesh position={[0, 1.08, 0]} onPointerDown={beginHeightDrag}>
        <cylinderGeometry args={[0.16, 0.16, 2.1, 18]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>

      <mesh
        position={[0, 0.02, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        onPointerDown={beginGroundDrag}
      >
        <circleGeometry args={[Math.max(clearanceRadius + 0.8, 3.2), 48]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
    </group>
  );
}
