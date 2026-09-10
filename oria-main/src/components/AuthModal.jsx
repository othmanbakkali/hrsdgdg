import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import OriaLogo from './OriaLogo';

export default function AuthModal({ isOpen, onClose, onAuthSuccess }) {
  const { login, register } = useAuth();
  const { lang, isRtl } = useLanguage();

  const [tab, setTab] = useState('login'); // 'login' | 'register'
  const [role, setRole] = useState('client'); // 'client' | 'commercant'
  
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
      welcomeBack: "Bienvenue sur ORIA",
      welcomeDesc: "Accédez à vos enchères privées, coffre-fort et commandes.",
      createAcc: "Rejoindre la Maison ORIA",
      createDesc: "Inscrivez-vous en tant que client privilégié ou joaillier certifié.",
      emailLabel: "Adresse Email",
      passLabel: "Mot de passe",
      nameLabel: "Nom & Prénom",
      phoneLabel: "Numéro de Téléphone",
      cityLabel: "Ville de Résidence",
      roleLabel: "Profil du compte",
      roleClient: "👤 Client Particulier",
      roleMerchant: "🏪 Maître Joaillier / Boutique",
      shopLabel: "Nom de la Joaillerie / Atelier",
      loginBtn: "Se Connecter",
      registerBtn: "Créer mon Compte",
      demoAccounts: "Accès Rapide Démo :",
      clientDemo: "Client (Yassine)",
      merchantDemo: "Joaillier (El Fassi)",
      watchDemo: "Horloger (Maroc Chrono)"
    },
    ar: {
      loginTab: "تسجيل الدخول",
      registerTab: "حساب جديد",
      welcomeBack: "مرحباً بكم في أوريا",
      welcomeDesc: "ادخل إلى مزاداتك الحصرية وطلباتك ومجوهراتك.",
      createAcc: "الانضمام إلى دار أوريا",
      createDesc: "سجل كزبون متميز أو كصائغ مجوهرات معتمد.",
      emailLabel: "البريد الإلكتروني",
      passLabel: "كلمة المرور",
      nameLabel: "الاسم الكامل",
      phoneLabel: "رقم الهاتف",
      cityLabel: "المدينة",
      roleLabel: "نوع الحساب",
      roleClient: "👤 زبون خاص",
      roleMerchant: "🏪 صائغ معتمد / متجر",
      shopLabel: "اسم متجر المجوهرات / الورشة",
      loginBtn: "تسجيل الدخول",
      registerBtn: "إنشاء الحساب",
      demoAccounts: "دخول سريع للتجربة :",
      clientDemo: "زبون (ياسين)",
      merchantDemo: "صائغ (الفاسي)",
      watchDemo: "ساعات (ماروك كرونو)"
    },
    en: {
      loginTab: "Sign In",
      registerTab: "Create Account",
      welcomeBack: "Welcome to ORIA",
      welcomeDesc: "Access your private auctions, vault, and orders.",
      createAcc: "Join Maison ORIA",
      createDesc: "Sign up as a VIP client or certified master jeweller.",
      emailLabel: "Email Address",
      passLabel: "Password",
      nameLabel: "Full Name",
      phoneLabel: "Phone Number",
      cityLabel: "City",
      roleLabel: "Account Type",
      roleClient: "👤 Private Client",
      roleMerchant: "🏪 Master Jeweller / Store",
      shopLabel: "Jewelry Store / Workshop Name",
      loginBtn: "Sign In",
      registerBtn: "Create Account",
      demoAccounts: "Quick Demo Logins:",
      clientDemo: "Client (Yassine)",
      merchantDemo: "Jeweller (El Fassi)",
      watchDemo: "Watches (Maroc Chrono)"
    }
  };

  const t = labels[lang] || labels.fr;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content auth-modal-box" onClick={e => e.stopPropagation()}>
        <button className="auth-close-btn" onClick={onClose} title="Fermer">✕</button>

        {/* Modal Top Brand Header */}
        <div className="auth-modal-header">
          <OriaLogo size={38} subtitle="ESPACE PRIVÉ" />
          <h3 className="auth-modal-title">{tab === 'login' ? t.welcomeBack : t.createAcc}</h3>
          <p className="auth-modal-subtitle">{tab === 'login' ? t.welcomeDesc : t.createDesc}</p>
        </div>

        {/* Tab Switcher */}
        <div className="auth-tab-switch">
          <button 
            type="button" 
            className={`auth-tab-btn ${tab === 'login' ? 'active' : ''}`}
            onClick={() => { setTab('login'); setErrorMsg(''); }}
          >
            🔑 {t.loginTab}
          </button>
          <button 
            type="button" 
            className={`auth-tab-btn ${tab === 'register' ? 'active' : ''}`}
            onClick={() => { setTab('register'); setErrorMsg(''); }}
          >
            ✨ {t.registerTab}
          </button>
        </div>

        {errorMsg && (
          <div className="auth-error-banner">
            ⚠️ {errorMsg}
          </div>
        )}

        {/* Form Container */}
        {tab === 'login' ? (
          <form onSubmit={handleLoginSubmit} className="auth-form-layout">
            <div className="form-group">
              <label className="form-label">
                <span>📧</span> {t.emailLabel}
              </label>
              <div className="form-input-wrapper">
                <input 
                  type="email" 
                  required 
                  className="form-input" 
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="nom@exemple.com"
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">
                <span>🔒</span> {t.passLabel}
              </label>
              <div className="form-input-wrapper">
                <input 
                  type="password" 
                  required 
                  className="form-input" 
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button type="submit" className="btn-gold auth-submit-btn" disabled={loading}>
              {loading ? "Vérification en cours..." : `👑 ${t.loginBtn}`}
            </button>

            {/* Quick Demo Fill Buttons */}
            <div className="auth-demo-section">
              <span className="auth-demo-title">{t.demoAccounts}</span>
              <div className="auth-demo-chips">
                <button 
                  type="button" 
                  className="auth-chip-btn"
                  onClick={() => setDemoAccount('client@oria.com', 'client123')}
                >
                  👤 {t.clientDemo}
                </button>
                <button 
                  type="button" 
                  className="auth-chip-btn"
                  onClick={() => setDemoAccount('gold@oria.com', 'gold123')}
                >
                  🏪 {t.merchantDemo}
                </button>
                <button 
                  type="button" 
                  className="auth-chip-btn"
                  onClick={() => setDemoAccount('watch@oria.com', 'watch123')}
                >
                  ⌚ {t.watchDemo}
                </button>
              </div>
            </div>
          </form>
        ) : (
          <form onSubmit={handleRegisterSubmit} className="auth-form-layout">
            <div className="form-group">
              <label className="form-label">{t.roleLabel}</label>
              <div className="role-selector-grid">
                <button 
                  type="button" 
                  className={`role-select-card ${role === 'client' ? 'active' : ''}`}
                  onClick={() => setRole('client')}
                >
                  {t.roleClient}
                </button>
                <button 
                  type="button" 
                  className={`role-select-card ${role === 'commercant' ? 'active' : ''}`}
                  onClick={() => setRole('commercant')}
                >
                  {t.roleMerchant}
                </button>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">
                <span>👤</span> {t.nameLabel}
              </label>
              <input 
                type="text" 
                required 
                className="form-input" 
                value={nom}
                onChange={e => setNom(e.target.value)}
                placeholder="Ex: Yassine Alami"
              />
            </div>

            {role === 'commercant' && (
              <div className="form-group">
                <label className="form-label">
                  <span>🏪</span> {t.shopLabel}
                </label>
                <input 
                  type="text" 
                  required 
                  className="form-input" 
                  value={shopName}
                  onChange={e => setShopName(e.target.value)}
                  placeholder="Ex: Joaillerie Royale Fès"
                />
              </div>
            )}

            <div className="form-row-grid">
              <div className="form-group">
                <label className="form-label">
                  <span>📱</span> {t.phoneLabel}
                </label>
                <input 
                  type="tel" 
                  required 
                  className="form-input" 
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="+212 6..."
                />
              </div>
              <div className="form-group">
                <label className="form-label">
                  <span>📍</span> {t.cityLabel}
                </label>
                <select 
                  className="form-input form-select"
                  value={city}
                  onChange={e => setCity(e.target.value)}
                >
                  <option value="Casablanca">Casablanca</option>
                  <option value="Rabat">Rabat</option>
                  <option value="Marrakech">Marrakech</option>
                  <option value="Fès">Fès</option>
                  <option value="Tanger">Tanger</option>
                  <option value="Agadir">Agadir</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">
                <span>📧</span> {t.emailLabel}
              </label>
              <input 
                type="email" 
                required 
                className="form-input" 
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="email@domaine.com"
              />
            </div>

            <div className="form-group">
              <label className="form-label">
                <span>🔒</span> {t.passLabel}
              </label>
              <input 
                type="password" 
                required 
                className="form-input" 
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>

            <button type="submit" className="btn-gold auth-submit-btn" disabled={loading}>
              {loading ? "Création du compte..." : `✨ ${t.registerBtn}`}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
