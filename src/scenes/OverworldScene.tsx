import { Canvas } from '@react-three/fiber';
import { ACESFilmicToneMapping, PCFSoftShadowMap, SRGBColorSpace } from 'three';

import { ExperienceDirector } from '../world/ExperienceDirector';
import { CameraRig } from '../world/CameraRig';
import { LandmarkProxy } from '../world/LandmarkProxy';
import { LoadedExperienceScenes } from '../world/LoadedExperienceScenes';
import { PlayerController } from '../world/PlayerController';
import { RestSpotDirector } from '../world/RestSpotDirector';
import { WorldEnvironment } from '../world/WorldEnvironment';
import { useGameStore } from '../state/gameStore';

import type { ExperienceRecord } from '../types/experience';

interface OverworldSceneProps {
  experiences: ExperienceRecord[];
  onLandmarkOpen: (id: string) => void;
}

export function OverworldScene({ experiences, onLandmarkOpen }: OverworldSceneProps) {
  const nearbyExperienceId = useGameStore((state) => state.nearbyExperienceId);

  return (
    <Canvas
      className="world-canvas"
      shadows
      dpr={[1, 1.6]}
      gl={{ antialias: true, powerPreference: 'high-performance' }}
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
      <ExperienceDirector experiences={experiences} />
      <RestSpotDirector />

      {experiences.map((experience) => (
        <LandmarkProxy
          key={experience.manifest.id}
          manifest={experience.manifest}
          isNearby={nearbyExperienceId === experience.manifest.id}
          onOpen={onLandmarkOpen}
        />
      ))}

      <LoadedExperienceScenes />
    </Canvas>
  );
}
