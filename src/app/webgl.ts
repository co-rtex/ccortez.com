/**
 * Reports whether this browser can create a WebGL context. The 3D island needs one; without it
 * the app shows a text fallback instead of crashing the whole page.
 */
export function detectWebGLSupport(createCanvas: () => HTMLCanvasElement = () => document.createElement('canvas')): boolean {
  try {
    const canvas = createCanvas();
    const context = canvas.getContext('webgl2') ?? canvas.getContext('webgl');
    return context !== null;
  } catch {
    return false;
  }
}
