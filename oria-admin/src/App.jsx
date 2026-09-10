import React, { useState, useEffect } from 'react';
import { useLanguage, LanguageProvider } from './context/LanguageContext';
import { useAuth, AuthProvider } from './context/AuthContext';
import OriaLogo from './components/OriaLogo';
import AdminLogin from './components/AdminLogin';
import './styles/admin.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5077/api';

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
  
  // Categories inputs
  const [newCat, setNewCat] = useState({ nom_fr: '', nom_ar: '', nom_en: '' });

  // Rejection modal state
  const [selectedProductForRejection, setSelectedProductForRejection] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');

  // Products state & modal
  const [products, setProducts] = useState([]);
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [productForm, setProductForm] = useState({ 
    titre: '', 
    description: '', 
    prix: '', 
    gramme: '', 
    purete: '18k', 
    city: '', 
    stock: 0, 
    category_id: '', 
    statut: 'Validated', 
    commercant_id: '',
    type_vente: 'direct',
    prix_depart: '',
    duree: 24
  });

  // Product search/filters
  const [productSearch, setProductSearch] = useState('');
  const [productStatusFilter, setProductStatusFilter] = useState('All');
  const [productCategoryFilter, setProductCategoryFilter] = useState('All');

  // User form modal state
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [userForm, setUserForm] = useState({ nom: '', email: '', mot_de_passe: '', role: 'client', shopName: '', phone: '', address: '', city: '' });

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
    const defaultMerchant = users.find(u => u.role === 'commercant')?.id || '';
    const defaultCategory = categories[0]?.id || '';
    setProductForm({
      titre: '',
      description: '',
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

  const handleOpenEditProduct = (p) => {
    setEditingProduct(p);
    setProductForm({
      titre: p.titre || '',
      description: p.description || '',
      prix: p.prix || '',
      gramme: p.gramme || '',
      purete: p.purete || '18k',
      city: p.city || '',
      stock: p.stock || 0,
      category_id: p.category_id || '',
      commercant_id: p.commercant_id || '',
      statut: p.statut || 'Validated',
      type_vente: 'direct',
      prix_depart: '',
      duree: 24,
      images: p.images || []
    });
    setShowProductModal(true);
  };

  const handleProductSubmit = async (e) => {
    e.preventDefault();
    const url = editingProduct ? `${API_URL}/bijoux/${editingProduct.id}` : `${API_URL}/bijoux`;
    const method = editingProduct ? 'PUT' : 'POST';

    // Prepare body
    const bodyData = { ...productForm };
    if (!editingProduct && productForm.type_vente === 'enchere') {
      bodyData.prix = parseFloat(productForm.prix_depart);
      bodyData.stock = 1;
    }

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyData)
      });
      if (res.ok) {
        const createdProduct = await res.json();
        
        // If it's a new product and is an auction, create the auction entity
        if (!editingProduct && productForm.type_vente === 'enchere') {
          const auctionRes = await fetch(`${API_URL}/encheres`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              bijou_id: createdProduct.id,
              prix_depart: parseFloat(productForm.prix_depart),
              date_debut: new Date().toISOString(),
              date_fin: new Date(Date.now() + parseFloat(productForm.duree) * 60 * 60 * 1000).toISOString(),
              increment_min: 50,
              prix_reserve: parseFloat(productForm.prix_depart)
            })
          });
          if (!auctionRes.ok) {
            triggerNotif("Article créé, mais échec du lancement de l'enchère.");
            setShowProductModal(false);
            fetchData();
            return;
          }
        }

        triggerNotif(editingProduct ? 'Article mis à jour avec succès !' : 'Article créé avec succès !');
        setShowProductModal(false);
        fetchData();
      } else {
        triggerNotif(editingProduct ? "Erreur lors de la mise à jour de l'article." : "Erreur lors de la création de l'article.");
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
        allBijouxRes
      ] = await Promise.allSettled([
        fetch(`${API_URL}/stats/admin`),
        fetch(`${API_URL}/bijoux?status=Pending`),
        fetch(`${API_URL}/categories`),
        fetch(`${API_URL}/config`),
        fetch(`${API_URL}/users`),
        fetch(`${API_URL}/encheres`),
        fetch(`${API_URL}/bijoux`)
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

    } catch (error) {
      console.error('Error fetching admin data:', error);
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
          <h1>{t(activeTab === 'validation' ? 'validationQueue' : (activeTab === 'commissions' ? 'commissions' : (activeTab === 'categories' ? 'categories' : (activeTab === 'users' ? 'userManagement' : (activeTab === 'auctions' ? 'auctionManagement' : (activeTab === 'products' ? 'productManagement' : (activeTab === 'roles' ? 'roles' : 'dashboard')))))))}</h1>
          
          <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
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
              <h3 style={{ color: 'var(--admin-gold)', marginBottom: '20px' }}>{t('addNewCategory')}</h3>
              <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px' }}>
                <div className="form-group">
                  <label className="form-label">{t('catNameFr')}</label>
                  <input type="text" className="form-input" value={newCat.nom_fr} onChange={e => setNewCat({ ...newCat, nom_fr: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label className="form-label">{t('catNameAr')}</label>
                  <input type="text" className="form-input" value={newCat.nom_ar} onChange={e => setNewCat({ ...newCat, nom_ar: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label className="form-label">{t('catNameEn')}</label>
                  <input type="text" className="form-input" value={newCat.nom_en} onChange={e => setNewCat({ ...newCat, nom_en: e.target.value })} required />
                </div>
              </div>
              <button type="submit" className="btn-gold">{t('add')}</button>
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
                        <button className="btn-reject" onClick={() => handleDeleteCategory(cat.id)}>
                          {t('delete')}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontFamily: 'Playfair Display' }}>{t('auctionManagement')}</h2>
            </div>

            <div className="table-container">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Bijou</th>
                    <th>Vendeur</th>
                    <th>Prix de départ</th>
                    <th>Prix de réserve</th>
                    <th>Offre actuelle</th>
                    <th>Offres</th>
                    <th>Date de fin</th>
                    <th>Statut</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {auctions.map(auc => {
                    const isEnded = new Date(auc.date_fin) < new Date();
                    return (
                      <tr key={auc.id}>
                        <td style={{ color: 'var(--text-gray)', fontSize: '0.8rem' }}>{auc.id}</td>
                        <td style={{ fontWeight: 'bold' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            {auc.bijou?.images?.[0] && (
                              <img src={auc.bijou.images[0]} alt="" style={{ width: '40px', height: '40px', borderRadius: '4px', objectFit: 'cover' }} />
                            )}
                            <div>
                              <div>{auc.bijou?.titre || 'Bijou Supprimé'}</div>
                              <span style={{ fontSize: '0.75rem', color: 'var(--text-gray)' }}>{auc.bijou?.purete} • {auc.bijou?.gramme}g</span>
                            </div>
                          </div>
                        </td>
                        <td>
                          {users.find(u => u.id === auc.bijou?.commercant_id)?.shopName || 'Commerçant Inconnu'}
                        </td>
                        <td>{auc.prix_depart} MAD</td>
                        <td>{auc.prix_reserve ? `${auc.prix_reserve} MAD` : 'Aucun'}</td>
                        <td style={{ color: 'var(--admin-gold)', fontWeight: 'bold' }}>
                          {auc.highestBid} MAD
                        </td>
                        <td>
                          <button className="btn-approve" style={{ padding: '4px 8px', fontSize: '0.75rem' }} onClick={() => handleViewBids(auc)}>
                            🔍 {auc.bidsCount} offres
                          </button>
                        </td>
                        <td style={{ fontSize: '0.8rem' }}>
                          {new Date(auc.date_fin).toLocaleString()}
                          {isEnded && <span style={{ color: 'var(--danger-red)', display: 'block', fontSize: '0.7rem', fontWeight: 'bold' }}>Terminée</span>}
                        </td>
                        <td>
                          <span style={{
                            backgroundColor: auc.statut === 'Active' ? 'rgba(46, 204, 113, 0.15)' : (auc.statut === 'Cancelled' ? 'rgba(231, 76, 60, 0.15)' : 'rgba(255, 255, 255, 0.1)'),
                            color: auc.statut === 'Active' ? '#2ecc71' : (auc.statut === 'Cancelled' ? '#e74c3c' : 'white'),
                            padding: '2px 8px',
                            borderRadius: '3px',
                            fontSize: '0.75rem',
                            fontWeight: 'bold'
                          }}>
                            {auc.statut}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            {auc.statut === 'Active' && !isEnded && (
                              <button className="btn-reject" style={{ padding: '6px 12px', fontSize: '0.75rem', margin: 0 }} onClick={() => handleCancelAuction(auc.id)}>
                                Annuler
                              </button>
                            )}
                            {auc.statut === 'Active' && (
                              <button className="btn-approve" style={{ padding: '6px 12px', fontSize: '0.75rem' }} onClick={() => handleResolveAuction(auc.id)}>
                                Clôturer
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
                    const matchesSearch = p.titre?.toLowerCase().includes(productSearch.toLowerCase()) || 
                                          p.id?.toLowerCase().includes(productSearch.toLowerCase()) ||
                                          p.description?.toLowerCase().includes(productSearch.toLowerCase());
                    const matchesStatus = productStatusFilter === 'All' || p.statut === productStatusFilter;
                    const matchesCategory = productCategoryFilter === 'All' || p.category_id === productCategoryFilter;
                    return matchesSearch && matchesStatus && matchesCategory;
                  }).map(p => {
                    const shop = users.find(u => u.id === p.commercant_id)?.shopName || 'Commerçant Inconnu';
                    const category = categories.find(c => c.id === p.category_id);
                    const catName = category ? (lang === 'fr' ? category.nom_fr : (lang === 'ar' ? category.nom_ar : category.nom_en)) : 'Sans Catégorie';
                    return (
                      <tr key={p.id}>
                        <td style={{ color: 'var(--text-gray)', fontSize: '0.8rem' }}>{p.id}</td>
                        <td style={{ fontWeight: 'bold' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            {p.images?.[0] && (
                              <img src={p.images[0]} alt="" style={{ width: '40px', height: '40px', borderRadius: '4px', objectFit: 'cover' }} />
                            )}
                            <div>
                              <div>{p.titre}</div>
                              <span style={{ fontSize: '0.75rem', color: 'var(--text-gray)' }}>{p.purete} • {p.gramme}g • {p.city}</span>
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

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
              <div className="form-group">
                <label className="form-label">Titre</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={productForm.titre} 
                  onChange={e => setProductForm({ ...productForm, titre: e.target.value })} 
                  required 
                />
              </div>
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
                  <label className="form-label">{t('stock')}</label>
                  <input 
                    type="number" 
                    className="form-input" 
                    value={productForm.stock} 
                    onChange={e => setProductForm({ ...productForm, stock: parseInt(e.target.value) || 0 })} 
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

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
              <div className="form-group">
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
              <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                <label className="form-label">Image (URL ou Fichier Local)</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="https://images.unsplash.com/... (URL)"
                  value={productForm.images && productForm.images[0] && !productForm.images[0].startsWith('data:') ? productForm.images[0] : ''} 
                  onChange={e => setProductForm({ ...productForm, images: e.target.value ? [e.target.value] : [] })} 
                />
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '5px' }}>
                  <input 
                    type="file" 
                    accept="image/*"
                    style={{ display: 'none' }}
                    id="admin-product-file-upload"
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          setProductForm({ ...productForm, images: [reader.result] });
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                  />
                  <label htmlFor="admin-product-file-upload" className="btn-outline-gold" style={{ margin: 0, padding: '6px 12px', fontSize: '0.75rem', cursor: 'pointer', display: 'inline-block' }}>
                    📁 Choisir un fichier local
                  </label>
                  {productForm.images && productForm.images[0] && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <img 
                        src={productForm.images[0]} 
                        alt="Aperçu" 
                        style={{ width: '32px', height: '32px', borderRadius: '4px', objectFit: 'cover', border: '1px solid var(--admin-gold)' }} 
                      />
                      <span style={{ fontSize: '0.7rem', color: 'var(--success-green)' }}>
                        {productForm.images[0].startsWith('data:') ? 'Image locale chargée' : 'URL image chargée'}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: '25px' }}>
              <label className="form-label">{t('description')}</label>
              <textarea 
                className="form-input" 
                rows="3"
                value={productForm.description} 
                onChange={e => setProductForm({ ...productForm, description: e.target.value })} 
                required 
              />
            </div>

            <div style={{ display: 'flex', gap: '15px', justifyContent: 'flex-end' }}>
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
        <span style={{ letterSpacing: '3px', fontSize: '1rem', fontWeight: '600' }}>ORIA ADMINISTRATION</span>
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
