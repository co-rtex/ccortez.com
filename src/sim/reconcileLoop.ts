/**
 * The HCSC bench's reconciliation pass, as a fixed, looping script (an illustration, not a simulation). A shuttle
 * takes each made-up check record from the records cabinet to the payment-status service and back, and files it:
 * matched, a mismatch flagged for a person, or (when the service is down) set aside with a fallback message. A
 * slow service times out once and the call is retried. The script mirrors the behaviour the HCSC role describes
 * (flag mismatches; timeouts, retries and clear fallback messages); it holds no HCSC data or code.
 */
export type RecordOutcome = 'match' | 'mismatch' | 'slow-then-match' | 'down';
export type Tray = 'matched' | 'flagged' | 'fallback';

export const RECORD_SCRIPT: readonly RecordOutcome[] = [
  'match',
  'match',
  'mismatch',
  'match',
  'slow-then-match',
  'match',
  'mismatch',
  'down',
  'match',
  'match',
];

/** Seconds per stage of one record's trip. */
export const STAGE_SECONDS = { pick: 0.4, out: 0.8, call: 0.6, wait: 1.2, back: 0.8, file: 0.5 } as const;

export interface RecordPhase {
  /** Index of the record in the script (the pass repeats). */
  index: number;
  outcome: RecordOutcome;
  stage: 'pick' | 'out' | 'call' | 'wait' | 'back' | 'file';
  /** 0..1 progress through the stage. */
  t: number;
  /** Status lamp at the service: what the call is seeing now. */
  lamp: 'idle' | 'ok' | 'slow' | 'down';
}

export function trayFor(outcome: RecordOutcome): Tray {
  if (outcome === 'mismatch') return 'flagged';
  if (outcome === 'down') return 'fallback';
  return 'matched';
}

function stagesFor(outcome: RecordOutcome): Array<RecordPhase['stage']> {
  // A slow service makes the call wait out its timeout, then retry; a down service fails both attempts.
  return outcome === 'slow-then-match' || outcome === 'down'
    ? ['pick', 'out', 'call', 'wait', 'call', 'back', 'file']
    : ['pick', 'out', 'call', 'back', 'file'];
}

export function recordDuration(outcome: RecordOutcome): number {
  return stagesFor(outcome).reduce((sum, stage) => sum + STAGE_SECONDS[stage], 0);
}

export const PASS_SECONDS = RECORD_SCRIPT.reduce((sum, outcome) => sum + recordDuration(outcome), 0);

/** Where the pass is at `seconds` (wrapping), plus how many records of each tray have been filed so far. */
export function reconcileAt(seconds: number): { phase: RecordPhase; filed: Record<Tray, number> } {
  let time = ((seconds % PASS_SECONDS) + PASS_SECONDS) % PASS_SECONDS;
  const filed: Record<Tray, number> = { matched: 0, flagged: 0, fallback: 0 };
  for (let index = 0; index < RECORD_SCRIPT.length; index += 1) {
    const outcome = RECORD_SCRIPT[index]!;
    const duration = recordDuration(outcome);
    if (time >= duration) {
      filed[trayFor(outcome)] += 1;
      time -= duration;
      continue;
    }
    const stages = stagesFor(outcome);
    let attempt = 0;
    for (const stage of stages) {
      const length = STAGE_SECONDS[stage];
      if (time < length) {
        const t = time / length;
        let lamp: RecordPhase['lamp'] = 'idle';
        if (stage === 'call') {
          // The first call to a slow or down service sees it struggling; the retry of a slow one succeeds.
          if (outcome === 'down') lamp = 'down';
          else if (outcome === 'slow-then-match') lamp = attempt === 0 ? 'slow' : 'ok';
          else lamp = 'ok';
        } else if (stage === 'wait') {
          lamp = outcome === 'down' ? 'down' : 'slow';
        }
        return { phase: { index, outcome, stage, t, lamp }, filed };
      }
      time -= length;
      if (stage === 'call') attempt += 1;
    }
  }
  // Unreachable: time is always inside the pass.
  return { phase: { index: 0, outcome: RECORD_SCRIPT[0]!, stage: 'pick', t: 0, lamp: 'idle' }, filed };
}
