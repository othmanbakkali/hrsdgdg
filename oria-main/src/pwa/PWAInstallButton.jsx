import React, { useState } from 'react';
import { usePWA } from './usePWA';
import { useLanguage } from '../context/LanguageContext';

export default function PWAInstallButton({ variant = 'default', style = {} }) {
  const { isInstallable, isInstalled, isIOS, promptInstall } = usePWA();
  const [showIOSModal, setShowIOSModal] = useState(false);
  const { lang } = useLanguage();
  const isAr = lang === 'ar';

  if (isInstalled) {
    return null;
  }

  const handleClick = async (e) => {
    e.preventDefault();
    if (isIOS) {
      setShowIOSModal(true);
    } else {
      const success = await promptInstall();
      if (!success) {
        setShowIOSModal(true);
      }
    }
  };

  if (variant === 'nav-item') {
    return (
      <>
        <button
          onClick={handleClick}
          style={{
            background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.15) 0%, rgba(212, 175, 55, 0.05) 100%)',
            border: '1px solid rgba(212, 175, 55, 0.4)',
            color: '#FFF2C6',
            borderRadius: '20px',
            padding: '6px 14px',
            fontSize: '0.82rem',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            transition: 'all 0.2s ease',
            ...style
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = '#D4AF37';
            e.currentTarget.style.boxShadow = '0 0 12px rgba(212, 175, 55, 0.3)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'rgba(212, 175, 55, 0.4)';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          <span>📲</span>
          <span>{isAr ? 'تثبيت التطبيق' : "Installer l'App"}</span>
        </button>

        {showIOSModal && (
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="pwa-install-title"
            onClick={() => setShowIOSModal(false)}
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 99999,
              background: 'rgba(0, 0, 0, 0.8)',
              backdropFilter: 'blur(8px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '16px'
            }}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                background: '#121218',
                border: '1px solid #D4AF37',
                borderRadius: '20px',
                padding: '24px',
                maxWidth: '400px',
                width: '100%',
                color: '#fff',
                textAlign: 'center'
              }}
            >
              <img src="/icons/pwa-192x192.png" alt="HRSDGDG" style={{ width: '56px', height: '56px', borderRadius: '14px', border: '1px solid #D4AF37', marginBottom: '12px' }} />
              <h3 id="pwa-install-title" style={{ fontSize: '1.2rem', color: '#FFF2C6', margin: '0 0 8px 0', fontFamily: 'Cinzel, Georgia, serif' }}>
                {isAr ? 'تثبيت تطبيق HRSDGDG' : "Installer l'App HRSDGDG"}
              </h3>
              <p style={{ fontSize: '0.86rem', color: '#ccc', marginBottom: '16px', lineHeight: 1.5 }}>
                {isIOS 
                  ? (isAr 
                      ? "على متصفح Safari iOS: اضغط على أيقونة المشاركة ⎙ ثم اختر «إضافة إلى الشاشة الرئيسية» ➕ لتثبيت التطبيق."
                      : "Sur Safari iOS : Touchez l'icône Partager ⎙ puis « Sur l'écran d'accueil » ➕ pour installer l'application.")
                  : (isAr
                      ? "افتح قائمة المتصفح واختر «تثبيت التطبيق» أو «إضافة إلى الشاشة الرئيسية»."
                      : "Ouvrez le menu de votre navigateur et sélectionnez « Installer l'application » ou « Ajouter à l'écran d'accueil ».")
                }
              </p>
              <button
                onClick={() => setShowIOSModal(false)}
                style={{
                  background: 'linear-gradient(135deg, #FFF2C6 0%, #D4AF37 100%)',
                  color: '#121217',
                  border: 'none',
                  borderRadius: '10px',
                  padding: '10px 20px',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                {isAr ? 'إغلاق' : 'Fermer'}
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return (
    <button
      onClick={handleClick}
      style={{
        background: 'linear-gradient(135deg, #FFF2C6 0%, #D4AF37 100%)',
        color: '#121217',
        border: 'none',
        borderRadius: '12px',
        padding: '10px 18px',
        fontSize: '0.88rem',
        fontWeight: 700,
        cursor: 'pointer',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '8px',
        boxShadow: '0 4px 14px rgba(212, 175, 55, 0.35)',
        ...style
      }}
    >
      <span>📲</span>
      <span>{isAr ? 'تثبيت تطبيق HRSDGDG' : "Installer l'App HRSDGDG"}</span>
    </button>
  );
}
