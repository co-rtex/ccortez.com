import { useAnimations, useGLTF } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { Component, Suspense, useEffect, useMemo, useRef } from 'react';
import type { MutableRefObject, ReactNode } from 'react';
import { LoopRepeat, Mesh } from 'three';
import type { AnimationAction, Group } from 'three';

import { type PlayerLocomotionState } from './playerAvatar';
import {
  PLAYER_AVATAR_ANIMATION_CROSSFADE_SECONDS,
  PLAYER_AVATAR_MODEL_PATH,
  PLAYER_AVATAR_MODEL_SCALE,
  PLAYER_AVATAR_MODEL_YAW_OFFSET,
  resolveAvailableAvatarClipName,
} from './playerAvatarModel';

interface PlayerAvatarProps {
  locomotionRef: MutableRefObject<PlayerLocomotionState>;
  visible: boolean;
}

interface PlayerAvatarBoundaryProps {
  children: ReactNode;
  fallback: ReactNode;
}

interface PlayerAvatarBoundaryState {
  hasError: boolean;
}

export function PlayerAvatar({ locomotionRef, visible }: PlayerAvatarProps) {
  const fallback = <PlayerAvatarFallback locomotionRef={locomotionRef} visible={visible} />;

  return (
    <PlayerAvatarErrorBoundary fallback={fallback}>
      <Suspense fallback={fallback}>
        <PlayerAvatarModel locomotionRef={locomotionRef} visible={visible} />
      </Suspense>
    </PlayerAvatarErrorBoundary>
  );
}

class PlayerAvatarErrorBoundary extends Component<
  PlayerAvatarBoundaryProps,
  PlayerAvatarBoundaryState
> {
  state: PlayerAvatarBoundaryState = {
    hasError: false,
  };

  static getDerivedStateFromError(): PlayerAvatarBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error): void {
    console.warn('[player-avatar] Falling back to placeholder avatar.', error);
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return this.props.fallback;
    }

    return this.props.children;
  }
}

function PlayerAvatarModel({ locomotionRef, visible }: PlayerAvatarProps) {
  const rootRef = useRef<Group>(null);
  const activeClipNameRef = useRef<string | null>(null);
  const gltf = useGLTF(PLAYER_AVATAR_MODEL_PATH);
  const modelScene = useMemo(() => gltf.scene.clone(true), [gltf.scene]);
  const { actions, names } = useAnimations(gltf.animations, modelScene);

  useEffect(() => {
    modelScene.traverse((object) => {
      if (!(object instanceof Mesh)) {
        return;
      }

      object.castShadow = true;
      object.receiveShadow = true;
      object.frustumCulled = false;
    });
  }, [modelScene]);

  useEffect(() => {
    Object.values(actions).forEach((action) => {
      action?.setLoop(LoopRepeat, Infinity);
    });

    return () => {
      Object.values(actions).forEach((action) => {
        action?.stop();
      });
    };
  }, [actions]);

  useFrame(() => {
    const root = rootRef.current;
    if (!root) {
      return;
    }

    root.visible = visible;
    root.rotation.y = locomotionRef.current.facingYaw + PLAYER_AVATAR_MODEL_YAW_OFFSET;
    if (!visible) {
      return;
    }

    const desiredClipName = resolveAvailableAvatarClipName(locomotionRef.current.mode, names);
    if (!desiredClipName || desiredClipName === activeClipNameRef.current) {
      return;
    }

    const nextAction = actions[desiredClipName];
    if (!nextAction) {
      return;
    }

    const previousAction = activeClipNameRef.current
      ? (actions[activeClipNameRef.current] ?? undefined)
      : undefined;
    activateAvatarAction(previousAction, nextAction);
    activeClipNameRef.current = desiredClipName;
  });

  return (
    <group ref={rootRef} visible={visible} scale={PLAYER_AVATAR_MODEL_SCALE}>
      <primitive object={modelScene} />
    </group>
  );
}

function PlayerAvatarFallback({ locomotionRef, visible }: PlayerAvatarProps) {
  const rootRef = useRef<Group>(null);

  useFrame(() => {
    const root = rootRef.current;
    if (!root) {
      return;
    }

    root.visible = visible;
    root.rotation.y = locomotionRef.current.facingYaw;
  });

  return (
    <group ref={rootRef} visible={visible}>
      <mesh castShadow position={[0, 1.02, 0.02]}>
        <capsuleGeometry args={[0.16, 0.46, 6, 10]} />
        <meshStandardMaterial color="#20324f" roughness={0.8} />
      </mesh>
      <mesh castShadow position={[0, 1.38, 0.03]}>
        <sphereGeometry args={[0.24, 12, 10]} />
        <meshStandardMaterial color="#d1a17d" roughness={0.85} />
      </mesh>
      <mesh castShadow position={[0, 1.53, -0.02]} scale={[0.9, 0.55, 0.62]}>
        <sphereGeometry args={[0.2, 10, 8]} />
        <meshStandardMaterial color="#3f2b22" roughness={0.9} />
      </mesh>
    </group>
  );
}

function activateAvatarAction(previousAction: AnimationAction | undefined, nextAction: AnimationAction): void {
  nextAction.enabled = true;
  nextAction.reset();
  nextAction.play();

  if (previousAction && previousAction !== nextAction) {
    nextAction.crossFadeFrom(previousAction, PLAYER_AVATAR_ANIMATION_CROSSFADE_SECONDS, true);
    previousAction.fadeOut(PLAYER_AVATAR_ANIMATION_CROSSFADE_SECONDS);
  }
}

useGLTF.preload(PLAYER_AVATAR_MODEL_PATH);
