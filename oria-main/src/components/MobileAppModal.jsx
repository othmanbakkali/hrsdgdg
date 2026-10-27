import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { usePWA } from '../pwa/usePWA';

export default function MobileAppModal({ isOpen, onClose, initialTab }) {
  const { lang } = useLanguage();
  const isAr = lang === 'ar';
  const { isIOS, isInstallable, promptInstall } = usePWA();

  const [activeTab, setActiveTab] = useState('android');
  const [showAndroidGuide, setShowAndroidGuide] = useState(false);
  const [downloadStarted, setDownloadStarted] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (initialTab) {
        setActiveTab(initialTab);
      } else if (isIOS) {
        setActiveTab('ios');
      } else {
        setActiveTab('android');
      }
      setDownloadStarted(false);
    }
  }, [isOpen, initialTab, isIOS]);

  if (!isOpen) return null;

  const handleDownloadApk = () => {
    setDownloadStarted(true);
    // Trigger download
    const link = document.createElement('a');
    link.href = '/downloads/hrsdgdg.apk';
    link.download = 'hrsdgdg.apk';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleChromeInstall = async () => {
    const success = await promptInstall();
    if (success) {
      onClose();
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="mobile-app-modal-title"
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100000,
        background: 'rgba(0, 0, 0, 0.82)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        animation: 'fadeIn 0.25s ease'
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'linear-gradient(155deg, #15141D 0%, #0B0C10 100%)',
          border: '1px solid rgba(212, 175, 55, 0.45)',
          borderRadius: '24px',
          boxShadow: '0 25px 70px rgba(0, 0, 0, 0.85), 0 0 35px rgba(212, 175, 55, 0.2)',
          maxWidth: '520px',
          width: '100%',
          maxHeight: '92vh',
          overflowY: 'auto',
          color: '#fff',
          position: 'relative',
          padding: '28px 24px 24px',
          boxSizing: 'border-box',
          direction: isAr ? 'rtl' : 'ltr',
          textAlign: isAr ? 'right' : 'left'
        }}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          aria-label={isAr ? 'إغلاق' : 'Fermer'}
          style={{
            position: 'absolute',
            top: '18px',
            [isAr ? 'left' : 'right']: '18px',
            background: 'rgba(255, 255, 255, 0.08)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            color: '#D4AF37',
            borderRadius: '50%',
            width: '36px',
            height: '36px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            fontSize: '1.1rem',
            lineHeight: 1,
            transition: 'all 0.2s ease'
          }}
        >
          ✕
        </button>

        {/* Modal Header */}
        <div style={{ textAlign: 'center', marginBottom: '22px' }}>
          <div style={{ position: 'relative', display: 'inline-block', marginBottom: '12px' }}>
            <img
              src="/icons/pwa-192x192.png"
              alt="HRSDGDG App"
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '16px',
                border: '2px solid #D4AF37',
                boxShadow: '0 8px 24px rgba(212, 175, 55, 0.35)',
                display: 'block'
              }}
            />
            <span
              style={{
                position: 'absolute',
                bottom: '-6px',
                right: '-6px',
                background: 'linear-gradient(135deg, #FFF2C6 0%, #D4AF37 100%)',
                color: '#0B0C10',
                fontSize: '0.65rem',
                fontWeight: 800,
                padding: '2px 6px',
                borderRadius: '8px',
                boxShadow: '0 2px 6px rgba(0,0,0,0.5)',
                letterSpacing: '0.5px'
              }}
            >
              PRO
            </span>
          </div>

          <h2
            id="mobile-app-modal-title"
            style={{
              fontSize: '1.35rem',
              fontWeight: 800,
              margin: '0 0 6px 0',
              fontFamily: 'Cinzel, Georgia, serif',
              background: 'linear-gradient(135deg, #FFF6D6 0%, #D4AF37 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              letterSpacing: '0.5px'
            }}
          >
            {isAr ? 'تطبيق الهاتف الذكي HRSDGDG' : 'Application Mobile HRSDGDG'}
          </h2>
          <p style={{ fontSize: '0.86rem', color: '#B3B3C0', margin: 0 }}>
            {isAr
              ? 'متاح ومحسّن لأجهزة أندرويد (APK) وآبل آيفون (iOS)'
              : 'Disponible et optimisée pour Android (APK) & Apple iPhone (iOS)'}
          </p>
        </div>

        {/* Platform Switcher Tabs */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '8px',
            background: 'rgba(255, 255, 255, 0.05)',
            padding: '4px',
            borderRadius: '14px',
            marginBottom: '20px',
            border: '1px solid rgba(255, 255, 255, 0.08)'
          }}
        >
          <button
            type="button"
            onClick={() => setActiveTab('android')}
            style={{
              background: activeTab === 'android'
                ? 'linear-gradient(135deg, #D4AF37 0%, #AA820A 100%)'
                : 'transparent',
              color: activeTab === 'android' ? '#0B0C10' : '#E2E8F0',
              border: 'none',
              borderRadius: '10px',
              padding: '10px 14px',
              fontSize: '0.9rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              transition: 'all 0.2s ease',
              boxShadow: activeTab === 'android' ? '0 4px 14px rgba(212, 175, 55, 0.35)' : 'none'
            }}
          >
            <span style={{ fontSize: '1.2rem' }}>🤖</span>
            <span>{isAr ? 'أندرويد (APK)' : 'Android (APK)'}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('ios')}
            style={{
              background: activeTab === 'ios'
                ? 'linear-gradient(135deg, #D4AF37 0%, #AA820A 100%)'
                : 'transparent',
              color: activeTab === 'ios' ? '#0B0C10' : '#E2E8F0',
              border: 'none',
              borderRadius: '10px',
              padding: '10px 14px',
              fontSize: '0.9rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              transition: 'all 0.2s ease',
              boxShadow: activeTab === 'ios' ? '0 4px 14px rgba(212, 175, 55, 0.35)' : 'none'
            }}
          >
            <span style={{ fontSize: '1.2rem' }}>🍏</span>
            <span>{isAr ? 'آبل آيفون (iOS)' : 'iPhone (iOS)'}</span>
          </button>
        </div>

        {/* TAB 1: ANDROID */}
        {activeTab === 'android' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', animation: 'fadeIn 0.25s ease' }}>
            {/* Version Badge & Info */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: 'rgba(212, 175, 55, 0.08)',
                border: '1px solid rgba(212, 175, 55, 0.25)',
                borderRadius: '12px',
                padding: '10px 14px',
                fontSize: '0.8rem',
                color: '#FFF2C6'
              }}
            >
              <span>📦 <strong>hrsdgdg.apk</strong> (v1.2)</span>
              <span>⚡ {isAr ? 'حجم خفيف: 65 كيلوبايت' : 'Taille : 65 Ko'}</span>
              <span style={{ color: '#4ade80' }}>● {isAr ? 'موقّع وآمن' : 'Signé & Sécurisé'}</span>
            </div>

            {/* Features List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.85rem', color: '#CBD5E1' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ color: '#D4AF37', fontSize: '1rem' }}>✓</span>
                <span>{isAr ? 'تطبيق أصلي سريع وفائق الخفة والاستجابة' : 'Application native légère, rapide et fluide'}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ color: '#D4AF37', fontSize: '1rem' }}>✓</span>
                <span>{isAr ? 'التقاط صور المجوهرات فورياً بالكاميرا ورفع وثائق التسجيل' : 'Accès direct à la caméra pour vendre des bijoux et téléverser vos documents'}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ color: '#D4AF37', fontSize: '1rem' }}>✓</span>
                <span>{isAr ? 'تنبيهات فورية بأسعار الذهب والمزادات المباشرة' : 'Alertes en temps réel sur les enchères et le cours de l\'or'}</span>
              </div>
            </div>

            {/* Primary Action: Direct APK Download */}
            <button
              type="button"
              onClick={handleDownloadApk}
              style={{
                background: 'linear-gradient(135deg, #FFF2C6 0%, #D4AF37 50%, #B8901C 100%)',
                color: '#0B0C10',
                border: 'none',
                borderRadius: '14px',
                padding: '14px 20px',
                fontSize: '1rem',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                boxShadow: '0 6px 20px rgba(212, 175, 55, 0.4)',
                transition: 'transform 0.15s ease',
                width: '100%'
              }}
            >
              <span style={{ fontSize: '1.3rem' }}>📥</span>
              <span>{isAr ? 'تحميل ملف APK مباشرة لأندرويد' : 'Télécharger l\'APK Android (Direct)'}</span>
            </button>

            {downloadStarted && (
              <div
                style={{
                  background: 'rgba(74, 222, 128, 0.12)',
                  border: '1px solid rgba(74, 222, 128, 0.3)',
                  color: '#4ade80',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  fontSize: '0.82rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <span>✅</span>
                <span>
                  {isAr
                    ? 'بدأ تحميل الملف ! افتح ملف hrsdgdg.apk لتثبيته على هاتفك.'
                    : 'Téléchargement lancé ! Ouvrez le fichier hrsdgdg.apk pour l\'installer.'}
                </span>
              </div>
            )}

            {/* Secondary Option: Chrome PWA Install */}
            {isInstallable && (
              <button
                type="button"
                onClick={handleChromeInstall}
                style={{
                  background: 'rgba(255, 255, 255, 0.06)',
                  color: '#FFF2C6',
                  border: '1px solid rgba(212, 175, 55, 0.3)',
                  borderRadius: '12px',
                  padding: '11px 16px',
                  fontSize: '0.86rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                <span>⚡</span>
                <span>{isAr ? 'أو التثبيت الفوري عبر متصفح Chrome (PWA)' : 'Ou installer en 1 clic via Chrome (PWA)'}</span>
              </button>
            )}

            {/* Expandable Installation Guide */}
            <div
              style={{
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '12px',
                padding: '12px 14px'
              }}
            >
              <button
                type="button"
                onClick={() => setShowAndroidGuide(!showAndroidGuide)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#D4AF37',
                  padding: 0,
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  fontSize: '0.84rem',
                  fontWeight: 700
                }}
              >
                <span>📋 {isAr ? 'طريقة تثبيت ملف APK على أندرويد' : 'Comment installer l\'APK sur Android ?'}</span>
                <span>{showAndroidGuide ? '▲' : '▼'}</span>
              </button>

              {showAndroidGuide && (
                <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.8rem', color: '#94A3B8', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '10px' }}>
                  <div>1️⃣ {isAr ? 'اضغط على زر «تحميل ملف APK» أعلاه.' : 'Appuyez sur « Télécharger l\'APK » ci-dessus.'}</div>
                  <div>2️⃣ {isAr ? 'افتح الملف المحمل من شريط الإشعارات أو مجلد Téléchargements.' : 'Ouvrez le fichier téléchargé depuis la barre de notifications.'}</div>
                  <div>3️⃣ {isAr ? 'إذا طلب هاتفك الإذن: اضغط «الإعدادات» ثم فعّل «السماح بتثبيت التطبيقات من هذا المصدر»، ثم اضغط «تثبيت».' : 'Si Android demande une autorisation : appuyez sur Paramètres > Autoriser cette source, puis touchez Installer.'}</div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: APPLE IPHONE (iOS) */}
        {activeTab === 'ios' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', animation: 'fadeIn 0.25s ease' }}>
            {/* iOS Notice Badge */}
            <div
              style={{
                background: 'rgba(212, 175, 55, 0.08)',
                border: '1px solid rgba(212, 175, 55, 0.25)',
                borderRadius: '12px',
                padding: '10px 14px',
                fontSize: '0.82rem',
                color: '#FFF2C6',
                textAlign: 'center'
              }}
            >
              🍎 <strong>{isAr ? 'تثبيت رسمي على متصفح Safari' : 'Installation officielle sur Safari iOS'}</strong>
              <div style={{ fontSize: '0.76rem', color: '#B3B3C0', marginTop: '2px' }}>
                {isAr ? 'يعمل بكامل الشاشة تماماً مثل تطبيقات App Store بدون الحاجة لمتجر التطبيقات' : 'Fonctionne en plein écran comme une application App Store native'}
              </div>
            </div>

            {/* 3 Step Visual Guide */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {/* Step 1 */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px',
                  background: 'rgba(255, 255, 255, 0.04)',
                  padding: '12px 14px',
                  borderRadius: '12px',
                  border: '1px solid rgba(255, 255, 255, 0.08)'
                }}
              >
                <div
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '10px',
                    background: 'rgba(212, 175, 55, 0.2)',
                    color: '#FFF2C6',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.2rem',
                    flexShrink: 0,
                    fontWeight: 800
                  }}
                >
                  1
                </div>
                <div style={{ flex: 1, fontSize: '0.85rem' }}>
                  <div style={{ fontWeight: 700, color: '#FFF' }}>
                    {isAr ? 'اضغط على زر المشاركة ⎙ في Safari' : 'Appuyez sur Partager ⎙ dans Safari'}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#94A3B8', marginTop: '2px' }}>
                    {isAr
                      ? 'ستجد أيقونة المربع بسهم لأعلى في أسفل الشاشة.'
                      : 'L\'icône carrée avec une flèche vers le haut en bas de votre écran.'}
                  </div>
                </div>
              </div>

              {/* Step 2 */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px',
                  background: 'rgba(255, 255, 255, 0.04)',
                  padding: '12px 14px',
                  borderRadius: '12px',
                  border: '1px solid rgba(255, 255, 255, 0.08)'
                }}
              >
                <div
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '10px',
                    background: 'rgba(212, 175, 55, 0.2)',
                    color: '#FFF2C6',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.2rem',
                    flexShrink: 0,
                    fontWeight: 800
                  }}
                >
                  2
                </div>
                <div style={{ flex: 1, fontSize: '0.85rem' }}>
                  <div style={{ fontWeight: 700, color: '#FFF' }}>
                    {isAr ? 'اختر «إضافة إلى الشاشة الرئيسية» ➕' : 'Sélectionnez « Sur l\'écran d\'accueil » ➕'}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#94A3B8', marginTop: '2px' }}>
                    {isAr
                      ? 'مرّر قائمة الخيارات لأسفل واضغط على علامة الزائد (+).'
                      : 'Faites défiler le menu vers le bas et touchez l\'option avec l\'icône (+).'}
                  </div>
                </div>
              </div>

              {/* Step 3 */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px',
                  background: 'rgba(255, 255, 255, 0.04)',
                  padding: '12px 14px',
                  borderRadius: '12px',
                  border: '1px solid rgba(255, 255, 255, 0.08)'
                }}
              >
                <div
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '10px',
                    background: 'rgba(212, 175, 55, 0.2)',
                    color: '#FFF2C6',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.2rem',
                    flexShrink: 0,
                    fontWeight: 800
                  }}
                >
                  3
                </div>
                <div style={{ flex: 1, fontSize: '0.85rem' }}>
                  <div style={{ fontWeight: 700, color: '#FFF' }}>
                    {isAr ? 'اضغط على «إضافة» (Add) في الزاوية العلوية' : 'Touchez « Ajouter » en haut à droite'}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#94A3B8', marginTop: '2px' }}>
                    {isAr
                      ? 'ستظهر أيقونة HRSDGDG الذهبية فوراً على شاشة هاتفك.'
                      : 'L\'icône dorée HRSDGDG apparaîtra instantanément sur votre écran d\'accueil.'}
                  </div>
                </div>
              </div>
            </div>

            {/* Confirm Button */}
            <button
              type="button"
              onClick={onClose}
              style={{
                background: 'linear-gradient(135deg, #FFF2C6 0%, #D4AF37 50%, #B8901C 100%)',
                color: '#0B0C10',
                border: 'none',
                borderRadius: '14px',
                padding: '12px 20px',
                fontSize: '0.95rem',
                fontWeight: 800,
                cursor: 'pointer',
                width: '100%',
                boxShadow: '0 4px 16px rgba(212, 175, 55, 0.35)'
              }}
            >
              {isAr ? 'فهمت، سأقوم بتثبيته الآن' : 'C\'est compris, je l\'installe !'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
