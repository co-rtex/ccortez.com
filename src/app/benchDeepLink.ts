/**
 * `?bench=<id>` opens that bench when the island loads: the player is moved to it and its panel opens, as if it
 * had been picked in the guide. The professional site's case studies link here, so "see it on the island" lands on
 * the bench rather than at the spawn point. Unknown or unpublished ids, and screenshot fixtures (`?shot=`), are
 * ignored.
 *
 * Bench ids are stable keys and kept their original names when projects were renamed (2026-11). The new names work
 * in links too: `?bench=lockstep` opens the bench whose id is still `enginex`.
 */
export const BENCH_ID_ALIASES: Readonly<Record<string, string>> = {
  lockstep: 'enginex',
  hindsight: 'quantlab',
  'quant-almanac': 'quant-signal-workstation',
  'the-invisible-game': 'footymind',
  'big-o-sort': 'intellisort',
  'fridge-to-fork': 'fridgefinder',
};

export function parseBenchDeepLink(search: string, publishedIds: ReadonlySet<string>): string | null {
  const params = new URLSearchParams(search);
  if (params.has('shot')) return null;
  const requested = params.get('bench');
  if (!requested) return null;
  const id = Object.hasOwn(BENCH_ID_ALIASES, requested) ? BENCH_ID_ALIASES[requested]! : requested;
  return publishedIds.has(id) ? id : null;
}
