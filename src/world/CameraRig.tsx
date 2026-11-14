import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import { Vector3 } from 'three';
import type { PerspectiveCamera } from 'three';

import {
  VISTA_CAMERA_OFFSET,
  VISTA_END_DISTANCE,
  VISTA_LOOK_OFFSET,
  settleVista,
  shouldOpenWithVista,
  vistaBlend,
} from './arrivalVista';
import { getBenchFramingWeight, getFollowLookAhead, getPanelViewOffset } from './followCamera';
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

/**
 * While a details panel is open, shift the rendered view so the bench sits in the middle of the part of the canvas
 * the panel leaves visible: left of a side panel, above a phone's bottom sheet. The panel's on-screen rectangle is
 * read each frame, so the shift follows its slide; it eases back to none when the panel closes.
 */
const VIEW_OFFSET_BLEND_SPEED = 7;

function getPanelViewOffsetTarget(canvas: DOMRect): { x: number; y: number } {
  const panel = document.querySelector('.experience-panel--open');
  return panel ? getPanelViewOffset(canvas, panel.getBoundingClientRect()) : { x: 0, y: 0 };
}

export function CameraRig({ benchAnchors }: CameraRigProps): null {
  const viewOffsetRef = useRef({ x: 0, y: 0, applied: false });
  const targetPosition = useMemo(() => new Vector3(), []);
  const lookTarget = useMemo(() => new Vector3(), []);
  const benchLook = useMemo(() => new Vector3(), []);
  const framingRef = useRef(0);
  // Arrival vista state: decided on the first frame; `origin` is the spawn point it frames.
  const vistaRef = useRef<{ progress: number; ended: boolean; origin: { x: number; y: number; z: number } } | null>(
    null,
  );
  const vistaPosition = useMemo(() => new Vector3(), []);
  const vistaLook = useMemo(() => new Vector3(), []);

  useFrame(({ camera, gl, size }, delta) => {
    const state = useGameStore.getState();
    let blendSpeed = DEFAULT_CAMERA_BLEND_SPEED;

    const viewOffset = viewOffsetRef.current;
    const offsetTarget =
      state.cameraMode === 'workbench-inspect'
        ? getPanelViewOffsetTarget(gl.domElement.getBoundingClientRect())
        : { x: 0, y: 0 };
    const offsetBlend = prefersReducedMotion() ? 1 : 1 - Math.exp(-VIEW_OFFSET_BLEND_SPEED * delta);
    viewOffset.x += (offsetTarget.x - viewOffset.x) * offsetBlend;
    viewOffset.y += (offsetTarget.y - viewOffset.y) * offsetBlend;
    const perspective = camera as PerspectiveCamera;
    if (Math.abs(viewOffset.x) > 0.5 || Math.abs(viewOffset.y) > 0.5) {
      perspective.setViewOffset(size.width, size.height, viewOffset.x, viewOffset.y, size.width, size.height);
      viewOffset.applied = true;
    } else if (viewOffset.applied) {
      perspective.clearViewOffset();
      viewOffset.applied = false;
    }

    // Any other camera taking over (a bench opened, sitting down, the editor) ends the arrival vista for good.
    if (vistaRef.current && state.cameraMode !== 'follow') vistaRef.current.progress = 0;

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

    // Arrival vista: hold the establishing view until the visitor moves or opens something, then ease down.
    let snap = false;
    if (vistaRef.current === null) {
      const opens = shouldOpenWithVista(window.location.search, (camera as PerspectiveCamera).aspect ?? 1);
      vistaRef.current = { progress: opens ? 1 : 0, ended: !opens, origin: { ...state.playerPosition } };
      snap = opens;
    }
    const vista = vistaRef.current;
    if (vista.progress > 0) {
      const moved = Math.hypot(state.playerPosition.x - vista.origin.x, state.playerPosition.z - vista.origin.z);
      if (!vista.ended && (moved > VISTA_END_DISTANCE || state.playerMode !== 'exploring')) vista.ended = true;
      if (vista.ended) vista.progress = settleVista(vista.progress, delta, prefersReducedMotion());
      const blend = vistaBlend(vista.progress);
      vistaPosition.set(
        vista.origin.x + VISTA_CAMERA_OFFSET.x,
        vista.origin.y + VISTA_CAMERA_OFFSET.y,
        vista.origin.z + VISTA_CAMERA_OFFSET.z,
      );
      vistaLook.set(
        vista.origin.x + VISTA_LOOK_OFFSET.x,
        vista.origin.y + VISTA_LOOK_OFFSET.y,
        vista.origin.z + VISTA_LOOK_OFFSET.z,
      );
      targetPosition.lerp(vistaPosition, blend);
      lookTarget.lerp(vistaLook, blend);
    }

    const interpolation = snap ? 1 : 1 - Math.exp(-blendSpeed * delta);
    camera.position.lerp(targetPosition, interpolation);
    camera.lookAt(lookTarget);
  });

  return null;
}
