#!/usr/bin/env node
/**
 * The bench models in src/sim/ are shared with the professional site (src/lib/sim/ in that repository). This
 * compares each pair, ignoring the first lines (each copy's own "shared with" header comment), and fails on drift.
 * Usage: npm run check:shared-sim [-- <path to the professional repository>]
 * Default path: ../portfolio-professional next to this checkout. Skips (exit 0) if that checkout is not there.
 */
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const other = resolve(process.argv[2] ?? join(here, '..', 'portfolio-professional'));
// [game file, professional file, header lines to skip in game copy, header lines to skip in professional copy]
const pairs = [
  ['src/sim/jobSim.ts', 'src/lib/sim/jobSim.ts', 3, 0],
  ['src/sim/recoveryTrace.ts', 'src/lib/sim/recoveryTrace.ts', 1, 0],
  ['src/sim/orderBookSim.ts', 'src/lib/sim/orderBook.ts', 2, 2],
  ['src/sim/backtestSim.ts', 'src/lib/sim/backtest.ts', 2, 2],
];

if (!existsSync(join(other, 'src/lib/sim'))) {
  console.log(`No professional checkout at ${other}; skipping the shared-model check.`);
  process.exit(0);
}

const body = (path, skip) => readFileSync(path, 'utf8').split('\n').slice(skip).join('\n');
let drift = 0;
for (const [game, pro, skipGame, skipPro] of pairs) {
  const same = body(join(here, game), skipGame) === body(join(other, pro), skipPro);
  console.log(`${same ? 'same ' : 'DRIFT'} ${game} <-> ${pro}`);
  if (!same) drift += 1;
}
process.exit(drift === 0 ? 0 : 1);
