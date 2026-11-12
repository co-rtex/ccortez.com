import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { HOW_TO_PLAY_CONTROLS } from './howToPlay';
import { SiteBar } from './SiteBar';

describe('SiteBar', () => {
  it('always offers the text portfolio and a how-to-play guide', () => {
    const markup = renderToStaticMarkup(<SiteBar />);
    expect(markup).toContain('href="https://ccortez.com"');
    expect(markup).toContain('Portfolio &amp; resume');
    expect(markup).toContain('How to play');
    expect(markup).toContain('<dialog');
  });

  it('documents the real movement and interaction keys', () => {
    const keys = HOW_TO_PLAY_CONTROLS.flatMap((control) => control.keys);
    expect(keys).toEqual(expect.arrayContaining(['W', 'A', 'S', 'D', 'Shift', 'E', 'Esc']));
  });
});
