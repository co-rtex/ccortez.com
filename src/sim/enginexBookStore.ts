import { create } from 'zustand';

import { bookHash, createBook, marketOrder, replayJournal, step, submit, type BookSim, type Side } from './orderBookSim';

/**
 * The live toy order book behind the EngineX workbench. The diorama and the panel's controls both read it, so a
 * market order sent from the panel is seen going through the sequencer gate and into the ladder.
 */
export const ENGINEX_TICK_SECONDS = 0.9;
const FIRST_SEED = 2026;
/** A long-running book is restarted so the journal on display stays a readable story. */
const MAX_TICKS = 600;

export interface ReplayCheck {
  entries: number;
  hash: string;
  matches: boolean;
}

interface EnginexBookState {
  sim: BookSim;
  pending: number;
  replay: ReplayCheck | null;
  advance: (seconds: number) => void;
  market: (side: Side) => void;
  replayJournal: () => void;
  restart: () => void;
}

export const useEnginexBook = create<EnginexBookState>((set, get) => ({
  sim: createBook(FIRST_SEED),
  pending: 0,
  replay: null,
  advance: (seconds) => {
    const state = get();
    let pending = state.pending + seconds;
    let sim = state.sim;
    while (pending >= ENGINEX_TICK_SECONDS) {
      pending -= ENGINEX_TICK_SECONDS;
      sim = sim.tick >= MAX_TICKS ? createBook(sim.seed + 1) : step(sim);
    }
    if (sim !== state.sim) set({ sim, pending });
    else set({ pending });
  },
  market: (side) => set({ sim: submit(get().sim, marketOrder(side, 3)), replay: null }),
  replayJournal: () => {
    const { sim } = get();
    const replayed = replayJournal(sim.journal);
    const hash = bookHash(replayed);
    set({ replay: { entries: sim.journal.length, hash, matches: hash === bookHash(sim) } });
  },
  restart: () => set({ sim: createBook(get().sim.seed + 1), pending: 0, replay: null }),
}));
