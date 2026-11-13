import { describe, expect, it } from 'vitest';

import {
  bestAsk,
  bestBid,
  bookHash,
  createBook,
  marketOrder,
  replayJournal,
  restingLots,
  step,
  submit,
  type BookSim,
} from './orderBookSim';

function run(sim: BookSim, ticks: number): BookSim {
  let next = sim;
  for (let i = 0; i < ticks; i += 1) next = step(next);
  return next;
}

describe('toy order book', () => {
  it('opens with a ladder either side of the mid price', () => {
    const sim = createBook(7);
    expect(bestBid(sim)).toBe(9);
    expect(bestAsk(sim)).toBe(11);
    expect(sim.journal).toHaveLength(8);
  });

  it('is deterministic: the same seed gives the same book', () => {
    expect(bookHash(run(createBook(42), 120))).toBe(bookHash(run(createBook(42), 120)));
  });

  it('never leaves the book crossed, and keeps it a readable size', () => {
    let sim = createBook(3);
    for (let i = 0; i < 400; i += 1) {
      sim = step(sim);
      const bid = bestBid(sim);
      const ask = bestAsk(sim);
      if (bid !== null && ask !== null) expect(bid).toBeLessThan(ask);
      expect(restingLots(sim.bids)).toBeLessThan(40);
      expect(restingLots(sim.asks)).toBeLessThan(40);
    }
  });

  it('fills the best price first and, within a price, the oldest order first', () => {
    // Asks at 11: #2 (2 lots) then #6 at 12... the opening book has two orders at 12: #4 then #6.
    let sim = createBook(1);
    sim = submit({ ...sim, inbox: [] }, marketOrder('buy', 4));
    sim = step({ ...sim, rng: 0 });
    const fills = sim.trades.filter((trade) => trade.seq === sim.nextSeq - 1);
    expect(fills.map((fill) => [fill.price, fill.maker, fill.qty])).toEqual([
      [11, 2, 2],
      [12, 4, 1],
      [12, 6, 1],
    ]);
  });

  it('replaying the journal reproduces the book exactly', () => {
    let sim = run(createBook(99), 60);
    sim = submit(sim, marketOrder('sell', 3));
    sim = run(sim, 40);
    const replayed = replayJournal(sim.journal);
    expect(bookHash(replayed)).toBe(bookHash(sim));
    expect(replayed.trades).toEqual(sim.trades);
  });
});
