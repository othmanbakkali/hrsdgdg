import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import MobileAppModal from '../components/MobileAppModal';

export default function PWAInstallButton({ variant = 'default', style = {} }) {
  const [showModal, setShowModal] = useState(false);
  const { lang } = useLanguage();
  const isAr = lang === 'ar';

  const handleClick = (e) => {
    e.preventDefault();
    setShowModal(true);
  };

  if (variant === 'nav-item') {
    return (
      <>
        <button
          type="button"
          onClick={handleClick}
          className="pwa-nav-install-btn"
          style={style}
          title={isAr ? 'تطبيق الهاتف (أندرويد وآيفون)' : "Application Mobile (Android & iPhone)"}
          aria-label={isAr ? 'تطبيق الهاتف (أندرويد وآيفون)' : "Application Mobile (Android & iPhone)"}
        >
          <span style={{ fontSize: '1rem', lineHeight: 1 }}>📲</span>
          <span className="pwa-btn-label">{isAr ? 'تطبيق الهاتف' : "App Mobile"}</span>
        </button>

        <MobileAppModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
        />
      </>
    );
  }

  return (
    <>
      <button
        type="button"
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
        <span>{isAr ? 'تحميل تطبيق الهاتف (Android & iOS)' : "Télécharger l'App (Android & iOS)"}</span>
      </button>

      <MobileAppModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
      />
    </>
  );
}
