import { beforeEach, describe, expect, it } from 'vitest';

import { ENGINEX_TICK_SECONDS, useEnginexBook } from './enginexBookStore';

describe('EngineX bench order book store', () => {
  beforeEach(() => useEnginexBook.getState().restart());

  it('advances one tick per whole tick of real time', () => {
    const before = useEnginexBook.getState().sim.tick;
    useEnginexBook.getState().advance(ENGINEX_TICK_SECONDS * 3.2);
    expect(useEnginexBook.getState().sim.tick).toBe(before + 3);
  });

  it('queues a visitor order for the sequencer and clears an earlier replay result', () => {
    useEnginexBook.getState().replayJournal();
    expect(useEnginexBook.getState().replay?.matches).toBe(true);
    useEnginexBook.getState().send('buy');
    expect(useEnginexBook.getState().replay).toBeNull();
    expect(useEnginexBook.getState().sim.inbox.at(-1)).toMatchObject({ side: 'buy', visitor: true, qty: 3 });
  });

  it('replays the journal to the live state after a run', () => {
    useEnginexBook.getState().send('sell');
    useEnginexBook.getState().advance(ENGINEX_TICK_SECONDS * 40);
    useEnginexBook.getState().replayJournal();
    const replay = useEnginexBook.getState().replay!;
    expect(replay.matches).toBe(true);
    expect(replay.entries).toBe(useEnginexBook.getState().sim.journal.length);
  });

  it('puts a visitor order at the back of the line, in arrival order, and announces its fills once sequenced', () => {
    useEnginexBook.getState().advance(ENGINEX_TICK_SECONDS * 5);
    const waiting = useEnginexBook.getState().sim.inbox.length;
    useEnginexBook.getState().send('sell');
    expect(useEnginexBook.getState().sim.inbox.at(-1)).toMatchObject({ side: 'sell', visitor: true });
    expect(useEnginexBook.getState().sim.inbox).toHaveLength(waiting + 1);
    useEnginexBook.getState().advance(ENGINEX_TICK_SECONDS * 8);
    expect(useEnginexBook.getState().announcement).toMatch(/your sell 3 at 6/);
  });
});
