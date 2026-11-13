/**
 * `?bench=<id>` opens that bench when the island loads: the player is moved to it and its panel opens, as if it
 * had been picked in the guide. The professional site's case studies link here, so "see it on the island" lands on
 * the bench rather than at the spawn point. Unknown or unpublished ids, and screenshot fixtures (`?shot=`), are
 * ignored.
 */
export function parseBenchDeepLink(search: string, publishedIds: ReadonlySet<string>): string | null {
  const params = new URLSearchParams(search);
  if (params.has('shot')) return null;
  const id = params.get('bench');
  return id && publishedIds.has(id) ? id : null;
}
