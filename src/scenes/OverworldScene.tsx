import { Canvas } from '@react-three/fiber';
import { ACESFilmicToneMapping, PCFSoftShadowMap, SRGBColorSpace } from 'three';

import { CameraRig } from '../world/CameraRig';
import { LoadedExperienceScenes } from '../world/LoadedExperienceScenes';
import { PlayerController } from '../world/PlayerController';
import { RestSpotDirector } from '../world/RestSpotDirector';
import { WorkbenchDirector } from '../world/WorkbenchDirector';
import { WorkbenchLandmark } from '../world/WorkbenchLandmark';
import { WorldEnvironment } from '../world/WorldEnvironment';
import { useGameStore } from '../state/gameStore';

import type { WorkbenchRuntimeRecord } from '../workbench/runtime';

interface OverworldSceneProps {
  workbenches: WorkbenchRuntimeRecord[];
  editorEnabled: boolean;
  selectedWorkbenchId: string | null;
  onWorkbenchOpen: (id: string) => void;
  onWorkbenchSelect: (id: string) => void;
}

export function OverworldScene({
  workbenches,
  editorEnabled,
  selectedWorkbenchId,
  onWorkbenchOpen,
  onWorkbenchSelect,
}: OverworldSceneProps) {
  const nearbyWorkbenchId = useGameStore((state) => state.nearbyWorkbenchId);

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
      <WorkbenchDirector workbenches={workbenches} />
      <RestSpotDirector />

      {workbenches.map((workbench) => (
        <WorkbenchLandmark
          key={workbench.definition.id}
          workbench={workbench}
          isNearby={nearbyWorkbenchId === workbench.definition.id}
          isSelected={selectedWorkbenchId === workbench.definition.id}
          editorEnabled={editorEnabled}
          onOpen={onWorkbenchOpen}
          onSelect={onWorkbenchSelect}
        />
      ))}

      <LoadedExperienceScenes workbenches={workbenches} />
    </Canvas>
  );
}
