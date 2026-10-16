import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import OriaLogo from './OriaLogo';

export default function ChangePasswordModal({ isOpen, onClose, isFirstLogin = false }) {
  const { user, changePassword, dismissFirstLogin } = useAuth();
  const { lang, isRtl } = useLanguage();
  const isAr = lang === 'ar';

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [copyToast, setCopyToast] = useState('');

  if (!isOpen) return null;

  // Strength calculation
  const getPasswordStrength = (pwd) => {
    if (!pwd) return { score: 0, text: '', color: '' };
    if (pwd.length < 6) {
      return { 
        score: 1, 
        text: isAr ? 'ضعيفة (6 أحرف على الأقل مطلوبة)' : 'Trop court (min. 6 caractères)', 
        color: '#ef4444' 
      };
    }
    const hasNum = /[0-9]/.test(pwd);
    const hasSpecial = /[^A-Za-z0-9]/.test(pwd);
    const hasUpper = /[A-Z]/.test(pwd);

    if (pwd.length >= 8 && hasNum && (hasSpecial || hasUpper)) {
      return { 
        score: 3, 
        text: isAr ? 'ممتازة وقوية جداً 🛡️' : 'Excellente & Ultra Sécurisée 🛡️', 
        color: '#10b981' 
      };
    }
    return { 
      score: 2, 
      text: isAr ? 'مقبولة وجيدة 👍' : 'Correcte 👍', 
      color: '#d4af37' 
    };
  };

  const strength = getPasswordStrength(newPassword);

  // Generate strong random password
  const generateStrongPassword = () => {
    const randomSuffix = Math.floor(100 + Math.random() * 900);
    const generated = `Oria${randomSuffix}!Gold`;
    setNewPassword(generated);
    setConfirmPassword(generated);
    setShowNew(true);
    setShowConfirm(true);

    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(generated).catch(() => {});
    }
    setCopyToast(isAr ? 'تم نسخ كلمة المرور القوية لحافظتك! 📋' : 'Mot de passe sécurisé généré et copié ! 📋');
    setTimeout(() => setCopyToast(''), 4000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!newPassword || newPassword.length < 6) {
      setErrorMsg(isAr ? 'يجب أن تتكون كلمة المرور من 6 أحرف على الأقل.' : 'Le mot de passe doit comporter au moins 6 caractères.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg(isAr ? 'كلمتا المرور غير متطابقتين، يرجى التأكد.' : 'Les deux mots de passe ne correspondent pas.');
      return;
    }

    if (!isFirstLogin && !currentPassword) {
      setErrorMsg(isAr ? 'يرجى إدخال كلمة المرور الحالية.' : 'Veuillez saisir votre mot de passe actuel.');
      return;
    }

    setLoading(true);
    try {
      await changePassword(newPassword, currentPassword);
      setLoading(false);
      setSuccessMsg(isAr ? 'تم تغيير كلمة المرور بنجاح! 🔒' : 'Mot de passe mis à jour avec succès ! 🔒');
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err) {
      setLoading(false);
      setErrorMsg(err.message || (isAr ? 'تعذر تغيير كلمة المرور، يرجى التحقق من المدخلات.' : 'Erreur lors du changement de mot de passe.'));
    }
  };

  const handleDismiss = () => {
    if (dismissFirstLogin) {
      dismissFirstLogin();
    }
    onClose();
  };

  return (
    <div 
      className="jewelia-modal-overlay" 
      onClick={handleDismiss} 
      dir={isRtl ? 'rtl' : 'ltr'}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.78)',
        backdropFilter: 'blur(8px)',
        zIndex: 10000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px'
      }}
    >
      <div 
        className="jewelia-modal-box"
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '480px',
          background: 'var(--bg-surface, #121217)',
          border: '1px solid var(--border-gold, rgba(212, 175, 55, 0.4))',
          borderRadius: '16px',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.8), 0 0 30px rgba(212, 175, 55, 0.15)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          animation: 'fadeInUp 0.3s ease'
        }}
      >
        {/* Top Header */}
        <div 
          style={{
            padding: '20px 24px 16px',
            borderBottom: '1px solid var(--border-subtle, rgba(255, 255, 255, 0.08))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'linear-gradient(180deg, rgba(212, 175, 55, 0.08) 0%, transparent 100%)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '1.5rem' }}>🔐</span>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.15rem', color: 'var(--primary-gold, #d4af37)', fontWeight: 700 }}>
                {isFirstLogin 
                  ? (isAr ? 'تعيين كلمة المرور الخاصة بكم' : 'Définissez votre mot de passe')
                  : (isAr ? 'تغيير كلمة المرور' : 'Modifier mon mot de passe')}
              </h3>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted, #9ca3af)' }}>
                {user?.shopName || user?.nom || (isAr ? 'حسابكم المهني' : 'Compte Professionnel')}
              </span>
            </div>
          </div>
          <button 
            onClick={handleDismiss}
            style={{
              background: 'rgba(255, 255, 255, 0.06)',
              border: 'none',
              color: 'var(--text-muted, #9ca3af)',
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              fontSize: '1rem'
            }}
            title={isAr ? 'إغلاق' : 'Fermer'}
          >
            ✕
          </button>
        </div>

        {/* Content Body */}
        <form onSubmit={handleSubmit} style={{ padding: '22px 24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          {/* Welcome Banner for First Login */}
          {isFirstLogin && (
            <div 
              style={{
                padding: '12px 14px',
                background: 'rgba(212, 175, 55, 0.1)',
                border: '1px solid rgba(212, 175, 55, 0.3)',
                borderRadius: '10px',
                display: 'flex',
                gap: '10px',
                alignItems: 'flex-start'
              }}
            >
              <span style={{ fontSize: '1.2rem', marginTop: '2px' }}>✨</span>
              <p style={{ margin: 0, fontSize: '0.84rem', color: 'var(--text-white, #f3f4f6)', lineHeight: 1.5 }}>
                {isAr 
                  ? 'مرحباً بكم في HRSDGDG! بعد أول تسجيل دخول، نوصي بتعيين كلمة مرور شخصية وآمنة خاصة بكم لحماية متجركم ومعاملاتكم.'
                  : 'Bienvenue sur HRSDGDG ! Après votre première connexion, nous vous invitons à personnaliser votre mot de passe pour sécuriser votre compte.'}
              </p>
            </div>
          )}

          {/* Feedback Alerts */}
          {errorMsg && (
            <div 
              style={{
                padding: '10px 14px',
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid #ef4444',
                color: '#f87171',
                borderRadius: '8px',
                fontSize: '0.85rem',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <span>⚠️</span>
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div 
              style={{
                padding: '10px 14px',
                background: 'rgba(16, 185, 129, 0.15)',
                border: '1px solid #10b981',
                color: '#34d399',
                borderRadius: '8px',
                fontSize: '0.85rem',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <span>✅</span>
              <span>{successMsg}</span>
            </div>
          )}

          {copyToast && (
            <div 
              style={{
                padding: '8px 12px',
                background: 'rgba(212, 175, 55, 0.2)',
                border: '1px solid var(--primary-gold, #d4af37)',
                color: 'var(--light-gold, #fef08a)',
                borderRadius: '6px',
                fontSize: '0.82rem',
                textAlign: 'center'
              }}
            >
              {copyToast}
            </div>
          )}

          {/* Current Password Field (Only if NOT first login) */}
          {!isFirstLogin && (
            <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.85rem', color: 'var(--text-white, #e5e7eb)', fontWeight: 600 }}>
                {isAr ? 'كلمة المرور الحالية' : 'Mot de passe actuel'}
              </label>
              <div style={{ position: 'relative' }}>
                <input 
                  type={showCurrent ? 'text' : 'password'}
                  className="jewelia-search-input"
                  style={{
                    width: '100%',
                    padding: '10px 42px 10px 14px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-subtle, rgba(255, 255, 255, 0.15))',
                    background: 'rgba(255, 255, 255, 0.04)',
                    color: '#fff',
                    fontSize: '0.9rem',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                  value={currentPassword}
                  onChange={e => setCurrentPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowCurrent(!showCurrent)}
                  style={{
                    position: 'absolute',
                    [isAr ? 'left' : 'right']: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-muted, #9ca3af)',
                    cursor: 'pointer',
                    fontSize: '1rem'
                  }}
                >
                  {showCurrent ? '👁️' : '🙈'}
                </button>
              </div>
            </div>
          )}

          {/* New Password Field */}
          <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label style={{ fontSize: '0.85rem', color: 'var(--text-white, #e5e7eb)', fontWeight: 600 }}>
                {isAr ? 'كلمة المرور الجديدة' : 'Nouveau mot de passe'}
              </label>
              <button
                type="button"
                onClick={generateStrongPassword}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--primary-gold, #d4af37)',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  textDecoration: 'underline'
                }}
              >
                {isAr ? '🔑 إنشاء كلمة مرور قوية' : '🔑 Suggérer un mot de passe fort'}
              </button>
            </div>
            <div style={{ position: 'relative' }}>
              <input 
                type={showNew ? 'text' : 'password'}
                className="jewelia-search-input"
                style={{
                  width: '100%',
                  padding: '10px 42px 10px 14px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-subtle, rgba(255, 255, 255, 0.15))',
                  background: 'rgba(255, 255, 255, 0.04)',
                  color: '#fff',
                  fontSize: '0.9rem',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder={isAr ? '6 أحرف على الأقل...' : 'Au moins 6 caractères...'}
                required
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                style={{
                  position: 'absolute',
                  [isAr ? 'left' : 'right']: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted, #9ca3af)',
                  cursor: 'pointer',
                  fontSize: '1rem'
                }}
              >
                {showNew ? '👁️' : '🙈'}
              </button>
            </div>

            {/* Strength indicator bar */}
            {newPassword && (
              <div style={{ marginTop: '4px' }}>
                <div style={{ display: 'flex', gap: '4px', height: '4px', borderRadius: '2px', overflow: 'hidden' }}>
                  <div style={{ flex: 1, background: strength.score >= 1 ? strength.color : 'rgba(255,255,255,0.1)' }} />
                  <div style={{ flex: 1, background: strength.score >= 2 ? strength.color : 'rgba(255,255,255,0.1)' }} />
                  <div style={{ flex: 1, background: strength.score >= 3 ? strength.color : 'rgba(255,255,255,0.1)' }} />
                </div>
                <div style={{ fontSize: '0.74rem', color: strength.color, marginTop: '4px', fontWeight: 600 }}>
                  {strength.text}
                </div>
              </div>
            )}
          </div>

          {/* Confirm New Password Field */}
          <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '0.85rem', color: 'var(--text-white, #e5e7eb)', fontWeight: 600 }}>
              {isAr ? 'تأكيد كلمة المرور الجديدة' : 'Confirmer le nouveau mot de passe'}
            </label>
            <div style={{ position: 'relative' }}>
              <input 
                type={showConfirm ? 'text' : 'password'}
                className="jewelia-search-input"
                style={{
                  width: '100%',
                  padding: '10px 42px 10px 14px',
                  borderRadius: '8px',
                  border: `1px solid ${confirmPassword && confirmPassword !== newPassword ? '#ef4444' : 'var(--border-subtle, rgba(255, 255, 255, 0.15))'}`,
                  background: 'rgba(255, 255, 255, 0.04)',
                  color: '#fff',
                  fontSize: '0.9rem',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder={isAr ? 'أعد إدخال كلمة المرور للتأكيد...' : 'Retapez le mot de passe...'}
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                style={{
                  position: 'absolute',
                  [isAr ? 'left' : 'right']: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted, #9ca3af)',
                  cursor: 'pointer',
                  fontSize: '1rem'
                }}
              >
                {showConfirm ? '👁️' : '🙈'}
              </button>
            </div>
            {confirmPassword && confirmPassword === newPassword && (
              <span style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 600 }}>
                {isAr ? '✓ كلمتا المرور متطابقتان' : '✓ Les mots de passe correspondent'}
              </span>
            )}
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
            {isFirstLogin && (
              <button
                type="button"
                onClick={handleDismiss}
                style={{
                  flex: 1,
                  padding: '12px',
                  borderRadius: '8px',
                  background: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  color: 'var(--text-muted, #9ca3af)',
                  fontSize: '0.88rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                {isAr ? 'تأجيل للاحقاً' : 'Plus tard'}
              </button>
            )}

            <button
              type="submit"
              disabled={loading || Boolean(successMsg)}
              className="btn-jewelia-primary"
              style={{
                flex: isFirstLogin ? 2 : 1,
                padding: '12px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #d4af37 0%, #b89628 100%)',
                color: '#08080a',
                border: 'none',
                fontSize: '0.92rem',
                fontWeight: 700,
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.7 : 1,
                boxShadow: '0 4px 15px rgba(212, 175, 55, 0.3)'
              }}
            >
              {loading 
                ? (isAr ? 'جارٍ الحفظ...' : 'Enregistrement...') 
                : isFirstLogin 
                  ? (isAr ? 'حفظ وتأمين الحساب 🛡️' : 'Enregistrer mon mot de passe 🛡️')
                  : (isAr ? 'تحديث كلمة المرور' : 'Mettre à jour le mot de passe')}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
