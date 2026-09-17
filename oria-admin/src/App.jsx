import React, { useState, useEffect } from 'react';
import { useLanguage, LanguageProvider } from './context/LanguageContext';
import { useAuth, AuthProvider } from './context/AuthContext';
import OriaLogo from './components/OriaLogo';
import AdminLogin from './components/AdminLogin';
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
  const { adminUser, logout } = useAuth();

  const [selectedTheme, setSelectedTheme] = useState(() => localStorage.getItem('oria-admin-theme') || 'gold');

  useEffect(() => {
    const tVals = themes[selectedTheme] || themes.gold;
    document.documentElement.style.setProperty('--admin-gold', tVals.primary);
    document.documentElement.style.setProperty('--dark-gold', tVals.dark);
    document.documentElement.style.setProperty('--border-gold', tVals.border);
    localStorage.setItem('oria-admin-theme', selectedTheme);
  }, [selectedTheme]);
  
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard', 'validation', 'commissions', 'categories', 'auctions'
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
  const [productLangTab, setProductLangTab] = useState('fr'); // 'fr', 'ar', 'en'
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

  // Product search/filters
  const [productSearch, setProductSearch] = useState('');
  const [productStatusFilter, setProductStatusFilter] = useState('All');
  const [productCategoryFilter, setProductCategoryFilter] = useState('All');

  // User form modal state
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [userForm, setUserForm] = useState({ nom: '', email: '', mot_de_passe: '', role: 'client', shopName: '', phone: '', address: '', city: '' });

  // Subscriptions management state
  const [subscriptionsData, setSubscriptionsData] = useState(null);
  const [adminLightMode, setAdminLightMode] = useState(() => localStorage.getItem('oria-admin-light-mode') !== 'false');
  const [editingPlanModal, setEditingPlanModal] = useState(null);
  const [merchantSubModal, setMerchantSubModal] = useState(null);

  useEffect(() => {
    if (adminLightMode) {
      document.documentElement.setAttribute('data-theme', 'light');
      document.body.classList.add('light-theme');
    } else {
      document.documentElement.setAttribute('data-theme', 'dark');
      document.body.classList.remove('light-theme');
    }
    localStorage.setItem('oria-admin-light-mode', adminLightMode);
  }, [adminLightMode]);

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

  const handleTogglePermission = (roleKey, permissionKey) => {
    const updated = { ...rolePermissions };
    const currentList = updated[roleKey] || [];
    if (currentList.includes(permissionKey)) {
      updated[roleKey] = currentList.filter(k => k !== permissionKey);
    } else {
      updated[roleKey] = [...currentList, permissionKey];
    }
    setRolePermissions(updated);
    localStorage.setItem('role_permissions', JSON.stringify(updated));
    triggerNotif(`Permissions mises à jour pour le rôle ${roleKey}`);
  };

  const handleResetPermissions = () => {
    const defaults = {
      admin: ['view_dashboard', 'moderate_auctions', 'manage_commissions', 'manage_categories', 'manage_users', 'manage_roles', 'edit_products', 'create_products', 'delete_products'],
      commercant: ['publish_listings', 'manage_orders', 'view_shop_analytics', 'chat_with_clients'],
      client: ['browse_marketplace', 'place_bids', 'create_orders', 'inbox_chat']
    };
    setRolePermissions(defaults);
    localStorage.setItem('role_permissions', JSON.stringify(defaults));
    triggerNotif('Permissions réinitialisées par défaut.');
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
        triggerNotif('Rôle utilisateur mis à jour avec succès !');
        fetchData();
      } else {
        const errData = await res.json();
        triggerNotif(errData.message || 'Erreur lors de la mise à jour du rôle.');
      }
    } catch (err) {
      console.error(err);
      triggerNotif('Erreur de connexion au serveur.');
    }
  };

  const triggerNotif = (msg) => {
    setNotif(msg);
    setTimeout(() => setNotif(null), 4000);
  };

  const handleOpenAddUser = () => {
    setEditingUser(null);
    setUserForm({ nom: '', email: '', mot_de_passe: '', role: 'client', shopName: '', phone: '', address: '', city: '' });
    setShowUserModal(true);
  };

  const handleOpenEditUser = (u) => {
    setEditingUser(u);
    setUserForm({
      nom: u.nom || '',
      email: u.email || '',
      mot_de_passe: u.mot_de_passe || '',
      role: u.role || 'client',
      shopName: u.shopName || '',
      phone: u.phone || '',
      address: u.address || '',
      city: u.city || ''
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
    const defaultMerchant = users.find(u => u.role === 'commercant')?.id || '';
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
      city: 'Casablanca',
      stock: 1,
      category_id: defaultCategory,
      commercant_id: defaultMerchant,
      statut: 'Pending',
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
    const defaultMerchant = users.find(u => u.role === 'commercant')?.id || '';
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
      city: 'Casablanca',
      stock: 1,
      category_id: defaultCategory,
      commercant_id: defaultMerchant,
      statut: 'Validated',
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
      gramme: p.gramme || '',
      purete: p.purete || '18k',
      city: p.city || '',
      stock: p.stock || 0,
      category_id: p.category_id || '',
      commercant_id: p.commercant_id || '',
      statut: p.statut || 'Validated',
      type_vente: (p.disponibilite === 'enchere' || p.type_vente === 'AUCTION') ? 'enchere' : 'direct',
      prix_depart: p.prix || '',
      duree: 24,
      images: p.images || []
    });
    setShowProductModal(true);
  };

  // Multi-image handlers for admin product modal
  const handleAdminFilesSelected = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (reader.result) {
          setProductForm(prev => ({
            ...prev,
            images: [...(prev.images || []), reader.result]
          }));
        }
      };
      reader.readAsDataURL(file);
    });
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

  // Auto-translate product content across FR, AR, EN
  const handleAutoTranslateProduct = async (sourceLang = productLangTab, showAlert = true) => {
    const title = sourceLang === 'fr' 
      ? (productForm.titre_fr || productForm.titre || '') 
      : (productForm[`titre_${sourceLang}`] || '');
    const desc = sourceLang === 'fr' 
      ? (productForm.description_fr || productForm.description || '') 
      : (productForm[`description_${sourceLang}`] || '');

    if (!title.trim() && !desc.trim()) {
      if (showAlert) {
        triggerNotif(`Veuillez d'abord renseigner le titre ou la description en ${sourceLang === 'fr' ? 'Français' : (sourceLang === 'ar' ? 'Arabe' : 'Anglais')} avant de traduire.`);
      }
      return;
    }

    setIsTranslating(true);
    try {
      const res = await fetch(`${API_URL}/translate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: sourceLang,
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
            if (data.translations.en) {
              if (data.translations.en.title) updated.titre_en = data.translations.en.title;
              if (data.translations.en.description) updated.description_en = data.translations.en.description;
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
          setTranslateSuccessMsg("✓ Traduction automatique effectuée avec succès !");
          triggerNotif("✨ Traduction automatique effectuée avec succès !");
          setTimeout(() => setTranslateSuccessMsg(''), 4000);
        }
      }
    } catch (err) {
      console.error("Auto translate error:", err);
      triggerNotif("Erreur lors de la traduction automatique.");
    } finally {
      setIsTranslating(false);
    }
  };

  // Switch tab and automatically translate to target if target is empty
  const switchProductLangTab = async (targetTab) => {
    const prevTab = productLangTab;
    setProductLangTab(targetTab);

    // If source tab has content and target tab is empty, auto-translate automatically!
    const prevTitle = prevTab === 'fr' ? (productForm.titre_fr || productForm.titre || '') : (productForm[`titre_${prevTab}`] || '');
    const prevDesc = prevTab === 'fr' ? (productForm.description_fr || productForm.description || '') : (productForm[`description_${prevTab}`] || '');
    
    const targetTitle = targetTab === 'fr' ? (productForm.titre_fr || productForm.titre || '') : (productForm[`titre_${targetTab}`] || '');
    const targetDesc = targetTab === 'fr' ? (productForm.description_fr || productForm.description || '') : (productForm[`description_${targetTab}`] || '');

    if ((prevTitle.trim() || prevDesc.trim()) && (!targetTitle.trim() && !targetDesc.trim())) {
      handleAutoTranslateProduct(prevTab, false);
    }
  };

  // Auto-translate category names
  const handleAutoTranslateCategory = async (catObj, setCatFunc) => {
    let sourceLang = 'fr';
    let name = catObj.nom_fr || '';
    if (!name.trim() && catObj.nom_ar?.trim()) {
      sourceLang = 'ar';
      name = catObj.nom_ar;
    } else if (!name.trim() && catObj.nom_en?.trim()) {
      sourceLang = 'en';
      name = catObj.nom_en;
    }

    if (!name.trim()) {
      triggerNotif("Veuillez saisir au moins un nom de catégorie.");
      return;
    }

    try {
      const res = await fetch(`${API_URL}/translate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: sourceLang,
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
    const url = editingProduct ? `${API_URL}/bijoux/${editingProduct.id}` : `${API_URL}/bijoux`;
    const method = editingProduct ? 'PUT' : 'POST';

    // Prepare body with fallback synchronization
    const bodyData = { 
      ...productForm,
      titre: productForm.titre_fr || productForm.titre || productForm.titre_en || productForm.titre_ar || '',
      titre_fr: productForm.titre_fr || productForm.titre || '',
      description: productForm.description_fr || productForm.description || productForm.description_en || productForm.description_ar || '',
      description_fr: productForm.description_fr || productForm.description || ''
    };
    if (productForm.type_vente === 'enchere') {
      bodyData.prix = parseFloat(productForm.prix_depart) || parseFloat(productForm.prix) || 1000;
      bodyData.stock = 1;
      bodyData.disponibilite = 'enchere';
    } else {
      bodyData.stock = parseInt(productForm.stock) || 1;
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
      const [
        statsRes,
        pendingRes,
        catRes,
        configRes,
        usersRes,
        auctionsRes,
        allBijouxRes,
        subscriptionsRes
      ] = await Promise.allSettled([
        fetch(`${API_URL}/stats/admin`),
        fetch(`${API_URL}/bijoux?status=Pending`),
        fetch(`${API_URL}/categories`),
        fetch(`${API_URL}/config`),
        fetch(`${API_URL}/users`),
        fetch(`${API_URL}/encheres`),
        fetch(`${API_URL}/bijoux`),
        fetch(`${API_URL}/subscriptions/all`)
      ]);

      if (statsRes.status === 'fulfilled' && statsRes.value.ok) {
        try {
          const statsData = await statsRes.value.json();
          setStats(statsData);
        } catch (e) { console.error('Stats parse error', e); }
      }

      if (pendingRes.status === 'fulfilled' && pendingRes.value.ok) {
        try {
          const pendingData = await pendingRes.value.json();
          setPendingProducts(Array.isArray(pendingData) ? pendingData : []);
        } catch (e) { console.error('Pending parse error', e); }
      }

      if (catRes.status === 'fulfilled' && catRes.value.ok) {
        try {
          const catData = await catRes.value.json();
          setCategories(Array.isArray(catData) ? catData : []);
        } catch (e) { console.error('Categories parse error', e); }
      }

      if (configRes.status === 'fulfilled' && configRes.value.ok) {
        try {
          const configData = await configRes.value.json();
          setCommissionConfig(configData);
        } catch (e) { console.error('Config parse error', e); }
      }

      if (usersRes.status === 'fulfilled' && usersRes.value.ok) {
        try {
          const usersData = await usersRes.value.json();
          setUsers(Array.isArray(usersData) ? usersData : []);
        } catch (e) { console.error('Users parse error', e); }
      }

      if (auctionsRes.status === 'fulfilled' && auctionsRes.value.ok) {
        try {
          const auctionsData = await auctionsRes.value.json();
          setAuctions(Array.isArray(auctionsData) ? auctionsData : []);
        } catch (e) { console.error('Auctions parse error', e); }
      }

      if (allBijouxRes.status === 'fulfilled' && allBijouxRes.value.ok) {
        try {
          const allBijouxData = await allBijouxRes.value.json();
          setProducts(Array.isArray(allBijouxData) ? allBijouxData : []);
        } catch (e) { console.error('Products parse error', e); }
      }

      if (subscriptionsRes.status === 'fulfilled' && subscriptionsRes.value.ok) {
        try {
          const subData = await subscriptionsRes.value.json();
          setSubscriptionsData(subData);
        } catch (e) { console.error('Subscriptions parse error', e); }
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
        triggerNotif(isNew ? 'Nouveau forfait créé avec succès !' : 'Configuration du forfait enregistrée avec succès !');
        setEditingPlanModal(null);
        fetchData();
      }
    } catch (e) {
      console.error(e);
      triggerNotif('Erreur lors de la sauvegarde du forfait.');
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

  const handleSaveCommissionConfig = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_URL}/config`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(commissionConfig)
      });
      if (res.ok) {
        triggerNotif(t('configSuccess'));
      }
    } catch (e) {
      console.error(e);
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
    setCommissionConfig({
      ...commissionConfig,
      commission_categories: {
        ...commissionConfig.commission_categories,
        [catId]: parseFloat(value) || 0
      }
    });
  };

  const handleUpdateMerchantCommission = (merchId, value) => {
    setCommissionConfig({
      ...commissionConfig,
      commission_commercants: {
        ...commissionConfig.commission_commercants,
        [merchId]: parseFloat(value) || 0
      }
    });
  };

  if (!adminUser) return null;

  return (
    <div className="admin-container">
      {/* Sidebar Navigation */}
      <aside className="sidebar">
        <div className="logo-container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', padding: '15px 10px', borderBottom: '1px solid var(--border-gold)', marginBottom: '20px' }}>
          <OriaLogo size={36} subtitle="ADMINISTRATION" />
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-gray)', background: 'rgba(212, 175, 55, 0.08)', padding: '3px 10px', borderRadius: '12px', border: '1px solid rgba(212, 175, 55, 0.2)' }}>
              Super-Admin • {adminUser?.nom || 'Admin'}
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
            <li>
              <span className={`nav-link ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('dashboard')}>
                📊 {t('dashboard')}
              </span>
            </li>
            <li>
              <span className={`nav-link ${activeTab === 'validation' ? 'active' : ''}`} onClick={() => setActiveTab('validation')}>
                ⚖️ {t('validationQueue')} ({pendingProducts.length})
              </span>
            </li>
            <li>
              <span className={`nav-link ${activeTab === 'products' ? 'active' : ''}`} onClick={() => setActiveTab('products')}>
                💎 {t('products')} ({products.length})
              </span>
            </li>
            <li>
              <span className={`nav-link ${activeTab === 'commissions' ? 'active' : ''}`} onClick={() => setActiveTab('commissions')}>
                💰 {t('commissions')}
              </span>
            </li>
            <li>
              <span className={`nav-link ${activeTab === 'categories' ? 'active' : ''}`} onClick={() => setActiveTab('categories')}>
                🗂️ {t('categories')}
              </span>
            </li>
            <li>
              <span className={`nav-link ${activeTab === 'users' ? 'active' : ''}`} onClick={() => setActiveTab('users')}>
                👥 {t('users')}
              </span>
            </li>
            <li>
              <span className={`nav-link ${activeTab === 'auctions' ? 'active' : ''}`} onClick={() => setActiveTab('auctions')}>
                🔨 {t('auctions')} ({auctions.length})
              </span>
            </li>
            <li>
              <span className={`nav-link ${activeTab === 'subscriptions' ? 'active' : ''}`} onClick={() => setActiveTab('subscriptions')}>
                🌟 Abonnements ({subscriptionsData?.merchants?.length || 0})
              </span>
            </li>
            <li>
              <span className={`nav-link ${activeTab === 'roles' ? 'active' : ''}`} onClick={() => setActiveTab('roles')}>
                🛡️ {t('roles')}
              </span>
            </li>
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
          <h1>{activeTab === 'subscriptions' ? 'Gestion des Abonnements Commerçants' : t(activeTab === 'validation' ? 'validationQueue' : (activeTab === 'commissions' ? 'commissions' : (activeTab === 'categories' ? 'categories' : (activeTab === 'users' ? 'userManagement' : (activeTab === 'auctions' ? 'auctionManagement' : (activeTab === 'products' ? 'productManagement' : (activeTab === 'roles' ? 'roles' : 'dashboard')))))))}</h1>
          
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            {/* Light / Dark Mode Toggle */}
            <button
              type="button"
              onClick={() => setAdminLightMode(!adminLightMode)}
              style={{
                padding: '6px 14px',
                background: adminLightMode ? 'rgba(179,135,40,0.15)' : 'rgba(255,255,255,0.08)',
                border: '1px solid var(--border-gold)',
                borderRadius: '8px',
                color: 'var(--admin-gold)',
                fontSize: '0.82rem',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              {adminLightMode ? '🌙 Mode Nuit' : '☀️ Fond Clair'}
            </button>

            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <span style={{ color: 'var(--text-gray)', fontSize: '0.85rem' }}>Couleur:</span>
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
              <option value="fr">Français 🇫🇷</option>
              <option value="ar">العربية 🇲🇦 (RTL)</option>
              <option value="en">English 🇬🇧</option>
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
                    <th>Boutique</th>
                    <th>Chiffre d'affaires</th>
                    <th>Commissions Générées</th>
                    <th>Articles vendus</th>
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
          <form className="settings-panel" onSubmit={handleSaveCommissionConfig}>
            <div className="settings-section">
              <h3 style={{ color: 'var(--admin-gold)', marginBottom: '15px' }}>{t('globalCommissionRate')}</h3>
              <div className="form-group" style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                <input 
                  type="range" 
                  min="1" 
                  max="25" 
                  style={{ flexGrow: 1, accentColor: 'var(--admin-gold)' }}
                  value={commissionConfig.commission_globale}
                  onChange={(e) => setCommissionConfig({ ...commissionConfig, commission_globale: parseInt(e.target.value) })}
                />
                <span style={{ fontSize: '1.5rem', fontWeight: 'bold', minWidth: '60px', color: 'var(--admin-gold)' }}>
                  {commissionConfig.commission_globale} %
                </span>
              </div>
            </div>

            <div className="settings-section">
              <h3 style={{ color: 'var(--admin-gold)', marginBottom: '15px' }}>{t('categoryCommissions')}</h3>
              {categories.map(cat => (
                <div key={cat.id} className="form-group" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label className="form-label" style={{ margin: 0 }}>
                    {lang === 'fr' ? cat.nom_fr : (lang === 'ar' ? cat.nom_ar : cat.nom_en)}
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <input 
                      type="number" 
                      className="form-input" 
                      style={{ width: '80px', padding: '6px' }}
                      value={commissionConfig.commission_categories[cat.id] !== undefined ? commissionConfig.commission_categories[cat.id] : ''}
                      placeholder={commissionConfig.commission_globale}
                      onChange={(e) => handleUpdateCategoryCommission(cat.id, e.target.value)}
                    />
                    <span>%</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="settings-section">
              <h3 style={{ color: 'var(--admin-gold)', marginBottom: '15px' }}>{t('merchantCommissions')}</h3>
              <div className="form-group" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label className="form-label" style={{ margin: 0 }}>Maison El Fassi</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <input 
                    type="number" 
                    className="form-input" 
                    style={{ width: '80px', padding: '6px' }}
                    value={commissionConfig.commission_commercants['u_merchant1'] !== undefined ? commissionConfig.commission_commercants['u_merchant1'] : ''}
                    placeholder={commissionConfig.commission_globale}
                    onChange={(e) => handleUpdateMerchantCommission('u_merchant1', e.target.value)}
                  />
                  <span>%</span>
                </div>
              </div>
              <div className="form-group" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label className="form-label" style={{ margin: 0 }}>Maroc Chrono</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <input 
                    type="number" 
                    className="form-input" 
                    style={{ width: '80px', padding: '6px' }}
                    value={commissionConfig.commission_commercants['u_merchant2'] !== undefined ? commissionConfig.commission_commercants['u_merchant2'] : ''}
                    placeholder={commissionConfig.commission_globale}
                    onChange={(e) => handleUpdateMerchantCommission('u_merchant2', e.target.value)}
                  />
                  <span>%</span>
                </div>
              </div>
            </div>

            <button type="submit" className="btn-gold" style={{ width: '100%' }}>
              {t('saveConfig')}
            </button>
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
                  title="Traduit automatiquement le nom renseigné vers les 2 autres langues"
                >
                  ✨ Traduire automatiquement vers les autres langues
                </button>
              </div>
              <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px' }}>
                <div className="form-group">
                  <label className="form-label">{t('catNameFr')}</label>
                  <input type="text" className="form-input" value={newCat.nom_fr} onChange={e => setNewCat({ ...newCat, nom_fr: e.target.value })} placeholder="ex: Colliers" required />
                </div>
                <div className="form-group">
                  <label className="form-label">{t('catNameAr')}</label>
                  <input type="text" className="form-input" dir="rtl" value={newCat.nom_ar} onChange={e => setNewCat({ ...newCat, nom_ar: e.target.value })} placeholder="مثال: قلائد" required />
                </div>
                <div className="form-group">
                  <label className="form-label">{t('catNameEn')}</label>
                  <input type="text" className="form-input" value={newCat.nom_en} onChange={e => setNewCat({ ...newCat, nom_en: e.target.value })} placeholder="e.g. Necklaces" required />
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
                    <th>Français</th>
                    <th>العربية</th>
                    <th>English</th>
                    <th>{t('action')}</th>
                  </tr>
                </thead>
                <tbody>
                  {categories.map(cat => (
                    <tr key={cat.id}>
                      <td style={{ color: 'var(--text-gray)', fontSize: '0.8rem' }}>{cat.id}</td>
                      <td>{cat.nom_fr}</td>
                      <td>{cat.nom_ar}</td>
                      <td>{cat.nom_en}</td>
                      <td>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button 
                            type="button" 
                            className="btn-outline-gold" 
                            style={{ padding: '5px 12px', fontSize: '0.78rem' }} 
                            onClick={() => handleOpenEditCategory(cat)}
                          >
                            ✏️ {lang === 'ar' ? 'تعديل' : (lang === 'en' ? 'Edit' : 'Modifier')}
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

            {/* EDIT CATEGORY MODAL (3 LANGUAGES) */}
            {editingCategory && (
              <div className="modal-overlay">
                <form className="modal-content" onSubmit={handleSaveCategory} style={{ maxWidth: '520px', padding: '25px' }}>
                  <button type="button" className="modal-close-btn" onClick={() => setEditingCategory(null)}>✕</button>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '8px' }}>
                    <h3 style={{ color: 'var(--admin-gold)', margin: 0, fontFamily: 'Playfair Display', fontSize: '1.3rem' }}>
                      🌐 Édition Catégorie (3 Langues)
                    </h3>
                    <button 
                      type="button" 
                      onClick={() => handleAutoTranslateCategory(editingCategory, setEditingCategory)}
                      className="btn-outline-gold"
                      style={{ fontSize: '0.78rem', padding: '4px 10px' }}
                      title="Traduit automatiquement vers les autres langues"
                    >
                      ✨ Traduire auto
                    </button>
                  </div>
                  <div className="form-group" style={{ marginBottom: '14px' }}>
                    <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Nom (Français) 🇫🇷</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-gray)' }}>Obligatoire</span>
                    </label>
                    <input 
                      type="text" 
                      className="form-input" 
                      value={editingCategory.nom_fr || ''} 
                      onChange={e => setEditingCategory({ ...editingCategory, nom_fr: e.target.value })} 
                      required 
                    />
                  </div>
                  <div className="form-group" style={{ marginBottom: '14px' }}>
                    <label className="form-label" style={{ textAlign: 'right', display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-gray)' }}>العربية (RTL)</span>
                      <span>الاسم (بالعربية) 🇲🇦</span>
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
                      <span>Name (English) 🇬🇧</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-gray)' }}>English</span>
                    </label>
                    <input 
                      type="text" 
                      className="form-input" 
                      value={editingCategory.nom_en || ''} 
                      onChange={e => setEditingCategory({ ...editingCategory, nom_en: e.target.value })} 
                      required 
                    />
                  </div>
                  <div className="form-group" style={{ marginBottom: '20px' }}>
                    <label className="form-label">Icône / Emoji</label>
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
                      Enregistrer les 3 Langues
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
                    <th>Info Boutique / Contact</th>
                    <th>{t('action')}</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.id}>
                      <td style={{ color: 'var(--text-gray)', fontSize: '0.8rem' }}>{u.id}</td>
                      <td style={{ fontWeight: 'bold' }}>{u.nom}</td>
                      <td>{u.email}</td>
                      <td>
                        <span style={{ 
                          backgroundColor: u.role === 'admin' ? 'rgba(231, 76, 60, 0.15)' : (u.role === 'commercant' ? 'rgba(212, 175, 55, 0.15)' : 'rgba(52, 152, 219, 0.15)'), 
                          color: u.role === 'admin' ? '#e74c3c' : (u.role === 'commercant' ? 'var(--admin-gold)' : '#3498db'), 
                          padding: '2px 8px', 
                          borderRadius: '3px', 
                          fontSize: '0.75rem', 
                          textTransform: 'uppercase',
                          fontWeight: 'bold'
                        }}>
                          {u.role === 'admin' ? 'Admin' : (u.role === 'commercant' ? 'Commerçant' : 'Client')}
                        </span>
                      </td>
                      <td>
                        {u.role === 'commercant' ? (
                          <div style={{ fontSize: '0.8rem' }}>
                            <div>🏪 <strong>{u.shopName}</strong></div>
                            <div>📞 {u.phone}</div>
                            <div>📍 {u.address}, {u.city}</div>
                          </div>
                        ) : '-'}
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
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'roles' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '15px' }}>
              <h2 style={{ fontFamily: 'Playfair Display', margin: 0 }}>Configuration des Rôles & Autorisations</h2>
              <button className="btn-outline-gold" style={{ padding: '8px 16px', fontSize: '0.85rem' }} onClick={handleResetPermissions}>
                🔄 Réinitialiser les permissions
              </button>
            </div>

            {/* Roles Matrix Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', marginBottom: '40px' }}>
              {[
                { key: 'admin', title: 'Administrateur', icon: '🛡️', color: '#e74c3c', desc: 'Gestion globale de la plateforme, commissions et validations.' },
                { key: 'commercant', title: 'Commerçant (Vendeur)', icon: '🏪', color: 'var(--admin-gold)', desc: 'Vente directe, enchères, gestion de boutique.' },
                { key: 'client', title: 'Client', icon: '👥', color: '#3498db', desc: 'Achat direct, participation aux enchères, favoris.' }
              ].map(roleItem => {
                const roleCount = users.filter(u => u.role === roleItem.key).length;
                const permissionsList = [
                  { key: 'view_dashboard', label: 'Accès au Dashboard & Graphiques' },
                  { key: 'moderate_auctions', label: 'Modération des Enchères' },
                  { key: 'manage_commissions', label: 'Configuration des Commissions' },
                  { key: 'manage_categories', label: 'Gestion des Catégories' },
                  { key: 'manage_users', label: 'Gestion des Utilisateurs' },
                  { key: 'manage_roles', label: 'Gestion des Rôles & Permissions' },
                  { key: 'edit_products', label: 'Édition de tout le catalogue' },
                  { key: 'create_products', label: 'Ajout direct d\'articles' }
                ];
                
                return (
                  <div key={roleItem.key} className="dashboard-card" style={{ borderTop: `4px solid ${roleItem.color}`, display: 'flex', flexDirection: 'column', height: '100%', padding: '20px', backgroundColor: 'rgba(255, 255, 255, 0.02)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                      <h3 style={{ fontSize: '1.2rem', color: roleItem.color, margin: 0, fontFamily: 'Playfair Display' }}>
                        {roleItem.icon} {roleItem.title}
                      </h3>
                      <span className="stat-badge" style={{ backgroundColor: 'rgba(255,255,255,0.05)', color: 'white', padding: '2px 8px', borderRadius: '12px', fontSize: '0.8rem' }}>
                        {roleCount} membres
                      </span>
                    </div>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-gray)', marginBottom: '20px', lineHeight: '1.4' }}>
                      {roleItem.desc}
                    </p>
                    
                    <h4 style={{ fontSize: '0.9rem', color: 'var(--admin-gold)', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '5px', marginBottom: '12px' }}>
                      Autorisations activées :
                    </h4>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', flexGrow: 1 }}>
                      {permissionsList.map(perm => {
                        const isChecked = (rolePermissions[roleItem.key] || []).includes(perm.key);
                        return (
                          <label key={perm.key} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', cursor: 'pointer' }}>
                            <input 
                              type="checkbox" 
                              checked={isChecked} 
                              onChange={() => handleTogglePermission(roleItem.key, perm.key)} 
                              style={{ accentColor: 'var(--admin-gold)' }}
                            />
                            <span style={{ color: isChecked ? 'white' : 'var(--text-gray)' }}>
                              {perm.label}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Quick Roles Assignment */}
            <div className="table-container" style={{ marginTop: '20px' }}>
              <div style={{ padding: '20px', borderBottom: '1px solid rgba(212,175,55,0.2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                <h3 style={{ margin: 0, fontSize: '1.25rem', fontFamily: 'Playfair Display' }}>Affectation Rapide des Rôles</h3>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-gray)' }}>Total : {users.length} utilisateurs inscrits</span>
              </div>
              
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Utilisateur</th>
                    <th>Email</th>
                    <th>Rôle Actuel</th>
                    <th>Nouveau Rôle</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.id}>
                      <td>
                        <strong style={{ color: 'white' }}>{u.nom}</strong>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-gray)' }}>ID: {u.id}</div>
                      </td>
                      <td>{u.email}</td>
                      <td>
                        <span style={{ 
                          backgroundColor: u.role === 'admin' ? 'rgba(231, 76, 60, 0.15)' : (u.role === 'commercant' ? 'rgba(212, 175, 55, 0.15)' : 'rgba(52, 152, 219, 0.15)'), 
                          color: u.role === 'admin' ? '#e74c3c' : (u.role === 'commercant' ? 'var(--admin-gold)' : '#3498db'), 
                          padding: '2px 8px', 
                          borderRadius: '3px', 
                          fontSize: '0.75rem', 
                          textTransform: 'uppercase',
                          fontWeight: 'bold'
                        }}>
                          {u.role === 'admin' ? 'Admin' : (u.role === 'commercant' ? 'Commerçant' : 'Client')}
                        </span>
                      </td>
                      <td>
                        <select 
                          className="form-input" 
                          style={{ margin: 0, padding: '4px 10px', fontSize: '0.85rem', width: 'auto', display: 'inline-block' }}
                          value={u.role}
                          onChange={(e) => handleQuickRoleChange(u.id, e.target.value)}
                        >
                          <option value="client">Client</option>
                          <option value="commercant">Commerçant (Vendeur)</option>
                          <option value="admin">Administrateur</option>
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
                <p style={{ color: 'var(--text-gray)', fontSize: '0.88rem', margin: '4px 0 0' }}>Superviser les enchères en temps réel, modérer les offres et valider les adjudications.</p>
              </div>
              <button className="btn-gold" style={{ padding: '8px 18px', fontSize: '0.85rem' }} onClick={handleOpenAddAuction}>
                ➕ Lancer une Nouvelle Enchère
              </button>
            </div>

            {/* Stats Row */}
            <div className="stats-row" style={{ marginBottom: '25px' }}>
              <div className="stat-card" style={{ borderLeft: '4px solid var(--admin-gold)' }}>
                <span className="stat-title">Enchères en Direct</span>
                <span className="stat-num" style={{ color: 'var(--admin-gold)' }}>
                  {auctions.filter(a => a.statut === 'Active' && new Date(a.date_fin) > new Date()).length}
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--success-green)' }}>En cours de réception d'offres</span>
              </div>
              <div className="stat-card">
                <span className="stat-title">Total Enchères Historique</span>
                <span className="stat-num">{auctions.length}</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-gray)' }}>Créées sur la plateforme</span>
              </div>
              <div className="stat-card">
                <span className="stat-title">Offres Déposées</span>
                <span className="stat-num" style={{ color: 'var(--success-green)' }}>
                  {auctions.reduce((sum, a) => sum + (a.bidsCount || 0), 0)}
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-gray)' }}>Mises clients cumulées</span>
              </div>
              <div className="stat-card">
                <span className="stat-title">Meilleure Adjudication</span>
                <span className="stat-num" style={{ color: 'var(--admin-gold)' }}>
                  {Math.max(...auctions.map(a => a.highestBid || 0), 0).toLocaleString()} MAD
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-gray)' }}>Record de vente</span>
              </div>
            </div>

            {/* Table */}
            <div className="table-container">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Bijou / Lot</th>
                    <th>Vendeur</th>
                    <th>Prix de Départ</th>
                    <th>Offre Actuelle</th>
                    <th>Mises</th>
                    <th>Fin de l'Enchère</th>
                    <th>Statut</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {auctions.length === 0 ? (
                    <tr>
                      <td colSpan="8" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-gray)' }}>
                        Aucune enchère en cours. Cliquez sur "➕ Lancer une Nouvelle Enchère" pour publier un premier lot.
                      </td>
                    </tr>
                  ) : (
                    auctions.map(auc => {
                      const isExpired = new Date(auc.date_fin) < new Date();
                      const isActive = auc.statut === 'Active' && !isExpired;
                      return (
                        <tr key={auc.id}>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              {auc.bijou?.images?.[0] && (
                                <img
                                  src={auc.bijou.images[0]}
                                  alt={auc.bijou?.titre}
                                  style={{ width: '42px', height: '42px', borderRadius: '6px', objectFit: 'cover', border: '1px solid var(--border-gold)' }}
                                />
                              )}
                              <div>
                                <strong style={{ display: 'block', color: 'var(--text-dark)' }}>{auc.bijou?.titre || 'Bijou #' + auc.bijou_id}</strong>
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
                              {auc.bidsCount || 0} offre{(auc.bidsCount || 0) > 1 ? 's' : ''}
                            </span>
                          </td>
                          <td style={{ fontSize: '0.82rem' }}>
                            <div>{new Date(auc.date_fin).toLocaleDateString('fr-FR')}</div>
                            <div style={{ fontSize: '0.75rem', color: isExpired ? '#ef4444' : 'var(--text-gray)' }}>
                              {isExpired ? 'Expirée' : new Date(auc.date_fin).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
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
                              {isActive ? '🟢 En direct' : (auc.statut === 'Resolved' ? '🏆 Adjugé' : (isExpired ? '⏳ Terminée' : '❌ Annulée'))}
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
                                👁️ Offres
                              </button>
                              {isActive && (
                                <button
                                  className="btn-outline-gold"
                                  style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                                  title="Clôturer et désigner le gagnant"
                                  onClick={() => handleResolveAuction(auc.id)}
                                >
                                  🏆 Clôturer
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
                <span className="stat-title">Revenu Mensuel Récurrent (MRR)</span>
                <span className="stat-num" style={{ color: 'var(--admin-gold)' }}>
                  {(subscriptionsData?.stats?.mrr || 0).toLocaleString()} MAD
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--success-green)' }}>+18% vs mois précédent</span>
              </div>
              <div className="stat-card">
                <span className="stat-title">Revenu Annuel Projeté (ARR)</span>
                <span className="stat-num">
                  {(subscriptionsData?.stats?.arr || 0).toLocaleString()} MAD
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-gray)' }}>Base abonnements actifs</span>
              </div>
              <div className="stat-card">
                <span className="stat-title">Commerçants Abonnés Payants</span>
                <span className="stat-num">
                  {subscriptionsData?.stats?.subscribed_paying || 0} / {subscriptionsData?.stats?.total_merchants || 0}
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--admin-gold)' }}>
                  {subscriptionsData?.stats?.total_merchants ? Math.round(((subscriptionsData.stats.subscribed_paying || 0) / subscriptionsData.stats.total_merchants) * 100) : 0}% de conversion
                </span>
              </div>
              <div className="stat-card">
                <span className="stat-title">Répartition par Formule</span>
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
              <h2 style={{ fontFamily: 'Playfair Display', margin: 0 }}>Abonnements Commerçants Actifs</h2>
            </div>

            <div className="table-container" style={{ marginBottom: '36px' }}>
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Boutique & Marchand</th>
                    <th>Forfait Actif</th>
                    <th>Quota Dépôts Bijoux</th>
                    <th>Commission</th>
                    <th>Tarif / Cycle</th>
                    <th>Statut</th>
                    <th>Échéance</th>
                    <th>Actions</th>
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
                            {sub.billing_cycle === 'annual' ? 'Annuel' : 'Mensuel'}
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
                            {sub.status === 'active' ? 'Actif' : 'Suspendu'}
                          </span>
                        </td>
                        <td style={{ fontSize: '0.8rem', color: 'var(--text-gray)' }}>
                          {sub.end_date ? new Date(sub.end_date).toLocaleDateString('fr-FR') : '-'}
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '6px' }}>
                            <button
                              className="btn-approve"
                              style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                              title="Changer ou surclasser le forfait"
                              onClick={() => setMerchantSubModal(m)}
                            >
                              ⚙️ Modifier
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
              <h2 style={{ fontFamily: 'Playfair Display', margin: 0 }}>Configuration des Tarifs & Quotas des Forfaits</h2>
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
                ➕ Créer un Nouveau Forfait
              </button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginBottom: '36px' }}>
              {(subscriptionsData?.plans || []).map(plan => (
                <div key={plan.id} style={{ background: 'var(--bg-card)', border: '1px solid var(--border-gold)', borderRadius: 'var(--radius-md)', padding: '22px', boxShadow: 'var(--shadow)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <h3 style={{ fontSize: '1.2rem', color: 'var(--admin-gold)', margin: 0 }}>{plan.name}</h3>
                    <button
                      className="btn-outline-gold"
                      style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                      onClick={() => setEditingPlanModal({ ...plan })}
                    >
                      ✏️ Éditer
                    </button>
                  </div>
                  <p style={{ color: 'var(--text-gray)', fontSize: '0.82rem', marginBottom: '16px' }}>{plan.tagline}</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.85rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-gray)' }}>Prix Mensuel :</span>
                      <strong>{plan.price_monthly} MAD</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-gray)' }}>Prix Annuel :</span>
                      <strong>{plan.price_annual} MAD</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-gray)' }}>Dépôts Bijoux Max :</span>
                      <strong style={{ color: 'var(--admin-gold)' }}>{plan.max_products > 1000 ? 'Illimité' : plan.max_products}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-gray)' }}>Commission Plateforme :</span>
                      <strong style={{ color: '#10b981' }}>{plan.commission_rate}%</strong>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Invoices Log */}
            <h2 style={{ fontFamily: 'Playfair Display', marginBottom: '16px' }}>Historique Global des Factures & Encaissements</h2>
            <div className="table-container">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>N° Facture</th>
                    <th>Boutique</th>
                    <th>Forfait</th>
                    <th>Montant</th>
                    <th>Cycle</th>
                    <th>Date</th>
                    <th>Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {(subscriptionsData?.invoices || []).map(inv => (
                    <tr key={inv.id}>
                      <td style={{ fontWeight: 'bold' }}>{inv.invoice_number}</td>
                      <td>{inv.merchant_name}</td>
                      <td style={{ color: 'var(--admin-gold)' }}>{inv.plan_name}</td>
                      <td><strong>{inv.amount?.toLocaleString()} MAD</strong></td>
                      <td>{inv.billing_cycle === 'annual' ? 'Annuel' : 'Mensuel'}</td>
                      <td style={{ color: 'var(--text-gray)', fontSize: '0.8rem' }}>{new Date(inv.date).toLocaleDateString('fr-FR')}</td>
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '15px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <h2 style={{ fontFamily: 'Playfair Display', margin: 0 }}>{t('productManagement')}</h2>
                <button type="button" className="btn-approve" style={{ padding: '8px 16px', fontSize: '0.85rem' }} onClick={handleOpenAddProduct}>
                  ➕ {t('addProduct')}
                </button>
              </div>
              
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', flexGrow: 1, justifyContent: 'flex-end' }}>
                <input 
                  type="text" 
                  className="form-input" 
                  style={{ maxWidth: '300px', margin: 0 }}
                  placeholder={t('searchProduct')}
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                />
                
                <select 
                  className="form-input" 
                  style={{ maxWidth: '200px', margin: 0, padding: '8px 12px' }}
                  value={productStatusFilter}
                  onChange={(e) => setProductStatusFilter(e.target.value)}
                >
                  <option value="All">{t('filterStatus')}: {t('allProducts')}</option>
                  <option value="Validated">{t('statusApproved')}</option>
                  <option value="Pending">{t('statusPending')}</option>
                  <option value="Rejected">{t('statusRejected')}</option>
                </select>

                <select 
                  className="form-input" 
                  style={{ maxWidth: '200px', margin: 0, padding: '8px 12px' }}
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
                    return matchesSearch && matchesStatus && matchesCategory;
                  }).map(p => {
                    const shop = users.find(u => u.id === p.commercant_id)?.shopName || 'Commerçant Inconnu';
                    const category = categories.find(c => c.id === p.category_id);
                    const catName = category ? (lang === 'fr' ? category.nom_fr : (lang === 'ar' ? category.nom_ar : category.nom_en)) : 'Sans Catégorie';
                    const displayTitle = (lang === 'ar' && p.titre_ar) ? p.titre_ar : ((lang === 'en' && p.titre_en) ? p.titre_en : (p.titre_fr || p.titre));
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
                                <span style={{ fontSize: '0.65rem', padding: '1px 5px', borderRadius: '3px', fontWeight: 700, background: (p.titre_fr || p.titre) ? 'rgba(46, 204, 113, 0.2)' : 'rgba(255,255,255,0.1)', color: (p.titre_fr || p.titre) ? '#27ae60' : 'var(--text-gray)' }}>FR</span>
                                <span style={{ fontSize: '0.65rem', padding: '1px 5px', borderRadius: '3px', fontWeight: 700, background: p.titre_ar ? 'rgba(46, 204, 113, 0.2)' : 'rgba(255,255,255,0.1)', color: p.titre_ar ? '#27ae60' : 'var(--text-gray)' }}>AR</span>
                                <span style={{ fontSize: '0.65rem', padding: '1px 5px', borderRadius: '3px', fontWeight: 700, background: p.titre_en ? 'rgba(46, 204, 113, 0.2)' : 'rgba(255,255,255,0.1)', color: p.titre_en ? '#27ae60' : 'var(--text-gray)' }}>EN</span>
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
                        Aucun article trouvé.
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
          <p>Fédération Marocaine de Bijouterie • Portail Administratif</p>
          <p className="sub-text">Copyright © 2026; sdbo.ma • Tous droits réservés.</p>
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
                <label className="form-label">{t('role')}</label>
                <select 
                  className="form-input" 
                  value={userForm.role} 
                  onChange={e => setUserForm({ ...userForm, role: e.target.value })}
                >
                  <option value="client">Client</option>
                  <option value="commercant">Commerçant (Vendeur)</option>
                  <option value="admin">Administrateur</option>
                </select>
              </div>
            </div>

            {userForm.role === 'commercant' && (
              <fieldset style={{ border: '1px solid var(--border-gold)', borderRadius: '4px', padding: '15px', marginBottom: '15px' }}>
                <legend style={{ color: 'var(--admin-gold)', padding: '0 8px', fontSize: '0.85rem' }}>Informations Boutique</legend>
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
                    <label className="form-label">{t('phone')}</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      value={userForm.phone} 
                      onChange={e => setUserForm({ ...userForm, phone: e.target.value })} 
                    />
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                  <div className="form-group">
                    <label className="form-label">{t('address')}</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      value={userForm.address} 
                      onChange={e => setUserForm({ ...userForm, address: e.target.value })} 
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
              </fieldset>
            )}

            <div style={{ display: 'flex', gap: '15px', justifyContent: 'flex-end', marginTop: '20px' }}>
              <button type="button" className="btn-outline-gold" style={{ padding: '8px 16px', fontSize: '0.8rem' }} onClick={() => setShowUserModal(false)}>
                {t('cancel')}
              </button>
              <button type="submit" className="btn-gold" style={{ margin: 0, padding: '8px 16px', fontSize: '0.8rem' }}>
                {editingUser ? 'Mettre à jour' : 'Créer'}
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
                    {isTranslating ? '⏳ Traduction en cours...' : '✨ Traduire automatiquement vers les autres langues'}
                  </button>
                  
                  {/* Language Switcher Tabs */}
                  <div style={{ display: 'flex', gap: '6px', background: 'rgba(0,0,0,0.2)', padding: '3px', borderRadius: '8px' }}>
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
                      onClick={() => switchProductLangTab('en')}
                      style={{
                        padding: '5px 12px',
                        borderRadius: '6px',
                        border: 'none',
                        fontSize: '0.82rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        background: productLangTab === 'en' ? 'var(--admin-gold)' : 'transparent',
                        color: productLangTab === 'en' ? '#000' : 'var(--text-gray)'
                      }}
                    >
                      🇬🇧 English {productForm.titre_en ? '✓' : ''}
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
              {productLangTab === 'fr' && (
                <div>
                  <div className="form-group" style={{ marginBottom: '12px' }}>
                    <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Titre en Français 🇫🇷</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-gray)' }}>Obligatoire</span>
                    </label>
                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder="ex: Bague Solitaire Diamant Or Blanc 18K"
                      value={productForm.titre_fr} 
                      onChange={e => setProductForm({ ...productForm, titre_fr: e.target.value, titre: e.target.value })} 
                      required 
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Description en Français 🇫🇷</label>
                    <textarea 
                      className="form-input" 
                      rows="3"
                      placeholder="Description détaillée du bijou en français..."
                      value={productForm.description_fr} 
                      onChange={e => setProductForm({ ...productForm, description_fr: e.target.value, description: e.target.value })} 
                    />
                  </div>
                </div>
              )}

              {productLangTab === 'ar' && (
                <div dir="rtl">
                  <div className="form-group" style={{ marginBottom: '12px' }}>
                    <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between', textAlign: 'right' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-gray)' }}>العربية (RTL)</span>
                      <span>العنوان باللغة العربية 🇲🇦</span>
                    </label>
                    <input 
                      type="text" 
                      className="form-input" 
                      dir="rtl"
                      placeholder="مثال: خاتم سوليتير ألماس ذهب أبيض 18 قيراط"
                      value={productForm.titre_ar} 
                      onChange={e => setProductForm({ ...productForm, titre_ar: e.target.value })} 
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label" style={{ textAlign: 'right' }}>الوصف باللغة العربية 🇲🇦</label>
                    <textarea 
                      className="form-input" 
                      rows="3"
                      dir="rtl"
                      placeholder="وصف تفصيلي للقطعة باللغة العربية..."
                      value={productForm.description_ar} 
                      onChange={e => setProductForm({ ...productForm, description_ar: e.target.value })} 
                    />
                  </div>
                </div>
              )}

              {productLangTab === 'en' && (
                <div>
                  <div className="form-group" style={{ marginBottom: '12px' }}>
                    <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Title in English 🇬🇧</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-gray)' }}>English</span>
                    </label>
                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder="e.g. Diamond Solitaire Ring 18K White Gold"
                      value={productForm.titre_en} 
                      onChange={e => setProductForm({ ...productForm, titre_en: e.target.value })} 
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Description in English 🇬🇧</label>
                    <textarea 
                      className="form-input" 
                      rows="3"
                      placeholder="Detailed piece description in English..."
                      value={productForm.description_en} 
                      onChange={e => setProductForm({ ...productForm, description_en: e.target.value })} 
                    />
                  </div>
                </div>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '15px', marginBottom: '15px' }}>
              {productForm.type_vente === 'enchere' ? (
                <div className="form-group">
                  <label className="form-label">{t('startingPrice')} (MAD)</label>
                  <input 
                    type="number" 
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
                    className="form-input" 
                    value={productForm.prix} 
                    onChange={e => setProductForm({ ...productForm, prix: e.target.value })} 
                    required 
                  />
                </div>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px', marginBottom: '15px' }}>
              <div className="form-group">
                <label className="form-label">{t('weight')} (g)</label>
                <input 
                  type="number" 
                  step="0.01"
                  className="form-input" 
                  value={productForm.gramme} 
                  onChange={e => setProductForm({ ...productForm, gramme: e.target.value })} 
                  required 
                />
              </div>
              <div className="form-group">
                <label className="form-label">{t('purity')}</label>
                <select 
                  className="form-input" 
                  value={productForm.purete} 
                  onChange={e => setProductForm({ ...productForm, purete: e.target.value })}
                >
                  <option value="18k">18k</option>
                  <option value="21k">21k</option>
                  <option value="22k">22k</option>
                  <option value="24k">24k</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">{t('city')}</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={productForm.city} 
                  onChange={e => setProductForm({ ...productForm, city: e.target.value })} 
                  required 
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px', marginBottom: '15px' }}>
              {productForm.type_vente === 'enchere' ? (
                <div className="form-group">
                  <label className="form-label">{t('durationHours')}</label>
                  <input 
                    type="number" 
                    className="form-input" 
                    value={productForm.duree} 
                    onChange={e => setProductForm({ ...productForm, duree: parseInt(e.target.value) || 24 })} 
                    required 
                  />
                </div>
              ) : (
                <div className="form-group">
                  <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>{t('stock')}</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--admin-gold)' }}>Pièce unique (Défaut: 1)</span>
                  </label>
                  <input 
                    type="number" 
                    min="1"
                    className="form-input" 
                    value={productForm.stock !== undefined && productForm.stock !== null && productForm.stock !== '' ? productForm.stock : 1} 
                    onChange={e => setProductForm({ ...productForm, stock: parseInt(e.target.value) || 1 })} 
                    required 
                  />
                </div>
              )}
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
                <label className="form-label">{t('status')}</label>
                <select 
                  className="form-input" 
                  value={productForm.statut} 
                  onChange={e => setProductForm({ ...productForm, statut: e.target.value })}
                >
                  <option value="Validated">{t('statusApproved')}</option>
                  <option value="Pending">{t('statusPending')}</option>
                  <option value="Rejected">{t('statusRejected')}</option>
                </select>
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: '15px' }}>
              <label className="form-label">{t('merchant')}</label>
              <select 
                className="form-input" 
                value={productForm.commercant_id} 
                onChange={e => setProductForm({ ...productForm, commercant_id: e.target.value })}
                required
              >
                <option value="">-- {t('merchant')} --</option>
                {users.filter(u => u.role === 'commercant').map(u => (
                  <option key={u.id} value={u.id}>
                    {u.shopName || u.nom}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', gap: '15px', justifyContent: 'flex-end', marginTop: '20px' }}>
              <button type="button" className="btn-outline-gold" style={{ padding: '10px 20px' }} onClick={() => setShowProductModal(false)}>
                {t('cancel')}
              </button>
              <button type="submit" className="btn-gold" style={{ margin: 0, padding: '10px 20px' }}>
                {t('saveConfig')}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* PLAN EDITING MODAL */}
      {editingPlanModal && (
        <div className="modal-backdrop" onClick={() => setEditingPlanModal(null)}>
          <div className="modal-content" style={{ maxWidth: '560px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ fontFamily: 'Playfair Display' }}>Édition du Forfait : {editingPlanModal.name}</h3>
              <button className="btn-close" onClick={() => setEditingPlanModal(null)}>✕</button>
            </div>
            <form onSubmit={handleSavePlanConfig}>
              <div className="form-group" style={{ marginBottom: '14px' }}>
                <label className="form-label">Nom du Forfait</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={editingPlanModal.name} 
                  onChange={e => setEditingPlanModal({ ...editingPlanModal, name: e.target.value })} 
                  required 
                />
              </div>

              <div className="form-group" style={{ marginBottom: '14px' }}>
                <label className="form-label">Slogan / Sous-titre</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={editingPlanModal.tagline} 
                  onChange={e => setEditingPlanModal({ ...editingPlanModal, tagline: e.target.value })} 
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '14px' }}>
                <div className="form-group">
                  <label className="form-label">Prix Mensuel (MAD)</label>
                  <input 
                    type="number" 
                    className="form-input" 
                    value={editingPlanModal.price_monthly} 
                    onChange={e => setEditingPlanModal({ ...editingPlanModal, price_monthly: parseFloat(e.target.value) || 0 })} 
                    required 
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Prix Annuel (MAD)</label>
                  <input 
                    type="number" 
                    className="form-input" 
                    value={editingPlanModal.price_annual} 
                    onChange={e => setEditingPlanModal({ ...editingPlanModal, price_annual: parseFloat(e.target.value) || 0 })} 
                    required 
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '20px' }}>
                <div className="form-group">
                  <label className="form-label">Quota Dépôts Bijoux Max</label>
                  <input 
                    type="number" 
                    className="form-input" 
                    value={editingPlanModal.max_products} 
                    onChange={e => setEditingPlanModal({ ...editingPlanModal, max_products: parseInt(e.target.value) || 5 })} 
                    required 
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Taux de Commission (%)</label>
                  <input 
                    type="number" 
                    step="0.5"
                    className="form-input" 
                    value={editingPlanModal.commission_rate} 
                    onChange={e => setEditingPlanModal({ ...editingPlanModal, commission_rate: parseFloat(e.target.value) || 0 })} 
                    required 
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button type="button" className="btn-outline-gold" onClick={() => setEditingPlanModal(null)}>
                  {t('cancel')}
                </button>
                <button type="submit" className="btn-gold" style={{ margin: 0 }}>
                  Enregistrer les modifications
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MERCHANT SUBSCRIPTION MODAL */}
      {merchantSubModal && (
        <div className="modal-backdrop" onClick={() => setMerchantSubModal(null)}>
          <div className="modal-content" style={{ maxWidth: '500px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ fontFamily: 'Playfair Display' }}>Forfait : {merchantSubModal.shopName}</h3>
              <button className="btn-close" onClick={() => setMerchantSubModal(null)}>✕</button>
            </div>
            <form onSubmit={(e) => {
              e.preventDefault();
              const planId = e.target.plan_id.value;
              const cycle = e.target.billing_cycle.value;
              handleUpdateMerchantPlan(merchantSubModal.id, planId, cycle);
            }}>
              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label className="form-label">Sélectionner la Formule</label>
                <select 
                  name="plan_id" 
                  className="form-input" 
                  defaultValue={merchantSubModal.subscription?.plan_id || 'plan_starter'}
                >
                  {(subscriptionsData?.plans || []).map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} — {p.price_monthly} MAD/mois ({p.max_products > 1000 ? 'Illimité' : `${p.max_products} bijoux`}, {p.commission_rate}%)
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: '24px' }}>
                <label className="form-label">Cycle de Facturation</label>
                <select 
                  name="billing_cycle" 
                  className="form-input" 
                  defaultValue={merchantSubModal.subscription?.billing_cycle || 'monthly'}
                >
                  <option value="monthly">Facturation Mensuelle</option>
                  <option value="annual">Facturation Annuelle (-20%)</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button type="button" className="btn-outline-gold" onClick={() => setMerchantSubModal(null)}>
                  {t('cancel')}
                </button>
                <button type="submit" className="btn-gold" style={{ margin: 0 }}>
                  Appliquer le changement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
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
        backgroundColor: '#07090b',
        color: '#d4af37',
        fontFamily: 'Playfair Display, serif'
      }}>
        <div style={{
          width: '45px',
          height: '45px',
          borderRadius: '50%',
          border: '3px solid rgba(212, 175, 55, 0.15)',
          borderTopColor: '#d4af37',
          animation: 'oriaSpin 0.9s linear infinite',
          marginBottom: '20px'
        }} />
        <span style={{ letterSpacing: '3px', fontSize: '1rem', fontWeight: '600' }}>HRSDGDG ADMINISTRATION</span>
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
