import { beforeEach, describe, expect, it } from 'vitest';

import { ENGINEX_TICK_SECONDS, useEnginexBook } from './enginexBookStore';

describe('EngineX bench order book store', () => {
  beforeEach(() => useEnginexBook.getState().restart());

  it('advances one tick per whole tick of real time', () => {
    const before = useEnginexBook.getState().sim.tick;
    useEnginexBook.getState().advance(ENGINEX_TICK_SECONDS * 3.2);
    expect(useEnginexBook.getState().sim.tick).toBe(before + 3);
  });

  it('queues a market order for the sequencer and clears an earlier replay result', () => {
    useEnginexBook.getState().replayJournal();
    expect(useEnginexBook.getState().replay?.matches).toBe(true);
    useEnginexBook.getState().market('buy');
    expect(useEnginexBook.getState().replay).toBeNull();
    expect(useEnginexBook.getState().sim.inbox.at(-1)).toMatchObject({ side: 'buy', market: true, qty: 3 });
  });

  it('replays the journal to the live state after a run', () => {
    useEnginexBook.getState().market('sell');
    useEnginexBook.getState().advance(ENGINEX_TICK_SECONDS * 40);
    useEnginexBook.getState().replayJournal();
    const replay = useEnginexBook.getState().replay!;
    expect(replay.matches).toBe(true);
    expect(replay.entries).toBe(useEnginexBook.getState().sim.journal.length);
  });

  it('puts a market order at the head of the line and announces what it did once sequenced', () => {
    useEnginexBook.getState().advance(ENGINEX_TICK_SECONDS * 5);
    useEnginexBook.getState().market('sell');
    expect(useEnginexBook.getState().sim.inbox[0]).toMatchObject({ side: 'sell', market: true });
    useEnginexBook.getState().advance(ENGINEX_TICK_SECONDS);
    expect(useEnginexBook.getState().announcement).toMatch(/market sell 3/);
  });
});
