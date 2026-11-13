import { describe, expect, it } from "vitest";
import { DEFAULT_CONFIG, addInput, createSim, formatHash, isSettled, runToEnd, step } from "./jobSim";

describe("job simulation", () => {
  it("is deterministic for the same seed and inputs", () => {
    const inputs = [{ tick: 4, type: "kill" as const, workerId: 2 }];
    const a = runToEnd(42, DEFAULT_CONFIG, inputs);
    const b = runToEnd(42, DEFAULT_CONFIG, inputs);
    expect(a.hash).toBe(b.hash);
    expect(a.events).toEqual(b.events);
  });

  it("produces different histories for different seeds", () => {
    expect(runToEnd(1).hash).not.toBe(runToEnd(2).hash);
  });

  it("settles every job as succeeded or dead-lettered", () => {
    for (let seed = 1; seed <= 50; seed += 1) {
      const sim = runToEnd(seed);
      expect(isSettled(sim), `seed ${seed}`).toBe(true);
    }
  });

  it("recovers a crashed worker's job through lease expiry", () => {
    // Let workers claim, then crash worker 1 while it holds a job.
    let sim = createSim(7, { ...DEFAULT_CONFIG, failureRate: 0 });
    sim = step(sim);
    const held = sim.workers[0]!.jobId;
    expect(held).not.toBeNull();
    sim = addInput(sim, { type: "kill", workerId: 1 });
    while (!isSettled(sim) && sim.tick < 200) sim = step(sim);

    const kinds = sim.events.map((e) => e.kind);
    expect(kinds).toContain("crash");
    expect(sim.events.some((e) => e.kind === "lease_expired" && e.text.includes(`job ${held} `))).toBe(true);
    expect(sim.jobs[held! - 1]!.state).toBe("succeeded");
    expect(sim.jobs[held! - 1]!.attempt).toBe(2);
    expect(kinds).toContain("restart");
  });

  it("never lets two workers hold the same job", () => {
    let sim = createSim(11);
    while (!isSettled(sim) && sim.tick < 300) {
      if (sim.tick === 3) sim = addInput(sim, { type: "kill", workerId: 1 });
      if (sim.tick === 5) sim = addInput(sim, { type: "kill", workerId: 3 });
      sim = step(sim);
      const held = sim.workers.map((w) => w.jobId).filter((id) => id !== null);
      expect(new Set(held).size).toBe(held.length);
    }
  });

  it("issues strictly increasing fences", () => {
    const sim = runToEnd(5, DEFAULT_CONFIG, [{ tick: 2, type: "kill", workerId: 1 }]);
    const fences = sim.events
      .filter((e) => e.kind === "claim")
      .map((e) => Number(/fence (\d+)/.exec(e.text)?.[1]));
    expect(fences).toEqual([...fences].sort((x, y) => x - y));
    expect(new Set(fences).size).toBe(fences.length);
  });

  it("dead-letters after the attempt limit when every attempt fails", () => {
    const sim = runToEnd(3, { ...DEFAULT_CONFIG, failureRate: 1 });
    expect(sim.jobs.every((j) => j.state === "dead_letter" && j.attempt === DEFAULT_CONFIG.maxAttempts)).toBe(true);
  });

  it("ignores kills on dead workers and duplicate kills in one tick", () => {
    let sim = step(createSim(9));
    sim = addInput(sim, { type: "kill", workerId: 2 });
    const once = sim.inputs.length;
    sim = addInput(sim, { type: "kill", workerId: 2 });
    expect(sim.inputs.length).toBe(once);
    sim = step(sim);
    expect(sim.workers[1]!.alive).toBe(false);
    expect(addInput(sim, { type: "kill", workerId: 2 }).inputs.length).toBe(once);
  });

  it("drops replayed future crashes once the visitor diverges with a crash of their own", () => {
    const original = runToEnd(2027, DEFAULT_CONFIG, [{ tick: 10, type: "kill", workerId: 1 }]);
    let replay = createSim(2027, DEFAULT_CONFIG, original.inputs);
    while (replay.tick < 3) replay = step(replay);
    replay = addInput(replay, { type: "kill", workerId: 2 });
    expect(replay.inputs).toEqual([{ tick: 3, type: "kill", workerId: 2 }]);
    while (!isSettled(replay) && replay.tick < 300) replay = step(replay);
    const crashes = replay.events.filter((e) => e.kind === "crash").map((e) => e.text);
    expect(crashes).toHaveLength(1);
    expect(crashes[0]).toMatch(/^worker 2 crashed/);
  });

  it("keeps its history hashes (golden values), so tagging events never changes a replay", () => {
    expect(formatHash(runToEnd(2027).hash)).toBe("f2553cd0");
    const crashes = [
      { tick: 3, type: "kill" as const, workerId: 2 },
      { tick: 9, type: "kill" as const, workerId: 1 },
    ];
    expect(formatHash(runToEnd(2027, DEFAULT_CONFIG, crashes).hash)).toBe("f035f824");
  });
});
