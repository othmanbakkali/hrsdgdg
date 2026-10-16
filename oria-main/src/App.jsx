import React, { useState, useEffect } from 'react';
import { useLanguage, LanguageProvider } from './context/LanguageContext';
import { useAuth, AuthProvider } from './context/AuthContext';
import { useCart, CartProvider } from './context/CartContext';
import Marketplace from './views/Marketplace';
import ClientDashboard from './views/ClientDashboard';
import MerchantDashboard from './views/MerchantDashboard';
import OriaLogo from './components/OriaLogo';
import Footer from './components/Footer';
import AuthModal from './components/AuthModal';
import ProductDetailModal from './components/ProductDetailModal';
import JewelFinderWizard from './components/JewelFinderWizard';
import SellJewelModal from './components/SellJewelModal';
import ProductComparatorModal from './components/ProductComparatorModal';
import AIAssistantModal from './components/AIAssistantModal';
import GoldPriceHistoryModal from './components/GoldPriceHistoryModal';
import ChangePasswordModal from './components/ChangePasswordModal';
import PWAInstallBanner from './pwa/PWAInstallBanner';
import PWAInstallButton from './pwa/PWAInstallButton';

// Mobile-specific components
import MobileTopBar from './components/mobile/MobileTopBar';
import MobileBottomNav from './components/mobile/MobileBottomNav';
import MobileFilterSheet from './components/mobile/MobileFilterSheet';
import MobileCityPicker from './components/mobile/MobileCityPicker';
import MobileChatDrawer from './components/mobile/MobileChatDrawer';
import DeviceSimulatorToggle from './components/mobile/DeviceSimulatorToggle';

import { API_URL } from './config/api';
import './styles/theme.css';

function MainLayout() {
  const { t, lang, setLang, isRtl } = useLanguage();
  const { user, logout } = useAuth();

  // Theme State (Light background by default)
  const [theme, setTheme] = useState(() => localStorage.getItem('hrsdgdg-theme') || 'light');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    document.body.setAttribute('data-theme', theme);
    if (theme === 'light') {
      document.body.classList.add('light-theme');
      document.body.classList.remove('dark-theme');
    } else {
      document.body.classList.add('dark-theme');
      document.body.classList.remove('light-theme');
    }
    localStorage.setItem('hrsdgdg-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  };

  // Navigation State
  const [activeView, setActiveView] = useState('marketplace'); // 'marketplace', 'client-dashboard', 'merchant-dashboard'
  const [mobileNavTab, setMobileNavTab] = useState('home'); // 'home', 'explore', 'sell', 'messages', 'account'
  const [isMobileSimulator, setIsMobileSimulator] = useState(false);

  // Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [saleUniverse, setSaleUniverse] = useState('ALL'); // 'ALL', 'FIRST_HAND', 'SECOND_HAND'
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedMaterial, setSelectedMaterial] = useState('ALL');
  const [selectedCondition, setSelectedCondition] = useState('ALL');
  const [selectedStyle, setSelectedStyle] = useState('ALL');
  const [selectedOccasion, setSelectedOccasion] = useState('ALL');
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [dealsOnly, setDealsOnly] = useState(false);
  const [priceMax, setPriceMax] = useState(35000);
  const [sortBy, setSortBy] = useState('newest'); // 'newest' (default: recent to oldest), 'popular', 'price_asc', 'price_desc', 'rating'

  // Products Data
  const [allProducts, setAllProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);

  // Modals & Bottom Sheets State
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isFinderOpen, setIsFinderOpen] = useState(false);
  const [isSellModalOpen, setIsSellModalOpen] = useState(false);
  const [isComparatorOpen, setIsComparatorOpen] = useState(false);
  const [isAIOpen, setIsAIOpen] = useState(false);
  const [isGoldModalOpen, setIsGoldModalOpen] = useState(false);
  const [isCityPickerOpen, setIsCityPickerOpen] = useState(false);
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);
  const [isChatDrawerOpen, setIsChatDrawerOpen] = useState(false);
  const [chatTargetProduct, setChatTargetProduct] = useState(null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [isFirstLoginChange, setIsFirstLoginChange] = useState(false);

  // Automatically prompt user to change password upon first authentication
  useEffect(() => {
    if (user && (user.first_login === true || user.premier_login === true || user.doit_changer_mot_de_passe === true)) {
      setIsFirstLoginChange(true);
      setIsChangePasswordOpen(true);
    }
  }, [user]);

  // Comparator State
  const [comparedProductIds, setComparedProductIds] = useState([]);


  // Toast Notifications
  const [notifications, setNotifications] = useState([]);

  const addNotification = (message, type = 'info') => {
    const id = Math.random().toString(36).substr(2, 9);
    setNotifications(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 4000);
  };

  // Fetch all products & categories
  const fetchData = async () => {
    try {
      const res = await fetch(`${API_URL}/bijoux?status=Validated`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) setAllProducts(data);
      }

      const catRes = await fetch(`${API_URL}/categories`);
      if (catRes.ok) {
        const catData = await catRes.json();
        if (Array.isArray(catData)) setCategories(catData);
      }
    } catch (err) {
      console.error('Error fetching global data:', err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Compute active filters count for badge
  const activeFiltersCount = [
    selectedCity ? 1 : 0,
    saleUniverse !== 'ALL' ? 1 : 0,
    selectedCategory ? 1 : 0,
    selectedMaterial !== 'ALL' ? 1 : 0,
    selectedCondition !== 'ALL' ? 1 : 0,
    verifiedOnly ? 1 : 0,
    dealsOnly ? 1 : 0,
    priceMax < 35000 ? 1 : 0
  ].reduce((a, b) => a + b, 0);

  const resetAllFilters = () => {
    setSearchQuery('');
    setSelectedCity('');
    setSaleUniverse('ALL');
    setSelectedCategory('');
    setSelectedMaterial('ALL');
    setSelectedCondition('ALL');
    setSelectedStyle('ALL');
    setSelectedOccasion('ALL');
    setVerifiedOnly(false);
    setDealsOnly(false);
    setPriceMax(35000);
    setSortBy('popular');
  };

  const handleToggleCompare = (productId) => {
    setComparedProductIds(prev => {
      if (prev.includes(productId)) {
        addNotification("Bijou retiré du comparateur", "info");
        return prev.filter(id => id !== productId);
      } else {
        if (prev.length >= 4) {
          addNotification("Vous pouvez comparer jusqu'à 4 bijoux au maximum", "warning");
          return prev;
        }
        addNotification("Bijou ajouté au comparateur ⚖️", "success");
        return [...prev, productId];
      }
    });
  };

  const handleOpenChatWithSeller = (product) => {
    setChatTargetProduct(product);
    setIsChatDrawerOpen(true);
  };

  const comparedProducts = allProducts.filter(p => comparedProductIds.includes(p.id));

  // Handle Mobile Bottom Nav Tab Changes
  const handleMobileNavTabChange = (tab) => {
    setMobileNavTab(tab);
    if (tab === 'home') {
      setActiveView('marketplace');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (tab === 'explore') {
      setActiveView('marketplace');
      setIsFinderOpen(true);
    } else if (tab === 'sell') {
      setIsSellModalOpen(true);
    } else if (tab === 'account') {
      if (!user) {
        setIsAuthModalOpen(true);
      } else if (user.role === 'commercant') {
        setActiveView('merchant-dashboard');
      } else {
        setActiveView('client-dashboard');
      }
    }
  };

  // The Inner App Content
  const appContent = (
    <div className="main-app-wrapper" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Toast Notifications */}
      <div style={{ position: 'fixed', top: '20px', right: '20px', zIndex: 9999, display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {notifications.map(n => (
          <div 
            key={n.id}
            style={{
              padding: '12px 18px',
              background: n.type === 'success' ? '#10b981' : n.type === 'warning' ? '#f59e0b' : '#1e1e28',
              color: '#fff',
              borderRadius: '8px',
              fontWeight: 600,
              fontSize: '0.88rem',
              boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
              border: '1px solid rgba(255,255,255,0.2)',
              animation: 'slideLeft 0.3s ease'
            }}
          >
            {n.message}
          </div>
        ))}
      </div>

      {/* 1. MOBILE TOP BAR (Avito Style, Visible on Mobile or Simulator) */}
      <div className="show-on-mobile-only">
        <MobileTopBar 
          selectedCity={selectedCity}
          onOpenCityPicker={() => setIsCityPickerOpen(true)}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onClearSearch={() => setSearchQuery('')}
          onOpenFilterSheet={() => setIsFilterSheetOpen(true)}
          activeFiltersCount={activeFiltersCount}
          onOpenAI={() => setIsAIOpen(true)}
          onOpenSell={() => setIsSellModalOpen(true)}
          onOpenGoldModal={() => setIsGoldModalOpen(true)}
          saleUniverse={saleUniverse}
          onSelectUniverse={setSaleUniverse}
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
          dealsOnly={dealsOnly}
          onToggleDeals={() => setDealsOnly(!dealsOnly)}
          categories={categories}
          theme={theme}
          onToggleTheme={toggleTheme}
          user={user}
          onOpenAuth={() => setIsAuthModalOpen(true)}
          onOpenChangePassword={() => {
            setIsFirstLoginChange(false);
            setIsChangePasswordOpen(true);
          }}
          onLogout={logout}
          onNavigate={setActiveView}
        />
      </div>

      {/* 2. DESKTOP HEADER (Hidden on Mobile) */}
      <header className="jewelia-header hide-on-mobile">
        <div className="jewelia-header-top">
          {/* Logo */}
          <div 
            onClick={() => {
              setActiveView('marketplace');
              setSaleUniverse('ALL');
              setSelectedCategory('');
              setDealsOnly(false);
            }} 
            style={{ cursor: 'pointer', flexShrink: 0 }}
          >
            <OriaLogo size={32} showText={true} subtitle="PREMIÈRE & SECONDE MAIN" />
          </div>

          {/* Desktop Central Search Bar */}
          <div className="jewelia-search-wrapper">
            <span className="jewelia-search-icon">🔍</span>
            <input 
              type="text" 
              className="jewelia-search-input"
              placeholder={lang === 'ar' ? 'ابحث عن مجوهرات، خاتم، سوار، ذهب 18 قيراط...' : 'Rechercher un bijou, bague, bracelet, or 18k...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                style={{
                  position: 'absolute',
                  [lang === 'ar' ? 'left' : 'right']: '14px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  fontSize: '0.9rem'
                }}
              >
                ✕
              </button>
            )}
          </div>

          {/* Quick Actions */}
          <div className="jewelia-header-actions">
            {/* City Selector */}
            <button 
              onClick={() => setIsCityPickerOpen(true)}
              className="jewelia-action-btn"
              title={lang === 'ar' ? "اختر مدينة في المغرب" : "Sélectionner une ville"}
            >
              <span>📍</span>
              <span className="hide-tablet">{selectedCity || (lang === 'ar' ? 'كل المغرب' : 'Tout le Maroc')}</span>
              <span style={{ fontSize: '0.62rem', color: 'var(--primary-gold)' }}>▼</span>
            </button>
            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className="jewelia-action-btn"
              title={theme === 'light' ? (lang === 'ar' ? 'تفعيل الوضع الليلي' : 'Activer le Mode Nuit') : (lang === 'ar' ? 'تفعيل الوضع النهاري' : 'Activer le Fond Clair')}
              style={{
                borderColor: 'var(--border-gold)',
                color: 'var(--primary-gold)',
                background: theme === 'light' ? 'rgba(179, 135, 40, 0.08)' : 'rgba(255, 255, 255, 0.06)'
              }}
            >
              <span>{theme === 'light' ? '🌙' : '☀️'}</span>
              <span className="hide-mobile">{lang === 'ar' ? (theme === 'light' ? 'الوضع الليلي' : 'الوضع النهاري') : (theme === 'light' ? 'Mode Nuit' : 'Fond Clair')}</span>
            </button>

            <button 
              onClick={() => setIsFinderOpen(true)}
              className="jewelia-action-btn"
              title={lang === 'ar' ? "المساعد الذكي لاختيار مجوهراتك" : "Assistant intelligent pour trouver un bijou"}
            >
              <span>🔍</span>
              <span className="hide-mobile">{lang === 'ar' ? 'البحث الذكي' : 'Trouver mon bijou'}</span>
            </button>

            <button 
              onClick={() => setIsSellModalOpen(true)}
              className="jewelia-action-btn cta-sell"
            >
              <span>♻️</span>
              <span className="hide-mobile">{lang === 'ar' ? 'بيع مجوهراتي' : 'Vendre mon bijou'}</span>
            </button>

            <button 
              onClick={() => setIsAIOpen(true)}
              className="jewelia-action-btn"
              style={{ borderColor: 'var(--primary-gold)', color: 'var(--light-gold)' }}
            >
              <span>✨</span>
              <span className="hide-mobile">{lang === 'ar' ? 'المساعد الذكي' : 'Concierge IA'}</span>
            </button>

            {comparedProductIds.length > 0 && (
              <button 
                onClick={() => setIsComparatorOpen(true)}
                className="jewelia-action-btn"
                style={{ background: 'rgba(212, 175, 55, 0.2)', color: 'var(--light-gold)' }}
              >
                <span>⚖️</span>
                <span>({comparedProductIds.length})</span>
              </button>
            )}

            {/* PWA Install Button in Desktop Nav */}
            <PWAInstallButton variant="nav-item" />

            {/* Account / User Menu */}
            <div style={{ position: 'relative' }}>
              <button 
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="jewelia-action-btn"
              >
                <span>👤</span>
                <span className="hide-mobile">{user ? user.nom.split(' ')[0] : t('account')}</span>
              </button>

              {userMenuOpen && (
                <div 
                  style={{
                    position: 'absolute',
                    top: '44px',
                    right: 0,
                    width: '220px',
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border-gold)',
                    borderRadius: 'var(--radius-md)',
                    padding: '10px',
                    boxShadow: 'var(--shadow-card-hover)',
                    zIndex: 200,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px'
                  }}
                >
                  {user ? (
                    <>
                      <div style={{ padding: '8px 10px', borderBottom: '1px solid var(--border-subtle)', fontSize: '0.85rem' }}>
                        <strong style={{ color: 'var(--primary-gold)', display: 'block' }}>{user.nom}</strong>
                        <span style={{ color: 'var(--text-gray)', fontSize: '0.75rem' }}>{user.email}</span>
                      </div>

                      {user.role === 'admin' && (
                        <a 
                          href="/admin/" 
                          target="_blank" 
                          rel="noopener noreferrer"
                          onClick={() => setUserMenuOpen(false)}
                          style={{
                            padding: '8px 10px',
                            background: 'rgba(212, 175, 55, 0.15)',
                            border: '1px solid var(--primary-gold)',
                            color: 'var(--primary-gold)',
                            textAlign: lang === 'ar' ? 'right' : 'left',
                            borderRadius: '4px',
                            fontSize: '0.85rem',
                            fontWeight: 700,
                            textDecoration: 'none',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                          }}
                        >
                          <span>👑</span>
                          <span>{lang === 'ar' ? 'لوحة تحكم الإدارة' : 'Panneau d\'Administration'}</span>
                        </a>
                      )}

                      <button 
                        onClick={() => {
                          setActiveView('client-dashboard');
                          setUserMenuOpen(false);
                        }}
                        style={{ padding: '8px 10px', background: 'none', border: 'none', color: 'var(--text-white)', textAlign: lang === 'ar' ? 'right' : 'left', cursor: 'pointer', borderRadius: '4px', fontSize: '0.85rem' }}
                      >
                        📦 {lang === 'ar' ? 'فضاء الزبون' : 'Mon Espace Client'}
                      </button>

                      <button 
                        onClick={() => {
                          setActiveView('merchant-dashboard');
                          setUserMenuOpen(false);
                        }}
                        style={{ padding: '8px 10px', background: 'none', border: 'none', color: 'var(--primary-gold)', textAlign: lang === 'ar' ? 'right' : 'left', cursor: 'pointer', borderRadius: '4px', fontSize: '0.85rem', fontWeight: 600 }}
                      >
                        🏪 {lang === 'ar' ? 'فضاء التاجر والمتجر' : 'Espace Vendeur & Boutique'}
                      </button>

                      <button 
                        onClick={() => {
                          setIsFirstLoginChange(false);
                          setIsChangePasswordOpen(true);
                          setUserMenuOpen(false);
                        }}
                        style={{ padding: '8px 10px', background: 'none', border: 'none', color: 'var(--text-white)', textAlign: lang === 'ar' ? 'right' : 'left', cursor: 'pointer', borderRadius: '4px', fontSize: '0.85rem' }}
                      >
                        🔑 {lang === 'ar' ? 'تغيير كلمة المرور' : 'Changer de mot de passe'}
                      </button>

                      <button 
                        onClick={() => {
                          logout();
                          setUserMenuOpen(false);
                        }}
                        style={{ padding: '8px 10px', background: 'none', border: 'none', color: '#ef4444', textAlign: lang === 'ar' ? 'right' : 'left', cursor: 'pointer', borderRadius: '4px', fontSize: '0.85rem', borderTop: '1px solid var(--border-subtle)' }}
                      >
                        {lang === 'ar' ? 'تسجيل الخروج' : 'Se déconnecter'}
                      </button>
                    </>
                  ) : (
                    <button 
                      onClick={() => {
                        setIsAuthModalOpen(true);
                        setUserMenuOpen(false);
                      }}
                      className="btn-jewelia-primary"
                      style={{ padding: '8px', width: '100%', fontSize: '0.85rem' }}
                    >
                      {lang === 'ar' ? 'تسجيل الدخول / حساب جديد' : 'Se connecter / S\'inscrire'}
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Language Switcher (Arabic and French only) */}
            <div style={{ display: 'flex', gap: '4px', marginLeft: '6px' }}>
              {['ar', 'fr'].map(l => (
                <button
                  key={l}
                  onClick={() => setLang(l)}
                  style={{
                    padding: '4px 8px',
                    borderRadius: '4px',
                    background: lang === l ? 'var(--primary-gold)' : 'rgba(255, 255, 255, 0.05)',
                    color: lang === l ? '#08080a' : 'var(--text-gray)',
                    border: 'none',
                    fontSize: '0.72rem',
                    fontWeight: 800,
                    cursor: 'pointer'
                  }}
                >
                  {l === 'ar' ? 'العربية 🇲🇦' : 'FR 🇫🇷'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Navigation Bar */}
        <div className="jewelia-nav-bar">
          <nav className="jewelia-nav-container">
            <button 
              className={`jewelia-nav-link ${activeView === 'marketplace' && saleUniverse === 'ALL' && !dealsOnly ? 'active' : ''}`}
              onClick={() => {
                setActiveView('marketplace');
                setSaleUniverse('ALL');
                setSelectedCategory('');
                setDealsOnly(false);
              }}
            >
              {t('home')}
            </button>

            <button 
              className={`jewelia-nav-link ${saleUniverse === 'FIRST_HAND' ? 'active' : ''}`}
              onClick={() => {
                setActiveView('marketplace');
                setSaleUniverse('FIRST_HAND');
                setDealsOnly(false);
              }}
            >
              <span>{t('firstHand')}</span>
              <span className="jewelia-nav-badge first">{lang === 'ar' ? 'جديد' : 'Neuf'}</span>
            </button>

            <button 
              className={`jewelia-nav-link ${saleUniverse === 'SECOND_HAND' ? 'active' : ''}`}
              onClick={() => {
                setActiveView('marketplace');
                setSaleUniverse('SECOND_HAND');
                setDealsOnly(false);
              }}
            >
              <span>{t('secondHand')}</span>
              <span className="jewelia-nav-badge second">{lang === 'ar' ? 'مستعمل' : 'Occasion'}</span>
            </button>

            <button 
              className={`jewelia-nav-link ${saleUniverse === 'AUCTION' ? 'active' : ''}`}
              onClick={() => {
                setActiveView('marketplace');
                setSaleUniverse('AUCTION');
                setDealsOnly(false);
              }}
            >
              <span>{lang === 'ar' ? '🔨 المزادات' : '🔨 Enchères'}</span>
              <span className="jewelia-nav-badge first" style={{ background: '#ef4444', color: '#fff' }}>{lang === 'ar' ? 'مباشر' : 'En Direct'}</span>
            </button>

            <button 
              className={`jewelia-nav-link ${dealsOnly ? 'active' : ''}`}
              onClick={() => {
                setActiveView('marketplace');
                setDealsOnly(true);
              }}
            >
              {t('deals')}
            </button>

            <button 
              className="jewelia-nav-link"
              onClick={() => setIsGoldModalOpen(true)}
              title={lang === 'ar' ? 'سعر الذهب اليوم ومباشر وسجل التغييرات' : 'Cours officiel de l\'or et historique'}
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <span>🥇 {lang === 'ar' ? 'سعر الذهب' : 'Cours de l\'Or'}</span>
              <span className="jewelia-nav-badge first" style={{ background: 'rgba(212, 175, 55, 0.25)', color: 'var(--primary-gold)', border: '1px solid rgba(212, 175, 55, 0.4)' }}>
                {lang === 'ar' ? 'سجل الأسعار 📈' : 'Historique 📈'}
              </span>
            </button>

            <button 
              className="jewelia-nav-link"
              onClick={() => setIsFinderOpen(true)}
            >
              {t('findJewel')}
            </button>

            <button 
              className="jewelia-nav-link"
              onClick={() => setIsSellModalOpen(true)}
            >
              {t('sellJewel')}
            </button>

            <button 
              className={`jewelia-nav-link ${activeView === 'client-dashboard' ? 'active' : ''}`}
              onClick={() => setActiveView('client-dashboard')}
            >
              👤 {lang === 'ar' ? 'فضاء الزبون' : 'Espace Client'}
            </button>

            <button 
              className={`jewelia-nav-link ${activeView === 'merchant-dashboard' ? 'active' : ''}`}
              onClick={() => setActiveView('merchant-dashboard')}
            >
              🏪 {lang === 'ar' ? 'فضاء التاجر' : 'Espace Vendeur'}
            </button>
          </nav>
        </div>
      </header>

      {/* VIEW ROUTING */}
      <div style={{ flex: 1 }}>
        {activeView === 'marketplace' && (
          <Marketplace 
            onSelectProduct={(p) => setSelectedProduct(p)}
            onOpenFinder={() => setIsFinderOpen(true)}
            onOpenSellModal={() => setIsSellModalOpen(true)}
            onOpenAIModal={() => setIsAIOpen(true)}
            onOpenComparator={() => setIsComparatorOpen(true)}
            onOpenGoldModal={() => setIsGoldModalOpen(true)}
            comparedProductIds={comparedProductIds}
            onToggleCompare={handleToggleCompare}
            initialUniverse={saleUniverse}
            initialCategory={selectedCategory}
            initialDealsOnly={dealsOnly}
            selectedCity={selectedCity}
            onOpenCityPicker={() => setIsCityPickerOpen(true)}
            onOpenFilterSheet={() => setIsFilterSheetOpen(true)}
            onOpenChatWithSeller={handleOpenChatWithSeller}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            saleUniverse={saleUniverse}
            setSaleUniverse={setSaleUniverse}
            selectedCategory={selectedCategory}
            setSelectedCategory={setSelectedCategory}
            selectedMaterial={selectedMaterial}
            setSelectedMaterial={setSelectedMaterial}
            selectedCondition={selectedCondition}
            setSelectedCondition={setSelectedCondition}
            selectedStyle={selectedStyle}
            setSelectedStyle={setSelectedStyle}
            selectedOccasion={selectedOccasion}
            setSelectedOccasion={setSelectedOccasion}
            verifiedOnly={verifiedOnly}
            setVerifiedOnly={setVerifiedOnly}
            dealsOnly={dealsOnly}
            setDealsOnly={setDealsOnly}
            priceMax={priceMax}
            setPriceMax={setPriceMax}
            sortBy={sortBy}
            setSortBy={setSortBy}
            resetAllFilters={resetAllFilters}
          />
        )}

        {activeView === 'client-dashboard' && (
          <ClientDashboard 
            onSelectProduct={(p) => setSelectedProduct(p)}
            onOpenSellModal={() => setIsSellModalOpen(true)}
            onOpenChangePassword={() => {
              setIsFirstLoginChange(false);
              setIsChangePasswordOpen(true);
            }}
          />
        )}

        {activeView === 'merchant-dashboard' && (
          <MerchantDashboard 
            onOpenSellModal={() => setIsSellModalOpen(true)}
            onOpenChangePassword={() => {
              setIsFirstLoginChange(false);
              setIsChangePasswordOpen(true);
            }}
          />
        )}
      </div>

      {/* FOOTER (Desktop only) */}
      <div className="hide-on-mobile">
        <Footer 
          onOpenFinder={() => setIsFinderOpen(true)}
          onOpenSellModal={() => setIsSellModalOpen(true)}
        />
      </div>

      {/* 3. MOBILE BOTTOM NAVIGATION BAR (Fixed at bottom) */}
      <div className="show-on-mobile-only">
        <MobileBottomNav 
          activeTab={mobileNavTab}
          onChangeTab={handleMobileNavTabChange}
          onOpenSell={() => setIsSellModalOpen(true)}
          onOpenFinder={() => setIsFinderOpen(true)}
        />
      </div>

      {/* 4. MODALS & BOTTOM SHEETS */}
      
      {/* Mobile City Picker */}
      <MobileCityPicker 
        isOpen={isCityPickerOpen}
        onClose={() => setIsCityPickerOpen(false)}
        selectedCity={selectedCity}
        onSelectCity={setSelectedCity}
      />

      {/* Mobile Filter Sheet */}
      <MobileFilterSheet 
        isOpen={isFilterSheetOpen}
        onClose={() => setIsFilterSheetOpen(false)}
        saleUniverse={saleUniverse}
        onSelectUniverse={setSaleUniverse}
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
        categories={categories}
        selectedMaterial={selectedMaterial}
        onSelectMaterial={setSelectedMaterial}
        selectedCondition={selectedCondition}
        onSelectCondition={setSelectedCondition}
        selectedStyle={selectedStyle}
        onSelectStyle={setSelectedStyle}
        verifiedOnly={verifiedOnly}
        onToggleVerified={setVerifiedOnly}
        dealsOnly={dealsOnly}
        onToggleDeals={setDealsOnly}
        priceMax={priceMax}
        onChangePriceMax={setPriceMax}
        sortBy={sortBy}
        onChangeSortBy={setSortBy}
        selectedCity={selectedCity}
        onSelectCity={setSelectedCity}
        onOpenCityPicker={() => {
          setIsFilterSheetOpen(false);
          setIsCityPickerOpen(true);
        }}
        onResetFilters={resetAllFilters}
        totalResultsCount={allProducts.length}
      />

      {/* Mobile Chat Drawer */}
      <MobileChatDrawer 
        isOpen={isChatDrawerOpen}
        onClose={() => {
          setIsChatDrawerOpen(false);
          setChatTargetProduct(null);
        }}
        targetProduct={chatTargetProduct}
      />



      {/* Global Modals */}
      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)} 
        onAuthSuccess={(type, loggedUser) => {
          if (loggedUser && (loggedUser.first_login || loggedUser.premier_login || loggedUser.doit_changer_mot_de_passe)) {
            setIsFirstLoginChange(true);
            setIsChangePasswordOpen(true);
          }
        }}
      />
      <ChangePasswordModal 
        isOpen={isChangePasswordOpen}
        onClose={() => setIsChangePasswordOpen(false)}
        isFirstLogin={isFirstLoginChange}
      />
      <JewelFinderWizard 
        isOpen={isFinderOpen} 
        onClose={() => setIsFinderOpen(false)} 
        onSelectProduct={(p) => setSelectedProduct(p)}
      />
      <SellJewelModal 
        isOpen={isSellModalOpen} 
        onClose={() => setIsSellModalOpen(false)} 
        onProductPublished={() => fetchData()}
      />
      <AIAssistantModal 
        isOpen={isAIOpen} 
        onClose={() => setIsAIOpen(false)} 
        onSelectProduct={(p) => setSelectedProduct(p)}
      />
      <GoldPriceHistoryModal 
        isOpen={isGoldModalOpen}
        onClose={() => setIsGoldModalOpen(false)}
        onOpenSellModal={() => setIsSellModalOpen(true)}
      />
      <ProductComparatorModal 
        isOpen={isComparatorOpen} 
        onClose={() => setIsComparatorOpen(false)} 
        comparedProducts={comparedProducts}
        onRemoveProduct={(id) => handleToggleCompare(id)}
      />
      <ProductDetailModal 
        isOpen={Boolean(selectedProduct)}
        product={selectedProduct} 
        onClose={() => setSelectedProduct(null)} 
        onToggleCompare={handleToggleCompare}
        isCompared={selectedProduct ? comparedProductIds.includes(selectedProduct.id) : false}
        onOpenChatWithSeller={() => {
          const target = selectedProduct;
          setSelectedProduct(null);
          handleOpenChatWithSeller(target);
        }}
      />
      {/* PWA Install Banner & Offline / Update notifications */}
      <PWAInstallBanner />
    </div>
  );

  return (
    <>
      {/* Floating Device Simulator Toggle on Desktop */}
      <DeviceSimulatorToggle 
        isMobileSimulator={isMobileSimulator}
        onToggleSimulator={setIsMobileSimulator}
      />

      {/* RENDER IN PHONE FRAME OR STANDARD VIEWPORT */}
      {isMobileSimulator ? (
        <div className="desktop-device-simulator-canvas">
          <div className="iphone-15-frame">
            {/* Dynamic Island / Speaker */}
            <div className="iphone-dynamic-island">
              <div className="island-camera" />
              <div className="island-sensor" />
            </div>

            {/* iOS Status Bar */}
            <div className="iphone-status-bar">
              <span className="status-time">9:41</span>
              <div className="status-icons">
                <span>5G</span>
                <span>📶</span>
                <span>🔋 100%</span>
              </div>
            </div>

            {/* Scrollable Mobile Screen Body */}
            <div className="iphone-screen-content">
              {appContent}
            </div>

            {/* Home Indicator Bar */}
            <div className="iphone-home-bar" />
          </div>
        </div>
      ) : (
        appContent
      )}
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <LanguageProvider>
        <CartProvider>
          <MainLayout />
        </CartProvider>
      </LanguageProvider>
    </AuthProvider>
  );
}
