import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import OriaLogo from './OriaLogo';

export default function AdminLogin({ selectedTheme, setSelectedTheme }) {
  const { login } = useAuth();
  const { t, lang, setLang, isRtl } = useLanguage();

  const [themeMode, setThemeMode] = useState(() => localStorage.getItem('hrsdgdg-theme') || 'light');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', themeMode);
    document.body.setAttribute('data-theme', themeMode);
    if (themeMode === 'light') {
      document.body.classList.add('light-theme');
      document.body.classList.remove('dark-theme');
    } else {
      document.body.classList.add('dark-theme');
      document.body.classList.remove('light-theme');
    }
    localStorage.setItem('hrsdgdg-theme', themeMode);
  }, [themeMode]);

  const toggleTheme = () => {
    setThemeMode(prev => (prev === 'light' ? 'dark' : 'light'));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    try {
      await login(email, password, rememberMe);
    } catch (err) {
      setErrorMsg(err.message || (lang === 'ar' ? 'بيانات الاعتماد غير صحيحة.' : 'Identifiants incorrects.'));
    } finally {
      setLoading(false);
    }
  };

  const handleFillDemo = () => {
    setEmail('admin@hrsdgdg.com');
    setPassword('admin123');
    setErrorMsg('');
  };

  const isLight = themeMode === 'light';

  return (
    <div style={{
      minHeight: '100vh',
      width: '100vw',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'var(--bg-slate)',
      padding: '20px',
      position: 'relative',
      overflow: 'hidden',
      fontFamily: 'var(--font-sans)',
      transition: 'background-color 0.3s ease'
    }}>
      {/* Background Decorative Rings */}
      <div style={{
        position: 'absolute',
        width: '640px',
        height: '640px',
        borderRadius: '50%',
        border: '1px solid var(--border-gold)',
        opacity: isLight ? 0.35 : 0.15,
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        pointerEvents: 'none'
      }} />
      <div style={{
        position: 'absolute',
        width: '920px',
        height: '920px',
        borderRadius: '50%',
        border: '1px solid var(--border-gold)',
        opacity: isLight ? 0.2 : 0.08,
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        pointerEvents: 'none'
      }} />

      {/* Top Header Toolbar */}
      <div style={{
        position: 'absolute',
        top: '25px',
        right: isRtl ? 'auto' : '25px',
        left: isRtl ? '25px' : 'auto',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        zIndex: 10
      }}>
        {/* Light / Dark Mode Toggle */}
        <button
          type="button"
          onClick={toggleTheme}
          className="theme-mode-btn"
          style={{
            padding: '7px 14px',
            borderRadius: '20px',
            fontSize: '0.82rem'
          }}
          title={isLight ? (lang === 'ar' ? 'الوضع الليلي' : 'Mode Nuit') : (lang === 'ar' ? 'الوضع النهاري' : 'Fond Clair')}
        >
          <span>{isLight ? '🌙' : '☀️'}</span>
          <span>{isLight ? (lang === 'ar' ? 'الوضع الليلي' : 'Mode Nuit') : (lang === 'ar' ? 'الوضع النهاري' : 'Fond Clair')}</span>
        </button>

        {/* Language selector */}
        <select
          className="lang-select"
          value={lang}
          onChange={(e) => setLang(e.target.value)}
          style={{
            borderRadius: '20px',
            padding: '7px 14px',
            fontSize: '0.82rem'
          }}
        >
          <option value="fr">Français 🇫🇷</option>
          <option value="ar">العربية 🇲🇦</option>
          <option value="en">English 🇬🇧</option>
        </select>
      </div>

      {/* Login Card */}
      <div style={{
        width: '100%',
        maxWidth: '460px',
        backgroundColor: 'var(--bg-card)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid var(--border-gold)',
        borderRadius: 'var(--radius-lg)',
        padding: '42px 36px',
        boxShadow: isLight 
          ? '0 20px 50px rgba(0, 0, 0, 0.08), 0 0 25px rgba(179, 135, 40, 0.1)'
          : '0 25px 60px rgba(0, 0, 0, 0.8), 0 0 30px rgba(212, 175, 55, 0.12)',
        zIndex: 5,
        position: 'relative',
        transition: 'background-color 0.3s ease, box-shadow 0.3s ease'
      }}>
        {/* Logo & Header */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ display: 'inline-block', marginBottom: '16px' }}>
            <OriaLogo size={44} subtitle="ADMINISTRATION" />
          </div>
          <h2 style={{
            fontSize: '1.45rem',
            fontWeight: '700',
            color: 'var(--text-white)',
            margin: '0 0 8px 0',
            fontFamily: 'var(--font-serif)',
            letterSpacing: '0.4px'
          }}>
            {t('adminLoginTitle')}
          </h2>
          <p style={{
            fontSize: '0.88rem',
            color: 'var(--text-gray)',
            margin: 0
          }}>
            {t('adminLoginSubtitle')}
          </p>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div style={{
            backgroundColor: 'var(--danger-bg)',
            border: '1px solid var(--danger-border)',
            color: 'var(--danger-red)',
            padding: '12px 16px',
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.88rem',
            marginBottom: '22px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontWeight: '600'
          }}>
            <span>⚠️</span>
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit}>
          <div className="form-group" style={{ marginBottom: '22px' }}>
            <label style={{
              display: 'block',
              fontSize: '0.86rem',
              fontWeight: 700,
              color: 'var(--text-white)',
              marginBottom: '8px'
            }}>
              {t('email')}
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="email"
                placeholder="admin@hrsdgdg.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                style={{
                  width: '100%',
                  boxSizing: 'border-box'
                }}
              />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: '22px' }}>
            <label style={{
              display: 'block',
              fontSize: '0.86rem',
              fontWeight: 700,
              color: 'var(--text-white)',
              marginBottom: '8px'
            }}>
              {t('password')}
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                style={{
                  width: '100%',
                  padding: isRtl ? '12px 42px 12px 16px' : '12px 42px 12px 16px',
                  boxSizing: 'border-box'
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: isRtl ? 'auto' : '14px',
                  left: isRtl ? '14px' : 'auto',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-gray)',
                  cursor: 'pointer',
                  fontSize: '1rem',
                  padding: 0
                }}
                title={showPassword ? 'Masquer' : 'Afficher'}
              >
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          {/* Session Persistence Checkbox */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '25px',
            fontSize: '0.84rem'
          }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-gray)', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                style={{ accentColor: 'var(--admin-gold)', cursor: 'pointer', width: '16px', height: '16px' }}
              />
              <span>{lang === 'ar' ? 'البقاء متصلاً (جلسة 24 ساعة)' : 'Maintenir la session active (24h)'}</span>
            </label>
            <span style={{ fontSize: '0.74rem', color: 'var(--dark-gold)', opacity: 0.9, fontWeight: '600' }}>
              🛡️ {lang === 'ar' ? 'جلسة مشفرة' : 'Session sécurisée'}
            </span>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="btn-gold"
            style={{
              width: '100%',
              padding: '14px',
              fontSize: '1rem',
              fontWeight: '700',
              opacity: loading ? 0.7 : 1,
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? (
              <span>⏳ {t('signIn')}...</span>
            ) : (
              <>
                <span>🔐</span>
                <span>{t('signIn')}</span>
              </>
            )}
          </button>
        </form>

        {/* Demo Fast Access */}
        <div style={{
          marginTop: '28px',
          paddingTop: '22px',
          borderTop: '1px solid var(--border-subtle)',
          textAlign: 'center'
        }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-gray)', display: 'block', marginBottom: '12px' }}>
            {t('demoAccounts')}
          </span>
          <button
            type="button"
            onClick={handleFillDemo}
            className="btn-outline-gold"
            style={{
              padding: '8px 18px',
              borderRadius: '20px',
              fontSize: '0.82rem'
            }}
          >
            👑 {t('demoAdmin')}
          </button>
        </div>
      </div>
    </div>
  );
}
