import React, { useState, useEffect } from 'react';
import { usePWA } from './usePWA';
import MobileAppModal from '../components/MobileAppModal';

export default function PWAInstallBanner() {
  const { isInstallable, isInstalled, isIOS, isOffline, swUpdateAvailable, updateApp } = usePWA();
  const [isDismissed, setIsDismissed] = useState(false);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const dismissedUntil = localStorage.getItem('oria_pwa_dismissed_until');
    if (dismissedUntil && Date.now() < parseInt(dismissedUntil, 10)) {
      setIsDismissed(true);
    }
  }, []);

  const handleDismiss = () => {
    setIsDismissed(true);
    // Dismiss for 24 hours
    localStorage.setItem('oria_pwa_dismissed_until', (Date.now() + 24 * 60 * 60 * 1000).toString());
  };

  const handleInstallClick = () => {
    setShowModal(true);
  };

  return (
    <>
      {/* 1. Offline Mode Notice Bar */}
      {isOffline && (
        <aside 
          aria-label="Alerte mode hors ligne"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            zIndex: 99999,
            background: 'linear-gradient(90deg, #92400e 0%, #d97706 50%, #92400e 100%)',
            color: '#fff',
            padding: '8px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            fontSize: '0.85rem',
            fontWeight: 600,
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            animation: 'fadeIn 0.3s ease'
          }}
        >
          <span style={{ fontSize: '1.1rem' }}>⚡</span>
          <span>Mode hors ligne actif — Vous consultez les bijoux et données enregistrés en cache.</span>
        </aside>
      )}

      {/* 2. Service Worker Update Notification */}
      {swUpdateAvailable && (
        <aside 
          aria-label="Mise à jour disponible"
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            zIndex: 99998,
            background: 'rgba(18, 16, 24, 0.95)',
            border: '1px solid #D4AF37',
            boxShadow: '0 8px 32px rgba(212, 175, 55, 0.25)',
            backdropFilter: 'blur(16px)',
            borderRadius: '16px',
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            maxWidth: '380px',
            color: '#fff'
          }}
        >
          <div style={{ fontSize: '1.6rem' }}>✨</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: '0.92rem', color: '#FFF2C6' }}>Mise à jour disponible</div>
            <div style={{ fontSize: '0.8rem', color: '#ccc' }}>Une nouvelle version de HRSDGDG est prête.</div>
          </div>
          <button
            onClick={updateApp}
            style={{
              background: 'linear-gradient(135deg, #FFF2C6 0%, #D4AF37 100%)',
              color: '#121217',
              border: 'none',
              borderRadius: '8px',
              padding: '8px 14px',
              fontSize: '0.82rem',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            Recharger
          </button>
        </aside>
      )}

      {/* 3. Floating Luxury PWA & Mobile App Banner */}
      {!isInstalled && !isDismissed && (
        <div
          style={{
            position: 'fixed',
            bottom: '80px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 9990,
            width: 'calc(100% - 32px)',
            maxWidth: '480px',
            background: 'linear-gradient(135deg, rgba(20, 18, 28, 0.96) 0%, rgba(11, 12, 16, 0.98) 100%)',
            border: '1px solid rgba(212, 175, 55, 0.5)',
            boxShadow: '0 12px 40px rgba(0, 0, 0, 0.6), 0 0 24px rgba(212, 175, 55, 0.2)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            borderRadius: '20px',
            padding: '14px 18px',
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
            color: '#fff',
            animation: 'slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)'
          }}
        >
          {/* App Icon */}
          <div
            style={{
              width: '46px',
              height: '46px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #1B1822 0%, #0B0C10 100%)',
              border: '1px solid #D4AF37',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              boxShadow: '0 4px 12px rgba(212, 175, 55, 0.3)'
            }}
          >
            <img
              src="/icons/pwa-192x192.png"
              alt="HRSDGDG App"
              style={{ width: '38px', height: '38px', borderRadius: '8px' }}
            />
          </div>

          {/* Info */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span
                style={{
                  fontWeight: 800,
                  fontSize: '0.92rem',
                  letterSpacing: '0.5px',
                  background: 'linear-gradient(135deg, #FFF6D6 0%, #D4AF37 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent'
                }}
              >
                App HRSDGDG
              </span>
              <span
                style={{
                  background: 'rgba(212, 175, 55, 0.15)',
                  border: '1px solid rgba(212, 175, 55, 0.3)',
                  color: '#FFF2C6',
                  fontSize: '0.65rem',
                  padding: '2px 6px',
                  borderRadius: '10px',
                  fontWeight: 700
                }}
              >
                Android &amp; iOS
              </span>
            </div>
            <p style={{ fontSize: '0.78rem', color: '#B3B3C0', margin: '2px 0 0 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              APK direct &amp; Version iPhone optimisée
            </p>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
            <button
              onClick={handleInstallClick}
              style={{
                background: 'linear-gradient(135deg, #FFF2C6 0%, #D4AF37 50%, #AA820A 100%)',
                color: '#0B0C10',
                border: 'none',
                borderRadius: '10px',
                padding: '8px 14px',
                fontSize: '0.82rem',
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(212, 175, 55, 0.35)',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <span>📲</span>
              <span>Installer</span>
            </button>

            <button
              onClick={handleDismiss}
              aria-label="Fermer"
              style={{
                background: 'transparent',
                border: 'none',
                color: '#71717A',
                cursor: 'pointer',
                padding: '6px',
                fontSize: '1rem',
                lineHeight: 1,
                borderRadius: '50%'
              }}
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* 4. Unified Mobile App Modal */}
      <MobileAppModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
      />
    </>
  );
}
