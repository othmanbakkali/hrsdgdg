import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Actively purge obsolete caches on load so code is never stale
if ('caches' in window) {
  caches.keys().then((keys) => {
    keys.forEach((key) => {
      if (key === 'oria-admin-pwa-v1' || (key.startsWith('oria-admin-pwa-') && key !== 'oria-admin-pwa-v2')) {
        console.log('[Admin] Deleting obsolete cache:', key);
        caches.delete(key);
      }
    });
  });
}

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/admin/sw.js', { scope: '/admin/' })
      .then((reg) => {
        reg.update();
        reg.onupdatefound = () => {
          const installing = reg.installing;
          if (installing) {
            installing.onstatechange = () => {
              if (installing.state === 'installed' && navigator.serviceWorker.controller) {
                window.location.reload();
              }
            };
          }
        };
      })
      .catch(err => console.warn('[Admin PWA] Service worker registration error:', err));
  });
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
