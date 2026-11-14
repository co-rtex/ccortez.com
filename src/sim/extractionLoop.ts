/**
 * The Phoenix-Aid bench's extraction line, as a fixed, looping script (an illustration, not a simulation). Each
 * field of a made-up protocol leaves the protocol binder, rides the queue into the extractor, is drafted, and is
 * checked at the validation gate: a valid draft goes onto the draft eCRF board; an invalid one goes back through
 * the queue and is retried. It mirrors the pipeline's shape as the role describes it (queued jobs, retries, output
 * validation before anyone sees it) and holds no study, patient or sponsor data.
 */
export type FieldOutcome = 'valid' | 'retried';

export const FIELD_SCRIPT: readonly FieldOutcome[] = [
  'valid',
  'valid',
  'retried',
  'valid',
  'valid',
  'valid',
  'retried',
  'valid',
  'valid',
  'valid',
  'valid',
  'valid',
];

export const EXTRACT_STAGES = { pick: 0.35, queue: 0.7, extract: 0.6, validate: 0.45, requeue: 0.7, place: 0.6 } as const;
/** Seconds the finished board stays on show before the line starts over. */
export const BOARD_HOLD_SECONDS = 2.5;

export type ExtractStage = keyof typeof EXTRACT_STAGES;

export interface FieldPhase {
  index: number;
  stage: ExtractStage | 'hold';
  /** 0..1 through the stage. */
  t: number;
  /** Whether the draft at the gate passes (the first try of a retried field fails). */
  passes: boolean;
  /** Which attempt this is (0 = first). */
  attempt: number;
}

type StageStep = { readonly stage: ExtractStage; readonly attempt: number };

const once = (attempt: number): StageStep[] => [
  { stage: 'queue', attempt },
  { stage: 'extract', attempt },
  { stage: 'validate', attempt },
];
// Built once: the bench samples the script every frame, so nothing here allocates per call.
const VALID_STEPS: readonly StageStep[] = [{ stage: 'pick', attempt: 0 }, ...once(0), { stage: 'place', attempt: 0 }];
const RETRIED_STEPS: readonly StageStep[] = [
  { stage: 'pick', attempt: 0 },
  ...once(0),
  { stage: 'requeue', attempt: 0 },
  ...once(1),
  { stage: 'place', attempt: 1 },
];

function stagesFor(outcome: FieldOutcome): readonly StageStep[] {
  return outcome === 'retried' ? RETRIED_STEPS : VALID_STEPS;
}

const sumSteps = (steps: readonly StageStep[]): number => steps.reduce((sum, { stage }) => sum + EXTRACT_STAGES[stage], 0);
const VALID_SECONDS = sumSteps(VALID_STEPS);
const RETRIED_SECONDS = sumSteps(RETRIED_STEPS);

export function fieldDuration(outcome: FieldOutcome): number {
  return outcome === 'retried' ? RETRIED_SECONDS : VALID_SECONDS;
}

export const LINE_SECONDS = FIELD_SCRIPT.reduce((sum, outcome) => sum + fieldDuration(outcome), 0) + BOARD_HOLD_SECONDS;

/** Where the line is at `seconds` (wrapping), and how many fields are already on the board. */
export function extractionAt(seconds: number): { phase: FieldPhase; placed: number } {
  let time = ((seconds % LINE_SECONDS) + LINE_SECONDS) % LINE_SECONDS;
  for (let index = 0; index < FIELD_SCRIPT.length; index += 1) {
    const outcome = FIELD_SCRIPT[index]!;
    const duration = fieldDuration(outcome);
    if (time >= duration) {
      time -= duration;
      continue;
    }
    for (const { stage, attempt } of stagesFor(outcome)) {
      const length = EXTRACT_STAGES[stage];
      if (time < length) {
        const passes = outcome === 'valid' || attempt > 0;
        return { phase: { index, stage, t: time / length, passes, attempt }, placed: index };
      }
      time -= length;
    }
  }
  return {
    phase: { index: FIELD_SCRIPT.length - 1, stage: 'hold', t: time / BOARD_HOLD_SECONDS, passes: true, attempt: 0 },
    placed: FIELD_SCRIPT.length,
  };
}
