import { describe, expect, it } from 'vitest';

import { detectWebGLSupport } from './webgl';

function fakeCanvas(contexts: Record<string, unknown>): () => HTMLCanvasElement {
  return () => ({ getContext: (kind: string) => contexts[kind] ?? null }) as unknown as HTMLCanvasElement;
}

describe('detectWebGLSupport', () => {
  it('accepts WebGL2', () => {
    expect(detectWebGLSupport(fakeCanvas({ webgl2: {} }))).toBe(true);
  });

  it('falls back to WebGL1', () => {
    expect(detectWebGLSupport(fakeCanvas({ webgl: {} }))).toBe(true);
  });

  it('reports no support when neither context exists', () => {
    expect(detectWebGLSupport(fakeCanvas({}))).toBe(false);
  });

  it('reports no support when context creation throws', () => {
    expect(
      detectWebGLSupport(() => {
        throw new Error('blocked');
      }),
    ).toBe(false);
  });
});
