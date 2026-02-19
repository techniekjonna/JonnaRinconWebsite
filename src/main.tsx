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

// Register service worker for PWA support
if ('serviceWorker' in navigator) {
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
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <MainApp />
  </StrictMode>
);
