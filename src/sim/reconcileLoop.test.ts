import { describe, expect, it } from 'vitest';

import { PASS_SECONDS, RECORD_SCRIPT, STAGE_SECONDS, reconcileAt, recordDuration, trayFor } from './reconcileLoop';

describe('HCSC reconciliation pass', () => {
  it('files every record once per pass, into the tray its outcome calls for', () => {
    const { filed } = reconcileAt(PASS_SECONDS - 1e-6);
    const last = RECORD_SCRIPT.at(-1)!;
    const expected = { matched: 0, flagged: 0, fallback: 0 };
    for (const outcome of RECORD_SCRIPT.slice(0, -1)) expected[trayFor(outcome)] += 1;
    expect(filed).toEqual(expected);
    expect(trayFor(last)).toBe('matched');
  });

  it('starts over after a full pass', () => {
    expect(reconcileAt(PASS_SECONDS + 0.1)).toEqual(reconcileAt(0.1));
    expect(reconcileAt(0.1).filed).toEqual({ matched: 0, flagged: 0, fallback: 0 });
  });

  it('waits out a timeout and retries a slow service, and a down service never shows ok', () => {
    const slow = RECORD_SCRIPT.indexOf('slow-then-match');
    const start = RECORD_SCRIPT.slice(0, slow).reduce((sum, outcome) => sum + recordDuration(outcome), 0);
    const firstCall = start + STAGE_SECONDS.pick + STAGE_SECONDS.out + 0.1;
    expect(reconcileAt(firstCall).phase).toMatchObject({ index: slow, stage: 'call', lamp: 'slow' });
    const waiting = firstCall + STAGE_SECONDS.call;
    expect(reconcileAt(waiting).phase).toMatchObject({ stage: 'wait', lamp: 'slow' });
    const retry = waiting + STAGE_SECONDS.wait;
    expect(reconcileAt(retry).phase).toMatchObject({ stage: 'call', lamp: 'ok' });

    const down = RECORD_SCRIPT.indexOf('down');
    const downStart = RECORD_SCRIPT.slice(0, down).reduce((sum, outcome) => sum + recordDuration(outcome), 0);
    for (let t = downStart; t < downStart + recordDuration('down'); t += 0.05) {
      expect(reconcileAt(t).phase.lamp).not.toBe('ok');
    }
  });
});
