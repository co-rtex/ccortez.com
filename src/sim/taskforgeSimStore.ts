import { create } from 'zustand';

import { addInput, createSim, isSettled, step, type Sim } from './jobSim';

/**
 * The live run behind the TaskForge workbench: the shared deterministic job-queue simulation, advanced on a
 * fixed tick while the bench is on screen, with visitor-triggered worker crashes. The 3D diorama and the details
 * panel's controls both read this store, so a crash pressed in the panel is seen in the scene.
 */
export const TASKFORGE_TICK_SECONDS = 0.7;
/** How long a finished run stays on display before a new seed starts. */
export const TASKFORGE_SETTLED_HOLD_SECONDS = 3;
const FIRST_SEED = 2027;

interface TaskforgeSimState {
  sim: Sim;
  /** Seconds accumulated toward the next tick. */
  pending: number;
  /** performance.now() of the last advance, so a panel can tell whether a scene is driving the model. */
  lastAdvancedAt: number;
  /** Seconds the current run has been settled. */
  settledFor: number;
  /** Advance by real time; ticks the simulation as often as whole ticks have elapsed. */
  advance: (seconds: number) => void;
  crash: (workerId: number) => void;
  restart: () => void;
}

export const useTaskforgeSim = create<TaskforgeSimState>((set, get) => ({
  sim: createSim(FIRST_SEED),
  pending: 0,
  settledFor: 0,
  lastAdvancedAt: 0,
  advance: (seconds) => {
    set({ lastAdvancedAt: performance.now() });
    const state = get();
    if (isSettled(state.sim)) {
      const settledFor = state.settledFor + seconds;
      if (settledFor >= TASKFORGE_SETTLED_HOLD_SECONDS) {
        set({ sim: createSim(state.sim.seed + 1), pending: 0, settledFor: 0 });
      } else {
        set({ settledFor });
      }
      return;
    }
    let pending = state.pending + seconds;
    let sim = state.sim;
    while (pending >= TASKFORGE_TICK_SECONDS && !isSettled(sim)) {
      pending -= TASKFORGE_TICK_SECONDS;
      sim = step(sim);
    }
    set({ sim, pending });
  },
  crash: (workerId) => {
    const { sim } = get();
    const worker = sim.workers.find((candidate) => candidate.id === workerId);
    if (!worker?.alive || isSettled(sim)) return;
    set({ sim: addInput(sim, { type: 'kill', workerId }) });
  },
  restart: () => set({ sim: createSim(get().sim.seed + 1), pending: 0, settledFor: 0 }),
}));
