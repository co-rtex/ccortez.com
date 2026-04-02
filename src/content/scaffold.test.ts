/// <reference types="node" />

import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { afterEach, describe, expect, it } from 'vitest';

const tempDirs: string[] = [];

function createTempDir(): string {
  const directory = mkdtempSync(path.join(tmpdir(), 'ccortez-experience-scaffold-'));
  tempDirs.push(directory);
  return directory;
}

afterEach(() => {
  while (tempDirs.length > 0) {
    const directory = tempDirs.pop();
    if (directory) {
      rmSync(directory, { recursive: true, force: true });
    }
  }
});

describe('new experience scaffolder', () => {
  it('creates manifests without legacy spatial fields', () => {
    const tempDir = createTempDir();

    execFileSync(
      process.execPath,
      [path.join(process.cwd(), 'scripts/new-experience.mjs'), 'stability-lab', '--title', 'Stability Lab'],
      {
        cwd: tempDir,
        stdio: 'pipe',
      },
    );

    const manifest = JSON.parse(
      readFileSync(
        path.join(tempDir, 'content', 'experiences', 'stability-lab', 'manifest.json'),
        'utf8',
      ),
    ) as Record<string, unknown>;

    expect(manifest).toMatchObject({
      id: 'stability-lab',
      slug: 'stability-lab',
      title: 'Stability Lab',
      type: 'experience',
      uiContentRef: 'story.mdx',
      sceneModuleRef: 'scene.tsx',
      status: 'draft',
    });
    expect(manifest).not.toHaveProperty('worldAnchor');
    expect(manifest).not.toHaveProperty('triggerRadius');
    expect(manifest).not.toHaveProperty('loadDistances');
  });
});
