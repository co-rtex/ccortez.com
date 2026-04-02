import type { ComponentType } from 'react';

export type ExperienceType = 'experience' | 'project';
export type ExperienceStatus = 'draft' | 'published';

export interface WorldAnchor {
  x: number;
  y: number;
  z: number;
}

export interface ExperienceRecruiterCard {
  roleLabel: string;
  organization?: string;
  dateRange: string;
  location?: string;
  summary: string;
  impactBullets: string[];
  techStack: string[];
}

export interface ExperienceManifest {
  id: string;
  slug: string;
  title: string;
  type: ExperienceType;
  uiContentRef: string;
  sceneModuleRef?: string;
  status: ExperienceStatus;
  recruiterCard?: ExperienceRecruiterCard;
}

export type ExperienceStoryComponent = ComponentType;

export interface ExperienceStoryModule {
  default: ExperienceStoryComponent;
}

export interface ExperienceSceneProps {
  anchor: WorldAnchor;
  rotationY: number;
  isNearby: boolean;
  isFocused: boolean;
  presentationState: ExperienceScenePresentationState;
}

export type ExperienceScenePresentationState = 'entering' | 'visible' | 'exiting';

export type ExperienceSceneComponent = ComponentType<ExperienceSceneProps>;

export interface ExperienceSceneModule {
  default: ExperienceSceneComponent;
}

export interface ExperienceRecord {
  manifest: ExperienceManifest;
  loadStory: () => Promise<ExperienceStoryModule>;
  loadScene?: () => Promise<ExperienceSceneModule>;
}
