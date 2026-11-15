/** Space left above the demo when "Try the live model" scrolls to it. */
export const DEMO_JUMP_MARGIN_PX = 8;

type Scroller = Pick<HTMLElement, 'scrollTop' | 'scrollTo' | 'getBoundingClientRect'>;
type Demo = Pick<HTMLElement, 'getBoundingClientRect'> & { closest(selector: string): Scroller | null };

/**
 * Scrolls the panel's own content so the demo sits at its top. Only that scroller moves: `scrollIntoView` would
 * also scroll every ancestor that can scroll, including the full-screen shell (overflow: hidden still scrolls
 * programmatically), pushing the world, the HUD and the panel header off screen with no way back on a phone.
 * Returns false when the demo is not inside panel content.
 */
export function scrollDemoIntoPanel(demo: Demo, reducedMotion: boolean): boolean {
  const content = demo.closest('.experience-panel__content');
  if (!content) return false;
  const offset = demo.getBoundingClientRect().top - content.getBoundingClientRect().top;
  content.scrollTo({ top: content.scrollTop + offset - DEMO_JUMP_MARGIN_PX, behavior: reducedMotion ? 'auto' : 'smooth' });
  return true;
}
