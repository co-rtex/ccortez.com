import { Component, type ErrorInfo, type ReactNode } from 'react';

interface SceneErrorBoundaryProps {
  fallback: ReactNode;
  children: ReactNode;
}

interface SceneErrorBoundaryState {
  failed: boolean;
}

/** Keeps a WebGL or scene failure from unmounting the HUD and panels along with it. */
export class SceneErrorBoundary extends Component<SceneErrorBoundaryProps, SceneErrorBoundaryState> {
  state: SceneErrorBoundaryState = { failed: false };

  static getDerivedStateFromError(): SceneErrorBoundaryState {
    return { failed: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('3D scene failed; showing the text fallback instead.', error, info.componentStack);
  }

  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}
