/**
 * The professional (text) portfolio. After the planned domain cutover the game lives at
 * game.ccortez.com and the apex domain serves the professional site. A build can point it elsewhere with
 * VITE_PROFESSIONAL_SITE_URL (for example a local build of the professional branch), so the two development
 * versions can be checked together; production keeps the default.
 */
export const PROFESSIONAL_SITE_URL = (
  (import.meta.env.VITE_PROFESSIONAL_SITE_URL as string | undefined) ?? 'https://ccortez.com'
).replace(/\/$/, '');

/**
 * Whose island this is, said on the first screen (the arrival card on a desktop, the banner on a phone). The same
 * facts as the professional site's hero.
 */
export const OWNER = {
  name: 'Christian Cortez',
  // U+2060 (word joiner) after the en dash keeps 'UW–Madison' on one line on narrow screens.
  study: 'CS and Data Science at UW–\u2060Madison, graduating May 2028',
  seeking: 'Looking for Summer 2027 software engineering internships',
} as const;
