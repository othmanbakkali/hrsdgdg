import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { API_URL } from '../config/api';
import OriaLogo from './OriaLogo';

export default function AuthModal({ isOpen, onClose, onAuthSuccess, initialTab = 'register' }) {
  const { login, register } = useAuth();
  const { lang, isRtl } = useLanguage();

  const [tab, setTab] = useState(initialTab); // 'login' | 'register'
  const [role, setRole] = useState('client'); // 'client' | 'commercant'
  const [showPassword, setShowPassword] = useState(false);

  // Sync tab if initialTab changes
  useEffect(() => {
    if (initialTab) setTab(initialTab);
  }, [initialTab, isOpen]);

  // Login fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Register extra fields
  const [nom, setNom] = useState('');
  const [shopName, setShopName] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('Casablanca');

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

  // Quick Assistance States
  const [assistantOpen, setAssistantOpen] = useState(true);
  const [assistantGuideTab, setAssistantGuideTab] = useState('role_guide'); // 'role_guide' | 'perks' | 'security'
  const [copySuccessToast, setCopySuccessToast] = useState('');
  const [quickFillNotice, setQuickFillNotice] = useState('');

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

  // Express One-Click Demo Fill for ultra-fast creation testing
  const handleQuickFill = (type) => {
    setErrorMsg('');
    const randomId = Math.floor(100 + Math.random() * 900);
    if (type === 'client') {
      setRole('client');
      setNom('سلمى بنجلون');
      setPhone('0661234567');
      setEmail(`salma.bennani${randomId}@gmail.com`);
      setCity('Casablanca');
      setPassword('OriaClient2026!');
      setQuickFillNotice(lang === 'ar' ? 'تمت التعبئة السريعة لبيانات زبون خاص بنجاح ✨' : 'Profil Client VIP pré-rempli avec succès ✨');
    } else {
      setRole('commercant');
      setSelectedPlanId('plan_pro');
      setBillingCycle('monthly');
      setNom('الحاج عمر التازي');
      setShopName('مجوهرات التازي الملكية فاس');
      setPhone('0662987654');
      setEmail(`tazi.or${randomId}@gmail.com`);
      setCity('Fès');
      setPassword('OriaGold2026!');
      setQuickFillNotice(lang === 'ar' ? 'تمت التعبئة السريعة لبيانات صائغ معتمد بنجاح 🏪' : 'Profil Joaillier Agréé pré-rempli avec succès 🏪');
    }
    setTimeout(() => setQuickFillNotice(''), 4000);
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
      setErrorMsg(lang === 'ar' ? 'يرجى إدخال الاسم الكامل.' : 'Veuillez saisir votre nom complet.');
      return;
    }
    if (role === 'commercant' && !shopName.trim()) {
      setErrorMsg(lang === 'ar' ? 'يرجى إدخال اسم المتجر أو الورشة.' : 'Veuillez saisir le nom de votre bijouterie.');
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

    setLoading(true);
    try {
      await register({
        email: email.trim(),
        mot_de_passe: password,
        nom: nom.trim(),
        role,
        shopName: role === 'commercant' ? shopName.trim() : undefined,
        phone: phone.trim(),
        city,
        address: city,
        plan_id: role === 'commercant' ? selectedPlanId : undefined,
        billing_cycle: role === 'commercant' ? billingCycle : undefined
      });
      setLoading(false);
      onClose();
      if (onAuthSuccess) onAuthSuccess('register');
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
      registerTab: "Créer un compte",
      welcomeBack: "Bienvenue sur HRSDGDG",
      welcomeDesc: "Accédez à votre coffre-fort, vos enchères privées et vos commandes.",
      createAcc: "Création Rapide de Compte",
      createDesc: "Inscrivez-vous en moins de 30 secondes pour accéder aux ventes privées et garanties or 18k.",
      assistanceHeader: "✨ Assistance Rapide à l'Inscription",
      assistanceSub: "Besoin d'aide pour choisir votre compte ou finaliser en direct ?",
      toggleAssistanceHide: "Masquer l'aide",
      toggleAssistanceShow: "Afficher l'aide rapide",
      whatsappBtn: "Assistance Immédiate WhatsApp",
      whatsappDesc: "Conseiller dédié disponible 7j/7 pour vous assister",
      fastDemoTitle: "⚡ Remplissage Express (1 Clic) :",
      fastDemoClient: "👤 Client Particulier VIP",
      fastDemoMerchant: "🏪 Joaillier Agréé",
      guideTab1: "Quel compte choisir ?",
      guideTab2: "Avantages Immédiats",
      guideTab3: "Garanties & Sécurité",
      guideContent1Client: "👤 Client VIP : Achetez en direct, participez aux enchères exclusives et bénéficiez de la livraison sécurisée avec paiement à la livraison.",
      guideContent1Merchant: "🏪 Joaillier Agréé : Exposez vos bijoux certifiés or 18k, touchez une clientèle nationale et développez votre vitrine digitale.",
      guideContent2: "💎 Avantages : Certificat d'authenticité offert, accès aux ventes privées du vendredi, support prioritaire et garantie rachat.",
      guideContent3: "🛡️ Sécurité : Données 100% cryptées, conformité CNDP, bijoux vérifiés par des maîtres joailliers agréés.",
      emailLabel: "Adresse Email",
      passLabel: "Mot de passe",
      generatePwd: "🔑 Générer un mot de passe fort",
      nameLabel: "Nom & Prénom",
      phoneLabel: "Numéro de Téléphone (WhatsApp)",
      phoneHint: "Pour la confirmation de vos commandes et le suivi de livraison",
      cityLabel: "Ville de Résidence",
      roleLabel: "Choisissez votre type de compte",
      roleClient: "Client Particulier VIP",
      roleClientBadge: "Rapide : 15 secondes",
      roleClientDesc: "Achetez, enchérissez et collectionnez des bijoux d'exception",
      roleMerchant: "Joaillier / Boutique Agréée",
      roleMerchantBadge: "Vitrine Certifiée",
      roleMerchantDesc: "Vendez vos créations, certifiez et gérez votre vitrine digitale",
      shopLabel: "Nom de la Joaillerie / Atelier",
      subscriptionTitle: "Choix de votre Forfait Commerçant",
      subscriptionSubtitle: "Sélectionnez la formule adaptée à votre atelier ou bijouterie",
      monthlyBilling: "Facturation Mensuelle",
      annualBilling: "Facturation Annuelle (-20% 🎁)",
      recommendedPlan: "⭐ Recommandé",
      freeBadge: "Gratuit",
      perMonth: "/mois",
      perYear: "/an",
      loginBtn: "Se Connecter à mon Espace",
      registerBtn: "Créer mon Compte Privilège 💎",
      demoAccounts: "Accès Rapide Démo :",
      clientDemo: "Client (Yassine)",
      merchantDemo: "Joaillier (El Fassi)",
      watchDemo: "Horloger (Maroc Chrono)",
      trustSecurity: "Transactions 100% sécurisées • Or 18K Garanti • CNDP",
      alreadyHaveAcc: "Vous avez déjà un compte ?",
      dontHaveAcc: "Nouveau sur HRSDGDG ?",
      switchLogin: "Se connecter",
      switchRegister: "Créer un compte rapide"
    },
    ar: {
      loginTab: "تسجيل الدخول",
      registerTab: "إنشاء حساب سريع",
      welcomeBack: "مرحباً بكم في دار HRSDGDG",
      welcomeDesc: "ادخل إلى خزنتك ومزاداتك الحصرية وطلباتك بكل أمان.",
      createAcc: "إنشاء حسابك المتميز في ثوانٍ",
      createDesc: "سجل مجاناً في أقل من 30 ثانية واستمتع بالعروض والمزادات والذهب الموثق عيار 18k.",
      assistanceHeader: "✨ المساعد الفوري لإنشاء الحساب",
      assistanceSub: "هل تحتاج مساعدة سريعة لاختيار نوع الحساب أو إكمال التسجيل فورياً؟",
      toggleAssistanceHide: "إخفاء المساعد",
      toggleAssistanceShow: "عرض المساعد الفوري",
      whatsappBtn: "مساعدة مباشرة عبر واتساب",
      whatsappDesc: "تواصل الآن مع مستشار الدار لمساعدتك خطوة بخطوة 7/7 أيام",
      fastDemoTitle: "⚡ تعبئة سريعة للتجربة الفورية (نقرة واحدة) :",
      fastDemoClient: "👤 تجربة كزبون VIP",
      fastDemoMerchant: "🏪 تجربة كصائغ معتمد",
      guideTab1: "أي حساب أختار؟",
      guideTab2: "المزايا الفورية",
      guideTab3: "الضمان والأمان",
      guideContent1Client: "👤 زبون خاص VIP : لشراء المجوهرات، المشاركة في المزادات الحية، والتوصيل المؤمن مع الدفع عند المعاينة والاستلام.",
      guideContent1Merchant: "🏪 صائغ معتمد : للمحلات والصاغة المحترفين لعرض إبداعات الذهب عيار 18k وإدارة المتجر والطلبات.",
      guideContent2: "💎 مزايا حصرية : شهادة أصالة رسمية لكل قطعة، دعوات لمبيعات الجمعة الخاصة، ومتابعة عبر واتساب.",
      guideContent3: "🛡️ الأمان والسرية : حماية بياناتك وتشفيرها 100%، وتفتيش دقيق لعيار الذهب من خبراء معتمدين بالمغرب.",
      emailLabel: "البريد الإلكتروني",
      passLabel: "كلمة المرور",
      generatePwd: "🔑 توليد كلمة مرور قوية",
      nameLabel: "الاسم الكامل",
      phoneLabel: "رقم الهاتف / واتساب",
      phoneHint: "لتأكيد طلباتك وتتبع شحنات المجوهرات والمزادات",
      cityLabel: "المدينة",
      roleLabel: "نوع الحساب المطلوب",
      roleClient: "زبون خاص VIP",
      roleClientBadge: "فائق السرعة (15 ثانية)",
      roleClientDesc: "تسوق، شارك في المزادات، واقتنِ أندر المجوهرات",
      roleMerchant: "صائغ معتمد / متجر",
      roleMerchantBadge: "متجر موثق وشارة الثقة",
      roleMerchantDesc: "اعرض مجوهراتك وأدر مبيعاتك وعيار 18k بكل احترافية",
      shopLabel: "اسم متجر المجوهرات / الورشة",
      subscriptionTitle: "اختر باقة الاشتراك لمتجرك",
      subscriptionSubtitle: "حدد الباقة المناسبة لحجم ونشاط ورشتك أو مجوهراتك",
      monthlyBilling: "اشتراك شهري",
      annualBilling: "اشتراك سنوي (خصم 20% 🎁)",
      recommendedPlan: "⭐ الأكثر طلباً",
      freeBadge: "مجاناً",
      perMonth: "/شهر",
      perYear: "/سنة",
      loginBtn: "تسجيل الدخول إلى حسابي",
      registerBtn: "إنشاء حسابي المتميز في ثوانٍ 💎",
      demoAccounts: "دخول سريع للتجربة :",
      clientDemo: "زبون (ياسين)",
      merchantDemo: "صائغ (الفاسي)",
      watchDemo: "ساعات (ماروك كرونو)",
      trustSecurity: "معاملات آمنة 100% • ذهب عيار 18k موثق • توصيل مؤمن",
      alreadyHaveAcc: "لديك حساب بالفعل؟",
      dontHaveAcc: "ليس لديك حساب بعد؟",
      switchLogin: "تسجيل الدخول",
      switchRegister: "إنشاء حساب جديد"
    },
    en: {
      loginTab: "Sign In",
      registerTab: "Instant Register",
      welcomeBack: "Welcome to HRSDGDG",
      welcomeDesc: "Access your private vault, live auctions, and orders.",
      createAcc: "Fast Account Creation",
      createDesc: "Register in under 30 seconds for private vaults, 18k gold guarantees & auctions.",
      assistanceHeader: "✨ Fast Account Assistant",
      assistanceSub: "Need instant guidance to choose your account or complete registration?",
      toggleAssistanceHide: "Hide Assistant",
      toggleAssistanceShow: "Show Quick Assistance",
      whatsappBtn: "Instant WhatsApp Concierge",
      whatsappDesc: "Dedicated advisor available 7/7 to guide you",
      fastDemoTitle: "⚡ Express 1-Click Fill:",
      fastDemoClient: "👤 VIP Client Profile",
      fastDemoMerchant: "🏪 Certified Jeweller",
      guideTab1: "Which Account?",
      guideTab2: "Instant Perks",
      guideTab3: "Trust & Safety",
      guideContent1Client: "👤 VIP Client: Buy curated jewels, participate in private live auctions with secure Cash on Delivery.",
      guideContent1Merchant: "🏪 Certified Jeweller: List 18k gold jewels, manage your digital storefront and verified orders.",
      guideContent2: "💎 Instant Perks: Certificate of authenticity included, private sale invitations, VIP concierge support.",
      guideContent3: "🛡️ Safety: 100% encrypted, verified gemmology checks, insured express delivery across Morocco.",
      emailLabel: "Email Address",
      passLabel: "Password",
      generatePwd: "🔑 Generate Strong Password",
      nameLabel: "Full Name",
      phoneLabel: "Phone Number (WhatsApp)",
      phoneHint: "For order delivery notifications and private auction alerts",
      cityLabel: "City",
      roleLabel: "Select Account Type",
      roleClient: "VIP Private Client",
      roleClientBadge: "Fast: 15 seconds",
      roleClientDesc: "Shop luxury jewels and bid on certified auctions",
      roleMerchant: "Certified Master Jeweller",
      roleMerchantBadge: "Verified Store",
      roleMerchantDesc: "Showcase your jewelry creations with verified badge",
      shopLabel: "Jewelry Store / Workshop Name",
      subscriptionTitle: "Choose your Merchant Plan",
      subscriptionSubtitle: "Select the plan tailored to your jewelry boutique",
      monthlyBilling: "Monthly Billing",
      annualBilling: "Annual Billing (-20% 🎁)",
      recommendedPlan: "⭐ Recommended",
      freeBadge: "Free",
      perMonth: "/mo",
      perYear: "/yr",
      loginBtn: "Sign In to My Account",
      registerBtn: "Create VIP Account 💎",
      demoAccounts: "Quick Demo Logins:",
      clientDemo: "Client (Yassine)",
      merchantDemo: "Jeweller (El Fassi)",
      watchDemo: "Watches (Maroc Chrono)",
      trustSecurity: "100% Secure • Certified 18K Gold • Insured Delivery",
      alreadyHaveAcc: "Already registered?",
      dontHaveAcc: "New to HRSDGDG?",
      switchLogin: "Sign In",
      switchRegister: "Create Account"
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
        {quickFillNotice && (
          <div className="auth-toast-alert gold">
            <span>✨</span>
            <span>{quickFillNotice}</span>
          </div>
        )}

        {/* ========================================================
            TAB 1: REGISTRATION (ENHANCED WITH FAST ASSISTANCE)
            ======================================================== */}
        {tab === 'register' ? (
          <form onSubmit={handleRegisterSubmit} className="auth-form-body">
            
            {/* 1. ASSISTANCE RAPIDE SECTION (HIGHLIGHTED CONCIERGE HELPER) */}
            <div className="auth-quick-assistance-card">
              <div className="quick-assist-top-bar">
                <div className="quick-assist-title-wrap">
                  <span className="quick-assist-sparkle">✨</span>
                  <div>
                    <h3 className="quick-assist-heading">{t.assistanceHeader}</h3>
                    <p className="quick-assist-subtext">{t.assistanceSub}</p>
                  </div>
                </div>
                <button
                  type="button"
                  className="quick-assist-toggle-btn"
                  onClick={() => setAssistantOpen(!assistantOpen)}
                  aria-expanded={assistantOpen}
                >
                  {assistantOpen ? t.toggleAssistanceHide : t.toggleAssistanceShow}
                </button>
              </div>

              {assistantOpen && (
                <div className="quick-assist-expandable-content animate-slide-down">
                  {/* Action 1: Direct WhatsApp Concierge Button */}
                  <a 
                    href={`https://wa.me/212661889900?text=${whatsappMessage}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="quick-assist-whatsapp-cta"
                  >
                    <div className="wa-cta-icon-box">💬</div>
                    <div className="wa-cta-text-wrap">
                      <div className="wa-cta-main">{t.whatsappBtn}</div>
                      <div className="wa-cta-sub">{t.whatsappDesc}</div>
                    </div>
                    <div className="wa-cta-arrow">{isRtl ? '←' : '→'}</div>
                  </a>

                  {/* Action 2: 1-Click Express Fill (Instant registration fill for testing or speed) */}
                  <div className="quick-fill-block">
                    <span className="quick-fill-label">{t.fastDemoTitle}</span>
                    <div className="quick-fill-buttons">
                      <button
                        type="button"
                        className="quick-fill-chip client"
                        onClick={() => handleQuickFill('client')}
                        title="Remplir automatiquement les données d'un client"
                      >
                        <span>👤</span>
                        <span>{t.fastDemoClient}</span>
                      </button>
                      <button
                        type="button"
                        className="quick-fill-chip merchant"
                        onClick={() => handleQuickFill('merchant')}
                        title="Remplir automatiquement les données d'un commerçant"
                      >
                        <span>🏪</span>
                        <span>{t.fastDemoMerchant}</span>
                      </button>
                    </div>
                  </div>

                  {/* Action 3: Interactive Micro-Guide (Tabs) */}
                  <div className="quick-guide-tabs">
                    <button
                      type="button"
                      className={`guide-tab-btn ${assistantGuideTab === 'role_guide' ? 'active' : ''}`}
                      onClick={() => setAssistantGuideTab('role_guide')}
                    >
                      {t.guideTab1}
                    </button>
                    <button
                      type="button"
                      className={`guide-tab-btn ${assistantGuideTab === 'perks' ? 'active' : ''}`}
                      onClick={() => setAssistantGuideTab('perks')}
                    >
                      {t.guideTab2}
                    </button>
                    <button
                      type="button"
                      className={`guide-tab-btn ${assistantGuideTab === 'security' ? 'active' : ''}`}
                      onClick={() => setAssistantGuideTab('security')}
                    >
                      {t.guideTab3}
                    </button>
                  </div>

                  <div className="quick-guide-panel">
                    {assistantGuideTab === 'role_guide' && (
                      <div className="guide-panel-text">
                        <p>{t.guideContent1Client}</p>
                        <p style={{ marginTop: '6px' }}>{t.guideContent1Merchant}</p>
                      </div>
                    )}
                    {assistantGuideTab === 'perks' && (
                      <div className="guide-panel-text">
                        <p>{t.guideContent2}</p>
                      </div>
                    )}
                    {assistantGuideTab === 'security' && (
                      <div className="guide-panel-text">
                        <p>{t.guideContent3}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* 2. ROLE SELECTOR (FAST 2-CARD SWITCH) */}
            <div className="auth-field-group">
              <label className="auth-field-label">
                <span className="auth-label-icon">💎</span>
                <span>{t.roleLabel}</span>
              </label>
              <div className="auth-role-cards-grid">
                <div 
                  className={`auth-role-card ${role === 'client' ? 'selected' : ''}`}
                  onClick={() => setRole('client')}
                  role="button"
                  tabIndex={0}
                >
                  <div className="role-card-header">
                    <span className="role-card-icon">👤</span>
                    <span className="role-card-title">{t.roleClient}</span>
                    <span className="role-badge-pill">{t.roleClientBadge}</span>
                    <span className="role-card-radio">{role === 'client' ? '●' : '○'}</span>
                  </div>
                  <p className="role-card-desc">{t.roleClientDesc}</p>
                </div>

                <div 
                  className={`auth-role-card ${role === 'commercant' ? 'selected' : ''}`}
                  onClick={() => setRole('commercant')}
                  role="button"
                  tabIndex={0}
                >
                  <div className="role-card-header">
                    <span className="role-card-icon">🏪</span>
                    <span className="role-card-title">{t.roleMerchant}</span>
                    <span className="role-badge-pill gold">{t.roleMerchantBadge}</span>
                    <span className="role-card-radio">{role === 'commercant' ? '●' : '○'}</span>
                  </div>
                  <p className="role-card-desc">{t.roleMerchantDesc}</p>
                </div>
              </div>
            </div>

            {/* 3. NAME INPUT */}
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
                  placeholder={lang === 'ar' ? "مثال: ياسمين العلمي" : "Ex: Yassine Alami"}
                  autoComplete="name"
                />
              </div>
            </div>

            {/* 4. SHOP NAME (IF MERCHANT) */}
            {role === 'commercant' && (
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
                    placeholder={lang === 'ar' ? "مثال: مجوهرات الفاسي الملكية" : "Ex: Joaillerie Royale Fès"}
                  />
                </div>
              </div>
            )}

            {/* 4b. SUBSCRIPTION PLAN SELECTION (FOR MERCHANTS) */}
            {role === 'commercant' && (
              <div className="auth-subscription-selection-section animate-slide-down">
                <div className="auth-sub-header">
                  <div className="auth-sub-title-wrap">
                    <span className="auth-sub-icon">💎</span>
                    <div>
                      <div className="auth-sub-title">{t.subscriptionTitle}</div>
                      <div className="auth-sub-desc">{t.subscriptionSubtitle}</div>
                    </div>
                  </div>
                  {/* Billing Cycle Toggle */}
                  <div className="auth-cycle-toggle-pills">
                    <button
                      type="button"
                      className={`cycle-pill ${billingCycle === 'monthly' ? 'active' : ''}`}
                      onClick={() => setBillingCycle('monthly')}
                    >
                      {t.monthlyBilling}
                    </button>
                    <button
                      type="button"
                      className={`cycle-pill ${billingCycle === 'annual' ? 'active' : ''}`}
                      onClick={() => setBillingCycle('annual')}
                    >
                      {t.annualBilling}
                    </button>
                  </div>
                </div>

                <div className="auth-sub-plans-grid">
                  {plans.map(p => {
                    const isSelected = selectedPlanId === p.id;
                    const price = billingCycle === 'annual' ? p.price_annual : p.price_monthly;
                    const name = lang === 'ar' ? (p.name_ar || p.name) : (p.name_fr || p.name);
                    return (
                      <div
                        key={p.id}
                        className={`auth-plan-option-card ${isSelected ? 'selected' : ''} ${p.popular ? 'popular' : ''}`}
                        onClick={() => setSelectedPlanId(p.id)}
                        role="button"
                        tabIndex={0}
                      >
                        {p.popular && (
                          <div className="auth-plan-badge-top">
                            {t.recommendedPlan}
                          </div>
                        )}
                        <div className="auth-plan-card-top">
                          <span className="auth-plan-name">{name}</span>
                          <span className="auth-plan-radio">{isSelected ? '●' : '○'}</span>
                        </div>
                        <div className="auth-plan-price-row">
                          <span className="auth-plan-price-amount">
                            {price === 0 ? (lang === 'ar' ? 'مجاناً' : '0 MAD') : `${price.toLocaleString()} MAD`}
                          </span>
                          <span className="auth-plan-price-period">
                            {billingCycle === 'annual' ? t.perYear : t.perMonth}
                          </span>
                        </div>
                        <div className="auth-plan-features-mini">
                          <div className="auth-plan-feat-item">
                            <span>📦</span>
                            <span>{p.max_products > 1000 ? (lang === 'ar' ? 'معروضات غير محدودة' : 'Illimité') : `${p.max_products} ${lang === 'ar' ? 'معروضات' : 'bijoux'}`}</span>
                          </div>
                          <div className="auth-plan-feat-item">
                            <span>⚡</span>
                            <span>{lang === 'ar' ? `عمولة ${p.commission_rate}%` : `Commission ${p.commission_rate}%`}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

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

            {/* SUBMIT BUTTON */}
            <button 
              type="submit" 
              className="auth-primary-submit-btn" 
              disabled={loading}
            >
              {loading ? (
                <span className="auth-loading-spinner-wrapper">
                  <span className="auth-spinner" />
                  <span>{lang === 'ar' ? 'جاري إنشاء الحساب...' : 'Création du compte...'}</span>
                </span>
              ) : (
                <>
                  <span>👑</span>
                  <span>{t.registerBtn}</span>
                </>
              )}
            </button>

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
    </div>
  );
}
