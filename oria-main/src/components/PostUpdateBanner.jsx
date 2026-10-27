import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { usePWA } from '../pwa/usePWA';

export default function PostUpdateBanner() {
  const { lang } = useLanguage();
  const isAr = lang === 'ar';
  const { postUpdateNotice, dismissPostUpdateNotice, requestNotificationPermission } = usePWA();
  const [notificationEnabled, setNotificationEnabled] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setNotificationEnabled(Notification.permission === 'granted');
    }
  }, []);

  if (!postUpdateNotice || !postUpdateNotice.show) return null;

  const handleEnableNotifications = async () => {
    const granted = await requestNotificationPermission();
    setNotificationEnabled(granted);
    if (granted && 'Notification' in window) {
      new Notification('HRSDGDG ✨', {
        body: isAr ? 'تم تفعيل التنبيهات بنجاح للإصدارات والمزادات الجديدة !' : 'Notifications activées avec succès !',
        icon: '/icons/pwa-192x192.png'
      });
    }
  };

  return (
    <div
      role="alert"
      aria-live="assertive"
      style={{
        position: 'fixed',
        top: '16px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 999999,
        maxWidth: '560px',
        width: 'calc(100% - 32px)',
        background: 'linear-gradient(135deg, rgba(20, 18, 28, 0.98) 0%, rgba(10, 10, 15, 0.98) 100%)',
        border: '1.5px solid #D4AF37',
        borderRadius: '16px',
        padding: '14px 18px',
        color: '#fff',
        boxShadow: '0 12px 35px rgba(0, 0, 0, 0.7), 0 0 25px rgba(212, 175, 55, 0.3)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        display: 'flex',
        alignItems: 'center',
        gap: '14px',
        direction: isAr ? 'rtl' : 'ltr',
        textAlign: isAr ? 'right' : 'left',
        animation: 'slideDown 0.4s cubic-bezier(0.16, 1, 0.3, 1)'
      }}
    >
      {/* Icon */}
      <div
        style={{
          width: '42px',
          height: '42px',
          borderRadius: '12px',
          background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.25) 0%, rgba(255, 255, 255, 0.05) 100%)',
          border: '1px solid #D4AF37',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '1.4rem',
          flexShrink: 0
        }}
      >
        ✨
      </div>

      {/* Text Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <strong
            style={{
              fontSize: '0.92rem',
              color: '#FFF2C6',
              fontFamily: 'Cinzel, Georgia, serif'
            }}
          >
            {isAr ? 'تم تحديث التطبيق بنجاح !' : 'Application mise à jour avec succès !'}
          </strong>
          <span
            style={{
              background: 'rgba(74, 222, 128, 0.2)',
              border: '1px solid rgba(74, 222, 128, 0.4)',
              color: '#4ADE80',
              fontSize: '0.68rem',
              fontWeight: 800,
              padding: '1px 6px',
              borderRadius: '8px'
            }}
          >
            v{postUpdateNotice.version}
          </span>
        </div>
        <p style={{ fontSize: '0.78rem', color: '#B3B3C0', margin: '2px 0 0 0', lineHeight: 1.4 }}>
          {isAr
            ? 'تستمتعون الآن بأحدث الميزات، سرعة أعلى، وأمان معزز.'
            : 'Vous bénéficiez désormais des dernières fonctionnalités, d\'une rapidité accrue et d\'une sécurité renforcée.'}
        </p>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
        {!notificationEnabled && typeof window !== 'undefined' && 'Notification' in window && (
          <button
            type="button"
            onClick={handleEnableNotifications}
            style={{
              background: 'linear-gradient(135deg, #FFF2C6 0%, #D4AF37 100%)',
              color: '#0B0C10',
              border: 'none',
              borderRadius: '8px',
              padding: '6px 10px',
              fontSize: '0.74rem',
              fontWeight: 700,
              cursor: 'pointer',
              whiteSpace: 'nowrap'
            }}
          >
            🔔 {isAr ? 'تفعيل التنبيهات' : 'Activer alertes'}
          </button>
        )}

        <button
          type="button"
          onClick={dismissPostUpdateNotice}
          aria-label={isAr ? 'إغلاق' : 'Fermer'}
          style={{
            background: 'transparent',
            border: 'none',
            color: '#71717A',
            cursor: 'pointer',
            padding: '4px 6px',
            fontSize: '1.1rem',
            lineHeight: 1
          }}
        >
          ✕
        </button>
      </div>
    </div>
  );
}
