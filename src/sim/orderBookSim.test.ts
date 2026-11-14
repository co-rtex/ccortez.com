import { describe, expect, it } from 'vitest';

import {
  bestAsk,
  bestBid,
  bookHash,
  createBook,
  crossingOrder,
  replayJournal,
  restingLots,
  step,
  submit,
  sequenceVisitorOrders,
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
    sim = submit({ ...sim, inbox: [] }, crossingOrder('buy', 4));
    sim = step({ ...sim, rng: 0 });
    const fills = sim.trades.filter((trade) => trade.seq === sim.nextSeq - 1);
    expect(fills.map((fill) => [fill.price, fill.maker, fill.qty])).toEqual([
      [11, 2, 2],
      [12, 4, 1],
      [12, 6, 1],
    ]);
  });

  it('sequences strictly in arrival order, refuses a full line, and can run a paused book up to a visitor order', () => {
    let sim = createBook(4);
    sim = { ...sim, inbox: [{ side: 'buy', price: 8, qty: 1 }] };
    const queued = submit(sim, crossingOrder('sell', 2));
    expect(queued.inbox.map((order) => Boolean(order.visitor))).toEqual([false, true]);
    let full = queued;
    for (let i = 0; i < 10; i += 1) full = submit(full, crossingOrder('buy', 1));
    expect(submit(full, crossingOrder('buy', 1))).toBe(full);
    const done = sequenceVisitorOrders(queued);
    expect(done.inbox.some((order) => order.visitor)).toBe(false);
    const sequenced = done.journal.slice(queued.journal.length);
    expect(sequenced[0]).toMatchObject({ side: 'buy', price: 8 });
    expect(sequenced[1]).toMatchObject({ side: 'sell', visitor: true });
  });

  it('replaying the journal reproduces the book exactly', () => {
    let sim = run(createBook(99), 60);
    sim = submit(sim, crossingOrder('sell', 3));
    sim = run(sim, 40);
    const replayed = replayJournal(sim.journal);
    expect(bookHash(replayed)).toBe(bookHash(sim));
    expect(replayed.trades).toEqual(sim.trades);
  });
});
