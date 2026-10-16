import React, { useState, useEffect } from 'react';
import OriaLogo from '../OriaLogo';
import MobileMenuDrawer from './MobileMenuDrawer';
import { useLanguage } from '../../context/LanguageContext';
import { API_URL } from '../../config/api';

export default function MobileTopBar({
  selectedCity,
  onOpenCityPicker,
  searchQuery,
  onSearchChange,
  onClearSearch,
  onOpenFilterSheet,
  activeFiltersCount = 0,
  onOpenCart,
  cartCount = 0,
  onOpenChat,
  onOpenAI,
  onOpenGoldModal,
  saleUniverse,
  onSelectUniverse,
  selectedCategory,
  onSelectCategory,
  dealsOnly,
  onToggleDeals,
  categories = [],
  onOpenSell,
  theme = 'light',
  onToggleTheme,
  user,
  onOpenAuth,
  onLogout,
  onNavigate
}) {
  const { lang, t } = useLanguage();
  const isAr = lang === 'ar';

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [goldRate, setGoldRate] = useState({
    price18k: 1045,
    change: '+0.7%'
  });

  // Sticky header scroll detection
  useEffect(() => {
    const handleScroll = () => {
      const scrollPos = window.scrollY;
      setIsScrolled(scrollPos > 30);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Fetch live gold rates
  useEffect(() => {
    const fetchGoldPrice = () => {
      fetch(`${API_URL}/gold-rates`)
        .then(res => res.json())
        .then(data => {
          if (data && data.success && data.currentPrice18k) {
            setGoldRate({
              price18k: data.currentPrice18k,
              change: (data.history && data.history.length > 0 && data.history[data.history.length - 1].change) || '+0.7%'
            });
          }
        })
        .catch(() => {});
    };
    fetchGoldPrice();
    const interval = setInterval(fetchGoldPrice, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      <header className={`mobile-premium-header ${isScrolled ? 'is-scrolled' : ''}`} dir={isAr ? 'rtl' : 'ltr'}>
        {/* 1. Main Navigation Bar: Hamburger ☰ | Logo | Quick Actions 🛒 💬 ✨ */}
        <div className="mobile-main-bar">
          {/* Hamburger Menu Button (Right side in RTL) */}
          <button 
            className="mobile-hamburger-btn"
            onClick={() => setIsMenuOpen(true)}
            aria-label={isAr ? "فتح القائمة الرئيسية" : "Ouvrir le menu"}
            title={isAr ? "القائمة الرئيسية والفئات" : "Menu principal et catégories"}
          >
            <span className="hamburger-icon-bar">☰</span>
          </button>

          {/* Centered Brand Logo */}
          <div 
            className="mobile-brand-center"
            onClick={() => {
              if (onNavigate) onNavigate('marketplace');
              onSelectUniverse('ALL');
              onSelectCategory('');
              if (dealsOnly) onToggleDeals();
            }}
            role="button"
            tabIndex={0}
          >
            <OriaLogo size={isScrolled ? 20 : 23} showText={true} />
          </div>

          {/* Quick Action Buttons (Left side in RTL) */}
          <div className="mobile-actions-group">
            {/* AI Concierge */}
            <button 
              className="mobile-action-circle ai-btn"
              onClick={onOpenAI}
              title={isAr ? "المساعد الذكي للجوهرجي" : "Concierge IA"}
            >
              <span>✨</span>
            </button>
          </div>
        </div>

        {/* 2. Search Bar Row (Full Width, Accessible & Sticky) */}
        <div className="mobile-search-section">
          <div className="mobile-search-box">
            <span className="search-symbol">🔍</span>
            <input 
              type="text"
              className="mobile-search-field"
              placeholder={isAr ? "ابحث عن مجوهرات، خاتم، سوار..." : "Rechercher un bijou, bague, bracelet..."}
              value={searchQuery}
              onChange={e => onSearchChange(e.target.value)}
              aria-label={isAr ? "البحث في المجوهرات" : "Recherche"}
            />
            {searchQuery ? (
              <button 
                className="search-reset-btn" 
                onClick={onClearSearch}
                aria-label={isAr ? "مسح البحث" : "Effacer"}
              >
                ✕
              </button>
            ) : (
              <button 
                className="search-camera-btn" 
                onClick={onOpenSell}
                title={isAr ? "البحث بالصورة / بيع مجوهراتي" : "Recherche photo / Vendre"}
                type="button"
              >
                📸
              </button>
            )}
          </div>

          {/* Filter Trigger Button */}
          <button 
            className={`mobile-filter-btn ${activeFiltersCount > 0 ? 'active' : ''}`}
            onClick={onOpenFilterSheet}
            title={isAr ? "تصفية المنتجات" : "Filtrer"}
          >
            <span className="filter-icon">⚡</span>
            <span className="filter-title">{isAr ? 'فلاتر' : 'Filtres'}</span>
            {activeFiltersCount > 0 && (
              <span className="filter-counter">{activeFiltersCount}</span>
            )}
          </button>
        </div>

        {/* 3. Quick Search Chips Strip */}
        <div style={{
          display: 'flex',
          gap: '6px',
          overflowX: 'auto',
          padding: '4px 12px 8px',
          scrollbarWidth: 'none',
          WebkitOverflowScrolling: 'touch'
        }}>
          {(isAr ? [
            { label: '💍 خواتم', q: 'خاتم' },
            { label: '👑 أساور', q: 'سوار' },
            { label: '📿 سلاسل', q: 'سلسلة' },
            { label: '✨ ذهب 18K', q: '18k' },
            { label: '💎 ألماس', q: 'الماس' },
            { label: '🔨 مزادات', q: 'مزاد' },
            { label: '🔥 هميزات', q: 'همزة' }
          ] : [
            { label: '💍 Bagues', q: 'bague' },
            { label: '👑 Bracelets', q: 'bracelet' },
            { label: '📿 Colliers', q: 'collier' },
            { label: '✨ Or 18K', q: '18k' },
            { label: '💎 Diamants', q: 'diamant' },
            { label: '🔨 Enchères', q: 'enchere' },
            { label: '🔥 Affaires', q: 'remise' }
          ]).map((chip, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => onSearchChange(chip.q)}
              style={{
                background: searchQuery === chip.q ? 'var(--primary-gold)' : 'rgba(212, 175, 55, 0.08)',
                color: searchQuery === chip.q ? '#000' : 'var(--text-dark)',
                border: '1px solid rgba(212, 175, 55, 0.28)',
                borderRadius: '16px',
                padding: '3px 10px',
                fontSize: '0.74rem',
                fontWeight: 700,
                whiteSpace: 'nowrap',
                cursor: 'pointer',
                flexShrink: 0
              }}
            >
              {chip.label}
            </button>
          ))}
          {searchQuery && (
            <button
              type="button"
              onClick={onClearSearch}
              style={{
                background: '#ef4444',
                color: '#fff',
                border: 'none',
                borderRadius: '16px',
                padding: '3px 9px',
                fontSize: '0.72rem',
                fontWeight: 700,
                whiteSpace: 'nowrap',
                cursor: 'pointer',
                flexShrink: 0
              }}
            >
              ✕
            </button>
          )}
        </div>
      </header>

      {/* 5. Mobile RTL Drawer / Sliding Menu */}
      <MobileMenuDrawer 
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        saleUniverse={saleUniverse}
        onSelectUniverse={onSelectUniverse}
        selectedCategory={selectedCategory}
        onSelectCategory={onSelectCategory}
        dealsOnly={dealsOnly}
        onToggleDeals={onToggleDeals}
        categories={categories}
        selectedCity={selectedCity}
        onOpenCityPicker={onOpenCityPicker}
        onOpenCart={onOpenCart}
        cartCount={cartCount}
        onOpenChat={onOpenChat}
        onOpenAI={onOpenAI}
        onOpenSell={onOpenSell}
        onOpenGoldModal={onOpenGoldModal}
        goldRate={goldRate}
        theme={theme}
        onToggleTheme={onToggleTheme}
        user={user}
        onOpenAuth={onOpenAuth}
        onLogout={onLogout}
        onNavigate={onNavigate}
      />
    </>
  );
}
