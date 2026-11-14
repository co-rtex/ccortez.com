import { describe, expect, it } from 'vitest';

import { VISTA_SETTLE_SECONDS, settleVista, shouldOpenWithVista, vistaBlend } from './arrivalVista';

describe('arrival vista', () => {
  it('opens a plain first visit on a landscape screen', () => {
    expect(shouldOpenWithVista('', 16 / 9)).toBe(true);
    expect(shouldOpenWithVista('?stats', 16 / 9)).toBe(true);
  });

  it('is skipped on portrait screens and for any view-setting parameter', () => {
    expect(shouldOpenWithVista('', 390 / 844)).toBe(false);
    for (const query of ['?bench=taskforge', '?shot=1,2,3,4,5,6', '?spawn=0,0', '?avatar=0', '?tfsim=3']) {
      expect(shouldOpenWithVista(query, 16 / 9), query).toBe(false);
    }
  });

  it('settles over a fixed time, or at once under reduced motion', () => {
    expect(settleVista(1, VISTA_SETTLE_SECONDS / 2, false)).toBeCloseTo(0.5, 6);
    expect(settleVista(0.1, VISTA_SETTLE_SECONDS, false)).toBe(0);
    expect(settleVista(1, 0.016, true)).toBe(0);
  });

  it('eases in and out', () => {
    expect(vistaBlend(0)).toBe(0);
    expect(vistaBlend(1)).toBe(1);
    expect(vistaBlend(0.5)).toBeCloseTo(0.5, 6);
    expect(vistaBlend(0.1)).toBeLessThan(0.1);
  });
});
