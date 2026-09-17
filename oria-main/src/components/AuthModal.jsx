import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import OriaLogo from './OriaLogo';

export default function AuthModal({ isOpen, onClose, onAuthSuccess }) {
  const { login, register } = useAuth();
  const { lang, isRtl } = useLanguage();

  const [tab, setTab] = useState('login'); // 'login' | 'register'
  const [role, setRole] = useState('client'); // 'client' | 'commercant'
  const [showPassword, setShowPassword] = useState(false);
  
  // Login fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // Register extra fields
  const [nom, setNom] = useState('');
  const [shopName, setShopName] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('Casablanca');

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);
    try {
      await login(email, password);
      setLoading(false);
      onClose();
      if (onAuthSuccess) onAuthSuccess('login');
    } catch (err) {
      setLoading(false);
      setErrorMsg(err.message || 'Email ou mot de passe incorrect.');
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);
    try {
      await register({
        email,
        mot_de_passe: password,
        nom,
        role,
        shopName: role === 'commercant' ? shopName : undefined,
        phone,
        city,
        address: city
      });
      setLoading(false);
      onClose();
      if (onAuthSuccess) onAuthSuccess('register');
    } catch (err) {
      setLoading(false);
      setErrorMsg(err.message || 'Erreur lors de la création du compte.');
    }
  };

  const setDemoAccount = (demoEmail, demoPass) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setErrorMsg('');
  };

  const labels = {
    fr: {
      loginTab: "Connexion",
      registerTab: "Créer un compte",
      welcomeBack: "Bienvenue sur HRSDGDG",
      welcomeDesc: "Accédez à votre coffre-fort, vos enchères privées et vos commandes.",
      createAcc: "Rejoindre la Maison HRSDGDG",
      createDesc: "Inscrivez-vous en tant que client privilégié ou joaillier certifié.",
      emailLabel: "Adresse Email",
      passLabel: "Mot de passe",
      nameLabel: "Nom & Prénom",
      phoneLabel: "Numéro de Téléphone",
      cityLabel: "Ville de Résidence",
      roleLabel: "Choisissez votre type de compte",
      roleClient: "Client Particulier",
      roleClientDesc: "Achetez, enchérissez et collectionnez des bijoux d'exception",
      roleMerchant: "Joaillier / Boutique",
      roleMerchantDesc: "Vendez vos créations, certifiez et gérez votre vitrine",
      shopLabel: "Nom de la Joaillerie / Atelier",
      loginBtn: "Se Connecter à mon Espace",
      registerBtn: "Créer mon Compte Privilège",
      demoAccounts: "Accès Rapide Démo :",
      clientDemo: "Client (Yassine)",
      merchantDemo: "Joaillier (El Fassi)",
      watchDemo: "Horloger (Maroc Chrono)",
      trustSecurity: "Transactions 100% sécurisées • Authentification certifiée"
    },
    ar: {
      loginTab: "تسجيل الدخول",
      registerTab: "حساب جديد",
      welcomeBack: "مرحباً بكم في دار HRSDGDG",
      welcomeDesc: "ادخل إلى خزنتك ومزاداتك الحصرية وطلباتك.",
      createAcc: "الانضمام إلى دار HRSDGDG",
      createDesc: "سجل كزبون متميز أو كصائغ مجوهرات معتمد.",
      emailLabel: "البريد الإلكتروني",
      passLabel: "كلمة المرور",
      nameLabel: "الاسم الكامل",
      phoneLabel: "رقم الهاتف",
      cityLabel: "المدينة",
      roleLabel: "اختر نوع الحساب",
      roleClient: "زبون خاص",
      roleClientDesc: "تسوق واقتنِ أندر المجوهرات وشارك في المزادات",
      roleMerchant: "صائغ معتمد / متجر",
      roleMerchantDesc: "اعرض مجوهراتك وأدر مبيعاتك بكل احترافية",
      shopLabel: "اسم متجر المجوهرات / الورشة",
      loginBtn: "تسجيل الدخول",
      registerBtn: "إنشاء الحساب",
      demoAccounts: "دخول سريع للتجربة :",
      clientDemo: "زبون (ياسين)",
      merchantDemo: "صائغ (الفاسي)",
      watchDemo: "ساعات (ماروك كرونو)",
      trustSecurity: "معاملات آمنة 100% • مجوهرات معتمدة وموثوقة"
    },
    en: {
      loginTab: "Sign In",
      registerTab: "Create Account",
      welcomeBack: "Welcome to HRSDGDG",
      welcomeDesc: "Access your private vault, live auctions, and orders.",
      createAcc: "Join Maison HRSDGDG",
      createDesc: "Sign up as a VIP client or certified master jeweller.",
      emailLabel: "Email Address",
      passLabel: "Password",
      nameLabel: "Full Name",
      phoneLabel: "Phone Number",
      cityLabel: "City",
      roleLabel: "Choose account profile",
      roleClient: "Private Client",
      roleClientDesc: "Buy, bid, and collect authenticated luxury jewelry",
      roleMerchant: "Master Jeweller / Store",
      roleMerchantDesc: "Sell your creations and manage certified boutique catalog",
      shopLabel: "Jewelry Store / Workshop Name",
      loginBtn: "Sign In to My Account",
      registerBtn: "Create VIP Account",
      demoAccounts: "Quick Demo Logins:",
      clientDemo: "Client (Yassine)",
      merchantDemo: "Jeweller (El Fassi)",
      watchDemo: "Watches (Maroc Chrono)",
      trustSecurity: "100% Secure Transactions • Certified Gemmology"
    }
  };

  const t = labels[lang] || labels.fr;

  return (
    <div className="modal-overlay auth-modal-overlay" onClick={onClose}>
      <div 
        className="modal-content auth-modal-card" 
        onClick={e => e.stopPropagation()}
        style={{ direction: isRtl ? 'rtl' : 'ltr' }}
      >
        {/* Top Close Button */}
        <button 
          className="auth-modal-close" 
          onClick={onClose} 
          title="Fermer"
          aria-label="Fermer la fenêtre"
        >
          ✕
        </button>

        {/* Ambient Top Glow */}
        <div className="auth-card-top-glow" />

        {/* Modal Brand Header */}
        <div className="auth-modal-header">
          <div className="auth-logo-center">
            <OriaLogo size={42} subtitle="ESPACE PRIVÉ" />
          </div>
          <h2 className="auth-modal-title">
            {tab === 'login' ? t.welcomeBack : t.createAcc}
          </h2>
          <p className="auth-modal-subtitle">
            {tab === 'login' ? t.welcomeDesc : t.createDesc}
          </p>
        </div>

        {/* Luxury Segmented Tab Switcher */}
        <div className="auth-tab-pill-container">
          <button 
            type="button" 
            className={`auth-tab-pill ${tab === 'login' ? 'active' : ''}`}
            onClick={() => { setTab('login'); setErrorMsg(''); }}
          >
            <span className="auth-tab-icon">🔑</span>
            <span className="auth-tab-text">{t.loginTab}</span>
          </button>
          <button 
            type="button" 
            className={`auth-tab-pill ${tab === 'register' ? 'active' : ''}`}
            onClick={() => { setTab('register'); setErrorMsg(''); }}
          >
            <span className="auth-tab-icon">✨</span>
            <span className="auth-tab-text">{t.registerTab}</span>
          </button>
        </div>

        {/* Error Alert Banner */}
        {errorMsg && (
          <div className="auth-error-alert" role="alert">
            <span className="auth-error-icon">⚠️</span>
            <span>{errorMsg}</span>
          </div>
        )}

        {/* FORM BODY */}
        {tab === 'login' ? (
          <form onSubmit={handleLoginSubmit} className="auth-form-body">
            {/* Email Input */}
            <div className="auth-field-group">
              <label className="auth-field-label">
                <span className="auth-label-icon">✉️</span>
                <span>{t.emailLabel}</span>
              </label>
              <div className="auth-input-container">
                <input 
                  type="email" 
                  required 
                  className="auth-text-input" 
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="nom@exemple.com"
                  autoComplete="email"
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="auth-field-group">
              <div className="auth-label-row">
                <label className="auth-field-label">
                  <span className="auth-label-icon">🔒</span>
                  <span>{t.passLabel}</span>
                </label>
              </div>
              <div className="auth-input-container">
                <input 
                  type={showPassword ? "text" : "password"} 
                  required 
                  className="auth-text-input has-toggle" 
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="auth-pwd-toggle-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  title={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                >
                  {showPassword ? "👁️‍🗨️" : "👁️"}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button 
              type="submit" 
              className="auth-primary-submit-btn" 
              disabled={loading}
            >
              {loading ? (
                <span className="auth-loading-spinner-wrapper">
                  <span className="auth-spinner" />
                  <span>Vérification en cours...</span>
                </span>
              ) : (
                <>
                  <span>👑</span>
                  <span>{t.loginBtn}</span>
                </>
              )}
            </button>

            {/* Quick Demo Access Bar */}
            <div className="auth-demo-box">
              <div className="auth-demo-header">
                <span className="auth-demo-icon">⚡</span>
                <span className="auth-demo-title">{t.demoAccounts}</span>
              </div>
              <div className="auth-demo-buttons-grid">
                <button 
                  type="button" 
                  className="auth-demo-pill"
                  onClick={() => setDemoAccount('client@oria.com', 'client123')}
                >
                  <span className="demo-pill-icon">👤</span>
                  <span className="demo-pill-text">{t.clientDemo}</span>
                </button>
                <button 
                  type="button" 
                  className="auth-demo-pill"
                  onClick={() => setDemoAccount('gold@oria.com', 'gold123')}
                >
                  <span className="demo-pill-icon">🏪</span>
                  <span className="demo-pill-text">{t.merchantDemo}</span>
                </button>
                <button 
                  type="button" 
                  className="auth-demo-pill"
                  onClick={() => setDemoAccount('watch@oria.com', 'watch123')}
                >
                  <span className="demo-pill-icon">⌚</span>
                  <span className="demo-pill-text">{t.watchDemo}</span>
                </button>
              </div>
            </div>
          </form>
        ) : (
          <form onSubmit={handleRegisterSubmit} className="auth-form-body">
            {/* Account Type Selector Cards */}
            <div className="auth-field-group">
              <label className="auth-field-label">
                <span className="auth-label-icon">💎</span>
                <span>{t.roleLabel}</span>
              </label>
              <div className="auth-role-cards-grid">
                <div 
                  className={`auth-role-card ${role === 'client' ? 'selected' : ''}`}
                  onClick={() => setRole('client')}
                >
                  <div className="role-card-header">
                    <span className="role-card-icon">👤</span>
                    <span className="role-card-title">{t.roleClient}</span>
                    <span className="role-card-radio">{role === 'client' ? '●' : '○'}</span>
                  </div>
                  <p className="role-card-desc">{t.roleClientDesc}</p>
                </div>

                <div 
                  className={`auth-role-card ${role === 'commercant' ? 'selected' : ''}`}
                  onClick={() => setRole('commercant')}
                >
                  <div className="role-card-header">
                    <span className="role-card-icon">🏪</span>
                    <span className="role-card-title">{t.roleMerchant}</span>
                    <span className="role-card-radio">{role === 'commercant' ? '●' : '○'}</span>
                  </div>
                  <p className="role-card-desc">{t.roleMerchantDesc}</p>
                </div>
              </div>
            </div>

            {/* Name */}
            <div className="auth-field-group">
              <label className="auth-field-label">
                <span className="auth-label-icon">👤</span>
                <span>{t.nameLabel}</span>
              </label>
              <div className="auth-input-container">
                <input 
                  type="text" 
                  required 
                  className="auth-text-input" 
                  value={nom}
                  onChange={e => setNom(e.target.value)}
                  placeholder="Ex: Yassine Alami"
                  autoComplete="name"
                />
              </div>
            </div>

            {/* Shop Name (Merchant only) */}
            {role === 'commercant' && (
              <div className="auth-field-group animate-slide-down">
                <label className="auth-field-label">
                  <span className="auth-label-icon">🏪</span>
                  <span>{t.shopLabel}</span>
                </label>
                <div className="auth-input-container">
                  <input 
                    type="text" 
                    required 
                    className="auth-text-input" 
                    value={shopName}
                    onChange={e => setShopName(e.target.value)}
                    placeholder="Ex: Joaillerie Royale Fès"
                  />
                </div>
              </div>
            )}

            {/* Phone & City Grid */}
            <div className="auth-two-col-grid">
              <div className="auth-field-group">
                <label className="auth-field-label">
                  <span className="auth-label-icon">📱</span>
                  <span>{t.phoneLabel}</span>
                </label>
                <div className="auth-input-container">
                  <input 
                    type="tel" 
                    required 
                    className="auth-text-input" 
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="+212 6 00 00 00 00"
                    autoComplete="tel"
                  />
                </div>
              </div>

              <div className="auth-field-group">
                <label className="auth-field-label">
                  <span className="auth-label-icon">📍</span>
                  <span>{t.cityLabel}</span>
                </label>
                <div className="auth-input-container">
                  <select 
                    className="auth-text-input auth-select-input"
                    value={city}
                    onChange={e => setCity(e.target.value)}
                  >
                    <option value="Casablanca">Casablanca</option>
                    <option value="Rabat">Rabat</option>
                    <option value="Marrakech">Marrakech</option>
                    <option value="Fès">Fès</option>
                    <option value="Tanger">Tanger</option>
                    <option value="Agadir">Agadir</option>
                    <option value="Meknès">Meknès</option>
                    <option value="Oujda">Oujda</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Email */}
            <div className="auth-field-group">
              <label className="auth-field-label">
                <span className="auth-label-icon">✉️</span>
                <span>{t.emailLabel}</span>
              </label>
              <div className="auth-input-container">
                <input 
                  type="email" 
                  required 
                  className="auth-text-input" 
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="nom@exemple.com"
                  autoComplete="email"
                />
              </div>
            </div>

            {/* Password */}
            <div className="auth-field-group">
              <label className="auth-field-label">
                <span className="auth-label-icon">🔒</span>
                <span>{t.passLabel}</span>
              </label>
              <div className="auth-input-container">
                <input 
                  type={showPassword ? "text" : "password"} 
                  required 
                  className="auth-text-input has-toggle" 
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="•••••••• (Min. 6 caractères)"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  className="auth-pwd-toggle-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  title={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                >
                  {showPassword ? "👁️‍🗨️" : "👁️"}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button 
              type="submit" 
              className="auth-primary-submit-btn" 
              disabled={loading}
            >
              {loading ? (
                <span className="auth-loading-spinner-wrapper">
                  <span className="auth-spinner" />
                  <span>Création du compte...</span>
                </span>
              ) : (
                <>
                  <span>✨</span>
                  <span>{t.registerBtn}</span>
                </>
              )}
            </button>
          </form>
        )}

        {/* Security & Trust Footer */}
        <div className="auth-trust-footer">
          <span className="trust-icon">🛡️</span>
          <span className="trust-text">{t.trustSecurity}</span>
        </div>
      </div>
    </div>
  );
}
