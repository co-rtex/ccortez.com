import { describe, expect, it } from "vitest";

import { addInput, createSim, isSettled, step, type Sim } from "./jobSim";
import { recoveryTrace } from "./recoveryTrace";

function runTo(sim: Sim, tick: number): Sim {
  let next = sim;
  while (next.tick < tick && !isSettled(next)) next = step(next);
  return next;
}

/** First tick at which worker `id` holds a job, so a crash there strands it. */
function busyTick(seed: number, id: number): number {
  let sim = createSim(seed);
  while (!isSettled(sim)) {
    if (sim.workers[id - 1]!.jobId !== null) return sim.tick;
    sim = step(sim);
  }
  throw new Error("worker never busy");
}

describe("recovery trace", () => {
  it("is empty until a worker crashes while holding a job", () => {
    expect(recoveryTrace(runTo(createSim(2027), 10))).toBeNull();
  });

  it("follows the stranded job from the crash to its recovery under a newer fence", () => {
    const tick = busyTick(2027, 2);
    let sim = addInput(runTo(createSim(2027), tick), { type: "kill", workerId: 2 });
    sim = step(sim);
    const early = recoveryTrace(sim)!;
    expect(early.workerId).toBe(2);
    expect(early.steps[0]!.title).toMatch(/^w2 crashed holding job \d+$/);
    // Right after the crash the run is waiting on the lease.
    expect(early.steps.at(-1)!.tick).toBeNull();
    expect(early.steps.at(-1)!.title).toMatch(/^Lease runs out after tick \d+$/);

    while (!isSettled(sim)) sim = step(sim);
    const trace = recoveryTrace(sim)!;
    expect(trace.outcome).not.toBe("in_progress");
    expect(trace.steps.every((s) => s.tick !== null)).toBe(true);
    const titles = trace.steps.map((s) => s.title);
    expect(titles[1]).toBe("Lease expired, job requeued");
    const claim = titles.find((t) => /claimed it with fence/.test(t))!;
    expect(Number(claim.match(/fence (\d+)/)![1])).toBeGreaterThan(trace.staleFence);
    // Ticks never go backwards.
    const ticks = trace.steps.map((s) => s.tick!);
    expect([...ticks].sort((a, b) => a - b)).toEqual(ticks);
  });

  it("ignores a crash of an idle worker", () => {
    let sim = addInput(createSim(2027), { type: "kill", workerId: 1 });
    sim = step(sim);
    expect(recoveryTrace(sim)).toBeNull();
  });
});
