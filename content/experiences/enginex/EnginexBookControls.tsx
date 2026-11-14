import { MAX_PRICE, MIN_PRICE, bestAsk, bestBid, bookHash } from '../../../src/sim/orderBookSim';
import { REPLAY_SHOWN_TICKS, useEnginexBook } from '../../../src/sim/enginexBookStore';
import { useFallbackClock } from '../../../src/sim/useFallbackClock';

/**
 * Controls for the EngineX workbench's toy order book, in the details panel: send an order through the
 * sequencer and watch it sweep the ladder, then replay the journal into an empty book and compare the state.
 * Everything the scene shows is also said here in text, and the latest event is announced politely.
 */
export function EnginexBookControls() {
  const sim = useEnginexBook((state) => state.sim);
  useFallbackClock(useEnginexBook.getState);
  const replay = useEnginexBook((state) => state.replay);
  const announcement = useEnginexBook((state) => state.announcement);
  const send = useEnginexBook((state) => state.send);
  const replayJournal = useEnginexBook((state) => state.replayJournal);
  const bid = bestBid(sim);
  const ask = bestAsk(sim);
  const showReplay = replay !== null && sim.tick - replay.atTick < REPLAY_SHOWN_TICKS;

  return (
    <section className="taskforge-sim" aria-labelledby="enginex-book-title">
      <h4 id="enginex-book-title">Send an order</h4>
      <p>
        The bench is running a toy order book (the ideas EngineX is built on, not its code). Orders pass a single
        sequencer one at a time in arrival order, are recorded in the journal, and match by price and, within a price,
        by arrival. Like EngineX it takes limit orders only: send one priced to cross the book and watch it sweep the
        ladder; whatever it cannot fill rests at its limit.
      </p>
      <div className="taskforge-sim__buttons">
        <button type="button" onClick={() => send('buy')}>
          Buy 3 at {MAX_PRICE}
        </button>
        <button type="button" onClick={() => send('sell')}>
          Sell 3 at {MIN_PRICE}
        </button>
        <button type="button" className="taskforge-sim__restart" onClick={replayJournal}>
          Replay the journal
        </button>
      </div>
      <p className="taskforge-sim__status">
        Best bid {bid ?? 'none'}, best ask {ask ?? 'none'}: journal {sim.journal.length} orders, {sim.trades.length}{' '}
        fills, state {bookHash(sim)}
      </p>
      {/* The book moves every tick, so this line is not a live region; only the visitor's own actions are announced. */}
      <p className="taskforge-sim__event">
        {showReplay && replay
          ? `Replayed ${replay.entries} journal entries into an empty book: state ${replay.hash}, ${
              replay.matches ? 'the same as the live book at that point.' : 'not the same as the live book.'
            }`
          : sim.lastEvent}
      </p>
      <p className="visually-hidden" aria-live="polite">
        {announcement}
      </p>
      <ul className="taskforge-sim__legend" aria-label="Colours in the diorama">
        <li><span style={{ background: '#3f9e6e' }} /> bids (buy orders)</li>
        <li><span style={{ background: '#d8664f' }} /> asks (sell orders)</li>
        <li><span style={{ background: '#f0b44c' }} /> your orders</li>
        <li><span style={{ background: '#f3ecd8' }} /> fills</li>
      </ul>
    </section>
  );
}
