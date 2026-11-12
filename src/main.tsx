import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

// Self-hosted fonts (latin subset, font-display: swap). Loading them from Google Fonts through a CSS
// @import chained a render-blocking third-party request in front of the first paint.
import '@fontsource/manrope/latin-400.css';
import '@fontsource/manrope/latin-600.css';
import '@fontsource/manrope/latin-700.css';
import '@fontsource/manrope/latin-800.css';
import '@fontsource/syne/latin-500.css';
import '@fontsource/syne/latin-700.css';
import '@fontsource/syne/latin-800.css';

import App from './app/App';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
