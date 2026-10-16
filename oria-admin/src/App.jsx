import React, { useState, useEffect } from 'react';
import { useLanguage, LanguageProvider } from './context/LanguageContext';
import { useAuth, AuthProvider } from './context/AuthContext';
import OriaLogo from './components/OriaLogo';
import AdminLogin from './components/AdminLogin';
import SilverIcon from './components/SilverIcon';
import './styles/admin.css';

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
  
  const isMerchant = adminUser?.role === 'commercant';
  const [activeTab, setActiveTab] = useState(() => (adminUser?.role === 'commercant' ? 'products' : 'dashboard'));
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (isMerchant && activeTab !== 'products' && activeTab !== 'sales_history' && activeTab !== 'gold_rates') {
      setActiveTab('products');
    }
  }, [isMerchant, activeTab]);
  const [stats, setStats] = useState({ totalSales: 0, totalCommissions: 0, totalMerchants: 0, totalClients: 0, totalProducts: 0, merchantsBreakdown: [] });
  const [pendingProducts, setPendingProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [users, setUsers] = useState([]);
  const [auctions, setAuctions] = useState([]);
  const [selectedAuctionForBids, setSelectedAuctionForBids] = useState(null);
  const [auctionBids, setAuctionBids] = useState([]);
  const [showBidsModal, setShowBidsModal] = useState(false);
  
  // Commission settings state
  const [commissionConfig, setCommissionConfig] = useState({ commission_globale: 5, commission_categories: {}, commission_commercants: {} });
  
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
    images: []
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
  const [userForm, setUserForm] = useState({ nom: '', email: '', mot_de_passe: '', role: 'client', shopName: '', phone: '', address: '', city: '', numero_patente: '', patente_document: '', patente_filename: '' });

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
  const [salesHistory, setSalesHistory] = useState([]);
  const [salesSearchTerm, setSalesSearchTerm] = useState('');

  // Notification Banner
  const [notif, setNotif] = useState(null);

  // Roles and permissions management state
  const [rolePermissions, setRolePermissions] = useState(() => {
    const saved = localStorage.getItem('role_permissions');
    if (saved) return JSON.parse(saved);
    return {
      admin: ['view_dashboard', 'moderate_auctions', 'manage_commissions', 'manage_categories', 'manage_users', 'manage_roles', 'edit_products', 'create_products', 'delete_products'],
      commercant: ['publish_listings', 'manage_orders', 'view_shop_analytics', 'chat_with_clients'],
      client: ['browse_marketplace', 'place_bids', 'create_orders', 'inbox_chat']
    };
  });

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
      admin: ['view_dashboard', 'moderate_auctions', 'manage_commissions', 'manage_categories', 'manage_users', 'manage_roles', 'edit_products', 'create_products', 'delete_products'],
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

  const triggerNotif = (msg) => {
    setNotif(msg);
    setTimeout(() => setNotif(null), 4000);
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
    setProductLangTab('fr');
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
      images: []
    });
    setShowProductModal(true);
  };

  const handleOpenAddAuction = () => {
    setEditingProduct(null);
    setProductLangTab('fr');
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
      images: []
    });
    setShowProductModal(true);
  };

  const handleOpenEditProduct = (p) => {
    setEditingProduct(p);
    setProductLangTab('fr');
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
      images: Array.isArray(p.images) ? p.images : (p.image ? [p.image] : [])
    });
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

  const handleAdminAddImageUrl = () => {
    if (!adminCustomImageUrl.trim()) return;
    setProductForm(prev => ({
      ...prev,
      images: [...(prev.images || []), adminCustomImageUrl.trim()]
    }));
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
          targets: [targetLang],
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
          triggerNotif("✨ Catégorie traduite en 3 langues !");
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
    const defaultMerchant = isMerchant ? adminUser?.id : (adminUser?.id || users.find(u => u.role === 'commercant')?.id || 'admin');
    const bodyData = { 
      ...productForm,
      purete: productForm.purete || '18k',
      stock: 1,
      statut: productForm.statut || (editingProduct ? editingProduct.statut : 'Validated'),
      commercant_id: isMerchant ? adminUser.id : (productForm.commercant_id || defaultMerchant),
      vendeur_nom: isMerchant ? (adminUser?.shopName || adminUser?.nom) : (productForm.vendeur_nom || ''),
      etat: productForm.etat || 'Neuf',
      titre: productForm.titre_fr || productForm.titre || productForm.titre_en || productForm.titre_ar || '',
      titre_fr: productForm.titre_fr || productForm.titre || '',
      description: productForm.description_fr || productForm.description || productForm.description_en || productForm.description_ar || '',
      description_fr: productForm.description_fr || productForm.description || ''
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

  const fetchData = async () => {
    try {
      const isMerchantUser = adminUser?.role === 'commercant';
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
        salesRes
      ] = await Promise.allSettled([
        isMerchantUser ? Promise.resolve(null) : authFetch(`${API_URL}/stats/admin`),
        isMerchantUser ? Promise.resolve(null) : authFetch(`${API_URL}/bijoux?status=Pending`),
        authFetch(`${API_URL}/categories`),
        authFetch(`${API_URL}/config`),
        isMerchantUser ? Promise.resolve(null) : authFetch(`${API_URL}/users`),
        isMerchantUser ? Promise.resolve(null) : authFetch(`${API_URL}/encheres`),
        authFetch(`${API_URL}/bijoux?includeSold=true`),
        isMerchantUser ? Promise.resolve(null) : authFetch(`${API_URL}/subscriptions/all`),
        authFetch(`${API_URL}/gold-rates`),
        authFetch(isMerchantUser && adminUser?.id ? `${API_URL}/sales-history?merchant_id=${adminUser.id}` : `${API_URL}/sales-history`)
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
          setCommissionConfig(configData);
          if (configData.role_permissions && typeof configData.role_permissions === 'object') {
            setRolePermissions(configData.role_permissions);
            localStorage.setItem('role_permissions', JSON.stringify(configData.role_permissions));
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

    } catch (error) {
      console.error('Error fetching admin data:', error);
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

  const handleUpdateGoldRate = async (e) => {
    e.preventDefault();
    const val = parseFloat(goldPriceInput);
    const valSilver = parseFloat(silverPriceInput);
    if (!val || isNaN(val) || val <= 0) {
      triggerNotif('Veuillez saisir un prix valide pour l\'Or 18K (ex: 1045)');
      return;
    }
    if (!valSilver || isNaN(valSilver) || valSilver <= 0) {
      triggerNotif('Veuillez saisir un prix valide pour l\'Argent 1000 (ex: 14.50)');
      return;
    }

    setIsUpdatingGold(true);
    try {
      const res = await authFetch(`${API_URL}/admin/gold-rates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          price18k: val,
          priceSilver: valSilver,
          source: goldSourceInput.trim() || (lang === 'ar' ? 'السعر الرسمي المحدد - المغرب' : 'Fixation Officielle Maroc'),
          note: goldNoteInput.trim() || (lang === 'ar' ? 'تحديث دوري معتمد' : 'Mise à jour régulière'),
          updatedBy: adminUser?.nom || 'Super-Admin'
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        triggerNotif(lang === 'ar' ? 'تم تحديث أسعار الذهب والفضة بنجاح !' : 'Cours de l\'or 18K et de l\'argent 1000 mis à jour avec succès !');
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
    fetchData();
    // Poll every 3 seconds for live listings
    const interval = setInterval(fetchData, 3000);
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
          setCommissionConfig(savedData);
        }
        triggerNotif(t('commissionsSaved'));
      } else {
        triggerNotif(t('notifServerError'));
      }
    } catch (e) {
      console.error(e);
      triggerNotif(t('notifServerError'));
    }
  };

  const handleAddCategory = async (e) => {
    e.preventDefault();
    if (!newCat.nom_fr || !newCat.nom_ar || !newCat.nom_en) return;

    try {
      const res = await fetch(`${API_URL}/categories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCat)
      });
      if (res.ok) {
        setNewCat({ nom_fr: '', nom_ar: '', nom_en: '' });
        triggerNotif('Catégorie ajoutée avec succès.');
        fetchData();
      }
    } catch (e) {
      console.error(e);
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
              </>
            )}

            <li>
              <span className={`nav-link ${activeTab === 'gold_rates' ? 'active' : ''}`} onClick={() => { setActiveTab('gold_rates'); setMobileMenuOpen(false); }}>
                🥇 {t('goldRates')}
              </span>
            </li>
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
                    <th>{lang === 'ar' ? 'رقم ووثيقة الباتنت' : 'Patente & Document'}</th>
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
                            <div style={{ fontWeight: 700, color: 'var(--admin-gold)' }}>🔢 {u.numero_patente}</div>
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
                                  marginTop: '4px',
                                  fontSize: '0.75rem',
                                  fontWeight: 600
                                }}
                              >
                                📄 {u.patente_filename || (lang === 'ar' ? 'عرض / تحميل الباتنت' : 'Télécharger Patente')}
                              </a>
                            ) : (
                              <span style={{ fontSize: '0.72rem', color: 'var(--text-gray)' }}>
                                {lang === 'ar' ? 'بدون وثيقة مرفقة' : 'Sans document'}
                              </span>
                            )}
                          </div>
                        ) : (
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
                  { key: 'create_products', labelKey: 'perm_create_products' }
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
              <h3 style={{ fontFamily: 'Playfair Display', margin: '0 0 16px 0', fontSize: '1.3rem', color: 'var(--admin-gold)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>✏️</span>
                <span>{lang === 'ar' ? 'تحديث سعر الذهب عيار 18 اليوم' : 'Mettre à jour le cours de l\'Or 18K'}</span>
              </h3>

              <form onSubmit={handleUpdateGoldRate} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', alignItems: 'end' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-white)' }}>
                    {lang === 'ar' ? 'سعر غرام الذهب عيار 18 (د.م/غ) *' : 'Prix de l\'Or 18K (MAD/g) *'}
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="100"
                    max="10000"
                    required
                    value={goldPriceInput}
                    onChange={(e) => setGoldPriceInput(e.target.value)}
                    placeholder="1045"
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      background: 'rgba(0,0,0,0.2)',
                      border: '1px solid var(--border-gold)',
                      borderRadius: '8px',
                      color: 'var(--text-white)',
                      fontSize: '1.2rem',
                      fontWeight: 800
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px', fontSize: '0.85rem', fontWeight: 700, color: '#e2e8f0' }}>
                    <SilverIcon size={16} />
                    <span>{lang === 'ar' ? 'سعر غرام الفضة 1000 (د.م/غ) *' : 'Prix de l\'Argent 1000 (MAD/g) *'}</span>
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="1"
                    max="1000"
                    required
                    value={silverPriceInput}
                    onChange={(e) => setSilverPriceInput(e.target.value)}
                    placeholder="14.50"
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      background: 'rgba(0,0,0,0.2)',
                      border: '1px solid #cbd5e1',
                      borderRadius: '8px',
                      color: '#f8fafc',
                      fontSize: '1.2rem',
                      fontWeight: 800
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-white)' }}>
                    {lang === 'ar' ? 'المصدر / المرجع' : 'Source / Bourse de référence'}
                  </label>
                  <input
                    type="text"
                    value={goldSourceInput}
                    onChange={(e) => setGoldSourceInput(e.target.value)}
                    placeholder={lang === 'ar' ? 'مثال: سوق الصاغة الدار البيضاء...' : 'Ex: Marché de Casablanca, Clôture officielle...'}
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      background: 'rgba(0,0,0,0.2)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '8px',
                      color: 'var(--text-white)',
                      fontSize: '0.95rem'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-white)' }}>
                    {lang === 'ar' ? 'ملاحظة أو تبرير التغيير' : 'Note ou motif d\'évolution'}
                  </label>
                  <input
                    type="text"
                    value={goldNoteInput}
                    onChange={(e) => setGoldNoteInput(e.target.value)}
                    placeholder={lang === 'ar' ? 'مثال: استقرار الطلب بالسوق المغربي...' : 'Ex: Fixation hebdomadaire officielle...'}
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      background: 'rgba(0,0,0,0.2)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '8px',
                      color: 'var(--text-white)',
                      fontSize: '0.95rem'
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
                      padding: '12px 20px',
                      fontSize: '0.95rem',
                      fontWeight: 800,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      margin: 0
                    }}
                  >
                    {isUpdatingGold ? '⏳ ...' : (lang === 'ar' ? '💾 تثبيت السعر (18K)' : '💾 Enregistrer la cotation 18K')}
                  </button>
                </div>
              </form>
            </div>

            {/* History Table */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
              <h3 style={{ fontFamily: 'Playfair Display', margin: 0, fontSize: '1.4rem', color: 'var(--text-white)' }}>
                {lang === 'ar' ? '📊 سجل التغييرات التاريخية لسعر الذهب عيار 18' : '📊 Historique des Changements du Cours 18K'}
              </h3>
              <span style={{ fontSize: '0.82rem', color: 'var(--text-gray)' }}>
                {lang === 'ar' ? `إجمالي التعديلات : ${(goldRatesData.history || []).length}` : `Total cotations : ${(goldRatesData.history || []).length}`}
              </span>
            </div>

            <div className="table-container">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>{lang === 'ar' ? 'التاريخ والوقت' : 'Date & Heure'}</th>
                    <th>{lang === 'ar' ? 'سعر 18K (د.م/غ)' : 'Prix Or 18K (MAD/g)'}</th>
                    <th>{lang === 'ar' ? 'التغيير' : 'Variation'}</th>
                    <th>{lang === 'ar' ? 'المصدر' : 'Source'}</th>
                    <th>{lang === 'ar' ? 'ملاحظة' : 'Note'}</th>
                    <th>{lang === 'ar' ? 'إجراء' : 'Action'}</th>
                  </tr>
                </thead>
                <tbody>
                  {[...(goldRatesData.history || [])].reverse().map((item) => {
                    const isPositive = item.change && item.change.startsWith('+');
                    const isNeutral = !item.change || item.change === '0.0%' || item.change === '0%';
                    const getLocalizedSource = (s) => {
                      if (!s) return lang === 'ar' ? 'سوق الذهب المغربي' : 'Marché Maroc';
                      if (lang === 'ar') {
                        const map = {
                          'Fixation Casablanca': 'تحديد الدار البيضاء',
                          'Marché national': 'السوق الوطني للذهب',
                          'Bourse de référence': 'بورصة الذهب المعتمدة',
                          'Cours officiel de clôture': 'السعر الرسمي للإغلاق',
                          'Cours officiel clôture': 'السعر الرسمي للإغلاق',
                          'Fixation Officielle Maroc': 'السعر الرسمي المحدد بالمغرب',
                          'Marché Maroc': 'سوق الذهب المغربي'
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
                          'Forte demande joaillerie': 'طلب متزايد على الصياغة',
                          'Tendance haussière': 'اتجاه تصاعدي في السوق',
                          'Cours actuel du jour': 'السعر الرسمي المعتمد اليوم',
                          'Validation 18K': 'تأكيد سعر عيار 18',
                          'Mise à jour régulière': 'تحديث دوري معتمد'
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
                        <td style={{ color: 'var(--admin-gold)', fontWeight: 800, fontSize: '1.1rem' }} dir="ltr">
                          {item.price18k || 1045} {lang === 'ar' ? 'د.م' : 'MAD'}
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
                  })}
                  {(!goldRatesData.history || goldRatesData.history.length === 0) && (
                    <tr>
                      <td colSpan="6" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-gray)' }}>
                        {lang === 'ar' ? 'لا يوجد سجل تغييرات سابق.' : 'Aucun historique enregistré pour le moment.'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
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
          <form className="modal-content" onSubmit={handleUserSubmit} style={{ maxWidth: '600px', padding: '30px' }}>
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
          <form className="modal-content" onSubmit={handleProductSubmit} style={{ maxWidth: '600px', padding: '30px' }}>
            <button type="button" className="modal-close-btn" onClick={() => setShowProductModal(false)}>✕</button>
            <h3 style={{ color: 'var(--admin-gold)', marginBottom: '25px', fontFamily: 'Playfair Display', fontSize: '1.6rem' }}>
              {editingProduct ? t('editProduct') : t('newProduct')}
            </h3>

            {!editingProduct && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '15px', marginBottom: '15px' }}>
                <div className="form-group">
                  <label className="form-label">{t('saleType')}</label>
                  <select
                    className="form-input"
                    value={productForm.type_vente}
                    onChange={e => setProductForm({ ...productForm, type_vente: e.target.value })}
                  >
                    <option value="direct">{t('directPurchase')}</option>
                    <option value="enchere">{t('auction')}</option>
                  </select>
                </div>
              </div>
            )}

            {/* ======================================================== */}
            {/* 📸 PHOTOS DU BIJOU (EN HAUT DU FORMULAIRE - MULTI-PHOTOS) */}
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
                  <span style={{ fontSize: '1.2rem' }}>📸</span>
                  <span>Photos du Bijou (Ajoutez une ou plusieurs photos)</span>
                </label>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-gray)', background: 'var(--bg-surface-elevated)', padding: '3px 8px', borderRadius: '12px', border: '1px solid var(--border-subtle)' }}>
                  {(productForm.images || []).length} photo{((productForm.images || []).length > 1) ? 's' : ''}
                </span>
              </div>

              {/* Galerie des images sélectionnées */}
              {(productForm.images || []).length > 0 && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(85px, 1fr))', gap: '10px', marginBottom: '14px' }}>
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

              {/* Bouton d'ajout de fichiers multiples & URL */}
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
                  📁 Choisir une ou plusieurs photos
                </label>

                <div style={{ display: 'flex', flex: 1, minWidth: '220px', gap: '6px' }}>
                  <input 
                    type="text"
                    placeholder="Ou collez une URL d'image..."
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
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '1.2rem' }}>🌐</span>
                  <strong style={{ fontSize: '0.95rem', color: 'var(--admin-gold)' }}>Contenu en 3 Langues</strong>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
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
                    title="Traduit automatiquement le contenu renseigné vers les 2 autres langues"
                  >
                    {isTranslating 
                      ? (lang === 'ar' ? '⏳ جاري الترجمة...' : '⏳ Traduction en cours...') 
                      : (lang === 'ar' ? '✨ ترجمة تلقائية (عربي ⇄ فرنسي)' : '✨ Traduction automatique (Arabe ⇄ Français)')
                    }
                  </button>
                  
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
                </div>
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
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '6px', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-gray)' }}>⚡ اقتراحات :</span>
                      {[
                        '💍 خاتم سوليتير ألماس 18k',
                        '📿 قلادة سلسلة فاخرة 18k',
                        '🔗 سوار رويال أنيق 18k',
                        '✨ ميدالية ذهبية عيار 18k',
                        '💎 أقراط دائرية عيار 18k',
                        '👑 طقم عرائسي ملكي 18k'
                      ].map(sug => (
                        <button
                          key={sug}
                          type="button"
                          onClick={() => setProductForm({ ...productForm, titre_ar: sug })}
                          style={{
                            background: 'rgba(212, 175, 55, 0.1)',
                            border: '1px solid rgba(212, 175, 55, 0.3)',
                            borderRadius: '12px',
                            padding: '3px 8px',
                            fontSize: '0.74rem',
                            color: 'var(--admin-gold)',
                            cursor: 'pointer'
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
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '6px', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-gray)' }}>⚡ أضف للوصف :</span>
                      {[
                        '✨ ذهب موثق عيار 18k مع الختم الرسمي المغربي.',
                        '💎 صياغة تقليدية مغربية فاخرة مع تشطيب دقيق.',
                        '📦 مرفق بشهادة أصالة معتمدة وعلبة فاخرة.',
                        '🔒 قفل أمان محكم ومفحوص بدقة من خبير معتمد.'
                      ].map(sug => (
                        <button
                          key={sug}
                          type="button"
                          onClick={() => setProductForm({ 
                            ...productForm, 
                            description_ar: productForm.description_ar ? `${productForm.description_ar} • ${sug}` : sug 
                          })}
                          style={{
                            background: 'rgba(255, 255, 255, 0.05)',
                            border: '1px solid rgba(255, 255, 255, 0.15)',
                            borderRadius: '12px',
                            padding: '3px 8px',
                            fontSize: '0.72rem',
                            color: '#e5e7eb',
                            cursor: 'pointer'
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
                      required 
                    />
                    {/* Suggestions Titre Rapide */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '6px', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-gray)' }}>⚡ Suggestions :</span>
                      {[
                        '💍 Bague Solitaire Diamant 18K',
                        '📿 Collier Chaine Forçat 18K',
                        '🔗 Bracelet Gourmette Royale 18K',
                        '✨ Pendentif Médaille Oria 18K',
                        '💎 Boucles d\'Oreilles Créoles 18K',
                        '👑 Parure Traditionnelle 18K'
                      ].map(sug => (
                        <button
                          key={sug}
                          type="button"
                          onClick={() => setProductForm({ ...productForm, titre_fr: sug, titre: sug })}
                          style={{
                            background: 'rgba(212, 175, 55, 0.1)',
                            border: '1px solid rgba(212, 175, 55, 0.3)',
                            borderRadius: '12px',
                            padding: '3px 8px',
                            fontSize: '0.74rem',
                            color: 'var(--admin-gold)',
                            cursor: 'pointer'
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
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '6px', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-gray)' }}>⚡ Insérer dans le texte :</span>
                      {[
                        '✨ Or 18K certifié avec poinçon d\'état officiel.',
                        '💎 Finition artisanale marocaine haute joaillerie.',
                        '📦 Livré avec certificat d\'authenticité et écrin de luxe.',
                        '🔒 Fermoir de sécurité renforcé et contrôle bijoutier.'
                      ].map(sug => (
                        <button
                          key={sug}
                          type="button"
                          onClick={() => setProductForm({ 
                            ...productForm, 
                            description_fr: productForm.description_fr ? `${productForm.description_fr} • ${sug}` : sug,
                            description: productForm.description_fr ? `${productForm.description_fr} • ${sug}` : sug
                          })}
                          style={{
                            background: 'rgba(255, 255, 255, 0.05)',
                            border: '1px solid rgba(255, 255, 255, 0.15)',
                            borderRadius: '12px',
                            padding: '3px 8px',
                            fontSize: '0.72rem',
                            color: '#e5e7eb',
                            cursor: 'pointer'
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

            {/* 1. POIDS EN PREMIER SUIVI DU PRIX */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
              <div className="form-group">
                <label className="form-label">{t('weight')} (غ / g)</label>
                <input 
                  type="number" 
                  step="0.01"
                  min="0.1"
                  placeholder="ex: 4.5"
                  className="form-input" 
                  value={productForm.gramme} 
                  onChange={e => setProductForm({ ...productForm, gramme: e.target.value })} 
                  required 
                />
              </div>

              {productForm.type_vente === 'enchere' ? (
                <div className="form-group">
                  <label className="form-label">{t('startingPrice')} (MAD)</label>
                  <input 
                    type="number" 
                    min="100"
                    placeholder="ex: 5000"
                    className="form-input" 
                    value={productForm.prix_depart} 
                    onChange={e => setProductForm({ ...productForm, prix_depart: e.target.value })} 
                    required 
                  />
                </div>
              ) : (
                <div className="form-group">
                  <label className="form-label">{t('price')} (MAD)</label>
                  <input 
                    type="number" 
                    min="100"
                    placeholder="ex: 6400"
                    className="form-input" 
                    value={productForm.prix} 
                    onChange={e => setProductForm({ ...productForm, prix: e.target.value })} 
                    required 
                  />
                </div>
              )}
            </div>

            {/* 2. CATÉGORIE & LISTE DES VILLES */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
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
                  {[
                    { key: 'Casablanca', ar: 'الدار البيضاء (Casablanca)', fr: 'Casablanca' },
                    { key: 'Rabat', ar: 'الرباط (Rabat)', fr: 'Rabat' },
                    { key: 'Marrakech', ar: 'مراكش (Marrakech)', fr: 'Marrakech' },
                    { key: 'Fès', ar: 'فاس (Fès)', fr: 'Fès' },
                    { key: 'Tanger', ar: 'طنجة (Tanger)', fr: 'Tanger' },
                    { key: 'Agadir', ar: 'أكادير (Agadir)', fr: 'Agadir' },
                    { key: 'Meknès', ar: 'مكناس (Meknès)', fr: 'Meknès' },
                    { key: 'Oujda', ar: 'وجدة (Oujda)', fr: 'Oujda' },
                    { key: 'Tétouan', ar: 'تطوان (Tétouan)', fr: 'Tétouan' },
                    { key: 'Essaouira', ar: 'الصويرة (Essaouira)', fr: 'Essaouira' },
                    { key: 'El Jadida', ar: 'الجديدة (El Jadida)', fr: 'El Jadida' },
                    { key: 'Nador', ar: 'الناظور (Nador)', fr: 'Nador' },
                    { key: 'Safi', ar: 'آسفي (Safi)', fr: 'Safi' },
                    { key: 'Kenitra', ar: 'القنيطرة (Kenitra)', fr: 'Kenitra' },
                    { key: 'Mohammédia', ar: 'المحمدية (Mohammédia)', fr: 'Mohammédia' },
                    { key: 'Béni Mellal', ar: 'بني ملال (Béni Mellal)', fr: 'Béni Mellal' },
                    { key: 'Laâyoune', ar: 'العيون (Laâyoune)', fr: 'Laâyoune' },
                    { key: 'Dakhla', ar: 'الداخلة (Dakhla)', fr: 'Dakhla' },
                    { key: 'Salé', ar: 'سلا (Salé)', fr: 'Salé' },
                    { key: 'Témara', ar: 'تمارة (Témara)', fr: 'Témara' }
                  ].map(city => (
                    <option key={city.key} value={city.key}>
                      {lang === 'ar' ? city.ar : city.fr}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* 3. ÉTAT DU BIJOU : Neuf & Bonne occasion uniquement */}
            <div className="form-group" style={{ marginBottom: '18px' }}>
              <label className="form-label">{lang === 'ar' ? 'حالة القطعة' : 'État du Bijou'}</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                {[
                  { value: 'Neuf', fr: '✨ Neuf', ar: '✨ جديد' },
                  { value: 'Occasion', fr: '🏷️ Bonne occasion', ar: '🏷️ مستعمل بحالة ممتازة' }
                ].map(item => {
                  const isActive = (productForm.etat || 'Neuf') === item.value;
                  return (
                    <button
                      key={item.value}
                      type="button"
                      onClick={() => setProductForm({ ...productForm, etat: item.value })}
                      style={{
                        padding: '10px 8px',
                        borderRadius: '8px',
                        border: isActive ? '1.5px solid var(--admin-gold)' : '1px solid rgba(255,255,255,0.12)',
                        background: isActive ? 'rgba(212, 175, 55, 0.16)' : 'rgba(255,255,255,0.03)',
                        color: isActive ? 'var(--admin-gold)' : 'var(--text-gray)',
                        fontWeight: 700,
                        fontSize: '0.85rem',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        textAlign: 'center'
                      }}
                    >
                      {lang === 'ar' ? item.ar : item.fr}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Si enchère : Durée */}
            {productForm.type_vente === 'enchere' && (
              <div className="form-group" style={{ marginBottom: '18px' }}>
                <label className="form-label">{t('durationHours')}</label>
                <input 
                  type="number" 
                  min="1"
                  className="form-input" 
                  value={productForm.duree} 
                  onChange={e => setProductForm({ ...productForm, duree: parseInt(e.target.value) || 24 })} 
                  required 
                />
              </div>
            )}

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
