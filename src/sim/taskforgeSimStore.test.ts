import { beforeEach, describe, expect, it } from 'vitest';

import { isSettled } from './jobSim';
import { TASKFORGE_SETTLED_HOLD_SECONDS, TASKFORGE_TICK_SECONDS, useTaskforgeSim } from './taskforgeSimStore';

describe('TaskForge bench simulation store', () => {
  beforeEach(() => useTaskforgeSim.getState().restart());

  it('ticks once per whole tick of real time and keeps the remainder', () => {
    const before = useTaskforgeSim.getState().sim.tick;
    useTaskforgeSim.getState().advance(TASKFORGE_TICK_SECONDS * 2.5);
    expect(useTaskforgeSim.getState().sim.tick).toBe(before + 2);
    expect(useTaskforgeSim.getState().pending).toBeCloseTo(TASKFORGE_TICK_SECONDS * 0.5, 6);
  });

  it('crashes only a live worker, and the crash shows on the next tick', () => {
    useTaskforgeSim.getState().advance(TASKFORGE_TICK_SECONDS * 3);
    useTaskforgeSim.getState().crash(2);
    useTaskforgeSim.getState().advance(TASKFORGE_TICK_SECONDS);
    expect(useTaskforgeSim.getState().sim.workers.find((worker) => worker.id === 2)?.alive).toBe(false);
    const inputs = useTaskforgeSim.getState().sim;
    useTaskforgeSim.getState().crash(2);
    expect(useTaskforgeSim.getState().sim).toBe(inputs);
  });

  it('holds a finished run on display, then starts the next seed', () => {
    const seed = useTaskforgeSim.getState().sim.seed;
    for (let i = 0; i < 400 && !isSettled(useTaskforgeSim.getState().sim); i += 1) {
      useTaskforgeSim.getState().advance(TASKFORGE_TICK_SECONDS);
    }
    expect(isSettled(useTaskforgeSim.getState().sim)).toBe(true);
    useTaskforgeSim.getState().advance(TASKFORGE_SETTLED_HOLD_SECONDS / 2);
    expect(useTaskforgeSim.getState().sim.seed).toBe(seed);
    useTaskforgeSim.getState().advance(TASKFORGE_SETTLED_HOLD_SECONDS);
    expect(useTaskforgeSim.getState().sim.seed).toBe(seed + 1);
    expect(isSettled(useTaskforgeSim.getState().sim)).toBe(false);
  });
});
