import { PROFESSIONAL_SITE_URL } from '../app/siteLinks';

interface SceneFallbackProps {
  reason: 'no-webgl' | 'crashed';
}

/** Shown in place of the 3D world when it cannot run. The recruiter guide and panels keep working. */
export function SceneFallback({ reason }: SceneFallbackProps) {
  return (
    <section className="scene-fallback" role="status" aria-labelledby="scene-fallback-title">
      <h1 id="scene-fallback-title" className="scene-fallback__title">
        {reason === 'no-webgl' ? 'The 3D island needs WebGL' : 'The 3D island stopped unexpectedly'}
      </h1>
      <p className="scene-fallback__body">
        {reason === 'no-webgl'
          ? "This browser or device can't create a WebGL context, so the world can't be drawn."
          : 'Something went wrong while drawing the world. Reloading the page usually fixes it.'}{' '}
        Every highlight is still available: open any entry in the recruiter guide to read it here.
      </p>
      <p className="scene-fallback__actions">
        <a className="scene-fallback__primary" href={PROFESSIONAL_SITE_URL}>
          Open the text portfolio and resume
        </a>
        {reason === 'crashed' ? (
          <button type="button" className="scene-fallback__secondary" onClick={() => window.location.reload()}>
            Reload the island
          </button>
        ) : null}
      </p>
    </section>
  );
}
