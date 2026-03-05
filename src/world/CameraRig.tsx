import { useFrame } from '@react-three/fiber';
import { useMemo } from 'react';
import { Vector3 } from 'three';

import { useGameStore } from '../state/gameStore';
import { SCENIC_FORWARD_XZ } from './scenic';
import { getRestSpotSeatAnchor, getScenicRestSpotById } from './restSpots';

const followOffset = new Vector3(0, 15, 15);
const lookOffset = new Vector3(0, 1.2, 0);
const DEFAULT_CAMERA_BLEND_SPEED = 6;

export function CameraRig(): null {
  const targetPosition = useMemo(() => new Vector3(), []);
  const lookTarget = useMemo(() => new Vector3(), []);

  useFrame(({ camera }, delta) => {
    const state = useGameStore.getState();
    let blendSpeed = DEFAULT_CAMERA_BLEND_SPEED;

    if (state.playerMode === 'seated' && state.activeRestSpotId) {
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

        const interpolation = 1 - Math.exp(-blendSpeed * delta);
        camera.position.lerp(targetPosition, interpolation);
        camera.lookAt(lookTarget);
        return;
      }
    }

    targetPosition.set(state.playerPosition.x, state.playerPosition.y, state.playerPosition.z).add(followOffset);
    lookTarget.set(state.playerPosition.x, state.playerPosition.y, state.playerPosition.z).add(lookOffset);

    const interpolation = 1 - Math.exp(-blendSpeed * delta);
    camera.position.lerp(targetPosition, interpolation);
    camera.lookAt(lookTarget);
  });

  return null;
}
