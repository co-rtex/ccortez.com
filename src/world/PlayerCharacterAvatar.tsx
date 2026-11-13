import { useAnimations, useGLTF } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { Component, Suspense, useEffect, useMemo, useRef } from 'react';
import type { MutableRefObject, ReactNode } from 'react';
import { LoopRepeat, Mesh } from 'three';
import type { AnimationAction, Group, Material } from 'three';

import { readAvatarInspectFixture } from './avatarInspect';
import { PLAYER_AVATAR_APPEARANCE, type PlayerLocomotionState } from './playerAvatar';
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
  const inspect = useMemo(() => readAvatarInspectFixture(), []);

  useEffect(() => {
    modelScene.traverse((object) => {
      if (!(object instanceof Mesh)) {
        return;
      }

      object.castShadow = true;
      object.receiveShadow = true;
      object.frustumCulled = false;
      applyAvatarLightFloor(object.material);
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
    root.rotation.y = (inspect ? inspect.yaw : locomotionRef.current.facingYaw) + PLAYER_AVATAR_MODEL_YAW_OFFSET;
    if (!visible) {
      return;
    }

    const desiredClipName = resolveAvailableAvatarClipName(inspect?.mode ?? locomotionRef.current.mode, names);
    if (inspect?.time != null && desiredClipName) {
      // Screenshot fixture: hold the clip at a fixed time.
      const held = actions[desiredClipName];
      if (held) holdAvatarAction(held, inspect.time);
      activeClipNameRef.current = desiredClipName;
      return;
    }
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

  // A simple stand-in while the model loads (or if it fails): the same outfit colours and height, standing on the
  // ground (the player group sits 0.82 m up).
  return (
    <group ref={rootRef} visible={visible}>
      <mesh castShadow position={[0, -0.42, 0]}>
        <capsuleGeometry args={[0.12, 0.6, 6, 10]} />
        <meshStandardMaterial color={PLAYER_AVATAR_APPEARANCE.trousersColor} roughness={0.85} flatShading />
      </mesh>
      <mesh castShadow position={[0, 0.27, 0]}>
        <capsuleGeometry args={[0.17, 0.34, 6, 10]} />
        <meshStandardMaterial color={PLAYER_AVATAR_APPEARANCE.shirtColor} roughness={0.85} flatShading />
      </mesh>
      <mesh castShadow position={[0, 0.74, 0.01]}>
        <sphereGeometry args={[0.12, 12, 10]} />
        <meshStandardMaterial color={PLAYER_AVATAR_APPEARANCE.skinTone} roughness={0.85} flatShading />
      </mesh>
      <mesh castShadow position={[0, 0.82, -0.01]} scale={[1.05, 0.6, 1.05]}>
        <sphereGeometry args={[0.125, 10, 8]} />
        <meshStandardMaterial color={PLAYER_AVATAR_APPEARANCE.hairColor} roughness={0.9} flatShading />
      </mesh>
    </group>
  );
}

/**
 * A small lighting floor for the avatar only: a fraction of each surface's own colour is added as emission, so in
 * shade (under trees, on the far side of the fountain) the polo, khakis and skin keep their hues instead of sinking
 * toward black and losing the likeness. The rest of the scene is lit as before.
 */
const AVATAR_LIGHT_FLOOR = 0.12;

function applyAvatarLightFloor(material: Material | Material[]): void {
  for (const entry of Array.isArray(material) ? material : [material]) {
    if (entry.userData.avatarLightFloor) continue;
    entry.userData.avatarLightFloor = true;
    entry.onBeforeCompile = (shader) => {
      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <emissivemap_fragment>',
        `#include <emissivemap_fragment>\ntotalEmissiveRadiance += diffuseColor.rgb * ${AVATAR_LIGHT_FLOOR.toFixed(2)};`,
      );
    };
    entry.customProgramCacheKey = () => 'avatar-light-floor-v1';
    entry.needsUpdate = true;
  }
}

function holdAvatarAction(action: AnimationAction, time: number): void {
  if (!action.isRunning()) action.play();
  action.paused = true;
  action.time = time;
  action.weight = 1;
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
