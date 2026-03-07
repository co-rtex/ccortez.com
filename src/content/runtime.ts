import { getExperienceById } from './registry';

import type { ExperienceSceneComponent } from '../types/experience';

const loadedSceneComponents = new Map<string, ExperienceSceneComponent>();
const loadingScenePromises = new Map<string, Promise<void>>();

export async function loadExperienceScene(id: string): Promise<void> {
  const record = getExperienceById(id);
  if (!record) {
    throw new Error(`Unable to load scene. Unknown experience id: ${id}`);
  }

  if (!record.loadScene) {
    return;
  }

  if (loadedSceneComponents.has(id)) {
    return;
  }

  const existingTask = loadingScenePromises.get(id);
  if (existingTask) {
    await existingTask;
    return;
  }

  const task = record
    .loadScene()
    .then((module) => {
      loadedSceneComponents.set(id, module.default);
    })
    .finally(() => {
      loadingScenePromises.delete(id);
    });

  loadingScenePromises.set(id, task);
  await task;
}

export function unloadExperienceScene(id: string): void {
  loadedSceneComponents.delete(id);
}

export function getLoadedSceneComponent(id: string): ExperienceSceneComponent | undefined {
  return loadedSceneComponents.get(id);
}

export function getLoadedSceneIds(): string[] {
  return Array.from(loadedSceneComponents.keys());
}

export function __resetRuntimeForTests(): void {
  loadedSceneComponents.clear();
  loadingScenePromises.clear();
}
