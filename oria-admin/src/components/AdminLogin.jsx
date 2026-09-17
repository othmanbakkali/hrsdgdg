import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import OriaLogo from './OriaLogo';

export default function AdminLogin({ selectedTheme, setSelectedTheme }) {
  const { login } = useAuth();
  const { t, lang, setLang, isRtl } = useLanguage();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    try {
      await login(email, password);
    } catch (err) {
      setErrorMsg(err.message || 'Identifiants incorrects.');
    } finally {
      setLoading(false);
    }
  };

  const handleFillDemo = () => {
    setEmail('admin@hrsdgdg.com');
    setPassword('admin123');
    setErrorMsg('');
  };

  return (
    <div style={{
      minHeight: '100vh',
      width: '100vw',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#07090b',
      backgroundImage: 'radial-gradient(circle at 50% 20%, rgba(212, 175, 55, 0.08) 0%, rgba(7, 9, 11, 0.95) 70%)',
      padding: '20px',
      position: 'relative',
      overflow: 'hidden',
      fontFamily: 'Inter, system-ui, sans-serif'
    }}>
      {/* Background Decorative Rings */}
      <div style={{
        position: 'absolute',
        width: '600px',
        height: '600px',
        borderRadius: '50%',
        border: '1px solid rgba(212, 175, 55, 0.06)',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        pointerEvents: 'none'
      }} />
      <div style={{
        position: 'absolute',
        width: '900px',
        height: '900px',
        borderRadius: '50%',
        border: '1px solid rgba(212, 175, 55, 0.03)',
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
        gap: '15px',
        zIndex: 10
      }}>
        {/* Language selector */}
        <select
          className="lang-select"
          value={lang}
          onChange={(e) => setLang(e.target.value)}
          style={{
            backgroundColor: 'rgba(15, 20, 26, 0.8)',
            border: '1px solid var(--border-gold)',
            color: '#f5f5f7',
            padding: '6px 12px',
            borderRadius: '20px',
            fontSize: '0.85rem',
            cursor: 'pointer',
            outline: 'none'
          }}
        >
          <option value="fr">Français 🇫🇷</option>
          <option value="ar">العربية 🇲🇦 (RTL)</option>
          <option value="en">English 🇬🇧</option>
        </select>
      </div>

      {/* Login Card */}
      <div style={{
        width: '100%',
        maxWidth: '460px',
        backgroundColor: 'rgba(15, 18, 24, 0.85)',
        backdropFilter: 'blur(16px)',
        border: '1px solid var(--border-gold)',
        borderRadius: '16px',
        padding: '40px 35px',
        boxShadow: '0 25px 60px rgba(0, 0, 0, 0.7), 0 0 30px rgba(212, 175, 55, 0.08)',
        zIndex: 5,
        position: 'relative'
      }}>
        {/* Logo & Header */}
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <div style={{ display: 'inline-block', marginBottom: '15px' }}>
            <OriaLogo size={42} subtitle="ADMINISTRATION" />
          </div>
          <h2 style={{
            fontSize: '1.4rem',
            fontWeight: '600',
            color: '#ffffff',
            margin: '0 0 6px 0',
            fontFamily: 'Playfair Display, serif',
            letterSpacing: '0.5px'
          }}>
            {t('adminLoginTitle')}
          </h2>
          <p style={{
            fontSize: '0.85rem',
            color: 'var(--text-gray)',
            margin: 0
          }}>
            {t('adminLoginSubtitle')}
          </p>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div style={{
            backgroundColor: 'rgba(231, 76, 60, 0.12)',
            border: '1px solid rgba(231, 76, 60, 0.4)',
            color: '#ff6b6b',
            padding: '12px 16px',
            borderRadius: '8px',
            fontSize: '0.88rem',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            <span>⚠️</span>
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit}>
          <div className="form-group" style={{ marginBottom: '20px' }}>
            <label className="form-label" style={{
              display: 'block',
              fontSize: '0.85rem',
              color: 'var(--text-gray)',
              marginBottom: '8px'
            }}>
              {t('email')}
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="email"
                className="form-input"
                placeholder="admin@hrsdgdg.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={{
                  width: '100%',
                  backgroundColor: 'rgba(7, 9, 12, 0.7)',
                  border: '1px solid rgba(212, 175, 55, 0.25)',
                  borderRadius: '8px',
                  padding: '12px 14px',
                  color: '#ffffff',
                  fontSize: '0.95rem',
                  boxSizing: 'border-box',
                  outline: 'none'
                }}
              />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: '25px' }}>
            <label className="form-label" style={{
              display: 'block',
              fontSize: '0.85rem',
              color: 'var(--text-gray)',
              marginBottom: '8px'
            }}>
              {t('password')}
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                className="form-input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={{
                  width: '100%',
                  backgroundColor: 'rgba(7, 9, 12, 0.7)',
                  border: '1px solid rgba(212, 175, 55, 0.25)',
                  borderRadius: '8px',
                  padding: isRtl ? '12px 40px 12px 14px' : '12px 40px 12px 14px',
                  color: '#ffffff',
                  fontSize: '0.95rem',
                  boxSizing: 'border-box',
                  outline: 'none'
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: isRtl ? 'auto' : '12px',
                  left: isRtl ? '12px' : 'auto',
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

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              backgroundColor: 'var(--admin-gold)',
              color: '#07090b',
              border: 'none',
              borderRadius: '8px',
              padding: '14px',
              fontSize: '1rem',
              fontWeight: '700',
              cursor: loading ? 'not-allowed' : 'pointer',
              letterSpacing: '0.5px',
              boxShadow: '0 4px 15px rgba(212, 175, 55, 0.25)',
              transition: 'all 0.2s ease',
              opacity: loading ? 0.7 : 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px'
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
          marginTop: '25px',
          paddingTop: '20px',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          textAlign: 'center'
        }}>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-gray)', display: 'block', marginBottom: '10px' }}>
            {t('demoAccounts')}
          </span>
          <button
            type="button"
            onClick={handleFillDemo}
            style={{
              backgroundColor: 'rgba(212, 175, 55, 0.08)',
              border: '1px solid rgba(212, 175, 55, 0.25)',
              color: 'var(--admin-gold)',
              padding: '8px 16px',
              borderRadius: '20px',
              fontSize: '0.8rem',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            👑 {t('demoAdmin')}
          </button>
        </div>
      </div>
    </div>
  );
}
