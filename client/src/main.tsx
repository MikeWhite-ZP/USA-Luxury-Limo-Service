import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { setupCleanConsole } from './lib/cleanConsole';

// Setup clean console BEFORE anything else
setupCleanConsole();

// Now render your app
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

// Optional: Silent service worker registration
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then(() => {
        // Silent success
      })
      .catch((err) => {
        console.error('SW registration failed:', err);
      });
  });
}