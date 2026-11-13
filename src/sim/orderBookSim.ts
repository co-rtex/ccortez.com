/**
 * A toy limit-order book for the EngineX workbench: the ideas the engine is built on, small enough to watch.
 * It is not EngineX's code.
 *
 * - One sequencer: orders wait in an inbox and are taken one at a time; each gets the next sequence number.
 * - Journal first: a sequenced order is appended to the journal before it touches the book.
 * - Price-time priority: an incoming order fills against the best opposite price first and, within a price,
 *   against the oldest resting order first. What is left rests at its limit price, behind earlier orders there.
 * - Determinism: replaying the journal into an empty book reproduces the same book and the same state hash.
 */
export type Side = 'buy' | 'sell';

export interface IncomingOrder {
  side: Side;
  /** Limit price in ticks; a market order uses the far end of the price range. */
  price: number;
  qty: number;
  /** True for a visitor's market order (shown differently in the scene). */
  market?: boolean;
}

export interface RestingOrder {
  seq: number;
  qty: number;
}

export interface Level {
  price: number;
  /** Oldest first: the order at index 0 fills first. */
  orders: RestingOrder[];
}

export interface Trade {
  seq: number;
  price: number;
  qty: number;
  /** Sequence number of the resting order that was filled. */
  maker: number;
}

export interface JournalEntry extends IncomingOrder {
  seq: number;
}

export interface BookSim {
  seed: number;
  rng: number;
  tick: number;
  nextSeq: number;
  /** Best (highest) price first. */
  bids: Level[];
  /** Best (lowest) price first. */
  asks: Level[];
  inbox: IncomingOrder[];
  journal: JournalEntry[];
  trades: Trade[];
  lastEvent: string;
}

export const MIN_PRICE = 6;
export const MAX_PRICE = 14;
const INBOX_LIMIT = 4;
/** Resting lots per side above which arrivals lean toward crossing, so the book stays a readable size. */
const DEEP_BOOK_LOTS = 12;

function nextRandom(state: number): [number, number] {
  // mulberry32
  let t = (state + 0x6d2b79f5) >>> 0;
  const next = t;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return [((t ^ (t >>> 14)) >>> 0) / 4294967296, next];
}

export function createBook(seed: number): BookSim {
  const sim: BookSim = {
    seed,
    rng: seed >>> 0,
    tick: 0,
    nextSeq: 1,
    bids: [],
    asks: [],
    inbox: [],
    journal: [],
    trades: [],
    lastEvent: 'The book is empty; orders are arriving.',
  };
  // Seed a resting book either side of a mid price of 10, so the first screen already shows a ladder.
  const opening: IncomingOrder[] = [
    { side: 'buy', price: 9, qty: 2 },
    { side: 'sell', price: 11, qty: 2 },
    { side: 'buy', price: 8, qty: 3 },
    { side: 'sell', price: 12, qty: 1 },
    { side: 'buy', price: 9, qty: 1 },
    { side: 'sell', price: 12, qty: 2 },
    { side: 'buy', price: 7, qty: 2 },
    { side: 'sell', price: 13, qty: 3 },
  ];
  return opening.reduce((book, order) => sequence({ ...book, inbox: [order] }), sim);
}

export function bestBid(sim: BookSim): number | null {
  return sim.bids[0]?.price ?? null;
}

export function bestAsk(sim: BookSim): number | null {
  return sim.asks[0]?.price ?? null;
}

export function restingLots(levels: Level[]): number {
  return levels.reduce((sum, level) => sum + level.orders.reduce((inner, order) => inner + order.qty, 0), 0);
}

/**
 * Queue a visitor's order for the sequencer. It goes to the head of the line, so it is the next order sequenced;
 * if the line is full, the newest waiting arrival is dropped to make room.
 */
export function submit(sim: BookSim, order: IncomingOrder): BookSim {
  return { ...sim, inbox: [order, ...sim.inbox].slice(0, INBOX_LIMIT + 1) };
}

export function marketOrder(side: Side, qty: number): IncomingOrder {
  return { side, price: side === 'buy' ? MAX_PRICE : MIN_PRICE, qty, market: true };
}

/**
 * One tick: up to two arrivals join the inbox, then the sequencer takes the oldest order in it. Arrivals average a
 * little over one a tick, so a short line usually waits at the gate: orders queue, the sequencer does not hurry.
 */
export function step(sim: BookSim): BookSim {
  let { rng } = sim;
  const random = (): number => {
    const [value, next] = nextRandom(rng);
    rng = next;
    return value;
  };
  let inbox = sim.inbox;
  const roll = random();
  const arrivals = roll < 0.45 ? 1 : roll < 0.78 ? 2 : 0;
  for (let i = 0; i < arrivals && inbox.length < INBOX_LIMIT; i += 1) {
    inbox = [...inbox, arrival({ ...sim, inbox }, random)];
  }
  return { ...sequence({ ...sim, inbox, rng }), tick: sim.tick + 1 };
}

function arrival(sim: BookSim, random: () => number): IncomingOrder {
  // Lean toward the thinner side, so neither side of the ladder grows without bound.
  const bidLots = restingLots(sim.bids);
  const askLots = restingLots(sim.asks);
  const side: Side = random() < (askLots + 2) / (bidLots + askLots + 4) ? 'buy' : 'sell';
  const qty = 1 + Math.floor(random() * 3);
  const deep = restingLots(side === 'buy' ? sim.asks : sim.bids) > DEEP_BOOK_LOTS;
  const crosses = deep || random() < 0.3;
  const touch = side === 'buy' ? (bestAsk(sim) ?? 11) : (bestBid(sim) ?? 9);
  const away = Math.floor(random() * 3);
  // A crossing order reaches the opposite best price; a passive one rests one to three ticks behind it.
  const price = side === 'buy' ? (crosses ? touch : touch - 1 - away) : crosses ? touch : touch + 1 + away;
  return { side, price: Math.min(MAX_PRICE, Math.max(MIN_PRICE, price)), qty };
}

/** The sequencer: journal the oldest inbox order, then match it. */
function sequence(sim: BookSim): BookSim {
  const [order, ...rest] = sim.inbox;
  if (!order) return sim;
  const seq = sim.nextSeq;
  const journal = [...sim.journal, { ...order, seq }];
  const { bids, asks, trades, lastEvent } = applyOrder(sim.bids, sim.asks, sim.trades, order, seq);
  return { ...sim, inbox: rest, nextSeq: seq + 1, journal, bids, asks, trades, lastEvent };
}

function applyOrder(
  bidsIn: Level[],
  asksIn: Level[],
  tradesIn: Trade[],
  order: IncomingOrder,
  seq: number,
): Pick<BookSim, 'bids' | 'asks' | 'trades' | 'lastEvent'> {
  const bids = bidsIn.map((level) => ({ ...level, orders: level.orders.map((resting) => ({ ...resting })) }));
  const asks = asksIn.map((level) => ({ ...level, orders: level.orders.map((resting) => ({ ...resting })) }));
  const trades = [...tradesIn];
  const opposite = order.side === 'buy' ? asks : bids;
  const crosses = (price: number): boolean => (order.side === 'buy' ? price <= order.price : price >= order.price);
  let remaining = order.qty;
  let filled = 0;
  while (remaining > 0 && opposite[0] && crosses(opposite[0].price)) {
    const level = opposite[0];
    const maker = level.orders[0]!;
    const qty = Math.min(remaining, maker.qty);
    trades.push({ seq, price: level.price, qty, maker: maker.seq });
    maker.qty -= qty;
    remaining -= qty;
    filled += qty;
    if (maker.qty === 0) level.orders.shift();
    if (level.orders.length === 0) opposite.shift();
  }
  const verb = order.side === 'buy' ? 'buy' : 'sell';
  let lastEvent: string;
  if (remaining > 0 && !order.market) {
    const own = order.side === 'buy' ? bids : asks;
    let level = own.find((candidate) => candidate.price === order.price);
    if (!level) {
      level = { price: order.price, orders: [] };
      own.push(level);
      own.sort((left, right) => (order.side === 'buy' ? right.price - left.price : left.price - right.price));
    }
    level.orders.push({ seq, qty: remaining });
    lastEvent =
      filled > 0
        ? `#${seq} ${verb} ${order.qty} at ${order.price}: filled ${filled}, ${remaining} rests at ${order.price}`
        : `#${seq} ${verb} ${order.qty} at ${order.price} rests behind earlier orders at that price`;
  } else if (order.market) {
    lastEvent =
      remaining > 0
        ? `#${seq} market ${verb} ${order.qty}: filled ${filled}; the book ran out for the other ${remaining}`
        : `#${seq} market ${verb} ${order.qty}: filled against the best prices, oldest order first`;
  } else {
    lastEvent = `#${seq} ${verb} ${order.qty} at ${order.price}: filled in full`;
  }
  return { bids, asks, trades, lastEvent };
}

/** FNV-1a over the resting book: the state a replay must reproduce. */
export function bookHash(sim: Pick<BookSim, 'bids' | 'asks'>): string {
  let hash = 0x811c9dc5;
  const text = [...sim.bids, ...sim.asks]
    .map((level) => `${level.price}:${level.orders.map((order) => `${order.seq}x${order.qty}`).join(',')}`)
    .join('|');
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

/** Rebuild the book from the journal alone, in sequence order. */
export function replayJournal(journal: JournalEntry[]): Pick<BookSim, 'bids' | 'asks' | 'trades'> {
  let state: Pick<BookSim, 'bids' | 'asks' | 'trades'> = { bids: [], asks: [], trades: [] };
  for (const entry of journal) {
    const { bids, asks, trades } = applyOrder(state.bids, state.asks, state.trades, entry, entry.seq);
    state = { bids, asks, trades };
  }
  return state;
}
