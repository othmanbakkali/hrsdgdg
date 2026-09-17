import React from 'react';
import OriaLogo from '../OriaLogo';

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
  saleUniverse,
  onSelectUniverse,
  selectedCategory,
  onSelectCategory,
  dealsOnly,
  onToggleDeals,
  categories = [],
  onOpenSell,
  theme = 'light',
  onToggleTheme
}) {
  const storyBubbles = [
    { 
      id: '', 
      name: 'Tout', 
      icon: '💎', 
      image: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=150&auto=format&fit=crop&q=80',
      badge: 'Feed'
    },
    { 
      id: 'cat_rings', 
      name: 'Bagues', 
      icon: '💍', 
      image: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=150&auto=format&fit=crop&q=80',
      badge: 'Populaire'
    },
    { 
      id: 'cat_necklaces', 
      name: 'Colliers', 
      icon: '📿', 
      image: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=150&auto=format&fit=crop&q=80' 
    },
    { 
      id: 'cat_bracelets', 
      name: 'Bracelets', 
      icon: '👑', 
      image: 'https://images.unsplash.com/photo-1599643477877-530eb83abc8e?w=150&auto=format&fit=crop&q=80' 
    },
    { 
      id: 'cat_earrings', 
      name: 'Boucles', 
      icon: '✨', 
      image: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=150&auto=format&fit=crop&q=80' 
    },
    { 
      id: 'cat_watches', 
      name: 'Montres', 
      icon: '⌚', 
      image: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=150&auto=format&fit=crop&q=80',
      badge: 'Luxe'
    },
    { 
      id: 'gold18k', 
      name: 'Or 18K', 
      icon: '🥇', 
      image: 'https://images.unsplash.com/photo-1603561591411-07134e71a2a9?w=150&auto=format&fit=crop&q=80',
      isFilter: 'Or',
      badge: 'Certifié'
    },
    { 
      id: 'deals', 
      name: 'Remises %', 
      icon: '🔥', 
      image: 'https://images.unsplash.com/photo-1598560917505-59a3ad559071?w=150&auto=format&fit=crop&q=80',
      isDeals: true,
      badge: '-40%'
    },
    { 
      id: 'secondHand', 
      name: 'Occasions', 
      icon: '♻️', 
      image: 'https://images.unsplash.com/photo-1603561591411-07134e71a2a9?w=150&auto=format&fit=crop&q=80',
      isUniverse: 'SECOND_HAND',
      badge: 'Expertisé'
    },
    { 
      id: 'auctions', 
      name: 'Enchères', 
      icon: '🔨', 
      image: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=150&auto=format&fit=crop&q=80',
      isUniverse: 'AUCTION',
      badge: 'En Direct'
    }
  ];

  return (
    <div className="mobile-avito-header">
      {/* 1. Live Gold Micro-Ticker Bar */}
      <div className="mobile-gold-live-ticker">
        <div className="gold-ticker-content">
          <span className="gold-pulse-indicator" />
          <span className="ticker-text">
            <strong>Or 18K (750‰)</strong> : 688,50 DH/g <small className="ticker-up">+0.45%</small> • 🇲🇦 <strong>Poinçon d'État Garanti</strong>
          </span>
        </div>
      </div>

      {/* 2. Top Row: Location, Brand & Fast Actions */}
      <div className="mobile-header-top-row">
        {/* City Selector Button with Moroccan Flag */}
        <button 
          className="mobile-city-selector-btn"
          onClick={onOpenCityPicker}
          title="Sélectionner une ville au Maroc"
        >
          <span className="city-flag">📍</span>
          <span className="city-current-name">
            {selectedCity || 'Tout le Maroc'}
          </span>
          <span className="city-chevron">▼</span>
        </button>

        {/* Brand Center */}
        <div className="mobile-brand-wrapper">
          <OriaLogo size={22} showText={true} />
        </div>

        {/* Top Right Actions */}
        <div className="mobile-top-actions">
          <button 
            className="mobile-icon-btn theme-btn" 
            onClick={onToggleTheme}
            title={theme === 'light' ? 'Mode Nuit' : 'Fond Clair'}
          >
            <span>{theme === 'light' ? '🌙' : '☀️'}</span>
          </button>

          <button 
            className="mobile-icon-btn ai-btn" 
            onClick={onOpenAI}
            title="Concierge IA Joaillerie"
          >
            <span>✨</span>
          </button>

          <button 
            className="mobile-icon-btn chat-btn" 
            onClick={onOpenChat}
            title="Messagerie & Offres"
          >
            <span>💬</span>
            <span className="mobile-badge-dot" />
          </button>

          <button 
            className="mobile-icon-btn cart-btn" 
            onClick={onOpenCart}
            title="Mon Panier"
          >
            <span>🛒</span>
            {cartCount > 0 && (
              <span className="mobile-badge-count">{cartCount}</span>
            )}
          </button>
        </div>
      </div>

      {/* 3. Search Bar & Filter Trigger */}
      <div className="mobile-search-row">
        <div className="mobile-search-bar">
          <span className="mobile-search-icon">🔍</span>
          <input 
            type="text"
            placeholder="Rechercher un bijou (ex: Solitaire 18k...)"
            value={searchQuery}
            onChange={e => onSearchChange(e.target.value)}
            className="mobile-search-input"
          />
          {searchQuery ? (
            <button className="mobile-search-clear-btn" onClick={onClearSearch}>
              ✕
            </button>
          ) : (
            <div className="mobile-search-tools">
              <span className="search-camera-icon" onClick={onOpenSell} title="Recherche par photo / Vendre">📸</span>
            </div>
          )}
        </div>

        <button 
          className={`mobile-filter-trigger-btn ${activeFiltersCount > 0 ? 'has-active' : ''}`}
          onClick={onOpenFilterSheet}
          title="Filtres avancés"
        >
          <span className="filter-slider-icon">⚡</span>
          <span className="filter-text">Filtres</span>
          {activeFiltersCount > 0 && (
            <span className="filter-badge-count">{activeFiltersCount}</span>
          )}
        </button>
      </div>

      {/* 4. Avito Story Categories Carousel with Photos & Badges */}
      <div className="mobile-stories-carousel">
        {storyBubbles.map((bubble) => {
          let isActive = false;
          if (bubble.isDeals) isActive = dealsOnly;
          else if (bubble.isUniverse) isActive = saleUniverse === bubble.isUniverse;
          else if (bubble.id === '' && !selectedCategory && !dealsOnly && saleUniverse === 'ALL') isActive = true;
          else if (selectedCategory === bubble.id) isActive = true;

          return (
            <div 
              key={bubble.id + bubble.name}
              className={`mobile-story-item ${isActive ? 'active' : ''}`}
              onClick={() => {
                if (bubble.isDeals) {
                  onToggleDeals();
                } else if (bubble.isUniverse) {
                  onSelectUniverse(bubble.isUniverse);
                } else {
                  onSelectCategory(bubble.id);
                }
              }}
            >
              <div className="story-circle-ring">
                <div className="story-circle-inner">
                  <img src={bubble.image} alt={bubble.name} className="story-thumb-img" />
                  <div className="story-emoji-overlay">{bubble.icon}</div>
                </div>
              </div>
              <span className="story-label">{bubble.name}</span>
              {bubble.badge && (
                <span className={`story-mini-badge ${bubble.isDeals ? 'deal' : ''}`}>
                  {bubble.badge}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* 5. Avito Universe Segmented Control */}
      <div className="mobile-universe-segmented-bar">
        <button 
          className={`universe-tab ${saleUniverse === 'ALL' && !dealsOnly ? 'active' : ''}`}
          onClick={() => {
            onSelectUniverse('ALL');
          }}
        >
          💎 Tout
        </button>

        <button 
          className={`universe-tab ${saleUniverse === 'FIRST_HAND' && !dealsOnly ? 'active' : ''}`}
          onClick={() => {
            onSelectUniverse('FIRST_HAND');
          }}
        >
          ✨ Neuf
        </button>

        <button 
          className={`universe-tab ${saleUniverse === 'SECOND_HAND' && !dealsOnly ? 'active second' : ''}`}
          onClick={() => {
            onSelectUniverse('SECOND_HAND');
          }}
        >
          ♻️ Occasion
        </button>

        <button 
          className={`universe-tab ${saleUniverse === 'AUCTION' && !dealsOnly ? 'active' : ''}`}
          style={saleUniverse === 'AUCTION' ? { background: '#ef4444', color: '#ffffff', borderColor: '#ef4444' } : {}}
          onClick={() => {
            onSelectUniverse('AUCTION');
          }}
        >
          🔨 Enchères
        </button>

        <button 
          className={`universe-tab ${dealsOnly ? 'active deals' : ''}`}
          onClick={() => {
            onToggleDeals();
          }}
        >
          🔥 Bonnes Affaires
        </button>
      </div>
    </div>
  );
}
