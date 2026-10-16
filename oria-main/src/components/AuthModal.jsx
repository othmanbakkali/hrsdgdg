import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { API_URL } from '../config/api';
import OriaLogo from './OriaLogo';

export default function AuthModal({ isOpen, onClose, onAuthSuccess, initialTab = 'register' }) {
  const { login, register } = useAuth();
  const { lang, isRtl } = useLanguage();

  const [tab, setTab] = useState(initialTab); // 'login' | 'register'
  const [role, setRole] = useState('commercant'); // Inscription réservée aux professionnels
  const [showPassword, setShowPassword] = useState(false);

  // Sync tab if initialTab changes
  useEffect(() => {
    if (initialTab) setTab(initialTab);
  }, [initialTab, isOpen]);

  // Login fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Register extra fields (Professional Joaillier)
  const [nom, setNom] = useState('');
  const [shopName, setShopName] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('Casablanca');
  const [numeroPatente, setNumeroPatente] = useState('');
  const [patenteDocBase64, setPatenteDocBase64] = useState('');
  const [patenteDocName, setPatenteDocName] = useState('');
  const [patenteDocSize, setPatenteDocSize] = useState('');

  // Helper to normalize Moroccan phone numbers to +212XXXXXXXXX
  const formatMoroccanInternationalPhone = (raw) => {
    if (!raw) return '';
    let cleaned = String(raw).replace(/[^\d+]/g, '');
    if (cleaned.startsWith('00212')) {
      cleaned = '+212' + cleaned.substring(5);
    } else if (cleaned.startsWith('212')) {
      cleaned = '+' + cleaned;
    } else if (cleaned.startsWith('0') && cleaned.length >= 10) {
      cleaned = '+212' + cleaned.substring(1);
    } else if (!cleaned.startsWith('+212') && cleaned.length === 9) {
      cleaned = '+212' + cleaned;
    }
    return cleaned;
  };

  // Subscription plan selection for merchants
  const [plans, setPlans] = useState([
    {
      id: 'plan_starter',
      name: 'Pass Essentiel',
      name_fr: 'Pass Essentiel',
      name_ar: 'الباقة الأساسية',
      price_monthly: 0,
      price_annual: 0,
      max_products: 5,
      commission_rate: 8,
      popular: false
    },
    {
      id: 'plan_pro',
      name: 'Pack Prestige Joaillier',
      name_fr: 'Pack Prestige Joaillier',
      name_ar: 'باقة المحترفين',
      price_monthly: 490,
      price_annual: 4700,
      max_products: 30,
      commission_rate: 4,
      popular: true
    },
    {
      id: 'plan_vip',
      name: 'Haute Joaillerie VIP',
      name_fr: 'Haute Joaillerie VIP',
      name_ar: 'باقة كبار الصاغة VIP',
      price_monthly: 1290,
      price_annual: 11900,
      max_products: 9999,
      commission_rate: 2,
      popular: false
    }
  ]);
  const [selectedPlanId, setSelectedPlanId] = useState('plan_pro');
  const [billingCycle, setBillingCycle] = useState('monthly');

  useEffect(() => {
    fetch(`${API_URL}/subscription-plans`)
      .then(res => res.ok ? res.json() : [])
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setPlans(data);
          if (!data.some(p => p.id === selectedPlanId)) {
            const pop = data.find(p => p.popular) || data[0];
            if (pop) setSelectedPlanId(pop.id);
          }
        }
      })
      .catch(() => {});
  }, [isOpen]);

  // Terms & Conditions States
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [termsLangTab, setTermsLangTab] = useState(lang === 'ar' ? 'ar' : 'fr');
  const [copySuccessToast, setCopySuccessToast] = useState('');
  const [registeredPendingSuccess, setRegisteredPendingSuccess] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  // Password strength calculation
  const getPasswordStrength = (pwd) => {
    if (!pwd) return { score: 0, text: '', color: '' };
    if (pwd.length < 6) return { score: 1, text: lang === 'ar' ? 'ضعيفة (أقل من 6 أحرف)' : 'Faible (min. 6 car.)', color: '#ef4444' };
    if (pwd.length >= 8 && /[0-9]/.test(pwd) && /[^A-Za-z0-9]/.test(pwd)) {
      return { score: 3, text: lang === 'ar' ? 'ممتازة وقوية جداً 🛡️' : 'Excellente & Sécurisée 🛡️', color: '#10b981' };
    }
    return { score: 2, text: lang === 'ar' ? 'جيدة ومقبولة 👍' : 'Correcte 👍', color: '#d4af37' };
  };

  const pwdStrength = getPasswordStrength(password);

  // Generate a strong, memorable luxury password
  const generateStrongPassword = () => {
    const randomSuffix = Math.floor(100 + Math.random() * 900);
    const suggested = `Oria${randomSuffix}!Gold`;
    setPassword(suggested);
    setShowPassword(true);
    
    // Copy to clipboard
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(suggested).catch(() => {});
    }
    setCopySuccessToast(lang === 'ar' ? 'تم إنشاء كلمة مرور قوية ونسخها لحافظتك! 📋' : 'Mot de passe sécurisé généré et copié ! 📋');
    setTimeout(() => setCopySuccessToast(''), 4000);
  };

  // Handle Patente File Upload (PDF, JPG, PNG, WEBP)
  const handlePatenteFileChange = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setErrorMsg(lang === 'ar' ? 'حجم الملف كبير جداً (الحد الأقصى 10 ميغابايت).' : 'Le document est trop volumineux (max 10 Mo).');
      return;
    }

    setPatenteDocName(file.name);
    setPatenteDocSize((file.size / 1024).toFixed(1) + ' KB');

    const reader = new FileReader();
    reader.onload = (ev) => {
      setPatenteDocBase64(ev.target.result);
      setErrorMsg('');
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePatenteDoc = () => {
    setPatenteDocBase64('');
    setPatenteDocName('');
    setPatenteDocSize('');
  };

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
      setErrorMsg(err.message || (lang === 'ar' ? 'البريد الإلكتروني أو كلمة المرور غير صحيحة.' : 'Email ou mot de passe incorrect.'));
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    // Quick validations
    if (!nom.trim()) {
      setErrorMsg(lang === 'ar' ? 'يرجى إدخال اسم المسؤول / المدير.' : 'Veuillez saisir votre nom complet.');
      return;
    }
    if (!shopName.trim()) {
      setErrorMsg(lang === 'ar' ? 'يرجى إدخال اسم متجر المجوهرات أو الورشة.' : 'Veuillez saisir le nom de votre bijouterie / atelier.');
      return;
    }
    if (!numeroPatente.trim()) {
      setErrorMsg(lang === 'ar' ? 'يرجى إدخال رقم الباتنت أو السجل التجاري.' : 'Veuillez saisir votre numéro de Patente ou Registre de Commerce (RC).');
      return;
    }
    if (!patenteDocBase64) {
      setErrorMsg(lang === 'ar' ? 'يرجى تحميل وثيقة الباتنت أو السجل التجاري لتفعيل حسابكم المهني.' : 'Veuillez joindre votre attestation de Patente (Image ou PDF).');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setErrorMsg(lang === 'ar' ? 'يرجى إدخال بريد إلكتروني صالح.' : 'Veuillez saisir un email valide.');
      return;
    }
    if (password.length < 6) {
      setErrorMsg(lang === 'ar' ? 'كلمة المرور يجب أن تتكون من 6 أحرف على الأقل.' : 'Le mot de passe doit comporter au moins 6 caractères.');
      return;
    }
    if (!acceptTerms) {
      setErrorMsg(lang === 'ar' ? 'يرجى تأكيد الموافقة على شروط وأحكام استخدام التطبيق للمتابعة.' : 'Veuillez accepter les termes et conditions d\'utilisation pour finaliser votre inscription.');
      return;
    }

    setLoading(true);
    try {
      const res = await register({
        email: email.trim(),
        mot_de_passe: password,
        nom: nom.trim(),
        role: 'commercant',
        shopName: shopName.trim(),
        phone: phone.trim(),
        city,
        address: city,
        numero_patente: numeroPatente.trim(),
        patente_document: patenteDocBase64,
        patente_filename: patenteDocName || `Patente_${numeroPatente.trim() || 'Pro'}.pdf`,
        plan_id: selectedPlanId,
        billing_cycle: billingCycle
      });
      setLoading(false);
      setRegisteredPendingSuccess(true);
    } catch (err) {
      setLoading(false);
      setErrorMsg(err.message || (lang === 'ar' ? 'حدث خطأ أثناء إنشاء الحساب. قد يكون البريد مسجلاً بالفعل.' : 'Erreur lors de la création du compte.'));
    }
  };

  const setDemoAccount = (demoEmail, demoPass) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setErrorMsg('');
  };

  // Top Moroccan cities for quick 1-click pills
  const topMoroccanCities = [
    { key: 'Casablanca', ar: 'الدار البيضاء', fr: 'Casablanca' },
    { key: 'Rabat', ar: 'الرباط', fr: 'Rabat' },
    { key: 'Marrakech', ar: 'مراكش', fr: 'Marrakech' },
    { key: 'Fès', ar: 'فاس', fr: 'Fès' },
    { key: 'Tanger', ar: 'طنجة', fr: 'Tanger' },
    { key: 'Agadir', ar: 'أكادير', fr: 'Agadir' }
  ];

  const labels = {
    fr: {
      loginTab: "Connexion",
      registerTab: "Créer un compte Pro",
      welcomeBack: "Bienvenue sur HRSDGDG",
      welcomeDesc: "Accédez à votre coffre-fort, vos enchères privées et vos commandes.",
      createAcc: "Espace Professionnel Agréé",
      createDesc: "Inscription strictement réservée aux bijoutiers, artisans orfèvres et joailliers agréés.",
      emailLabel: "Adresse Email Professionnelle",
      passLabel: "Mot de passe",
      generatePwd: "🔑 Générer un mot de passe fort",
      nameLabel: "Nom & Prénom du Gérant / Responsable",
      phoneLabel: "Numéro de Téléphone (WhatsApp)",
      phoneHint: "Pour la validation du compte et le suivi commercial",
      cityLabel: "Ville de l'Atelier / Boutique",
      roleLabel: "Statut Professionnel",
      proOnlyBannerTitle: "Espace Réservé aux Professionnels de la Joaillerie",
      proOnlyBannerDesc: "L'inscription sur HRSDGDG est exclusivement réservée aux bijouteries, ateliers et orfèvres agréés munis d'un numéro de patente valide au Maroc.",
      shopLabel: "Nom de la Joaillerie / Atelier",
      patenteNumberLabel: "Numéro de Patente / Registre de Commerce (RC)",
      patenteDocLabel: "Attestation de Patente / Document Professionnel",
      patenteDocHint: "Joindre une photo nette ou un PDF de votre patente (max 10 Mo)",
      patenteUploadBtn: "Télécharger l'attestation de Patente 📄",
      patenteUploadedSuccess: "Document joint avec succès ✓",
      subscriptionTitle: "Choix de votre Forfait Commerçant",
      subscriptionSubtitle: "Sélectionnez la formule adaptée à votre atelier ou bijouterie",
      monthlyBilling: "Facturation Mensuelle",
      annualBilling: "Facturation Annuelle (-20% 🎁)",
      recommendedPlan: "⭐ Recommandé",
      freeBadge: "Gratuit",
      perMonth: "/mois",
      perYear: "/an",
      termsAcceptPrefix: "J'accepte les ",
      termsLinkText: "termes et conditions d'utilisation",
      termsAcceptSuffix: " de l'application",
      termsModalTitle: "Conditions Générales d'Utilisation (CGU)",
      termsModalSubtitle: "Plateforme Numérique de Joaillerie HRSDGDG Maroc",
      termsAcceptAndClose: "J'accepte les conditions",
      termsCloseBtn: "Fermer",
      loginBtn: "Se Connecter à mon Espace",
      registerBtn: "Créer mon Compte Professionnel Agréé 👑",
      demoAccounts: "Accès Rapide Démo :",
      clientDemo: "Client (Yassine)",
      merchantDemo: "Joaillier (El Fassi)",
      watchDemo: "Horloger (Maroc Chrono)",
      trustSecurity: "Transactions 100% sécurisées • Or 18K Garanti • Patente vérifiée",
      alreadyHaveAcc: "Vous avez déjà un compte ?",
      dontHaveAcc: "Vous êtes artisan / bijoutier ?",
      switchLogin: "Se connecter",
      switchRegister: "Créer un compte Pro"
    },
    ar: {
      loginTab: "تسجيل الدخول",
      registerTab: "حساب مهني جديد",
      welcomeBack: "مرحباً بكم في دار HRSDGDG",
      welcomeDesc: "ادخل إلى خزنتك ومزاداتك الحصرية وطلباتك بكل أمان.",
      createAcc: "تسجيل الصاغة والمحلات المعتمدة",
      createDesc: "التسجيل في المنصة مخصص حصرياً للمحترفين والصاغة المعتمدين لممارسة الصياغة بالمغرب.",
      emailLabel: "البريد الإلكتروني المهني",
      passLabel: "كلمة المرور",
      generatePwd: "🔑 توليد كلمة مرور قوية",
      nameLabel: "الاسم الكامل للمسؤول / المدير",
      phoneLabel: "رقم الهاتف / واتساب",
      phoneHint: "لتأكيد الحساب ومتابعة مبيعات المجوهرات والمزادات",
      cityLabel: "مدينة المتجر / الورشة",
      roleLabel: "الصفة المهنية",
      proOnlyBannerTitle: "مساحة حصرية للصاغة وتجار المجوهرات المعتمدين",
      proOnlyBannerDesc: "التسجيل في المنصة مخصص حصرياً للمحلات والورشات والصاغة الحاصلين على رقم باتنت وسجل مهني معتمد بالمغرب.",
      shopLabel: "اسم متجر المجوهرات / الورشة",
      patenteNumberLabel: "رقم الباتنت / السجل التجاري (RC)",
      patenteDocLabel: "شهادة الباتنت / الوثيقة المهنية",
      patenteDocHint: "أرفق صورة واضحة أو ملف PDF لوثيقة الباتنت (الحد الأقصى 10 ميغابايت)",
      patenteUploadBtn: "تحميل وثيقة الباتنت 📄",
      patenteUploadedSuccess: "تم إرفاق الوثيقة بنجاح ✓",
      subscriptionTitle: "اختر باقة الاشتراك لمتجرك",
      subscriptionSubtitle: "حدد الباقة المناسبة لحجم ونشاط ورشتك أو مجوهراتك",
      monthlyBilling: "اشتراك شهري",
      annualBilling: "اشتراك سنوي (خصم 20% 🎁)",
      recommendedPlan: "⭐ الأكثر طلباً",
      freeBadge: "مجاناً",
      perMonth: "/شهر",
      perYear: "/سنة",
      termsAcceptPrefix: "أوافق على ",
      termsLinkText: "شروط وأحكام استخدام التطبيق",
      termsAcceptSuffix: "",
      termsModalTitle: "شروط وأحكام استخدام المنصة (CGU)",
      termsModalSubtitle: "المنصة الرسمية للصاغة وتجار المجوهرات بالمغرب",
      termsAcceptAndClose: "أوافق على الشروط",
      termsCloseBtn: "إغلاق",
      loginBtn: "تسجيل الدخول إلى حسابي",
      registerBtn: "تأكيد وإنشاء الحساب المهني 👑",
      demoAccounts: "دخول سريع للتجربة :",
      clientDemo: "زبون (ياسين)",
      merchantDemo: "صائغ (الفاسي)",
      watchDemo: "ساعات (ماروك كرونو)",
      trustSecurity: "معاملات آمنة 100% • ذهب عيار 18k موثق • باتنت معتمدة",
      alreadyHaveAcc: "لديك حساب بالفعل؟",
      dontHaveAcc: "هل أنت صائغ / تاجر مجوهرات ؟",
      switchLogin: "تسجيل الدخول",
      switchRegister: "حساب مهني جديد"
    },
    en: {
      loginTab: "Sign In",
      registerTab: "Pro Register",
      welcomeBack: "Welcome to HRSDGDG",
      welcomeDesc: "Access your private vault, live auctions, and orders.",
      createAcc: "Certified Jeweller Registration",
      createDesc: "Registration is strictly reserved for certified jewelry boutiques and workshops.",
      emailLabel: "Business Email Address",
      passLabel: "Password",
      generatePwd: "🔑 Generate Strong Password",
      nameLabel: "Full Name of Manager / Owner",
      phoneLabel: "Phone Number (WhatsApp)",
      phoneHint: "For account verification and commercial follow-up",
      cityLabel: "Boutique / Workshop City",
      roleLabel: "Professional Status",
      proOnlyBannerTitle: "Exclusive Space for Certified Jewelers",
      proOnlyBannerDesc: "Registration on HRSDGDG is strictly reserved for jewelry shops and certified artisans holding a valid tax business license (Patente) in Morocco.",
      shopLabel: "Jewelry Store / Workshop Name",
      patenteNumberLabel: "Tax License Number / Commercial Register (RC)",
      patenteDocLabel: "Tax License Document / Pro Certificate",
      patenteDocHint: "Attach a clear photo or PDF of your business license (max 10 MB)",
      patenteUploadBtn: "Upload Tax License Document 📄",
      patenteUploadedSuccess: "Document attached successfully ✓",
      subscriptionTitle: "Select your Merchant Plan",
      subscriptionSubtitle: "Choose the package tailored to your workshop or jewelry salon",
      monthlyBilling: "Monthly Billing",
      annualBilling: "Annual Billing (-20% 🎁)",
      recommendedPlan: "⭐ Recommended",
      freeBadge: "Free",
      perMonth: "/mo",
      perYear: "/yr",
      termsAcceptPrefix: "I accept the ",
      termsLinkText: "Terms and Conditions of Use",
      termsAcceptSuffix: " of the application",
      termsModalTitle: "Terms & Conditions of Use",
      termsModalSubtitle: "Official HRSDGDG Luxury Jewelry Platform Morocco",
      termsAcceptAndClose: "I Accept the Terms",
      termsCloseBtn: "Close",
      loginBtn: "Sign In to My Account",
      registerBtn: "Create My Certified Pro Account 👑",
      demoAccounts: "Express Demo Access:",
      clientDemo: "Client (Yassine)",
      merchantDemo: "Jeweller (El Fassi)",
      watchDemo: "Watchmaker (Maroc Chrono)",
      trustSecurity: "100% Secure Transactions • 18K Gold Guaranteed • Verified Business License",
      alreadyHaveAcc: "Already have an account?",
      dontHaveAcc: "Are you an artisan / jeweller?",
      switchLogin: "Sign In",
      switchRegister: "Register Pro Account"
    }
  };

  const t = labels[lang] || labels.ar;

  const whatsappMessage = encodeURIComponent(
    lang === 'ar'
      ? 'السلام عليكم، أحتاج مساعدة سريعة لإنشاء حسابي على منصة HRSDGDG للمجوهرات.'
      : 'Bonjour, je souhaite une assistance rapide pour créer mon compte sur la plateforme HRSDGDG.'
  );

  return (
    <div className="modal-overlay auth-modal-overlay" onClick={onClose}>
      <div 
        className="modal-content auth-modal-card auth-modal-card-v2" 
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

        {/* Segmented Tab Switcher */}
        <div className="auth-tab-pill-container">
          <button 
            type="button" 
            className={`auth-tab-pill ${tab === 'register' ? 'active' : ''}`}
            onClick={() => { setTab('register'); setErrorMsg(''); }}
          >
            <span className="auth-tab-icon">✨</span>
            <span className="auth-tab-text">{t.registerTab}</span>
            <span className="auth-fast-chip">15s</span>
          </button>
          <button 
            type="button" 
            className={`auth-tab-pill ${tab === 'login' ? 'active' : ''}`}
            onClick={() => { setTab('login'); setErrorMsg(''); }}
          >
            <span className="auth-tab-icon">🔑</span>
            <span className="auth-tab-text">{t.loginTab}</span>
          </button>
        </div>

        {/* Error Alert Banner */}
        {errorMsg && (
          <div className="auth-error-alert" role="alert">
            <span className="auth-error-icon">⚠️</span>
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Quick Fill / Copy Notification Toasts */}
        {copySuccessToast && (
          <div className="auth-toast-alert success">
            <span>📋</span>
            <span>{copySuccessToast}</span>
          </div>
        )}

        {/* ========================================================
            TAB 1: REGISTRATION (EXCLUSIVELY FOR PROFESSIONALS)
            ======================================================== */}
        {tab === 'register' ? (
          registeredPendingSuccess ? (
            <div className="auth-pending-success-card animate-fade-in">
              <div className="pending-badge-icon-wrap">
                <span className="pending-big-icon">⏳</span>
                <span className="pending-status-pill">
                  {lang === 'ar' ? 'قيد المراجعة والاعتماد' : 'En attente d\'activation'}
                </span>
              </div>

              <h3 className="pending-success-title" style={{ color: 'var(--primary-gold)', fontFamily: 'var(--font-serif)', fontSize: '1.3rem', margin: '10px 0' }}>
                {lang === 'ar' ? 'طلبكم في طور المعالجة.' : 'Votre demande est en cours de traitement.'}
              </h3>
              <p className="pending-success-subtitle" style={{ color: 'var(--text-gray)', fontSize: '0.9rem', marginBottom: '16px' }}>
                {lang === 'ar' 
                  ? 'تم تسجيل طلبكم بنجاح وجارٍ مراجعته وتفعيله من قِبل الإدارة.'
                  : 'Votre demande a bien été enregistrée par nos services et est actuellement en cours de traitement.'}
              </p>

              {/* Information Summary Box (Only displays Moroccan international phone number, hides email & never exposes password) */}
              <div className="pending-recap-box" style={{ background: 'rgba(212, 175, 55, 0.08)', border: '1px solid var(--border-gold)', borderRadius: '12px', padding: '18px', margin: '16px 0', textAlign: 'center' }}>
                <div style={{ fontSize: '0.84rem', color: 'var(--text-gray)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>
                  {lang === 'ar' ? 'رقم الهاتف المعتمد للمتابعة' : 'Numéro de contact enregistré'}
                </div>
                <div style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--primary-gold)', letterSpacing: '1px', fontFamily: 'monospace' }}>
                  {lang === 'ar' ? 'الهاتف : ' : 'Téléphone : '} {formatMoroccanInternationalPhone(phone) || '+212669286543'}
                </div>
                <div style={{ marginTop: '8px', fontSize: '0.78rem', color: '#10b981', fontWeight: 600 }}>
                  ✓ {lang === 'ar' ? 'تم تأكيد التنسيق الدولي المغربي (+212)' : 'Format international marocain validé'}
                </div>
              </div>

              {/* Security Admin Verification Notice */}
              <div className="pending-security-notice">
                <span className="notice-icon">🛡️</span>
                <p>
                  {lang === 'ar'
                    ? 'طبقاً للضوابط القانونية والأمنية لتجارة وصياغة الذهب بالمغرب، يتم تفعيل الحسابات المهنية يدوياً من طرف إدارة HRSDGDG بعد التحقق من صحة الوثائق.'
                    : 'Conformément aux normes de sécurité pour le commerce des métaux précieux au Maroc, tout nouveau compte doit être validé par un administrateur avant sa première connexion.'}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="pending-actions-grid">
                <a
                  href={`https://wa.me/212661000000?text=${whatsappMessage}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="pending-btn-whatsapp"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" style={{ flexShrink: 0, width: '18px', height: '18px', display: 'inline-block', verticalAlign: 'middle' }}>
                    <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91C2.13 13.66 2.59 15.36 3.45 16.86L2.05 22L7.3 20.62C8.75 21.41 10.38 21.83 12.04 21.83C17.5 21.83 21.95 17.38 21.95 11.92C21.95 9.27 20.92 6.78 19.05 4.91C17.18 3.03 14.69 2 12.04 2ZM12.04 20.15C10.56 20.15 9.11 19.76 7.85 19L7.55 18.83L4.43 19.65L5.26 16.61L5.07 16.3C4.24 14.98 3.81 13.47 3.81 11.91C3.81 7.37 7.5 3.68 12.04 3.68C14.25 3.68 16.31 4.54 17.87 6.1C19.42 7.66 20.28 9.72 20.28 11.92C20.28 16.46 16.58 20.15 12.04 20.15ZM16.55 14.39C16.3 14.27 15.08 13.67 14.86 13.59C14.63 13.5 14.47 13.46 14.3 13.71C14.14 13.96 13.67 14.51 13.53 14.67C13.38 14.84 13.24 14.86 12.99 14.73C12.74 14.61 11.94 14.35 11 13.51C10.26 12.85 9.77 12.04 9.63 11.79C9.48 11.54 9.61 11.41 9.74 11.28C9.85 11.17 9.99 11 10.11 10.86C10.24 10.72 10.28 10.61 10.36 10.45C10.45 10.28 10.4 10.14 10.34 10.02C10.28 9.9 9.81 8.74 9.61 8.27C9.42 7.81 9.22 7.87 9.08 7.86C8.94 7.86 8.78 7.85 8.61 7.85C8.45 7.85 8.18 7.91 7.96 8.16C7.73 8.4 7.1 8.99 7.1 10.19C7.1 11.39 7.98 12.55 8.1 12.71C8.22 12.87 9.82 15.35 12.28 16.41C12.86 16.66 13.32 16.82 13.67 16.93C14.26 17.12 14.79 17.09 15.22 17.03C15.7 16.96 16.69 16.43 16.9 15.85C17.1 15.27 17.1 14.77 17.04 14.67C16.98 14.56 16.81 14.51 16.55 14.39Z" />
                  </svg>
                  <span>{lang === 'ar' ? 'تسريع التفعيل عبر واتساب' : 'Accélérer via WhatsApp'}</span>
                </a>
                <button
                  type="button"
                  className="pending-btn-login"
                  onClick={() => {
                    setRegisteredPendingSuccess(false);
                    setTab('login');
                    setErrorMsg('');
                  }}
                >
                  <span>🔑</span>
                  <span>{lang === 'ar' ? 'الانتقال لتسجيل الدخول' : 'Aller à la connexion'}</span>
                </button>
              </div>
            </div>
          ) : (
          <form onSubmit={handleRegisterSubmit} className="auth-form-body">
            
            {/* 1. EXCLUSIVE PROFESSIONAL ACCESS BANNER */}
            <div className="auth-field-group" style={{ marginBottom: '16px' }}>
              <div style={{
                background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.16) 0%, rgba(184, 134, 11, 0.08) 100%)',
                border: '1.5px solid var(--primary-gold)',
                borderRadius: '12px',
                padding: '16px 18px',
                boxShadow: '0 4px 18px rgba(212, 175, 55, 0.12)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', marginBottom: '6px', flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '1.3rem' }}>👑</span>
                    <span style={{ fontWeight: 800, fontSize: '0.96rem', color: 'var(--primary-gold)' }}>
                      {t.proOnlyBannerTitle}
                    </span>
                  </div>
                  <span style={{
                    background: '#10b981',
                    color: '#fff',
                    fontSize: '0.72rem',
                    fontWeight: 800,
                    padding: '3px 10px',
                    borderRadius: '12px',
                    boxShadow: '0 2px 6px rgba(16, 185, 129, 0.3)'
                  }}>
                    {lang === 'ar' ? 'حصري للصاغة' : 'Réservé aux Pro'}
                  </span>
                </div>
                <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-gray)', lineHeight: 1.45 }}>
                  {t.proOnlyBannerDesc}
                </p>
              </div>
            </div>

            {/* 3. NAME INPUT (MANAGER / OWNER) */}
            <div className="auth-field-group">
              <label className="auth-field-label">
                <span className="auth-label-icon">👤</span>
                <span>{t.nameLabel}</span>
                <span className="auth-required-mark">*</span>
              </label>
              <div className="auth-input-container">
                <input 
                  type="text" 
                  required 
                  className="auth-text-input" 
                  value={nom}
                  onChange={e => setNom(e.target.value)}
                  placeholder={lang === 'ar' ? "مثال: الحاج عمر التازي" : "Ex: Omar Tazi (Gérant)"}
                  autoComplete="name"
                />
              </div>
            </div>

            {/* 4. SHOP NAME */}
            <div className="auth-field-group animate-slide-down">
              <label className="auth-field-label">
                <span className="auth-label-icon">🏪</span>
                <span>{t.shopLabel}</span>
                <span className="auth-required-mark">*</span>
              </label>
              <div className="auth-input-container">
                <input 
                  type="text" 
                  required 
                  className="auth-text-input" 
                  value={shopName}
                  onChange={e => setShopName(e.target.value)}
                  placeholder={lang === 'ar' ? "مثال: مجوهرات التازي الملكية" : "Ex: Joaillerie Royale Fès"}
                />
              </div>
            </div>

            {/* 4b. NUMÉRO DE PATENTE & RC */}
            <div className="auth-field-group animate-slide-down">
              <label className="auth-field-label">
                <span className="auth-label-icon">📜</span>
                <span>{t.patenteNumberLabel}</span>
                <span className="auth-required-mark">*</span>
              </label>
              <div className="auth-input-container">
                <input 
                  type="text" 
                  required 
                  className="auth-text-input" 
                  value={numeroPatente}
                  onChange={e => setNumeroPatente(e.target.value)}
                  placeholder={lang === 'ar' ? "مثال: 40289134 (الباتنت أو السجل التجاري)" : "Ex: 40289134 (N° Patente ou RC)"}
                />
              </div>
            </div>

            {/* 4c. TÉLÉCHARGER LA PATENTE (DOCUMENT UPLOAD) */}
            <div className="auth-field-group animate-slide-down">
              <label className="auth-field-label">
                <span className="auth-label-icon">📄</span>
                <span>{t.patenteDocLabel}</span>
                <span className="auth-required-mark">*</span>
              </label>
              
              <div style={{
                border: patenteDocBase64 ? '1.5px solid #10b981' : '1.5px dashed var(--border-gold)',
                borderRadius: 'var(--radius-sm)',
                padding: '14px 18px',
                background: patenteDocBase64 ? 'rgba(16, 185, 129, 0.07)' : 'rgba(212, 175, 55, 0.04)',
                transition: 'all 0.2s',
                textAlign: 'center'
              }}>
                {patenteDocBase64 ? (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', textAlign: isRtl ? 'right' : 'left' }}>
                      <span style={{ fontSize: '1.8rem' }}>📄</span>
                      <div>
                        <div style={{ fontWeight: 800, fontSize: '0.88rem', color: '#10b981' }}>
                          {patenteDocName || (lang === 'ar' ? 'وثيقة الباتنت مرفقة' : 'Attestation de Patente jointe')}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-gray)' }}>
                          {patenteDocSize || 'Document vérifié'} • {t.patenteUploadedSuccess}
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleRemovePatenteDoc}
                      style={{
                        background: '#ef4444',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '6px',
                        padding: '6px 12px',
                        fontSize: '0.78rem',
                        cursor: 'pointer',
                        fontWeight: 700
                      }}
                    >
                      {lang === 'ar' ? 'إلغاء وتغيير' : 'Changer'}
                    </button>
                  </div>
                ) : (
                  <div>
                    <input
                      type="file"
                      id="patente-upload-input"
                      accept=".pdf,image/png,image/jpeg,image/webp,image/jpg"
                      style={{ display: 'none' }}
                      onChange={handlePatenteFileChange}
                    />
                    <label
                      htmlFor="patente-upload-input"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px',
                        background: 'linear-gradient(135deg, var(--primary-gold), #b8860b)',
                        color: '#fff',
                        padding: '10px 20px',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontWeight: 700,
                        fontSize: '0.88rem',
                        boxShadow: '0 2px 10px rgba(184, 134, 11, 0.25)',
                        marginBottom: '6px'
                      }}
                    >
                      <span>📎</span>
                      <span>{t.patenteUploadBtn}</span>
                    </label>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-gray)' }}>
                      {t.patenteDocHint}
                    </div>
                  </div>
                )}
              </div>
            </div>


            {/* 5. PHONE & CITY WITH SMART MOROCCAN SHORTCUTS */}
            <div className="auth-two-col-grid">
              {/* Phone */}
              <div className="auth-field-group">
                <label className="auth-field-label">
                  <span className="auth-label-icon">📱</span>
                  <span>{t.phoneLabel}</span>
                  <span className="auth-required-mark">*</span>
                </label>
                <div className="auth-input-container auth-phone-input-wrap">
                  <span className="auth-country-flag" title="Maroc (+212)">🇲🇦</span>
                  <input 
                    type="tel" 
                    required 
                    className="auth-text-input auth-phone-input" 
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="06 00 00 00 00"
                    autoComplete="tel"
                  />
                </div>
                <span className="auth-field-micro-hint">{t.phoneHint}</span>
              </div>

              {/* City Selection with Quick City Pills */}
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
                    <option value="Casablanca">Casablanca (الدار البيضاء)</option>
                    <option value="Rabat">Rabat (الرباط)</option>
                    <option value="Marrakech">Marrakech (مراكش)</option>
                    <option value="Fès">Fès (فاس)</option>
                    <option value="Tanger">Tanger (طنجة)</option>
                    <option value="Agadir">Agadir (أكادير)</option>
                    <option value="Meknès">Meknès (مكناس)</option>
                    <option value="Oujda">Oujda (وجدة)</option>
                    <option value="Tétouan">Tétouan (تطوان)</option>
                    <option value="Kenitra">Kénitra (القنيطرة)</option>
                    <option value="Essaouira">Essaouira (الصويرة)</option>
                    <option value="Autre">Autre Ville (مدينة أخرى)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Quick City Pills (1 Click Selection) */}
            <div className="quick-city-pills-row">
              {topMoroccanCities.map(c => (
                <button
                  key={c.key}
                  type="button"
                  className={`city-pill-btn ${city === c.key ? 'active' : ''}`}
                  onClick={() => setCity(c.key)}
                >
                  {lang === 'ar' ? c.ar : c.fr}
                </button>
              ))}
            </div>

            {/* 6. EMAIL */}
            <div className="auth-field-group">
              <label className="auth-field-label">
                <span className="auth-label-icon">✉️</span>
                <span>{t.emailLabel}</span>
                <span className="auth-required-mark">*</span>
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

            {/* 7. PASSWORD WITH GENERATOR & STRENGTH GAUGE */}
            <div className="auth-field-group">
              <div className="auth-label-row">
                <label className="auth-field-label">
                  <span className="auth-label-icon">🔒</span>
                  <span>{t.passLabel}</span>
                  <span className="auth-required-mark">*</span>
                </label>
                <button
                  type="button"
                  className="auth-generate-pwd-btn"
                  onClick={generateStrongPassword}
                  title="Générer un mot de passe sécurisé et facile à retenir"
                >
                  {t.generatePwd}
                </button>
              </div>

              <div className="auth-input-container">
                <input 
                  type={showPassword ? "text" : "password"} 
                  required 
                  className="auth-text-input has-toggle" 
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
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

              {/* Password strength indicator */}
              {password && (
                <div className="auth-pwd-strength-bar-wrap animate-slide-down">
                  <div className="strength-dots">
                    <span className={`strength-dot ${pwdStrength.score >= 1 ? 'filled' : ''}`} style={{ backgroundColor: pwdStrength.score >= 1 ? pwdStrength.color : undefined }} />
                    <span className={`strength-dot ${pwdStrength.score >= 2 ? 'filled' : ''}`} style={{ backgroundColor: pwdStrength.score >= 2 ? pwdStrength.color : undefined }} />
                    <span className={`strength-dot ${pwdStrength.score >= 3 ? 'filled' : ''}`} style={{ backgroundColor: pwdStrength.score >= 3 ? pwdStrength.color : undefined }} />
                  </div>
                  <span className="strength-label" style={{ color: pwdStrength.color }}>
                    {pwdStrength.text}
                  </span>
                </div>
              )}
            </div>

            {/* TERMS & CONDITIONS ACCEPTANCE CHECKBOX */}
            <div className="auth-terms-group">
              <label className="auth-terms-checkbox-label">
                <input 
                  type="checkbox"
                  className="auth-terms-checkbox"
                  checked={acceptTerms}
                  onChange={e => setAcceptTerms(e.target.checked)}
                  required
                />
                <span className="auth-terms-text">
                  {lang === 'ar' ? (
                    <>
                      {t.termsAcceptPrefix}
                      <button
                        type="button"
                        className="auth-terms-link-btn"
                        onClick={() => { setTermsLangTab('ar'); setShowTermsModal(true); }}
                      >
                        {t.termsLinkText}
                      </button>
                      {t.termsAcceptSuffix}
                    </>
                  ) : (
                    <>
                      {t.termsAcceptPrefix}
                      <button
                        type="button"
                        className="auth-terms-link-btn"
                        onClick={() => { setTermsLangTab(lang === 'en' ? 'en' : 'fr'); setShowTermsModal(true); }}
                      >
                        {t.termsLinkText}
                      </button>
                      {t.termsAcceptSuffix}
                    </>
                  )}
                  <span className="auth-required-mark">*</span>
                </span>
              </label>
            </div>

            {/* SUBMIT BUTTON (LOCKED UNTIL TERMS ACCEPTED) */}
            <div className="auth-submit-btn-wrapper">
              <button 
                type="submit" 
                className={`auth-primary-submit-btn ${!acceptTerms ? 'btn-disabled-locked' : 'btn-enabled-active'}`} 
                disabled={!acceptTerms || loading}
                title={!acceptTerms ? (lang === 'ar' ? 'يرجى الموافقة على شروط الاستخدام لتفعيل زر إنشاء الحساب' : 'Veuillez cocher l\'acceptation des conditions d\'utilisation pour activer le bouton') : ''}
              >
                {loading ? (
                  <span className="auth-loading-spinner-wrapper">
                    <span className="auth-spinner" />
                    <span>{lang === 'ar' ? 'جاري إنشاء الحساب...' : 'Création du compte...'}</span>
                  </span>
                ) : (
                  <>
                    <span>{acceptTerms ? '👑' : '🔒'}</span>
                    <span>{t.registerBtn}</span>
                  </>
                )}
              </button>

              {!acceptTerms && (
                <div className="auth-terms-locked-hint">
                  <span className="locked-hint-icon">⚠️</span>
                  <span>
                    {lang === 'ar' 
                      ? 'يجب تأكيد الموافقة على شروط وأحكام الاستخدام أعلاه لتفعيل زر إنشاء الحساب'
                      : 'Veuillez cocher la case d\'acceptation des conditions d\'utilisation pour débloquer la création de compte.'}
                  </span>
                </div>
              )}
            </div>

            {/* Quick Switch to Login */}
            <div className="auth-bottom-switch-link">
              <span>{t.alreadyHaveAcc}</span>{' '}
              <button 
                type="button" 
                className="switch-link-btn"
                onClick={() => { setTab('login'); setErrorMsg(''); }}
              >
                {t.switchLogin}
              </button>
            </div>
          </form>
          )
        ) : (
          /* ========================================================
             TAB 2: LOGIN FORM
             ======================================================== */
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
                  <span>{lang === 'ar' ? 'جاري التحقق...' : 'Vérification en cours...'}</span>
                </span>
              ) : (
                <>
                  <span>👑</span>
                  <span>{t.loginBtn}</span>
                </>
              )}
            </button>

            {/* Quick Switch to Register */}
            <div className="auth-bottom-switch-link">
              <span>{t.dontHaveAcc}</span>{' '}
              <button 
                type="button" 
                className="switch-link-btn"
                onClick={() => { setTab('register'); setErrorMsg(''); }}
              >
                {t.switchRegister}
              </button>
            </div>

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
                  onClick={() => setDemoAccount('client@jewelia.com', 'client123')}
                >
                  <span className="demo-pill-icon">👤</span>
                  <span className="demo-pill-text">{t.clientDemo}</span>
                </button>
                <button 
                  type="button" 
                  className="auth-demo-pill"
                  onClick={() => setDemoAccount('gold@jewelia.com', 'merchant123')}
                >
                  <span className="demo-pill-icon">🏪</span>
                  <span className="demo-pill-text">{t.merchantDemo}</span>
                </button>
                <button 
                  type="button" 
                  className="auth-demo-pill"
                  onClick={() => setDemoAccount('vintage@jewelia.com', 'merchant123')}
                >
                  <span className="demo-pill-icon">💎</span>
                  <span className="demo-pill-text">{lang === 'ar' ? 'خبير مجوهرات (بنسودة)' : 'Expert (Bennani)'}</span>
                </button>
                <button 
                  type="button" 
                  className="auth-demo-pill"
                  onClick={() => setDemoAccount('admin@hrsdgdg.com', 'admin123')}
                  style={{ borderColor: 'var(--primary-gold)', background: 'rgba(212, 175, 55, 0.12)' }}
                >
                  <span className="demo-pill-icon">👑</span>
                  <span className="demo-pill-text">{lang === 'ar' ? 'المشرف (Admin)' : 'Admin HRSDGDG'}</span>
                </button>
              </div>
            </div>
          </form>
        )}

        {/* Security & Trust Footer */}
        <div className="auth-trust-footer">
          <span className="trust-icon">🛡️</span>
          <span className="trust-text">{t.trustSecurity}</span>
        </div>
      </div>

      {/* ========================================================
          TERMS & CONDITIONS MODAL (BILINGUAL FR / AR)
          ======================================================== */}
      {showTermsModal && (
        <div className="terms-modal-overlay animate-fade-in" onClick={() => setShowTermsModal(false)}>
          <div 
            className="terms-modal-card animate-scale-up" 
            onClick={e => e.stopPropagation()}
            style={{ direction: termsLangTab === 'ar' ? 'rtl' : 'ltr' }}
          >
            {/* Modal Header */}
            <div className="terms-modal-header">
              <div className="terms-modal-title-wrap">
                <span className="terms-modal-icon">📜</span>
                <div>
                  <h3 className="terms-modal-title">
                    {termsLangTab === 'ar' ? 'شروط وأحكام استخدام المنصة' : 'Conditions Générales d\'Utilisation'}
                  </h3>
                  <p className="terms-modal-subtitle">
                    {termsLangTab === 'ar' ? 'منصة HRSDGDG الرسمية لتجار وصاغة المجوهرات بالمغرب' : 'Plateforme Numérique Joaillerie & Bijouterie au Maroc'}
                  </p>
                </div>
              </div>
              <button 
                type="button" 
                className="terms-modal-close-btn"
                onClick={() => setShowTermsModal(false)}
                aria-label="Fermer"
              >
                ✕
              </button>
            </div>

            {/* Language Switch Tabs inside Terms Modal */}
            <div className="terms-lang-toggle-bar">
              <button
                type="button"
                className={`terms-lang-pill ${termsLangTab === 'fr' ? 'active' : ''}`}
                onClick={() => setTermsLangTab('fr')}
              >
                🇫🇷 Français
              </button>
              <button
                type="button"
                className={`terms-lang-pill ${termsLangTab === 'ar' ? 'active' : ''}`}
                onClick={() => setTermsLangTab('ar')}
              >
                🇲🇦 العربية
              </button>
            </div>

            {/* Scrollable Terms Body */}
            <div className="terms-modal-body-scroll">
              {termsLangTab === 'ar' ? (
                <div className="terms-content-ar">
                  <div className="terms-preamble">
                    <strong>ديباجة تمهيدية :</strong> تُحدد هذه الشروط والأحكام القواعد الملزمة لإنشاء الحسابات واستخدام خدمات منصة <strong>HRSDGDG</strong> الرقمية المخصصة حصرياً للمحترفين والصاغة المعتمدين لممارسة تجارة وصياغة المعادن الثمينة بالمملكة المغربية.
                  </div>

                  <div className="terms-article-item">
                    <h4 className="terms-article-title">المادة 1 : الأهلية والتسجيل الحصري للمهنيين</h4>
                    <p>يقتصر إنشاء حساب Commerçant / صائغ معتمد على أصحاب المحلات، الورشات، والمؤسسات الحاصلة على رقم باتنت مهني وسجل تجاري (RC) ساري المفعول بالمغرب وفقاً للقوانين المنظمة لمهنة الصياغة.</p>
                  </div>

                  <div className="terms-article-item">
                    <h4 className="terms-article-title">المادة 2 : ضمان أصالة الذهب عيار 18 قيراط والدمغة القانونية</h4>
                    <p>يلتزم الصائغ المسجل بأن تكون كافة المجوهرات والمعروضات مصنوعة من الذهب القانوني عيار 18 قيراط (750 بالألف)، ومدموغة بالدمغة الرسمية لمكتب الضمانة المغربي وبدمغة الصانع، وتتحمل المؤسسة العارضة المسؤولية القانونية التامة في حالة ثبوت أي مخالفة للعيار.</p>
                  </div>

                  <div className="terms-article-item">
                    <h4 className="terms-article-title">المادة 3 : التحقق من وثيقة الباتنت والسجل التجاري</h4>
                    <p>يقر المستخدم بأن جميع الوثائق المرفوعة (شهادة الباتنت، السجل التجاري، والبيانات التعريفية) صحيحة وحديثة. تحتفظ إدارة المنصة بحق التحقق من صحة الوثائق مع الجهات المختصة ورفض أو تعليق أي حساب غير مستوفٍ للشروط.</p>
                  </div>

                  <div className="terms-article-item">
                    <h4 className="terms-article-title">المادة 4 : الالتزام بالمواصفات وتسليم المجوهرات والمزادات</h4>
                    <p>يلتزم الصائغ بالدقة المتناهية في ذكر الأوزان الصافية بالغرام، نوع الأحجار الكريمة، والمواصفات الفنية، وتسليم القطع للمشتري مطابقة للصور والوصف المنشور، والالتزام بإتمام المزادات المنتهية لصالح الفائزين.</p>
                  </div>

                  <div className="terms-article-item">
                    <h4 className="terms-article-title">المادة 5 : باقات الاشتراكات والعمولات</h4>
                    <p>يخضع عرض المجوهرات لباقات الاشتراك المختارة وتحدد كل باقة الحد الأقصى للمنتجات ونسب العمولة المستحقة للمنصة عن كل عملية بيع مؤكدة.</p>
                  </div>

                  <div className="terms-article-item">
                    <h4 className="terms-article-title">المادة 6 : حماية المعطيات والسرية المهنية (قانون 09-08)</h4>
                    <p>تلتزم المنصة بحماية وسرية البيانات والمعاملات التجارية الخاصة بالصاغة والمشتركين طبقاً لأحكام القانون المغربي رقم 09-08 المتعلق بحماية الأشخاص الذاتيين تجاه معالجة المعطيات ذات الطابع الشخصي (CNDP).</p>
                  </div>

                  <div className="terms-article-item">
                    <h4 className="terms-article-title">المادة 7 : الجزاءات وإنهاء الحساب</h4>
                    <p>يحق لإدارة المنصة إيقاف أو فسخ حساب أي عضو بصورة فورية ونهائية في حال الإخلال بشروط الأمان، التلاعب بالأسعار أو العيارات، أو الإخلال بتسليم الطلبات.</p>
                  </div>
                </div>
              ) : (
                <div className="terms-content-fr">
                  <div className="terms-preamble">
                    <strong>Préambule :</strong> Les présentes Conditions Générales d'Utilisation (CGU) régissent l'accès, l'inscription et l'exploitation des services de la plateforme numérique <strong>HRSDGDG</strong>, exclusivement réservée aux professionnels de la bijouterie et joaillerie au Royaume du Maroc.
                  </div>

                  <div className="terms-article-item">
                    <h4 className="terms-article-title">Article 1 : Éligibilité & Inscription Réservée aux Professionnels</h4>
                    <p>La création d'un compte commerçant / atelier est strictement réservée aux personnes physiques ou morales exerçant légalement le métier de bijoutier-joaillier au Maroc, détentrices d'une patente professionnelle active et d'un Registre de Commerce (RC) valide.</p>
                  </div>

                  <div className="terms-article-item">
                    <h4 className="terms-article-title">Article 2 : Garantie de Titre Or 18K & Poinçons Légaux</h4>
                    <p>Tous les bijoux et ouvrages mis en vente ou en enchères doivent être obligatoirement en or titré 18 carats (750‰) et revêtus des poinçons légaux conformes aux dispositions de l'Administration des Douanes et Impôts Indirects (Bureau de Garantie). Toute défaillance de titre engage la responsabilité civile et pénale exclusive du vendeur.</p>
                  </div>

                  <div className="terms-article-item">
                    <h4 className="terms-article-title">Article 3 : Vérification de la Patente et Conformité Documentaire</h4>
                    <p>L'adhérent garantit l'authenticité de l'attestation de patente et des pièces administratives téléversées. L'administration de HRSDGDG se réserve le droit d'auditer ces pièces et de suspendre tout compte dont les justificatifs s'avèrent non conformes.</p>
                  </div>

                  <div className="terms-article-item">
                    <h4 className="terms-article-title">Article 4 : Exactitude des Descriptions, Poids et Enchères</h4>
                    <p>Le professionnel s'engage à fournir des descriptions rigoureusement exactes (poids net en grammes, pureté, pierres serties) et à livrer des pièces strictement identiques aux photos et caractéristiques publiées, ainsi qu'à honorer l'ensemble des adjudications d'enchères.</p>
                  </div>

                  <div className="terms-article-item">
                    <h4 className="terms-article-title">Article 5 : Forfaits, Quotas & Commissions</h4>
                    <p>L'utilisation de la plateforme est régie par les formules d'abonnements souscrites. Les quotas de dépôts de bijoux et les commissions sur ventes sont appliqués conformément à la grille tarifaire en vigueur.</p>
                  </div>

                  <div className="terms-article-item">
                    <h4 className="terms-article-title">Article 6 : Protection des Données Personnelles (Loi 09-08)</h4>
                    <p>Les données collectées font l'objet d'un traitement hautement sécurisé et chiffré, dans le strict respect de la Loi marocaine n° 09-08 relative à la protection des personnes physiques à l'égard du traitement des données à caractère personnel (CNDP).</p>
                  </div>

                  <div className="terms-article-item">
                    <h4 className="terms-article-title">Article 7 : Sanctions, Suspension & Résiliation</h4>
                    <p>Tout manquement aux présentes conditions, tentative de fraude, fausse déclaration sur le titre d'or ou refus d'honorer une vente conclue entraîne la suspension immédiate et irrévocable du compte professionnel.</p>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer Actions */}
            <div className="terms-modal-footer">
              <button 
                type="button" 
                className="terms-btn-secondary"
                onClick={() => setShowTermsModal(false)}
              >
                {termsLangTab === 'ar' ? 'إغلاق' : 'Fermer'}
              </button>
              <button 
                type="button" 
                className="terms-btn-primary-gold"
                onClick={() => {
                  setAcceptTerms(true);
                  setShowTermsModal(false);
                }}
              >
                <span>✓</span>
                <span>{termsLangTab === 'ar' ? 'أوافق على جميع الشروط' : 'J\'accepte les conditions'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
