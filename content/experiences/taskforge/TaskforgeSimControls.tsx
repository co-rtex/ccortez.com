import { isSettled } from '../../../src/sim/jobSim';
import { recoveryTrace } from '../../../src/sim/recoveryTrace';
import { useTaskforgeSim } from '../../../src/sim/taskforgeSimStore';
import { useFallbackClock } from '../../../src/sim/useFallbackClock';

/**
 * Controls for the TaskForge workbench's live model, in the details panel: crash a worker and watch its lease
 * run out in the diorama while the reconciler hands the job to someone else. Every control is a real button, and
 * the latest event is announced politely, so the demonstration does not depend on seeing the 3D scene.
 */
export function TaskforgeSimControls() {
  const sim = useTaskforgeSim((state) => state.sim);
  useFallbackClock(useTaskforgeSim.getState);
  const crash = useTaskforgeSim((state) => state.crash);
  const restart = useTaskforgeSim((state) => state.restart);
  const succeeded = sim.jobs.filter((job) => job.state === 'succeeded').length;
  const dead = sim.jobs.filter((job) => job.state === 'dead_letter').length;
  const latest = sim.events.at(-1);
  const settled = isSettled(sim);
  const trace = recoveryTrace(sim);

  return (
    <section className="taskforge-sim" aria-labelledby="taskforge-sim-title">
      <h4 id="taskforge-sim-title">Crash a worker</h4>
      <p>
        The bench is running a toy model of TaskForge&apos;s rules (the same deterministic simulation as the homepage of
        ccortez.com, not the real system). Crash a worker that is holding a job: its heartbeats stop, the lease ring
        runs down, and the reconciler gives the job to another worker.
      </p>
      <div className="taskforge-sim__buttons">
        {sim.workers.map((worker) => (
          <button
            key={worker.id}
            type="button"
            // aria-disabled rather than disabled, so the button keeps keyboard focus after it is pressed.
            onClick={() => {
              if (worker.alive && !settled) crash(worker.id);
            }}
            aria-disabled={!worker.alive || settled}
          >
            {worker.alive ? `Crash w${worker.id}` : `w${worker.id} restarting`}
          </button>
        ))}
        <button type="button" className="taskforge-sim__restart" onClick={restart}>
          New run
        </button>
      </div>
      <p className="taskforge-sim__status">
        Tick {sim.tick}: {succeeded} of {sim.jobs.length} succeeded{dead ? `, ${dead} dead-lettered` : ''}
      </p>
      {/* The run moves on its own every tick, so this line is not a live region; the crash trace is. */}
      <p className="taskforge-sim__event">
        {latest ? latest.text : 'Workers are pulling the first jobs.'}
      </p>
      {trace ? (
        <section className="taskforge-sim__trace" aria-labelledby="taskforge-trace-title">
          {/* Announces each new step of the crashed job's story (a handful per crash), not every tick. */}
          <p className="visually-hidden" aria-live="polite">
            {(() => {
              const done = trace.steps.filter((traceStep) => traceStep.tick !== null).at(-1);
              return done ? `Job ${trace.jobId}: ${done.title}.` : '';
            })()}
          </p>
          <h5 id="taskforge-trace-title">What happened to job {trace.jobId}</h5>
          <ol>
            {trace.steps.map((traceStep) => (
              <li
                key={traceStep.key}
                className={`taskforge-sim__step taskforge-sim__step--${
                  traceStep.tick === null ? 'next' : traceStep.key.split('-')[0]
                }`}
              >
                <p>
                  <span>{traceStep.tick === null ? 'next' : `tick ${traceStep.tick}`}</span>
                  {traceStep.title}
                </p>
                <p>{traceStep.detail}</p>
              </li>
            ))}
          </ol>
        </section>
      ) : null}
      <ul className="taskforge-sim__legend" aria-label="Colours in the diorama">
        <li><span style={{ background: '#ebe4d4' }} /> queued</li>
        <li><span style={{ background: '#58c08f' }} /> running</li>
        <li><span style={{ background: '#8d918c' }} /> on a crashed worker</li>
        <li><span style={{ background: '#e8b04a' }} /> waiting to retry</li>
        <li><span style={{ background: '#2f8f63' }} /> succeeded</li>
        <li><span style={{ background: '#d4513c' }} /> dead-lettered</li>
      </ul>
    </section>
  );
}
