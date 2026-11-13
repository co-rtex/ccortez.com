/**
 * A toy backtest for the QuantLab workbench: the ideas QuantLab is built on, small enough to watch. It is not
 * QuantLab's code, and the prices are synthetic.
 *
 * - Immutable dataset versions: version N always holds the same synthetic price series.
 * - No look-ahead: the rule decides each day's position from prices up to the day before.
 * - Reproducible results: a run's manifest hashes the dataset version, the parameters and the result, so running
 *   the same manifest again must give the same hash, and a different version gives a different one.
 */
export const DAYS = 32;
export const DATASET_VERSIONS = 4;
export const SMA_DAYS = 5;

export interface BacktestResult {
  version: number;
  /** Strategy equity by day, starting at 1. */
  equity: number[];
  /** True on days the strategy was holding the asset. */
  invested: boolean[];
  totalReturn: number;
  /** Largest peak-to-trough fall of equity, as a positive fraction. */
  maxDrawdown: number;
  manifest: string;
}

function mulberry(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** The synthetic price series stored as dataset version `version` (1-based). */
export function datasetPrices(version: number): number[] {
  const random = mulberry(9000 + version * 7919);
  const prices = [100];
  const drift = 0.002 + (version % 3) * 0.0015;
  for (let day = 1; day < DAYS + SMA_DAYS; day += 1) {
    const shock = (random() - 0.5) * 0.05;
    prices.push(prices[day - 1]! * (1 + drift + shock));
  }
  return prices;
}

function fnv(text: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

export function runBacktest(version: number): BacktestResult {
  return backtestOn(datasetPrices(version), version);
}

/** Hold the asset on a day only if the previous close was above the average of the closes before it. */
export function backtestOn(prices: number[], version: number): BacktestResult {
  const equity = [1];
  const invested = [false];
  for (let day = 1; day < DAYS; day += 1) {
    const t = day + SMA_DAYS - 1;
    // Decided from closes up to yesterday (t - 1) only: today's price is never read before today's return.
    const window = prices.slice(t - SMA_DAYS, t - 1);
    const average = window.reduce((sum, price) => sum + price, 0) / window.length;
    const holding = prices[t - 1]! > average;
    const dailyReturn = prices[t]! / prices[t - 1]! - 1;
    equity.push(equity[day - 1]! * (1 + (holding ? dailyReturn : 0)));
    invested.push(holding);
  }
  let peak = equity[0]!;
  let maxDrawdown = 0;
  for (const value of equity) {
    peak = Math.max(peak, value);
    maxDrawdown = Math.max(maxDrawdown, (peak - value) / peak);
  }
  const totalReturn = equity.at(-1)! - 1;
  const manifest = fnv(
    `dataset=v${version}|rule=sma${SMA_DAYS}-prev-close|days=${DAYS}|${equity.map((value) => value.toFixed(10)).join(',')}`,
  );
  return { version, equity, invested, totalReturn, maxDrawdown, manifest };
}

/** Days on which equity stands below its running peak (shown as drawdown in the scene). */
export function drawdownDays(equity: number[]): boolean[] {
  let peak = -Infinity;
  return equity.map((value) => {
    peak = Math.max(peak, value);
    return value < peak - 1e-12;
  });
}
