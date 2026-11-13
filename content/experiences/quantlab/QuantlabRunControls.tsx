import { DAYS } from '../../../src/sim/backtestSim';
import { describeRun, useQuantlabRuns } from '../../../src/sim/quantlabRunStore';

/**
 * Controls for the QuantLab workbench's toy backtest, in the details panel: re-run the same manifest (it must
 * reproduce exactly) or run on the next dataset version (it should differ). The scene's state is also said here in
 * text; only the visitor's own runs are announced.
 */
export function QuantlabRunControls() {
  const run = useQuantlabRuns((state) => state.run);
  const shown = useQuantlabRuns((state) => state.shown);
  const announcement = useQuantlabRuns((state) => state.announcement);
  const queue = useQuantlabRuns((state) => state.queue);

  return (
    <section className="taskforge-sim" aria-labelledby="quantlab-run-title">
      <h3 id="quantlab-run-title">Re-run a backtest</h3>
      <p>
        The bench runs a toy backtest on synthetic prices (the ideas QuantLab is built on, not its code). Each dataset
        version is immutable and each result carries a manifest, so re-running the same version must reproduce the
        result exactly, while another version gives a different one.
      </p>
      <div className="taskforge-sim__buttons">
        <button type="button" onClick={() => queue('rerun')}>
          Re-run the same manifest
        </button>
        <button type="button" className="taskforge-sim__restart" onClick={() => queue('next-version')}>
          Run on the next dataset version
        </button>
      </div>
      <p className="taskforge-sim__status">
        {shown < DAYS ? `Run ${run.id} on dataset v${run.result.version}: day ${shown} of ${DAYS}` : describeRun(run)}
      </p>
      <p className="visually-hidden" aria-live="polite">
        {announcement}
      </p>
      <ul className="taskforge-sim__legend" aria-label="Colours in the diorama">
        <li><span style={{ background: '#72d4c2' }} /> holding, at a new high</li>
        <li><span style={{ background: '#8e8aa6' }} /> out of the market</li>
        <li><span style={{ background: '#b98aa6' }} /> below its running peak</li>
        <li><span style={{ background: '#58c08f' }} /> manifest reproduced</li>
      </ul>
    </section>
  );
}
