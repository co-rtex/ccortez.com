export interface ScenicDirection2D {
  x: number;
  z: number;
}

export const SCENIC_FACING_YAW = -Math.PI * 0.36;
export const SCENIC_SEATED_EYE_HEIGHT = 0.72;
export const SCENIC_SEATED_LOOK_DISTANCE = 18;
export const SCENIC_CAMERA_BLEND_SPEED = 5;

export const SCENIC_SUN_DISTANCE = 230;
export const SCENIC_SUN_HEIGHT = 24;
export const SCENIC_SUN_LIGHT_DISTANCE = 120;
export const SCENIC_SUN_LIGHT_HEIGHT = 44;

export function getDirectionFromYaw(yaw: number): ScenicDirection2D {
  return {
    x: Math.sin(yaw),
    z: Math.cos(yaw),
  };
}

export const SCENIC_FORWARD_XZ = getDirectionFromYaw(SCENIC_FACING_YAW);
export const SCENIC_RIGHT_XZ: ScenicDirection2D = {
  x: SCENIC_FORWARD_XZ.z,
  z: -SCENIC_FORWARD_XZ.x,
};
