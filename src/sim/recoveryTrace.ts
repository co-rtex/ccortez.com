// Shared with the professional site (ccortez.com, src/lib/sim/recoveryTrace.ts). Keep the two copies identical.
import type { Sim, SimEvent } from "./jobSim";

/**
 * Follows the job held by the most recently crashed worker, from the crash to wherever it is now. The simulator
 * shows this beside the event log, so the recovery that TaskForge is built around reads as one story: the worker
 * dies, the database still says "running", the lease runs out, another worker claims the job with a newer fence,
 * and the job finishes. The last step is what the simulation is waiting for next, if anything.
 */
export type TraceStep = {
  key: string;
  /** Tick the step happened, or null for the step the run is still waiting for. */
  tick: number | null;
  title: string;
  detail: string;
};

export type RecoveryTrace = {
  jobId: number;
  workerId: number;
  crashTick: number;
  staleFence: number;
  steps: TraceStep[];
  outcome: "in_progress" | "recovered" | "dead_lettered";
};

export function recoveryTrace(sim: Sim): RecoveryTrace | null {
  let crash: SimEvent | undefined;
  for (let i = sim.events.length - 1; i >= 0; i -= 1) {
    const event = sim.events[i]!;
    if (event.kind === "crash" && event.jobId !== undefined) {
      crash = event;
      break;
    }
  }
  if (!crash || crash.jobId === undefined || crash.workerId === undefined || crash.fence === undefined) return null;

  const jobId = crash.jobId;
  const workerId = crash.workerId;
  const staleFence = crash.fence;
  const steps: TraceStep[] = [
    {
      key: `crash-${crash.seq}`,
      tick: crash.tick,
      title: `w${workerId} crashed holding job ${jobId}`,
      detail: `Its heartbeats stop. The queue still records job ${jobId} as running under fence ${staleFence}; nothing has noticed the crash yet.`,
    },
  ];

  let outcome: RecoveryTrace["outcome"] = "in_progress";
  let reclaimed = false;
  for (const event of sim.events) {
    if (event.seq <= crash.seq || event.jobId !== jobId) continue;
    const key = `${event.kind}-${event.seq}`;
    switch (event.kind) {
      case "lease_expired":
        steps.push({
          key,
          tick: event.tick,
          title: "Lease expired, job requeued",
          detail: `No heartbeat renewed the lease, so the reconciler took job ${jobId} back from w${workerId} and put it on the queue.`,
        });
        break;
      case "claim":
        steps.push({
          key,
          tick: event.tick,
          title: `w${event.workerId} claimed it with fence ${event.fence}`,
          detail: reclaimed
            ? `Another attempt, under a newer fence again.`
            : `Each attempt gets a newer fence. In TaskForge a late report from w${workerId}'s attempt, still carrying fence ${staleFence}, is refused as stale; this model only shows the numbers.`,
        });
        reclaimed = true;
        break;
      case "failure":
        steps.push({
          key,
          tick: event.tick,
          title: "That attempt failed",
          detail: `${capitalise(event.text)}. A failed attempt backs off before it retries; a lost lease is requeued at once. Either way the attempt is used up.`,
        });
        break;
      case "success":
        outcome = "recovered";
        steps.push({
          key,
          tick: event.tick,
          title: `w${event.workerId} finished job ${jobId}`,
          detail: `Recovered ${event.tick - crash.tick} ticks after the crash, without anything watching the crashed worker directly.`,
        });
        break;
      case "dead_letter":
        outcome = "dead_lettered";
        steps.push({
          key,
          tick: event.tick,
          title: "Out of attempts, dead-lettered",
          detail: `Job ${jobId} used all ${sim.config.maxAttempts} attempts, so it waits in the dead-letter queue for someone to look at it instead of retrying forever.`,
        });
        break;
      default:
        break;
    }
  }

  if (outcome === "in_progress") {
    const job = sim.jobs[jobId - 1];
    const holder = job?.workerId != null ? sim.workers.find((worker) => worker.id === job.workerId) : undefined;
    let waiting: Omit<TraceStep, "key" | "tick"> | null = null;
    if (job?.state === "running" && holder && !holder.alive) {
      waiting = {
        title: `Lease runs out after tick ${job.leaseUntil}`,
        detail: `Nobody will renew it: w${workerId} is down until tick ${holder.restartAt}.`,
      };
    } else if (job?.state === "running" && holder) {
      waiting = { title: `w${holder.id} is working on it`, detail: `Heartbeats keep its lease (fence ${job.fence}) alive.` };
    } else if (job?.state === "queued") {
      waiting = { title: "Waiting for a free worker", detail: "The first idle worker takes the lowest-numbered queued job." };
    } else if (job?.state === "retry_wait") {
      waiting = { title: `Backing off until tick ${job.readyAt}`, detail: "Then it goes back on the queue." };
    }
    if (waiting) steps.push({ key: "next", tick: null, ...waiting });
  }

  return { jobId, workerId, crashTick: crash.tick, staleFence, steps, outcome };
}

function capitalise(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}
