import { isSettled } from '../../../src/sim/jobSim';
import { useTaskforgeSim } from '../../../src/sim/taskforgeSimStore';

/**
 * Controls for the TaskForge workbench's live model, in the details panel: crash a worker and watch its lease
 * run out in the diorama while the reconciler hands the job to someone else. Every control is a real button, and
 * the latest event is announced politely, so the demonstration does not depend on seeing the 3D scene.
 */
export function TaskforgeSimControls() {
  const sim = useTaskforgeSim((state) => state.sim);
  const crash = useTaskforgeSim((state) => state.crash);
  const restart = useTaskforgeSim((state) => state.restart);
  const succeeded = sim.jobs.filter((job) => job.state === 'succeeded').length;
  const dead = sim.jobs.filter((job) => job.state === 'dead_letter').length;
  const latest = sim.events.at(-1);
  const settled = isSettled(sim);

  return (
    <section className="taskforge-sim" aria-labelledby="taskforge-sim-title">
      <h3 id="taskforge-sim-title">Crash a worker</h3>
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
            onClick={() => crash(worker.id)}
            disabled={!worker.alive || settled}
            aria-label={`Crash worker ${worker.id}${worker.jobId ? `, holding job ${worker.jobId}` : ''}`}
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
      <p className="taskforge-sim__event" aria-live="polite">
        {latest ? latest.text : 'Workers are pulling the first jobs.'}
      </p>
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
