// Shared with the professional site (ccortez.com, src/lib/sim/jobSim.ts): the same deterministic toy model of
// TaskForge's lease, heartbeat, retry and dead-letter rules drives its homepage simulator and the island's
// TaskForge workbench. Keep the two copies identical.
/**
 * A small deterministic simulation of a durable job queue.
 *
 * Workers pull jobs, hold them under a lease, heartbeat while running, and
 * report an outcome. A crashed worker stops heartbeating; once its lease
 * expires a reconciler requeues the job for another attempt. Handler failures
 * retry with exponential backoff until a dead-letter limit.
 *
 * The same seed and the same list of inputs always produce the same event
 * history and the same history hash. The UI uses that to replay a run.
 */

export type JobState = "queued" | "running" | "retry_wait" | "succeeded" | "dead_letter";

export type Job = {
  id: number;
  state: JobState;
  attempt: number;
  workLeft: number;
  readyAt: number;
  workerId: number | null;
  leaseUntil: number;
  fence: number;
};

export type Worker = {
  id: number;
  alive: boolean;
  jobId: number | null;
  restartAt: number;
  session: number;
};

export type SimEvent = {
  seq: number;
  tick: number;
  kind: "claim" | "success" | "failure" | "dead_letter" | "crash" | "restart" | "lease_expired" | "retry_ready";
  text: string;
};

export type SimInput = { tick: number; type: "kill"; workerId: number };

export type SimConfig = {
  jobs: number;
  workers: number;
  /** Ticks a lease lasts without a heartbeat. */
  leaseTicks: number;
  /** Ticks before a crashed worker comes back with a new session. */
  restartTicks: number;
  maxAttempts: number;
  /** Probability that one attempt's handler fails. */
  failureRate: number;
};

export type Sim = {
  seed: number;
  config: SimConfig;
  tick: number;
  rng: number;
  nextFence: number;
  jobs: Job[];
  workers: Worker[];
  events: SimEvent[];
  hash: number;
  inputs: SimInput[];
};

export const DEFAULT_CONFIG: SimConfig = {
  jobs: 18,
  workers: 3,
  leaseTicks: 3,
  restartTicks: 6,
  maxAttempts: 3,
  failureRate: 0.14,
};

const FNV_OFFSET = 0x811c9dc5;
const FNV_PRIME = 0x01000193;

function fnv1a(hash: number, text: string): number {
  let h = hash;
  for (let i = 0; i < text.length; i += 1) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, FNV_PRIME) >>> 0;
  }
  return h >>> 0;
}

/** mulberry32: returns [value in [0, 1), next state]. */
function nextRandom(state: number): [number, number] {
  const next = (state + 0x6d2b79f5) >>> 0;
  let t = next;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  const value = ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  return [value, next];
}

export function createSim(seed: number, config: SimConfig = DEFAULT_CONFIG, inputs: SimInput[] = []): Sim {
  return {
    seed,
    config,
    tick: 0,
    rng: seed >>> 0,
    nextFence: 1,
    jobs: Array.from({ length: config.jobs }, (_, i) => ({
      id: i + 1,
      state: "queued" as const,
      attempt: 0,
      workLeft: 0,
      readyAt: 0,
      workerId: null,
      leaseUntil: 0,
      fence: 0,
    })),
    workers: Array.from({ length: config.workers }, (_, i) => ({
      id: i + 1,
      alive: true,
      jobId: null,
      restartAt: 0,
      session: 1,
    })),
    events: [],
    hash: FNV_OFFSET,
    inputs: [...inputs],
  };
}

export function isSettled(sim: Sim): boolean {
  return sim.jobs.every((job) => job.state === "succeeded" || job.state === "dead_letter");
}

/**
 * Records an input for the current tick so it is applied on the next step and kept for replay.
 * Adding an input diverges from any recorded future: inputs scheduled after this tick (for example
 * from a replayed run) are discarded, so only what the visitor actually did happens from here on.
 */
export function addInput(sim: Sim, input: Omit<SimInput, "tick">): Sim {
  const worker = sim.workers.find((w) => w.id === input.workerId);
  if (!worker || !worker.alive || isSettled(sim)) return sim;
  if (sim.inputs.some((i) => i.tick === sim.tick && i.workerId === input.workerId)) return sim;
  const history = sim.inputs.filter((i) => i.tick <= sim.tick);
  return { ...sim, inputs: [...history, { ...input, tick: sim.tick }] };
}

/** Advances the simulation by one tick. Pure: returns a new Sim. */
export function step(prev: Sim): Sim {
  if (isSettled(prev)) return prev;

  const { config } = prev;
  const tick = prev.tick;
  const jobs = prev.jobs.map((job) => ({ ...job }));
  const workers = prev.workers.map((worker) => ({ ...worker }));
  const events = [...prev.events];
  let hash = prev.hash;
  let rng = prev.rng;
  let nextFence = prev.nextFence;

  const emit = (kind: SimEvent["kind"], text: string) => {
    const seq = events.length + 1;
    events.push({ seq, tick, kind, text });
    hash = fnv1a(hash, `${seq}|${tick}|${kind}|${text}`);
  };
  const random = () => {
    const [value, next] = nextRandom(rng);
    rng = next;
    return value;
  };
  const jobById = (id: number) => jobs[id - 1]!;

  // 1. Inputs recorded for this tick: crash workers.
  for (const input of prev.inputs) {
    if (input.tick !== tick || input.type !== "kill") continue;
    const worker = workers.find((w) => w.id === input.workerId);
    if (!worker || !worker.alive) continue;
    worker.alive = false;
    worker.restartAt = tick + config.restartTicks;
    emit(
      "crash",
      worker.jobId !== null
        ? `worker ${worker.id} crashed while holding job ${worker.jobId}`
        : `worker ${worker.id} crashed while idle`,
    );
    // The job stays "running" in the database; nobody knows yet. Only its lease will tell.
    worker.jobId = null;
  }

  // 2. Crashed workers come back with a new session.
  for (const worker of workers) {
    if (!worker.alive && worker.restartAt === tick) {
      worker.alive = true;
      worker.session += 1;
      emit("restart", `worker ${worker.id} restarted (session ${worker.session})`);
    }
  }

  // 3. Reconciler: expire leases nobody renewed.
  for (const job of jobs) {
    if (job.state !== "running" || job.leaseUntil >= tick) continue;
    const holder = workers.find((w) => w.jobId === job.id);
    if (holder) holder.jobId = null;
    job.workerId = null;
    if (job.attempt >= config.maxAttempts) {
      job.state = "dead_letter";
      emit("dead_letter", `lease on job ${job.id} expired (fence ${job.fence}); out of attempts, dead-lettered`);
    } else {
      job.state = "queued";
      job.readyAt = tick;
      emit("lease_expired", `lease on job ${job.id} expired (fence ${job.fence}); requeued`);
    }
  }

  // 4. Retry backoff elapsed.
  for (const job of jobs) {
    if (job.state === "retry_wait" && job.readyAt <= tick) {
      job.state = "queued";
      emit("retry_ready", `job ${job.id} is ready for attempt ${job.attempt + 1}`);
    }
  }

  // 5. Live workers heartbeat and make progress.
  for (const worker of workers) {
    if (!worker.alive || worker.jobId === null) continue;
    const job = jobById(worker.jobId);
    job.leaseUntil = tick + config.leaseTicks;
    job.workLeft -= 1;
    if (job.workLeft > 0) continue;

    worker.jobId = null;
    job.workerId = null;
    if (random() < config.failureRate) {
      if (job.attempt >= config.maxAttempts) {
        job.state = "dead_letter";
        emit("dead_letter", `job ${job.id} failed attempt ${job.attempt}; dead-lettered`);
      } else {
        const backoff = 2 ** job.attempt;
        job.state = "retry_wait";
        job.readyAt = tick + backoff;
        emit("failure", `job ${job.id} failed attempt ${job.attempt}; retry in ${backoff} ticks`);
      }
    } else {
      job.state = "succeeded";
      emit("success", `worker ${worker.id} finished job ${job.id} (fence ${job.fence})`);
    }
  }

  // 6. Idle live workers pull the lowest-numbered queued job.
  for (const worker of workers) {
    if (!worker.alive || worker.jobId !== null) continue;
    const job = jobs.find((j) => j.state === "queued");
    if (!job) break;
    job.state = "running";
    job.attempt += 1;
    job.fence = nextFence;
    nextFence += 1;
    job.workerId = worker.id;
    job.workLeft = 2 + Math.floor(random() * 4);
    job.leaseUntil = tick + config.leaseTicks;
    worker.jobId = job.id;
    emit("claim", `worker ${worker.id} claimed job ${job.id} (attempt ${job.attempt}, fence ${job.fence})`);
  }

  return { ...prev, tick: tick + 1, rng, nextFence, jobs, workers, events, hash };
}

/** Runs a simulation to completion. Bounded so a bad config cannot loop forever. */
export function runToEnd(seed: number, config: SimConfig = DEFAULT_CONFIG, inputs: SimInput[] = [], maxTicks = 500): Sim {
  let sim = createSim(seed, config, inputs);
  while (!isSettled(sim) && sim.tick < maxTicks) sim = step(sim);
  return sim;
}

export function formatHash(hash: number): string {
  return hash.toString(16).padStart(8, "0");
}
