import { describe, expect, it, vi } from 'vitest';

import { DEMO_JUMP_MARGIN_PX, scrollDemoIntoPanel } from './demoJump';

const rect = (top: number) => ({ top }) as DOMRect;

function setup(contentTop: number, contentScrollTop: number, demoTop: number) {
  const scrollTo = vi.fn();
  const content = { scrollTop: contentScrollTop, scrollTo, getBoundingClientRect: () => rect(contentTop) };
  const closest = vi.fn((selector: string) => (selector === '.experience-panel__content' ? content : null));
  const scrollIntoView = vi.fn();
  const demo = { getBoundingClientRect: () => rect(demoTop), closest, scrollIntoView };
  return { demo, scrollTo, scrollIntoView };
}

describe('"Try the live model" jump', () => {
  it('scrolls only the panel content, never the page or the full-screen shell', () => {
    const { demo, scrollTo, scrollIntoView } = setup(120, 40, 700);
    expect(scrollDemoIntoPanel(demo, false)).toBe(true);
    expect(scrollIntoView).not.toHaveBeenCalled();
    expect(scrollTo).toHaveBeenCalledWith({ top: 40 + (700 - 120) - DEMO_JUMP_MARGIN_PX, behavior: 'smooth' });
  });

  it('jumps without animation under reduced motion', () => {
    const { demo, scrollTo } = setup(0, 0, 300);
    scrollDemoIntoPanel(demo, true);
    expect(scrollTo).toHaveBeenCalledWith(expect.objectContaining({ behavior: 'auto' }));
  });

  it('does nothing outside panel content', () => {
    const scrollIntoView = vi.fn();
    const demo = { getBoundingClientRect: () => rect(0), closest: () => null, scrollIntoView };
    expect(scrollDemoIntoPanel(demo, false)).toBe(false);
    expect(scrollIntoView).not.toHaveBeenCalled();
  });
});
