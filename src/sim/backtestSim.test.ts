import { describe, expect, it } from 'vitest';

import { DATASET_VERSIONS, SMA_DAYS, backtestOn, datasetPrices, drawdownDays, runBacktest } from './backtestSim';

describe('toy backtest', () => {
  it('reproduces the same manifest for the same dataset version, and a different one for another version', () => {
    expect(runBacktest(2)).toEqual(runBacktest(2));
    const manifests = new Set(Array.from({ length: DATASET_VERSIONS }, (_, i) => runBacktest(i + 1).manifest));
    expect(manifests.size).toBe(DATASET_VERSIONS);
  });

  it('never looks ahead: changing one close leaves every earlier day unchanged', () => {
    const base = runBacktest(3);
    // A day the rule held the asset, so that day's close does move its equity.
    const day = base.invested.findIndex((holding, index) => holding && index >= 8);
    expect(day).toBeGreaterThan(0);
    const prices = datasetPrices(3);
    // Day d's return uses close d + SMA_DAYS - 1; its position uses only closes before that.
    prices[day + SMA_DAYS - 1] = prices[day + SMA_DAYS - 1]! * 1.3;
    const changed = backtestOn(prices, 3);
    expect(changed.equity.slice(0, day)).toEqual(base.equity.slice(0, day));
    expect(changed.equity[day]).not.toBe(base.equity[day]);
  });

  it('reports drawdown as the largest fall from a running peak', () => {
    const result = runBacktest(1);
    expect(result.maxDrawdown).toBeGreaterThanOrEqual(0);
    expect(result.maxDrawdown).toBeLessThan(1);
    expect(drawdownDays([1, 1.2, 1.1, 1.3, 1.25])).toEqual([false, false, true, false, true]);
  });
});
