import { create } from 'zustand';

import { prefersReducedMotion } from '../world/reducedMotion';
import { DATASET_VERSIONS, DAYS, runBacktest, type BacktestResult } from './backtestSim';

/**
 * The QuantLab workbench's run loop: a toy backtest reveals its equity curve day by day, holds the finished
 * result, then runs again. Left alone it alternates a re-run of the same manifest (which must reproduce it) with
 * a run on the next dataset version; the panel's buttons start either one now. Under reduced motion a run is
 * shown finished at once and nothing starts by itself.
 */
export const DAY_SECONDS = 0.16;
export const HOLD_SECONDS = 3;

export interface Run {
  id: number;
  result: BacktestResult;
  /** Set when this run used the same dataset version as the run before it. */
  reproduces: { previousId: number; same: boolean } | null;
}

type Next = 'rerun' | 'next-version';

interface QuantlabRunState {
  run: Run;
  /** Days of the current run revealed so far. */
  shown: number;
  elapsed: number;
  /** performance.now() of the last advance, so a panel can tell whether a scene is driving the model. */
  lastAdvancedAt: number;
  next: Next;
  /** Set for a run the visitor started: its result is announced once it has been drawn. */
  announceWhenDone: boolean;
  announcement: string;
  advance: (seconds: number) => void;
  queue: (next: Next) => void;
}

function startRun(previous: Run | null, version: number): Run {
  const result = runBacktest(version);
  return {
    id: (previous?.id ?? 0) + 1,
    result,
    reproduces:
      previous && previous.result.version === version
        ? { previousId: previous.id, same: previous.result.manifest === result.manifest }
        : null,
  };
}

function versionFor(next: Next, run: Run): number {
  return next === 'rerun' ? run.result.version : (run.result.version % DATASET_VERSIONS) + 1;
}

export function describeRun(run: Run): string {
  const { result } = run;
  const base = `Run ${run.id} on dataset v${result.version}: ${(result.totalReturn * 100).toFixed(1)}% return, ${(
    result.maxDrawdown * 100
  ).toFixed(1)}% largest drawdown, manifest ${result.manifest}`;
  if (!run.reproduces) return `${base}.`;
  return run.reproduces.same
    ? `${base}, identical to run ${run.reproduces.previousId}.`
    : `${base}, which does not match run ${run.reproduces.previousId}.`;
}

/** Days to show for the current run: all of them under reduced motion, where the curve is drawn finished. */
export function visibleDays(shown: number): number {
  return prefersReducedMotion() ? DAYS : shown;
}

export const useQuantlabRuns = create<QuantlabRunState>((set, get) => ({
  run: startRun(null, 1),
  shown: 0,
  elapsed: 0,
  lastAdvancedAt: 0,
  next: 'rerun',
  announceWhenDone: false,
  announcement: '',
  advance: (seconds) => {
    const state = get();
    const now = performance.now();
    const elapsed = state.elapsed + seconds;
    const shown = Math.min(DAYS, Math.floor(elapsed / DAY_SECONDS));
    const done = visibleDays(shown) >= DAYS;
    const announcement = done && state.announceWhenDone ? describeRun(state.run) : state.announcement;
    const announceWhenDone = state.announceWhenDone && !done;
    if (elapsed < DAYS * DAY_SECONDS + HOLD_SECONDS || prefersReducedMotion()) {
      set({ elapsed, shown, lastAdvancedAt: now, announcement, announceWhenDone });
      return;
    }
    set({
      run: startRun(state.run, versionFor(state.next, state.run)),
      shown: 0,
      elapsed: 0,
      lastAdvancedAt: now,
      next: state.next === 'rerun' ? 'next-version' : 'rerun',
      announcement,
      announceWhenDone: false,
    });
  },
  queue: (next) => {
    // The visitor's choice starts now; the loop then carries on with the other kind of run.
    const state = get();
    const run = startRun(state.run, versionFor(next, state.run));
    set({
      run,
      shown: 0,
      elapsed: 0,
      next: next === 'rerun' ? 'next-version' : 'rerun',
      announcement: `Run ${run.id} started on dataset v${run.result.version}.`,
      announceWhenDone: true,
    });
  },
}));
