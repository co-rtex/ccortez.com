import { Canvas } from '@react-three/fiber';
import { ACESFilmicToneMapping, PCFSoftShadowMap, SRGBColorSpace } from 'three';
import { useState } from 'react';

import { CameraRig } from '../world/CameraRig';
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
  const selectedWorkbench =
    selectedWorkbenchId
      ? workbenches.find((workbench) => workbench.definition.id === selectedWorkbenchId) ?? null
      : null;

  return (
    <Canvas
      className="world-canvas"
      shadows
      dpr={[1, 1.6]}
      gl={{ antialias: true, powerPreference: 'high-performance', alpha: false }}
      camera={{ position: [0, 16, 16], fov: 40, near: 0.1, far: 360 }}
      onCreated={({ gl }) => {
        gl.outputColorSpace = SRGBColorSpace;
        gl.toneMapping = ACESFilmicToneMapping;
        gl.toneMappingExposure = 0.76;
        gl.shadowMap.enabled = true;
        gl.shadowMap.type = PCFSoftShadowMap;
      }}
    >
      <WorldEnvironment />
      <PlayerController />
      <CameraRig />
      <WorkbenchInspectCamera workbenches={workbenches} />
      <WorkbenchDirector workbenches={workbenches} />
      <RestSpotDirector />
      {!editorEnabled ? <RecruiterArcMarkers /> : null}

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

      <LoadedExperienceScenes workbenches={workbenches} />
    </Canvas>
  );
}
