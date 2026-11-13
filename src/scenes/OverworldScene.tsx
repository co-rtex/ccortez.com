import { PerformanceMonitor } from '@react-three/drei';
import { Canvas } from '@react-three/fiber';
import { ACESFilmicToneMapping, BasicShadowMap, PCFShadowMap, SRGBColorSpace } from 'three';
import { useState } from 'react';

import { CameraRig } from '../world/CameraRig';
import { DevShotCamera } from '../world/DevShotCamera';
import { SceneTelemetry } from '../world/SceneTelemetry';
import { hasPerfFlag } from '../world/perfFlags';
import { ShadowScheduler } from '../world/ShadowScheduler';
import { StartHereBeacon } from '../world/landmarks/StartHereBeacon';
import { FootstepDust } from '../world/FootstepDust';
import { LoadedExperienceScenes } from '../world/LoadedExperienceScenes';
import { PlayerController } from '../world/PlayerController';
import { RestSpotDirector } from '../world/RestSpotDirector';
import { RecruiterArcMarkers } from '../world/RecruiterArcMarkers';
import { WorkbenchInspectCamera } from '../world/WorkbenchInspectCamera';
import { WorkbenchDirector } from '../world/WorkbenchDirector';
import { WorkbenchLandmark } from '../world/WorkbenchLandmark';
import { WorkbenchManipulators } from '../world/WorkbenchManipulators';
import { WorldEnvironment } from '../world/WorldEnvironment';
import { useGameStore } from '../state/gameStore';
import type { WorkbenchEditorTransformMode } from '../workbench/editor';

import type { WorkbenchRuntimeRecord } from '../workbench/runtime';
import type { WorkbenchDefinition } from '../types/workbench';

const MAX_DPR = 1.6;

interface OverworldSceneProps {
  workbenches: WorkbenchRuntimeRecord[];
  editorEnabled: boolean;
  editorTransformMode: WorkbenchEditorTransformMode;
  selectedWorkbenchId: string | null;
  onWorkbenchOpen: (id: string) => void;
  onWorkbenchSelect: (id: string) => void;
  onWorkbenchUpdate: (id: string, updater: (current: WorkbenchDefinition) => WorkbenchDefinition) => void;
}

export function OverworldScene({
  workbenches,
  editorEnabled,
  editorTransformMode,
  selectedWorkbenchId,
  onWorkbenchOpen,
  onWorkbenchSelect,
  onWorkbenchUpdate,
}: OverworldSceneProps) {
  const nearbyWorkbenchId = useGameStore((state) => state.nearbyWorkbenchId);
  const [activeManipulationWorkbenchId, setActiveManipulationWorkbenchId] = useState<string | null>(null);
  const [dpr, setDpr] = useState<number>(MAX_DPR);
  const selectedWorkbench =
    selectedWorkbenchId
      ? workbenches.find((workbench) => workbench.definition.id === selectedWorkbenchId) ?? null
      : null;

  return (
    <Canvas
      className="world-canvas"
      // three r183 deprecated PCFSoftShadowMap and falls back to PCFShadowMap with a warning on every
      // shadow render, so request PCF directly: same output, no per-frame console spam.
      shadows={hasPerfFlag('noshadow') ? false : 'percentage'}
      dpr={hasPerfFlag('dpr1') ? 1 : dpr}
      gl={{ antialias: true, powerPreference: 'high-performance', alpha: false }}
      camera={{ position: [0, 16, 16], fov: 40, near: 0.1, far: 620 }}
      onCreated={({ gl }) => {
        gl.outputColorSpace = SRGBColorSpace;
        gl.toneMapping = ACESFilmicToneMapping;
        gl.toneMappingExposure = 0.92;
        gl.shadowMap.enabled = !hasPerfFlag('noshadow');
        gl.shadowMap.type = hasPerfFlag('shadowbasic') ? BasicShadowMap : PCFShadowMap;
        // Name the canvas itself (not its container, whose Html children include real links) so a screen
        // reader announces what the picture is and points to the text route through the same content.
        gl.domElement.setAttribute('role', 'img');
        gl.domElement.setAttribute(
          'aria-label',
          "Christian Cortez's portfolio island: a 3D world with a workbench for each project and role. The recruiter guide lists every workbench as text.",
        );
      }}
    >
      {hasPerfFlag('fixeddpr') || hasPerfFlag('dpr1') ? null : (
        // Drop to 1x pixels only when this GPU cannot keep up; fast machines keep full sharpness.
        <PerformanceMonitor
          flipflops={3}
          onDecline={() => setDpr(1)}
          onIncline={() => setDpr(MAX_DPR)}
          // After repeated flip-flops, settle on the cheaper setting rather than whichever came last.
          onFallback={() => setDpr(1)}
        />
      )}
      <SceneTelemetry />
      <ShadowScheduler />
      <WorldEnvironment />
      <PlayerController />
      <FootstepDust />
      <CameraRig />
      <DevShotCamera />
      <WorkbenchInspectCamera workbenches={workbenches} />
      <WorkbenchDirector workbenches={workbenches} />
      <RestSpotDirector />
      {!editorEnabled ? <RecruiterArcMarkers /> : null}
      {!editorEnabled ? <StartHereBeacon /> : null}

      {workbenches.map((workbench) => (
        <WorkbenchLandmark
          key={workbench.definition.id}
          workbench={workbench}
          isNearby={nearbyWorkbenchId === workbench.definition.id}
          isSelected={selectedWorkbenchId === workbench.definition.id}
          editorEnabled={editorEnabled}
          interactionsDisabled={editorEnabled && activeManipulationWorkbenchId !== null}
          onOpen={onWorkbenchOpen}
          onSelect={onWorkbenchSelect}
        />
      ))}

      {editorEnabled && selectedWorkbench ? (
        <WorkbenchManipulators
          workbench={selectedWorkbench}
          transformMode={editorTransformMode}
          onUpdateWorkbench={(updater) => onWorkbenchUpdate(selectedWorkbench.definition.id, updater)}
          onManipulationChange={(active) =>
            setActiveManipulationWorkbenchId(active ? selectedWorkbench.definition.id : null)
          }
        />
      ) : null}

      {hasPerfFlag('noscenes') ? null : <LoadedExperienceScenes workbenches={workbenches} />}
    </Canvas>
  );
}
