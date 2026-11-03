import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useLanguage, LanguageProvider } from './context/LanguageContext';
import { useAuth, AuthProvider } from './context/AuthContext';
import OriaLogo from './components/OriaLogo';
import AdminLogin from './components/AdminLogin';
import SilverIcon from './components/SilverIcon';
import VideoTrimModal from './components/VideoTrimModal';
import './styles/admin.css';
import { ALL_MOROCCAN_CITIES } from './utils/moroccanCities';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const themes = {
  gold: {
    primary: '#d4af37',
    dark: '#aa7c11',
    border: 'rgba(212, 175, 55, 0.2)'
  },
  emerald: {
    primary: '#2ecc71',
    dark: '#27ae60',
    border: 'rgba(46, 204, 113, 0.2)'
  },
  ruby: {
    primary: '#e74c3c',
    dark: '#c0392b',
    border: 'rgba(231, 76, 60, 0.2)'
  },
  sapphire: {
    primary: '#3498db',
    dark: '#2980b9',
    border: 'rgba(52, 152, 219, 0.2)'
  },
  rosegold: {
    primary: '#b76e79',
    dark: '#8e545e',
    border: 'rgba(183, 110, 121, 0.2)'
  }
};

export const DEFAULT_SUGGESTIONS = {
  titre_ar: [
    '💍 خاتم سوليتير ألماس 18k',
    '📿 قلادة سلسلة فاخرة 18k',
    '🔗 سوار رويال أنيق 18k',
    '✨ ميدالية ذهبية عيار 18k',
    '💎 أقراط دائرية عيار 18k',
    '👑 طقم عرائسي ملكي 18k'
  ],
  titre_fr: [
    '💍 Bague Solitaire Diamant 18K',
    '📿 Collier Chaine Forçat 18K',
    '🔗 Bracelet Gourmette Royale 18K',
    '✨ Pendentif Médaille Oria 18K',
    '💎 Boucles d\'Oreilles Créoles 18K',
    '👑 Parure Traditionnelle 18K'
  ],
  description_ar: [
    '✨ ذهب موثق عيار 18k مع الختم الرسمي المغربي.',
    '💎 صياغة تقليدية مغربية فاخرة مع تشطيب دقيق.',
    '📦 مرفق بشهادة أصالة معتمدة وعلبة فاخرة.',
    '🔒 قفل أمان محكم ومفحوص بدقة من خبير معتمد.',
    '💎 حلي بلدية مغربية أصيلة.',
    '💎 حلي عصرية راقية مع تشطيب دقيق.',
    '💎 رافينتي إيطالية عيار 18k.'
  ],
  description_fr: [
    '✨ Or 18K certifié avec poinçon officiel marocain.',
    '💎 Finition artisanale marocaine haute joaillerie.',
    '📦 Livré avec certificat d\'authenticité et écrin de luxe.',
    '🔒 Fermoir de sécurité renforcé et contrôle bijoutier.',
    '💎 Joaillerie traditionnelle marocaine authentique.',
    '💎 Bijou moderne raffiné avec finition soignée.',
    '💎 Pièce italienne raffinée en or 18k.'
  ],
  prix_gramme: [750, 800, 850, 900]
};

function AdminLayout() {
  const { t, lang, setLang } = useLanguage();
  const { adminUser, logout, authFetch } = useAuth();

  const [selectedTheme, setSelectedTheme] = useState(() => localStorage.getItem('oria-admin-theme') || 'gold');
  const [themeMode, setThemeMode] = useState(() => localStorage.getItem('hrsdgdg-theme') || 'light');

  useEffect(() => {
    const tVals = themes[selectedTheme] || themes.gold;
    document.documentElement.style.setProperty('--admin-gold', tVals.primary);
    document.documentElement.style.setProperty('--dark-gold', tVals.dark);
    document.documentElement.style.setProperty('--border-gold', tVals.border);
    localStorage.setItem('oria-admin-theme', selectedTheme);
  }, [selectedTheme]);

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

  // Roles and permissions management state
  const [rolePermissions, setRolePermissions] = useState(() => {
    const saved = localStorage.getItem('role_permissions');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') {
          if (parsed.admin && !parsed.admin.includes('manage_gold_rates')) {
            parsed.admin.push('manage_gold_rates');
          }
          if (parsed.admin && !parsed.admin.includes('manage_terms')) {
            parsed.admin.push('manage_terms');
          }
          return parsed;
        }
      } catch (e) {
        console.error('Error parsing role_permissions from localStorage', e);
      }
    }
    return {
      admin: ['view_dashboard', 'moderate_auctions', 'manage_commissions', 'manage_categories', 'manage_users', 'manage_roles', 'edit_products', 'create_products', 'delete_products', 'manage_gold_rates', 'manage_terms'],
      commercant: ['publish_listings', 'manage_orders', 'view_shop_analytics', 'chat_with_clients'],
      client: ['browse_marketplace', 'place_bids', 'create_orders', 'inbox_chat']
    };
  });

  const hasPermission = useCallback((permKey) => {
    const currentRole = adminUser?.role || 'admin';
    const rolePerms = rolePermissions?.[currentRole];
    if (Array.isArray(rolePerms)) {
      return rolePerms.includes(permKey);
    }
    return currentRole === 'admin';
  }, [adminUser?.role, rolePermissions]);
  
  const isMerchant = adminUser?.role === 'commercant';
  const [activeTab, setActiveTab] = useState(() => (adminUser?.role === 'commercant' ? 'products' : 'dashboard'));
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (isMerchant && activeTab !== 'products' && activeTab !== 'sales_history' && (activeTab !== 'gold_rates' || !hasPermission('manage_gold_rates'))) {
      setActiveTab('products');
    } else if (activeTab === 'gold_rates' && !hasPermission('manage_gold_rates')) {
      setActiveTab('dashboard');
    } else if (activeTab === 'terms' && !hasPermission('manage_terms')) {
      setActiveTab('dashboard');
    }
  }, [isMerchant, activeTab, hasPermission]);
  const [stats, setStats] = useState({ totalSales: 0, totalCommissions: 0, totalMerchants: 0, totalClients: 0, totalProducts: 0, merchantsBreakdown: [] });
  const [pendingProducts, setPendingProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [users, setUsers] = useState([]);
  const [auctions, setAuctions] = useState([]);
  const [selectedAuctionForBids, setSelectedAuctionForBids] = useState(null);
  const [auctionBids, setAuctionBids] = useState([]);
  const [showBidsModal, setShowBidsModal] = useState(false);
  
  // Commission & suggestions settings state
  const [commissionConfig, setCommissionConfig] = useState({ 
    commission_globale: 5, 
    commission_categories: {}, 
    commission_commercants: {},
    product_suggestions: DEFAULT_SUGGESTIONS
  });
  
  // Suggestion manager inputs
  const [newSugTitleAr, setNewSugTitleAr] = useState('');
  const [newSugTitleFr, setNewSugTitleFr] = useState('');
  const [newSugDescAr, setNewSugDescAr] = useState('');
  const [newSugDescFr, setNewSugDescFr] = useState('');
  const [newSugPrixGramme, setNewSugPrixGramme] = useState('');
  
  // Categories inputs & edit
  const [newCat, setNewCat] = useState({ nom_fr: '', nom_ar: '', nom_en: '' });
  const [editingCategory, setEditingCategory] = useState(null);

  // Rejection modal state
  const [selectedProductForRejection, setSelectedProductForRejection] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');

  // Products state & modal (3 Languages: FR, AR, EN)
  const [products, setProducts] = useState([]);
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [productLangTab, setProductLangTab] = useState('ar'); // 'ar', 'fr'
  const [isTranslating, setIsTranslating] = useState(false);
  const [translateSuccessMsg, setTranslateSuccessMsg] = useState('');
  const [adminCustomImageUrl, setAdminCustomImageUrl] = useState('');
  const [adminVideoDuration, setAdminVideoDuration] = useState(null);
  const [adminVideoError, setAdminVideoError] = useState('');
  const [adminPendingVideoFile, setAdminPendingVideoFile] = useState(null);
  const [showAdminTrimModal, setShowAdminTrimModal] = useState(false);
  const [productForm, setProductForm] = useState({ 
    titre: '', 
    titre_fr: '',
    titre_ar: '',
    titre_en: '',
    description: '', 
    description_fr: '',
    description_ar: '',
    description_en: '',
    prix: '', 
    prix_gramme: '',
    gramme: '', 
    purete: '18k', 
    city: '', 
    stock: 1, 
    category_id: '', 
    statut: 'Validated', 
    commercant_id: '',
    type_vente: 'direct',
    prix_depart: '',
    duree: 24,
    images: [],
    video: null
  });

  const [isSubmittingProduct, setIsSubmittingProduct] = useState(false);

  // Product search/filters
  const [productSearch, setProductSearch] = useState('');
  const [productStatusFilter, setProductStatusFilter] = useState('All');
  const [productCategoryFilter, setProductCategoryFilter] = useState('All');
  const [productsViewMode, setProductsViewMode] = useState(() => window.innerWidth <= 900 ? 'cards' : 'table');

  // User form modal state
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [userForm, setUserForm] = useState({ nom: '', email: '', mot_de_passe: '', role: 'client', shopName: '', phone: '', address: '', city: '', numero_patente: '', patente_document: '', patente_filename: '', numero_bureau_garantie: '', bureau_garantie_document: '', bureau_garantie_filename: '', numero_cin: '', cin_recto_document: '', cin_recto_filename: '', cin_verso_document: '', cin_verso_filename: '' });

  // Subscriptions management state
  const [subscriptionsData, setSubscriptionsData] = useState(null);
  const [editingPlanModal, setEditingPlanModal] = useState(null);
  const [merchantSubModal, setMerchantSubModal] = useState(null);

  // Gold Rates Management State
  const [goldRatesData, setGoldRatesData] = useState({
    currentPrice24k: 1045,
    caratRates: { '24k': 1045, '21k': 914, '18k': 784, '14k': 610, '9k': 392, ounce: 32503, kilo: 1045000 },
    history: [],
    lastUpdated: '',
    updatedBy: ''
  });
  const [goldPriceInput, setGoldPriceInput] = useState('1045');
  const [silverPriceInput, setSilverPriceInput] = useState('14.50');
  const [goldSourceInput, setGoldSourceInput] = useState('');
  const [goldNoteInput, setGoldNoteInput] = useState('');
  const [isUpdatingGold, setIsUpdatingGold] = useState(false);
  const [adminMetalHistoryTab, setAdminMetalHistoryTab] = useState('silver');
  const [salesHistory, setSalesHistory] = useState([]);
  const [salesSearchTerm, setSalesSearchTerm] = useState('');

  // Notification Banner
  const [notif, setNotif] = useState(null);
  const triggerNotif = (msg) => {
    setNotif(msg);
    setTimeout(() => setNotif(null), 4000);
  };

  // Terms & Conditions Management State
  const [termsData, setTermsData] = useState(null);
  const [termsEditorLang, setTermsEditorLang] = useState('ar'); // 'ar', 'fr', 'preview'
  const [previewTermsLang, setPreviewTermsLang] = useState('ar');
  const [isSavingTerms, setIsSavingTerms] = useState(false);
  const [termsDirty, setTermsDirty] = useState(false);

  // Roles and permissions management action state
  const [isSavingPermissions, setIsSavingPermissions] = useState(false);
  const [permissionsDirty, setPermissionsDirty] = useState(false);

  const handleTogglePermission = (roleKey, permissionKey) => {
    const updated = { ...rolePermissions };
    const currentList = updated[roleKey] || [];
    if (currentList.includes(permissionKey)) {
      updated[roleKey] = currentList.filter(k => k !== permissionKey);
    } else {
      updated[roleKey] = [...currentList, permissionKey];
    }
    setRolePermissions(updated);
    setPermissionsDirty(true);
    localStorage.setItem('role_permissions', JSON.stringify(updated));
    triggerNotif(t('permUpdated'));
  };

  const handleResetPermissions = async () => {
    if (!window.confirm(t('resetPermissionsConfirm'))) return;
    const defaults = {
      admin: ['view_dashboard', 'moderate_auctions', 'manage_commissions', 'manage_categories', 'manage_users', 'manage_roles', 'edit_products', 'create_products', 'delete_products', 'manage_gold_rates', 'manage_terms'],
      commercant: ['publish_listings', 'edit_products', 'create_products', 'view_shop_analytics', 'manage_orders', 'chat_with_clients'],
      client: ['browse_marketplace', 'place_bids', 'create_orders', 'inbox_chat']
    };
    setRolePermissions(defaults);
    setPermissionsDirty(true);
    localStorage.setItem('role_permissions', JSON.stringify(defaults));
    try {
      await authFetch(`${API_URL}/config`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...commissionConfig,
          role_permissions: defaults
        })
      });
      setPermissionsDirty(false);
    } catch (e) {
      console.error(e);
    }
    triggerNotif(t('resetPermissionsSuccess'));
  };

  const handleSavePermissions = async () => {
    setIsSavingPermissions(true);
    try {
      const res = await authFetch(`${API_URL}/config`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...commissionConfig,
          role_permissions: rolePermissions
        })
      });
      if (res.ok) {
        setPermissionsDirty(false);
        localStorage.setItem('role_permissions', JSON.stringify(rolePermissions));
        triggerNotif(t('savePermissionsSuccess') || 'Permissions sauvegardées avec succès sur le serveur !');
      } else {
        triggerNotif('Erreur lors de la sauvegarde des permissions.');
      }
    } catch (err) {
      console.error(err);
      triggerNotif('Erreur de connexion au serveur.');
    } finally {
      setIsSavingPermissions(false);
    }
  };

  // Terms & Conditions Action Handlers
  const handleSaveTerms = async () => {
    if (!termsData) return;
    setIsSavingTerms(true);
    try {
      const res = await authFetch(`${API_URL}/terms-and-conditions`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(termsData)
      });
      if (res.ok) {
        const updated = await res.json();
        setTermsData(updated);
        setTermsDirty(false);
        triggerNotif(t('saveTermsSuccess'));
      } else {
        triggerNotif('Erreur lors de la sauvegarde des termes');
      }
    } catch (err) {
      console.error(err);
      triggerNotif('Erreur réseau lors de la sauvegarde');
    } finally {
      setIsSavingTerms(false);
    }
  };

  const handleAddTermArticle = () => {
    if (!termsData) return;
    const currentLang = termsEditorLang === 'fr' ? 'fr' : 'ar';
    const langData = termsData[currentLang] || { articles: [] };
    const articles = [...(langData.articles || [])];
    const newId = articles.length > 0 ? Math.max(...articles.map(a => a.id || 0)) + 1 : 1;
    const newArticle = {
      id: newId,
      title: currentLang === 'ar' ? `المادة ${newId} : عنوان المادة الجديدة` : `Article ${newId} : Nouveau Titre de Clause`,
      content: currentLang === 'ar' ? 'اكتب هنا نص المادة وشروطها القانونية...' : 'Rédigez ici le contenu de la nouvelle clause légale...'
    };
    const updated = {
      ...termsData,
      [currentLang]: {
        ...langData,
        articles: [...articles, newArticle]
      }
    };
    setTermsData(updated);
    setTermsDirty(true);
  };

  const handleRemoveTermArticle = (idToRemove) => {
    if (!termsData) return;
    const currentLang = termsEditorLang === 'fr' ? 'fr' : 'ar';
    const langData = termsData[currentLang] || { articles: [] };
    const articles = (langData.articles || []).filter(a => a.id !== idToRemove);
    const updated = {
      ...termsData,
      [currentLang]: {
        ...langData,
        articles
      }
    };
    setTermsData(updated);
    setTermsDirty(true);
  };

  const handleUpdateTermArticle = (id, field, value) => {
    if (!termsData) return;
    const currentLang = termsEditorLang === 'fr' ? 'fr' : 'ar';
    const langData = termsData[currentLang] || { articles: [] };
    const articles = (langData.articles || []).map(a => {
      if (a.id === id) {
        return { ...a, [field]: value };
      }
      return a;
    });
    const updated = {
      ...termsData,
      [currentLang]: {
        ...langData,
        articles
      }
    };
    setTermsData(updated);
    setTermsDirty(true);
  };

  const handleUpdateTermGeneral = (field, value) => {
    if (!termsData) return;
    const currentLang = termsEditorLang === 'fr' ? 'fr' : 'ar';
    const langData = termsData[currentLang] || {};
    const updated = {
      ...termsData,
      [currentLang]: {
        ...langData,
        [field]: value
      }
    };
    setTermsData(updated);
    setTermsDirty(true);
  };

  const handleResetTermsToDefault = async () => {
    if (!window.confirm(t('resetTermsConfirm'))) return;
    try {
      const res = await authFetch(`${API_URL}/terms-and-conditions`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          version: "1.0",
          fr: {
            title: "Conditions Générales d'Utilisation",
            subtitle: "Plateforme Numérique Joaillerie & Bijouterie au Maroc",
            preamble: "Les présentes Conditions Générales d'Utilisation (CGU) régissent l'accès, l'inscription et l'exploitation des services de la plateforme numérique HRSDGDG, exclusivement réservée aux professionnels de la bijouterie et joaillerie au Royaume du Maroc.",
            articles: [
              { id: 1, title: "Article 1 : Éligibilité & Inscription Réservée aux Professionnels", content: "La création d'un compte commerçant / atelier est strictement réservée aux personnes physiques ou morales exerçant légalement le métier de bijoutier-joaillier au Maroc, détentrices d'une patente professionnelle active et d'un Registre de Commerce (RC) valide." },
              { id: 2, title: "Article 2 : Vérification de la Patente et Conformité Documentaire", content: "L'adhérent garantit l'authenticité de l'attestation de patente et des pièces administratives téléversées. L'administration de HRSDGDG se réserve le droit d'auditer ces pièces et de suspendre tout compte dont les justificatifs s'avèrent non conformes." },
              { id: 3, title: "Article 3 : Exactitude des Descriptions, Poids et Enchères", content: "Le professionnel s'engage à fournir des descriptions rigoureusement exactes (poids net en grammes, pureté, pierres serties) et à livrer des pièces strictement identiques aux photos et caractéristiques publiées, ainsi qu'à honorer l'ensemble des adjudications d'enchères." },
              { id: 4, title: "Article 4 : Forfaits, Quotas & Commissions", content: "L'utilisation de la plateforme est régie par les formules d'abonnements souscrites. Les quotas de dépôts de bijoux et les commissions sur ventes sont appliqués conformément à la grille tarifaire en vigueur." },
              { id: 5, title: "Article 5 : Protection des Données Personnelles (Loi 09-08)", content: "Les données collectées font l'objet d'un traitement hautement sécurisé et chiffré, dans le strict respect de la Loi marocaine n° 09-08 relative à la protection des personnes physiques à l'égard du traitement des données à caractère personnel (CNDP)." },
              { id: 6, title: "Article 6 : Sanctions, Suspension & Résiliation", content: "Tout manquement aux présentes conditions, tentative de fraude, fausse déclaration sur le titre d'or ou refus d'honorer une vente conclue entraîne la suspension immédiate et irrévocable du compte professionnel." }
            ]
          },
          ar: {
            title: "شروط وأحكام استخدام المنصة",
            subtitle: "منصة HRSDGDG الرسمية لتجار وصاغة المجوهرات بالمغرب",
            preamble: "تُحدد هذه الشروط والأحكام القواعد الملزمة لإنشاء الحسابات واستخدام خدمات منصة HRSDGDG الرقمية المخصصة حصرياً للمحترفين والصاغة المعتمدين لممارسة تجارة وصياغة المعادن الثمينة بالمملكة المغربية.",
            articles: [
              { id: 1, title: "المادة 1 : الأهلية والتسجيل الحصري للمهنيين", content: "يقتصر إنشاء حساب Commerçant / صائغ معتمد على أصحاب المحلات، الورشات، والمؤسسات الحاصلة على رقم باتنت مهني وسجل تجاري (RC) ساري المفعول بالمغرب وفقاً للقوانين المنظمة لمهنة الصياغة." },
              { id: 2, title: "المادة 2 : التحقق من وثيقة الباتنت والسجل التجاري", content: "يقر المستخدم بأن جميع الوثائق المرفوعة (شهادة الباتنت، السجل التجاري، والبيانات التعريفية) صحيحة وحديثة. تحتفظ إدارة المنصة بحق التحقق من صحة الوثائق مع الجهات المختصة ورفض أو تعليق أي حساب غير مستوفٍ للشروط." },
              { id: 3, title: "المادة 3 : الالتزام بالمواصفات وتسليم المجوهرات والمزادات", content: "يلتزم الصائغ بالدقة المتناهية في ذكر الأوزان الصافية بالغرام، نوع الأحجار الكريمة، والمواصفات الفنية، وتسليم القطع للمشتري مطابقة للصور والوصف المنشور، والالتزام بإتمام المزادات المنتهية لصالح الفائزين." },
              { id: 4, title: "المادة 4 : باقات الاشتراكات والعمولات", content: "يخضع عرض المجوهرات لباقات الاشتراك المختارة وتحدد كل باقة الحد الأقصى للمنتجات ونسب العمولة المستحقة للمنصة عن كل عملية بيع مؤكدة." },
              { id: 5, title: "المادة 5 : حماية المعطيات والسرية المهنية (قانون 09-08)", content: "تلتزم المنصة بحماية وسرية البيانات والمعاملات التجارية الخاصة بالصاغة والمشتركين طبقاً لأحكام القانون المغربي رقم 09-08 المتعلق بحماية الأشخاص الذاتيين تجاه معالجة المعطيات ذات الطابع الشخصي (CNDP)." },
              { id: 6, title: "المادة 6 : الجزاءات وإنهاء الحساب", content: "يحق لإدارة المنصة إيقاف أو فسخ حساب أي عضو بصورة فورية ونهائية في حال الإخلال بشروط الأمان، التلاعب بالأسعار أو العيارات، أو الإخلال بتسليم الطلبات." }
            ]
          }
        })
      });
      if (res.ok) {
        const def = await res.json();
        setTermsData(def);
        setTermsDirty(false);
        triggerNotif(t('resetTermsSuccess'));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleQuickRoleChange = async (userId, newRole) => {
    const user = users.find(u => u.id === userId);
    if (!user) return;
    try {
      const res = await fetch(`${API_URL}/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...user,
          role: newRole,
          shopName: newRole === 'commercant' ? (user.shopName || `${user.nom} Boutique`) : undefined
        })
      });
      if (res.ok) {
        triggerNotif(t('notifRoleUpdated'));
        fetchData();
      } else {
        const errData = await res.json().catch(() => ({}));
        triggerNotif(errData.message || t('notifRoleError'));
      }
    } catch (err) {
      console.error(err);
      triggerNotif(t('notifServerError'));
    }
  };

  // BiDi-safe Phone Formatter & Link Helpers for RTL and LTR
  const formatPhoneDisplay = (raw) => {
    if (!raw) return '';
    const str = String(raw).trim();
    const digits = str.replace(/[^\d]/g, '');

    // Moroccan phone numbers: 212XXXXXXXXX or 0XXXXXXXXX
    if (digits.startsWith('212') && digits.length >= 11) {
      const national = digits.slice(3);
      const prefix = national.slice(0, 3);
      const suffix = national.slice(3);
      return `+212 ${prefix}-${suffix}`;
    }
    if (digits.startsWith('0') && digits.length === 10) {
      const national = digits.slice(1);
      const prefix = national.slice(0, 3);
      const suffix = national.slice(3);
      return `+212 ${prefix}-${suffix}`;
    }
    if (digits.length === 9) {
      const prefix = digits.slice(0, 3);
      const suffix = digits.slice(3);
      return `+212 ${prefix}-${suffix}`;
    }
    return str;
  };

  const getCleanPhoneDigits = (raw) => {
    if (!raw) return '';
    const digits = String(raw).replace(/[^\d]/g, '');
    if (digits.startsWith('0') && digits.length === 10) {
      return '212' + digits.slice(1);
    }
    if (digits.startsWith('212')) {
      return digits;
    }
    return '212' + digits;
  };

  const handleUpdateUserAccountStatus = async (userId, newStatus, reason = '') => {
    try {
      const res = await fetch(`${API_URL}/users/${userId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          account_status: newStatus,
          block_reason: reason
        })
      });
      if (res.ok) {
        const msg = newStatus === 'actif' 
          ? (lang === 'ar' ? 'تم تفعيل الحساب بنجاح ! ✓' : 'Compte activé avec succès ! ✓') 
          : newStatus === 'bloque' 
            ? (lang === 'ar' ? 'تم حظر الحساب بنجاح.' : 'Compte bloqué avec succès.') 
            : (lang === 'ar' ? 'تم وضع الحساب قيد المراجعة والتدقيق.' : 'Compte mis en attente de vérification.');
        triggerNotif(msg);
        fetchData();
      } else {
        const errData = await res.json().catch(() => ({}));
        triggerNotif(errData.message || (lang === 'ar' ? 'فشل تعديل حالة الحساب.' : 'Erreur lors de la mise à jour du statut.'));
      }
    } catch (err) {
      console.error(err);
      triggerNotif(lang === 'ar' ? 'خطأ في الاتصال بالخادم.' : 'Erreur de connexion avec le serveur.');
    }
  };

  const handleOpenAddUser = (initialRole = 'client') => {
    setEditingUser(null);
    setUserForm({
      nom: '',
      email: '',
      mot_de_passe: '',
      role: initialRole,
      account_status: 'actif',
      block_reason: '',
      shopName: '',
      phone: '',
      address: '',
      city: 'Casablanca',
      numero_patente: '',
      patente_document: '',
      patente_filename: '',
      numero_bureau_garantie: '',
      bureau_garantie_document: '',
      bureau_garantie_filename: '',
      numero_cin: '',
      cin_recto_document: '',
      cin_recto_filename: '',
      cin_verso_document: '',
      cin_verso_filename: '',
      plan_id: (subscriptionsData?.plans && subscriptionsData.plans[0]?.id) || 'plan_starter',
      billing_cycle: 'monthly'
    });
    setShowUserModal(true);
  };

  const handleOpenEditUser = (u) => {
    setEditingUser(u);
    const initialStatus = u.account_status || (u.is_blocked ? 'bloque' : (u.is_active === false ? 'en_attente' : 'actif'));
    setUserForm({
      nom: u.nom || '',
      email: u.email || '',
      mot_de_passe: u.mot_de_passe || '',
      role: u.role || 'client',
      account_status: initialStatus,
      block_reason: u.block_reason || '',
      shopName: u.shopName || '',
      phone: u.phone || u.telephone || '',
      address: u.address || '',
      city: u.city || '',
      numero_patente: u.numero_patente || '',
      patente_document: u.patente_document || '',
      patente_filename: u.patente_filename || '',
      numero_bureau_garantie: u.numero_bureau_garantie || '',
      bureau_garantie_document: u.bureau_garantie_document || '',
      bureau_garantie_filename: u.bureau_garantie_filename || '',
      numero_cin: u.numero_cin || '',
      cin_recto_document: u.cin_recto_document || '',
      cin_recto_filename: u.cin_recto_filename || '',
      cin_verso_document: u.cin_verso_document || '',
      cin_verso_filename: u.cin_verso_filename || '',
      plan_id: u.subscription?.plan_id || 'plan_starter',
      billing_cycle: u.subscription?.billing_cycle || 'monthly'
    });
    setShowUserModal(true);
  };

  const handleUserSubmit = async (e) => {
    e.preventDefault();
    const url = editingUser ? `${API_URL}/users/${editingUser.id}` : `${API_URL}/users`;
    const method = editingUser ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userForm)
      });
      if (res.ok) {
        triggerNotif(editingUser ? 'Utilisateur mis à jour avec succès !' : 'Utilisateur créé avec succès !');
        setShowUserModal(false);
        fetchData();
      } else {
        const errorData = await res.json();
        triggerNotif(errorData.message || 'Une erreur est survenue.');
      }
    } catch (err) {
      console.error(err);
      triggerNotif('Erreur de connexion avec le serveur.');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Voulez-vous vraiment supprimer cet utilisateur ?')) return;

    try {
      const res = await fetch(`${API_URL}/users/${userId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        triggerNotif('Utilisateur supprimé !');
        fetchData();
      } else {
        const errorData = await res.json();
        triggerNotif(errorData.message || 'Une erreur est survenue.');
      }
    } catch (err) {
      console.error(err);
      triggerNotif('Erreur de suppression.');
    }
  };

  const handleOpenAddProduct = () => {
    setEditingProduct(null);
    setProductLangTab('ar');
    const defaultMerchant = isMerchant ? adminUser?.id : (adminUser?.id || users.find(u => u.role === 'commercant')?.id || 'admin');
    const defaultCategory = categories[0]?.id || '';
    setProductForm({
      titre: '',
      titre_fr: '',
      titre_ar: '',
      titre_en: '',
      description: '',
      description_fr: '',
      description_ar: '',
      description_en: '',
      prix: '',
      gramme: '',
      purete: '18k',
      city: adminUser?.city || 'Casablanca',
      stock: 1,
      category_id: defaultCategory,
      commercant_id: defaultMerchant,
      vendeur_nom: isMerchant ? (adminUser?.shopName || adminUser?.nom) : '',
      statut: 'Validated',
      etat: 'Neuf',
      type_vente: 'direct',
      prix_depart: '',
      duree: 24,
      images: [],
      video: null
    });
    setAdminVideoDuration(null);
    setAdminVideoError('');
    setShowProductModal(true);
  };

  const handleOpenAddAuction = () => {
    setEditingProduct(null);
    setProductLangTab('ar');
    const defaultMerchant = adminUser?.id || users.find(u => u.role === 'commercant')?.id || 'admin';
    const defaultCategory = categories[0]?.id || '';
    setProductForm({
      titre: '',
      titre_fr: '',
      titre_ar: '',
      titre_en: '',
      description: '',
      description_fr: '',
      description_ar: '',
      description_en: '',
      prix: '5000',
      gramme: '10',
      purete: '18k',
      city: adminUser?.city || 'Casablanca',
      stock: 1,
      category_id: defaultCategory,
      commercant_id: defaultMerchant,
      statut: 'Validated',
      etat: 'Neuf',
      type_vente: 'enchere',
      prix_depart: '5000',
      duree: 48,
      images: [],
      video: null
    });
    setAdminVideoDuration(null);
    setAdminVideoError('');
    setShowProductModal(true);
  };

  const handleOpenEditProduct = (p) => {
    setEditingProduct(p);
    setProductLangTab('ar');
    setProductForm({
      titre: p.titre || p.titre_fr || '',
      titre_fr: p.titre_fr || p.titre || '',
      titre_ar: p.titre_ar || '',
      titre_en: p.titre_en || '',
      description: p.description || p.description_fr || '',
      description_fr: p.description_fr || p.description || '',
      description_ar: p.description_ar || '',
      description_en: p.description_en || '',
      prix: p.prix || '',
      prix_gramme: (p.prix && (p.gramme || p.poids)) ? (p.prix / (p.gramme || p.poids)).toFixed(2) : '',
      gramme: p.gramme || p.poids || '',
      purete: p.purete || '18k',
      city: p.city || p.ville || 'Casablanca',
      stock: p.stock || 1,
      category_id: p.category_id || '',
      commercant_id: p.commercant_id || adminUser?.id || 'admin',
      statut: p.statut || 'Validated',
      etat: p.etat || 'Neuf',
      type_vente: (p.disponibilite === 'enchere' || p.type_vente === 'AUCTION') ? 'enchere' : 'direct',
      prix_depart: p.prix || '',
      duree: 24,
      images: Array.isArray(p.images) ? p.images : (p.image ? [p.image] : []),
      video: p.video || null
    });
    setAdminVideoDuration(p.video ? 10 : null);
    setAdminVideoError('');
    setShowProductModal(true);
  };

  // Multi-image handlers for admin product modal
  const compressImage = (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const maxDim = 1200;
          let width = img.width;
          let height = img.height;
          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.82));
        };
        img.onerror = () => resolve(e.target.result);
        img.src = e.target.result;
      };
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(file);
    });
  };

  const handleAdminFilesSelected = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    for (const file of files) {
      const compressed = await compressImage(file);
      if (compressed) {
        setProductForm(prev => ({
          ...prev,
          images: [...(prev.images || []), compressed]
        }));
      }
    }
    e.target.value = '';
  };

  const handleAdminVideoSelected = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    setAdminVideoError('');

    // Limite de taille max 50Mo
    if (file.size > 50 * 1024 * 1024) {
      setAdminVideoError('حجم الفيديو يتجاوز 50 ميغابايت. يرجى اختيار ملف أصغر.');
      e.target.value = '';
      return;
    }

    const tempVideo = document.createElement('video');
    tempVideo.preload = 'metadata';
    const blobUrl = URL.createObjectURL(file);

    tempVideo.onloadedmetadata = () => {
      URL.revokeObjectURL(blobUrl);
      const duration = tempVideo.duration;

      // Si la durée dépasse 10s, ouvrir l'outil de découpage vidéo
      if (duration > 10.9) {
        setAdminPendingVideoFile(file);
        setShowAdminTrimModal(true);
        setAdminVideoError(`⚠️ مدة الفيديو (${Math.round(duration)} ثوانٍ) تتجاوز 10 ثوانٍ. تم فتح أداة القص لاختيار مقطع 10 ثوانٍ.`);
        return;
      }

      setAdminVideoDuration(Math.round(duration * 10) / 10);
      setAdminVideoError('');

      const reader = new FileReader();
      reader.onloadend = () => {
        if (reader.result) {
          setProductForm(prev => ({
            ...prev,
            video: reader.result
          }));
        }
      };
      reader.readAsDataURL(file);
    };

    tempVideo.onerror = () => {
      URL.revokeObjectURL(blobUrl);
      setAdminVideoError('تعذر قراءة صيغة الفيديو. يرجى تجربة ملف آخر (MP4/WebM/MOV).');
    };

    tempVideo.src = blobUrl;
    e.target.value = '';
  };

  const handleAdminRemoveVideo = () => {
    setProductForm(prev => ({ ...prev, video: null }));
    setAdminVideoDuration(null);
    setAdminVideoError('');
    setAdminPendingVideoFile(null);
    setShowAdminTrimModal(false);
  };

  const handleAdminAddImageUrl = () => {
    if (!adminCustomImageUrl.trim()) return;
    const url = adminCustomImageUrl.trim();
    const isVideo = /\.(mp4|webm|mov|ogg)($|\?)/i.test(url) || url.startsWith('data:video/');
    if (isVideo) {
      setProductForm(prev => ({ ...prev, video: url }));
      setAdminVideoDuration(10);
      setAdminVideoError('');
    } else {
      setProductForm(prev => ({
        ...prev,
        images: [...(prev.images || []), url]
      }));
    }
    setAdminCustomImageUrl('');
  };

  const handleAdminRemoveImage = (indexToRemove) => {
    setProductForm(prev => ({
      ...prev,
      images: (prev.images || []).filter((_, idx) => idx !== indexToRemove)
    }));
  };

  const handleAdminSetPrimaryImage = (indexToPrimary) => {
    setProductForm(prev => {
      const imgs = [...(prev.images || [])];
      const selected = imgs.splice(indexToPrimary, 1)[0];
      return {
        ...prev,
        images: [selected, ...imgs]
      };
    });
  };

  // Calcul automatique du prix: prix du gramme * gramme
  const handleAdminGrammeChange = (val) => {
    setProductForm(prev => {
      const g = parseFloat(val);
      const pg = parseFloat(prev.prix_gramme);
      let newPrix = prev.prix;
      let newPrixDepart = prev.prix_depart;

      if (!isNaN(g) && g > 0 && !isNaN(pg) && pg > 0) {
        const total = Math.round(g * pg);
        if (prev.type_vente === 'enchere') {
          newPrixDepart = total;
        } else {
          newPrix = total;
        }
      }
      return {
        ...prev,
        gramme: val,
        prix: newPrix,
        prix_depart: newPrixDepart
      };
    });
  };

  const handleAdminPrixGrammeChange = (val) => {
    setProductForm(prev => {
      const pg = parseFloat(val);
      const g = parseFloat(prev.gramme);
      let newPrix = prev.prix;
      let newPrixDepart = prev.prix_depart;

      if (!isNaN(pg) && pg > 0 && !isNaN(g) && g > 0) {
        const total = Math.round(g * pg);
        if (prev.type_vente === 'enchere') {
          newPrixDepart = total;
        } else {
          newPrix = total;
        }
      }
      return {
        ...prev,
        prix_gramme: val,
        prix: newPrix,
        prix_depart: newPrixDepart
      };
    });
  };

  const handleAdminTotalPriceChange = (val) => {
    setProductForm(prev => {
      const p = parseFloat(val);
      const g = parseFloat(prev.gramme);
      let newPrixGramme = prev.prix_gramme;
      if (!isNaN(p) && p > 0 && !isNaN(g) && g > 0) {
        newPrixGramme = (p / g).toFixed(2);
      }
      return {
        ...prev,
        prix: val,
        prix_depart: prev.type_vente === 'enchere' ? val : prev.prix_depart,
        prix_gramme: newPrixGramme
      };
    });
  };

  // Auto-translate product content between AR and FR
  const handleAutoTranslateProduct = async (sourceLang = productLangTab, showAlert = true) => {
    const title = sourceLang === 'fr' 
      ? (productForm.titre_fr || productForm.titre || '') 
      : (productForm.titre_ar || '');
    const desc = sourceLang === 'fr' 
      ? (productForm.description_fr || productForm.description || '') 
      : (productForm.description_ar || '');

    if (!title.trim() && !desc.trim()) {
      if (showAlert) {
        triggerNotif(t('notifFillBeforeTranslate'));
      }
      return;
    }

    setIsTranslating(true);
    try {
      const targetLang = sourceLang === 'ar' ? 'fr' : 'ar';
      const res = await fetch(`${API_URL}/translate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: sourceLang,
          targets: [targetLang],
          fields: {
            title,
            description: desc
          }
        })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.translations) {
          setProductForm(prev => {
            const updated = { ...prev };
            if (data.translations.ar) {
              if (data.translations.ar.title) updated.titre_ar = data.translations.ar.title;
              if (data.translations.ar.description) updated.description_ar = data.translations.ar.description;
            }
            if (data.translations.fr) {
              if (data.translations.fr.title) {
                updated.titre_fr = data.translations.fr.title;
                updated.titre = data.translations.fr.title;
              }
              if (data.translations.fr.description) {
                updated.description_fr = data.translations.fr.description;
                updated.description = data.translations.fr.description;
              }
            }
            return updated;
          });
          setTranslateSuccessMsg(t('notifTranslateSuccess'));
          triggerNotif(t('notifTranslateSuccess'));
          setTimeout(() => setTranslateSuccessMsg(''), 4000);
        }
      }
    } catch (err) {
      console.error("Auto translate error:", err);
      triggerNotif(t('notifTranslateError'));
    } finally {
      setIsTranslating(false);
    }
  };

  // Switch tab and automatically translate to target if target is empty
  const switchProductLangTab = async (targetTab) => {
    const prevTab = productLangTab;
    setProductLangTab(targetTab);

    // If source tab has content and target tab is empty, auto-translate automatically!
    const prevTitle = prevTab === 'fr' ? (productForm.titre_fr || productForm.titre || '') : (productForm.titre_ar || '');
    const prevDesc = prevTab === 'fr' ? (productForm.description_fr || productForm.description || '') : (productForm.description_ar || '');
    
    const targetTitle = targetTab === 'fr' ? (productForm.titre_fr || productForm.titre || '') : (productForm.titre_ar || '');
    const targetDesc = targetTab === 'fr' ? (productForm.description_fr || productForm.description || '') : (productForm.description_ar || '');

    if ((prevTitle.trim() || prevDesc.trim()) && (!targetTitle.trim() && !targetDesc.trim())) {
      handleAutoTranslateProduct(prevTab, false);
    }
  };

  // Auto-translate category names between AR and FR
  const handleAutoTranslateCategory = async (catObj, setCatFunc) => {
    let sourceLang = 'ar';
    let name = catObj.nom_ar || '';
    if (!name.trim() && catObj.nom_fr?.trim()) {
      sourceLang = 'fr';
      name = catObj.nom_fr;
    }

    if (!name.trim()) {
      triggerNotif(t('notifFillBeforeTranslate'));
      return;
    }

    try {
      const targetLang = sourceLang === 'ar' ? 'fr' : 'ar';
      const res = await fetch(`${API_URL}/translate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: sourceLang,
          targets: [targetLang, 'en'],
          fields: { name }
        })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.translations) {
          setCatFunc(prev => {
            const updated = { ...prev };
            if (data.translations.fr?.name) updated.nom_fr = data.translations.fr.name;
            if (data.translations.ar?.name) updated.nom_ar = data.translations.ar.name;
            if (data.translations.en?.name) updated.nom_en = data.translations.en.name;
            return updated;
          });
          triggerNotif(lang === 'ar' ? '✨ تمت ترجمة الفئة بنجاح !' : '✨ Catégorie traduite avec succès !');
        }
      }
    } catch (err) {
      console.error("Category translate error:", err);
    }
  };

  const handleProductSubmit = async (e) => {
    e.preventDefault();
    if (isSubmittingProduct) return;
    setIsSubmittingProduct(true);
    const url = editingProduct ? `${API_URL}/bijoux/${editingProduct.id}` : `${API_URL}/bijoux`;
    const method = editingProduct ? 'PUT' : 'POST';

    // Prepare body with fallback synchronization
    const activeTitle = (productForm.titre_ar || productForm.titre_fr || productForm.titre || '').trim();
    if (!activeTitle) {
      triggerNotif(lang === 'ar' ? 'يرجى إدخال عنوان للقطعة.' : 'Veuillez saisir un titre pour le bijou.');
      setIsSubmittingProduct(false);
      return;
    }

    const defaultMerchant = isMerchant ? adminUser?.id : (adminUser?.id || users.find(u => u.role === 'commercant')?.id || 'admin');
    const finalTitreAr = (productForm.titre_ar || productForm.titre || productForm.titre_fr || '').trim();
    const finalTitreFr = (productForm.titre_fr || productForm.titre || productForm.titre_ar || '').trim();
    const finalDescAr = (productForm.description_ar || productForm.description || productForm.description_fr || '').trim();
    const finalDescFr = (productForm.description_fr || productForm.description || productForm.description_ar || '').trim();

    const bodyData = { 
      ...productForm,
      purete: productForm.purete || '18k',
      stock: 1,
      statut: productForm.statut || (editingProduct ? editingProduct.statut : 'Validated'),
      commercant_id: isMerchant ? adminUser.id : (productForm.commercant_id || defaultMerchant),
      vendeur_nom: isMerchant ? (adminUser?.shopName || adminUser?.nom) : (productForm.vendeur_nom || ''),
      etat: productForm.etat || 'Neuf',
      titre: finalTitreAr || finalTitreFr,
      titre_ar: finalTitreAr,
      titre_fr: finalTitreFr,
      description: finalDescAr || finalDescFr,
      description_ar: finalDescAr,
      description_fr: finalDescFr
    };
    if (productForm.type_vente === 'enchere') {
      bodyData.prix = parseFloat(productForm.prix_depart) || parseFloat(productForm.prix) || 1000;
      bodyData.disponibilite = 'enchere';
    } else {
      bodyData.stock = 1;
    }

    try {
      const res = await fetch(url, {
        method,
        headers: { 
          'Content-Type': 'application/json',
          'x-admin': 'true'
        },
        body: JSON.stringify(bodyData)
      });
      if (res.ok) {
        const createdProduct = await res.json();
        
        // If it's an auction, create or update the auction entity
        if (productForm.type_vente === 'enchere') {
          const startPrice = parseFloat(productForm.prix_depart) || parseFloat(productForm.prix) || 1000;
          const durationHours = parseFloat(productForm.duree) || 48;
          const auctionRes = await fetch(`${API_URL}/encheres`, {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'x-admin': 'true'
            },
            body: JSON.stringify({
              bijou_id: createdProduct.id,
              prix_depart: startPrice,
              date_debut: new Date().toISOString(),
              date_fin: new Date(Date.now() + durationHours * 60 * 60 * 1000).toISOString(),
              increment_min: 50,
              prix_reserve: startPrice
            })
          });
          if (!auctionRes.ok) {
            triggerNotif("Article créé, mais échec du lancement de l'enchère.");
            setShowProductModal(false);
            fetchData();
            return;
          }
        }

        triggerNotif(editingProduct ? 'Article mis à jour avec succès !' : (productForm.type_vente === 'enchere' ? '🔨 Enchère créée et publiée en direct !' : 'Article créé avec succès !'));
        setShowProductModal(false);
        fetchData();
      } else {
        const errJson = await res.json().catch(() => ({}));
        triggerNotif(errJson.message || (editingProduct ? "Erreur lors de la mise à jour de l'article." : "Erreur lors de la création de l'article."));
      }
    } catch (e) {
      console.error(e);
      triggerNotif("Erreur de connexion au serveur.");
    } finally {
      setIsSubmittingProduct(false);
    }
  };

  const handleDeleteProduct = async (productId) => {
    if (!window.confirm("Voulez-vous vraiment supprimer cet article ?")) return;
    try {
      const res = await fetch(`${API_URL}/bijoux/${productId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        triggerNotif('Article supprimé avec succès !');
        fetchData();
      } else {
        triggerNotif("Erreur lors de la suppression de l'article.");
      }
    } catch (e) {
      console.error(e);
      triggerNotif("Erreur lors de la suppression.");
    }
  };

  const isFetchingRef = useRef(false);
  const initialLoadDoneRef = useRef(false);

  const fetchData = async (isPeriodic = false) => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    try {
      const isMerchantUser = adminUser?.role === 'commercant';
      const shouldFetchAll = !isPeriodic || !initialLoadDoneRef.current;
      const [
        statsRes,
        pendingRes,
        catRes,
        configRes,
        usersRes,
        auctionsRes,
        allBijouxRes,
        subscriptionsRes,
        goldRes,
        salesRes,
        termsRes
      ] = await Promise.allSettled([
        isMerchantUser ? Promise.resolve(null) : authFetch(`${API_URL}/stats/admin`),
        isMerchantUser ? Promise.resolve(null) : authFetch(`${API_URL}/bijoux?status=Pending`),
        shouldFetchAll ? authFetch(`${API_URL}/categories`) : Promise.resolve(null),
        shouldFetchAll ? authFetch(`${API_URL}/config`) : Promise.resolve(null),
        (shouldFetchAll && !isMerchantUser) ? authFetch(`${API_URL}/users`) : Promise.resolve(null),
        isMerchantUser ? Promise.resolve(null) : authFetch(`${API_URL}/encheres`),
        authFetch(`${API_URL}/bijoux?includeSold=true`),
        (shouldFetchAll && !isMerchantUser) ? authFetch(`${API_URL}/subscriptions/all`) : Promise.resolve(null),
        shouldFetchAll ? authFetch(`${API_URL}/gold-rates`) : Promise.resolve(null),
        authFetch(isMerchantUser && adminUser?.id ? `${API_URL}/sales-history?merchant_id=${adminUser.id}` : `${API_URL}/sales-history`),
        shouldFetchAll ? authFetch(`${API_URL}/terms-and-conditions`) : Promise.resolve(null)
      ]);

      if (statsRes.status === 'fulfilled' && statsRes.value && statsRes.value.ok) {
        try {
          const statsData = await statsRes.value.json();
          setStats(statsData);
        } catch (e) { console.error('Stats parse error', e); }
      }

      if (pendingRes.status === 'fulfilled' && pendingRes.value && pendingRes.value.ok) {
        try {
          const pendingData = await pendingRes.value.json();
          setPendingProducts(Array.isArray(pendingData) ? pendingData : []);
        } catch (e) { console.error('Pending parse error', e); }
      }

      if (catRes.status === 'fulfilled' && catRes.value && catRes.value.ok) {
        try {
          const catData = await catRes.value.json();
          setCategories(Array.isArray(catData) ? catData : []);
        } catch (e) { console.error('Categories parse error', e); }
      }

      if (configRes.status === 'fulfilled' && configRes.value && configRes.value.ok) {
        try {
          const configData = await configRes.value.json();
          setCommissionConfig({
            ...configData,
            product_suggestions: {
              ...DEFAULT_SUGGESTIONS,
              ...(configData.product_suggestions || {})
            }
          });
          if (configData.role_permissions && typeof configData.role_permissions === 'object') {
            const perms = { ...configData.role_permissions };
            if (perms.admin && !perms.admin.includes('manage_gold_rates')) {
              perms.admin = [...perms.admin, 'manage_gold_rates'];
            }
            setRolePermissions(perms);
            localStorage.setItem('role_permissions', JSON.stringify(perms));
          }
        } catch (e) { console.error('Config parse error', e); }
      }

      if (usersRes.status === 'fulfilled' && usersRes.value && usersRes.value.ok) {
        try {
          const usersData = await usersRes.value.json();
          setUsers(Array.isArray(usersData) ? usersData : []);
        } catch (e) { console.error('Users parse error', e); }
      }

      if (auctionsRes.status === 'fulfilled' && auctionsRes.value && auctionsRes.value.ok) {
        try {
          const auctionsData = await auctionsRes.value.json();
          setAuctions(Array.isArray(auctionsData) ? auctionsData : []);
        } catch (e) { console.error('Auctions parse error', e); }
      }

      if (allBijouxRes.status === 'fulfilled' && allBijouxRes.value && allBijouxRes.value.ok) {
        try {
          const allBijouxData = await allBijouxRes.value.json();
          const list = Array.isArray(allBijouxData) ? allBijouxData : [];
          setProducts(isMerchantUser && adminUser?.id ? list.filter(b => b.commercant_id === adminUser.id) : list);
        } catch (e) { console.error('Products parse error', e); }
      }

      if (subscriptionsRes.status === 'fulfilled' && subscriptionsRes.value && subscriptionsRes.value.ok) {
        try {
          const subData = await subscriptionsRes.value.json();
          setSubscriptionsData(subData);
        } catch (e) { console.error('Subscriptions parse error', e); }
      }

      if (goldRes.status === 'fulfilled' && goldRes.value && goldRes.value.ok) {
        try {
          const goldData = await goldRes.value.json();
          if (goldData.success) {
            setGoldRatesData(goldData);
            if (!goldPriceInput || goldPriceInput === '1045') {
              setGoldPriceInput(String(goldData.currentPrice18k || 1045));
            }
            if (!silverPriceInput || silverPriceInput === '14.50') {
              setSilverPriceInput(String(goldData.currentPriceSilver || 14.50));
            }
          }
        } catch (e) { console.error('Gold rates parse error', e); }
      }

      if (salesRes && salesRes.status === 'fulfilled' && salesRes.value && salesRes.value.ok) {
        try {
          const salesData = await salesRes.value.json();
          let list = Array.isArray(salesData) ? salesData : (salesData.sales || []);
          if (isMerchantUser && adminUser?.id) {
            list = list.filter(s => s.vendeur_id === adminUser.id);
          }
          setSalesHistory(list);
        } catch (e) { console.error('Sales parse error', e); }
      }

      if (termsRes && termsRes.status === 'fulfilled' && termsRes.value && termsRes.value.ok) {
        try {
          const termsJson = await termsRes.value.json();
          setTermsData(prev => prev && termsDirty ? prev : termsJson);
        } catch (e) { console.error('Terms parse error', e); }
      }

    } catch (error) {
      console.error('Error fetching admin data:', error);
    } finally {
      isFetchingRef.current = false;
      initialLoadDoneRef.current = true;
    }
  };

  const handleUpdateMerchantSubStatus = async (merchantId, newStatus) => {
    try {
      const res = await fetch(`${API_URL}/subscriptions/${merchantId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        triggerNotif(`Statut d'abonnement mis à jour : ${newStatus}`);
        fetchData();
      }
    } catch (e) {
      console.error(e);
      triggerNotif('Erreur lors de la mise à jour du statut.');
    }
  };

  const handleUpdateMerchantPlan = async (merchantId, newPlanId, newBillingCycle) => {
    try {
      const res = await fetch(`${API_URL}/subscriptions/${merchantId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan_id: newPlanId, billing_cycle: newBillingCycle })
      });
      if (res.ok) {
        triggerNotif('Forfait commerçant modifié avec succès !');
        setMerchantSubModal(null);
        fetchData();
      }
    } catch (e) {
      console.error(e);
      triggerNotif('Erreur lors de la modification du forfait.');
    }
  };

  const handleSavePlanConfig = async (e) => {
    e.preventDefault();
    if (!editingPlanModal) return;
    if (!editingPlanModal.name || !editingPlanModal.name.trim()) {
      triggerNotif(lang === 'ar' ? 'يرجى إدخال اسم الباقة' : 'Veuillez saisir un nom pour le forfait.');
      return;
    }
    try {
      const isNew = !editingPlanModal.id;
      const url = isNew ? `${API_URL}/subscription-plans` : `${API_URL}/subscription-plans/${editingPlanModal.id}`;
      const method = isNew ? 'POST' : 'PUT';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingPlanModal)
      });
      if (res.ok) {
        triggerNotif(isNew ? (lang === 'ar' ? 'تم إنشاء الباقة بنجاح !' : 'Nouveau forfait créé avec succès !') : (lang === 'ar' ? 'تم حفظ التعديلات بنجاح !' : 'Configuration du forfait enregistrée avec succès !'));
        setEditingPlanModal(null);
        fetchData();
      } else {
        const errorData = await res.json().catch(() => ({}));
        triggerNotif(errorData.message || (lang === 'ar' ? 'خطأ أثناء حفظ الباقة.' : 'Erreur lors de la sauvegarde du forfait.'));
      }
    } catch (e) {
      console.error(e);
      triggerNotif(lang === 'ar' ? 'خطأ في الاتصال بالخادم.' : 'Erreur lors de la sauvegarde du forfait.');
    }
  };

  const handleDeletePlan = async (planId) => {
    if (!window.confirm(lang === 'ar' ? 'هل أنت متأكد من حذف هذه الباقة؟' : 'Êtes-vous sûr de vouloir supprimer ce forfait ?')) return;
    try {
      const res = await fetch(`${API_URL}/subscription-plans/${planId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        triggerNotif(lang === 'ar' ? 'تم حذف الباقة بنجاح !' : 'Forfait supprimé avec succès !');
        fetchData();
      } else {
        const err = await res.json().catch(() => ({}));
        triggerNotif(err.message || (lang === 'ar' ? 'خطأ أثناء الحذف' : 'Erreur lors de la suppression.'));
      }
    } catch (e) {
      console.error(e);
      triggerNotif(lang === 'ar' ? 'خطأ في الاتصال بالخادم.' : 'Erreur lors de la suppression.');
    }
  };

  const handleUpdateSilverRateOnly = async (customVal) => {
    const valSilver = parseFloat(customVal !== undefined && customVal !== null ? customVal : silverPriceInput);
    if (!valSilver || isNaN(valSilver) || valSilver <= 0) {
      triggerNotif(lang === 'ar' ? 'يرجى إدخال سعر صحيح لغرام الفضة 1000 (مثال: 14.50)' : 'Veuillez saisir un prix valide pour l\'Argent 1000 (ex: 14.50)');
      return;
    }

    setIsUpdatingGold(true);
    try {
      const res = await authFetch(`${API_URL}/admin/gold-rates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          priceSilver: valSilver,
          source: goldSourceInput.trim() || (lang === 'ar' ? 'سعر الفضة المحدد - المغرب' : 'Fixation Officielle Argent Maroc'),
          note: goldNoteInput.trim() || (lang === 'ar' ? 'تعديل سعر الفضة من لوحة التحكم' : 'Paramétrage cours argent depuis le dashboard'),
          updatedBy: adminUser?.nom || 'Super-Admin'
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        triggerNotif(lang === 'ar' ? `تم تحديث سعر الفضة 1000 بنجاح: ${valSilver} د.م/غ` : `Cours de l'argent 1000 mis à jour : ${valSilver} MAD/g`);
        setSilverPriceInput(String(valSilver));
        fetchData();
      } else {
        triggerNotif(data.error || 'Erreur lors de la mise à jour');
      }
    } catch (err) {
      console.error(err);
      triggerNotif('Erreur de communication avec le serveur.');
    } finally {
      setIsUpdatingGold(false);
    }
  };

  const handleUpdateGoldRateOnly = async (customVal) => {
    const valGold = parseFloat(customVal !== undefined && customVal !== null ? customVal : goldPriceInput);
    if (!valGold || isNaN(valGold) || valGold <= 0) {
      triggerNotif(lang === 'ar' ? 'يرجى إدخال سعر صحيح لغرام الذهب عيار 18 (مثال: 1045)' : 'Veuillez saisir un prix valide pour l\'Or 18K (ex: 1045)');
      return;
    }

    setIsUpdatingGold(true);
    try {
      const res = await authFetch(`${API_URL}/admin/gold-rates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          price18k: valGold,
          source: goldSourceInput.trim() || (lang === 'ar' ? 'السعر الرسمي المحدد - المغرب' : 'Fixation Officielle Maroc'),
          note: goldNoteInput.trim() || (lang === 'ar' ? 'تعديل سعر الذهب من لوحة التحكم' : 'Mise à jour or 18K depuis le dashboard'),
          updatedBy: adminUser?.nom || 'Super-Admin'
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        triggerNotif(lang === 'ar' ? `تم تحديث سعر الذهب 18K بنجاح: ${valGold} د.م/غ` : `Cours de l'or 18K mis à jour : ${valGold} MAD/g`);
        setGoldPriceInput(String(valGold));
        fetchData();
      } else {
        triggerNotif(data.error || 'Erreur lors de la mise à jour');
      }
    } catch (err) {
      console.error(err);
      triggerNotif('Erreur de communication avec le serveur.');
    } finally {
      setIsUpdatingGold(false);
    }
  };

  const handleUpdateGoldRate = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    const val = parseFloat(goldPriceInput);
    const valSilver = parseFloat(silverPriceInput);
    const hasGold = val && !isNaN(val) && val > 0;
    const hasSilver = valSilver && !isNaN(valSilver) && valSilver > 0;

    if (!hasGold && !hasSilver) {
      triggerNotif(lang === 'ar' ? 'يرجى إدخال سعر صحيح للذهب أو الفضة' : 'Veuillez saisir au moins un prix valide pour l\'Or 18K ou l\'Argent 1000');
      return;
    }

    setIsUpdatingGold(true);
    try {
      const payload = {
        source: goldSourceInput.trim() || (lang === 'ar' ? 'السعر الرسمي المحدد - المغرب' : 'Fixation Officielle Maroc'),
        note: goldNoteInput.trim() || (lang === 'ar' ? 'تحديث دوري معتمد' : 'Mise à jour régulière'),
        updatedBy: adminUser?.nom || 'Super-Admin'
      };
      if (hasGold) payload.price18k = val;
      if (hasSilver) payload.priceSilver = valSilver;

      const res = await authFetch(`${API_URL}/admin/gold-rates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (res.ok && data.success) {
        triggerNotif(lang === 'ar' ? 'تم تحديث أسعار الذهب والفضة بنجاح !' : 'Cours des métaux précieux mis à jour avec succès !');
        setGoldSourceInput('');
        setGoldNoteInput('');
        fetchData();
      } else {
        triggerNotif(data.error || 'Erreur lors de la mise à jour');
      }
    } catch (err) {
      console.error(err);
      triggerNotif('Erreur de communication avec le serveur.');
    } finally {
      setIsUpdatingGold(false);
    }
  };

  const handleSyncRailwayGold = async () => {
    setIsUpdatingGold(true);
    try {
      const res = await authFetch(`${API_URL}/admin/gold-rates/sync`, {
        method: 'POST'
      });
      const data = await res.json();
      if (res.ok && data.success) {
        triggerNotif(lang === 'ar' ? 'تمت المزامنة بنجاح مع PrixOr (Railway) !' : data.message || 'Synchronisation réussie avec Railway !');
        fetchData();
      } else {
        triggerNotif(data.error || 'Erreur lors de la synchronisation.');
      }
    } catch (err) {
      console.error(err);
      triggerNotif('Erreur de communication avec le serveur.');
    } finally {
      setIsUpdatingGold(false);
    }
  };

  const handleDeleteGoldHistory = async (id) => {
    if (!window.confirm(lang === 'ar' ? 'هل أنت متأكد من حذف هذا السجل ؟' : 'Supprimer cette entrée d\'historique ?')) return;
    try {
      const res = await authFetch(`${API_URL}/admin/gold-rates/history/${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        triggerNotif(lang === 'ar' ? 'تم حذف السجل بنجاح' : 'Entrée supprimée de l\'historique.');
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchData(false);
    // Poll every 15 seconds for live dynamic listings when tab is visible
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        fetchData(true);
      }
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleApprove = async (productId) => {
    try {
      const res = await fetch(`${API_URL}/bijoux/${productId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'Validated' })
      });
      if (res.ok) {
        triggerNotif('Produit approuvé avec succès !');
        fetchData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleRejectSubmit = async (e) => {
    e.preventDefault();
    if (!selectedProductForRejection || !rejectionReason.trim()) return;

    try {
      const res = await fetch(`${API_URL}/bijoux/${selectedProductForRejection.id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'Rejected',
          rejectionReason
        })
      });
      if (res.ok) {
        triggerNotif('Produit refusé.');
        setSelectedProductForRejection(null);
        setRejectionReason('');
        fetchData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleCancelAuction = async (auctionId) => {
    if (!window.confirm('Voulez-vous vraiment annuler cette enchère ?')) return;

    try {
      const res = await fetch(`${API_URL}/encheres/${auctionId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        triggerNotif('Enchère annulée avec succès !');
        fetchData();
      } else {
        const errorData = await res.json();
        triggerNotif(errorData.message || 'Une erreur est survenue.');
      }
    } catch (err) {
      console.error(err);
      triggerNotif("Erreur lors de l'annulation.");
    }
  };

  const handleResolveAuction = async (auctionId) => {
    if (!window.confirm('Voulez-vous vraiment clôturer cette enchère et désigner le gagnant ?')) return;

    try {
      const res = await fetch(`${API_URL}/encheres/${auctionId}/resolve`, {
        method: 'POST'
      });
      if (res.ok) {
        const result = await res.json();
        triggerNotif(result.message || 'Enchère résolue !');
        fetchData();
      } else {
        const errorData = await res.json();
        triggerNotif(errorData.message || 'Une erreur est survenue.');
      }
    } catch (err) {
      console.error(err);
      triggerNotif('Erreur lors de la résolution.');
    }
  };

  const handleViewBids = async (auction) => {
    setSelectedAuctionForBids(auction);
    try {
      const res = await fetch(`${API_URL}/encheres/${auction.id}/bids`);
      if (res.ok) {
        const bidsData = await res.json();
        setAuctionBids(bidsData);
        setShowBidsModal(true);
      } else {
        triggerNotif('Erreur lors du chargement des offres.');
      }
    } catch (err) {
      console.error(err);
      triggerNotif('Erreur lors du chargement des offres.');
    }
  };

  const handleDeleteBid = async (bidId) => {
    if (!window.confirm("Voulez-vous vraiment supprimer cette offre d'enchère ?")) return;

    try {
      const res = await fetch(`${API_URL}/offresEncheres/${bidId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        triggerNotif('Offre supprimée avec succès !');
        if (selectedAuctionForBids) {
          const bidsRes = await fetch(`${API_URL}/encheres/${selectedAuctionForBids.id}/bids`);
          if (bidsRes.ok) {
            const bidsData = await bidsRes.json();
            setAuctionBids(bidsData);
          }
        }
        fetchData();
      } else {
        const errorData = await res.json();
        triggerNotif(errorData.message || 'Une erreur est survenue.');
      }
    } catch (err) {
      console.error(err);
      triggerNotif('Erreur lors de la suppression de la mise.');
    }
  };

  const handleSaveCommissionConfig = async (e, customConfig) => {
    if (e && e.preventDefault) e.preventDefault();
    const configToSave = customConfig || commissionConfig;
    try {
      const res = await authFetch(`${API_URL}/config`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(configToSave)
      });
      if (res && res.ok) {
        const savedData = await res.json().catch(() => null);
        if (savedData) {
          setCommissionConfig({
            ...savedData,
            product_suggestions: {
              ...DEFAULT_SUGGESTIONS,
              ...(savedData.product_suggestions || {})
            }
          });
        }
        triggerNotif(lang === 'ar' ? 'تم حفظ التعديلات والاقتراحات بنجاح!' : 'Modifications et suggestions enregistrées avec succès !');
      } else {
        triggerNotif(t('notifServerError'));
      }
    } catch (e) {
      console.error(e);
      triggerNotif(t('notifServerError'));
    }
  };

  const handleAddSuggestion = (type, value) => {
    if (!value || !value.toString().trim()) return;
    const currentSug = commissionConfig.product_suggestions || DEFAULT_SUGGESTIONS;
    const currentList = Array.isArray(currentSug[type]) ? currentSug[type] : (DEFAULT_SUGGESTIONS[type] || []);
    const cleanVal = type === 'prix_gramme' ? Number(value) : value.toString().trim();
    if (currentList.includes(cleanVal)) {
      triggerNotif(lang === 'ar' ? 'هذا الاقتراح موجود مسبقاً.' : 'Cette suggestion existe déjà.');
      return;
    }
    const updated = {
      ...commissionConfig,
      product_suggestions: {
        ...currentSug,
        [type]: [...currentList, cleanVal]
      }
    };
    setCommissionConfig(updated);
    if (type === 'titre_ar') setNewSugTitleAr('');
    if (type === 'titre_fr') setNewSugTitleFr('');
    if (type === 'description_ar') setNewSugDescAr('');
    if (type === 'description_fr') setNewSugDescFr('');
    if (type === 'prix_gramme') setNewSugPrixGramme('');
    triggerNotif(lang === 'ar' ? 'تمت إضافة الاقتراح. لا تنس حفظ التغييرات!' : 'Suggestion ajoutée. N\'oubliez pas d\'enregistrer !');
  };

  const handleRemoveSuggestion = (type, index) => {
    const currentSug = commissionConfig.product_suggestions || DEFAULT_SUGGESTIONS;
    const currentList = Array.isArray(currentSug[type]) ? currentSug[type] : (DEFAULT_SUGGESTIONS[type] || []);
    const updatedList = currentList.filter((_, i) => i !== index);
    const updated = {
      ...commissionConfig,
      product_suggestions: {
        ...currentSug,
        [type]: updatedList
      }
    };
    setCommissionConfig(updated);
  };

  const handleResetSuggestions = () => {
    if (!window.confirm(lang === 'ar' ? 'هل أنت متأكد من استعادة الاقتراحات الافتراضية؟' : 'Voulez-vous restaurer les suggestions par défaut ?')) return;
    const updated = {
      ...commissionConfig,
      product_suggestions: DEFAULT_SUGGESTIONS
    };
    setCommissionConfig(updated);
    triggerNotif(lang === 'ar' ? 'تمت استعادة الاقتراحات الافتراضية.' : 'Suggestions par défaut restaurées.');
  };

  const handleAddCategory = async (e) => {
    e.preventDefault();
    const finalNomAr = (newCat.nom_ar || '').trim();
    const finalNomFr = (newCat.nom_fr || '').trim();
    const finalNomEn = (newCat.nom_en || '').trim() || finalNomFr || finalNomAr;

    if (!finalNomAr && !finalNomFr) {
      triggerNotif(lang === 'ar' ? 'يرجى كتابة اسم الفئة بالعربية أو الفرنسية.' : 'Veuillez renseigner le nom de la catégorie.');
      return;
    }

    const payload = {
      nom_ar: finalNomAr || finalNomFr,
      nom_fr: finalNomFr || finalNomAr,
      nom_en: finalNomEn
    };

    try {
      const res = await fetch(`${API_URL}/categories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        setNewCat({ nom_fr: '', nom_ar: '', nom_en: '' });
        triggerNotif(lang === 'ar' ? 'تمت إضافة الفئة بنجاح.' : 'Catégorie ajoutée avec succès.');
        fetchData();
      } else {
        triggerNotif(lang === 'ar' ? 'حدث خطأ أثناء إضافة الفئة.' : 'Erreur lors de l\'ajout de la catégorie.');
      }
    } catch (e) {
      console.error(e);
      triggerNotif(lang === 'ar' ? 'حدث خطأ في الاتصال.' : 'Erreur de connexion.');
    }
  };

  const handleOpenEditCategory = (cat) => {
    setEditingCategory({
      id: cat.id,
      nom_fr: cat.nom_fr || '',
      nom_ar: cat.nom_ar || '',
      nom_en: cat.nom_en || '',
      icon: cat.icon || '💎'
    });
  };

  const handleSaveCategory = async (e) => {
    e.preventDefault();
    if (!editingCategory) return;
    try {
      const res = await fetch(`${API_URL}/categories/${editingCategory.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingCategory)
      });
      if (res.ok) {
        setEditingCategory(null);
        triggerNotif('Catégorie mise à jour avec succès en 3 langues !');
        fetchData();
      }
    } catch (e) {
      console.error(e);
      triggerNotif('Erreur lors de la mise à jour de la catégorie.');
    }
  };

  const handleDeleteCategory = async (catId) => {
    if (!window.confirm('Voulez-vous vraiment supprimer cette catégorie ?')) return;
    try {
      const res = await fetch(`${API_URL}/categories/${catId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        triggerNotif('Catégorie supprimée.');
        fetchData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdateCategoryCommission = (catId, value) => {
    const updated = { ...(commissionConfig.commission_categories || {}) };
    if (value === '' || value === null || isNaN(value)) {
      delete updated[catId];
    } else {
      updated[catId] = parseFloat(value);
    }
    setCommissionConfig({
      ...commissionConfig,
      commission_categories: updated
    });
  };

  const handleUpdateMerchantCommission = (merchId, value) => {
    const updated = { ...(commissionConfig.commission_commercants || {}) };
    if (value === '' || value === null || isNaN(value)) {
      delete updated[merchId];
    } else {
      updated[merchId] = parseFloat(value);
    }
    setCommissionConfig({
      ...commissionConfig,
      commission_commercants: updated
    });
  };

  if (!adminUser) return null;

  return (
    <div className="admin-container">
      {/* Mobile Top Bar for Android & iPhone */}
      <div className="mobile-top-bar">
        <button 
          type="button" 
          className="mobile-menu-btn"
          onClick={() => setMobileMenuOpen(true)}
          aria-label="Menu"
        >
          ☰
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <OriaLogo size={24} showText={false} />
          <span style={{ fontFamily: 'Playfair Display', fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-white)' }}>
            HRSDGDG
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            type="button"
            onClick={() => setThemeMode(prev => prev === 'light' ? 'dark' : 'light')}
            className="mobile-menu-btn"
            style={{ width: '36px', height: '36px', fontSize: '0.95rem' }}
          >
            {themeMode === 'light' ? '🌙' : '☀️'}
          </button>
          <select 
            className="lang-select" 
            style={{ padding: '6px 8px', fontSize: '0.78rem' }}
            value={lang} 
            onChange={(e) => setLang(e.target.value)}
          >
            <option value="ar">🇲🇦</option>
            <option value="fr">🇫🇷</option>
          </select>
        </div>
      </div>

      {/* Backdrop overlay for mobile drawer */}
      <div 
        className={`sidebar-overlay ${mobileMenuOpen ? 'active' : ''}`}
        onClick={() => setMobileMenuOpen(false)}
      />

      {/* Sidebar Navigation (Drawer on Mobile, Fixed on Desktop) */}
      <aside className={`sidebar ${mobileMenuOpen ? 'mobile-open' : ''}`}>
        <button 
          type="button" 
          className="sidebar-close-btn"
          onClick={() => setMobileMenuOpen(false)}
          aria-label="Fermer"
        >
          ✕
        </button>

        <div className="logo-container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', padding: '15px 10px', borderBottom: '1px solid var(--border-gold)', marginBottom: '20px' }}>
          <OriaLogo size={36} subtitle={isMerchant ? (lang === 'ar' ? 'فضاء التاجر والصائغ' : 'ESPACE MARCHAND') : 'ADMINISTRATION'} />
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
            <div style={{ fontSize: '0.78rem', color: isMerchant ? 'var(--admin-gold)' : 'var(--text-gray)', background: isMerchant ? 'rgba(212, 175, 55, 0.15)' : 'rgba(212, 175, 55, 0.08)', padding: '3px 10px', borderRadius: '12px', border: '1px solid rgba(212, 175, 55, 0.2)', fontWeight: isMerchant ? 700 : 500 }}>
              {isMerchant ? `🏪 ${adminUser?.shopName || adminUser?.nom || 'Commerçant'}` : `Super-Admin • ${adminUser?.nom || 'Admin'}`}
            </div>
            <button
              type="button"
              onClick={logout}
              title={t('logout')}
              style={{
                background: 'rgba(231, 76, 60, 0.1)',
                border: '1px solid rgba(231, 76, 60, 0.3)',
                color: '#ff6b6b',
                borderRadius: '8px',
                padding: '4px 8px',
                cursor: 'pointer',
                fontSize: '0.8rem',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                transition: 'all 0.2s'
              }}
            >
              🚪
            </button>
          </div>
        </div>

        <nav>
          <ul className="nav-list">
            {!isMerchant && (
              <>
                <li>
                  <span className={`nav-link ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => { setActiveTab('dashboard'); setMobileMenuOpen(false); }}>
                    📊 {t('dashboard')}
                  </span>
                </li>
                <li>
                  <span className={`nav-link ${activeTab === 'validation' ? 'active' : ''}`} onClick={() => { setActiveTab('validation'); setMobileMenuOpen(false); }}>
                    ⚖️ {t('validationQueue')} ({pendingProducts.length})
                  </span>
                </li>
              </>
            )}

            <li>
              <span className={`nav-link ${activeTab === 'products' ? 'active' : ''}`} onClick={() => { setActiveTab('products'); setMobileMenuOpen(false); }}>
                💎 {isMerchant ? (lang === 'ar' ? 'مجوهراتي ومقالاتي' : 'Mes Bijoux & Articles') : t('products')} ({products.length})
              </span>
            </li>

            {!isMerchant && (
              <>
                <li>
                  <span className={`nav-link ${activeTab === 'commissions' ? 'active' : ''}`} onClick={() => { setActiveTab('commissions'); setMobileMenuOpen(false); }}>
                    💰 {t('commissions')}
                  </span>
                </li>
                <li>
                  <span className={`nav-link ${activeTab === 'categories' ? 'active' : ''}`} onClick={() => { setActiveTab('categories'); setMobileMenuOpen(false); }}>
                    🗂️ {t('categories')}
                  </span>
                </li>
                <li>
                  <span className={`nav-link ${activeTab === 'suggestions' ? 'active' : ''}`} onClick={() => { setActiveTab('suggestions'); setMobileMenuOpen(false); }}>
                    ⚡ {lang === 'ar' ? 'إدارة الاقتراحات' : 'Gestion des Suggestions'}
                  </span>
                </li>
              </>
            )}

            {hasPermission('manage_gold_rates') && (
              <li>
                <span className={`nav-link ${activeTab === 'gold_rates' ? 'active' : ''}`} onClick={() => { setActiveTab('gold_rates'); setMobileMenuOpen(false); }}>
                  🥇 {t('goldRates')}
                </span>
              </li>
            )}
            <li>
              <span className={`nav-link ${activeTab === 'sales_history' ? 'active' : ''}`} onClick={() => { setActiveTab('sales_history'); setMobileMenuOpen(false); }}>
                📜 {isMerchant ? (lang === 'ar' ? 'سجل مبيعاتي' : 'Mes Ventes & Commandes') : (lang === 'ar' ? 'سجل المبيعات' : 'Historique des Ventes')} ({salesHistory.length})
              </span>
            </li>

            {!isMerchant && (
              <>
                <li>
                  <span className={`nav-link ${activeTab === 'users' ? 'active' : ''}`} onClick={() => { setActiveTab('users'); setMobileMenuOpen(false); }}>
                    👥 {t('users')}
                  </span>
                </li>
                <li>
                  <span className={`nav-link ${activeTab === 'auctions' ? 'active' : ''}`} onClick={() => { setActiveTab('auctions'); setMobileMenuOpen(false); }}>
                    🔨 {t('auctions')} ({auctions.length})
                  </span>
                </li>
                <li>
                  <span className={`nav-link ${activeTab === 'subscriptions' ? 'active' : ''}`} onClick={() => { setActiveTab('subscriptions'); setMobileMenuOpen(false); }}>
                    🌟 {t('subscriptions')} ({subscriptionsData?.merchants?.length || 0})
                  </span>
                </li>
                <li>
                  <span className={`nav-link ${activeTab === 'roles' ? 'active' : ''}`} onClick={() => { setActiveTab('roles'); setMobileMenuOpen(false); }}>
                    🛡️ {t('roles')}
                  </span>
                </li>
                {hasPermission('manage_terms') && (
                  <li>
                    <span className={`nav-link ${activeTab === 'terms' ? 'active' : ''}`} onClick={() => { setActiveTab('terms'); setMobileMenuOpen(false); }}>
                      ⚖️ {t('termsAndConditions')}
                    </span>
                  </li>
                )}
              </>
            )}

            <li style={{ marginTop: '25px', borderTop: '1px solid rgba(255, 255, 255, 0.06)', paddingTop: '12px' }}>
              <span className="nav-link" onClick={logout} style={{ color: '#ff6b6b', cursor: 'pointer' }}>
                🚪 {t('logout')}
              </span>
            </li>
          </ul>
        </nav>
      </aside>

      {/* Main Admin View Content */}
      <main className="main-content">
        {/* Header */}
        <header className="admin-header">
          <h1>{
            isMerchant ? (
              activeTab === 'sales_history' ? (lang === 'ar' ? '📜 سجل مبيعاتي والطلبات' : '📜 Mes Ventes & Commandes') :
              activeTab === 'gold_rates' ? (lang === 'ar' ? '🥇 أسعار الذهب والفضة الحية' : "🥇 Cours de l'Or & Argent") :
              (lang === 'ar' ? '💎 إدارة ونشر مجوهراتي ومقالاتي' : '💎 Gestion & Publication de Mes Bijoux')
            ) : (
              activeTab === 'sales_history' ? (lang === 'ar' ? '📜 سجل المبيعات والصفقات المكتملة' : '📜 Historique Général des Ventes') :
              activeTab === 'subscriptions' ? t('subscriptionsTitle') : 
              activeTab === 'terms' ? (lang === 'ar' ? '⚖️ إدارة شروط وأحكام الاستخدام' : "⚖️ Termes & Conditions d'Utilisation") :
              activeTab === 'suggestions' ? (lang === 'ar' ? '⚡ إدارة اقتراحات المنتجات وسعر الغرام' : '⚡ Gestion des Suggestions de Titres & Prix') :
              t(activeTab === 'validation' ? 'validationQueue' : (activeTab === 'commissions' ? 'commissions' : (activeTab === 'categories' ? 'categories' : (activeTab === 'users' ? 'userManagement' : (activeTab === 'auctions' ? 'auctionManagement' : (activeTab === 'products' ? 'productManagement' : (activeTab === 'roles' ? 'roles' : 'dashboard')))))))
            )
          }</h1>
          
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            {/* Light / Dark Mode Toggle */}
            <button
              type="button"
              onClick={() => setThemeMode(prev => prev === 'light' ? 'dark' : 'light')}
              className="theme-mode-btn"
              title={themeMode === 'light' ? (lang === 'ar' ? 'تفعيل الوضع الليلي' : 'Passer en Mode Nuit') : (lang === 'ar' ? 'تفعيل الوضع النهاري' : 'Passer en Fond Clair')}
            >
              <span>{themeMode === 'light' ? '🌙' : '☀️'}</span>
              <span>{themeMode === 'light' ? (lang === 'ar' ? 'الوضع الليلي' : 'Mode Nuit') : (lang === 'ar' ? 'الوضع النهاري' : 'Fond Clair')}</span>
            </button>

            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <span style={{ color: 'var(--text-gray)', fontSize: '0.85rem' }}>{t('themeColor')}</span>
              <button type="button" onClick={() => setSelectedTheme('gold')} style={{ width: '16px', height: '16px', borderRadius: '50%', border: selectedTheme === 'gold' ? '2px solid white' : '1px solid rgba(255,255,255,0.2)', backgroundColor: '#d4af37', cursor: 'pointer', padding: 0 }} title="Or Royal"></button>
              <button type="button" onClick={() => setSelectedTheme('rosegold')} style={{ width: '16px', height: '16px', borderRadius: '50%', border: selectedTheme === 'rosegold' ? '2px solid white' : '1px solid rgba(255,255,255,0.2)', backgroundColor: '#b76e79', cursor: 'pointer', padding: 0 }} title="Or Rose"></button>
              <button type="button" onClick={() => setSelectedTheme('emerald')} style={{ width: '16px', height: '16px', borderRadius: '50%', border: selectedTheme === 'emerald' ? '2px solid white' : '1px solid rgba(255,255,255,0.2)', backgroundColor: '#2ecc71', cursor: 'pointer', padding: 0 }} title="Émeraude"></button>
              <button type="button" onClick={() => setSelectedTheme('ruby')} style={{ width: '16px', height: '16px', borderRadius: '50%', border: selectedTheme === 'ruby' ? '2px solid white' : '1px solid rgba(255,255,255,0.2)', backgroundColor: '#e74c3c', cursor: 'pointer', padding: 0 }} title="Rubis"></button>
              <button type="button" onClick={() => setSelectedTheme('sapphire')} style={{ width: '16px', height: '16px', borderRadius: '50%', border: selectedTheme === 'sapphire' ? '2px solid white' : '1px solid rgba(255,255,255,0.2)', backgroundColor: '#3498db', cursor: 'pointer', padding: 0 }} title="Saphir"></button>
            </div>

            <select 
              className="lang-select" 
              value={lang} 
              onChange={(e) => setLang(e.target.value)}
            >
              <option value="ar">العربية 🇲🇦</option>
              <option value="fr">Français 🇫🇷</option>
            </select>
          </div>
        </header>

        {/* Notifications Alert Banner */}
        {notif && (
          <div style={{ backgroundColor: 'var(--admin-gold)', color: '#0c0f12', padding: '12px 20px', borderRadius: '4px', marginBottom: '20px', fontWeight: 'bold' }}>
            🔔 {notif}
          </div>
        )}

        {/* Tab content view router */}
        {activeTab === 'dashboard' && (
          <div>
            {/* Precious Metals Direct Configuration & Live Tracking (Gold 18K & Silver 1000) */}
            {hasPermission('manage_gold_rates') && (
              <div style={{
                background: 'linear-gradient(145deg, #181b26 0%, #11131a 100%)',
              border: '1.5px solid rgba(212, 175, 55, 0.35)',
              borderRadius: '16px',
              padding: '22px 24px',
              marginBottom: '28px',
              boxShadow: '0 12px 30px rgba(0, 0, 0, 0.45), 0 0 25px rgba(212, 175, 55, 0.08)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px', marginBottom: '18px', paddingBottom: '14px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
                <div>
                  <h3 style={{ margin: '0 0 4px 0', fontSize: '1.25rem', fontFamily: 'Playfair Display, serif', color: 'var(--admin-gold)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>⚖️</span>
                    <span>{lang === 'ar' ? 'الأسعار الرسمية للمعادن النفيسة والضبط المباشر' : 'Cours Officiel des Métaux Précieux & Paramétrage Direct'}</span>
                  </h3>
                  <p style={{ margin: 0, fontSize: '0.84rem', color: 'var(--text-gray)' }}>
                    {lang === 'ar' ? 'متابعة وضبط فوري لأسعار الذهب والفضة المعروضة في المنصة للعملاء والزبائن' : 'Suivi et configuration instantanée des cotations affichées aux clients'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('gold_rates')}
                  style={{
                    background: 'rgba(212, 175, 55, 0.12)',
                    border: '1px solid var(--admin-gold)',
                    color: 'var(--admin-gold)',
                    borderRadius: '8px',
                    padding: '8px 14px',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <span>{lang === 'ar' ? 'عرض السجل الكامل والتفاصيل' : 'Gérer l\'historique complet'}</span>
                  <span>➔</span>
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '18px' }}>
                {/* Gold 18K Card on Dashboard */}
                <div style={{
                  background: 'linear-gradient(145deg, rgba(38, 30, 14, 0.6) 0%, rgba(18, 20, 27, 0.85) 100%)',
                  border: '1px solid rgba(245, 176, 39, 0.35)',
                  borderRadius: '12px',
                  padding: '16px 20px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '14px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '1.2rem' }}>🏆</span>
                      <strong style={{ color: 'var(--admin-gold)', fontSize: '0.92rem' }}>
                        {lang === 'ar' ? 'ذهب 18 قيراط (750‰)' : 'Or 18 Karats (750‰)'}
                      </strong>
                    </div>
                    <span style={{
                      background: 'rgba(16, 185, 129, 0.15)',
                      color: '#10b981',
                      border: '1px solid rgba(16, 185, 129, 0.3)',
                      borderRadius: '12px',
                      padding: '2px 8px',
                      fontSize: '0.72rem',
                      fontWeight: 800
                    }}>
                      ● {lang === 'ar' ? 'المعيار الرسمي' : 'Standard Officiel'}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                    <span style={{ fontSize: '2.4rem', fontWeight: 900, color: '#f6b22b', lineHeight: 1 }}>
                      {goldRatesData.currentPrice18k || 1045}
                    </span>
                    <span style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-gray)' }}>
                      MAD / g
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px', paddingTop: '8px', borderTop: '1px solid rgba(255, 255, 255, 0.06)' }}>
                    <span style={{ fontSize: '0.76rem', color: 'var(--text-gray)' }}>
                      {lang === 'ar' ? 'تحديث تلقائي عبر البورصة' : 'Mise à jour via PrixOr'}
                    </span>
                    <button
                      type="button"
                      onClick={handleSyncRailwayGold}
                      disabled={isUpdatingGold}
                      style={{
                        background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.25), rgba(212, 175, 55, 0.1))',
                        border: '1px solid var(--admin-gold)',
                        color: 'var(--admin-gold)',
                        borderRadius: '6px',
                        padding: '5px 10px',
                        fontSize: '0.76rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px'
                      }}
                    >
                      <span>{isUpdatingGold ? '⏳' : '🔄'}</span>
                      <span>{lang === 'ar' ? 'مزامنة سريعة' : 'Synchroniser'}</span>
                    </button>
                  </div>
                </div>

                {/* Silver 1000 Card on Dashboard - FULLY CONFIGURABLE */}
                <div style={{
                  background: 'linear-gradient(145deg, rgba(28, 34, 48, 0.6) 0%, rgba(16, 18, 25, 0.85) 100%)',
                  border: '1px solid rgba(203, 213, 225, 0.35)',
                  borderRadius: '12px',
                  padding: '16px 20px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '14px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <SilverIcon size={18} />
                      <strong style={{ color: '#e2e8f0', fontSize: '0.92rem' }}>
                        {lang === 'ar' ? 'فضة 1000 نقية (Ag 1000)' : 'Argent Pur 1000‰ (Ag 1000)'}
                      </strong>
                    </div>
                    <span style={{
                      background: 'rgba(203, 213, 225, 0.15)',
                      color: '#cbd5e1',
                      border: '1px solid rgba(203, 213, 225, 0.3)',
                      borderRadius: '12px',
                      padding: '2px 8px',
                      fontSize: '0.72rem',
                      fontWeight: 800
                    }}>
                      🛡️ {lang === 'ar' ? 'قابل للضبط' : 'Paramétrable'}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                    <span style={{ fontSize: '2.4rem', fontWeight: 900, color: '#f8fafc', lineHeight: 1 }}>
                      {typeof goldRatesData.currentPriceSilver === 'number' ? goldRatesData.currentPriceSilver.toFixed(2) : (goldRatesData.currentPriceSilver || '14.50')}
                    </span>
                    <span style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-gray)' }}>
                      MAD / g
                    </span>
                  </div>

                  {/* Inline Parameterization Input & Buttons */}
                  <div style={{ paddingTop: '8px', borderTop: '1px solid rgba(255, 255, 255, 0.06)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                      <input
                        type="number"
                        step="0.1"
                        min="1"
                        max="1000"
                        value={silverPriceInput}
                        onChange={(e) => setSilverPriceInput(e.target.value)}
                        placeholder="14.50"
                        style={{
                          width: '105px',
                          padding: '6px 10px',
                          background: 'rgba(0,0,0,0.3)',
                          border: '1px solid #cbd5e1',
                          borderRadius: '6px',
                          color: '#f8fafc',
                          fontSize: '1rem',
                          fontWeight: 800
                        }}
                      />
                      {/* Step Increment Quick Buttons */}
                      <div style={{ display: 'flex', gap: '4px' }}>
                        {['-0.5', '+0.5', '+1'].map(step => (
                          <button
                            key={step}
                            type="button"
                            onClick={() => {
                              const curr = parseFloat(silverPriceInput) || 14.50;
                              const delta = parseFloat(step);
                              const next = Math.max(1, +(curr + delta).toFixed(2));
                              setSilverPriceInput(String(next));
                            }}
                            style={{
                              background: 'rgba(255, 255, 255, 0.08)',
                              border: '1px solid rgba(255, 255, 255, 0.15)',
                              color: '#cbd5e1',
                              borderRadius: '4px',
                              padding: '5px 7px',
                              fontSize: '0.72rem',
                              fontWeight: 700,
                              cursor: 'pointer'
                            }}
                          >
                            {step}
                          </button>
                        ))}
                      </div>
                      <button
                        type="button"
                        disabled={isUpdatingGold}
                        onClick={() => handleUpdateSilverRateOnly()}
                        style={{
                          flex: 1,
                          background: 'linear-gradient(135deg, #e2e8f0 0%, #94a3b8 100%)',
                          color: '#0f172a',
                          border: 'none',
                          borderRadius: '6px',
                          padding: '7px 12px',
                          fontSize: '0.8rem',
                          fontWeight: 800,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        <span>💾</span>
                        <span>{isUpdatingGold ? '...' : (lang === 'ar' ? 'حفظ السعر' : 'Enregistrer')}</span>
                      </button>
                    </div>

                    {/* Quick Presets */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                        {lang === 'ar' ? 'خيارات سريعة :' : 'Préréglages :'}
                      </span>
                      {['13.50', '14.00', '14.50', '15.00', '15.50'].map(preset => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => {
                            setSilverPriceInput(preset);
                            handleUpdateSilverRateOnly(preset);
                          }}
                          style={{
                            background: silverPriceInput === preset ? 'rgba(203, 213, 225, 0.25)' : 'transparent',
                            border: '1px solid rgba(203, 213, 225, 0.3)',
                            color: '#cbd5e1',
                            borderRadius: '4px',
                            padding: '2px 6px',
                            fontSize: '0.7rem',
                            fontWeight: 600,
                            cursor: 'pointer'
                          }}
                        >
                          {preset} MAD
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

            {/* Global Metrics Row */}
            <div className="stats-row">
              <div className="stat-card">
                <span className="stat-title">{t('salesVolume')}</span>
                <span className="stat-num">{stats.totalSales} MAD</span>
              </div>
              <div className="stat-card" style={{ borderColor: 'rgba(212,175,55,0.4)' }}>
                <span className="stat-title">{t('platformRevenues')}</span>
                <span className="stat-num">{stats.totalCommissions} MAD</span>
              </div>
              <div className="stat-card">
                <span className="stat-title">{t('activeMerchants')}</span>
                <span className="stat-num">{stats.totalMerchants}</span>
              </div>
              <div className="stat-card">
                <span className="stat-title">{t('activeClients')}</span>
                <span className="stat-num">{stats.totalClients}</span>
              </div>
            </div>

            {/* Merchant performance breakdown table */}
            <h2 style={{ fontFamily: 'Playfair Display', marginBottom: '20px' }}>{t('merchantsBreakdownTitle')}</h2>
            <div className="table-container">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>{t('shop')}</th>
                    <th>{t('salesAmount')}</th>
                    <th>{t('commissionsGenerated')}</th>
                    <th>{t('itemsSold')}</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.merchantsBreakdown.map(m => (
                    <tr key={m.id}>
                      <td style={{ fontWeight: 'bold' }}>{m.shopName}</td>
                      <td style={{ color: 'var(--admin-gold)', fontWeight: '600' }}>{m.sales} MAD</td>
                      <td style={{ color: 'var(--admin-gold)' }}>{m.commission} MAD</td>
                      <td>{m.itemsCount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'validation' && (
          <div>
            {pendingProducts.length === 0 ? (
              <p style={{ color: 'var(--text-gray)', textAlign: 'center', padding: '40px' }}>{t('noPending')}</p>
            ) : (
              <div className="pending-grid">
                {pendingProducts.map(p => (
                  <div key={p.id} className="pending-card">
                    {p.images && p.images[0] ? (
                      <img src={p.images[0]} alt={p.titre} />
                    ) : (
                      <div style={{ width: '100%', height: '200px', backgroundColor: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-gray)' }}>
                        Aucune image
                      </div>
                    )}
                    <div className="pending-info">
                      <div style={{ color: 'var(--admin-gold)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '5px' }}>
                        {categories.find(c => c.id === p.category_id)?.nom_fr}
                      </div>
                      <h4 style={{ fontSize: '1.2rem', marginBottom: '10px' }}>{p.titre}</h4>
                      <p style={{ color: 'var(--text-gray)', fontSize: '0.85rem', marginBottom: '15px', height: '60px', overflowY: 'auto' }}>
                        {p.description}
                      </p>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '0.8rem', marginBottom: '15px', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '10px' }}>
                        <div><strong>{t('purity')}:</strong> {p.purete}</div>
                        <div><strong>{t('weight')}:</strong> {p.gramme}g</div>
                        <div><strong>{t('price')}:</strong> {p.prix} MAD</div>
                        <div><strong>{t('city')}:</strong> {p.city}</div>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-gray)' }}>
                          Vendeur: {users.find(u => u.id === p.commercant_id)?.shopName || 'Commerçant Inconnu'}
                        </span>
                        <div style={{ display: 'flex' }}>
                          <button className="btn-approve" onClick={() => handleApprove(p.id)}>
                            ✓ {t('approve')}
                          </button>
                          <button className="btn-reject" onClick={() => setSelectedProductForRejection(p)}>
                            ✕ {t('reject')}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'commissions' && (
          <form className="commissions-container" onSubmit={handleSaveCommissionConfig}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px', marginBottom: '5px' }}>
              <div>
                <h2 style={{ fontFamily: 'Playfair Display', margin: 0, color: 'var(--text-white)' }}>{t('commissionsTitle')}</h2>
                <p style={{ margin: '6px 0 0', fontSize: '0.88rem', color: 'var(--text-gray)' }}>{t('commissionsSubtitle')}</p>
              </div>
              <button type="submit" className="btn-gold" style={{ padding: '10px 22px' }}>
                <span>💾</span>
                <span>{t('save')}</span>
              </button>
            </div>

            {/* Global Rate Card */}
            <div className="commission-panel-card">
              <div className="commission-panel-header">
                <h3 className="commission-panel-title">
                  <span>🏛️</span>
                  <span>{t('globalCommissionRate')}</span>
                </h3>
              </div>
              <div className="commission-panel-body">
                <p style={{ fontSize: '0.88rem', color: 'var(--text-gray)', marginBottom: '20px', lineHeight: 1.5 }}>
                  {t('globalCommissionDesc')}
                </p>

                <div className="commission-global-box">
                  <div className="commission-rate-display" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <input 
                        type="number"
                        min="1"
                        max="50"
                        step="0.5"
                        className="commission-global-input"
                        value={commissionConfig.commission_globale !== undefined ? commissionConfig.commission_globale : 5}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value);
                          setCommissionConfig({ ...commissionConfig, commission_globale: isNaN(val) ? '' : val });
                        }}
                      />
                      <span style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--dark-gold)' }}>%</span>
                    </div>
                    <span className="commission-rate-unit">{t('defaultRatePlaceholder')}</span>
                  </div>

                  <div className="commission-slider-control">
                    <div dir="ltr" style={{ width: '100%' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--text-gray)', marginBottom: '6px' }}>
                        <span>1%</span>
                        <strong style={{ color: 'var(--dark-gold)', fontSize: '1rem' }}>{commissionConfig.commission_globale || 5}%</strong>
                        <span>30%</span>
                      </div>

                      <input 
                        type="range" 
                        min="1" 
                        max="30" 
                        step="0.5"
                        className="commission-slider"
                        value={commissionConfig.commission_globale || 5}
                        onChange={(e) => setCommissionConfig({ ...commissionConfig, commission_globale: parseFloat(e.target.value) || 5 })}
                      />
                    </div>

                    <div className="commission-presets" style={{ marginTop: '10px' }}>
                      <span style={{ fontSize: '0.82rem', color: 'var(--text-gray)', fontWeight: 600 }}>{t('presetRates')}</span>
                      {[5, 7, 8, 10, 12, 15, 20].map(rate => (
                        <button
                          key={rate}
                          type="button"
                          className={`commission-preset-btn ${Number(commissionConfig.commission_globale) === rate ? 'active' : ''}`}
                          onClick={() => setCommissionConfig({ ...commissionConfig, commission_globale: rate })}
                        >
                          {rate}%
                        </button>
                      ))}
                    </div>
                  </div>

                  <button 
                    type="button" 
                    className="btn-gold" 
                    style={{ padding: '12px 24px', fontSize: '0.9rem', alignSelf: 'center', whiteSpace: 'nowrap' }}
                    onClick={(e) => handleSaveCommissionConfig(e)}
                  >
                    <span>💾</span>
                    <span>{lang === 'ar' ? 'حفظ النسبة العامة' : 'Enregistrer ce taux'}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Category Commissions Card */}
            <div className="commission-panel-card">
              <div className="commission-panel-header">
                <h3 className="commission-panel-title">
                  <span>🏷️</span>
                  <span>{t('categoryCommissions')}</span>
                </h3>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-gray)' }}>
                  {categories.length} {t('categories')}
                </span>
              </div>
              <div className="commission-panel-body">
                <p style={{ fontSize: '0.88rem', color: 'var(--text-gray)', marginBottom: '20px', lineHeight: 1.5 }}>
                  {t('categoryCommissionsDesc')}
                </p>

                <div className="commission-categories-grid">
                  {categories.map(cat => {
                    const hasCustom = commissionConfig.commission_categories && commissionConfig.commission_categories[cat.id] !== undefined;
                    const catVal = hasCustom ? commissionConfig.commission_categories[cat.id] : '';
                    return (
                      <div 
                        key={cat.id} 
                        className="commission-item-row"
                        style={hasCustom ? { borderColor: 'var(--border-gold)', background: 'rgba(179, 135, 40, 0.08)' } : {}}
                      >
                        <div className="commission-item-label">
                          <div>{lang === 'fr' ? cat.nom_fr : (lang === 'ar' ? cat.nom_ar : cat.nom_en)}</div>
                          {hasCustom && (
                            <span style={{ fontSize: '0.72rem', color: 'var(--dark-gold)', fontWeight: 600 }}>
                              ✓ {t('customRate')}
                            </span>
                          )}
                        </div>

                        <div className="commission-input-wrapper">
                          <input 
                            type="number" 
                            min="0"
                            max="50"
                            step="0.5"
                            className="commission-input"
                            value={catVal}
                            placeholder={commissionConfig.commission_globale || 5}
                            onChange={(e) => handleUpdateCategoryCommission(cat.id, e.target.value)}
                          />
                          <span className="commission-input-percent">%</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Merchant Commissions Card */}
            <div className="commission-panel-card">
              <div className="commission-panel-header">
                <h3 className="commission-panel-title">
                  <span>🏪</span>
                  <span>{t('merchantCommissions')}</span>
                </h3>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-gray)' }}>
                  {users.filter(u => u.role === 'commercant').length} {t('activeMerchants')}
                </span>
              </div>
              <div className="commission-panel-body">
                <p style={{ fontSize: '0.88rem', color: 'var(--text-gray)', marginBottom: '20px', lineHeight: 1.5 }}>
                  {t('merchantCommissionsDesc')}
                </p>

                {users.filter(u => u.role === 'commercant').length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-gray)', fontSize: '0.9rem' }}>
                    {t('noMerchantsFound')}
                  </div>
                ) : (
                  <div className="commission-categories-grid">
                    {users.filter(u => u.role === 'commercant').map(m => {
                      const hasCustom = commissionConfig.commission_commercants && commissionConfig.commission_commercants[m.id] !== undefined;
                      const merchVal = hasCustom ? commissionConfig.commission_commercants[m.id] : '';
                      return (
                        <div 
                          key={m.id} 
                          className="commission-item-row"
                          style={hasCustom ? { borderColor: 'var(--border-gold)', background: 'rgba(179, 135, 40, 0.08)' } : {}}
                        >
                          <div className="commission-item-label">
                            <div style={{ fontWeight: 700 }}>{m.shopName || m.nom}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-gray)' }}>
                              {m.email} {m.city ? `• ${m.city}` : ''}
                            </div>
                            {hasCustom && (
                              <span style={{ fontSize: '0.72rem', color: 'var(--dark-gold)', fontWeight: 600 }}>
                                ✓ {t('customRate')}
                              </span>
                            )}
                          </div>

                          <div className="commission-input-wrapper">
                            <input 
                              type="number" 
                              min="0"
                              max="50"
                              step="0.5"
                              className="commission-input"
                              value={merchVal}
                              placeholder={commissionConfig.commission_globale || 5}
                              onChange={(e) => handleUpdateMerchantCommission(m.id, e.target.value)}
                            />
                            <span className="commission-input-percent">%</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Submit Button */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
              <button type="submit" className="btn-gold" style={{ padding: '12px 32px', fontSize: '0.95rem' }}>
                <span>💾</span>
                <span>{t('saveCommissions')}</span>
              </button>
            </div>
          </form>
        )}

        {activeTab === 'categories' && (
          <div>
            {/* Categories Creation Form */}
            <form className="settings-panel" onSubmit={handleAddCategory} style={{ marginBottom: '30px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
                <h3 style={{ color: 'var(--admin-gold)', margin: 0 }}>{t('addNewCategory')}</h3>
                <button 
                  type="button" 
                  onClick={() => handleAutoTranslateCategory(newCat, setNewCat)}
                  className="btn-outline-gold"
                  style={{ fontSize: '0.82rem', padding: '6px 14px' }}
                  title="Traduit automatiquement le nom renseigné vers l'autre langue"
                >
                  {lang === 'ar' ? '✨ ترجمة تلقائية للغة الأخرى' : '✨ Traduire automatiquement'}
                </button>
              </div>
              <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div className="form-group">
                  <label className="form-label">{t('catNameAr')}</label>
                  <input type="text" className="form-input" dir="rtl" value={newCat.nom_ar} onChange={e => setNewCat({ ...newCat, nom_ar: e.target.value })} placeholder="مثال: قلائد" required />
                </div>
                <div className="form-group">
                  <label className="form-label">{t('catNameFr')}</label>
                  <input type="text" className="form-input" value={newCat.nom_fr} onChange={e => setNewCat({ ...newCat, nom_fr: e.target.value })} placeholder="ex: Colliers" required />
                </div>
              </div>
              <button type="submit" className="btn-gold" style={{ marginTop: '15px' }}>{t('add')}</button>
            </form>

            {/* List */}
            <div className="table-container">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>العربية 🇲🇦</th>
                    <th>Français 🇫🇷</th>
                    <th>{t('action')}</th>
                  </tr>
                </thead>
                <tbody>
                  {categories.map(cat => (
                    <tr key={cat.id}>
                      <td style={{ color: 'var(--text-gray)', fontSize: '0.8rem' }}>{cat.id}</td>
                      <td style={{ fontWeight: '600' }}>{cat.nom_ar || '-'}</td>
                      <td>{cat.nom_fr || '-'}</td>
                      <td>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button 
                            type="button" 
                            className="btn-outline-gold" 
                            style={{ padding: '5px 12px', fontSize: '0.78rem' }} 
                            onClick={() => handleOpenEditCategory(cat)}
                          >
                            ✏️ {t('edit')}
                          </button>
                          <button className="btn-reject" style={{ padding: '5px 12px', fontSize: '0.78rem' }} onClick={() => handleDeleteCategory(cat.id)}>
                            {t('delete')}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* EDIT CATEGORY MODAL (AR & FR) */}
            {editingCategory && (
              <div className="modal-overlay">
                <form className="modal-content" onSubmit={handleSaveCategory} style={{ maxWidth: '520px', padding: '25px' }}>
                  <button type="button" className="modal-close-btn" onClick={() => setEditingCategory(null)}>✕</button>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '8px' }}>
                    <h3 style={{ color: 'var(--admin-gold)', margin: 0, fontFamily: 'Playfair Display', fontSize: '1.3rem' }}>
                      🌐 {t('editCategory')}
                    </h3>
                    <button 
                      type="button" 
                      onClick={() => handleAutoTranslateCategory(editingCategory, setEditingCategory)}
                      className="btn-outline-gold"
                      style={{ fontSize: '0.78rem', padding: '4px 10px' }}
                      title="Traduit automatiquement vers l'autre langue"
                    >
                      {lang === 'ar' ? '✨ ترجمة فورية' : '✨ Traduire auto'}
                    </button>
                  </div>
                  <div className="form-group" style={{ marginBottom: '14px' }}>
                    <label className="form-label" style={{ textAlign: 'right', display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-gray)' }}>العربية (RTL)</span>
                      <span>{t('catNameAr')}</span>
                    </label>
                    <input 
                      type="text" 
                      dir="rtl"
                      className="form-input" 
                      value={editingCategory.nom_ar || ''} 
                      onChange={e => setEditingCategory({ ...editingCategory, nom_ar: e.target.value })} 
                      required 
                    />
                  </div>
                  <div className="form-group" style={{ marginBottom: '14px' }}>
                    <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>{t('catNameFr')}</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-gray)' }}>Français</span>
                    </label>
                    <input 
                      type="text" 
                      className="form-input" 
                      value={editingCategory.nom_fr || ''} 
                      onChange={e => setEditingCategory({ ...editingCategory, nom_fr: e.target.value })} 
                      required 
                    />
                  </div>
                  <div className="form-group" style={{ marginBottom: '20px' }}>
                    <label className="form-label">{lang === 'ar' ? 'الأيقونة / الرمز التعبيري' : 'Icône / Emoji'}</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      value={editingCategory.icon || '💎'} 
                      onChange={e => setEditingCategory({ ...editingCategory, icon: e.target.value })} 
                    />
                  </div>
                  <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                    <button type="button" className="btn-outline-gold" onClick={() => setEditingCategory(null)}>
                      {t('cancel')}
                    </button>
                    <button type="submit" className="btn-gold" style={{ margin: 0 }}>
                      {t('save')}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        )}

        {/* GESTION DES SUGGESTIONS */}
        {activeTab === 'suggestions' && (
          <div className="settings-panel" style={{ padding: '24px', maxWidth: '1200px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '14px', borderBottom: '1px solid rgba(212, 175, 55, 0.25)', paddingBottom: '18px' }}>
              <div>
                <h2 style={{ fontFamily: 'Playfair Display', color: 'var(--admin-gold)', margin: '0 0 6px 0', fontSize: '1.45rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span>⚡</span> {lang === 'ar' ? 'إدارة الاقتراحات السريعة للمنتجات والأسعار' : 'Gestion des Suggestions Rapides de Bijoux & Prix'}
                </h2>
                <p style={{ color: 'var(--text-gray)', margin: 0, fontSize: '0.88rem' }}>
                  {lang === 'ar' 
                    ? 'خصص أزرار الاقتراحات السريعة (العناوين، الأوصاف، وسعر الغرام) التي تظهر للمشرفين والتجار عند إضافة مجوهرات جديدة.' 
                    : 'Personnalisez les puces de suggestions rapides (titres, descriptions et prix au gramme) affichées lors de l\'ajout de bijoux.'}
                </p>
              </div>

              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <button 
                  type="button" 
                  onClick={handleResetSuggestions}
                  className="btn-outline-gold"
                  style={{ fontSize: '0.85rem', padding: '8px 16px' }}
                >
                  🔄 {lang === 'ar' ? 'استعادة الافتراضي' : 'Réinitialiser'}
                </button>
                <button 
                  type="button" 
                  onClick={handleSaveCommissionConfig}
                  className="btn-gold"
                  style={{ fontSize: '0.88rem', padding: '9px 22px', margin: 0, display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 800 }}
                >
                  💾 {lang === 'ar' ? 'حفظ التعديلات' : 'Enregistrer'}
                </button>
              </div>
            </div>

            {/* SECTION 1: TITRES SUGGÉRÉS */}
            <div style={{ marginBottom: '32px' }}>
              <h3 style={{ color: 'var(--text-white, #fff)', fontSize: '1.15rem', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>💍</span> {lang === 'ar' ? 'اقتراحات عناوين المجوهرات (Titres)' : 'Suggestions des Titres de Bijoux'}
              </h3>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
                {/* Titres AR */}
                <div style={{ background: 'var(--bg-card, #1e293b)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '18px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <span style={{ fontWeight: 700, color: 'var(--admin-gold)', fontSize: '0.95rem' }}>العربية 🇲🇦</span>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-gray)' }}>
                      {(commissionConfig.product_suggestions?.titre_ar || DEFAULT_SUGGESTIONS.titre_ar).length} {lang === 'ar' ? 'اقتراحات' : 'suggestions'}
                    </span>
                  </div>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '14px', minHeight: '80px' }}>
                    {(commissionConfig.product_suggestions?.titre_ar || DEFAULT_SUGGESTIONS.titre_ar).map((item, idx) => (
                      <span 
                        key={idx}
                        style={{
                          background: '#ffffff',
                          border: '1.5px solid #d4af37',
                          borderRadius: '16px',
                          padding: '5px 12px',
                          fontSize: '0.82rem',
                          fontWeight: 700,
                          color: '#8a6410',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}
                      >
                        {item}
                        <button
                          type="button"
                          onClick={() => handleRemoveSuggestion('titre_ar', idx)}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: '#ef4444',
                            cursor: 'pointer',
                            fontSize: '0.85rem',
                            padding: '0 2px',
                            fontWeight: 900
                          }}
                          title={lang === 'ar' ? 'حذف' : 'Supprimer'}
                        >
                          ✕
                        </button>
                      </span>
                    ))}
                  </div>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input 
                      type="text"
                      className="form-input"
                      dir="rtl"
                      placeholder="أضف عنواناً مقترحاً بالعربية..."
                      value={newSugTitleAr}
                      onChange={e => setNewSugTitleAr(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddSuggestion('titre_ar', newSugTitleAr); } }}
                    />
                    <button
                      type="button"
                      className="btn-gold"
                      style={{ padding: '6px 16px', margin: 0, whiteSpace: 'nowrap', fontSize: '0.82rem' }}
                      onClick={() => handleAddSuggestion('titre_ar', newSugTitleAr)}
                    >
                      + {lang === 'ar' ? 'إضافة' : 'Ajouter'}
                    </button>
                  </div>
                </div>

                {/* Titres FR */}
                <div style={{ background: 'var(--bg-card, #1e293b)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '18px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <span style={{ fontWeight: 700, color: 'var(--admin-gold)', fontSize: '0.95rem' }}>Français 🇫🇷</span>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-gray)' }}>
                      {(commissionConfig.product_suggestions?.titre_fr || DEFAULT_SUGGESTIONS.titre_fr).length} {lang === 'ar' ? 'اقتراحات' : 'suggestions'}
                    </span>
                  </div>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '14px', minHeight: '80px' }}>
                    {(commissionConfig.product_suggestions?.titre_fr || DEFAULT_SUGGESTIONS.titre_fr).map((item, idx) => (
                      <span 
                        key={idx}
                        style={{
                          background: '#ffffff',
                          border: '1.5px solid #d4af37',
                          borderRadius: '16px',
                          padding: '5px 12px',
                          fontSize: '0.82rem',
                          fontWeight: 700,
                          color: '#8a6410',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}
                      >
                        {item}
                        <button
                          type="button"
                          onClick={() => handleRemoveSuggestion('titre_fr', idx)}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: '#ef4444',
                            cursor: 'pointer',
                            fontSize: '0.85rem',
                            padding: '0 2px',
                            fontWeight: 900
                          }}
                          title={lang === 'ar' ? 'حذف' : 'Supprimer'}
                        >
                          ✕
                        </button>
                      </span>
                    ))}
                  </div>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input 
                      type="text"
                      className="form-input"
                      placeholder="ex: Bague Solitaire Diamant 18K"
                      value={newSugTitleFr}
                      onChange={e => setNewSugTitleFr(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddSuggestion('titre_fr', newSugTitleFr); } }}
                    />
                    <button
                      type="button"
                      className="btn-gold"
                      style={{ padding: '6px 16px', margin: 0, whiteSpace: 'nowrap', fontSize: '0.82rem' }}
                      onClick={() => handleAddSuggestion('titre_fr', newSugTitleFr)}
                    >
                      + {lang === 'ar' ? 'إضافة' : 'Ajouter'}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* SECTION 2: DESCRIPTIONS SUGGÉRÉES */}
            <div style={{ marginBottom: '32px' }}>
              <h3 style={{ color: 'var(--text-white, #fff)', fontSize: '1.15rem', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>📜</span> {lang === 'ar' ? 'اقتراحات الأوصاف والمصادقة (Descriptions)' : 'Suggestions de Descriptions & Certifications'}
              </h3>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
                {/* Descriptions AR */}
                <div style={{ background: 'var(--bg-card, #1e293b)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '18px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <span style={{ fontWeight: 700, color: 'var(--admin-gold)', fontSize: '0.95rem' }}>العربية 🇲🇦</span>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-gray)' }}>
                      {(commissionConfig.product_suggestions?.description_ar || DEFAULT_SUGGESTIONS.description_ar).length} {lang === 'ar' ? 'اقتراحات' : 'suggestions'}
                    </span>
                  </div>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '14px', minHeight: '80px' }}>
                    {(commissionConfig.product_suggestions?.description_ar || DEFAULT_SUGGESTIONS.description_ar).map((item, idx) => (
                      <span 
                        key={idx}
                        style={{
                          background: '#ffffff',
                          border: '1px solid #cbd5e1',
                          borderRadius: '16px',
                          padding: '5px 12px',
                          fontSize: '0.8rem',
                          fontWeight: 600,
                          color: '#1e293b',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}
                      >
                        {item}
                        <button
                          type="button"
                          onClick={() => handleRemoveSuggestion('description_ar', idx)}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: '#ef4444',
                            cursor: 'pointer',
                            fontSize: '0.85rem',
                            padding: '0 2px',
                            fontWeight: 900
                          }}
                          title={lang === 'ar' ? 'حذف' : 'Supprimer'}
                        >
                          ✕
                        </button>
                      </span>
                    ))}
                  </div>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input 
                      type="text"
                      className="form-input"
                      dir="rtl"
                      placeholder="أضف وصفاً مقترحاً بالعربية..."
                      value={newSugDescAr}
                      onChange={e => setNewSugDescAr(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddSuggestion('description_ar', newSugDescAr); } }}
                    />
                    <button
                      type="button"
                      className="btn-gold"
                      style={{ padding: '6px 16px', margin: 0, whiteSpace: 'nowrap', fontSize: '0.82rem' }}
                      onClick={() => handleAddSuggestion('description_ar', newSugDescAr)}
                    >
                      + {lang === 'ar' ? 'إضافة' : 'Ajouter'}
                    </button>
                  </div>
                </div>

                {/* Descriptions FR */}
                <div style={{ background: 'var(--bg-card, #1e293b)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '18px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <span style={{ fontWeight: 700, color: 'var(--admin-gold)', fontSize: '0.95rem' }}>Français 🇫🇷</span>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-gray)' }}>
                      {(commissionConfig.product_suggestions?.description_fr || DEFAULT_SUGGESTIONS.description_fr).length} {lang === 'ar' ? 'اقتراحات' : 'suggestions'}
                    </span>
                  </div>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '14px', minHeight: '80px' }}>
                    {(commissionConfig.product_suggestions?.description_fr || DEFAULT_SUGGESTIONS.description_fr).map((item, idx) => (
                      <span 
                        key={idx}
                        style={{
                          background: '#ffffff',
                          border: '1px solid #cbd5e1',
                          borderRadius: '16px',
                          padding: '5px 12px',
                          fontSize: '0.8rem',
                          fontWeight: 600,
                          color: '#1e293b',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}
                      >
                        {item}
                        <button
                          type="button"
                          onClick={() => handleRemoveSuggestion('description_fr', idx)}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: '#ef4444',
                            cursor: 'pointer',
                            fontSize: '0.85rem',
                            padding: '0 2px',
                            fontWeight: 900
                          }}
                          title={lang === 'ar' ? 'حذف' : 'Supprimer'}
                        >
                          ✕
                        </button>
                      </span>
                    ))}
                  </div>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input 
                      type="text"
                      className="form-input"
                      placeholder="ex: ✨ Or 18K avec poinçon officiel marocain."
                      value={newSugDescFr}
                      onChange={e => setNewSugDescFr(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddSuggestion('description_fr', newSugDescFr); } }}
                    />
                    <button
                      type="button"
                      className="btn-gold"
                      style={{ padding: '6px 16px', margin: 0, whiteSpace: 'nowrap', fontSize: '0.82rem' }}
                      onClick={() => handleAddSuggestion('description_fr', newSugDescFr)}
                    >
                      + {lang === 'ar' ? 'إضافة' : 'Ajouter'}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* SECTION 3: PRIX AU GRAMME SUGGÉRÉS */}
            <div style={{ marginBottom: '20px' }}>
              <h3 style={{ color: 'var(--text-white, #fff)', fontSize: '1.15rem', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>💰</span> {lang === 'ar' ? 'اقتراحات سعر الغرام (درهم / غ)' : 'Suggestions des Prix au Gramme (MAD/g)'}
              </h3>

              <div style={{ background: 'var(--bg-card, #1e293b)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '18px' }}>
                <p style={{ color: 'var(--text-gray)', fontSize: '0.85rem', marginTop: 0, marginBottom: '12px' }}>
                  {lang === 'ar' 
                    ? 'تظهر هذه الأسعار كأزرار سريعة تحت حقل سعر الغرام لملء السعر فوراً وحساب سعر القطعة الإجمالي تلقائياً.' 
                    : 'Ces boutons apparaissent sous le champ Prix du gramme pour remplir instantanément le prix et recalculer le total.'}
                </p>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '16px' }}>
                  {(commissionConfig.product_suggestions?.prix_gramme || DEFAULT_SUGGESTIONS.prix_gramme).map((val, idx) => (
                    <span 
                      key={idx}
                      style={{
                        background: '#ffffff',
                        border: '1.5px solid #d4af37',
                        borderRadius: '16px',
                        padding: '6px 14px',
                        fontSize: '0.9rem',
                        fontWeight: 800,
                        color: '#8a6410',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                      }}
                    >
                      {val} {lang === 'ar' ? 'د.م' : 'MAD'}
                      <button
                        type="button"
                        onClick={() => handleRemoveSuggestion('prix_gramme', idx)}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: '#ef4444',
                          cursor: 'pointer',
                          fontSize: '0.9rem',
                          padding: '0 2px',
                          fontWeight: 900
                        }}
                        title={lang === 'ar' ? 'حذف' : 'Supprimer'}
                      >
                        ✕
                      </button>
                    </span>
                  ))}
                </div>

                <div style={{ display: 'flex', gap: '10px', maxWidth: '380px' }}>
                  <input 
                    type="number"
                    step="1"
                    min="100"
                    className="form-input"
                    placeholder="مثال: 950"
                    value={newSugPrixGramme}
                    onChange={e => setNewSugPrixGramme(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddSuggestion('prix_gramme', newSugPrixGramme); } }}
                  />
                  <button
                    type="button"
                    className="btn-gold"
                    style={{ padding: '6px 18px', margin: 0, whiteSpace: 'nowrap', fontSize: '0.84rem', fontWeight: 700 }}
                    onClick={() => handleAddSuggestion('prix_gramme', newSugPrixGramme)}
                  >
                    + {lang === 'ar' ? 'إضافة سعر' : 'Ajouter prix'}
                  </button>
                </div>
              </div>
            </div>

            <div style={{ marginTop: '24px', textAlign: 'center', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '20px' }}>
              <button 
                type="button" 
                onClick={handleSaveCommissionConfig}
                className="btn-gold"
                style={{ padding: '12px 36px', fontSize: '1rem', fontWeight: 800, boxShadow: '0 4px 15px rgba(212, 175, 55, 0.3)' }}
              >
                💾 {lang === 'ar' ? 'حفظ كافة الاقتراحات والإعدادات' : 'Enregistrer toutes les suggestions'}
              </button>
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontFamily: 'Playfair Display' }}>{t('userManagement')}</h2>
              <button className="btn-gold" style={{ padding: '8px 16px', fontSize: '0.85rem' }} onClick={handleOpenAddUser}>
                ➕ {t('addUser')}
              </button>
            </div>

            <div className="table-container">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>{t('name')}</th>
                    <th>{t('email')}</th>
                    <th>{t('role')}</th>
                    <th>{lang === 'ar' ? 'حالة التفعيل والاعتماد' : 'Statut & Activation'}</th>
                    <th>{lang === 'ar' ? 'معلومات المتجر / الاتصال' : 'Info Boutique / Contact'}</th>
                    <th>{lang === 'ar' ? 'وثائق الباتنت والبطاقة الوطنية' : 'Documents (Patente & CIN)'}</th>
                    <th>{t('action')}</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => {
                    const status = u.account_status || (u.is_blocked ? 'bloque' : (u.is_active === false ? 'en_attente' : 'actif'));
                    return (
                    <tr key={u.id}>
                      <td style={{ color: 'var(--text-gray)', fontSize: '0.8rem' }}>{u.id}</td>
                      <td style={{ fontWeight: 'bold' }}>{u.nom}</td>
                      <td>{u.email}</td>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', minWidth: '135px' }}>
                          <select 
                            className="form-input" 
                            style={{ 
                              margin: 0, 
                              padding: '5px 8px', 
                              fontSize: '0.78rem', 
                              fontWeight: '700',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              backgroundColor: u.role === 'admin' ? 'rgba(239, 68, 68, 0.15)' : (u.role === 'commercant' ? 'rgba(212, 175, 55, 0.18)' : 'rgba(59, 130, 246, 0.15)'),
                              color: u.role === 'admin' ? '#ef4444' : (u.role === 'commercant' ? 'var(--admin-gold)' : '#3b82f6'),
                              border: `1px solid ${u.role === 'admin' ? 'rgba(239, 68, 68, 0.4)' : (u.role === 'commercant' ? 'var(--admin-gold)' : 'rgba(59, 130, 246, 0.4)')}`
                            }}
                            value={u.role || 'client'}
                            onChange={(e) => handleQuickRoleChange(u.id, e.target.value)}
                            title={lang === 'ar' ? 'تعديل وتغيير دور وصلاحيات المستخدم' : 'Modifier le rôle et privilèges'}
                          >
                            <option value="client" style={{ background: '#1e293b', color: '#fff' }}>
                              👥 {t('roleClient')}
                            </option>
                            <option value="commercant" style={{ background: '#1e293b', color: '#fff' }}>
                              🏪 {t('roleMerchant')}
                            </option>
                            <option value="admin" style={{ background: '#1e293b', color: '#fff' }}>
                              🛡️ {t('roleAdmin')}
                            </option>
                          </select>
                        </div>
                      </td>
                      <td>
                        {/* Account Status Badge & Quick Status Switch */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          <div>
                            {status === 'bloque' ? (
                              <span style={{
                                background: 'rgba(239, 68, 68, 0.15)',
                                color: '#ef4444',
                                border: '1px solid rgba(239, 68, 68, 0.35)',
                                padding: '3px 10px',
                                borderRadius: '12px',
                                fontSize: '0.75rem',
                                fontWeight: 800,
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px'
                              }}>
                                🔴 {lang === 'ar' ? 'محظور / معلق' : 'Bloqué'}
                              </span>
                            ) : status === 'en_attente' ? (
                              <span style={{
                                background: 'rgba(245, 158, 11, 0.15)',
                                color: '#f59e0b',
                                border: '1px solid rgba(245, 158, 11, 0.35)',
                                padding: '3px 10px',
                                borderRadius: '12px',
                                fontSize: '0.75rem',
                                fontWeight: 800,
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px'
                              }}>
                                🟡 {lang === 'ar' ? 'قيد المراجعة' : 'En attente'}
                              </span>
                            ) : (
                              <span style={{
                                background: 'rgba(16, 185, 129, 0.15)',
                                color: '#10b981',
                                border: '1px solid rgba(16, 185, 129, 0.35)',
                                padding: '3px 10px',
                                borderRadius: '12px',
                                fontSize: '0.75rem',
                                fontWeight: 800,
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px'
                              }}>
                                🟢 {lang === 'ar' ? 'مفعل ونشط' : 'Actif'}
                              </span>
                            )}
                          </div>

                          {u.block_reason && status === 'bloque' && (
                            <div style={{ fontSize: '0.72rem', color: '#f87171', fontStyle: 'italic', maxWidth: '160px' }}>
                              ⚠️ {u.block_reason}
                            </div>
                          )}

                          {/* Quick 1-click status triggers */}
                          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                            {status !== 'actif' && (
                              <button
                                type="button"
                                className="btn-approve"
                                style={{ padding: '2px 8px', fontSize: '0.7rem', margin: 0 }}
                                title={lang === 'ar' ? 'تفعيل واعتماد الحساب' : 'Activer et valider le compte'}
                                onClick={() => handleUpdateUserAccountStatus(u.id, 'actif')}
                              >
                                ✅ {lang === 'ar' ? 'تفعيل' : 'Activer'}
                              </button>
                            )}
                            {status !== 'bloque' && (
                              <button
                                type="button"
                                className="btn-reject"
                                style={{ padding: '2px 8px', fontSize: '0.7rem', margin: 0 }}
                                title={lang === 'ar' ? 'حظر هذا الحساب' : 'Bloquer ce compte'}
                                onClick={() => {
                                  const reason = window.prompt(lang === 'ar' ? 'سبب حظر الحساب (شكاية، وثيقة غير مطابقة، إلخ) :' : 'Motif du blocage (réclamation, patente invalide, etc.) :');
                                  if (reason !== null) {
                                    handleUpdateUserAccountStatus(u.id, 'bloque', reason);
                                  }
                                }}
                              >
                                🚫 {lang === 'ar' ? 'حظر' : 'Bloquer'}
                              </button>
                            )}
                            {status !== 'en_attente' && (
                              <button
                                type="button"
                                className="btn-outline-gold"
                                style={{ padding: '2px 6px', fontSize: '0.7rem' }}
                                title={lang === 'ar' ? 'إعادة لوضع قيد المراجعة' : 'Mettre en attente'}
                                onClick={() => handleUpdateUserAccountStatus(u.id, 'en_attente')}
                              >
                                ⏳
                              </button>
                            )}
                          </div>
                        </div>
                      </td>
                      <td style={{ verticalAlign: 'middle', minWidth: '220px' }}>
                        {u.role === 'commercant' ? (
                          <div style={{ fontSize: '0.82rem', display: 'flex', flexDirection: 'column', gap: '5px' }}>
                            {u.shopName && (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <span style={{ flexShrink: 0, fontSize: '0.95rem' }}>🏪</span>
                                <strong dir="auto" style={{ color: 'var(--text-white)' }}>{u.shopName}</strong>
                              </div>
                            )}
                            {(u.phone || u.telephone) && (
                              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                                <span style={{ flexShrink: 0, fontSize: '0.85rem' }}>📞</span>
                                <a 
                                  href={`tel:+${getCleanPhoneDigits(u.phone || u.telephone)}`}
                                  dir="ltr"
                                  style={{ 
                                    direction: 'ltr', 
                                    unicodeBidi: 'isolate', 
                                    fontFamily: 'monospace, system-ui, sans-serif',
                                    fontWeight: 700,
                                    color: 'var(--admin-gold)',
                                    textDecoration: 'none',
                                    letterSpacing: '0.3px'
                                  }}
                                  title={lang === 'ar' ? 'الاتصال بالهاتف' : 'Appeler'}
                                >
                                  {formatPhoneDisplay(u.phone || u.telephone)}
                                </a>
                              </div>
                            )}
                            {(u.address || u.city) && (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-gray)', fontSize: '0.78rem' }}>
                                <span style={{ flexShrink: 0, fontSize: '0.85rem' }}>📍</span>
                                <span dir="auto">{[u.address, u.city].filter(Boolean).join(', ')}</span>
                              </div>
                            )}
                          </div>
                        ) : (
                          (u.phone || u.telephone) ? (
                            <div style={{ fontSize: '0.82rem' }}>
                              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                                <span style={{ flexShrink: 0, fontSize: '0.85rem' }}>📞</span>
                                <a 
                                  href={`tel:+${getCleanPhoneDigits(u.phone || u.telephone)}`}
                                  dir="ltr"
                                  style={{ 
                                    direction: 'ltr', 
                                    unicodeBidi: 'isolate', 
                                    fontFamily: 'monospace, system-ui, sans-serif',
                                    fontWeight: 700,
                                    color: 'var(--admin-gold)',
                                    textDecoration: 'none',
                                    letterSpacing: '0.3px'
                                  }}
                                  title={lang === 'ar' ? 'الاتصال بالهاتف' : 'Appeler'}
                                >
                                  {formatPhoneDisplay(u.phone || u.telephone)}
                                </a>
                              </div>
                            </div>
                          ) : (
                            <span style={{ color: 'var(--text-gray)', fontSize: '0.8rem' }}>-</span>
                          )
                        )}
                      </td>
                      <td>
                        {u.numero_patente ? (
                          <div style={{ fontSize: '0.8rem' }}>
                            <div style={{ fontWeight: 700, color: 'var(--admin-gold)' }}>📜 {u.numero_patente}</div>
                            {u.patente_document ? (
                              <a
                                href={`${API_URL.replace('/api', '')}${u.patente_document}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  color: '#38bdf8',
                                  textDecoration: 'underline',
                                  marginTop: '2px',
                                  fontSize: '0.74rem',
                                  fontWeight: 600
                                }}
                              >
                                📄 {u.patente_filename || (lang === 'ar' ? 'الباتنت' : 'Patente')}
                              </a>
                            ) : (
                              <span style={{ fontSize: '0.72rem', color: 'var(--text-gray)' }}>
                                {lang === 'ar' ? 'بدون وثيقة باتنت' : 'Sans doc patente'}
                              </span>
                            )}
                          </div>
                        ) : null}

                        {(u.numero_bureau_garantie || u.bureau_garantie_document) && (
                          <div style={{ fontSize: '0.78rem', marginTop: u.numero_patente ? '6px' : '0', paddingTop: u.numero_patente ? '4px' : '0', borderTop: u.numero_patente ? '1px dashed rgba(255,255,255,0.08)' : 'none' }}>
                            {u.numero_bureau_garantie && (
                              <div style={{ fontWeight: 700, color: '#fbbf24' }}>
                                🏛️ {lang === 'ar' ? 'الضمانة :' : 'Garantie :'} {u.numero_bureau_garantie}
                              </div>
                            )}
                            {u.bureau_garantie_document ? (
                              <a
                                href={`${API_URL.replace('/api', '')}${u.bureau_garantie_document}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  color: '#38bdf8',
                                  textDecoration: 'underline',
                                  marginTop: '2px',
                                  fontSize: '0.72rem',
                                  fontWeight: 600
                                }}
                              >
                                🏛️ {u.bureau_garantie_filename || (lang === 'ar' ? 'صورة الضمانة' : 'Doc Garantie')}
                              </a>
                            ) : (
                              <span style={{ fontSize: '0.7rem', color: 'var(--text-gray)' }}>
                                {lang === 'ar' ? 'بدون وثيقة ضمانة' : 'Sans doc garantie'}
                              </span>
                            )}
                          </div>
                        )}

                        {(u.numero_cin || u.cin_recto_document || u.cin_verso_document) && (
                          <div style={{ fontSize: '0.78rem', marginTop: (u.numero_patente || u.numero_bureau_garantie) ? '6px' : '0', paddingTop: (u.numero_patente || u.numero_bureau_garantie) ? '4px' : '0', borderTop: (u.numero_patente || u.numero_bureau_garantie) ? '1px dashed rgba(255,255,255,0.08)' : 'none' }}>
                            {u.numero_cin && (
                              <div style={{ fontWeight: 600, color: '#e2e8f0' }}>🪪 CIN: {u.numero_cin}</div>
                            )}
                            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '2px' }}>
                              {u.cin_recto_document && (
                                <a
                                  href={`${API_URL.replace('/api', '')}${u.cin_recto_document}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  style={{ color: '#38bdf8', textDecoration: 'underline', fontSize: '0.72rem', fontWeight: 600 }}
                                >
                                  🪪 {lang === 'ar' ? 'الوجه' : 'Recto'}
                                </a>
                              )}
                              {u.cin_verso_document && (
                                <a
                                  href={`${API_URL.replace('/api', '')}${u.cin_verso_document}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  style={{ color: '#38bdf8', textDecoration: 'underline', fontSize: '0.72rem', fontWeight: 600 }}
                                >
                                  🪪 {lang === 'ar' ? 'الظهر' : 'Verso'}
                                </a>
                              )}
                            </div>
                          </div>
                        )}

                        {!u.numero_patente && !u.numero_bureau_garantie && !u.bureau_garantie_document && !u.numero_cin && !u.cin_recto_document && !u.cin_verso_document && (
                          <span style={{ color: 'var(--text-gray)', fontSize: '0.75rem' }}>-</span>
                        )}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button className="btn-approve" style={{ padding: '5px 10px', fontSize: '0.75rem' }} onClick={() => handleOpenEditUser(u)}>
                            ✏️
                          </button>
                          <button className="btn-reject" style={{ padding: '5px 10px', fontSize: '0.75rem', margin: 0 }} onClick={() => handleDeleteUser(u.id)}>
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'roles' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px', flexWrap: 'wrap', gap: '15px' }}>
              <div>
                <h2 style={{ fontFamily: 'Playfair Display', margin: 0, color: 'var(--text-white)' }}>{t('rolesConfigTitle')}</h2>
                <p style={{ margin: '6px 0 0', fontSize: '0.88rem', color: 'var(--text-gray)' }}>{t('rolesConfigSubtitle')}</p>
              </div>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                <button 
                  className="btn-outline-gold" 
                  style={{ padding: '9px 18px', fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '8px', cursor: 'pointer', borderRadius: 'var(--radius-sm)' }} 
                  onClick={handleResetPermissions}
                >
                  <span>🔄</span>
                  <span>{t('resetPermissions')}</span>
                </button>
                <button 
                  className="btn-gold" 
                  style={{ 
                    padding: '9px 24px', 
                    fontSize: '0.88rem', 
                    display: 'inline-flex', 
                    alignItems: 'center', 
                    gap: '8px', 
                    cursor: 'pointer', 
                    borderRadius: 'var(--radius-sm)', 
                    fontWeight: 700, 
                    boxShadow: '0 4px 15px rgba(212, 175, 55, 0.25)' 
                  }} 
                  onClick={handleSavePermissions}
                  disabled={isSavingPermissions}
                >
                  <span>💾</span>
                  <span>{isSavingPermissions ? (lang === 'ar' ? 'جارٍ الحفظ...' : 'Enregistrement...') : (t('savePermissions') || (lang === 'ar' ? 'حفظ الصلاحيات والتراخيص' : 'Sauvegarder les permissions'))}</span>
                </button>
              </div>
            </div>

            {/* Alert banner if unsaved edits */}
            {permissionsDirty && (
              <div style={{
                background: 'linear-gradient(90deg, rgba(212, 175, 55, 0.2) 0%, rgba(212, 175, 55, 0.08) 100%)',
                border: '1px solid var(--admin-gold)',
                borderRadius: 'var(--radius-md)',
                padding: '12px 20px',
                marginBottom: '20px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '12px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '1.2rem' }}>⚠️</span>
                  <span style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-white)' }}>
                    {lang === 'ar' ? 'تنبيه: قمت بتعديل الصلاحيات ! اضغط على زر الحفظ لتطبيقها على المنصة.' : 'Des modifications de permissions ont été apportées. Cliquez sur "Sauvegarder" pour les appliquer au système.'}
                  </span>
                </div>
                <button
                  type="button"
                  className="btn-gold"
                  style={{ padding: '7px 18px', fontSize: '0.82rem', display: 'inline-flex', alignItems: 'center', gap: '6px', fontWeight: 700 }}
                  onClick={handleSavePermissions}
                  disabled={isSavingPermissions}
                >
                  <span>💾</span>
                  <span>{isSavingPermissions ? (lang === 'ar' ? 'جارٍ الحفظ...' : 'Enregistrement...') : (lang === 'ar' ? 'حفظ الصلاحيات الآن' : 'Sauvegarder maintenant')}</span>
                </button>
              </div>
            )}

            {/* Roles Matrix Grid */}
            <div className="roles-grid">
              {[
                { 
                  key: 'admin', 
                  titleKey: 'roleAdminTitle', 
                  descKey: 'roleAdminDesc',
                  icon: '🛡️', 
                  color: 'var(--danger-red)', 
                  badgeBg: 'var(--danger-bg)',
                  badgeColor: 'var(--danger-red)',
                  badgeBorder: 'var(--danger-border)'
                },
                { 
                  key: 'commercant', 
                  titleKey: 'roleMerchantTitle', 
                  descKey: 'roleMerchantDesc',
                  icon: '🏪', 
                  color: 'var(--admin-gold)', 
                  badgeBg: 'rgba(179, 135, 40, 0.12)',
                  badgeColor: 'var(--dark-gold)',
                  badgeBorder: 'var(--border-gold)'
                },
                { 
                  key: 'client', 
                  titleKey: 'roleClientTitle', 
                  descKey: 'roleClientDesc',
                  icon: '👥', 
                  color: 'var(--info-cyan)', 
                  badgeBg: 'var(--info-bg)',
                  badgeColor: 'var(--info-cyan)',
                  badgeBorder: 'var(--info-border)'
                }
              ].map(roleItem => {
                const roleCount = users.filter(u => u.role === roleItem.key).length;
                const permissionsList = [
                  { key: 'view_dashboard', labelKey: 'perm_view_dashboard' },
                  { key: 'moderate_auctions', labelKey: 'perm_moderate_auctions' },
                  { key: 'manage_commissions', labelKey: 'perm_manage_commissions' },
                  { key: 'manage_categories', labelKey: 'perm_manage_categories' },
                  { key: 'manage_users', labelKey: 'perm_manage_users' },
                  { key: 'manage_roles', labelKey: 'perm_manage_roles' },
                  { key: 'edit_products', labelKey: 'perm_edit_products' },
                  { key: 'create_products', labelKey: 'perm_create_products' },
                  { key: 'manage_gold_rates', labelKey: 'perm_manage_gold_rates' },
                  { key: 'manage_terms', labelKey: 'perm_manage_terms' }
                ];
                
                return (
                  <div key={roleItem.key} className="role-matrix-card" style={{ borderTop: `4px solid ${roleItem.color}` }}>
                    <div className="role-matrix-header">
                      <h3 className="role-matrix-title" style={{ color: roleItem.color }}>
                        <span>{roleItem.icon}</span>
                        <span>{t(roleItem.titleKey)}</span>
                      </h3>
                      <span 
                        className="role-member-badge" 
                        style={{ 
                          backgroundColor: roleItem.badgeBg, 
                          color: roleItem.badgeColor,
                          border: `1px solid ${roleItem.badgeBorder}`
                        }}
                      >
                        {roleCount} {t('membersCount')}
                      </span>
                    </div>
                    
                    <div className="role-matrix-body">
                      <p className="role-matrix-desc">
                        {t(roleItem.descKey)}
                      </p>
                      
                      <h4 className="role-matrix-perm-title">
                        <span>⚡</span>
                        <span>{t('activePermissionsTitle')}</span>
                      </h4>
                      
                      <div className="role-perm-list">
                        {permissionsList.map(perm => {
                          const isChecked = (rolePermissions[roleItem.key] || []).includes(perm.key);
                          return (
                            <label 
                              key={perm.key} 
                              className={`role-perm-item ${isChecked ? 'active' : 'inactive'}`}
                            >
                              <input 
                                type="checkbox" 
                                className="role-perm-checkbox"
                                checked={isChecked} 
                                onChange={() => handleTogglePermission(roleItem.key, perm.key)} 
                              />
                              <span className="role-perm-label">
                                {t(perm.labelKey)}
                              </span>
                            </label>
                          );
                        })}
                      </div>

                      <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid rgba(255, 255, 255, 0.08)', display: 'flex', justifyContent: 'flex-end' }}>
                        <button
                          type="button"
                          className="btn-gold"
                          style={{ padding: '7px 16px', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}
                          onClick={handleSavePermissions}
                          disabled={isSavingPermissions}
                        >
                          <span>💾</span>
                          <span>{lang === 'ar' ? 'حفظ الصلاحيات' : 'Enregistrer'}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Quick Roles Assignment */}
            <div className="table-container" style={{ marginTop: '20px' }}>
              <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-gold)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                <h3 style={{ margin: 0, fontSize: '1.25rem', fontFamily: 'Playfair Display', color: 'var(--text-white)' }}>{t('quickRoleAssignTitle')}</h3>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-gray)' }}>{t('totalRegisteredUsers')} <strong style={{ color: 'var(--dark-gold)' }}>{users.length}</strong></span>
              </div>
              
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>{t('name')}</th>
                    <th>{t('email')}</th>
                    <th>{t('currentRole')}</th>
                    <th>{t('newRole')}</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.id}>
                      <td>
                        <strong style={{ color: 'var(--text-white)', display: 'block', fontSize: '0.95rem' }}>{u.nom}</strong>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-gray)' }}>ID: #{u.id}</div>
                      </td>
                      <td style={{ color: 'var(--text-gray)' }}>{u.email}</td>
                      <td>
                        <span style={{ 
                          backgroundColor: u.role === 'admin' ? 'var(--danger-bg)' : (u.role === 'commercant' ? 'rgba(179, 135, 40, 0.12)' : 'var(--info-bg)'), 
                          color: u.role === 'admin' ? 'var(--danger-red)' : (u.role === 'commercant' ? 'var(--dark-gold)' : 'var(--info-cyan)'), 
                          border: `1px solid ${u.role === 'admin' ? 'var(--danger-border)' : (u.role === 'commercant' ? 'var(--border-gold)' : 'var(--info-border)')}`,
                          padding: '4px 12px', 
                          borderRadius: '20px', 
                          fontSize: '0.78rem', 
                          fontWeight: '700',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}>
                          {u.role === 'admin' ? '🛡️ ' + t('roleAdmin') : (u.role === 'commercant' ? '🏪 ' + t('roleMerchant') : '👥 ' + t('roleClient'))}
                        </span>
                      </td>
                      <td>
                        <select 
                          className="form-input" 
                          style={{ margin: 0, padding: '6px 14px', fontSize: '0.85rem', width: 'auto', display: 'inline-block', borderRadius: 'var(--radius-sm)' }}
                          value={u.role}
                          onChange={(e) => handleQuickRoleChange(u.id, e.target.value)}
                        >
                          <option value="client">{t('roleClient')}</option>
                          <option value="commercant">{t('roleMerchant')}</option>
                          <option value="admin">{t('roleAdmin')}</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'terms' && (
          <div className="terms-admin-container">
            {!hasPermission('manage_terms') ? (
              <div className="terms-admin-card" style={{ textAlign: 'center', padding: '60px 20px' }}>
                <span style={{ fontSize: '3rem', display: 'block', marginBottom: '16px' }}>🚫</span>
                <h3 style={{ color: 'var(--danger-red)', margin: '0 0 10px', fontSize: '1.4rem' }}>
                  {lang === 'ar' ? 'غير مصرح لك بالوصول إلى هذه الصفحة' : 'Accès Restreint & Non Autorisé'}
                </h3>
                <p style={{ color: 'var(--text-gray)', maxWidth: '500px', margin: '0 auto', fontSize: '0.9rem' }}>
                  {lang === 'ar' 
                    ? 'حسابك الحالي لا يمتلك صلاحية تعديل شروط وأحكام الاستخدام (manage_terms). يرجى مراجعة مشرف النظام.'
                    : "Votre profil administrateur ne dispose pas de l'autorisation 'manage_terms' pour administrer les conditions d'utilisation."}
                </p>
              </div>
            ) : (
              <>
                {/* Header Action Bar */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
                  <div>
                    <h2 style={{ fontFamily: 'Playfair Display', margin: 0, color: 'var(--text-white)' }}>
                      {t('termsManagementTitle')}
                    </h2>
                    <p style={{ margin: '6px 0 0', fontSize: '0.88rem', color: 'var(--text-gray)' }}>
                      {t('termsManagementSubtitle')}
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <span style={{
                      background: 'rgba(212, 175, 55, 0.1)',
                      border: '1px solid var(--border-gold)',
                      borderRadius: '8px',
                      padding: '8px 12px',
                      fontSize: '0.82rem',
                      color: 'var(--admin-gold)'
                    }}>
                      🏷️ {lang === 'ar' ? 'الإصدار :' : 'Version :'} <strong>{termsData?.version || '1.0'}</strong>
                      {termsData?.lastUpdated && (
                        <span style={{ marginInlineStart: '8px', opacity: 0.8 }}>
                          • {termsData.lastUpdated}
                        </span>
                      )}
                    </span>
                    <button 
                      type="button"
                      className="btn-outline-gold" 
                      style={{ padding: '9px 18px', fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '8px', cursor: 'pointer', borderRadius: 'var(--radius-sm)' }} 
                      onClick={handleResetTermsToDefault}
                    >
                      <span>🔄</span>
                      <span>{lang === 'ar' ? 'استرجاع البنود القياسية' : 'Clauses Standard'}</span>
                    </button>
                    <button 
                      type="button"
                      className="btn-gold" 
                      style={{ 
                        padding: '9px 24px', 
                        fontSize: '0.88rem', 
                        display: 'inline-flex', 
                        alignItems: 'center', 
                        gap: '8px', 
                        cursor: 'pointer', 
                        borderRadius: 'var(--radius-sm)', 
                        fontWeight: 700, 
                        boxShadow: '0 4px 15px rgba(212, 175, 55, 0.25)' 
                      }} 
                      onClick={handleSaveTerms}
                      disabled={isSavingTerms}
                    >
                      <span>💾</span>
                      <span>{isSavingTerms ? (lang === 'ar' ? 'جارٍ الحفظ...' : 'Enregistrement...') : (lang === 'ar' ? 'حفظ الشروط والتطبيق' : 'Sauvegarder les Conditions')}</span>
                    </button>
                  </div>
                </div>

                {/* Unsaved alert banner */}
                {termsDirty && (
                  <div style={{
                    background: 'linear-gradient(90deg, rgba(212, 175, 55, 0.2) 0%, rgba(212, 175, 55, 0.08) 100%)',
                    border: '1px solid var(--admin-gold)',
                    borderRadius: 'var(--radius-md)',
                    padding: '12px 20px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '12px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '1.2rem' }}>⚠️</span>
                      <span style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-white)' }}>
                        {lang === 'ar' 
                          ? 'تنبيه: تم تعديل بنود شروط الاستخدام. اضغط على حفظ لتطبيقها على نافذة تسجيل التجار.' 
                          : 'Des modifications ont été apportées aux termes. Cliquez sur "Sauvegarder" pour les rendre effectives.'}
                      </span>
                    </div>
                    <button
                      type="button"
                      className="btn-gold"
                      style={{ padding: '7px 18px', fontSize: '0.82rem', display: 'inline-flex', alignItems: 'center', gap: '6px', fontWeight: 700 }}
                      onClick={handleSaveTerms}
                      disabled={isSavingTerms}
                    >
                      <span>💾</span>
                      <span>{isSavingTerms ? (lang === 'ar' ? 'جارٍ الحفظ...' : 'Enregistrement...') : (lang === 'ar' ? 'حفظ الآن' : 'Sauvegarder maintenant')}</span>
                    </button>
                  </div>
                )}

                {/* Editor Tabs: Arabic, French, Preview */}
                <div className="terms-editor-lang-tabs">
                  <button
                    type="button"
                    className={`terms-editor-tab-btn ${termsEditorLang === 'ar' ? 'active' : ''}`}
                    onClick={() => setTermsEditorLang('ar')}
                  >
                    <span>🇲🇦</span>
                    <span>النسخة العربية (Arabe)</span>
                  </button>
                  <button
                    type="button"
                    className={`terms-editor-tab-btn ${termsEditorLang === 'fr' ? 'active' : ''}`}
                    onClick={() => setTermsEditorLang('fr')}
                  >
                    <span>🇫🇷</span>
                    <span>Version Française (Français)</span>
                  </button>
                  <button
                    type="button"
                    className={`terms-editor-tab-btn ${termsEditorLang === 'preview' ? 'active' : ''}`}
                    onClick={() => setTermsEditorLang('preview')}
                  >
                    <span>👁️</span>
                    <span>{lang === 'ar' ? 'معاينة مباشرة (Aperçu)' : 'Aperçu Direct Client'}</span>
                  </button>
                </div>

                {termsEditorLang === 'preview' ? (
                  /* LIVE PREVIEW */
                  <div className="terms-preview-box">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid var(--border-gold)', paddingBottom: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontSize: '1.4rem' }}>📜</span>
                        <div>
                          <h3 style={{ margin: 0, color: 'var(--text-white)', fontSize: '1.1rem' }}>
                            {termsData?.[previewTermsLang]?.title || (previewTermsLang === 'ar' ? 'شروط وأحكام استخدام المنصة' : "Conditions Générales d'Utilisation")}
                          </h3>
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-gray)' }}>
                            {termsData?.[previewTermsLang]?.subtitle || 'HRSDGDG Joaillerie & Bijoux'}
                          </span>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button
                          type="button"
                          className={`terms-editor-tab-btn ${previewTermsLang === 'ar' ? 'active' : ''}`}
                          style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                          onClick={() => setPreviewTermsLang('ar')}
                        >
                          🇲🇦 العربية
                        </button>
                        <button
                          type="button"
                          className={`terms-editor-tab-btn ${previewTermsLang === 'fr' ? 'active' : ''}`}
                          style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                          onClick={() => setPreviewTermsLang('fr')}
                        >
                          🇫🇷 Français
                        </button>
                      </div>
                    </div>

                    <div style={{ direction: previewTermsLang === 'ar' ? 'rtl' : 'ltr', textAlign: previewTermsLang === 'ar' ? 'right' : 'left' }}>
                      {termsData?.[previewTermsLang]?.preamble && (
                        <div className="terms-preview-preamble">
                          <strong style={{ color: 'var(--admin-gold)' }}>
                            {previewTermsLang === 'ar' ? 'ديباجة تمهيدية : ' : 'Préambule : '}
                          </strong>
                          {termsData[previewTermsLang].preamble}
                        </div>
                      )}

                      {(termsData?.[previewTermsLang]?.articles || []).map(art => (
                        <div key={art.id} className="terms-preview-article-item">
                          <div className="terms-preview-article-title">{art.title}</div>
                          <div className="terms-preview-article-text">{art.content}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  /* EDITING FORM FOR FR OR AR */
                  <div style={{ direction: termsEditorLang === 'ar' ? 'rtl' : 'ltr', textAlign: termsEditorLang === 'ar' ? 'right' : 'left' }}>
                    {/* General info card */}
                    <div className="terms-admin-card" style={{ marginBottom: '20px' }}>
                      <h3 style={{ margin: '0 0 16px', color: 'var(--text-white)', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span>📑</span>
                        <span>{termsEditorLang === 'ar' ? 'معلومات الوثيقة والديباجة التمهيدية' : 'Informations Générales & Préambule'}</span>
                      </h3>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginBottom: '16px' }}>
                        <div>
                          <label className="form-label">{termsEditorLang === 'ar' ? 'عنوان الوثيقة الرئيسي' : 'Titre du Document'}</label>
                          <input
                            type="text"
                            className="form-input"
                            value={termsData?.[termsEditorLang]?.title || ''}
                            onChange={e => handleUpdateTermGeneral('title', e.target.value)}
                            placeholder={termsEditorLang === 'ar' ? 'شروط وأحكام استخدام المنصة' : "Conditions Générales d'Utilisation"}
                          />
                        </div>
                        <div>
                          <label className="form-label">{termsEditorLang === 'ar' ? 'العنوان الفرعي' : 'Sous-Titre'}</label>
                          <input
                            type="text"
                            className="form-input"
                            value={termsData?.[termsEditorLang]?.subtitle || ''}
                            onChange={e => handleUpdateTermGeneral('subtitle', e.target.value)}
                            placeholder={termsEditorLang === 'ar' ? 'منصة HRSDGDG الرسمية لتجار وصاغة المجوهرات بالمغرب' : 'Plateforme Numérique Joaillerie & Bijouterie au Maroc'}
                          />
                        </div>
                      </div>

                      <div>
                        <label className="form-label">{termsEditorLang === 'ar' ? 'الديباجة التمهيدية (Préambule)' : 'Préambule Introductif'}</label>
                        <textarea
                          className="form-input"
                          rows={3}
                          value={termsData?.[termsEditorLang]?.preamble || ''}
                          onChange={e => handleUpdateTermGeneral('preamble', e.target.value)}
                          placeholder={termsEditorLang === 'ar' ? 'تحدد هذه الشروط والأحكام القواعد الملزمة...' : 'Les présentes Conditions Générales régissent...'}
                          style={{ minHeight: '80px', lineHeight: 1.6 }}
                        />
                      </div>
                    </div>

                    {/* Articles list */}
                    <div className="terms-admin-card">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
                        <div>
                          <h3 style={{ margin: 0, color: 'var(--text-white)', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span>⚖️</span>
                            <span>{termsEditorLang === 'ar' ? 'بنود ومواد الشروط والأحكام' : 'Articles & Clauses Juridiques'}</span>
                            <span style={{ fontSize: '0.85rem', color: 'var(--text-gray)', fontWeight: 'normal', marginInlineStart: '6px' }}>
                              ({(termsData?.[termsEditorLang]?.articles || []).length} {termsEditorLang === 'ar' ? 'مواد' : 'articles'})
                            </span>
                          </h3>
                        </div>
                        <button
                          type="button"
                          className="btn-gold"
                          style={{ padding: '8px 18px', fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                          onClick={handleAddTermArticle}
                        >
                          <span>➕</span>
                          <span>{termsEditorLang === 'ar' ? 'إضافة مادة جديدة' : 'Ajouter une Clause'}</span>
                        </button>
                      </div>

                      <div>
                        {(termsData?.[termsEditorLang]?.articles || []).map((art, idx) => (
                          <div key={art.id || idx} className="terms-article-admin-card">
                            <div className="terms-article-card-header">
                              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1 }}>
                                <span className="terms-article-num-badge">
                                  #{idx + 1}
                                </span>
                                <input
                                  type="text"
                                  className="form-input"
                                  style={{ margin: 0, fontWeight: 700, color: 'var(--admin-gold)', background: 'rgba(255,255,255,0.03)' }}
                                  value={art.title || ''}
                                  onChange={e => handleUpdateTermArticle(art.id, 'title', e.target.value)}
                                  placeholder={termsEditorLang === 'ar' ? `المادة ${idx + 1} : عنوان المادة` : `Article ${idx + 1} : Titre`}
                                />
                              </div>
                              <button
                                type="button"
                                className="btn-reject"
                                style={{ padding: '6px 12px', fontSize: '0.78rem', margin: 0, display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                                onClick={() => handleRemoveTermArticle(art.id)}
                                title={termsEditorLang === 'ar' ? 'حذف هذه المادة' : 'Supprimer cet article'}
                              >
                                <span>🗑️</span>
                                <span>{termsEditorLang === 'ar' ? 'حذف' : 'Supprimer'}</span>
                              </button>
                            </div>
                            <div>
                              <textarea
                                className="form-input"
                                rows={4}
                                style={{ margin: 0, lineHeight: 1.6 }}
                                value={art.content || ''}
                                onChange={e => handleUpdateTermArticle(art.id, 'content', e.target.value)}
                                placeholder={termsEditorLang === 'ar' ? 'أدخل نص وتفاصيل المادة القانونية هنا...' : 'Saisissez le texte complet de cette clause...'}
                              />
                            </div>
                          </div>
                        ))}

                        <div style={{ textAlign: 'center', marginTop: '16px' }}>
                          <button
                            type="button"
                            className="btn-outline-gold"
                            style={{ padding: '10px 24px', fontSize: '0.88rem', display: 'inline-flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
                            onClick={handleAddTermArticle}
                          >
                            <span>➕</span>
                            <span>{termsEditorLang === 'ar' ? 'إضافة مادة قانونية أخرى' : 'Ajouter un autre article'}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {activeTab === 'auctions' && (
          <div>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '15px' }}>
              <div>
                <h2 style={{ fontFamily: 'Playfair Display', margin: 0 }}>{t('auctionManagement')}</h2>
                <p style={{ color: 'var(--text-gray)', fontSize: '0.88rem', margin: '4px 0 0' }}>
                  {lang === 'ar' ? 'متابعة وإدارة المزادات العلنية في الوقت الفعلي والتحكم بالعروض والمزايدات.' : 'Superviser les enchères en temps réel, modérer les offres et valider les adjudications.'}
                </p>
              </div>
              <button className="btn-gold" style={{ padding: '8px 18px', fontSize: '0.85rem' }} onClick={handleOpenAddAuction}>
                ➕ {lang === 'ar' ? 'إطلاق مزاد جديد' : 'Lancer une Nouvelle Enchère'}
              </button>
            </div>

            {/* Stats Row */}
            <div className="stats-row" style={{ marginBottom: '25px' }}>
              <div className="stat-card" style={{ borderLeft: '4px solid var(--admin-gold)' }}>
                <span className="stat-title">{lang === 'ar' ? 'مزادات مباشرة نشطة' : 'Enchères en Direct'}</span>
                <span className="stat-num" style={{ color: 'var(--admin-gold)' }}>
                  {auctions.filter(a => a.statut === 'Active' && new Date(a.date_fin) > new Date()).length}
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--success-green)' }}>{lang === 'ar' ? 'تستقبل عروض المزايدة حالياً' : 'En cours de réception d\'offres'}</span>
              </div>
              <div className="stat-card">
                <span className="stat-title">{lang === 'ar' ? 'إجمالي المزادات' : 'Total Enchères Historique'}</span>
                <span className="stat-num">{auctions.length}</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-gray)' }}>{lang === 'ar' ? 'مسجلة على المنصة' : 'Créées sur la plateforme'}</span>
              </div>
              <div className="stat-card">
                <span className="stat-title">{lang === 'ar' ? 'العروض المقدمة' : 'Offres Déposées'}</span>
                <span className="stat-num" style={{ color: 'var(--success-green)' }}>
                  {auctions.reduce((sum, a) => sum + (a.bidsCount || 0), 0)}
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-gray)' }}>{lang === 'ar' ? 'مجموع مزايدات الزبناء' : 'Mises clients cumulées'}</span>
              </div>
              <div className="stat-card">
                <span className="stat-title">{lang === 'ar' ? 'أعلى مزاد رابح' : 'Meilleure Adjudication'}</span>
                <span className="stat-num" style={{ color: 'var(--admin-gold)' }}>
                  {Math.max(...auctions.map(a => a.highestBid || 0), 0).toLocaleString()} MAD
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-gray)' }}>{lang === 'ar' ? 'رقم قياسي' : 'Record de vente'}</span>
              </div>
            </div>

            {/* Table */}
            <div className="table-container">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>{lang === 'ar' ? 'القطعة / المزاد' : 'Bijou / Lot'}</th>
                    <th>{t('merchant')}</th>
                    <th>{t('startingPrice')}</th>
                    <th>{t('highestBid')}</th>
                    <th>{t('bidsCount')}</th>
                    <th>{t('endDate')}</th>
                    <th>{t('status')}</th>
                    <th>{t('action')}</th>
                  </tr>
                </thead>
                <tbody>
                  {auctions.length === 0 ? (
                    <tr>
                      <td colSpan="8" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-gray)' }}>
                        {t('noAuctions')}
                      </td>
                    </tr>
                  ) : (
                    auctions.map(auc => {
                      const isExpired = new Date(auc.date_fin) < new Date();
                      const isActive = auc.statut === 'Active' && !isExpired;
                      const aucTitle = (lang === 'ar' && auc.bijou?.titre_ar) ? auc.bijou.titre_ar : (auc.bijou?.titre_fr || auc.bijou?.titre || `Bijou #${auc.bijou_id}`);
                      return (
                        <tr key={auc.id}>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              {auc.bijou?.images?.[0] && (
                                <img
                                  src={auc.bijou.images[0]}
                                  alt={aucTitle}
                                  style={{ width: '42px', height: '42px', borderRadius: '6px', objectFit: 'cover', border: '1px solid var(--border-gold)' }}
                                />
                              )}
                              <div>
                                <strong style={{ display: 'block', color: 'var(--text-dark)' }}>{aucTitle}</strong>
                                <span style={{ fontSize: '0.75rem', color: 'var(--text-gray)' }}>{auc.bijou?.gramme || 0}g • {auc.bijou?.purete || '18k'}</span>
                              </div>
                            </div>
                          </td>
                          <td style={{ fontSize: '0.85rem' }}>
                            {auc.bijou?.vendeur_nom || 'Commerçant'}
                          </td>
                          <td style={{ fontWeight: 600 }}>
                            {auc.prix_depart?.toLocaleString()} MAD
                          </td>
                          <td>
                            <strong style={{ color: auc.highestBid > auc.prix_depart ? 'var(--success-green)' : 'var(--admin-gold)', fontSize: '0.95rem' }}>
                              {auc.highestBid?.toLocaleString()} MAD
                            </strong>
                          </td>
                          <td>
                            <span style={{
                              padding: '2px 8px',
                              borderRadius: '12px',
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              background: (auc.bidsCount || 0) > 0 ? 'rgba(16, 185, 129, 0.15)' : 'rgba(156, 163, 175, 0.15)',
                              color: (auc.bidsCount || 0) > 0 ? '#10b981' : 'var(--text-gray)'
                            }}>
                              {auc.bidsCount || 0} {lang === 'ar' ? 'عرض' : 'offre'}{(auc.bidsCount || 0) > 1 && lang === 'fr' ? 's' : ''}
                            </span>
                          </td>
                          <td style={{ fontSize: '0.82rem' }}>
                            <div>{new Date(auc.date_fin).toLocaleDateString(lang === 'ar' ? 'ar-MA' : 'fr-FR')}</div>
                            <div style={{ fontSize: '0.75rem', color: isExpired ? '#ef4444' : 'var(--text-gray)' }}>
                              {isExpired ? (lang === 'ar' ? 'منتهي' : 'Expirée') : new Date(auc.date_fin).toLocaleTimeString(lang === 'ar' ? 'ar-MA' : 'fr-FR', { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </td>
                          <td>
                            <span style={{
                              padding: '3px 8px',
                              borderRadius: '4px',
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              background: isActive ? 'rgba(16,185,129,0.15)' : (auc.statut === 'Resolved' ? 'rgba(212,175,55,0.15)' : 'rgba(239,68,68,0.15)'),
                              color: isActive ? '#10b981' : (auc.statut === 'Resolved' ? 'var(--admin-gold)' : '#ef4444')
                            }}>
                              {isActive ? (lang === 'ar' ? '🟢 مباشر' : '🟢 En direct') : (auc.statut === 'Resolved' ? (lang === 'ar' ? '🏆 مكتمل' : '🏆 Adjugé') : (isExpired ? (lang === 'ar' ? '⏳ منتهي' : '⏳ Terminée') : (lang === 'ar' ? '❌ ملغى' : '❌ Annulée')))}
                            </span>
                          </td>
                          <td>
                            <div style={{ display: 'flex', gap: '6px' }}>
                              <button
                                className="btn-approve"
                                style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                                title="Voir les offres déposées"
                                onClick={() => handleViewBids(auc)}
                              >
                                👁️ {t('bids')}
                              </button>
                              {isActive && (
                                <button
                                  className="btn-outline-gold"
                                  style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                                  title="Clôturer et désigner le gagnant"
                                  onClick={() => handleResolveAuction(auc.id)}
                                >
                                  🏆 {lang === 'ar' ? 'إقفال' : 'Clôturer'}
                                </button>
                              )}
                              {auc.statut !== 'Cancelled' && (
                                <button
                                  className="btn-reject"
                                  style={{ padding: '4px 8px', fontSize: '0.75rem', margin: 0 }}
                                  title="Annuler l'enchère"
                                  onClick={() => handleCancelAuction(auc.id)}
                                >
                                  ✕
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'subscriptions' && (
          <div>
            {/* Top Metrics Row */}
            <div className="stats-row" style={{ marginBottom: '25px' }}>
              <div className="stat-card" style={{ borderLeft: '4px solid var(--admin-gold)' }}>
                <span className="stat-title">{lang === 'ar' ? 'الدخل الشهري المتكرر (MRR)' : 'Revenu Mensuel Récurrent (MRR)'}</span>
                <span className="stat-num" style={{ color: 'var(--admin-gold)' }}>
                  {(subscriptionsData?.stats?.mrr || 0).toLocaleString()} MAD
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--success-green)' }}>{lang === 'ar' ? '+18% مقارنة بالشهر السابق' : '+18% vs mois précédent'}</span>
              </div>
              <div className="stat-card">
                <span className="stat-title">{lang === 'ar' ? 'الدخل السنوي المتوقع (ARR)' : 'Revenu Annuel Projeté (ARR)'}</span>
                <span className="stat-num">
                  {(subscriptionsData?.stats?.arr || 0).toLocaleString()} MAD
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-gray)' }}>{lang === 'ar' ? 'قاعدة الاشتراكات النشطة' : 'Base abonnements actifs'}</span>
              </div>
              <div className="stat-card">
                <span className="stat-title">{lang === 'ar' ? 'التجار المشتركون المؤدون' : 'Commerçants Abonnés Payants'}</span>
                <span className="stat-num">
                  {subscriptionsData?.stats?.subscribed_paying || 0} / {subscriptionsData?.stats?.total_merchants || 0}
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--admin-gold)' }}>
                  {subscriptionsData?.stats?.total_merchants ? Math.round(((subscriptionsData.stats.subscribed_paying || 0) / subscriptionsData.stats.total_merchants) * 100) : 0}% {lang === 'ar' ? 'نسبة التحويل' : 'de conversion'}
                </span>
              </div>
              <div className="stat-card">
                <span className="stat-title">{lang === 'ar' ? 'التوزيع حسب الباقة' : 'Répartition par Formule'}</span>
                <div style={{ display: 'flex', gap: '8px', marginTop: '8px', fontSize: '0.78rem', flexWrap: 'wrap' }}>
                  <span style={{ padding: '3px 8px', background: 'rgba(156,163,175,0.15)', borderRadius: '4px' }}>
                    Pass: <strong>{subscriptionsData?.stats?.by_plan?.plan_starter || 0}</strong>
                  </span>
                  <span style={{ padding: '3px 8px', background: 'rgba(212,175,55,0.15)', color: 'var(--admin-gold)', borderRadius: '4px' }}>
                    Prestige: <strong>{subscriptionsData?.stats?.by_plan?.plan_pro || 0}</strong>
                  </span>
                  <span style={{ padding: '3px 8px', background: 'rgba(183,110,121,0.15)', color: '#b76e79', borderRadius: '4px' }}>
                    VIP: <strong>{subscriptionsData?.stats?.by_plan?.plan_vip || 0}</strong>
                  </span>
                </div>
              </div>
            </div>

            {/* Merchant Subscriptions Table */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
              <h2 style={{ fontFamily: 'Playfair Display', margin: 0 }}>{t('subscriptionsTitle')}</h2>
              <button
                className="btn-gold"
                style={{ margin: 0, padding: '8px 18px', fontSize: '0.85rem' }}
                onClick={() => handleOpenAddUser('commercant')}
              >
                ➕ {lang === 'ar' ? 'إضافة تاجر جديد' : 'Nouveau Commerçant'}
              </button>
            </div>

            <div className="table-container" style={{ marginBottom: '36px' }}>
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>{lang === 'ar' ? 'المتجر والتاجر' : 'Boutique & Marchand'}</th>
                    <th>{lang === 'ar' ? 'الباقة الحالية' : 'Forfait Actif'}</th>
                    <th>{lang === 'ar' ? 'حصة المعروضات' : 'Quota Dépôts Bijoux'}</th>
                    <th>{t('commissions')}</th>
                    <th>{lang === 'ar' ? 'السعر / الدورة' : 'Tarif / Cycle'}</th>
                    <th>{t('status')}</th>
                    <th>{lang === 'ar' ? 'تاريخ التجديد' : 'Échéance'}</th>
                    <th>{t('action')}</th>
                  </tr>
                </thead>
                <tbody>
                  {(subscriptionsData?.merchants || []).map(m => {
                    const sub = m.subscription || {};
                    return (
                      <tr key={m.id}>
                        <td>
                          <strong style={{ color: 'var(--text-white)' }}>{m.shopName}</strong>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-gray)' }}>{m.nom} • {m.email}</div>
                          {m.numero_patente && (
                            <div style={{ fontSize: '0.72rem', marginTop: '3px', color: 'var(--admin-gold)' }}>
                              📜 Patente: <strong>{m.numero_patente}</strong>
                              {m.patente_document && (
                                <a 
                                  href={`${API_URL.replace('/api', '')}${m.patente_document}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  style={{ marginLeft: '6px', color: '#38bdf8', textDecoration: 'underline' }}
                                >
                                  📄 {lang === 'ar' ? 'معاينة' : 'Voir'}
                                </a>
                              )}
                            </div>
                          )}
                          {(m.numero_bureau_garantie || m.bureau_garantie_document) && (
                            <div style={{ fontSize: '0.72rem', marginTop: '3px', color: '#fbbf24' }}>
                              🏛️ {lang === 'ar' ? 'الضمانة :' : 'Garantie :'} <strong>{m.numero_bureau_garantie || '-'}</strong>
                              {m.bureau_garantie_document && (
                                <a 
                                  href={`${API_URL.replace('/api', '')}${m.bureau_garantie_document}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  style={{ marginLeft: '6px', color: '#38bdf8', textDecoration: 'underline' }}
                                >
                                  🏛️ {lang === 'ar' ? 'معاينة' : 'Voir'}
                                </a>
                              )}
                            </div>
                          )}
                          {(m.numero_cin || m.cin_recto_document || m.cin_verso_document) && (
                            <div style={{ fontSize: '0.72rem', marginTop: '3px', color: '#cbd5e1' }}>
                              🪪 CIN: <strong>{m.numero_cin || '-'}</strong>
                              {m.cin_recto_document && (
                                <a 
                                  href={`${API_URL.replace('/api', '')}${m.cin_recto_document}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  style={{ marginLeft: '6px', color: '#38bdf8', textDecoration: 'underline' }}
                                >
                                  {lang === 'ar' ? 'الوجه' : 'Recto'}
                                </a>
                              )}
                              {m.cin_verso_document && (
                                <a 
                                  href={`${API_URL.replace('/api', '')}${m.cin_verso_document}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  style={{ marginLeft: '6px', color: '#38bdf8', textDecoration: 'underline' }}
                                >
                                  {lang === 'ar' ? 'الظهر' : 'Verso'}
                                </a>
                              )}
                            </div>
                          )}
                        </td>
                        <td>
                          <span style={{
                            padding: '3px 10px',
                            borderRadius: '12px',
                            background: sub.plan_id === 'plan_vip' ? 'rgba(183,110,121,0.2)' : (sub.plan_id === 'plan_pro' ? 'rgba(212,175,55,0.2)' : 'rgba(156,163,175,0.15)'),
                            color: sub.plan_id === 'plan_vip' ? '#b76e79' : (sub.plan_id === 'plan_pro' ? 'var(--admin-gold)' : 'var(--text-gray)'),
                            fontSize: '0.78rem',
                            fontWeight: 800,
                            border: '1px solid var(--border-gold)'
                          }}>
                            {sub.plan_name || 'Pass Essentiel'}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontSize: '0.82rem', fontWeight: 700 }}>{m.current_products_count} / {m.max_products > 1000 ? '∞' : m.max_products}</span>
                            <div style={{ width: '60px', height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
                              <div style={{ width: `${m.usage_percentage}%`, height: '100%', background: 'var(--admin-gold)' }} />
                            </div>
                          </div>
                        </td>
                        <td style={{ fontWeight: 700, color: 'var(--admin-gold)' }}>
                          {sub.commission_rate || 8}%
                        </td>
                        <td>
                          <strong>{sub.price?.toLocaleString()} MAD</strong>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-gray)', display: 'block' }}>
                            {sub.billing_cycle === 'annual' ? (lang === 'ar' ? 'سنوي' : 'Annuel') : (lang === 'ar' ? 'شهري' : 'Mensuel')}
                          </span>
                        </td>
                        <td>
                          <span style={{
                            padding: '2px 8px',
                            borderRadius: '4px',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            background: sub.status === 'active' ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
                            color: sub.status === 'active' ? '#10b981' : '#ef4444'
                          }}>
                            {sub.status === 'active' ? (lang === 'ar' ? 'نشط' : 'Actif') : (lang === 'ar' ? 'معلق' : 'Suspendu')}
                          </span>
                        </td>
                        <td style={{ fontSize: '0.8rem', color: 'var(--text-gray)' }}>
                          {sub.end_date ? new Date(sub.end_date).toLocaleDateString(lang === 'ar' ? 'ar-MA' : 'fr-FR') : '-'}
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '6px' }}>
                            <button
                              className="btn-approve"
                              style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                              title="Changer ou surclasser le forfait"
                              onClick={() => setMerchantSubModal(m)}
                            >
                              ⚙️ {t('edit')}
                            </button>
                            {sub.status === 'active' ? (
                              <button
                                className="btn-reject"
                                style={{ padding: '4px 8px', fontSize: '0.75rem', margin: 0 }}
                                title="Suspendre l'abonnement"
                                onClick={() => handleUpdateMerchantSubStatus(m.id, 'suspended')}
                              >
                                ⏸️
                              </button>
                            ) : (
                              <button
                                className="btn-approve"
                                style={{ padding: '4px 8px', fontSize: '0.75rem', margin: 0 }}
                                title="Réactiver l'abonnement"
                                onClick={() => handleUpdateMerchantSubStatus(m.id, 'active')}
                              >
                                ▶️
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Plans Configuration Settings Editor */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '12px' }}>
              <h2 style={{ fontFamily: 'Playfair Display', margin: 0 }}>{lang === 'ar' ? 'إعدادات باقات واشتراكات التجار' : 'Configuration des Tarifs & Quotas des Forfaits'}</h2>
              <button
                className="btn-gold"
                style={{ margin: 0, padding: '8px 18px', fontSize: '0.85rem' }}
                onClick={() => setEditingPlanModal({
                  name: '',
                  tagline: 'Formule sur mesure pour bijoutiers',
                  price_monthly: 390,
                  price_annual: 3700,
                  max_products: 15,
                  commission_rate: 5,
                  badge: '💎 Joaillier Élite',
                  popular: false,
                  color: '#b38728'
                })}
              >
                ➕ {lang === 'ar' ? 'إنشاء باقة جديدة' : 'Créer un Nouveau Forfait'}
              </button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginBottom: '36px' }}>
              {(subscriptionsData?.plans || []).map(plan => (
                <div key={plan.id} style={{ background: 'var(--bg-card)', border: '1px solid var(--border-gold)', borderRadius: 'var(--radius-md)', padding: '22px', boxShadow: 'var(--shadow)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <h3 style={{ fontSize: '1.2rem', color: 'var(--admin-gold)', margin: 0 }}>{plan.name}</h3>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button
                        className="btn-outline-gold"
                        style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                        onClick={() => setEditingPlanModal({ ...plan })}
                      >
                        ✏️ {t('edit')}
                      </button>
                      <button
                        className="btn-reject"
                        style={{ padding: '4px 8px', fontSize: '0.75rem', margin: 0 }}
                        title={lang === 'ar' ? 'حذف هذه الباقة' : 'Supprimer ce forfait'}
                        onClick={() => handleDeletePlan(plan.id)}
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                  <p style={{ color: 'var(--text-gray)', fontSize: '0.82rem', marginBottom: '16px' }}>{plan.tagline}</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.85rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-gray)' }}>{lang === 'ar' ? 'السعر الشهري :' : 'Prix Mensuel :'}</span>
                      <strong>{plan.price_monthly} MAD</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-gray)' }}>{lang === 'ar' ? 'السعر السنوي :' : 'Prix Annuel :'}</span>
                      <strong>{plan.price_annual} MAD</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-gray)' }}>{lang === 'ar' ? 'أقصى عدد معروضات :' : 'Dépôts Bijoux Max :'}</span>
                      <strong style={{ color: 'var(--admin-gold)' }}>{plan.max_products > 1000 ? (lang === 'ar' ? 'غير محدود' : 'Illimité') : plan.max_products}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-gray)' }}>{lang === 'ar' ? 'عمولة المنصة :' : 'Commission Plateforme :'}</span>
                      <strong style={{ color: '#10b981' }}>{plan.commission_rate}%</strong>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Invoices Log */}
            <h2 style={{ fontFamily: 'Playfair Display', marginBottom: '16px' }}>{lang === 'ar' ? 'سجل الفواتير والدفعات' : 'Historique Global des Factures & Encaissements'}</h2>
            <div className="table-container">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>{lang === 'ar' ? 'رقم الفاتورة' : 'N° Facture'}</th>
                    <th>{t('shop')}</th>
                    <th>{lang === 'ar' ? 'الباقة' : 'Forfait'}</th>
                    <th>{lang === 'ar' ? 'المبلغ' : 'Montant'}</th>
                    <th>{lang === 'ar' ? 'الدورة' : 'Cycle'}</th>
                    <th>{t('date')}</th>
                    <th>{t('status')}</th>
                  </tr>
                </thead>
                <tbody>
                  {(subscriptionsData?.invoices || []).map(inv => (
                    <tr key={inv.id}>
                      <td style={{ fontWeight: 'bold' }}>{inv.invoice_number}</td>
                      <td>{inv.merchant_name}</td>
                      <td style={{ color: 'var(--admin-gold)' }}>{inv.plan_name}</td>
                      <td><strong>{inv.amount?.toLocaleString()} MAD</strong></td>
                      <td>{inv.billing_cycle === 'annual' ? (lang === 'ar' ? 'سنوي' : 'Annuel') : (lang === 'ar' ? 'شهري' : 'Mensuel')}</td>
                      <td style={{ color: 'var(--text-gray)', fontSize: '0.8rem' }}>{new Date(inv.date).toLocaleDateString(lang === 'ar' ? 'ar-MA' : 'fr-FR')}</td>
                      <td>
                        <span style={{ padding: '2px 8px', borderRadius: '4px', background: 'rgba(16,185,129,0.15)', color: '#10b981', fontSize: '0.75rem', fontWeight: 700 }}>
                          {inv.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'products' && (
          <div>
            {isMerchant && (
              <div style={{
                background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.15) 0%, rgba(179, 135, 40, 0.06) 100%)',
                border: '1px solid var(--border-gold)',
                borderRadius: 'var(--radius-md)',
                padding: '18px 24px',
                marginBottom: '22px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '14px',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)'
              }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.15rem', color: 'var(--admin-gold)', fontFamily: 'Playfair Display' }}>
                    👋 {lang === 'ar' ? `مرحباً بك، ${adminUser?.shopName || adminUser?.nom}` : `Bienvenue, ${adminUser?.shopName || adminUser?.nom}`}
                  </h3>
                  <p style={{ margin: '6px 0 0', fontSize: '0.88rem', color: 'var(--text-gray)' }}>
                    {lang === 'ar' 
                      ? 'هذا الفضاء مخصص لإيداع ونشر مجوهراتك في المنصة. يمكنك إضافة منتجات جديدة وتتبع حالتها ومبيعاتها مباشرة.' 
                      : 'Cet espace vous permet de déposer et publier vos créations sur la plateforme, gérer votre catalogue et suivre vos ventes en temps réel.'}
                  </p>
                </div>
                <button
                  type="button"
                  className="btn-gold"
                  style={{ padding: '10px 22px', fontSize: '0.88rem', display: 'inline-flex', alignItems: 'center', gap: '8px', fontWeight: 700 }}
                  onClick={handleOpenAddProduct}
                >
                  <span>✨</span>
                  <span>{lang === 'ar' ? 'إيداع مجوهرات جديدة' : 'Déposer un bijou'}</span>
                </button>
              </div>
            )}

            <div className="admin-section-header products-header-wrap">
              <div className="products-title-actions">
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                  <h2 style={{ fontFamily: 'Playfair Display', margin: 0 }}>
                    {isMerchant ? (lang === 'ar' ? '💎 مجوهراتي ومقالاتي' : '💎 Mes Bijoux & Articles') : t('productManagement')}
                  </h2>
                  <button type="button" className="btn-approve" style={{ padding: '8px 16px', fontSize: '0.85rem' }} onClick={handleOpenAddProduct}>
                    ➕ {isMerchant ? (lang === 'ar' ? 'إيداع مجوهرات جديدة' : 'Déposer un bijou') : t('addProduct')}
                  </button>
                </div>

                {/* View Switcher Toggle */}
                <div className="view-mode-toggle-group">
                  <button
                    type="button"
                    className={`view-mode-btn ${productsViewMode === 'cards' ? 'active' : ''}`}
                    onClick={() => setProductsViewMode('cards')}
                    title={lang === 'ar' ? 'عرض بالبطاقات' : 'Vue Cartes'}
                  >
                    🗂️ {lang === 'ar' ? 'بطاقات' : 'Cartes'}
                  </button>
                  <button
                    type="button"
                    className={`view-mode-btn ${productsViewMode === 'table' ? 'active' : ''}`}
                    onClick={() => setProductsViewMode('table')}
                    title={lang === 'ar' ? 'عرض بالجدول' : 'Vue Tableau'}
                  >
                    📊 {lang === 'ar' ? 'جدول' : 'Tableau'}
                  </button>
                </div>
              </div>
              
              <div className="products-search-filters">
                <input 
                  type="text" 
                  className="form-input search-input" 
                  placeholder={t('searchProduct')}
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                />
                
                <div className="filters-dropdowns-row">
                  <select 
                    className="form-input filter-dropdown" 
                    value={productStatusFilter}
                    onChange={(e) => setProductStatusFilter(e.target.value)}
                  >
                    <option value="All">{t('filterStatus')}: {t('allProducts')}</option>
                    <option value="Validated">{t('statusApproved')}</option>
                    <option value="Pending">{t('statusPending')}</option>
                    <option value="Rejected">{t('statusRejected')}</option>
                  </select>

                  <select 
                    className="form-input filter-dropdown" 
                    value={productCategoryFilter}
                    onChange={(e) => setProductCategoryFilter(e.target.value)}
                  >
                    <option value="All">{t('filterCategory')}: {t('categories')}</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>
                        {lang === 'fr' ? cat.nom_fr : (lang === 'ar' ? cat.nom_ar : cat.nom_en)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* View Mode 1: Mobile Cards Grid */}
            {productsViewMode === 'cards' && (
              <div className="admin-product-cards-grid">
                {products.filter(p => {
                  const q = (productSearch || '').toLowerCase();
                  const matchesSearch = !q ||
                    (p.titre || '').toLowerCase().includes(q) ||
                    (p.titre_fr || '').toLowerCase().includes(q) ||
                    (p.titre_ar || '').toLowerCase().includes(q) ||
                    (p.titre_en || '').toLowerCase().includes(q) ||
                    (p.description || '').toLowerCase().includes(q) ||
                    (p.description_fr || '').toLowerCase().includes(q) ||
                    (p.description_ar || '').toLowerCase().includes(q) ||
                    (p.description_en || '').toLowerCase().includes(q) ||
                    (p.id || '').toLowerCase().includes(q);
                  const matchesStatus = productStatusFilter === 'All' || p.statut === productStatusFilter;
                  const matchesCategory = productCategoryFilter === 'All' || p.category_id === productCategoryFilter;
                  const matchesMerchant = !isMerchant || p.commercant_id === adminUser?.id;
                  return matchesSearch && matchesStatus && matchesCategory && matchesMerchant;
                }).map(p => {
                  const shop = users.find(u => u.id === p.commercant_id)?.shopName || (lang === 'ar' ? 'تاجر غير محدد' : 'Commerçant Inconnu');
                  const category = categories.find(c => c.id === p.category_id);
                  const catName = category ? (lang === 'ar' ? (category.nom_ar || category.nom_fr) : (category.nom_fr || category.nom_ar)) : (lang === 'ar' ? 'بدون فئة' : 'Sans Catégorie');
                  const displayTitle = (lang === 'ar' && p.titre_ar) ? p.titre_ar : (p.titre_fr || p.titre);
                  return (
                    <div key={p.id} className="admin-product-card-item">
                      <div className="product-card-top">
                        <div className="product-card-thumb-wrap">
                          {p.images?.[0] ? (
                            <img src={p.images[0]} alt="" className="product-card-thumb" />
                          ) : (
                            <div className="product-card-thumb-placeholder">💎</div>
                          )}
                        </div>
                        <div className="product-card-header-info">
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '6px' }}>
                            <h4 className="product-card-title">{displayTitle}</h4>
                            <span style={{
                              backgroundColor: p.statut === 'Validated' ? 'rgba(46, 204, 113, 0.15)' : (p.statut === 'Rejected' ? 'rgba(231, 76, 60, 0.15)' : 'rgba(255, 165, 0, 0.15)'),
                              color: p.statut === 'Validated' ? '#2ecc71' : (p.statut === 'Rejected' ? '#e74c3c' : '#ffa500'),
                              padding: '2px 8px',
                              borderRadius: '4px',
                              fontSize: '0.72rem',
                              fontWeight: 'bold',
                              whiteSpace: 'nowrap',
                              flexShrink: 0
                            }}>
                              {p.statut === 'Validated' ? t('statusApproved') : (p.statut === 'Rejected' ? t('statusRejected') : t('statusPending'))}
                            </span>
                          </div>

                          <div className="product-card-tags-row">
                            <span className="product-card-tag cat-tag">🏷️ {catName}</span>
                            <span className="product-card-tag id-tag">#{p.id}</span>
                            {p.titre_ar && <span className="product-card-lang-tag active">AR</span>}
                            {(p.titre_fr || p.titre) && <span className="product-card-lang-tag active">FR</span>}
                          </div>
                        </div>
                      </div>

                      {/* Specs & Details Grid */}
                      <div className="product-card-details-grid">
                        <div className="detail-item">
                          <span className="detail-label">{t('price')} :</span>
                          <strong className="detail-value price-val">{p.prix?.toLocaleString()} MAD</strong>
                        </div>
                        <div className="detail-item">
                          <span className="detail-label">{t('stock')} :</span>
                          <span className={`detail-value ${p.stock <= 2 ? 'stock-low' : ''}`}>
                            📦 {p.stock} {lang === 'ar' ? 'قطعة' : 'en stock'}
                          </span>
                        </div>
                        <div className="detail-item">
                          <span className="detail-label">{t('merchant')} :</span>
                          <span className="detail-value text-truncate">🏪 {shop}</span>
                        </div>
                        <div className="detail-item">
                          <span className="detail-label">{lang === 'ar' ? 'العيار والمدينة' : 'Détails'} :</span>
                          <span className="detail-value">✨ {p.purete || '18k'} • {p.gramme}g • {p.city}</span>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="product-card-actions">
                        <button 
                          type="button"
                          className="btn-approve btn-card-action" 
                          onClick={() => handleOpenEditProduct(p)}
                        >
                          ✏️ {t('edit')}
                        </button>
                        <button 
                          type="button"
                          className="btn-reject btn-card-action" 
                          onClick={() => handleDeleteProduct(p.id)}
                        >
                          🗑️ {t('delete')}
                        </button>
                      </div>
                    </div>
                  );
                })}
                {products.filter(p => {
                  const q = (productSearch || '').toLowerCase();
                  const matchesSearch = !q ||
                    (p.titre || '').toLowerCase().includes(q) ||
                    (p.id || '').toLowerCase().includes(q) ||
                    (p.description || '').toLowerCase().includes(q);
                  const matchesStatus = productStatusFilter === 'All' || p.statut === productStatusFilter;
                  const matchesCategory = productCategoryFilter === 'All' || p.category_id === productCategoryFilter;
                  return matchesSearch && matchesStatus && matchesCategory;
                }).length === 0 && (
                  <div className="empty-products-card">
                    {lang === 'ar' ? 'لم يتم العثور على أي معروضات.' : 'Aucun article trouvé.'}
                  </div>
                )}
              </div>
            )}

            {/* View Mode 2: Classical Table */}
            {productsViewMode === 'table' && (
              <div className="table-container">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>{t('products')}</th>
                      <th>{t('merchant')}</th>
                      <th>{t('category')}</th>
                      <th>{t('price')}</th>
                      <th>{t('stock')}</th>
                      <th>{t('status')}</th>
                      <th>{t('action')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.filter(p => {
                      const q = (productSearch || '').toLowerCase();
                      const matchesSearch = !q ||
                        (p.titre || '').toLowerCase().includes(q) ||
                        (p.titre_fr || '').toLowerCase().includes(q) ||
                        (p.titre_ar || '').toLowerCase().includes(q) ||
                        (p.titre_en || '').toLowerCase().includes(q) ||
                        (p.description || '').toLowerCase().includes(q) ||
                        (p.description_fr || '').toLowerCase().includes(q) ||
                        (p.description_ar || '').toLowerCase().includes(q) ||
                        (p.description_en || '').toLowerCase().includes(q) ||
                        (p.id || '').toLowerCase().includes(q);
                      const matchesStatus = productStatusFilter === 'All' || p.statut === productStatusFilter;
                      const matchesCategory = productCategoryFilter === 'All' || p.category_id === productCategoryFilter;
                      const matchesMerchant = !isMerchant || p.commercant_id === adminUser?.id;
                      return matchesSearch && matchesStatus && matchesCategory && matchesMerchant;
                    }).map(p => {
                      const shop = users.find(u => u.id === p.commercant_id)?.shopName || (lang === 'ar' ? 'تاجر غير محدد' : 'Commerçant Inconnu');
                      const category = categories.find(c => c.id === p.category_id);
                      const catName = category ? (lang === 'ar' ? (category.nom_ar || category.nom_fr) : (category.nom_fr || category.nom_ar)) : (lang === 'ar' ? 'بدون فئة' : 'Sans Catégorie');
                      const displayTitle = (lang === 'ar' && p.titre_ar) ? p.titre_ar : (p.titre_fr || p.titre);
                      return (
                        <tr key={p.id}>
                          <td style={{ color: 'var(--text-gray)', fontSize: '0.8rem' }}>{p.id}</td>
                          <td style={{ fontWeight: 'bold' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              {p.images?.[0] && (
                                <img src={p.images[0]} alt="" style={{ width: '42px', height: '42px', borderRadius: '6px', objectFit: 'cover', border: '1px solid var(--border-gold)' }} />
                              )}
                              <div>
                                <div>{displayTitle}</div>
                                <div style={{ display: 'flex', gap: '4px', marginTop: '3px', alignItems: 'center' }}>
                                  <span style={{ fontSize: '0.65rem', padding: '1px 5px', borderRadius: '3px', fontWeight: 700, background: p.titre_ar ? 'rgba(46, 204, 113, 0.2)' : 'rgba(255,255,255,0.1)', color: p.titre_ar ? '#27ae60' : 'var(--text-gray)' }}>AR</span>
                                  <span style={{ fontSize: '0.65rem', padding: '1px 5px', borderRadius: '3px', fontWeight: 700, background: (p.titre_fr || p.titre) ? 'rgba(46, 204, 113, 0.2)' : 'rgba(255,255,255,0.1)', color: (p.titre_fr || p.titre) ? '#27ae60' : 'var(--text-gray)' }}>FR</span>
                                  <span style={{ fontSize: '0.72rem', color: 'var(--text-gray)', marginLeft: '4px' }}>• {p.purete} • {p.gramme}g • {p.city}</span>
                                </div>
                              </div>
                            </div>
                          </td>
                          <td>{shop}</td>
                          <td>{catName}</td>
                          <td style={{ color: 'var(--admin-gold)', fontWeight: 'bold' }}>{p.prix} MAD</td>
                          <td>
                            <span style={{
                              color: p.stock <= 2 ? 'var(--danger-red)' : 'inherit',
                              fontWeight: p.stock <= 2 ? 'bold' : 'normal'
                            }}>
                              {p.stock}
                            </span>
                          </td>
                          <td>
                            <span style={{
                              backgroundColor: p.statut === 'Validated' ? 'rgba(46, 204, 113, 0.15)' : (p.statut === 'Rejected' ? 'rgba(231, 76, 60, 0.15)' : 'rgba(255, 165, 0, 0.15)'),
                              color: p.statut === 'Validated' ? '#2ecc71' : (p.statut === 'Rejected' ? '#e74c3c' : '#ffa500'),
                              padding: '2px 8px',
                              borderRadius: '3px',
                              fontSize: '0.75rem',
                              fontWeight: 'bold'
                            }}>
                              {p.statut === 'Validated' ? t('statusApproved') : (p.statut === 'Rejected' ? t('statusRejected') : t('statusPending'))}
                            </span>
                          </td>
                          <td>
                            <div style={{ display: 'flex', gap: '8px' }}>
                              <button className="btn-approve" style={{ padding: '6px 12px', fontSize: '0.75rem' }} onClick={() => handleOpenEditProduct(p)}>
                                ✏️
                              </button>
                              <button className="btn-reject" style={{ padding: '6px 12px', fontSize: '0.75rem', margin: 0 }} onClick={() => handleDeleteProduct(p.id)}>
                                🗑️
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    {products.filter(p => {
                      const matchesSearch = p.titre?.toLowerCase().includes(productSearch.toLowerCase()) || 
                                            p.id?.toLowerCase().includes(productSearch.toLowerCase()) ||
                                            p.description?.toLowerCase().includes(productSearch.toLowerCase());
                      const matchesStatus = productStatusFilter === 'All' || p.statut === productStatusFilter;
                      const matchesCategory = productCategoryFilter === 'All' || p.category_id === productCategoryFilter;
                      return matchesSearch && matchesStatus && matchesCategory;
                    }).length === 0 && (
                      <tr>
                        <td colSpan="8" style={{ textAlign: 'center', padding: '20px', color: 'var(--text-gray)' }}>
                          {lang === 'ar' ? 'لم يتم العثور على أي معروضات.' : 'Aucun article trouvé.'}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'gold_rates' && (
          hasPermission('manage_gold_rates') ? (
            <div>
              {/* Header & Status */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '15px' }}>
              <div>
                <h2 style={{ fontFamily: 'Playfair Display', margin: '0 0 6px 0', fontSize: '1.8rem', color: 'var(--admin-gold)' }}>
                  {lang === 'ar' ? '🥇 إدارة ومتابعة سعر الذهب عيار 18 بالمغرب' : '🥇 Gestion & Cours Officiel de l\'Or 18K au Maroc'}
                </h2>
                <p style={{ color: 'var(--text-gray)', margin: 0, fontSize: '0.88rem' }}>
                  {lang === 'ar' 
                    ? 'تحديد ومتابعة سعر غرام الذهب عيار 18 قيراط (المعيار الرسمي المعتمد للصياغة والمجوهرات بالمغرب)' 
                    : 'Fixation et suivi du cours officiel du gramme d\'or 18 carats (Standard de référence au Maroc)'}
                </p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ 
                  display: 'inline-flex', 
                  alignItems: 'center', 
                  gap: '6px', 
                  background: 'rgba(16, 185, 129, 0.12)', 
                  color: '#10b981', 
                  padding: '6px 14px', 
                  borderRadius: '20px', 
                  fontSize: '0.82rem', 
                  fontWeight: 700,
                  border: '1px solid rgba(16, 185, 129, 0.25)'
                }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', display: 'inline-block', boxShadow: '0 0 8px #10b981' }}></span>
                  {lang === 'ar' ? 'الخدمة متصلة ونشطة' : 'Cotation en direct'}
                </span>
              </div>
            </div>

            {/* Current Rates Cards (Exclusive 18K Focus) */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '18px', marginBottom: '28px' }}>
              {/* Main 18K Card */}
              <div style={{ background: 'var(--bg-card)', border: '2px solid var(--admin-gold)', borderRadius: 'var(--radius-md)', padding: '24px', boxShadow: '0 8px 24px rgba(212,175,55,0.15)', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: '-10px', right: lang === 'ar' ? 'auto' : '-10px', left: lang === 'ar' ? '-10px' : 'auto', fontSize: '4rem', opacity: 0.08, pointerEvents: 'none' }}>🥇</div>
                <div style={{ fontSize: '0.85rem', color: 'var(--admin-gold)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>
                  {lang === 'ar' ? 'ذهب عيار 18 قيراط (المعيار الرسمي)' : 'Or 18 Karats (Standard Maroc)'}
                </div>
                <div style={{ fontSize: '2.8rem', fontWeight: 900, color: 'var(--text-white)', lineHeight: 1.1, marginBottom: '8px' }}>
                  {goldRatesData.currentPrice18k || 1045} <span style={{ fontSize: '1.2rem', color: 'var(--admin-gold)', fontWeight: 700 }}>MAD / g</span>
                </div>
                <div style={{ fontSize: '0.82rem', color: '#10b981', fontWeight: 700 }}>
                  ▲ {lang === 'ar' ? 'السعر الحالي المعتمد بالمنصة' : 'Cotation officielle active'}
                </div>
              </div>

              {/* Silver 1000 Card */}
              <div style={{ background: 'var(--bg-card)', border: '2px solid #cbd5e1', borderRadius: 'var(--radius-md)', padding: '24px', boxShadow: '0 8px 24px rgba(203,213,225,0.15)', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: '-10px', right: lang === 'ar' ? 'auto' : '-10px', left: lang === 'ar' ? '-10px' : 'auto', opacity: 0.1, pointerEvents: 'none' }}>
                  <SilverIcon size={80} />
                </div>
                <div style={{ fontSize: '0.85rem', color: '#cbd5e1', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <SilverIcon size={20} />
                  <span>{lang === 'ar' ? 'فضة عيار 1000 (المعيار الرسمي)' : 'Argent 1000 (Standard Maroc)'}</span>
                </div>
                <div style={{ fontSize: '2.8rem', fontWeight: 900, color: 'var(--text-white)', lineHeight: 1.1, marginBottom: '8px' }}>
                  {goldRatesData.currentPriceSilver || 14.50} <span style={{ fontSize: '1.2rem', color: '#cbd5e1', fontWeight: 700 }}>MAD / g</span>
                </div>
                <div style={{ fontSize: '0.82rem', color: '#10b981', fontWeight: 700 }}>
                  ▲ {lang === 'ar' ? 'السعر الحالي المعتمد بالمنصة' : 'Cotation officielle active'}
                </div>
              </div>

              {/* Info Card */}
              <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-gold)', borderRadius: 'var(--radius-md)', padding: '24px', boxShadow: 'var(--shadow)', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-gray)', fontWeight: 700, textTransform: 'uppercase' }}>
                    {lang === 'ar' ? 'معلومات التحديث' : 'Dernière mise à jour'}
                  </div>
                  <button
                    type="button"
                    onClick={handleSyncRailwayGold}
                    disabled={isUpdatingGold}
                    style={{
                      background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.2), rgba(212, 175, 55, 0.05))',
                      border: '1px solid var(--admin-gold)',
                      color: 'var(--admin-gold)',
                      borderRadius: '6px',
                      padding: '6px 12px',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      transition: 'all 0.2s'
                    }}
                    title="Synchroniser avec le backend PrixOr Railway"
                  >
                    <span>{isUpdatingGold ? '⏳' : '🔄'}</span>
                    <span>{isUpdatingGold ? (lang === 'ar' ? 'جاري المزامنة...' : 'Synchronisation...') : (lang === 'ar' ? 'مزامنة مع PrixOr' : 'Synchroniser PrixOr')}</span>
                  </button>
                </div>
                <div style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-white)', marginBottom: '4px' }}>
                  {goldRatesData.lastUpdated ? new Date(goldRatesData.lastUpdated).toLocaleString(lang === 'ar' ? 'ar-MA' : 'fr-FR') : '20/09/2026'}
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-gray)' }}>
                  {lang === 'ar' ? `المسؤول / المصدر: ${goldRatesData.updatedBy || 'Super-Admin'}` : `Source: ${goldRatesData.updatedBy || 'Super-Admin'}`}
                </div>
              </div>
            </div>

            {/* Update Form Card */}
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-gold)', borderRadius: 'var(--radius-md)', padding: '24px', marginBottom: '32px', boxShadow: 'var(--shadow)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '10px' }}>
                <h3 style={{ fontFamily: 'Playfair Display', margin: 0, fontSize: '1.3rem', color: 'var(--admin-gold)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>✏️</span>
                  <span>{lang === 'ar' ? 'تحديد وضبط أسعار الذهب والفضة اليوم' : 'Paramétrer & Mettre à jour les cours de l\'Or 18K et de l\'Argent'}</span>
                </h3>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-gray)' }}>
                  {lang === 'ar' ? 'يمكن تعديل سعر الفضة أو الذهب بشكل مستقل أو معاً' : 'Mise à jour indépendante ou combinée'}
                </span>
              </div>

              {/* Dual Column Configuration Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px', marginBottom: '20px' }}>
                {/* 1. Gold 18K Box */}
                <div style={{
                  background: 'rgba(212, 175, 55, 0.05)',
                  border: '1.5px solid rgba(212, 175, 55, 0.35)',
                  borderRadius: '10px',
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.9rem', fontWeight: 800, color: 'var(--admin-gold)' }}>
                      <span>🏆</span>
                      <span>{lang === 'ar' ? 'سعر غرام الذهب 18K (د.م/غ)' : 'Prix Or 18K (MAD/g)'}</span>
                    </label>
                    <span style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 700 }}>
                      {goldRatesData.currentPrice18k || 1045} MAD/g
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input
                      type="number"
                      step="0.5"
                      min="100"
                      max="10000"
                      value={goldPriceInput}
                      onChange={(e) => setGoldPriceInput(e.target.value)}
                      placeholder="1045"
                      style={{
                        flex: 1,
                        padding: '10px 12px',
                        background: 'rgba(0,0,0,0.3)',
                        border: '1px solid var(--border-gold)',
                        borderRadius: '6px',
                        color: 'var(--text-white)',
                        fontSize: '1.15rem',
                        fontWeight: 800
                      }}
                    />
                    {/* Quick increment buttons */}
                    <div style={{ display: 'flex', gap: '4px' }}>
                      {['-5', '+5', '+10'].map(step => (
                        <button
                          key={step}
                          type="button"
                          onClick={() => {
                            const curr = parseFloat(goldPriceInput) || 1045;
                            const delta = parseFloat(step);
                            setGoldPriceInput(String(Math.max(100, curr + delta)));
                          }}
                          style={{
                            background: 'rgba(212, 175, 55, 0.1)',
                            border: '1px solid rgba(212, 175, 55, 0.25)',
                            color: 'var(--admin-gold)',
                            borderRadius: '4px',
                            padding: '6px 8px',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            cursor: 'pointer'
                          }}
                        >
                          {step}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled={isUpdatingGold}
                    onClick={() => handleUpdateGoldRateOnly()}
                    style={{
                      background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.3) 0%, rgba(212, 175, 55, 0.1) 100%)',
                      border: '1px solid var(--admin-gold)',
                      color: 'var(--admin-gold)',
                      borderRadius: '6px',
                      padding: '8px 14px',
                      fontSize: '0.82rem',
                      fontWeight: 800,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px'
                    }}
                  >
                    <span>💾</span>
                    <span>{isUpdatingGold ? '⏳ ...' : (lang === 'ar' ? 'تثبيت سعر الذهب فقط' : 'Enregistrer l\'Or 18K seul')}</span>
                  </button>
                </div>

                {/* 2. Silver 1000 Box - DIRECT PARAMETERIZATION */}
                <div style={{
                  background: 'rgba(203, 213, 225, 0.05)',
                  border: '1.5px solid rgba(203, 213, 225, 0.35)',
                  borderRadius: '10px',
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.9rem', fontWeight: 800, color: '#e2e8f0' }}>
                      <SilverIcon size={18} />
                      <span>{lang === 'ar' ? 'سعر غرام الفضة 1000 (د.م/غ)' : 'Prix Argent 1000 (MAD/g)'}</span>
                    </label>
                    <span style={{ fontSize: '0.75rem', color: '#cbd5e1', fontWeight: 700 }}>
                      {typeof goldRatesData.currentPriceSilver === 'number' ? goldRatesData.currentPriceSilver.toFixed(2) : (goldRatesData.currentPriceSilver || '14.50')} MAD/g
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input
                      type="number"
                      step="0.1"
                      min="1"
                      max="1000"
                      value={silverPriceInput}
                      onChange={(e) => setSilverPriceInput(e.target.value)}
                      placeholder="14.50"
                      style={{
                        flex: 1,
                        padding: '10px 12px',
                        background: 'rgba(0,0,0,0.3)',
                        border: '1px solid #cbd5e1',
                        borderRadius: '6px',
                        color: '#f8fafc',
                        fontSize: '1.15rem',
                        fontWeight: 800
                      }}
                    />
                    {/* Quick increment buttons */}
                    <div style={{ display: 'flex', gap: '4px' }}>
                      {['-0.5', '+0.5', '+1'].map(step => (
                        <button
                          key={step}
                          type="button"
                          onClick={() => {
                            const curr = parseFloat(silverPriceInput) || 14.50;
                            const delta = parseFloat(step);
                            const next = Math.max(1, +(curr + delta).toFixed(2));
                            setSilverPriceInput(String(next));
                          }}
                          style={{
                            background: 'rgba(255, 255, 255, 0.08)',
                            border: '1px solid rgba(255, 255, 255, 0.2)',
                            color: '#e2e8f0',
                            borderRadius: '4px',
                            padding: '6px 8px',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            cursor: 'pointer'
                          }}
                        >
                          {step}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <button
                      type="button"
                      disabled={isUpdatingGold}
                      onClick={() => handleUpdateSilverRateOnly()}
                      style={{
                        flex: 1,
                        background: 'linear-gradient(135deg, #e2e8f0 0%, #94a3b8 100%)',
                        color: '#0f172a',
                        border: 'none',
                        borderRadius: '6px',
                        padding: '8px 14px',
                        fontSize: '0.82rem',
                        fontWeight: 800,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px'
                      }}
                    >
                      <span>💾</span>
                      <span>{isUpdatingGold ? '⏳ ...' : (lang === 'ar' ? 'تثبيت سعر الفضة فقط' : 'Enregistrer l\'Argent seul')}</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Source & Note Fields with Combined Save */}
              <form onSubmit={handleUpdateGoldRate} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', alignItems: 'end', paddingTop: '16px', borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-white)' }}>
                    {lang === 'ar' ? 'المصدر / المرجع المعتمد' : 'Source / Bourse de référence'}
                  </label>
                  <input
                    type="text"
                    value={goldSourceInput}
                    onChange={(e) => setGoldSourceInput(e.target.value)}
                    placeholder={lang === 'ar' ? 'مثال: سوق الصاغة الدار البيضاء...' : 'Ex: Marché de Casablanca, Clôture officielle...'}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      background: 'rgba(0,0,0,0.2)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '8px',
                      color: 'var(--text-white)',
                      fontSize: '0.92rem'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-white)' }}>
                    {lang === 'ar' ? 'ملاحظة أو سبب التعديل' : 'Note ou motif d\'évolution'}
                  </label>
                  <input
                    type="text"
                    value={goldNoteInput}
                    onChange={(e) => setGoldNoteInput(e.target.value)}
                    placeholder={lang === 'ar' ? 'مثال: استقرار الطلب بالسوق المغربي...' : 'Ex: Fixation hebdomadaire officielle...'}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      background: 'rgba(0,0,0,0.2)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '8px',
                      color: 'var(--text-white)',
                      fontSize: '0.92rem'
                    }}
                  />
                </div>

                <div>
                  <button
                    type="submit"
                    disabled={isUpdatingGold}
                    className="btn-gold"
                    style={{
                      width: '100%',
                      padding: '11px 20px',
                      fontSize: '0.92rem',
                      fontWeight: 800,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      margin: 0
                    }}
                  >
                    {isUpdatingGold ? '⏳ ...' : (lang === 'ar' ? '💾 تحديث أسعار الذهب والفضة معاً' : '💾 Enregistrer les deux cours')}
                  </button>
                </div>
              </form>
            </div>

            {/* History Header & Metal Filter Switcher */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '14px' }}>
              <div>
                <h3 style={{ fontFamily: 'Playfair Display', margin: 0, fontSize: '1.4rem', color: 'var(--text-white)' }}>
                  {lang === 'ar' ? '📊 المنحنى البياني وسجل التغييرات التاريخية' : '📊 Évolution Graphique & Historique des Cotations'}
                </h3>
                <p style={{ color: 'var(--text-gray)', margin: '4px 0 0 0', fontSize: '0.84rem' }}>
                  {lang === 'ar' ? 'تتبع فوري لمنحنى تطور أسعار الذهب والفضة مع سجل كامل لجميع التعديلات' : 'Traçabilité visuelle en temps réel et registre d\'audit complet pour l\'or et l\'argent'}
                </p>
              </div>

              {/* Tabs: Argent 1000‰ vs Or 18K */}
              <div style={{ display: 'flex', background: 'rgba(255, 255, 255, 0.06)', borderRadius: '12px', padding: '4px', gap: '6px', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                <button
                  type="button"
                  onClick={() => setAdminMetalHistoryTab('silver')}
                  style={{
                    background: adminMetalHistoryTab === 'silver' ? 'linear-gradient(135deg, #38bdf8 0%, #0284c7 100%)' : 'transparent',
                    color: adminMetalHistoryTab === 'silver' ? '#0f172a' : '#cbd5e1',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '8px 16px',
                    fontWeight: 800,
                    fontSize: '0.84rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    boxShadow: adminMetalHistoryTab === 'silver' ? '0 0 16px rgba(56, 189, 248, 0.35)' : 'none',
                    transition: 'all 0.2s'
                  }}
                >
                  <SilverIcon size={16} />
                  <span>{lang === 'ar' ? 'الفضة عيار 1000' : 'Argent 1000‰'}</span>
                  <span style={{ fontSize: '0.74rem', opacity: 0.85 }}>({(goldRatesData.silverHistory || []).length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setAdminMetalHistoryTab('gold')}
                  style={{
                    background: adminMetalHistoryTab === 'gold' ? 'linear-gradient(135deg, #d4af37 0%, #aa7c11 100%)' : 'transparent',
                    color: adminMetalHistoryTab === 'gold' ? '#000000' : '#cbd5e1',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '8px 16px',
                    fontWeight: 800,
                    fontSize: '0.84rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    boxShadow: adminMetalHistoryTab === 'gold' ? '0 0 16px rgba(212, 175, 55, 0.35)' : 'none',
                    transition: 'all 0.2s'
                  }}
                >
                  <span>🏆</span>
                  <span>{lang === 'ar' ? 'الذهب عيار 18' : 'Or 18K (750‰)'}</span>
                  <span style={{ fontSize: '0.74rem', opacity: 0.85 }}>({(goldRatesData.history || []).length})</span>
                </button>
              </div>
            </div>

            {/* Visual Evolution Graph Card */}
            {(() => {
              const isSilver = adminMetalHistoryTab === 'silver';
              const rawList = isSilver ? (goldRatesData.silverHistory || []) : (goldRatesData.history || []);
              const priceExtractor = isSilver 
                ? (item) => Number(item.priceSilver || item.price || 14.50)
                : (item) => Number(item.price18k || item.price || 1032);
              const prices = rawList.map(priceExtractor);
              const minVal = prices.length > 0 ? Math.min(...prices) : (isSilver ? 14.50 : 1032);
              const maxVal = prices.length > 0 ? Math.max(...prices) : (isSilver ? 14.50 : 1032);
              const avgVal = prices.length > 0 ? (prices.reduce((a, b) => a + b, 0) / prices.length) : (isSilver ? 14.50 : 1032);

              const width = 800;
              const height = 180;
              const padL = isSilver ? 70 : 65;
              const padR = 30;
              const padT = 25;
              const padB = 30;
              const innerW = width - padL - padR;
              const innerH = height - padT - padB;
              const pPad = isSilver ? Math.max((maxVal - minVal) * 0.25, 0.40) : Math.max((maxVal - minVal) * 0.15, 6);
              const pMin = isSilver ? Number((minVal - pPad).toFixed(2)) : Math.floor(minVal - pPad);
              const pMax = isSilver ? Number((maxVal + pPad).toFixed(2)) : Math.ceil(maxVal + pPad);
              const pRange = pMax - pMin || (isSilver ? 1 : 10);

              const pts = rawList.map((item, idx) => {
                const x = padL + (idx / Math.max(rawList.length - 1, 1)) * innerW;
                const p = priceExtractor(item);
                const y = padT + (1 - (p - pMin) / pRange) * innerH;
                return { x, y, price: p, date: item.date?.split(' ')[0] || item.date };
              });

              let pathD = '';
              if (pts.length === 1) pathD = `M ${pts[0].x} ${pts[0].y}`;
              else if (pts.length > 1) {
                pathD = `M ${pts[0].x},${pts[0].y}`;
                for (let i = 0; i < pts.length - 1; i++) {
                  const p0 = pts[i === 0 ? 0 : i - 1];
                  const p1 = pts[i];
                  const p2 = pts[i + 1];
                  const p3 = pts[i + 2] || p2;
                  const cp1x = p1.x + (p2.x - p0.x) / 6;
                  const cp1y = p1.y + (p2.y - p0.y) / 6;
                  const cp2x = p2.x - (p3.x - p1.x) / 6;
                  const cp2y = p2.y - (p3.y - p1.y) / 6;
                  pathD += ` C ${cp1x.toFixed(1)},${cp1y.toFixed(1)} ${cp2x.toFixed(1)},${cp2y.toFixed(1)} ${p2.x.toFixed(1)},${p2.y.toFixed(1)}`;
                }
              }

              const strokeColor = isSilver ? '#38bdf8' : '#d4af37';
              const gradId = isSilver ? "adminSilverGrad" : "adminGoldGrad";

              return (
                <div style={{
                  background: 'linear-gradient(180deg, rgba(20, 24, 38, 0.8) 0%, rgba(10, 12, 20, 0.95) 100%)',
                  border: isSilver ? '1px solid rgba(56, 189, 248, 0.3)' : '1px solid rgba(212, 175, 55, 0.3)',
                  borderRadius: '16px',
                  padding: '20px',
                  marginBottom: '24px',
                  boxShadow: '0 8px 24px rgba(0, 0, 0, 0.35)'
                }}>
                  {/* Graph Top Metrics */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '1.2rem' }}>{isSilver ? '🛡️' : '🏆'}</span>
                      <span style={{ fontWeight: 800, color: 'var(--text-white)', fontSize: '0.98rem' }}>
                        {isSilver 
                          ? (lang === 'ar' ? 'منحنى تطور سعر غرام الفضة عيار 1000 (MAD/g)' : 'Courbe d\'évolution du cours de l\'Argent Pur 1000‰ (MAD/g)')
                          : (lang === 'ar' ? 'منحنى تطور سعر غرام الذهب عيار 18 قيراط (MAD/g)' : 'Courbe d\'évolution du cours de l\'Or 18 Karats (MAD/g)')}
                      </span>
                    </div>

                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                      <span style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', padding: '3px 10px', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 800 }}>
                        ▲ Max: {isSilver ? maxVal.toFixed(2) : Math.round(maxVal)} MAD/g
                      </span>
                      <span style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', padding: '3px 10px', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 800 }}>
                        ▼ Min: {isSilver ? minVal.toFixed(2) : Math.round(minVal)} MAD/g
                      </span>
                      <span style={{ background: 'rgba(255, 255, 255, 0.08)', color: 'var(--text-white)', padding: '3px 10px', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 700 }}>
                        Moy: {isSilver ? Number(avgVal).toFixed(2) : Math.round(avgVal)} MAD/g
                      </span>
                    </div>
                  </div>

                  {/* SVG Chart */}
                  {pts.length > 0 ? (
                    <div style={{ width: '100%', overflow: 'hidden' }}>
                      <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height: 'auto', display: 'block' }}>
                        <defs>
                          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={strokeColor} stopOpacity="0.35" />
                            <stop offset="100%" stopColor={strokeColor} stopOpacity="0.0" />
                          </linearGradient>
                        </defs>

                        {/* Grid lines */}
                        {[0, 0.5, 1].map((ratio, i) => {
                          const y = padT + (1 - ratio) * innerH;
                          const v = isSilver ? (pMin + ratio * pRange).toFixed(2) : Math.round(pMin + ratio * pRange);
                          return (
                            <g key={i}>
                              <line x1={padL} y1={y} x2={width - padR} y2={y} stroke="rgba(255,255,255,0.08)" strokeDasharray="4 4" />
                              <text x={padL - 8} y={y + 3.5} fill="#94a3b8" fontSize="10" fontWeight="600" textAnchor="end">
                                {v}
                              </text>
                            </g>
                          );
                        })}

                        {/* Area */}
                        {pathD && pts.length > 1 && (
                          <path
                            d={`${pathD} L ${pts[pts.length - 1].x},${padT + innerH} L ${pts[0].x},${padT + innerH} Z`}
                            fill={`url(#${gradId})`}
                          />
                        )}

                        {/* Line */}
                        {pathD && (
                          <path
                            d={pathD}
                            fill="none"
                            stroke={strokeColor}
                            strokeWidth="2.8"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        )}

                        {/* Nodes */}
                        {pts.map((pt, i) => (
                          <g key={i}>
                            <circle cx={pt.x} cy={pt.y} r="4.5" fill="#151824" stroke={strokeColor} strokeWidth="2.5" />
                            <text x={pt.x} y={padT + innerH + 16} fill="#94a3b8" fontSize="9" fontWeight="600" textAnchor="middle">
                              {pt.date}
                            </text>
                          </g>
                        ))}
                      </svg>
                    </div>
                  ) : (
                    <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-gray)', fontSize: '0.85rem' }}>
                      {lang === 'ar' ? 'لا توجد بيانات بيانية مسجلة حتى الآن.' : 'Aucune donnée d\'évolution pour le moment.'}
                    </div>
                  )}
                </div>
              );
            })()}

            {/* History Table */}
            <div className="table-container">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>{lang === 'ar' ? 'التاريخ والوقت' : 'Date & Heure'}</th>
                    <th>
                      {adminMetalHistoryTab === 'silver'
                        ? (lang === 'ar' ? 'سعر الفضة 1000 (د.م/غ)' : 'Prix Argent 1000 (MAD/g)')
                        : (lang === 'ar' ? 'سعر الذهب 18K (د.م/غ)' : 'Prix Or 18K (MAD/g)')}
                    </th>
                    <th>{lang === 'ar' ? 'التغيير' : 'Variation'}</th>
                    <th>{lang === 'ar' ? 'المصدر' : 'Source'}</th>
                    <th>{lang === 'ar' ? 'ملاحظة' : 'Note'}</th>
                    <th>{lang === 'ar' ? 'إجراء' : 'Action'}</th>
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    const isSilver = adminMetalHistoryTab === 'silver';
                    const activeList = isSilver ? (goldRatesData.silverHistory || []) : (goldRatesData.history || []);
                    
                    return [...activeList].reverse().map((item) => {
                      const isPositive = item.change && item.change.startsWith('+') && item.change !== '+0.0%';
                      const isNeutral = !item.change || item.change === '0.0%' || item.change === '0%';
                      const priceVal = isSilver
                        ? Number(item.priceSilver || item.price || 14.50).toFixed(2)
                        : (item.price18k || item.price || 1032);

                      const getLocalizedSource = (s) => {
                        if (!s) return lang === 'ar' ? 'سوق المعادن المغربي' : 'Marché Maroc';
                        if (lang === 'ar') {
                          const map = {
                            'Fixation Casablanca': 'تحديد الدار البيضاء',
                            'Bourse Casablanca': 'بورصة الدار البيضاء',
                            'Marché national': 'السوق الوطني للذهب',
                            'Marché National Argent': 'السوق الوطني للفضة',
                            'Bourse de référence': 'بورصة الذهب المعتمدة',
                            'Cours officiel de clôture': 'السعر الرسمي للإغلاق',
                            'Cours officiel clôture': 'السعر الرسمي للإغلاق',
                            'Fixation Officielle Maroc': 'السعر الرسمي المحدد بالمغرب',
                            'Fixation Argent Maroc': 'سعر الفضة المحدد بالمغرب',
                            'Marché Maroc': 'سوق المعادن المغربي'
                          };
                          return map[s] || s;
                        }
                        return s;
                      };

                      const getLocalizedNote = (n) => {
                        if (!n || n === '-') return '-';
                        if (lang === 'ar') {
                          const map = {
                            'Cours matinal': 'السعر الصباحي الافتتاحي',
                            'Fixation matinale Ag 1000': 'السعر الصباحي الافتتاحي Ag 1000',
                            'Forte demande joaillerie': 'طلب متزايد على الصياغة',
                            'Raffinement lingots 1000': 'تنقية وسبك سبائك 1000',
                            'Tendance haussière': 'اتجاه تصاعدي في السوق',
                            'Cours actuel du jour': 'السعر الرسمي المعتمد اليوم',
                            'Cours actuel du jour (Ag 1000)': 'السعر المعتمد اليوم (Ag 1000)',
                            'Validation 18K': 'تأكيد سعر عيار 18',
                            'Cours certifié Ag 1000‰': 'سعر الفضة المعتمد 1000‰',
                            'Mise à jour régulière': 'تحديث دوري معتمد',
                            'Progression continue de l\'argent pur': 'تطور إيجابي وتصاعدي لسعر الفضة',
                            'Paramétrage cours argent depuis le dashboard': 'ضبط سعر الفضة من لوحة التحكم',
                            'Mise à jour du cours de l\'argent': 'تعديل سعر غرام الفضة'
                          };
                          return map[n] || n;
                        }
                        return n;
                      };

                      return (
                        <tr key={item.id}>
                          <td style={{ fontWeight: 600, color: 'var(--text-white)', whiteSpace: 'nowrap' }} dir="ltr">
                            📅 {item.date}
                          </td>
                          <td style={{ color: isSilver ? '#38bdf8' : 'var(--admin-gold)', fontWeight: 800, fontSize: '1.05rem' }} dir="ltr">
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                              {isSilver && <SilverIcon size={14} />}
                              <span>{priceVal} {lang === 'ar' ? 'د.م/غ' : 'MAD/g'}</span>
                            </span>
                          </td>
                          <td>
                            <span dir="ltr" style={{
                              display: 'inline-block',
                              padding: '3px 8px',
                              borderRadius: '4px',
                              fontSize: '0.78rem',
                              fontWeight: 800,
                              background: isNeutral ? 'rgba(255,255,255,0.06)' : (isPositive ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)'),
                              color: isNeutral ? 'var(--text-gray)' : (isPositive ? '#10b981' : '#ef4444')
                            }}>
                              {item.change || '0.0%'}
                            </span>
                          </td>
                          <td style={{ fontSize: '0.85rem', color: 'var(--text-white)' }}>
                            {getLocalizedSource(item.source)}
                          </td>
                          <td style={{ fontSize: '0.85rem', color: 'var(--text-gray)' }}>
                            {getLocalizedNote(item.note)}
                          </td>
                          <td>
                            <button
                              type="button"
                              onClick={() => handleDeleteGoldHistory(item.id)}
                              title={lang === 'ar' ? 'حذف من السجل' : 'Supprimer de l\'historique'}
                              style={{
                                background: 'rgba(239,68,68,0.12)',
                                border: '1px solid rgba(239,68,68,0.3)',
                                color: '#ef4444',
                                borderRadius: '6px',
                                padding: '5px 10px',
                                cursor: 'pointer',
                                fontSize: '0.8rem',
                                transition: 'all 0.2s'
                              }}
                            >
                              🗑️
                            </button>
                          </td>
                        </tr>
                      );
                    });
                  })()}
                  {((adminMetalHistoryTab === 'silver' ? (goldRatesData.silverHistory || []) : (goldRatesData.history || [])).length === 0) && (
                    <tr>
                      <td colSpan="6" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-gray)' }}>
                        {lang === 'ar' ? 'لا يوجد سجل تغييرات سابق لهذه الفئة.' : 'Aucun historique enregistré pour cette catégorie.'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
            <div style={{
              background: 'linear-gradient(145deg, #181b26 0%, #11131a 100%)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '16px',
              padding: '40px 24px',
              textAlign: 'center',
              maxWidth: '600px',
              margin: '60px auto',
              boxShadow: '0 12px 30px rgba(0, 0, 0, 0.5)'
            }}>
              <span style={{ fontSize: '3rem', display: 'block', marginBottom: '16px' }}>🔒</span>
              <h2 style={{ color: '#ef4444', marginBottom: '10px', fontFamily: 'Playfair Display' }}>
                {lang === 'ar' ? 'غير مصرح بالدخول' : 'Accès Restreint'}
              </h2>
              <p style={{ color: 'var(--text-gray)', fontSize: '0.95rem', marginBottom: '24px' }}>
                {lang === 'ar' 
                  ? 'ليس لديك الصلاحيات الكافية للاطلاع على أسعار المعادن والذهب أو إدارتها. يرجى التواصل مع مشرف النظام.'
                  : 'Votre rôle ne dispose pas des autorisations nécessaires pour consulter ou gérer les cours des métaux précieux.'}
              </p>
              <button
                type="button"
                className="btn-gold"
                onClick={() => setActiveTab(isMerchant ? 'products' : 'dashboard')}
              >
                {lang === 'ar' ? 'العودة إلى الصفحة الرئيسية' : 'Retour à l\'accueil'}
              </button>
            </div>
          )
        )}

        {/* Sales History Management Section */}
        {activeTab === 'sales_history' && (
          <div>
            {/* Header & Subtitle */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '15px' }}>
              <div>
                <h2 style={{ fontFamily: 'Playfair Display', margin: '0 0 6px 0', fontSize: '1.8rem', color: 'var(--admin-gold)' }}>
                  {lang === 'ar' ? '📜 سجل مبيعات منصة ياز (YAZ)' : '📜 Traçabilité & Historique des Ventes Marketplace'}
                </h2>
                <p style={{ color: 'var(--text-gray)', margin: 0, fontSize: '0.88rem' }}>
                  {lang === 'ar'
                    ? 'متابعة شاملة لجميع الصفقات المكتملة، بيانات المشترين، والقطع المباعة مع تطبيق قاعدة الأرشفة التلقائية بعد 12 ساعة.'
                    : 'Registre d\'audit des transactions conclues, traçabilité des pièces vendues et application de la règle d\'archivage 12h.'}
                </p>
              </div>

              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: 'rgba(212, 175, 55, 0.1)',
                  color: 'var(--admin-gold)',
                  padding: '6px 14px',
                  borderRadius: '20px',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  border: '1px solid rgba(212, 175, 55, 0.3)'
                }}>
                  ⏱️ {lang === 'ar' ? 'مدة العرض بعد البيع: 12 ساعة' : 'Visibilité post-vente : 12h'}
                </span>
                <button
                  type="button"
                  onClick={fetchData}
                  style={{
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid var(--border-subtle)',
                    color: 'var(--text-white)',
                    borderRadius: '8px',
                    padding: '8px 14px',
                    cursor: 'pointer',
                    fontSize: '0.85rem',
                    fontWeight: 600
                  }}
                >
                  🔄 {lang === 'ar' ? 'تحديث' : 'Actualiser'}
                </button>
              </div>
            </div>

            {/* KPI Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '24px' }}>
              <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-gold)', borderRadius: 'var(--radius-md)', padding: '20px' }}>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-gray)', textTransform: 'uppercase', fontWeight: 700, marginBottom: '6px' }}>
                  {lang === 'ar' ? 'إجمالي القطع المباعة' : 'Total Ventes Conclues'}
                </div>
                <div style={{ fontSize: '2.2rem', fontWeight: 900, color: '#ef4444' }}>
                  {salesHistory.length} <span style={{ fontSize: '1rem', color: 'var(--text-white)', fontWeight: 600 }}>{lang === 'ar' ? 'قطعة' : 'articles'}</span>
                </div>
              </div>

              <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-gold)', borderRadius: 'var(--radius-md)', padding: '20px' }}>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-gray)', textTransform: 'uppercase', fontWeight: 700, marginBottom: '6px' }}>
                  {lang === 'ar' ? 'حجم المعاملات المكتملة' : 'Volume d\'Affaires Ventes'}
                </div>
                <div style={{ fontSize: '2.2rem', fontWeight: 900, color: 'var(--admin-gold)' }}>
                  {salesHistory.reduce((acc, curr) => acc + (Number(curr.prix_vente) || 0), 0).toLocaleString()} <span style={{ fontSize: '1rem', color: 'var(--text-white)', fontWeight: 600 }}>MAD</span>
                </div>
              </div>

              <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '20px' }}>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-gray)', textTransform: 'uppercase', fontWeight: 700, marginBottom: '6px' }}>
                  {lang === 'ar' ? 'متوسط سعر البيع' : 'Panier Moyen Vente'}
                </div>
                <div style={{ fontSize: '2.2rem', fontWeight: 900, color: '#10b981' }}>
                  {salesHistory.length > 0
                    ? Math.round(salesHistory.reduce((acc, curr) => acc + (Number(curr.prix_vente) || 0), 0) / salesHistory.length).toLocaleString()
                    : 0} <span style={{ fontSize: '1rem', color: 'var(--text-white)', fontWeight: 600 }}>MAD</span>
                </div>
              </div>
            </div>

            {/* Search and Filters */}
            <div style={{ marginBottom: '16px' }}>
              <input
                type="text"
                placeholder={lang === 'ar' ? 'بحث برقم المعاملة، اسم المقال، الصائغ أو المشتري...' : 'Rechercher par référence, nom d\'article, vendeur ou transaction...'}
                value={salesSearchTerm}
                onChange={(e) => setSalesSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  maxWidth: '480px',
                  padding: '10px 14px',
                  background: 'rgba(0,0,0,0.2)',
                  border: '1px solid var(--border-gold)',
                  borderRadius: '8px',
                  color: 'var(--text-white)',
                  fontSize: '0.9rem'
                }}
              />
            </div>

            {/* Sales Table */}
            <div style={{ overflowX: 'auto', background: 'var(--bg-card)', border: '1px solid var(--border-gold)', borderRadius: 'var(--radius-md)' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: lang === 'ar' ? 'right' : 'left' }}>
                <thead>
                  <tr style={{ background: 'rgba(212,175,55,0.08)', borderBottom: '1px solid var(--border-gold)' }}>
                    <th style={{ padding: '14px 16px', color: 'var(--admin-gold)', fontSize: '0.82rem', textTransform: 'uppercase' }}>
                      {lang === 'ar' ? 'المعاملة / التاريخ' : 'Transaction / Date'}
                    </th>
                    <th style={{ padding: '14px 16px', color: 'var(--admin-gold)', fontSize: '0.82rem', textTransform: 'uppercase' }}>
                      {lang === 'ar' ? 'القطعة / المقال' : 'Article / Titre'}
                    </th>
                    <th style={{ padding: '14px 16px', color: 'var(--admin-gold)', fontSize: '0.82rem', textTransform: 'uppercase' }}>
                      {lang === 'ar' ? 'الصائغ / البائع' : 'Vendeur / Atelier'}
                    </th>
                    <th style={{ padding: '14px 16px', color: 'var(--admin-gold)', fontSize: '0.82rem', textTransform: 'uppercase' }}>
                      {lang === 'ar' ? 'الوزن (غرام)' : 'Grammage'}
                    </th>
                    <th style={{ padding: '14px 16px', color: 'var(--admin-gold)', fontSize: '0.82rem', textTransform: 'uppercase' }}>
                      {lang === 'ar' ? 'سعر البيع' : 'Prix de Vente'}
                    </th>
                    <th style={{ padding: '14px 16px', color: 'var(--admin-gold)', fontSize: '0.82rem', textTransform: 'uppercase' }}>
                      {lang === 'ar' ? 'المشتري' : 'Acheteur'}
                    </th>
                    <th style={{ padding: '14px 16px', color: 'var(--admin-gold)', fontSize: '0.82rem', textTransform: 'uppercase' }}>
                      {lang === 'ar' ? 'الحالة' : 'Statut'}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {salesHistory
                    .filter(sale => {
                      if (!salesSearchTerm) return true;
                      const term = salesSearchTerm.toLowerCase();
                      return (
                        (sale.transaction_id && sale.transaction_id.toLowerCase().includes(term)) ||
                        (sale.titre && sale.titre.toLowerCase().includes(term)) ||
                        (sale.vendeur_nom && sale.vendeur_nom.toLowerCase().includes(term)) ||
                        (sale.buyer_nom && sale.buyer_nom.toLowerCase().includes(term)) ||
                        (sale.reference && sale.reference.toLowerCase().includes(term))
                      );
                    })
                    .map((sale) => {
                      const saleDate = sale.date_vente ? new Date(sale.date_vente) : null;
                      const formattedDate = saleDate && !isNaN(saleDate.getTime())
                        ? saleDate.toLocaleString(lang === 'ar' ? 'ar-MA' : 'fr-FR', { dateStyle: 'short', timeStyle: 'short' })
                        : '-';
                      const isRecent12h = saleDate && ((Date.now() - saleDate.getTime()) < 12 * 60 * 60 * 1000);

                      return (
                        <tr key={sale.id || sale.transaction_id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                          <td style={{ padding: '14px 16px' }}>
                            <div style={{ fontFamily: 'monospace', fontSize: '0.85rem', color: 'var(--admin-gold)', fontWeight: 700 }}>
                              {sale.transaction_id || `TRX-${sale.bijou_id}`}
                            </div>
                            <div style={{ fontSize: '0.78rem', color: 'var(--text-gray)' }}>
                              📅 {formattedDate}
                            </div>
                          </td>
                          <td style={{ padding: '14px 16px' }}>
                            <div style={{ fontWeight: 700, color: 'var(--text-white)', fontSize: '0.92rem' }}>
                              {sale.titre}
                            </div>
                            <div style={{ fontSize: '0.78rem', color: 'var(--text-gray)' }}>
                              Réf: {sale.reference || sale.bijou_id}
                            </div>
                          </td>
                          <td style={{ padding: '14px 16px', color: 'var(--text-white)', fontSize: '0.88rem' }}>
                            🏛️ {sale.vendeur_nom || 'Vendeur Certifié'}
                          </td>
                          <td style={{ padding: '14px 16px', color: 'var(--text-white)', fontWeight: 700, fontSize: '0.92rem' }}>
                            ⚖️ {sale.gramme ? `${sale.gramme} g` : '-'}
                          </td>
                          <td style={{ padding: '14px 16px', color: '#10b981', fontWeight: 800, fontSize: '1.05rem' }}>
                            {Number(sale.prix_vente || 0).toLocaleString()} MAD
                          </td>
                          <td style={{ padding: '14px 16px', color: 'var(--text-gray)', fontSize: '0.85rem' }}>
                            👤 {sale.buyer_nom || 'Client Marketplace'}
                            {sale.buyer_phone && (
                              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', marginTop: '2px' }}>
                                <span>📞</span>
                                <a 
                                  href={`tel:+${getCleanPhoneDigits(sale.buyer_phone)}`}
                                  dir="ltr"
                                  style={{ direction: 'ltr', unicodeBidi: 'isolate', fontFamily: 'monospace', color: '#63b3ed', textDecoration: 'none' }}
                                >
                                  {formatPhoneDisplay(sale.buyer_phone)}
                                </a>
                              </div>
                            )}
                          </td>
                          <td style={{ padding: '14px 16px' }}>
                            <span style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '4px 10px',
                              borderRadius: '20px',
                              fontSize: '0.75rem',
                              fontWeight: 800,
                              background: 'rgba(239, 68, 68, 0.15)',
                              color: '#ef4444',
                              border: '1px solid rgba(239, 68, 68, 0.3)'
                            }}>
                              🏷️ {lang === 'ar' ? 'تم البيع' : 'Vendu'}
                            </span>
                            <div style={{ fontSize: '0.72rem', color: isRecent12h ? '#10b981' : 'var(--text-gray)', marginTop: '4px' }}>
                              {isRecent12h
                                ? (lang === 'ar' ? '🟢 معروض بالمنصة (نافذة 12س)' : '🟢 Visible catalogue (fenêtre 12h)')
                                : (lang === 'ar' ? '🔒 مؤرشف تلقائياً' : '🔒 Archivé automatiquement')}
                            </div>
                          </td>
                        </tr>
                      );
                    })}

                  {salesHistory.length === 0 && (
                    <tr>
                      <td colSpan="7" style={{ textAlign: 'center', padding: '36px', color: 'var(--text-gray)' }}>
                        {lang === 'ar' ? 'لا توجد مبيعات مسجلة في السجل حتى الآن.' : 'Aucune vente enregistrée dans l\'historique pour le moment.'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Footer copyright */}
        <footer className="footer-copyright">
          <p>{lang === 'ar' ? 'الفيدرالية المغربية للصياغة والمجوهرات • بوابة الإدارة المركزية' : 'Fédération Marocaine de Bijouterie • Portail Administratif'}</p>
          <p className="sub-text">{lang === 'ar' ? 'جميع الحقوق محفوظة © 2026; sdbo.ma' : 'Copyright © 2026; sdbo.ma • Tous droits réservés.'}</p>
        </footer>
      </main>

      {/* Rejection Reason Input Modal */}
      {selectedProductForRejection && (
        <div className="modal-overlay">
          <form className="modal-content" onSubmit={handleRejectSubmit}>
            <button type="button" className="modal-close-btn" onClick={() => setSelectedProductForRejection(null)}>✕</button>
            <h3 style={{ color: 'var(--danger-red)', marginBottom: '15px' }}>{t('reject')}: {selectedProductForRejection.titre}</h3>
            
            <div className="form-group">
              <label className="form-label">{t('rejectionReasonPlaceholder')}</label>
              <textarea 
                className="form-input" 
                rows="4"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                required
              />
            </div>

            <div style={{ display: 'flex', gap: '15px', justifyContent: 'flex-end' }}>
              <button type="button" className="btn-outline-gold" style={{ padding: '8px 16px', fontSize: '0.8rem' }} onClick={() => setSelectedProductForRejection(null)}>
                {t('cancel')}
              </button>
              <button type="submit" className="btn-reject" style={{ margin: 0, padding: '8px 16px', fontSize: '0.8rem' }}>
                {t('submitRejection')}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Create/Edit User Modal */}
      {showUserModal && (
        <div className="modal-overlay">
          <form className="modal-content" onSubmit={handleUserSubmit} style={{ maxWidth: '600px' }}>
            <button type="button" className="modal-close-btn" onClick={() => setShowUserModal(false)}>✕</button>
            <h3 style={{ color: 'var(--admin-gold)', marginBottom: '25px', fontFamily: 'Playfair Display', fontSize: '1.6rem' }}>
              {editingUser ? t('editUser') : t('addUser')}
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
              <div className="form-group">
                <label className="form-label">{t('name')}</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={userForm.nom} 
                  onChange={e => setUserForm({ ...userForm, nom: e.target.value })} 
                  required 
                />
              </div>
              <div className="form-group">
                <label className="form-label">{t('email')}</label>
                <input 
                  type="email" 
                  className="form-input" 
                  value={userForm.email} 
                  onChange={e => setUserForm({ ...userForm, email: e.target.value })} 
                  required 
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
              <div className="form-group">
                <label className="form-label">{t('password')}</label>
                <input 
                  type="password" 
                  className="form-input" 
                  value={userForm.mot_de_passe} 
                  onChange={e => setUserForm({ ...userForm, mot_de_passe: e.target.value })} 
                  placeholder={editingUser ? "••••••••" : ""}
                  required={!editingUser} 
                />
              </div>
              <div className="form-group">
                <label className="form-label">{t('phone') || (lang === 'ar' ? 'رقم الهاتف' : 'Téléphone')}</label>
                <input 
                  type="tel" 
                  className="form-input" 
                  dir="ltr"
                  style={{ direction: 'ltr', textAlign: lang === 'ar' ? 'right' : 'left' }}
                  value={userForm.phone} 
                  onChange={e => setUserForm({ ...userForm, phone: e.target.value })} 
                  placeholder={lang === 'ar' ? 'مثال: 0661234567' : 'Ex: 0661234567'}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
              <div className="form-group">
                <label className="form-label">{t('role')}</label>
                <select 
                  className="form-input" 
                  value={userForm.role} 
                  onChange={e => setUserForm({ ...userForm, role: e.target.value })}
                >
                  <option value="client">{t('roleClient')}</option>
                  <option value="commercant">{t('roleMerchant')}</option>
                  <option value="admin">{t('roleAdmin')}</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">{lang === 'ar' ? 'حالة الحساب والتفعيل' : 'Statut du Compte'}</label>
                <select 
                  className="form-input" 
                  value={userForm.account_status || 'actif'} 
                  onChange={e => setUserForm({ ...userForm, account_status: e.target.value })}
                >
                  <option value="actif">🟢 {lang === 'ar' ? 'مفعل ونشط (Actif)' : 'Actif'}</option>
                  <option value="en_attente">🟡 {lang === 'ar' ? 'قيد المراجعة والاعتماد (En attente)' : 'En attente d\'activation'}</option>
                  <option value="bloque">🔴 {lang === 'ar' ? 'محظور / معلق (Bloqué)' : 'Bloqué / Suspendu'}</option>
                </select>
              </div>
            </div>

            {userForm.account_status === 'bloque' && (
              <div className="form-group" style={{ marginBottom: '15px' }}>
                <label className="form-label" style={{ color: '#ef4444' }}>{lang === 'ar' ? 'سبب ومبرر الحظر' : 'Motif du Blocage'}</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder={lang === 'ar' ? 'مثال: شكاية تلاعب أو عدم مطابقة الباتنت' : 'Ex: Réclamation client, non-conformité patente'} 
                  value={userForm.block_reason || ''} 
                  onChange={e => setUserForm({ ...userForm, block_reason: e.target.value })} 
                />
              </div>
            )}

            {userForm.role === 'commercant' && (
              <fieldset style={{ border: '1px solid var(--border-gold)', borderRadius: '4px', padding: '15px', marginBottom: '15px' }}>
                <legend style={{ color: 'var(--admin-gold)', padding: '0 8px', fontSize: '0.85rem' }}>{lang === 'ar' ? 'معلومات المتجر والتجارة' : 'Informations Boutique'}</legend>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
                  <div className="form-group">
                    <label className="form-label">{t('shopName')}</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      value={userForm.shopName} 
                      onChange={e => setUserForm({ ...userForm, shopName: e.target.value })} 
                      required 
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">{t('city')}</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      value={userForm.city} 
                      onChange={e => setUserForm({ ...userForm, city: e.target.value })} 
                    />
                  </div>
                </div>
                <div className="form-group" style={{ marginBottom: '15px' }}>
                  <label className="form-label">{t('address')}</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={userForm.address} 
                    onChange={e => setUserForm({ ...userForm, address: e.target.value })} 
                  />
                </div>

                {/* Patente Details & Document */}
                <div style={{ padding: '12px', background: 'rgba(212,175,55,0.06)', borderRadius: '6px', border: '1px solid rgba(212,175,55,0.2)', marginBottom: '15px' }}>
                  <div className="form-group" style={{ marginBottom: (userForm.patente_document || editingUser?.patente_document) ? '10px' : 0 }}>
                    <label className="form-label" style={{ fontWeight: 600, color: 'var(--admin-gold)' }}>
                      📜 {lang === 'ar' ? 'رقم الباتنت (Patente Professionnelle)' : 'Numéro de Patente Professionnelle'}
                    </label>
                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder="Ex: 12345678"
                      value={userForm.numero_patente || ''} 
                      onChange={e => setUserForm({ ...userForm, numero_patente: e.target.value })} 
                    />
                  </div>
                      {(userForm.patente_document || editingUser?.patente_document) && (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', padding: '8px 12px', background: 'rgba(0,0,0,0.2)', borderRadius: '4px', border: '1px dashed rgba(212,175,55,0.3)', fontSize: '0.8rem' }}>
                      <span style={{ color: 'var(--text-gray)' }}>
                        📎 {lang === 'ar' ? 'ملف وثيقة الباتنت :' : 'Document Patente :'} <strong style={{ color: 'var(--text-white)' }}>{userForm.patente_filename || editingUser?.patente_filename || 'patente_doc'}</strong>
                      </span>
                      <a 
                        href={`${API_URL.replace('/api', '')}${userForm.patente_document || editingUser?.patente_document}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: '#38bdf8', textDecoration: 'underline', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                      >
                        📥 {lang === 'ar' ? 'معاينة / تحميل' : 'Voir / Télécharger'}
                      </a>
                    </div>
                  )}
                </div>

                {/* Bureau de Garantie Details & Document */}
                <div style={{ padding: '12px', background: 'rgba(251,191,36,0.06)', borderRadius: '6px', border: '1px solid rgba(251,191,36,0.25)', marginBottom: '15px' }}>
                  <div className="form-group" style={{ marginBottom: (userForm.bureau_garantie_document || editingUser?.bureau_garantie_document) ? '10px' : 0 }}>
                    <label className="form-label" style={{ fontWeight: 600, color: '#fbbf24' }}>
                      🏛️ {lang === 'ar' ? 'رقم مكتب الضمانة (Bureau de Garantie)' : 'Numéro du Bureau de Garantie (Douanes & Impôts)'}
                    </label>
                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder={lang === 'ar' ? "مثال: BG-84920-CASA أو رقم الاعتماد" : "Ex: BG-84920-CASA"}
                      value={userForm.numero_bureau_garantie || ''} 
                      onChange={e => setUserForm({ ...userForm, numero_bureau_garantie: e.target.value })} 
                    />
                  </div>
                  {(userForm.bureau_garantie_document || editingUser?.bureau_garantie_document) && (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', padding: '8px 12px', background: 'rgba(0,0,0,0.2)', borderRadius: '4px', border: '1px dashed rgba(251,191,36,0.3)', fontSize: '0.8rem' }}>
                      <span style={{ color: 'var(--text-gray)' }}>
                        📎 {lang === 'ar' ? 'صورة / وثيقة مكتب الضمانة :' : 'Document Bureau de Garantie :'} <strong style={{ color: 'var(--text-white)' }}>{userForm.bureau_garantie_filename || editingUser?.bureau_garantie_filename || 'garantie_doc'}</strong>
                      </span>
                      <a 
                        href={`${API_URL.replace('/api', '')}${userForm.bureau_garantie_document || editingUser?.bureau_garantie_document}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: '#38bdf8', textDecoration: 'underline', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                      >
                        📥 {lang === 'ar' ? 'معاينة / تحميل' : 'Voir / Télécharger'}
                      </a>
                    </div>
                  )}
                </div>

                {/* CIN Recto / Verso Documents */}
                <div style={{ padding: '12px', background: 'rgba(56,189,248,0.05)', borderRadius: '6px', border: '1px solid rgba(56,189,248,0.2)', marginBottom: '15px' }}>
                  <div className="form-group" style={{ marginBottom: '10px' }}>
                    <label className="form-label" style={{ fontWeight: 600, color: '#38bdf8' }}>
                      🪪 {lang === 'ar' ? 'رقم بطاقة التعريف الوطنية (CIN)' : 'Numéro de Carte d\'Identité (CIN)'}
                    </label>
                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder="Ex: BE123456"
                      value={userForm.numero_cin || ''} 
                      onChange={e => setUserForm({ ...userForm, numero_cin: e.target.value })} 
                    />
                  </div>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
                    {/* CIN Recto */}
                    <div style={{ padding: '10px', background: 'rgba(0,0,0,0.2)', borderRadius: '6px', border: '1px dashed rgba(56,189,248,0.3)', fontSize: '0.8rem' }}>
                      <div style={{ fontWeight: 700, color: '#38bdf8', marginBottom: '6px' }}>
                        🪪 {lang === 'ar' ? 'الوجه الأمامي (Recto)' : 'Face Avant (Recto)'}
                      </div>
                      {(userForm.cin_recto_document || editingUser?.cin_recto_document) ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-gray)', wordBreak: 'break-all' }}>
                            {userForm.cin_recto_filename || editingUser?.cin_recto_filename || 'CIN_Recto'}
                          </span>
                          <a 
                            href={`${API_URL.replace('/api', '')}${userForm.cin_recto_document || editingUser?.cin_recto_document}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ color: '#38bdf8', textDecoration: 'underline', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.78rem' }}
                          >
                            📥 {lang === 'ar' ? 'معاينة / تحميل' : 'Voir / Télécharger'}
                          </a>
                        </div>
                      ) : (
                        <span style={{ color: 'var(--text-gray)', fontSize: '0.75rem' }}>
                          {lang === 'ar' ? 'لا توجد وثيقة مرفقة' : 'Aucun document joint'}
                        </span>
                      )}
                    </div>

                    {/* CIN Verso */}
                    <div style={{ padding: '10px', background: 'rgba(0,0,0,0.2)', borderRadius: '6px', border: '1px dashed rgba(56,189,248,0.3)', fontSize: '0.8rem' }}>
                      <div style={{ fontWeight: 700, color: '#38bdf8', marginBottom: '6px' }}>
                        🪪 {lang === 'ar' ? 'الوجه الخلفي (Verso)' : 'Face Arrière (Verso)'}
                      </div>
                      {(userForm.cin_verso_document || editingUser?.cin_verso_document) ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-gray)', wordBreak: 'break-all' }}>
                            {userForm.cin_verso_filename || editingUser?.cin_verso_filename || 'CIN_Verso'}
                          </span>
                          <a 
                            href={`${API_URL.replace('/api', '')}${userForm.cin_verso_document || editingUser?.cin_verso_document}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ color: '#38bdf8', textDecoration: 'underline', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.78rem' }}
                          >
                            📥 {lang === 'ar' ? 'معاينة / تحميل' : 'Voir / Télécharger'}
                          </a>
                        </div>
                      ) : (
                        <span style={{ color: 'var(--text-gray)', fontSize: '0.75rem' }}>
                          {lang === 'ar' ? 'لا توجد وثيقة مرفقة' : 'Aucun document joint'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Initial Subscription Plan */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', paddingTop: '12px', borderTop: '1px dashed rgba(212,175,55,0.25)' }}>
                  <div className="form-group">
                    <label className="form-label">{lang === 'ar' ? 'باقة الاشتراك' : 'Forfait d\'Abonnement'}</label>
                    <select
                      className="form-input"
                      value={userForm.plan_id || 'plan_starter'}
                      onChange={e => setUserForm({ ...userForm, plan_id: e.target.value })}
                    >
                      {(subscriptionsData?.plans || []).map(p => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.price_monthly} MAD/m - {p.max_products > 1000 ? 'Illimité' : `${p.max_products} bijoux`})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">{lang === 'ar' ? 'دورة الفوترة' : 'Cycle de Facturation'}</label>
                    <select
                      className="form-input"
                      value={userForm.billing_cycle || 'monthly'}
                      onChange={e => setUserForm({ ...userForm, billing_cycle: e.target.value })}
                    >
                      <option value="monthly">{lang === 'ar' ? 'شهري' : 'Mensuel'}</option>
                      <option value="annual">{lang === 'ar' ? 'سنوي' : 'Annuel'}</option>
                    </select>
                  </div>
                </div>
              </fieldset>
            )}

            <div style={{ display: 'flex', gap: '15px', justifyContent: 'flex-end', marginTop: '20px' }}>
              <button type="button" className="btn-outline-gold" style={{ padding: '8px 16px', fontSize: '0.8rem' }} onClick={() => setShowUserModal(false)}>
                {t('cancel')}
              </button>
              <button type="submit" className="btn-gold" style={{ margin: 0, padding: '8px 16px', fontSize: '0.8rem' }}>
                {editingUser ? (lang === 'ar' ? 'تحديث' : 'Mettre à jour') : (lang === 'ar' ? 'إنشاء' : 'Créer')}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Bids List Modal */}
      {showBidsModal && selectedAuctionForBids && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '600px', width: '90%' }}>
            <button type="button" className="modal-close-btn" onClick={() => { setShowBidsModal(false); setSelectedAuctionForBids(null); }}>✕</button>
            <h3 style={{ color: 'var(--admin-gold)', marginBottom: '15px', fontFamily: 'Playfair Display' }}>
              Offres pour : {selectedAuctionForBids.bijou?.titre}
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-gray)', marginBottom: '20px' }}>
              Prix de départ : {selectedAuctionForBids.prix_depart} MAD | Offre max : {selectedAuctionForBids.highestBid} MAD
            </p>

            <div className="table-container" style={{ maxHeight: '300px', overflowY: 'auto' }}>
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Gagnant / Enchérisseur</th>
                    <th>Montant</th>
                    <th>Date</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {auctionBids.length === 0 ? (
                    <tr>
                      <td colSpan="4" style={{ textAlign: 'center', color: 'var(--text-gray)', padding: '20px' }}>Aucune offre placée.</td>
                    </tr>
                  ) : (
                    auctionBids.map(bid => (
                      <tr key={bid.id}>
                        <td>
                          <div><strong>{bid.clientName}</strong></div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-gray)' }}>{bid.clientEmail}</div>
                        </td>
                        <td style={{ color: 'var(--admin-gold)', fontWeight: 'bold' }}>{bid.montant} MAD</td>
                        <td style={{ fontSize: '0.8rem' }}>{new Date(bid.date_offre).toLocaleString()}</td>
                        <td>
                          <button className="btn-reject" style={{ padding: '4px 8px', fontSize: '0.75rem', margin: 0 }} onClick={() => handleDeleteBid(bid.id)}>
                            🗑️
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
              <button type="button" className="btn-outline-gold" style={{ padding: '8px 16px', fontSize: '0.85rem' }} onClick={() => { setShowBidsModal(false); setSelectedAuctionForBids(null); }}>
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Product Modal */}
      {showProductModal && (
        <div className="modal-overlay">
          <form className="modal-content" onSubmit={handleProductSubmit} style={{ maxWidth: '600px' }}>
            <button type="button" className="modal-close-btn" onClick={() => setShowProductModal(false)}>✕</button>
            <h3 style={{ color: 'var(--admin-gold)', marginBottom: '25px', fontFamily: 'Playfair Display', fontSize: '1.6rem' }}>
              {editingProduct ? t('editProduct') : t('newProduct')}
            </h3>

            {/* ======================================================== */}
            {/* 📸🎥 PHOTOS ET VIDÉO DU BIJOU (MULTI-PHOTOS & VIDÉO 10S MAX) */}
            {/* ======================================================== */}
            <div style={{
              background: 'rgba(212, 175, 55, 0.05)',
              border: '1.5px dashed var(--admin-gold)',
              borderRadius: '12px',
              padding: '16px',
              marginBottom: '20px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
                <label className="form-label" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-dark)' }}>
                  <span style={{ fontSize: '1.2rem' }}>📸🎥</span>
                  <span>Photos et Vidéo du Bijou (Photos ou vidéo de 10s max)</span>
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-gray)', background: 'var(--bg-surface-elevated)', padding: '3px 8px', borderRadius: '12px', border: '1px solid var(--border-subtle)' }}>
                    {(productForm.images || []).length} photo{((productForm.images || []).length > 1) ? 's' : ''}
                  </span>
                  {productForm.video && (
                    <span style={{ fontSize: '0.78rem', color: '#10b981', background: 'rgba(16, 185, 129, 0.15)', padding: '3px 8px', borderRadius: '12px', border: '1px solid #10b981', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      🎥 Vidéo ({adminVideoDuration ? `${adminVideoDuration}s` : '10s max'})
                    </span>
                  )}
                </div>
              </div>

              {/* Galerie des images et vidéo sélectionnées */}
              {((productForm.images || []).length > 0 || productForm.video) && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(85px, 1fr))', gap: '10px', marginBottom: '14px' }}>
                  {/* Prévisualisation Vidéo */}
                  {productForm.video && (
                    <div 
                      style={{ 
                        position: 'relative', 
                        aspectRatio: '1/1', 
                        borderRadius: '8px', 
                        overflow: 'hidden', 
                        border: '2px solid #10b981',
                        boxShadow: '0 0 10px rgba(16, 185, 129, 0.45)',
                        background: '#07090b',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <video 
                        src={productForm.video} 
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                        muted 
                        playsInline 
                        loop
                      />
                      <span style={{
                        position: 'absolute',
                        top: '4px',
                        left: '4px',
                        background: 'rgba(16, 185, 129, 0.95)',
                        color: '#fff',
                        fontSize: '0.6rem',
                        fontWeight: 800,
                        padding: '2px 5px',
                        borderRadius: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '3px'
                      }}>
                        ▶ {adminVideoDuration ? `${adminVideoDuration}s` : '10s'}
                      </span>
                      <button
                        type="button"
                        onClick={handleAdminRemoveVideo}
                        title="Supprimer cette vidéo"
                        style={{
                          position: 'absolute',
                          top: '4px',
                          right: '4px',
                          background: 'rgba(220, 38, 38, 0.85)',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '50%',
                          width: '20px',
                          height: '20px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.7rem',
                          cursor: 'pointer',
                          fontWeight: 700
                        }}
                      >
                        ✕
                      </button>
                    </div>
                  )}

                  {productForm.images.map((img, idx) => (
                    <div 
                      key={idx} 
                      style={{ 
                        position: 'relative', 
                        aspectRatio: '1/1', 
                        borderRadius: '8px', 
                        overflow: 'hidden', 
                        border: idx === 0 ? '2.5px solid var(--admin-gold)' : '1px solid var(--border-subtle)',
                        boxShadow: idx === 0 ? '0 0 8px rgba(212, 175, 55, 0.35)' : 'none',
                        background: '#07090b'
                      }}
                    >
                      <img 
                        src={img} 
                        alt={`Bijou ${idx + 1}`} 
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                      />

                      {/* Badge Photo Principale */}
                      {idx === 0 ? (
                        <span style={{
                          position: 'absolute',
                          top: '4px',
                          left: '4px',
                          background: 'linear-gradient(135deg, #d4af37, #b8860b)',
                          color: '#000',
                          fontSize: '0.58rem',
                          fontWeight: 800,
                          padding: '2px 4px',
                          borderRadius: '4px'
                        }}>
                          ★ PRINCIPALE
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleAdminSetPrimaryImage(idx)}
                          title="Définir comme photo principale"
                          style={{
                            position: 'absolute',
                            top: '4px',
                            left: '4px',
                            background: 'rgba(0,0,0,0.7)',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '4px',
                            fontSize: '0.6rem',
                            cursor: 'pointer',
                            padding: '2px 4px'
                          }}
                        >
                          ★ Définir
                        </button>
                      )}

                      {/* Bouton de suppression */}
                      <button
                        type="button"
                        onClick={() => handleAdminRemoveImage(idx)}
                        title="Supprimer cette photo"
                        style={{
                          position: 'absolute',
                          top: '4px',
                          right: '4px',
                          background: 'rgba(220, 38, 38, 0.85)',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '50%',
                          width: '20px',
                          height: '20px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.7rem',
                          cursor: 'pointer',
                          fontWeight: 700
                        }}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Bouton d'ajout de fichiers multiples, vidéo 10s & URL */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center' }}>
                <input 
                  type="file" 
                  multiple 
                  accept="image/*" 
                  id="admin-multi-photo-input"
                  style={{ display: 'none' }}
                  onChange={handleAdminFilesSelected}
                />
                <label 
                  htmlFor="admin-multi-photo-input" 
                  className="btn-gold"
                  style={{ 
                    cursor: 'pointer', 
                    fontSize: '0.8rem', 
                    padding: '7px 14px', 
                    display: 'inline-flex', 
                    alignItems: 'center', 
                    gap: '6px',
                    margin: 0
                  }}
                >
                  📁 Choisir des photos
                </label>

                {/* Bouton Ajout / Changement Vidéo 10s */}
                <input 
                  type="file" 
                  accept="video/*" 
                  id="admin-video-input"
                  style={{ display: 'none' }}
                  onChange={handleAdminVideoSelected}
                />
                <label 
                  htmlFor="admin-video-input" 
                  className="btn-outline-gold"
                  style={{ 
                    cursor: 'pointer', 
                    fontSize: '0.8rem', 
                    padding: '7px 14px', 
                    display: 'inline-flex', 
                    alignItems: 'center', 
                    gap: '6px',
                    margin: 0,
                    background: productForm.video ? 'rgba(16, 185, 129, 0.15)' : undefined,
                    borderColor: productForm.video ? '#10b981' : undefined,
                    color: productForm.video ? '#10b981' : undefined
                  }}
                >
                  🎥 {productForm.video ? 'Changer la vidéo (10s max)' : 'Vidéo du bijou (10s max)'}
                </label>

                <div style={{ display: 'flex', flex: 1, minWidth: '220px', gap: '6px' }}>
                  <input 
                    type="text"
                    placeholder="Ou collez une URL d'image ou vidéo..."
                    value={adminCustomImageUrl}
                    onChange={e => setAdminCustomImageUrl(e.target.value)}
                    className="form-input"
                    style={{ fontSize: '0.82rem', padding: '6px 10px', margin: 0 }}
                  />
                  <button 
                    type="button"
                    onClick={handleAdminAddImageUrl}
                    className="btn-outline-gold"
                    style={{ padding: '6px 12px', fontSize: '0.78rem', whiteSpace: 'nowrap' }}
                  >
                    ➕ Ajouter
                  </button>
                </div>
              </div>

              {/* Message d'erreur vidéo avec bouton pour ouvrir l'outil de découpage */}
              {adminVideoError && (
                <div style={{
                  marginTop: '10px',
                  padding: '10px 14px',
                  background: 'rgba(245, 158, 11, 0.12)',
                  border: '1px solid rgba(245, 158, 11, 0.35)',
                  borderRadius: '10px',
                  color: '#fbbf24',
                  fontSize: '0.84rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '10px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>✂️</span>
                    <span>{adminVideoError}</span>
                  </div>
                  {adminPendingVideoFile && (
                    <button
                      type="button"
                      onClick={() => setShowAdminTrimModal(true)}
                      style={{
                        background: 'linear-gradient(135deg, #d4af37 0%, #aa771c 100%)',
                        color: '#000',
                        border: 'none',
                        borderRadius: '8px',
                        padding: '6px 14px',
                        fontWeight: 800,
                        fontSize: '0.8rem',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        boxShadow: '0 2px 8px rgba(212, 175, 55, 0.3)'
                      }}
                    >
                      <span>✂️</span>
                      <span>Découper la vidéo (10s max)</span>
                    </button>
                  )}
                </div>
              )}

              {/* Modal de découpage vidéo */}
              {showAdminTrimModal && adminPendingVideoFile && (
                <VideoTrimModal
                  isOpen={showAdminTrimModal}
                  videoFile={adminPendingVideoFile}
                  lang="fr"
                  onClose={() => setShowAdminTrimModal(false)}
                  onTrimComplete={(trimmedDataUrl, trimmedDuration) => {
                    setProductForm(prev => ({
                      ...prev,
                      video: trimmedDataUrl
                    }));
                    setAdminVideoDuration(trimmedDuration);
                    setAdminVideoError('');
                    setShowAdminTrimModal(false);
                    setAdminPendingVideoFile(null);
                  }}
                />
              )}
            </div>

            {/* Multilingual 3-Language Content Section */}
            <div style={{ 
              background: 'rgba(212, 175, 55, 0.06)', 
              border: '1.5px solid var(--admin-gold)', 
              borderRadius: '12px', 
              padding: '16px', 
              marginBottom: '20px' 
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
                {/* Language Switcher Tabs */}
                <div style={{ display: 'flex', gap: '6px', background: 'rgba(0,0,0,0.2)', padding: '3px', borderRadius: '8px' }}>
                  <button
                    type="button"
                    onClick={() => switchProductLangTab('ar')}
                    style={{
                      padding: '5px 12px',
                      borderRadius: '6px',
                      border: 'none',
                      fontSize: '0.82rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      background: productLangTab === 'ar' ? 'var(--admin-gold)' : 'transparent',
                      color: productLangTab === 'ar' ? '#000' : 'var(--text-gray)'
                    }}
                  >
                    🇲🇦 العربية {productForm.titre_ar ? '✓' : ''}
                  </button>
                  <button
                    type="button"
                    onClick={() => switchProductLangTab('fr')}
                    style={{
                      padding: '5px 12px',
                      borderRadius: '6px',
                      border: 'none',
                      fontSize: '0.82rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      background: productLangTab === 'fr' ? 'var(--admin-gold)' : 'transparent',
                      color: productLangTab === 'fr' ? '#000' : 'var(--text-gray)'
                    }}
                  >
                    🇫🇷 Français {productForm.titre_fr ? '✓' : ''}
                  </button>
                </div>

                {/* Magic Auto-Translate Button */}
                <button
                  type="button"
                  onClick={() => handleAutoTranslateProduct(productLangTab)}
                  disabled={isTranslating}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 14px',
                    borderRadius: '8px',
                    background: 'linear-gradient(135deg, #d4af37, #b8860b)',
                    color: '#07090b',
                    fontWeight: 700,
                    fontSize: '0.8rem',
                    border: 'none',
                    cursor: isTranslating ? 'wait' : 'pointer',
                    boxShadow: '0 2px 8px rgba(212, 175, 55, 0.25)'
                  }}
                  title="Traduit automatiquement le contenu renseigné vers l'autre langue"
                >
                  {isTranslating 
                    ? (lang === 'ar' ? '⏳ جاري الترجمة...' : '⏳ Traduction en cours...') 
                    : (lang === 'ar' ? '✨ ترجمة تلقائية (عربي ⇄ فرنسي)' : '✨ Traduction automatique (Arabe ⇄ Français)')
                  }
                </button>
              </div>

              {translateSuccessMsg && (
                <div style={{ 
                  background: 'rgba(16, 185, 129, 0.15)', 
                  border: '1px solid rgba(16, 185, 129, 0.4)', 
                  borderRadius: '6px', 
                  padding: '6px 12px', 
                  fontSize: '0.82rem', 
                  color: '#10b981', 
                  marginBottom: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  <span>✓</span> {translateSuccessMsg}
                </div>
              )}

              {/* Active Tab Inputs */}
              {productLangTab === 'ar' && (
                <div dir="rtl">
                  <div className="form-group" style={{ marginBottom: '14px' }}>
                    <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between', textAlign: 'right' }}>
                      <span>{lang === 'ar' ? 'العنوان باللغة العربية 🇲🇦' : 'Titre en Arabe 🇲🇦'}</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-gray)' }}>{lang === 'ar' ? 'مطلوب' : 'Obligatoire'}</span>
                    </label>
                    <input 
                      type="text" 
                      className="form-input" 
                      dir="rtl"
                      placeholder="مثال: خاتم سوليتير ألماس ذهب أبيض 18 قيراط"
                      value={productForm.titre_ar} 
                      onChange={e => setProductForm({ ...productForm, titre_ar: e.target.value })} 
                    />
                    {/* اقتراحات سريعة للعنوان */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '8px', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-white, #fff)' }}>⚡ اقتراحات :</span>
                      {(commissionConfig.product_suggestions?.titre_ar || DEFAULT_SUGGESTIONS.titre_ar).map(sug => (
                        <button
                          key={sug}
                          type="button"
                          onClick={() => setProductForm({ ...productForm, titre_ar: sug })}
                          style={{
                            background: '#ffffff',
                            border: '1.5px solid #d4af37',
                            borderRadius: '14px',
                            padding: '4px 10px',
                            fontSize: '0.78rem',
                            fontWeight: 700,
                            color: '#8a6410',
                            cursor: 'pointer',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.08)'
                          }}
                        >
                          {sug}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label" style={{ textAlign: 'right' }}>{lang === 'ar' ? 'الوصف باللغة العربية 🇲🇦' : 'Description en Arabe 🇲🇦'}</label>
                    <textarea 
                      className="form-input" 
                      rows="3"
                      dir="rtl"
                      placeholder="وصف تفصيلي للقطعة باللغة العربية..."
                      value={productForm.description_ar} 
                      onChange={e => setProductForm({ ...productForm, description_ar: e.target.value })} 
                    />
                    {/* اقتراحات سريعة للوصف */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '8px', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-white, #fff)' }}>⚡ أضف للوصف :</span>
                      {(commissionConfig.product_suggestions?.description_ar || DEFAULT_SUGGESTIONS.description_ar).map(sug => (
                        <button
                          key={sug}
                          type="button"
                          onClick={() => setProductForm({ 
                            ...productForm, 
                            description_ar: productForm.description_ar ? `${productForm.description_ar} • ${sug}` : sug 
                          })}
                          style={{
                            background: '#ffffff',
                            border: '1px solid #cbd5e1',
                            borderRadius: '14px',
                            padding: '5px 12px',
                            fontSize: '0.78rem',
                            fontWeight: 600,
                            color: '#1e293b',
                            cursor: 'pointer',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.08)'
                          }}
                        >
                          + {sug}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {productLangTab === 'fr' && (
                <div dir="ltr">
                  <div className="form-group" style={{ marginBottom: '14px' }}>
                    <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>{lang === 'ar' ? 'العنوان باللغة الفرنسية 🇫🇷' : 'Titre en Français 🇫🇷'}</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-gray)' }}>{lang === 'ar' ? 'مطلوب' : 'Obligatoire'}</span>
                    </label>
                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder="ex: Bague Solitaire Diamant Or Blanc 18K"
                      value={productForm.titre_fr} 
                      onChange={e => setProductForm({ ...productForm, titre_fr: e.target.value, titre: e.target.value })} 
                    />
                    {/* Suggestions Titre Rapide */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '8px', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-white, #fff)' }}>⚡ Suggestions :</span>
                      {(commissionConfig.product_suggestions?.titre_fr || DEFAULT_SUGGESTIONS.titre_fr).map(sug => (
                        <button
                          key={sug}
                          type="button"
                          onClick={() => setProductForm({ ...productForm, titre_fr: sug, titre: sug })}
                          style={{
                            background: '#ffffff',
                            border: '1.5px solid #d4af37',
                            borderRadius: '14px',
                            padding: '4px 10px',
                            fontSize: '0.78rem',
                            fontWeight: 700,
                            color: '#8a6410',
                            cursor: 'pointer',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.08)'
                          }}
                        >
                          {sug}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">{lang === 'ar' ? 'الوصف باللغة الفرنسية 🇫🇷' : 'Description en Français 🇫🇷'}</label>
                    <textarea 
                      className="form-input" 
                      rows="3"
                      placeholder="Description détaillée du bijou en français..."
                      value={productForm.description_fr} 
                      onChange={e => setProductForm({ ...productForm, description_fr: e.target.value, description: e.target.value })} 
                    />
                    {/* Suggestions Description Rapide */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '8px', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-white, #fff)' }}>⚡ Insérer dans le texte :</span>
                      {(commissionConfig.product_suggestions?.description_fr || DEFAULT_SUGGESTIONS.description_fr).map(sug => (
                        <button
                          key={sug}
                          type="button"
                          onClick={() => setProductForm({ 
                            ...productForm, 
                            description_fr: productForm.description_fr ? `${productForm.description_fr} • ${sug}` : sug,
                            description: productForm.description_fr ? `${productForm.description_fr} • ${sug}` : sug
                          })}
                          style={{
                            background: '#ffffff',
                            border: '1px solid #cbd5e1',
                            borderRadius: '14px',
                            padding: '5px 12px',
                            fontSize: '0.78rem',
                            fontWeight: 600,
                            color: '#1e293b',
                            cursor: 'pointer',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.08)'
                          }}
                        >
                          + {sug}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 1. POIDS, PRIX DU GRAMME ET PRIX TOTAL CALCULÉ */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '14px', marginBottom: '14px' }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">{t('weight')} (غ / g) *</label>
                <input 
                  type="number" 
                  step="0.01"
                  min="0.1"
                  placeholder="ex: 4.5"
                  className="form-input" 
                  value={productForm.gramme} 
                  onChange={e => handleAdminGrammeChange(e.target.value)} 
                  required 
                />
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">{lang === 'ar' ? 'سعر الغرام (درهم / غ)' : 'Prix du gramme (MAD/g)'}</label>
                <input 
                  type="number" 
                  step="1"
                  min="0"
                  placeholder="ex: 850"
                  className="form-input" 
                  value={productForm.prix_gramme || ''} 
                  onChange={e => handleAdminPrixGrammeChange(e.target.value)} 
                />
                {/* اقتراحات سريعة لسعر الغرام */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '6px' }}>
                  {(commissionConfig.product_suggestions?.prix_gramme || DEFAULT_SUGGESTIONS.prix_gramme).map(pg => (
                    <button
                      key={pg}
                      type="button"
                      onClick={() => handleAdminPrixGrammeChange(pg)}
                      style={{
                        background: '#ffffff',
                        border: '1.5px solid #d4af37',
                        borderRadius: '12px',
                        padding: '3px 10px',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        color: '#8a6410',
                        cursor: 'pointer',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.08)'
                      }}
                    >
                      {pg} {lang === 'ar' ? 'د.م' : 'DH'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">{lang === 'ar' ? 'سعر القطعة (درهم / MAD) *' : `${t('price')} (MAD) *`}</label>
                <input 
                  type="number" 
                  min="100"
                  placeholder="ex: 6400"
                  className="form-input" 
                  value={productForm.prix} 
                  onChange={e => handleAdminTotalPriceChange(e.target.value)} 
                  required 
                />
              </div>
            </div>

            {/* Calculateur de prix live: gramme * prix_gramme */}
            {(parseFloat(productForm.gramme) > 0 && parseFloat(productForm.prix_gramme) > 0) && (
              <div style={{
                background: 'rgba(212, 175, 55, 0.12)',
                border: '1px solid var(--admin-gold)',
                borderRadius: '8px',
                padding: '8px 14px',
                fontSize: '0.84rem',
                color: 'var(--admin-gold)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '15px'
              }}>
                <span>🧮</span>
                <span>
                  <strong>{lang === 'ar' ? 'سعر القطعة المحسوب : ' : 'Prix calculé : '}</strong>
                  {productForm.gramme}g × {productForm.prix_gramme} MAD/g = <strong style={{ color: '#fff', fontSize: '0.98rem', textDecoration: 'underline' }}>{Math.round(parseFloat(productForm.gramme) * parseFloat(productForm.prix_gramme)).toLocaleString()} MAD</strong>
                </span>
              </div>
            )}

            {/* 2. CATÉGORIE & LISTE DES VILLES */}
            <div className="admin-form-grid-2">
              <div className="form-group">
                <label className="form-label">{t('category')}</label>
                <select 
                  className="form-input" 
                  value={productForm.category_id} 
                  onChange={e => setProductForm({ ...productForm, category_id: e.target.value })}
                  required
                >
                  <option value="">-- {t('category')} --</option>
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>
                      {lang === 'fr' ? c.nom_fr : (lang === 'ar' ? c.nom_ar : c.nom_en)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">{t('city')}</label>
                <select 
                  className="form-input" 
                  value={productForm.city || 'Casablanca'} 
                  onChange={e => setProductForm({ ...productForm, city: e.target.value })} 
                  required 
                >
                  {ALL_MOROCCAN_CITIES.map(city => (
                    <option key={city.key} value={city.key}>
                      {lang === 'ar' ? `${city.ar} (${city.fr})` : `${city.fr} (${city.ar})`}
                    </option>
                  ))}
                  <option value="Autre">{lang === 'ar' ? 'مدينة أخرى' : 'Autre Ville'}</option>
                </select>
              </div>
            </div>

            {/* 3. ÉTAT DU BIJOU : Neuf, Bonne occasion & Pièce antique */}
            <div className="form-group" style={{ marginBottom: '18px' }}>
              <label className="form-label">{lang === 'ar' ? 'حالة القطعة' : 'État du Bijou'}</label>
              <div className="product-condition-grid">
                {[
                  { value: 'Neuf', fr: '✨ Neuf', ar: '✨ جديد' },
                  { value: 'Occasion', fr: '🏷️ Bonne occasion', ar: '🏷️ مستعمل ممتازة' },
                  { value: 'Artisanal', fr: '🏺 Pièce antique', ar: '🏺 قطعة أثرية' }
                ].map(item => {
                  const isActive = (productForm.etat || 'Neuf') === item.value;
                  return (
                    <button
                      key={item.value}
                      type="button"
                      onClick={() => setProductForm({ ...productForm, etat: item.value })}
                      style={{
                        padding: '10px 4px',
                        minHeight: '48px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: '8px',
                        border: isActive ? '1.5px solid var(--admin-gold)' : '1px solid rgba(255,255,255,0.12)',
                        background: isActive ? 'rgba(212, 175, 55, 0.16)' : 'rgba(255,255,255,0.03)',
                        color: isActive ? 'var(--admin-gold)' : 'var(--text-gray)',
                        fontWeight: 700,
                        fontSize: 'clamp(0.72rem, 2.4vw, 0.85rem)',
                        lineHeight: 1.25,
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        textAlign: 'center',
                        touchAction: 'manipulation',
                        WebkitTapHighlightColor: 'transparent'
                      }}
                    >
                      {lang === 'ar' ? item.ar : item.fr}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Si enchère : Durée */}
            <div style={{ display: 'flex', gap: '15px', justifyContent: 'flex-end', marginTop: '20px' }}>
              <button type="button" className="btn-outline-gold" style={{ padding: '10px 20px' }} onClick={() => setShowProductModal(false)}>
                {t('cancel')}
              </button>
              <button 
                type="submit" 
                className="btn-gold" 
                style={{ margin: 0, padding: '10px 20px', opacity: isSubmittingProduct ? 0.7 : 1, cursor: isSubmittingProduct ? 'not-allowed' : 'pointer' }}
                disabled={isSubmittingProduct}
              >
                {isSubmittingProduct ? '⏳ Enregistrement...' : t('saveConfig')}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* PLAN EDITING MODAL */}
      {editingPlanModal && (
        <div className="modal-overlay" onClick={() => setEditingPlanModal(null)}>
          <div className="modal-content" style={{ maxWidth: '560px', padding: '30px' }} onClick={e => e.stopPropagation()}>
            <button type="button" className="modal-close-btn" onClick={() => setEditingPlanModal(null)}>✕</button>
            <div className="modal-header" style={{ marginBottom: '20px' }}>
              <h3 style={{ color: 'var(--admin-gold)', margin: 0, fontFamily: 'Playfair Display', fontSize: '1.5rem' }}>
                {editingPlanModal.id ? (lang === 'ar' ? `تعديل الباقة : ${editingPlanModal.name}` : `Édition du Forfait : ${editingPlanModal.name}`) : (lang === 'ar' ? 'إنشاء باقة جديدة' : 'Créer un Nouveau Forfait')}
              </h3>
            </div>
            <form onSubmit={handleSavePlanConfig}>
              <div className="form-group" style={{ marginBottom: '14px' }}>
                <label className="form-label">{lang === 'ar' ? 'اسم الباقة' : 'Nom du Forfait'}</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={editingPlanModal.name} 
                  onChange={e => setEditingPlanModal({ ...editingPlanModal, name: e.target.value })} 
                  placeholder={lang === 'ar' ? 'مثال: باقة النخبة الذهبية' : 'Ex: Pack Élite Joaillier'}
                  required 
                />
              </div>

              <div className="form-group" style={{ marginBottom: '14px' }}>
                <label className="form-label">{lang === 'ar' ? 'الشعار / الوصف المختصر' : 'Slogan / Sous-titre'}</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={editingPlanModal.tagline} 
                  onChange={e => setEditingPlanModal({ ...editingPlanModal, tagline: e.target.value })} 
                  placeholder={lang === 'ar' ? 'وصف تسويقي للباقة...' : 'Formule sur mesure pour bijoutiers...'}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '14px' }}>
                <div className="form-group">
                  <label className="form-label">{lang === 'ar' ? 'السعر الشهري (MAD)' : 'Prix Mensuel (MAD)'}</label>
                  <input 
                    type="number" 
                    min="0"
                    className="form-input" 
                    value={editingPlanModal.price_monthly} 
                    onChange={e => setEditingPlanModal({ ...editingPlanModal, price_monthly: parseFloat(e.target.value) || 0 })} 
                    required 
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">{lang === 'ar' ? 'السعر السنوي (MAD)' : 'Prix Annuel (MAD)'}</label>
                  <input 
                    type="number" 
                    min="0"
                    className="form-input" 
                    value={editingPlanModal.price_annual} 
                    onChange={e => setEditingPlanModal({ ...editingPlanModal, price_annual: parseFloat(e.target.value) || 0 })} 
                    required 
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '20px' }}>
                <div className="form-group">
                  <label className="form-label">{lang === 'ar' ? 'أقصى عدد معروضات' : 'Quota Dépôts Bijoux Max'}</label>
                  <input 
                    type="number" 
                    min="1"
                    className="form-input" 
                    value={editingPlanModal.max_products} 
                    onChange={e => setEditingPlanModal({ ...editingPlanModal, max_products: parseInt(e.target.value) || 5 })} 
                    required 
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">{lang === 'ar' ? 'عمولة المنصة (%)' : 'Taux de Commission (%)'}</label>
                  <input 
                    type="number" 
                    step="0.1"
                    min="0"
                    max="100"
                    className="form-input" 
                    value={editingPlanModal.commission_rate} 
                    onChange={e => setEditingPlanModal({ ...editingPlanModal, commission_rate: parseFloat(e.target.value) || 0 })} 
                    required 
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '10px' }}>
                <button type="button" className="btn-outline-gold" style={{ padding: '8px 18px', fontSize: '0.85rem' }} onClick={() => setEditingPlanModal(null)}>
                  {t('cancel')}
                </button>
                <button type="submit" className="btn-gold" style={{ margin: 0, padding: '8px 20px', fontSize: '0.85rem' }}>
                  {editingPlanModal.id ? (lang === 'ar' ? 'حفظ التعديلات' : 'Enregistrer les modifications') : (lang === 'ar' ? 'إنشاء الباقة' : 'Créer le forfait')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MERCHANT SUBSCRIPTION MODAL */}
      {merchantSubModal && (
        <div className="modal-overlay" onClick={() => setMerchantSubModal(null)}>
          <div className="modal-content" style={{ maxWidth: '500px', padding: '30px' }} onClick={e => e.stopPropagation()}>
            <button type="button" className="modal-close-btn" onClick={() => setMerchantSubModal(null)}>✕</button>
            <div className="modal-header" style={{ marginBottom: '20px' }}>
              <h3 style={{ color: 'var(--admin-gold)', margin: 0, fontFamily: 'Playfair Display', fontSize: '1.4rem' }}>
                {lang === 'ar' ? 'تعديل باقة التاجر :' : 'Modifier le Forfait :'} {merchantSubModal.shopName}
              </h3>
            </div>
            <form onSubmit={(e) => {
              e.preventDefault();
              const planId = e.target.plan_id.value;
              const cycle = e.target.billing_cycle.value;
              handleUpdateMerchantPlan(merchantSubModal.id, planId, cycle);
            }}>
              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label className="form-label">{lang === 'ar' ? 'اختيار الباقة' : 'Sélectionner la Formule'}</label>
                <select 
                  name="plan_id" 
                  className="form-input" 
                  defaultValue={merchantSubModal.subscription?.plan_id || 'plan_starter'}
                >
                  {(subscriptionsData?.plans || []).map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} — {p.price_monthly} MAD/mois ({p.max_products > 1000 ? (lang === 'ar' ? 'غير محدود' : 'Illimité') : `${p.max_products} bijoux`}, {p.commission_rate}%)
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: '24px' }}>
                <label className="form-label">{lang === 'ar' ? 'دورة الفوترة' : 'Cycle de Facturation'}</label>
                <select 
                  name="billing_cycle" 
                  className="form-input" 
                  defaultValue={merchantSubModal.subscription?.billing_cycle || 'monthly'}
                >
                  <option value="monthly">{lang === 'ar' ? 'فوترة شهرية' : 'Facturation Mensuelle'}</option>
                  <option value="annual">{lang === 'ar' ? 'فوترة سنوية (-20%)' : 'Facturation Annuelle (-20%)'}</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button type="button" className="btn-outline-gold" style={{ padding: '8px 18px', fontSize: '0.85rem' }} onClick={() => setMerchantSubModal(null)}>
                  {t('cancel')}
                </button>
                <button type="submit" className="btn-gold" style={{ margin: 0, padding: '8px 20px', fontSize: '0.85rem' }}>
                  {lang === 'ar' ? 'تطبيق التعديلات' : 'Appliquer les modifications'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Mobile Bottom Navigation Bar (iPhone & Android Native App Experience) */}
      <nav className="mobile-bottom-nav">
        {!isMerchant ? (
          <>
            <div 
              className={`mobile-bottom-nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
              onClick={() => { setActiveTab('dashboard'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
            >
              <span className="mobile-bottom-nav-icon">📊</span>
              <span>{t('dashboard')}</span>
            </div>

            <div 
              className={`mobile-bottom-nav-item ${activeTab === 'validation' ? 'active' : ''}`}
              onClick={() => { setActiveTab('validation'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
            >
              <span className="mobile-bottom-nav-icon">⚖️</span>
              <span>{t('validationQueue')}</span>
              {pendingProducts.length > 0 && (
                <span className="mobile-bottom-nav-badge">{pendingProducts.length}</span>
              )}
            </div>
          </>
        ) : (
          <div 
            className={`mobile-bottom-nav-item ${activeTab === 'sales_history' ? 'active' : ''}`}
            onClick={() => { setActiveTab('sales_history'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
          >
            <span className="mobile-bottom-nav-icon">📜</span>
            <span>{lang === 'ar' ? 'مبيعاتي' : 'Ventes'}</span>
          </div>
        )}

        <div 
          className={`mobile-bottom-nav-item ${activeTab === 'products' ? 'active' : ''}`}
          onClick={() => { setActiveTab('products'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
        >
          <span className="mobile-bottom-nav-icon">💎</span>
          <span>{isMerchant ? (lang === 'ar' ? 'مجوهراتي' : 'Articles') : t('products')}</span>
        </div>

        {!isMerchant ? (
          <div 
            className={`mobile-bottom-nav-item ${activeTab === 'commissions' ? 'active' : ''}`}
            onClick={() => { setActiveTab('commissions'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
          >
            <span className="mobile-bottom-nav-icon">💰</span>
            <span>{t('commissions')}</span>
          </div>
        ) : (
          <div 
            className={`mobile-bottom-nav-item ${activeTab === 'gold_rates' ? 'active' : ''}`}
            onClick={() => { setActiveTab('gold_rates'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
          >
            <span className="mobile-bottom-nav-icon">🥇</span>
            <span>{t('goldRates')}</span>
          </div>
        )}

        <div 
          className={`mobile-bottom-nav-item ${mobileMenuOpen ? 'active' : ''}`}
          onClick={() => setMobileMenuOpen(prev => !prev)}
        >
          <span className="mobile-bottom-nav-icon">☰</span>
          <span>{t('menu')}</span>
        </div>
      </nav>
    </div>
  );
}

function AdminAppContent() {
  const { adminUser, loading } = useAuth();

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        width: '100vw',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'var(--bg-slate, #f8f7f4)',
        color: 'var(--admin-gold, #b38728)',
        fontFamily: 'Playfair Display, serif'
      }}>
        <div style={{
          width: '45px',
          height: '45px',
          borderRadius: '50%',
          border: '3px solid rgba(179, 135, 40, 0.2)',
          borderTopColor: 'var(--admin-gold, #b38728)',
          animation: 'oriaSpin 0.9s linear infinite',
          marginBottom: '20px'
        }} />
        <span style={{ letterSpacing: '3px', fontSize: '1rem', fontWeight: '700', color: 'var(--text-white, #111827)' }}>HRSDGDG ADMINISTRATION</span>
        <style>{`
          @keyframes oriaSpin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (!adminUser) {
    return <AdminLogin />;
  }

  return <AdminLayout />;
}

export default function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <AdminAppContent />
      </AuthProvider>
    </LanguageProvider>
  );
}
