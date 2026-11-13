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
  /** Tick the replay was run at; the result is shown for a few ticks, then live events take over again. */
  atTick: number;
}

/** Ticks a replay result stays on screen. */
export const REPLAY_SHOWN_TICKS = 6;

interface EnginexBookState {
  sim: BookSim;
  pending: number;
  /** performance.now() of the last advance, so a panel can tell whether a scene is driving the model. */
  lastAdvancedAt: number;
  replay: ReplayCheck | null;
  /** What the visitor's latest market order did, once the sequencer has taken it; announced to screen readers. */
  announcement: string;
  advance: (seconds: number) => void;
  market: (side: Side) => void;
  replayJournal: () => void;
  restart: () => void;
}

export const useEnginexBook = create<EnginexBookState>((set, get) => ({
  sim: createBook(FIRST_SEED),
  pending: 0,
  replay: null,
  announcement: '',
  lastAdvancedAt: 0,
  advance: (seconds) => {
    set({ lastAdvancedAt: performance.now() });
    const state = get();
    let pending = state.pending + seconds;
    let sim = state.sim;
    let { announcement, replay } = state;
    while (pending >= ENGINEX_TICK_SECONDS) {
      pending -= ENGINEX_TICK_SECONDS;
      if (sim.tick >= MAX_TICKS) {
        sim = createBook(sim.seed + 1);
        replay = null;
      } else {
        sim = step(sim);
      }
      if (sim.journal.at(-1)?.market && sim.journal.length !== state.sim.journal.length) announcement = sim.lastEvent;
    }
    if (sim !== state.sim) set({ sim, pending, announcement, replay });
    else set({ pending });
  },
  market: (side) => {
    const { sim } = get();
    const next = submit(sim, marketOrder(side, 3));
    if (next === sim) {
      set({ announcement: 'The sequencer’s line is full; try again in a moment.' });
      return;
    }
    set({ sim: next, replay: null, announcement: `Market ${side} 3 joined the line at the sequencer.` });
  },
  replayJournal: () => {
    const { sim } = get();
    const replayed = replayJournal(sim.journal);
    const hash = bookHash(replayed);
    const replay = { entries: sim.journal.length, hash, matches: hash === bookHash(sim), atTick: sim.tick };
    set({
      replay,
      announcement: `Replayed ${replay.entries} journal entries into an empty book: state ${hash}, ${
        replay.matches ? 'the same as the live book.' : 'not the same as the live book.'
      }`,
    });
  },
  restart: () => set({ sim: createBook(get().sim.seed + 1), pending: 0, replay: null, announcement: '' }),
}));
