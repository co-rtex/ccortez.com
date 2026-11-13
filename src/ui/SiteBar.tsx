import { useRef } from 'react';

import { PROFESSIONAL_SITE_URL } from '../app/siteLinks';
import { HOW_TO_PLAY_CONTROLS } from './howToPlay';

/**
 * Always-visible top bar: a "How to play" guide and a direct route to the text portfolio.
 * Keyboard events inside the dialog stay inside it so typing there never moves the player.
 */
export function SiteBar() {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  const openGuide = () => {
    dialogRef.current?.showModal();
    // showModal() would otherwise focus the first link; start on the primary action instead.
    closeRef.current?.focus();
  };

  return (
    <nav className="site-bar" aria-label="Site">
      <button type="button" className="site-bar__button" onClick={openGuide}>
        How to play
      </button>
      <a className="site-bar__link" href={PROFESSIONAL_SITE_URL}>
        Portfolio &amp; resume
      </a>

      <dialog
        ref={dialogRef}
        className="how-to-play"
        aria-labelledby="how-to-play-title"
        onKeyDown={(event) => event.stopPropagation()}
        onKeyUp={(event) => event.stopPropagation()}
        onClick={(event) => {
          // A click on the backdrop (the dialog element itself) closes it.
          if (event.target === dialogRef.current) dialogRef.current.close();
        }}
      >
        <div className="how-to-play__body">
          <h2 id="how-to-play-title" className="how-to-play__title">
            How to explore the island
          </h2>
          <p className="how-to-play__intro">
            Each workbench around the plaza is one job, research role or project. Walk up to one, or pick it in the
            recruiter guide to go straight there, to read about it. The four beside the north gate, marked Case
            study, run small live models you can try from their panel. Signposts at the plaza edge point the way to
            the lighthouse and the lakes, where you can sit on a bench and watch the sunset.
          </p>
          <dl className="how-to-play__controls">
            {HOW_TO_PLAY_CONTROLS.map((control) => (
              <div key={control.action} className="how-to-play__row">
                <dt>
                  {control.keys.map((key) => (
                    <kbd key={key}>{key}</kbd>
                  ))}
                </dt>
                <dd>{control.action}</dd>
              </div>
            ))}
            <div className="how-to-play__row">
              <dt>
                <kbd>Click</kbd>
              </dt>
              <dd>Open a workbench directly, or drag to look around one you have opened</dd>
            </div>
          </dl>
          <p className="how-to-play__intro">
            Short on time? The <a href={PROFESSIONAL_SITE_URL}>text portfolio</a> has the same work as case studies,
            plus a downloadable resume.
          </p>
          <form method="dialog" className="how-to-play__actions">
            <button ref={closeRef} type="submit" className="how-to-play__close">
              Start exploring
            </button>
          </form>
        </div>
      </dialog>
    </nav>
  );
}
