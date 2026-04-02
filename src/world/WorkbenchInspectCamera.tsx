import { OrbitControls } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import type { ReactElement } from 'react';
import { Vector3 } from 'three';

import { useGameStore } from '../state/gameStore';
import {
  WORKBENCH_INSPECT_MAX_DISTANCE,
  WORKBENCH_INSPECT_MAX_POLAR_ANGLE,
  WORKBENCH_INSPECT_MIN_DISTANCE,
  WORKBENCH_INSPECT_MIN_POLAR_ANGLE,
  WORKBENCH_INSPECT_TRANSITION_SECONDS,
  getWorkbenchInspectCameraPosition,
  getWorkbenchInspectTarget,
} from './workbenchInspect';

import type { WorkbenchRuntimeRecord } from '../workbench/runtime';

interface WorkbenchInspectCameraProps {
  workbenches: WorkbenchRuntimeRecord[];
}

interface OrbitControlsHandle {
  enabled: boolean;
  target: Vector3;
  update: () => void;
}

export function WorkbenchInspectCamera({
  workbenches,
}: WorkbenchInspectCameraProps): ReactElement | null {
  const cameraMode = useGameStore((state) => state.cameraMode);
  const inspectedWorkbenchId = useGameStore((state) => state.inspectedWorkbenchId);
  const { camera } = useThree();
  const controlsRef = useRef<OrbitControlsHandle | null>(null);
  const startPositionRef = useRef(new Vector3());
  const startTargetRef = useRef(new Vector3());
  const endPositionRef = useRef(new Vector3());
  const endTargetRef = useRef(new Vector3());
  const transitionTargetRef = useRef(new Vector3());
  const transitionProgressRef = useRef(1);

  const activeWorkbench = useMemo(
    () =>
      cameraMode === 'workbench-inspect' && inspectedWorkbenchId
        ? workbenches.find((workbench) => workbench.definition.id === inspectedWorkbenchId) ?? null
        : null,
    [cameraMode, inspectedWorkbenchId, workbenches],
  );

  useEffect(() => {
    if (!activeWorkbench) {
      transitionProgressRef.current = 1;
      return;
    }

    const controls = controlsRef.current;
    const currentTarget = controls
      ? controls.target.clone()
      : camera.position
          .clone()
          .add(camera.getWorldDirection(new Vector3()).multiplyScalar(WORKBENCH_INSPECT_MAX_DISTANCE));

    startPositionRef.current.copy(camera.position);
    startTargetRef.current.copy(currentTarget);
    endTargetRef.current.copy(getWorkbenchInspectTarget(activeWorkbench.placement.anchor));
    endPositionRef.current.copy(getWorkbenchInspectCameraPosition(activeWorkbench.placement.anchor));
    transitionTargetRef.current.copy(currentTarget);
    transitionProgressRef.current = 0;

    if (controls) {
      controls.enabled = false;
    }
  }, [activeWorkbench, camera]);

  useFrame((_, delta) => {
    if (!activeWorkbench) {
      return;
    }

    const controls = controlsRef.current;
    const progress = transitionProgressRef.current;

    if (progress < 1) {
      const nextProgress = Math.min(1, progress + delta / WORKBENCH_INSPECT_TRANSITION_SECONDS);
      const easedProgress = 1 - Math.pow(1 - nextProgress, 3);
      transitionProgressRef.current = nextProgress;

      camera.position.lerpVectors(startPositionRef.current, endPositionRef.current, easedProgress);
      transitionTargetRef.current.lerpVectors(startTargetRef.current, endTargetRef.current, easedProgress);
      camera.lookAt(transitionTargetRef.current);

      if (controls) {
        controls.target.copy(transitionTargetRef.current);
        controls.update();
        controls.enabled = nextProgress >= 1;
      }
      return;
    }

    if (controls) {
      controls.update();
    }
  });

  if (!activeWorkbench) {
    return null;
  }

  return (
    <OrbitControls
      ref={(controls) => {
        controlsRef.current = controls as OrbitControlsHandle | null;
      }}
      enableDamping
      dampingFactor={0.08}
      enablePan={false}
      enableRotate
      enableZoom
      enabled={false}
      target={getWorkbenchInspectTarget(activeWorkbench.placement.anchor)}
      minDistance={WORKBENCH_INSPECT_MIN_DISTANCE}
      maxDistance={WORKBENCH_INSPECT_MAX_DISTANCE}
      minPolarAngle={WORKBENCH_INSPECT_MIN_POLAR_ANGLE}
      maxPolarAngle={WORKBENCH_INSPECT_MAX_POLAR_ANGLE}
    />
  );
}
