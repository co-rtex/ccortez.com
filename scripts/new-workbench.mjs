#!/usr/bin/env node

import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

import {
  DISTRICT_DEFAULTS,
  createWorkbenchTemplate,
  defaultTitleFromId,
  insertWorkbenchIntoLayoutSource,
  renderWorkbenchEntry,
  sanitizeId,
} from './new-workbench.shared.mjs';

function parseArgs(rawArgs) {
  const args = [...rawArgs];
  const parsed = {
    id: '',
    title: '',
    district: 'projects',
    category: '',
    notes: '',
    print: false,
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

    if (token === '--district') {
      parsed.district = args.shift() ?? parsed.district;
      continue;
    }

    if (token === '--category') {
      parsed.category = args.shift() ?? '';
      continue;
    }

    if (token === '--notes') {
      parsed.notes = args.shift() ?? '';
      continue;
    }

    if (token === '--print') {
      parsed.print = true;
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

function printHelp() {
  console.log('Usage: pnpm new:workbench <id> [--title "Title"] [--district <district>] [--print]');
  console.log('Example: pnpm new:workbench bcbs-swe --title "BCBS SWE" --district work-experience');
}

async function main() {
  const parsed = parseArgs(process.argv.slice(2));
  if ('help' in parsed) {
    printHelp();
    return;
  }

  const normalizedId = sanitizeId(parsed.id);
  if (!normalizedId) {
    throw new Error('A workbench id is required. Example: pnpm new:workbench bcbs-swe');
  }

  if (!(parsed.district in DISTRICT_DEFAULTS)) {
    throw new Error(`Unknown district "${parsed.district}".`);
  }

  const title = parsed.title.trim() || defaultTitleFromId(normalizedId);
  const layoutPath = path.join(process.cwd(), 'content', 'workbenches', 'layout.ts');
  const source = await readFile(layoutPath, 'utf8');

  if (source.includes(`id: '${normalizedId}'`)) {
    throw new Error(`Workbench "${normalizedId}" already exists in content/workbenches/layout.ts`);
  }

  const entry = createWorkbenchTemplate({
    id: normalizedId,
    title,
    district: parsed.district,
    category: parsed.category || undefined,
    draftNotes: parsed.notes || undefined,
  });
  const entryBlock = renderWorkbenchEntry(entry);

  if (parsed.print) {
    console.log(entryBlock);
    return;
  }

  const nextSource = insertWorkbenchIntoLayoutSource(source, entryBlock);
  await writeFile(layoutPath, nextSource, 'utf8');
  console.log(`Added draft workbench "${normalizedId}" to content/workbenches/layout.ts`);
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : 'Unknown error';
  console.error(message);
  process.exitCode = 1;
});
