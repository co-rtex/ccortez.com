import { describe, expect, it } from 'vitest';

import { DAYS } from './backtestSim';
import { DAY_SECONDS, HOLD_SECONDS, describeRun, useQuantlabRuns } from './quantlabRunStore';

describe('QuantLab bench run loop', () => {
  it('reveals a run day by day, then re-runs the same manifest and reports that it reproduced', () => {
    const first = useQuantlabRuns.getState().run;
    useQuantlabRuns.getState().advance(DAY_SECONDS * 10.5);
    expect(useQuantlabRuns.getState().shown).toBe(10);
    useQuantlabRuns.getState().advance(DAYS * DAY_SECONDS + HOLD_SECONDS);
    const second = useQuantlabRuns.getState().run;
    expect(second.result.version).toBe(first.result.version);
    expect(second.reproduces).toEqual({ previousId: first.id, same: true });
    expect(describeRun(second)).toMatch(/identical to run/);
  });

  it('runs on the next dataset version when asked, and says so', () => {
    const before = useQuantlabRuns.getState().run;
    useQuantlabRuns.getState().queue('next-version');
    const after = useQuantlabRuns.getState().run;
    expect(after.result.version).not.toBe(before.result.version);
    expect(after.reproduces).toBeNull();
    // Announced as started at once, and with its result once the curve has been drawn.
    expect(useQuantlabRuns.getState().announcement).toBe(`Run ${after.id} started on dataset v${after.result.version}.`);
    useQuantlabRuns.getState().advance(DAYS * DAY_SECONDS + 0.01);
    expect(useQuantlabRuns.getState().announcement).toMatch(new RegExp(`^Run ${after.id} on dataset v${after.result.version}: `));
    // The loop carries on with the other kind of run: a re-run of this version.
    expect(useQuantlabRuns.getState().next).toBe('rerun');
  });
});
