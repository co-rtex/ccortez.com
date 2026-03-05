import { registerExperience } from './registry';
import { validateManifest } from './schema';

import type {
  ExperienceManifest,
  ExperienceRecord,
  ExperienceSceneModule,
  ExperienceStoryModule,
} from '../types/experience';

export interface ContentModuleMaps {
  manifestModules: Record<string, unknown>;
  storyModules: Record<string, () => Promise<ExperienceStoryModule>>;
  sceneModules: Record<string, () => Promise<ExperienceSceneModule>>;
}

const manifestGlob = import.meta.glob('/content/experiences/**/manifest.json', {
  eager: true,
  import: 'default',
});
const storyGlob = import.meta.glob<ExperienceStoryModule>('/content/experiences/**/story.mdx');
const sceneGlob = import.meta.glob<ExperienceSceneModule>('/content/experiences/**/scene.tsx');

function normalizeRef(ref: string, manifestPath: string): string {
  if (ref.startsWith('/')) {
    return ref;
  }

  const normalizedRef = ref.replace(/^\.\//, '');
  const basePath = manifestPath.slice(0, manifestPath.lastIndexOf('/') + 1);
  return `${basePath}${normalizedRef}`;
}

function normalizeManifestRefs(manifest: ExperienceManifest, manifestPath: string): ExperienceManifest {
  return {
    ...manifest,
    uiContentRef: normalizeRef(manifest.uiContentRef, manifestPath),
    sceneModuleRef: manifest.sceneModuleRef
      ? normalizeRef(manifest.sceneModuleRef, manifestPath)
      : undefined,
  };
}

export function buildExperienceRecords({
  manifestModules,
  storyModules,
  sceneModules,
}: ContentModuleMaps): ExperienceRecord[] {
  const records: ExperienceRecord[] = [];

  const sortedManifestEntries = Object.entries(manifestModules).sort(([left], [right]) =>
    left.localeCompare(right),
  );

  for (const [manifestPath, rawManifest] of sortedManifestEntries) {
    const manifest = normalizeManifestRefs(validateManifest(rawManifest), manifestPath);

    const storyLoader = storyModules[manifest.uiContentRef];
    if (!storyLoader) {
      throw new Error(
        `Experience "${manifest.id}" is missing story module: ${manifest.uiContentRef}`,
      );
    }

    let sceneLoader: (() => Promise<ExperienceSceneModule>) | undefined;
    if (manifest.sceneModuleRef) {
      sceneLoader = sceneModules[manifest.sceneModuleRef];
      if (!sceneLoader) {
        throw new Error(
          `Experience "${manifest.id}" is missing scene module: ${manifest.sceneModuleRef}`,
        );
      }
    }

    records.push({
      manifest,
      loadStory: storyLoader,
      loadScene: sceneLoader,
    });
  }

  return records;
}

let bootstrapped = false;

export function bootstrapExperienceRegistry(): ExperienceRecord[] {
  if (bootstrapped) {
    return [];
  }

  const records = buildExperienceRecords({
    manifestModules: manifestGlob,
    storyModules: storyGlob,
    sceneModules: sceneGlob,
  });

  for (const record of records) {
    registerExperience(record);
  }

  bootstrapped = true;
  return records;
}

export function __resetBootstrapFlagForTests(): void {
  bootstrapped = false;
}
