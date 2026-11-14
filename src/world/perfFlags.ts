/**
 * Diagnostic switches for performance investigation, read once from `?perf=a,b`. They only remove work
 * (shadows, bench scenes, vegetation, high DPR) and have no effect without the parameter.
 */
export type PerfFlag = 'noshadow' | 'noscenes' | 'noveg' | 'dpr1' | 'shadow2048' | 'shadowhalf' | 'nopropshadow' | 'shadowbasic' | 'shadowfull' | 'fixeddpr';

const flags: Set<string> =
  typeof window === 'undefined'
    ? new Set()
    : new Set((new URLSearchParams(window.location.search).get('perf') ?? '').split(',').filter(Boolean));

export function hasPerfFlag(flag: PerfFlag): boolean {
  return flags.has(flag);
}
