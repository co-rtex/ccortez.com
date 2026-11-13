import { create } from 'zustand';

import { DATASET_VERSIONS, DAYS, runBacktest, type BacktestResult } from './backtestSim';

/**
 * The QuantLab workbench's run loop: a toy backtest reveals its equity curve day by day, holds the finished
 * result, then runs again. Left alone it alternates a re-run of the same manifest (which must reproduce it) with
 * a run on the next dataset version; the panel's buttons queue either one next.
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
  next: Next;
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

export const useQuantlabRuns = create<QuantlabRunState>((set, get) => ({
  run: startRun(null, 1),
  shown: 0,
  elapsed: 0,
  next: 'rerun',
  announcement: '',
  advance: (seconds) => {
    const state = get();
    const elapsed = state.elapsed + seconds;
    const shown = Math.min(DAYS, Math.floor(elapsed / DAY_SECONDS));
    if (elapsed < DAYS * DAY_SECONDS + HOLD_SECONDS) {
      if (shown !== state.shown) set({ elapsed, shown });
      else set({ elapsed });
      return;
    }
    const version =
      state.next === 'rerun' ? state.run.result.version : (state.run.result.version % DATASET_VERSIONS) + 1;
    set({
      run: startRun(state.run, version),
      shown: 0,
      elapsed: 0,
      next: state.next === 'rerun' ? 'next-version' : 'rerun',
    });
  },
  queue: (next) => {
    // Finish the current run at once, so the visitor's choice starts now.
    const state = get();
    const version = next === 'rerun' ? state.run.result.version : (state.run.result.version % DATASET_VERSIONS) + 1;
    const run = startRun(state.run, version);
    set({ run, shown: 0, elapsed: 0, next: 'next-version', announcement: describeRun(run) });
  },
}));
