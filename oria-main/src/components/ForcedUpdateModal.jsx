import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { usePWA } from '../pwa/usePWA';

export default function ForcedUpdateModal() {
  const { lang } = useLanguage();
  const isAr = lang === 'ar';
  const { 
    forceUpdateRequired, 
    serverVersionInfo, 
    isNativeApk, 
    nativeApkVersion, 
    clientVersion,
    forceApplyUpdate 
  } = usePWA();

  const [downloadStarted, setDownloadStarted] = useState(false);
  const [updating, setUpdating] = useState(false);

  if (!forceUpdateRequired) return null;

  const title = isAr 
    ? (serverVersionInfo?.title_ar || 'تحديث إجباري مطلوب للتطبيق')
    : (serverVersionInfo?.title_fr || 'Mise à jour obligatoire de l\'application');

  const message = isAr
    ? (serverVersionInfo?.message_ar || 'يتوفر إصدار رئيسي جديد ومحسن من تطبيق HRSDGDG. يجب تحديث التطبيق الآن لمواصلة التصفح والمشاركة في المزادات والحفاظ على أمان حسابكم.')
    : (serverVersionInfo?.message_fr || 'Une nouvelle version essentielle de HRSDGDG est disponible. La mise à niveau est obligatoire pour continuer à naviguer, participer aux enchères et garantir la sécurité.');

  const changelog = isAr
    ? (serverVersionInfo?.changelog_ar || ['أداء أسرع واستجابة فورية', 'حماية متقدمة ومعايير أمان أعلى', 'ميزات جديدة للبيع والشراء'])
    : (serverVersionInfo?.changelog_fr || ['Performances améliorées et navigation ultra-fluide', 'Sécurité renforcée et conformité certifiée', 'Nouvelles fonctionnalités pour les enchères et la vente']);

  const handleDownloadApk = () => {
    setDownloadStarted(true);
    const link = document.createElement('a');
    link.href = '/downloads/hrsdgdg.apk';
    link.download = 'hrsdgdg.apk';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleApplyWebUpdate = async () => {
    setUpdating(true);
    await forceApplyUpdate();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="forced-update-title"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000000, // Topmost overlay
        background: 'rgba(5, 5, 8, 0.95)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        animation: 'fadeIn 0.3s ease'
      }}
    >
      <div
        style={{
          background: 'linear-gradient(145deg, #161520 0%, #09090D 100%)',
          border: '2px solid rgba(212, 175, 55, 0.6)',
          borderRadius: '26px',
          boxShadow: '0 30px 90px rgba(0, 0, 0, 0.95), 0 0 45px rgba(212, 175, 55, 0.3)',
          maxWidth: '520px',
          width: '100%',
          padding: '32px 28px',
          color: '#fff',
          textAlign: isAr ? 'right' : 'left',
          direction: isAr ? 'rtl' : 'ltr',
          boxSizing: 'border-box',
          position: 'relative'
        }}
      >
        {/* Top Glowing Icon */}
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <div
            style={{
              width: '76px',
              height: '76px',
              borderRadius: '22px',
              background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.25) 0%, rgba(20, 18, 28, 0.8) 100%)',
              border: '2px solid #D4AF37',
              boxShadow: '0 8px 30px rgba(212, 175, 55, 0.45)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '2.4rem',
              marginBottom: '14px'
            }}
          >
            🚀
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '8px' }}>
            <span
              style={{
                background: 'linear-gradient(135deg, #DC2626 0%, #991B1B 100%)',
                color: '#fff',
                fontSize: '0.72rem',
                fontWeight: 800,
                padding: '3px 10px',
                borderRadius: '12px',
                letterSpacing: '0.5px',
                textTransform: 'uppercase',
                boxShadow: '0 2px 8px rgba(220, 38, 38, 0.4)'
              }}
            >
              {isAr ? 'تحديث إجباري' : 'Mise à jour requise'}
            </span>
            <span
              style={{
                background: 'rgba(212, 175, 55, 0.15)',
                border: '1px solid rgba(212, 175, 55, 0.4)',
                color: '#FFF2C6',
                fontSize: '0.72rem',
                fontWeight: 700,
                padding: '3px 10px',
                borderRadius: '12px'
              }}
            >
              v{serverVersionInfo?.version || '1.3.0'}
            </span>
          </div>

          <h2
            id="forced-update-title"
            style={{
              fontSize: '1.4rem',
              fontWeight: 800,
              margin: '0 0 8px 0',
              fontFamily: 'Cinzel, Georgia, serif',
              background: 'linear-gradient(135deg, #FFF6D6 0%, #D4AF37 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}
          >
            {title}
          </h2>

          <p style={{ fontSize: '0.88rem', color: '#CBD5E1', lineHeight: 1.6, margin: 0 }}>
            {message}
          </p>
        </div>

        {/* Current vs New Version Pill */}
        <div
          style={{
            background: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '14px',
            padding: '12px 16px',
            marginBottom: '20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '0.82rem'
          }}
        >
          <div>
            <span style={{ color: '#94A3B8' }}>{isAr ? 'إصدارك الحالي : ' : 'Votre version : '}</span>
            <strong style={{ color: '#F87171' }}>
              v{isNativeApk ? (nativeApkVersion || '1.0') : clientVersion}
            </strong>
          </div>
          <div style={{ fontSize: '1rem', color: '#D4AF37' }}>➔</div>
          <div>
            <span style={{ color: '#94A3B8' }}>{isAr ? 'الإصدار الجديد : ' : 'Nouvelle version : '}</span>
            <strong style={{ color: '#4ADE80' }}>
              v{serverVersionInfo?.version || '1.3.0'}
            </strong>
          </div>
        </div>

        {/* Changelog Highlights */}
        <div style={{ marginBottom: '24px' }}>
          <div
            style={{
              fontSize: '0.82rem',
              fontWeight: 700,
              color: '#FFF2C6',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              marginBottom: '10px'
            }}
          >
            {isAr ? '✨ أبرز التحديثات في هذا الإصدار :' : '✨ Nouveautés de cette version :'}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {changelog.map((item, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '10px',
                  fontSize: '0.84rem',
                  color: '#E2E8F0',
                  lineHeight: 1.4
                }}
              >
                <span style={{ color: '#D4AF37', fontWeight: 800 }}>✓</span>
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Primary Action Button */}
        {isNativeApk ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <button
              type="button"
              onClick={handleDownloadApk}
              style={{
                width: '100%',
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
                boxShadow: '0 6px 20px rgba(212, 175, 55, 0.45)',
                transition: 'transform 0.15s ease'
              }}
            >
              <span style={{ fontSize: '1.3rem' }}>📥</span>
              <span>
                {isAr
                  ? 'تحميل وتثبيت ملف APK المحدث (v1.3.0)'
                  : 'Télécharger et installer l\'APK v1.3.0'}
              </span>
            </button>

            {downloadStarted && (
              <div
                style={{
                  background: 'rgba(74, 222, 128, 0.15)',
                  border: '1px solid rgba(74, 222, 128, 0.35)',
                  color: '#4ADE80',
                  padding: '12px 14px',
                  borderRadius: '12px',
                  fontSize: '0.82rem',
                  lineHeight: 1.5
                }}
              >
                ✅ <strong>{isAr ? 'تم بدء التحميل !' : 'Téléchargement lancé !'}</strong>{' '}
                {isAr
                  ? 'افتح ملف hrsdgdg.apk من شريط الإشعارات لتحديث التطبيق واستئناف التصفح.'
                  : 'Ouvrez le fichier hrsdgdg.apk depuis vos notifications pour terminer la mise à niveau.'}
              </div>
            )}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <button
              type="button"
              disabled={updating}
              onClick={handleApplyWebUpdate}
              style={{
                width: '100%',
                background: 'linear-gradient(135deg, #FFF2C6 0%, #D4AF37 50%, #B8901C 100%)',
                color: '#0B0C10',
                border: 'none',
                borderRadius: '14px',
                padding: '14px 20px',
                fontSize: '1rem',
                fontWeight: 800,
                cursor: updating ? 'wait' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                boxShadow: '0 6px 20px rgba(212, 175, 55, 0.45)',
                opacity: updating ? 0.8 : 1
              }}
            >
              <span style={{ fontSize: '1.3rem' }}>⚡</span>
              <span>
                {updating
                  ? (isAr ? 'جاري تحديث التطبيق وإعادة التحميل...' : 'Mise à niveau en cours...')
                  : (isAr ? 'تحديث التطبيق الآن فوراً' : 'Mettre à jour l\'application maintenant')}
              </span>
            </button>
          </div>
        )}

        <div style={{ textAlign: 'center', marginTop: '16px' }}>
          <span style={{ fontSize: '0.74rem', color: '#64748B' }}>
            {isAr
              ? '🔒 مطلوب لحماية الحساب ومتابعة المزادات المباشرة في الوقت الفعلي'
              : '🔒 Requis pour garantir la sécurité et la conformité des transactions'}
          </span>
        </div>
      </div>
    </div>
  );
}
