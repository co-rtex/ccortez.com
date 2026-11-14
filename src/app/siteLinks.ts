/**
 * The professional (text) portfolio. After the planned domain cutover the game lives at
 * game.ccortez.com and the apex domain serves the professional site. A build can point it elsewhere with
 * VITE_PROFESSIONAL_SITE_URL (for example a local build of the professional branch), so the two development
 * versions can be checked together; production keeps the default.
 */
export const PROFESSIONAL_SITE_URL = (
  (import.meta.env.VITE_PROFESSIONAL_SITE_URL as string | undefined) ?? 'https://ccortez.com'
).replace(/\/$/, '');
