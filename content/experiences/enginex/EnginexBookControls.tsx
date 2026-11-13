import { bestAsk, bestBid, bookHash } from '../../../src/sim/orderBookSim';
import { useEnginexBook } from '../../../src/sim/enginexBookStore';

/**
 * Controls for the EngineX workbench's toy order book, in the details panel: send a market order through the
 * sequencer and watch it sweep the ladder, then replay the journal into an empty book and compare the state.
 * Everything the scene shows is also said here in text, and the latest event is announced politely.
 */
export function EnginexBookControls() {
  const sim = useEnginexBook((state) => state.sim);
  const replay = useEnginexBook((state) => state.replay);
  const market = useEnginexBook((state) => state.market);
  const replayJournal = useEnginexBook((state) => state.replayJournal);
  const bid = bestBid(sim);
  const ask = bestAsk(sim);

  return (
    <section className="taskforge-sim" aria-labelledby="enginex-book-title">
      <h3 id="enginex-book-title">Send an order</h3>
      <p>
        The bench is running a toy order book (the ideas EngineX is built on, not its code). Orders pass a single
        sequencer one at a time, are written to the journal first, and then match by price and, within a price, by
        arrival. Send a market order and watch it sweep the ladder.
      </p>
      <div className="taskforge-sim__buttons">
        <button type="button" onClick={() => market('buy')}>
          Buy 3 at market
        </button>
        <button type="button" onClick={() => market('sell')}>
          Sell 3 at market
        </button>
        <button type="button" className="taskforge-sim__restart" onClick={replayJournal}>
          Replay the journal
        </button>
      </div>
      <p className="taskforge-sim__status">
        Best bid {bid ?? 'none'}, best ask {ask ?? 'none'}: journal {sim.journal.length} orders, {sim.trades.length}{' '}
        fills, state {bookHash(sim)}
      </p>
      <p className="taskforge-sim__event" aria-live="polite">
        {replay
          ? `Replayed ${replay.entries} journal entries into an empty book: state ${replay.hash}, ${
              replay.matches ? 'the same as the live book at that point.' : 'not the same as the live book.'
            }`
          : sim.lastEvent}
      </p>
      <ul className="taskforge-sim__legend" aria-label="Colours in the diorama">
        <li><span style={{ background: '#3f9e6e' }} /> bids (buy orders)</li>
        <li><span style={{ background: '#d8664f' }} /> asks (sell orders)</li>
        <li><span style={{ background: '#f0b44c' }} /> your market orders</li>
        <li><span style={{ background: '#f0c66a' }} /> fills</li>
      </ul>
    </section>
  );
}
