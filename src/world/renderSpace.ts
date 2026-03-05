export interface WorldXZPoint {
  x: number;
  z: number;
}

export interface PlaneXYPoint {
  x: number;
  y: number;
}

// PlaneGeometry is built in XY, then rotated by -PI/2 around X to become XZ in world space.
export function worldXZToPlaneXY(point: WorldXZPoint): PlaneXYPoint {
  return {
    x: point.x,
    y: -point.z,
  };
}

export function planeXYToWorldXZ(point: PlaneXYPoint): WorldXZPoint {
  return {
    x: point.x,
    z: -point.y,
  };
}
