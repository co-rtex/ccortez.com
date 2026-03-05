import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef, useState } from 'react';
import { MathUtils } from 'three';
import type { Group } from 'three';

import { resolvePlayerMovement } from '../engine/movement';
import {
  DEFAULT_MOVEMENT_SPEED_CONFIG,
  blendMovementSpeed,
  resolveMovementSpeed,
} from '../engine/playerSpeed';
import { useGameStore } from '../state/gameStore';
import type { CollisionFeedbackReason } from '../types/collisionFeedback';

import { PLAYER_START, WORLD_BOUNDS } from './constants';
import { WORLD_COLLISION_OBSTACLES } from './biome';
import { getRestSpotExitAnchor, getRestSpotSeatAnchor, getScenicRestSpotById } from './restSpots';
import {
  findNearestWalkablePoint,
  getWalkabilityBlockReason,
  getTerrainHeight,
  getWaterWalkabilityDiagnostics,
  isPointWalkable,
} from './terrain';
import type { WalkabilityBlockReason } from './terrain';

const keyMap = {
  forward: ['KeyW', 'ArrowUp'],
  backward: ['KeyS', 'ArrowDown'],
  left: ['KeyA', 'ArrowLeft'],
  right: ['KeyD', 'ArrowRight'],
  run: ['ShiftLeft', 'ShiftRight'],
} as const;
const PLAYER_COLLISION_RADIUS = 0.42;
const WATER_DEBUG_INTERVAL_MS = 300;
const COLLISION_FEEDBACK_COOLDOWN_MS = 620;
const MOVEMENT_EPSILON = 0.0001;
const SEAT_BLEND_SPEED = 8;
const BLOCKED_MOVEMENT_RATIO_THRESHOLD = 0.42;

function isWaterBoundaryReason(reason: WalkabilityBlockReason): boolean {
  return reason === 'water' || reason === 'island-boundary' || reason === 'ocean-depth';
}

function hasAnyKey(pressed: Set<string>, keys: readonly string[]): boolean {
  return keys.some((key) => pressed.has(key));
}

function readMovementInput(pressed: Set<string>): { x: number; z: number } {
  const forward = hasAnyKey(pressed, keyMap.forward) ? 1 : 0;
  const backward = hasAnyKey(pressed, keyMap.backward) ? 1 : 0;
  const left = hasAnyKey(pressed, keyMap.left) ? 1 : 0;
  const right = hasAnyKey(pressed, keyMap.right) ? 1 : 0;

  const x = right - left;
  const z = backward - forward;
  return { x, z };
}

function getDefaultKeyboardMode(): boolean {
  if (typeof window === 'undefined') {
    return true;
  }

  return window.innerWidth >= 900 && window.matchMedia('(pointer: fine)').matches;
}

export function PlayerController() {
  const groupRef = useRef<Group>(null);
  const pressedKeysRef = useRef<Set<string>>(new Set());
  const lastWaterDebugTimestampRef = useRef(0);
  const lastFeedbackTimestampByReasonRef = useRef<Record<CollisionFeedbackReason, number>>({
    water: -Number.MAX_VALUE,
    obstacle: -Number.MAX_VALUE,
  });
  const currentSpeedRef = useRef(DEFAULT_MOVEMENT_SPEED_CONFIG.walk);
  const lastSafePositionRef = useRef<{ x: number; z: number } | null>(null);
  const previousPlayerModeRef = useRef<'exploring' | 'seated'>('exploring');
  const previousActiveRestSpotIdRef = useRef<string | null>(null);
  const setPlayerPosition = useGameStore((state) => state.setPlayerPosition);
  const emitCollisionFeedback = useGameStore((state) => state.emitCollisionFeedback);
  const playerMode = useGameStore((state) => state.playerMode);
  const activeRestSpotId = useGameStore((state) => state.activeRestSpotId);
  const [keyboardMode, setKeyboardMode] = useState(getDefaultKeyboardMode);
  const debugWaterMode = useMemo(
    () =>
      typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('debugWaterCollision'),
    [],
  );
  const spawnPoint = useMemo(
    () => ({
      x: PLAYER_START.x,
      y: getTerrainHeight(PLAYER_START.x, PLAYER_START.z) + 0.82,
      z: PLAYER_START.z,
    }),
    [],
  );

  useEffect(() => {
    lastSafePositionRef.current = { x: spawnPoint.x, z: spawnPoint.z };
    setPlayerPosition(spawnPoint);
  }, [setPlayerPosition, spawnPoint]);

  useEffect(() => {
    const updateMode = (): void => {
      setKeyboardMode(getDefaultKeyboardMode());
    };

    updateMode();
    window.addEventListener('resize', updateMode);

    return () => {
      window.removeEventListener('resize', updateMode);
    };
  }, []);

  useEffect(() => {
    if (!keyboardMode) {
      pressedKeysRef.current.clear();
      return;
    }

    const handleKeyDown = (event: KeyboardEvent): void => {
      pressedKeysRef.current.add(event.code);
    };

    const handleKeyUp = (event: KeyboardEvent): void => {
      pressedKeysRef.current.delete(event.code);
    };

    const handleBlur = (): void => {
      pressedKeysRef.current.clear();
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleBlur);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleBlur);
    };
  }, [keyboardMode]);

  useFrame((_, delta) => {
    const playerGroup = groupRef.current;
    if (!playerGroup) {
      return;
    }

    const currentPosition = {
      x: playerGroup.position.x,
      y: playerGroup.position.y,
      z: playerGroup.position.z,
    };

    if (playerMode === 'seated' && activeRestSpotId) {
      const activeRestSpot = getScenicRestSpotById(activeRestSpotId);
      if (activeRestSpot) {
        const seatAnchor = getRestSpotSeatAnchor(activeRestSpot);
        const interpolation = 1 - Math.exp(-SEAT_BLEND_SPEED * delta);
        const seatedPosition = {
          x: MathUtils.lerp(currentPosition.x, seatAnchor.x, interpolation),
          y: MathUtils.lerp(currentPosition.y, seatAnchor.y, interpolation),
          z: MathUtils.lerp(currentPosition.z, seatAnchor.z, interpolation),
        };

        playerGroup.position.set(seatedPosition.x, seatedPosition.y, seatedPosition.z);
        setPlayerPosition(seatedPosition);
        previousPlayerModeRef.current = 'seated';
        previousActiveRestSpotIdRef.current = activeRestSpotId;
        return;
      }
    }

    if (previousPlayerModeRef.current === 'seated' && previousActiveRestSpotIdRef.current) {
      const previousRestSpot = getScenicRestSpotById(previousActiveRestSpotIdRef.current);
      if (previousRestSpot) {
        const exitAnchor = getRestSpotExitAnchor(previousRestSpot);
        currentPosition.x = exitAnchor.x;
        currentPosition.y = exitAnchor.y;
        currentPosition.z = exitAnchor.z;
        lastSafePositionRef.current = { x: exitAnchor.x, z: exitAnchor.z };
      }
    }
    previousPlayerModeRef.current = 'exploring';
    previousActiveRestSpotIdRef.current = activeRestSpotId;

    if (!isPointWalkable(currentPosition.x, currentPosition.z, PLAYER_COLLISION_RADIUS)) {
      const recoveredPosition =
        findNearestWalkablePoint(currentPosition.x, currentPosition.z, PLAYER_COLLISION_RADIUS) ??
        findNearestWalkablePoint(spawnPoint.x, spawnPoint.z, PLAYER_COLLISION_RADIUS);

      if (recoveredPosition) {
        currentPosition.x = recoveredPosition.x;
        currentPosition.z = recoveredPosition.z;
      }
    }

    const rawInput = readMovementInput(pressedKeysRef.current);
    const inputLength = Math.hypot(rawInput.x, rawInput.z);
    const runModifierActive = hasAnyKey(pressedKeysRef.current, keyMap.run);
    const targetSpeed = resolveMovementSpeed(keyboardMode, runModifierActive);
    currentSpeedRef.current = blendMovementSpeed(currentSpeedRef.current, targetSpeed, delta, 10);
    const movementSpeed = currentSpeedRef.current;

    const normalizedInput =
      inputLength > 0
        ? {
            x: rawInput.x / inputLength,
            z: rawInput.z / inputLength,
          }
        : {
            x: 0,
            z: 0,
          };

    const nextPosition = resolvePlayerMovement(
      currentPosition,
      {
        x: normalizedInput.x * movementSpeed * delta,
        z: normalizedInput.z * movementSpeed * delta,
      },
      WORLD_BOUNDS,
      WORLD_COLLISION_OBSTACLES,
      PLAYER_COLLISION_RADIUS,
    );

    const walkabilityBlockReason = getWalkabilityBlockReason(
      nextPosition.x,
      nextPosition.z,
      PLAYER_COLLISION_RADIUS,
    );
    if (walkabilityBlockReason !== 'none') {
      const lastSafe = lastSafePositionRef.current;
      if (lastSafe && isPointWalkable(lastSafe.x, lastSafe.z, PLAYER_COLLISION_RADIUS)) {
        nextPosition.x = lastSafe.x;
        nextPosition.z = lastSafe.z;
      } else {
        nextPosition.x = currentPosition.x;
        nextPosition.z = currentPosition.z;
      }
    }

    const attemptedMovementDistance = Math.hypot(
      normalizedInput.x * movementSpeed * delta,
      normalizedInput.z * movementSpeed * delta,
    );
    const emitCollisionFeedbackWithCooldown = (reason: CollisionFeedbackReason): void => {
      const now = performance.now();
      const previousTimestamp = lastFeedbackTimestampByReasonRef.current[reason];
      if (now - previousTimestamp > COLLISION_FEEDBACK_COOLDOWN_MS) {
        lastFeedbackTimestampByReasonRef.current[reason] = now;
        emitCollisionFeedback(reason);
      }
    };

    const resolvedMovementDistance = Math.hypot(nextPosition.x - currentPosition.x, nextPosition.z - currentPosition.z);
    const blockedBySolidBarrier =
      attemptedMovementDistance > MOVEMENT_EPSILON &&
      resolvedMovementDistance < attemptedMovementDistance * BLOCKED_MOVEMENT_RATIO_THRESHOLD;

    if (attemptedMovementDistance > MOVEMENT_EPSILON && isWaterBoundaryReason(walkabilityBlockReason)) {
      emitCollisionFeedbackWithCooldown('water');
    } else if (attemptedMovementDistance > MOVEMENT_EPSILON && (blockedBySolidBarrier || walkabilityBlockReason !== 'none')) {
      emitCollisionFeedbackWithCooldown('obstacle');
    }

    if (debugWaterMode) {
      const now = performance.now();
      if (now - lastWaterDebugTimestampRef.current > WATER_DEBUG_INTERVAL_MS) {
        lastWaterDebugTimestampRef.current = now;
        const diagnostics = getWaterWalkabilityDiagnostics(
          nextPosition.x,
          nextPosition.z,
          PLAYER_COLLISION_RADIUS,
        );
        console.debug('[water-collision]', {
          x: Number(nextPosition.x.toFixed(2)),
          z: Number(nextPosition.z.toFixed(2)),
          walkable: isPointWalkable(nextPosition.x, nextPosition.z, PLAYER_COLLISION_RADIUS),
          ...diagnostics,
        });
      }
    }

    nextPosition.y = getTerrainHeight(nextPosition.x, nextPosition.z) + 0.82;

    if (isPointWalkable(nextPosition.x, nextPosition.z, PLAYER_COLLISION_RADIUS)) {
      lastSafePositionRef.current = { x: nextPosition.x, z: nextPosition.z };
    }

    playerGroup.position.set(nextPosition.x, nextPosition.y, nextPosition.z);
    setPlayerPosition(nextPosition);
  });

  return (
    <group ref={groupRef} position={[spawnPoint.x, spawnPoint.y, spawnPoint.z]}>
      <mesh castShadow receiveShadow visible={playerMode !== 'seated'}>
        <capsuleGeometry args={[0.4, 1, 10, 16]} />
        <meshStandardMaterial color="#f4be99" roughness={0.52} metalness={0.05} />
      </mesh>
      <mesh castShadow position={[0, 0.98, 0]} visible={playerMode !== 'seated'}>
        <sphereGeometry args={[0.34, 18, 18]} />
        <meshStandardMaterial color="#2b2f4a" roughness={0.66} />
      </mesh>
    </group>
  );
}
