import { describe, expect, it } from 'vitest';

import { EXTRACT_STAGES, FIELD_SCRIPT, LINE_SECONDS, extractionAt, fieldDuration } from './extractionLoop';

const startOf = (index: number) => FIELD_SCRIPT.slice(0, index).reduce((sum, outcome) => sum + fieldDuration(outcome), 0);

describe('Phoenix-Aid extraction line', () => {
  it('places every field on the board once per run, then holds the finished board and starts over', () => {
    const holding = extractionAt(LINE_SECONDS - 0.1);
    expect(holding.phase.stage).toBe('hold');
    expect(holding.placed).toBe(FIELD_SCRIPT.length);
    expect(extractionAt(LINE_SECONDS + 0.1)).toEqual(extractionAt(0.1));
    expect(extractionAt(0.1).placed).toBe(0);
  });

  it('fails a retried field at the gate the first time, requeues it, then passes it', () => {
    const index = FIELD_SCRIPT.indexOf('retried');
    const firstGate = startOf(index) + EXTRACT_STAGES.pick + EXTRACT_STAGES.queue + EXTRACT_STAGES.extract + 0.1;
    expect(extractionAt(firstGate).phase).toMatchObject({ index, stage: 'validate', passes: false, attempt: 0 });
    const requeue = firstGate + EXTRACT_STAGES.validate;
    expect(extractionAt(requeue).phase).toMatchObject({ stage: 'requeue' });
    const secondGate = requeue + EXTRACT_STAGES.requeue + EXTRACT_STAGES.queue + EXTRACT_STAGES.extract;
    expect(extractionAt(secondGate).phase).toMatchObject({ stage: 'validate', passes: true, attempt: 1 });
  });

  it('never places a field that has not passed the gate', () => {
    for (let t = 0; t < LINE_SECONDS; t += 0.05) {
      const { phase } = extractionAt(t);
      if (phase.stage === 'place') expect(phase.passes).toBe(true);
    }
  });
});
