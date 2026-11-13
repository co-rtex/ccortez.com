import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import { Vector3 } from 'three';
import type { PerspectiveCamera } from 'three';

import { getBenchFramingWeight, getFollowLookAhead } from './followCamera';
import { prefersReducedMotion } from './reducedMotion';

import { useGameStore } from '../state/gameStore';
import { PLAYER_CAMERA_LOOK_HEIGHT } from './playerAvatar';
import { SCENIC_FORWARD_XZ } from './scenic';
import { getRestSpotSeatAnchor, getScenicRestSpotById } from './restSpots';

// A lower, forward-looking follow camera: the horizon, sky and distant landmarks stay in frame while the
// player sits in the lower third. The yaw is still fixed (the camera never orbits).
const followOffset = new Vector3(0, 9.6, 14.6);
const editorFocusOffset = new Vector3(0, 11.5, 11.5);
const lookOffset = new Vector3(0, PLAYER_CAMERA_LOOK_HEIGHT + 0.3, -6.2);
const DEFAULT_CAMERA_BLEND_SPEED = 6;

/** How far the look target moves toward a bench at full framing weight (0 = player, 1 = bench). */
const BENCH_FRAMING_REACH = 0.62;
const BENCH_FRAMING_BLEND_SPEED = 2.2;

interface CameraRigProps {
  /** Bench anchors by id, for framing the bench the player is standing at. */
  benchAnchors: ReadonlyMap<string, { x: number; z: number }>;
}

export function CameraRig({ benchAnchors }: CameraRigProps): null {
  const targetPosition = useMemo(() => new Vector3(), []);
  const lookTarget = useMemo(() => new Vector3(), []);
  const benchLook = useMemo(() => new Vector3(), []);
  const framingRef = useRef(0);

  useFrame(({ camera }, delta) => {
    const state = useGameStore.getState();
    let blendSpeed = DEFAULT_CAMERA_BLEND_SPEED;

    if (state.cameraMode === 'workbench-inspect') {
      return;
    }

    if (state.cameraMode === 'editor-focus' && state.playerMode === 'exploring' && state.editorCameraTarget) {
      targetPosition
        .set(state.editorCameraTarget.x, state.editorCameraTarget.y, state.editorCameraTarget.z)
        .add(editorFocusOffset);
      lookTarget.set(
        state.editorCameraTarget.x,
        state.editorCameraTarget.y + 1.4,
        state.editorCameraTarget.z,
      );

      const interpolation = 1 - Math.exp(-blendSpeed * delta);
      camera.position.lerp(targetPosition, interpolation);
      camera.lookAt(lookTarget);
      return;
    }

    if (state.cameraMode === 'seated' && state.playerMode === 'seated' && state.activeRestSpotId) {
      const activeRestSpot = getScenicRestSpotById(state.activeRestSpotId);
      if (activeRestSpot) {
        const seatAnchor = getRestSpotSeatAnchor(activeRestSpot);
        blendSpeed = activeRestSpot.scenicCamera.blendSpeed;

        targetPosition.set(
          seatAnchor.x,
          seatAnchor.y + activeRestSpot.scenicCamera.eyeHeight,
          seatAnchor.z,
        );
        lookTarget.set(
          targetPosition.x + SCENIC_FORWARD_XZ.x * activeRestSpot.scenicCamera.lookDistance,
          targetPosition.y + 0.08,
          targetPosition.z + SCENIC_FORWARD_XZ.z * activeRestSpot.scenicCamera.lookDistance,
        );

        // Reduced motion: sit down with a cut rather than a slow camera glide to the seat.
        const interpolation = prefersReducedMotion() ? 1 : 1 - Math.exp(-blendSpeed * delta);
        camera.position.lerp(targetPosition, interpolation);
        camera.lookAt(lookTarget);
        return;
      }
    }

    targetPosition.set(state.playerPosition.x, state.playerPosition.y, state.playerPosition.z).add(followOffset);
    lookOffset.z = getFollowLookAhead((camera as PerspectiveCamera).aspect ?? 1.6);
    lookTarget.set(state.playerPosition.x, state.playerPosition.y, state.playerPosition.z).add(lookOffset);

    const bench = state.nearbyWorkbenchId ? benchAnchors.get(state.nearbyWorkbenchId) ?? null : null;
    const framingGoal = getBenchFramingWeight(state.playerPosition, bench);
    framingRef.current = prefersReducedMotion()
      ? framingGoal
      : framingRef.current + (framingGoal - framingRef.current) * (1 - Math.exp(-BENCH_FRAMING_BLEND_SPEED * delta));
    if (bench && framingRef.current > 0.001) {
      benchLook.set(
        state.playerPosition.x + (bench.x - state.playerPosition.x) * BENCH_FRAMING_REACH,
        state.playerPosition.y,
        state.playerPosition.z + (bench.z - state.playerPosition.z) * BENCH_FRAMING_REACH,
      );
      lookTarget.lerp(benchLook, framingRef.current);
    }

    const interpolation = 1 - Math.exp(-blendSpeed * delta);
    camera.position.lerp(targetPosition, interpolation);
    camera.lookAt(lookTarget);
  });

  return null;
}
