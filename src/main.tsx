import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import MainApp from './App.main.tsx';
import './index.css';

// Handle SPA 404 redirect (from 404.html fallback)
const redirectParam = new URLSearchParams(window.location.search).get('redirect');
if (redirectParam) {
  const decoded = decodeURIComponent(redirectParam);
  window.history.replaceState(null, '', decoded);
}

// Register service worker for PWA support — only on the real live site.
// In preview/dev a cached service worker can serve a stale page and show
// a blank screen, so there we actively remove any leftover registration.
if ('serviceWorker' in navigator) {
  if (import.meta.env.PROD) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/service-worker.js')
        .then((registration) => {
          console.log('Service Worker registered successfully:', registration.scope);
        })
        .catch((error) => {
          console.log('Service Worker registration failed:', error);
        });
    });
  } else {
    // Keep the preview's own worker (/klant/bouw/pv/__sw.js): without it the preview can't load.
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      registrations
        .filter((registration) => !registration.scope.includes('/klant/bouw/pv/'))
        .forEach((registration) => registration.unregister());
    });
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <MainApp />
  </StrictMode>
);
