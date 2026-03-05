#!/usr/bin/env node

import { mkdir, writeFile, access } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const rootDir = process.cwd();

function parseArgs(rawArgs) {
  const args = [...rawArgs];
  const parsed = {
    id: '',
    title: '',
    type: 'experience',
  };

  while (args.length > 0) {
    const token = args.shift();
    if (!token) {
      continue;
    }

    if (token === '--help' || token === '-h') {
      return { help: true };
    }

    if (token === '--title') {
      parsed.title = args.shift() ?? '';
      continue;
    }

    if (token === '--type') {
      const type = args.shift();
      if (type === 'experience' || type === 'project') {
        parsed.type = type;
      } else {
        throw new Error('`--type` must be either "experience" or "project".');
      }
      continue;
    }

    if (!parsed.id) {
      parsed.id = token;
      continue;
    }

    throw new Error(`Unexpected argument: ${token}`);
  }

  return parsed;
}

function sanitizeId(value) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^-|-$/g, '');
}

function defaultTitleFromId(id) {
  return id
    .split('-')
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(' ');
}

function printHelp() {
  console.log('Usage: pnpm new:experience <id> [--title "Title"] [--type experience|project]');
  console.log('Example: pnpm new:experience ssec-tech-computing --title "SSEC Technical Computing"');
}

async function ensureDoesNotExist(targetPath) {
  try {
    await access(targetPath);
    throw new Error(`Experience directory already exists: ${targetPath}`);
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT') {
      return;
    }

    throw error;
  }
}

async function main() {
  const parsed = parseArgs(process.argv.slice(2));
  if ('help' in parsed) {
    printHelp();
    return;
  }

  const normalizedId = sanitizeId(parsed.id);
  if (!normalizedId) {
    throw new Error('An experience id is required. Example: pnpm new:experience my-experience');
  }

  const title = parsed.title.trim() || defaultTitleFromId(normalizedId);
  const experienceDir = path.join(rootDir, 'content', 'experiences', normalizedId);

  await ensureDoesNotExist(experienceDir);
  await mkdir(path.join(experienceDir, 'assets'), { recursive: true });

  const manifest = {
    id: normalizedId,
    slug: normalizedId,
    title,
    type: parsed.type,
    worldAnchor: {
      x: 0,
      y: 0.2,
      z: 0,
    },
    triggerRadius: 3.5,
    loadDistances: {
      preload: 10,
      unload: 16,
    },
    uiContentRef: 'story.mdx',
    sceneModuleRef: 'scene.tsx',
    status: 'draft',
  };

  const storyTemplate = `## ${title}\n\nDescribe the narrative, technical work, and outcomes for this experience.`;

  const sceneTemplate = `import type { ExperienceSceneProps } from '../../../src/types/experience';

export default function ${normalizedId
    .split('-')
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join('')}Scene({ anchor }: ExperienceSceneProps): JSX.Element {
  return (
    <group position={[anchor.x, anchor.y, anchor.z]}>
      <mesh castShadow>
        <boxGeometry args={[2, 1.2, 2]} />
        <meshStandardMaterial color="#8fb9bf" roughness={0.55} />
      </mesh>
    </group>
  );
}
`;

  await writeFile(
    path.join(experienceDir, 'manifest.json'),
    `${JSON.stringify(manifest, null, 2)}\n`,
    'utf8',
  );
  await writeFile(path.join(experienceDir, 'story.mdx'), `${storyTemplate}\n`, 'utf8');
  await writeFile(path.join(experienceDir, 'scene.tsx'), sceneTemplate, 'utf8');
  await writeFile(path.join(experienceDir, 'assets', '.gitkeep'), '', 'utf8');

  console.log(`Created experience scaffold at content/experiences/${normalizedId}`);
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : 'Unknown error';
  console.error(message);
  process.exitCode = 1;
});
