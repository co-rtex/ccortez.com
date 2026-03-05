import type { ExperienceManifest, ExperienceRecord } from '../types/experience';

class ExperienceRegistry {
  private readonly recordsById = new Map<string, ExperienceRecord>();

  registerExperience(record: ExperienceRecord): void {
    if (this.recordsById.has(record.manifest.id)) {
      throw new Error(`Experience with id "${record.manifest.id}" is already registered.`);
    }

    this.recordsById.set(record.manifest.id, record);
  }

  getExperienceById(id: string): ExperienceRecord | undefined {
    return this.recordsById.get(id);
  }

  getAllExperiences(): ExperienceRecord[] {
    return Array.from(this.recordsById.values());
  }

  getPublishedExperiences(): ExperienceRecord[] {
    return this.getAllExperiences().filter((record) => record.manifest.status === 'published');
  }

  clear(): void {
    this.recordsById.clear();
  }
}

const registry = new ExperienceRegistry();

export function registerExperience(record: ExperienceRecord): void {
  registry.registerExperience(record);
}

export function getExperienceById(id: string): ExperienceRecord | undefined {
  return registry.getExperienceById(id);
}

export function getAllExperiences(): ExperienceRecord[] {
  return registry.getAllExperiences();
}

export function getPublishedExperiences(): ExperienceRecord[] {
  return registry.getPublishedExperiences();
}

export function getPublishedManifests(): ExperienceManifest[] {
  return getPublishedExperiences().map((record) => record.manifest);
}

export function __resetExperienceRegistryForTests(): void {
  registry.clear();
}
