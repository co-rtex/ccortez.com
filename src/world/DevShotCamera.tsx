import { useFrame } from '@react-three/fiber';
import { useMemo } from 'react';
import { Vector3 } from 'three';

/**
 * Screenshot fixture. With `?shot=px,py,pz,tx,ty,tz` in the URL the camera is pinned to that
 * position and look target after the normal camera rig runs, so before/after comparisons use identical framing.
 * Without the parameter it does nothing, so it is safe to ship.
 */
function parseShot(): { position: Vector3; target: Vector3 } | null {
  if (typeof window === 'undefined') return null;
  const raw = new URLSearchParams(window.location.search).get('shot');
  if (!raw) return null;
  const values = raw.split(',').map(Number);
  if (values.length !== 6 || values.some((value) => !Number.isFinite(value))) return null;
  const [px, py, pz, tx, ty, tz] = values as [number, number, number, number, number, number];
  return { position: new Vector3(px, py, pz), target: new Vector3(tx, ty, tz) };
}

export function DevShotCamera(): null {
  const shot = useMemo(() => parseShot(), []);

  useFrame(({ camera }) => {
    if (!shot) return;
    camera.position.copy(shot.position);
    camera.lookAt(shot.target);
  });

  return null;
}
