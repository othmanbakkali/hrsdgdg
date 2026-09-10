import React, { useState, useEffect } from 'react';
import { useLanguage, LanguageProvider } from './context/LanguageContext';
import { useAuth, AuthProvider } from './context/AuthContext';
import { useCart, CartProvider } from './context/CartContext';
import Marketplace from './views/Marketplace';
import ClientDashboard from './views/ClientDashboard';
import MerchantDashboard from './views/MerchantDashboard';
import LiveGoldTicker from './components/LiveGoldTicker';
import OriaLogo from './components/OriaLogo';
import Footer from './components/Footer';
import AuthModal from './components/AuthModal';
import { API_URL } from './config/api';
import './styles/theme.css';

const themes = {
  gold: {
    primary: '#d4af37',
    dark: '#aa7c11',
    light: '#f3e5ab',
    border: 'rgba(212, 175, 55, 0.25)',
    borderFocus: 'rgba(212, 175, 55, 0.6)',
    shadow: '0 4px 20px rgba(212, 175, 55, 0.15)'
  },
  emerald: {
    primary: '#2ecc71',
    dark: '#27ae60',
    light: '#a3e4d7',
    border: 'rgba(46, 204, 113, 0.25)',
    borderFocus: 'rgba(46, 204, 113, 0.6)',
    shadow: '0 4px 20px rgba(46, 204, 113, 0.15)'
  },
  ruby: {
    primary: '#e74c3c',
    dark: '#c0392b',
    light: '#fadbd8',
    border: 'rgba(231, 76, 60, 0.25)',
    borderFocus: 'rgba(231, 76, 60, 0.6)',
    shadow: '0 4px 20px rgba(231, 76, 60, 0.15)'
  },
  sapphire: {
    primary: '#3498db',
    dark: '#2980b9',
    light: '#aed6f1',
    border: 'rgba(52, 152, 219, 0.25)',
    borderFocus: 'rgba(52, 152, 219, 0.6)',
    shadow: '0 4px 20px rgba(52, 152, 219, 0.15)'
  },
  rosegold: {
    primary: '#b76e79',
    dark: '#8e545e',
    light: '#e8c4c8',
    border: 'rgba(183, 110, 121, 0.25)',
    borderFocus: 'rgba(183, 110, 121, 0.6)',
    shadow: '0 4px 20px rgba(183, 110, 121, 0.15)'
  }
};

function MainLayout() {
  const { t, lang, setLang, isRtl } = useLanguage();
  const { user, logout, toggleFavorite } = useAuth();
  const { cartItems, removeFromCart, updateQuantity, clearCart, cartTotal } = useCart();

  const [selectedTheme, setSelectedTheme] = useState(() => localStorage.getItem('oria-theme') || 'gold');
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  useEffect(() => {
    const tVals = themes[selectedTheme] || themes.gold;
    document.documentElement.style.setProperty('--primary-gold', tVals.primary);
    document.documentElement.style.setProperty('--dark-gold', tVals.dark);
    document.documentElement.style.setProperty('--light-gold', tVals.light);
    document.documentElement.style.setProperty('--border-gold', tVals.border);
    document.documentElement.style.setProperty('--border-gold-focus', tVals.borderFocus);
    document.documentElement.style.setProperty('--shadow-gold', tVals.shadow);
    localStorage.setItem('oria-theme', selectedTheme);
  }, [selectedTheme]);

  const [activeView, setActiveView] = useState('store'); // 'store', 'dashboard'
  const [selectedProduct, setSelectedProduct] = useState(null);
  
  // Cart Drawer State
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutMode, setIsCheckoutMode] = useState(false);
  
  // Checkout Form State
  const [checkoutForm, setCheckoutForm] = useState({ nom: '', telephone: '', adresse: '', ville: '' });
  
  // Bidding details in modal
  const [bidAmount, setBidAmount] = useState('');
  const [activeAuction, setActiveAuction] = useState(null);
  const [bidHistory, setBidHistory] = useState([]);
  
  // Contact seller state
  const [isContactingSeller, setIsContactingSeller] = useState(false);
  const [sellerMessage, setSellerMessage] = useState('');
  const [isCopied, setIsCopied] = useState(false);

  // Notifications State
  const [notifications, setNotifications] = useState([]);

  const addNotification = (message, type = 'info') => {
    const id = Math.random().toString(36).substr(2, 9);
    setNotifications(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 5000);
  };

  const handleCopyLink = (productId) => {
    const shareUrl = `${window.location.origin}/?product=${productId}`;
    navigator.clipboard.writeText(shareUrl).then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
      addNotification(t('linkCopied'), 'success');
    }).catch(() => {
      addNotification("Erreur lors de la copie du lien", "error");
    });
  };

  // Sync details when a product is clicked
  const handleProductSelect = async (product) => {
    setSelectedProduct(product);
    setBidAmount('');
    setSellerMessage('');
    setIsContactingSeller(false);

    try {
      // Find auction details
      const res = await fetch(`${API_URL}/encheres`);
      const data = await res.json();
      const linked = data.find(e => e.bijou_id === product.id && e.statut === 'Active');
      
      if (linked) {
        setActiveAuction(linked);
        setBidAmount(String(linked.highestBid + linked.increment_min));
        
        // Fetch auction bid history
        // Since the seed API returns bids directly or calculates, we can fetch all bids
        const allRes = await fetch(`${API_URL}/encheres`); // Server returns calculated bids inside
        // Let's emulate fetching history
      } else {
        setActiveAuction(null);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Check query parameters to auto-open shared product
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const productId = params.get('product');
    if (productId) {
      const fetchSharedProduct = async () => {
        try {
          const res = await fetch(`${API_URL}/bijoux/${productId}`);
          if (res.ok) {
            const product = await res.json();
            handleProductSelect(product);
          }
        } catch (e) {
          console.error("Erreur de chargement du produit partagé :", e);
        }
      };
      fetchSharedProduct();
    }
  }, []);

  // Resolve Auction automatically if timer is up
  useEffect(() => {
    if (!activeAuction) return;
    const checkAuctionExpiry = async () => {
      const diff = new Date(activeAuction.date_fin) - new Date();
      if (diff <= 0) {
        try {
          const res = await fetch(`${API_URL}/encheres/${activeAuction.id}/resolve`, {
            method: 'POST'
          });
          const data = await res.json();
          addNotification(data.message, 'success');
          // Refresh details
          setSelectedProduct(null);
          setActiveAuction(null);
        } catch (e) {
          console.error(e);
        }
      }
    };

    const interval = setInterval(checkAuctionExpiry, 3000);
    return () => clearInterval(interval);
  }, [activeAuction]);

  const handlePlaceBid = async (e) => {
    e.preventDefault();
    if (!activeAuction) return;
    if (!user) {
      setIsAuthModalOpen(true);
      addNotification('Veuillez vous connecter pour participer aux enchères.', 'info');
      return;
    }
    if (user?.role !== 'client') {
      addNotification('Seuls les comptes clients peuvent enchérir.', 'error');
      return;
    }
    
    const amount = parseFloat(bidAmount);
    const minBid = activeAuction.prix_actuel + activeAuction.increment_min;
    
    if (isNaN(amount) || amount < minBid) {
      addNotification(`L'enchère minimale requise est de ${minBid} MAD`, 'error');
      return;
    }

    try {
      const res = await fetch(`${API_URL}/encheres/${activeAuction.id}/bids`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: user.id,
          montant: amount
        })
      });

      if (!res.ok) {
        const err = await res.json();
        addNotification(err.message, 'error');
        return;
      }

      const updatedAuction = await res.json();
      setActiveAuction(updatedAuction);
      setBidAmount('');
      addNotification('Votre offre a été enregistrée avec succès ! 🔨', 'success');
      
      // Update bid history modal view
      // fetchBidHistory(updatedAuction.id);
    } catch (error) {
      addNotification('Erreur lors du dépôt de l\'enchère', 'error');
    }
  };

  const handleCheckout = async (e) => {
    e.preventDefault();
    if (cartItems.length === 0) return;
    if (!user) {
      setIsAuthModalOpen(true);
      addNotification('Veuillez vous connecter pour valider votre commande.', 'info');
      return;
    }

    try {
      const res = await fetch(`${API_URL}/commandes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: user.id,
          client_nom: checkoutForm.nom || user?.nom || 'Client',
          client_telephone: checkoutForm.telephone,
          client_adresse: checkoutForm.adresse,
          client_ville: checkoutForm.ville,
          items: cartItems.map(i => ({ bijou_id: i.id, titre: i.titre, prix: i.prix, quantite: i.quantite }))
        })
      });

      if (!res.ok) {
        const err = await res.json();
        addNotification(err.message, 'error');
        return;
      }

      addNotification(t('orderSuccess'), 'success');
      clearCart();
      setIsCartOpen(false);
      setIsCheckoutMode(false);
      setCheckoutForm({ nom: '', telephone: '', adresse: '', ville: '' });
      setActiveView('dashboard');
    } catch (error) {
      addNotification('Erreur de validation de commande', 'error');
    }
  };

  const handleContactSeller = async (e) => {
    e.preventDefault();
    if (!sellerMessage.trim() || !selectedProduct) return;
    if (!user) {
      setIsAuthModalOpen(true);
      addNotification('Veuillez vous connecter pour contacter le joaillier.', 'info');
      return;
    }

    try {
      const res = await fetch(`${API_URL}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sender_id: user.id,
          receiver_id: selectedProduct?.commercant_id,
          content: `[Bijou: ${selectedProduct?.titre}] ${sellerMessage}`
        })
      });

      if (res.ok) {
        addNotification('Message envoyé avec succès !', 'success');
        setSellerMessage('');
        setIsContactingSeller(false);
      }
    } catch (error) {
      addNotification('Erreur d\'envoi du message', 'error');
    }
  };

  return (
    <div className="app-container">
      {/* Live Moroccan Gold Market Rates Ticker */}
      <LiveGoldTicker />

      {/* Header - Navigation */}
      <header className="navbar">
        <a href="#" className="navbar-logo" onClick={() => setActiveView('store')} style={{ textDecoration: 'none' }}>
          <OriaLogo size={32} subtitle="HAUTE JOAILLERIE" />
        </a>
        
        <ul className="navbar-menu">
          <li>
            <span className={`navbar-item ${activeView === 'store' ? 'active' : ''}`} onClick={() => setActiveView('store')}>
              {t('home')}
            </span>
          </li>
          {user && (
            <li>
              <span className={`navbar-item ${activeView === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveView('dashboard')}>
                {user.role === 'client' ? t('dashboard') : '🏪 Espace Marchand'}
              </span>
            </li>
          )}
        </ul>

        <div className="navbar-actions">
          {/* Language Selector */}
          <select 
            className="dev-select"
            value={lang}
            onChange={(e) => setLang(e.target.value)}
            style={{ padding: '6px 12px', fontSize: '0.82rem', height: '36px' }}
          >
            <option value="fr">🇫🇷 FR</option>
            <option value="ar">🇲🇦 العربية</option>
            <option value="en">🇬🇧 EN</option>
          </select>

          {/* Cart Button */}
          <button 
            className="btn-outline-gold" 
            style={{ padding: '7px 14px', position: 'relative', height: '36px', display: 'inline-flex', alignItems: 'center', gap: '6px' }} 
            onClick={() => { setIsCartOpen(true); setIsCheckoutMode(false); }}
            title="Panier"
          >
            <span>🛒</span>
            <span className="cart-btn-label" style={{ fontSize: '0.82rem' }}>{t('cart')}</span>
            <span style={{ 
              background: 'var(--primary-gold)', 
              color: '#08080a', 
              fontWeight: 800, 
              fontSize: '0.72rem', 
              borderRadius: '10px', 
              padding: '1px 6px',
              marginLeft: '2px'
            }}>
              {cartItems.reduce((acc, item) => acc + item.quantite, 0)}
            </span>
          </button>

          {/* User Auth Section */}
          {!user ? (
            <button 
              type="button"
              className="btn-gold" 
              onClick={() => setIsAuthModalOpen(true)}
              style={{ padding: '7px 18px', fontSize: '0.82rem', height: '36px' }}
            >
              🔑 {lang === 'ar' ? 'تسجيل الدخول' : (lang === 'en' ? 'Sign In' : 'Connexion')}
            </button>
          ) : (
            <div className="user-profile-menu-wrapper" style={{ position: 'relative' }}>
              <div 
                className="user-nav-badge"
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: 'rgba(212, 175, 55, 0.12)',
                  border: '1px solid var(--border-gold)',
                  borderRadius: '20px',
                  padding: '4px 12px',
                  cursor: 'pointer',
                  height: '36px',
                  transition: 'all 0.2s'
                }}
              >
                <span style={{ fontSize: '1rem' }}>{user.role === 'client' ? '👤' : '🏪'}</span>
                <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.1, textAlign: isRtl ? 'right' : 'left' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#fff', maxWidth: '110px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {user.nom}
                  </span>
                  <span style={{ fontSize: '0.65rem', color: 'var(--primary-gold)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    {user.role === 'client' ? 'Client' : 'Joaillier'}
                  </span>
                </div>
                <span style={{ fontSize: '0.65rem', color: 'var(--primary-gold)', marginLeft: '2px' }}>▼</span>
              </div>

              {userMenuOpen && (
                <div 
                  className="user-dropdown-menu"
                  style={{
                    position: 'absolute',
                    top: '115%',
                    right: isRtl ? 'auto' : 0,
                    left: isRtl ? 0 : 'auto',
                    background: '#121218',
                    border: '1px solid var(--border-gold)',
                    borderRadius: '8px',
                    padding: '6px 0',
                    minWidth: '190px',
                    boxShadow: '0 15px 35px rgba(0,0,0,0.9)',
                    zIndex: 200
                  }}
                >
                  <div 
                    className="dropdown-item"
                    onClick={() => { setActiveView('dashboard'); setUserMenuOpen(false); }}
                    style={{ padding: '10px 16px', cursor: 'pointer', color: '#fff', fontSize: '0.85rem', display: 'flex', gap: '8px', alignItems: 'center' }}
                  >
                    📊 {t('dashboard')}
                  </div>
                  <div 
                    className="dropdown-item"
                    onClick={() => { logout(); setUserMenuOpen(false); setActiveView('store'); addNotification('Déconnexion effectuée', 'info'); }}
                    style={{ padding: '10px 16px', cursor: 'pointer', color: '#ef4444', fontSize: '0.85rem', borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', gap: '8px', alignItems: 'center' }}
                  >
                    🚪 {lang === 'ar' ? 'تسجيل الخروج' : (lang === 'en' ? 'Sign Out' : 'Se déconnecter')}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </header>

      {/* Notifications Toast */}
      <div className="notifications-container">
        {notifications.map(n => (
          <div key={n.id} className={`notif ${n.type}`}>
            <span>{n.message}</span>
            <button className="notif-close" onClick={() => setNotifications(prev => prev.filter(x => x.id !== n.id))}>✕</button>
          </div>
        ))}
      </div>

      {/* Main Content Area */}
      <div style={{ flexGrow: 1 }}>
        {activeView === 'store' ? (
          <Marketplace onSelectProduct={handleProductSelect} />
        ) : (
          user && user.role === 'client' ? (
            <ClientDashboard onSelectProduct={handleProductSelect} />
          ) : (
            <MerchantDashboard />
          )
        )}
      </div>

      {/* Mobile Navigation bar */}
      <nav className="bottom-nav">
        <span className={`bottom-nav-item ${activeView === 'store' ? 'active' : ''}`} onClick={() => setActiveView('store')}>
          <span className="bottom-nav-icon">💎</span>
          <span>{t('home')}</span>
        </span>
        {user && (
          <span className={`bottom-nav-item ${activeView === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveView('dashboard')}>
            <span className="bottom-nav-icon">👤</span>
            <span>{t('dashboard')}</span>
          </span>
        )}
        {user && user.role === 'client' && (
          <span className="bottom-nav-item" onClick={() => { setIsCartOpen(true); setIsCheckoutMode(false); }}>
            <span className="bottom-nav-icon">🛒</span>
            <span>{t('cart')} ({cartItems.reduce((acc, item) => acc + item.quantite, 0)})</span>
          </span>
        )}
      </nav>

      {/* Cart Drawer */}
      {isCartOpen && (
        <>
          <div className="cart-drawer-overlay" onClick={() => setIsCartOpen(false)}></div>
          <div className="cart-drawer">
            <button className="modal-close-btn" onClick={() => setIsCartOpen(false)}>✕</button>
            <h3 style={{ borderBottom: '1px solid var(--primary-gold)', paddingBottom: '15px', color: 'var(--primary-gold)' }}>
              {isCheckoutMode ? t('checkoutTitle') : t('cart')}
            </h3>

            {!isCheckoutMode ? (
              // Cart Items List
              <div style={{ flexGrow: 1, overflowY: 'auto', margin: '20px 0' }}>
                {cartItems.length === 0 ? (
                  <p style={{ color: 'var(--text-gray)', textAlign: 'center', marginTop: '50px' }}>Votre panier est vide.</p>
                ) : (
                  cartItems.map(item => (
                    <div key={item.id} className="cart-item">
                      <img src={item.images[0]} alt={item.titre} className="cart-item-img" />
                      <div className="cart-item-info">
                        <div className="cart-item-title">{item.titre}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--primary-gold)', fontWeight: 'bold' }}>
                          {item.prix} {t('currency')}
                        </div>
                        <div className="cart-item-qty">
                          <button className="qty-btn" onClick={() => item.quantite > 1 ? updateQuantity(item.id, item.quantite - 1) : removeFromCart(item.id)}>-</button>
                          <span>{item.quantite}</span>
                          <button className="qty-btn" onClick={() => updateQuantity(item.id, Math.min(item.stock, item.quantite + 1))}>+</button>
                        </div>
                      </div>
                      <button className="qty-btn" style={{ borderColor: 'var(--danger-red)', color: 'var(--danger-red)' }} onClick={() => removeFromCart(item.id)}>✕</button>
                    </div>
                  ))
                )}
              </div>
            ) : (
              // Checkout form
              <form onSubmit={handleCheckout} style={{ flexGrow: 1, overflowY: 'auto', margin: '20px 0' }}>
                <div className="form-group">
                  <label className="form-label">{t('clientName')}</label>
                  <input type="text" className="form-input" value={checkoutForm.nom} onChange={e => setCheckoutForm({ ...checkoutForm, nom: e.target.value })} placeholder={user?.nom || 'Votre nom complet'} required />
                </div>
                <div className="form-group">
                  <label className="form-label">{t('clientPhone')}</label>
                  <input type="tel" className="form-input" value={checkoutForm.telephone} onChange={e => setCheckoutForm({ ...checkoutForm, telephone: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label className="form-label">{t('clientAddress')}</label>
                  <input type="text" className="form-input" value={checkoutForm.adresse} onChange={e => setCheckoutForm({ ...checkoutForm, adresse: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label className="form-label">{t('clientCity')}</label>
                  <input type="text" className="form-input" value={checkoutForm.ville} onChange={e => setCheckoutForm({ ...checkoutForm, ville: e.target.value })} required />
                </div>

                <button type="submit" className="btn-gold" style={{ width: '100%', marginTop: '20px' }}>
                  {t('confirmOrder')}
                </button>
              </form>
            )}

            {cartItems.length > 0 && (
              <div style={{ borderTop: '1px solid var(--border-gold)', paddingTop: '20px', marginTop: 'auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px', fontSize: '1.1rem' }}>
                  <span>{t('total')}:</span>
                  <span style={{ color: 'var(--primary-gold)', fontWeight: 'bold' }}>{cartTotal} {t('currency')}</span>
                </div>
                
                {!isCheckoutMode ? (
                  <button className="btn-gold" style={{ width: '100%' }} onClick={() => setIsCheckoutMode(true)}>
                    {t('checkoutButton')}
                  </button>
                ) : (
                  <button className="btn-outline-gold" style={{ width: '100%' }} onClick={() => setIsCheckoutMode(false)}>
                    Retour au panier
                  </button>
                )}
              </div>
            )}
          </div>
        </>
      )}

      {/* Product Detail Modal */}
      {selectedProduct && (
        <div className="modal-overlay" onClick={() => setSelectedProduct(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close-btn" onClick={() => setSelectedProduct(null)}>✕</button>

            <div className="detail-layout">
              {/* Image zoom wrapper */}
              <div className="detail-gallery">
                <div className="detail-image-wrapper">
                  <img src={selectedProduct.images[0]} alt={selectedProduct.titre} className="detail-image" />
                </div>
              </div>

              {/* Information description */}
              <div className="detail-info">
                <span className="detail-category">{selectedProduct.purete} gold</span>
                <h2 className="detail-title">{selectedProduct.titre}</h2>
                <div className="detail-price">
                  {activeAuction ? activeAuction.highestBid : selectedProduct.prix} {t('currency')}
                </div>
                
                <p className="detail-description">{selectedProduct.description}</p>

                <div className="detail-specs-list">
                  <div className="spec-item">
                    <span className="spec-name">{t('weight')}</span>
                    <span className="spec-val">{selectedProduct.gramme} {t('grams')}</span>
                  </div>
                  <div className="spec-item">
                    <span className="spec-name">{t('purity')}</span>
                    <span className="spec-val">{selectedProduct.purete}</span>
                  </div>
                  <div className="spec-item">
                    <span className="spec-name">{t('city')}</span>
                    <span className="spec-val">{selectedProduct.city}</span>
                  </div>
                  <div className="spec-item">
                    <span className="spec-name">{t('merchant')}</span>
                    <span className="spec-val">
                      {selectedProduct.commercant_id === 'u_merchant1' ? 'Maison El Fassi' : 'Maroc Chrono'}
                    </span>
                  </div>
                  <div className="spec-item">
                    <span className="spec-name">{t('stock')}</span>
                    <span className="spec-val">{selectedProduct.stock} ex.</span>
                  </div>
                </div>

                {/* Auction bidding interaction */}
                {activeAuction ? (
                  <div className="bid-panel">
                    <h4 style={{ color: 'var(--primary-gold)', marginBottom: '10px' }}>🔨 {t('auctionDetails')}</h4>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-gray)', marginBottom: '10px' }}>
                      {t('minIncrement')}: <strong style={{ color: 'white' }}>{activeAuction.increment_min} MAD</strong>
                    </p>
                    {activeAuction.prix_reserve && (
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-gray)', marginBottom: '15px' }}>
                        {t('reservePrice')}: <strong style={{ color: 'white' }}>{activeAuction.prix_reserve} MAD</strong>
                      </p>
                    )}

                    {user && user.role === 'client' ? (
                      <form onSubmit={handlePlaceBid}>
                        <label className="form-label">{t('yourBid')} (MAD)</label>
                        <div className="bid-input-group">
                          <input 
                            type="number" 
                            className="form-input" 
                            style={{ width: '130px' }}
                            value={bidAmount}
                            onChange={(e) => setBidAmount(e.target.value)}
                            min={activeAuction.highestBid + activeAuction.increment_min}
                            required
                          />
                          <button type="submit" className="btn-gold" style={{ flexGrow: 1 }}>
                            {t('placeBid')}
                          </button>
                        </div>
                      </form>
                    ) : (
                      <p style={{ color: 'var(--primary-gold)', fontSize: '0.85rem' }}>Connectez-vous en mode client pour enchérir.</p>
                    )}
                  </div>
                ) : (
                  selectedProduct.stock > 0 ? (
                    user && user.role === 'client' ? (
                      <button className="btn-gold" style={{ width: '100%', marginBottom: '15px' }} onClick={() => { addToCart(selectedProduct); setSelectedProduct(null); }}>
                        🛒 {t('addToCart')}
                      </button>
                    ) : (
                      <p style={{ color: 'var(--primary-gold)', fontSize: '0.85rem', marginBottom: '15px' }}>Connectez-vous en mode client pour acheter.</p>
                    )
                  ) : (
                    <div style={{ color: 'var(--danger-red)', fontWeight: 'bold', marginBottom: '15px' }}>{t('outOfStock')}</div>
                  )
                )}

                {/* Direct merchant chat contact form */}
                {user && user.role === 'client' && (
                  <div style={{ marginTop: '20px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '20px' }}>
                    {!isContactingSeller ? (
                      <button className="btn-outline-gold" style={{ width: '100%' }} onClick={() => setIsContactingSeller(true)}>
                        💬 {t('contactMerchant')}
                      </button>
                    ) : (
                      <form onSubmit={handleContactSeller}>
                        <label className="form-label">{t('contactMerchant')}</label>
                        <textarea 
                          className="form-input" 
                          rows="3" 
                          value={sellerMessage}
                          onChange={(e) => setSellerMessage(e.target.value)}
                          placeholder="Posez votre question au vendeur..."
                          required
                        />
                        <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                          <button type="button" className="btn-outline-gold" style={{ padding: '6px 12px', fontSize: '0.8rem' }} onClick={() => setIsContactingSeller(false)}>
                            Annuler
                          </button>
                          <button type="submit" className="btn-gold" style={{ padding: '6px 12px', fontSize: '0.8rem', flexGrow: 1 }}>
                            {t('sendMessage')}
                          </button>
                        </div>
                      </form>
                    )}
                  </div>
                )}

                {/* Share Section */}
                <div style={{ marginTop: '20px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '20px' }}>
                  <h4 style={{ color: 'var(--primary-gold)', fontSize: '0.95rem', marginBottom: '12px', fontFamily: 'var(--font-serif)', letterSpacing: '0.5px' }}>
                    📢 {t('shareTitle')}
                  </h4>
                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    <a 
                      href={`https://api.whatsapp.com/send?text=${encodeURIComponent(`Découvrez ce magnifique bijou "${selectedProduct.titre}" sur ORIA - Fédération Marocaine de Bijouterie ! ${window.location.origin}/?product=${selectedProduct.id}`)}`} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="btn-outline-gold" 
                      style={{ 
                        flex: '1', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        gap: '8px', 
                        textDecoration: 'none', 
                        fontSize: '0.8rem', 
                        padding: '10px 15px',
                        borderColor: '#25d366',
                        color: '#25d366'
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(37, 211, 102, 0.1)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                    >
                      <span style={{ fontSize: '1rem' }}>🟢</span> {t('shareWhatsapp')}
                    </a>
                    
                    <a 
                      href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(`${window.location.origin}/?product=${selectedProduct.id}`)}`} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="btn-outline-gold" 
                      style={{ 
                        flex: '1', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        gap: '8px', 
                        textDecoration: 'none', 
                        fontSize: '0.8rem', 
                        padding: '10px 15px',
                        borderColor: '#1877f2',
                        color: '#1877f2'
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(24, 119, 242, 0.1)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                    >
                      <span style={{ fontSize: '1rem' }}>🔵</span> {t('shareFacebook')}
                    </a>

                    <button 
                      type="button"
                      onClick={() => handleCopyLink(selectedProduct.id)}
                      className="btn-outline-gold" 
                      style={{ 
                        flex: '1', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        gap: '8px', 
                        fontSize: '0.8rem', 
                        padding: '10px 15px',
                        cursor: 'pointer'
                      }}
                    >
                      <span style={{ fontSize: '1rem' }}>🔗</span> {isCopied ? t('linkCopied') : t('copyLink')}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Authentication Modal */}
      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)} 
        onAuthSuccess={(mode) => {
          addNotification(mode === 'login' ? 'Connexion réussie !' : 'Compte créé avec succès !', 'success');
        }} 
      />

      {/* Modern Luxury Footer */}
      <Footer onNavigate={setActiveView} user={user} />
    </div>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <CartProvider>
          <MainLayout />
        </CartProvider>
      </AuthProvider>
    </LanguageProvider>
  );
}
