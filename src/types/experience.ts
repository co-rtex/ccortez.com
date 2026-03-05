import type { ComponentType } from 'react';

export type ExperienceType = 'experience' | 'project';
export type ExperienceStatus = 'draft' | 'published';

export interface WorldAnchor {
  x: number;
  y: number;
  z: number;
}

export interface LoadDistances {
  preload: number;
  unload: number;
}

export interface ExperienceManifest {
  id: string;
  slug: string;
  title: string;
  type: ExperienceType;
  worldAnchor: WorldAnchor;
  triggerRadius: number;
  loadDistances: LoadDistances;
  uiContentRef: string;
  sceneModuleRef?: string;
  status: ExperienceStatus;
}

export type ExperienceStoryComponent = ComponentType;

export interface ExperienceStoryModule {
  default: ExperienceStoryComponent;
}

export interface ExperienceSceneProps {
  anchor: WorldAnchor;
  isFocused: boolean;
}

export type ExperienceSceneComponent = ComponentType<ExperienceSceneProps>;

export interface ExperienceSceneModule {
  default: ExperienceSceneComponent;
}

export interface ExperienceRecord {
  manifest: ExperienceManifest;
  loadStory: () => Promise<ExperienceStoryModule>;
  loadScene?: () => Promise<ExperienceSceneModule>;
}
