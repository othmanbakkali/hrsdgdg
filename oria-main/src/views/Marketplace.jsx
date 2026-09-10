import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { API_URL } from '../config/api';

export default function Marketplace({ onSelectProduct }) {
  const { t, lang, isRtl } = useLanguage();
  const { user, toggleFavorite } = useAuth();
  const { addToCart } = useCart();

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [auctions, setAuctions] = useState([]);
  
  // Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });
  const [weightRange, setWeightRange] = useState({ min: '', max: '' });
  const [selectedPurity, setSelectedPurity] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [saleType, setSaleType] = useState('all'); // 'all', 'direct', 'auction'

  const [cities, setCities] = useState([]);

  // Fetch categories, products, auctions
  const fetchData = async () => {
    try {
      // Products
      let url = `${API_URL}/bijoux?status=Validated`;
      const res = await fetch(url);
      const data = await res.json();
      setProducts(data);

      // Unique Cities for filters
      const uniqueCities = [...new Set(data.map(item => item.city))];
      setCities(uniqueCities);

      // Categories
      const catRes = await fetch(`${API_URL}/categories`);
      const catData = await catRes.json();
      setCategories(catData);

      // Auctions
      const aucRes = await fetch(`${API_URL}/encheres`);
      const aucData = await aucRes.json();
      setAuctions(aucData);
    } catch (error) {
      console.error('Error fetching marketplace data:', error);
    }
  };

  useEffect(() => {
    fetchData();
    // Poll every 3 seconds for live bids/updates
    const interval = setInterval(fetchData, 3000);
    return () => clearInterval(interval);
  }, []);

  // Filter products locally
  const filteredProducts = products.filter(product => {
    // Search query
    if (searchQuery && !product.titre.toLowerCase().includes(searchQuery.toLowerCase()) && !product.description.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    // Category
    if (selectedCategory && product.category_id !== selectedCategory) {
      return false;
    }
    // Price
    if (priceRange.min && product.prix < parseFloat(priceRange.min)) {
      return false;
    }
    if (priceRange.max && product.prix > parseFloat(priceRange.max)) {
      return false;
    }
    // Weight
    if (weightRange.min && product.gramme < parseFloat(weightRange.min)) {
      return false;
    }
    if (weightRange.max && product.gramme > parseFloat(weightRange.max)) {
      return false;
    }
    // Purity
    if (selectedPurity && product.purete !== selectedPurity) {
      return false;
    }
    // City
    if (selectedCity && product.city.toLowerCase() !== selectedCity.toLowerCase()) {
      return false;
    }
    // Sale Type (direct vs auction)
    const linkedAuction = auctions.find(a => a.bijou_id === product.id && a.statut === 'Active');
    if (saleType === 'direct' && linkedAuction) return false;
    if (saleType === 'auction' && !linkedAuction) return false;

    return true;
  });

  // Helper for countdown timer
  const AuctionTimer = ({ endDate, auctionId }) => {
    const [timeLeft, setTimeLeft] = useState('');

    useEffect(() => {
      const updateTimer = () => {
        const diff = new Date(endDate) - new Date();
        if (diff <= 0) {
          setTimeLeft('Terminé');
          return;
        }
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const secs = Math.floor((diff % (1000 * 60)) / 1000);
        setTimeLeft(`${hours}h ${mins}m ${secs}s`);
      };

      updateTimer();
      const tInterval = setInterval(updateTimer, 1000);
      return () => clearInterval(tInterval);
    }, [endDate]);

    return (
      <div className="auction-timer-overlay">
        <span className="auction-urgency">{t('timeRemaining')}: {timeLeft}</span>
      </div>
    );
  };

  const handleMouseMove = (e) => {
    const card = e.currentTarget;
    const box = card.getBoundingClientRect();
    const x = e.clientX - box.left;
    const y = e.clientY - box.top;
    
    card.style.setProperty('--mouse-x', `${(x / box.width) * 100}%`);
    card.style.setProperty('--mouse-y', `${(y / box.height) * 100}%`);
    
    const rotateX = -((y - box.height / 2) / (box.height / 2)) * 10;
    const rotateY = ((x - box.width / 2) / (box.width / 2)) * 10;
    
    card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-8px) scale(1.02)`;
  };

  const handleMouseLeave = (e) => {
    const card = e.currentTarget;
    card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0) scale(1)';
  };

  return (
    <div className="marketplace-layout">
      {/* Sidebar Filters */}
      <aside className="filters-panel">
        <h3 style={{ borderBottom: '1px solid var(--primary-gold)', paddingBottom: '10px', marginBottom: '20px', color: 'var(--primary-gold)' }}>
          {t('filterTitle')}
        </h3>

        {/* Categories */}
        <div className="filter-group">
          <label className="filter-label">{t('category')}</label>
          <select 
            className="filter-input"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            <option value="">{t('allCategories')}</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>
                {lang === 'fr' ? cat.nom_fr : (lang === 'ar' ? cat.nom_ar : cat.nom_en)}
              </option>
            ))}
          </select>
        </div>

        {/* Sale Type */}
        <div className="filter-group">
          <label className="filter-label">{t('typeSale')}</label>
          <select 
            className="filter-input"
            value={saleType}
            onChange={(e) => setSaleType(e.target.value)}
          >
            <option value="all">{t('allCategories')}</option>
            <option value="direct">{t('directSale')}</option>
            <option value="auction">{t('auctions')}</option>
          </select>
        </div>

        {/* Price filter */}
        <div className="filter-group">
          <label className="filter-label">{t('price')} (MAD)</label>
          <div className="filter-range">
            <input 
              type="number" 
              placeholder="Min" 
              className="filter-input"
              value={priceRange.min}
              onChange={(e) => setPriceRange({ ...priceRange, min: e.target.value })}
            />
            <input 
              type="number" 
              placeholder="Max" 
              className="filter-input"
              value={priceRange.max}
              onChange={(e) => setPriceRange({ ...priceRange, max: e.target.value })}
            />
          </div>
        </div>

        {/* Weight filter */}
        <div className="filter-group">
          <label className="filter-label">{t('weight')} (g)</label>
          <div className="filter-range">
            <input 
              type="number" 
              placeholder="Min" 
              className="filter-input"
              value={weightRange.min}
              onChange={(e) => setWeightRange({ ...weightRange, min: e.target.value })}
            />
            <input 
              type="number" 
              placeholder="Max" 
              className="filter-input"
              value={weightRange.max}
              onChange={(e) => setWeightRange({ ...weightRange, max: e.target.value })}
            />
          </div>
        </div>

        {/* Purity */}
        <div className="filter-group">
          <label className="filter-label">{t('purity')}</label>
          <select 
            className="filter-input" 
            value={selectedPurity} 
            onChange={(e) => setSelectedPurity(e.target.value)}
          >
            <option value="">{t('allCategories')}</option>
            <option value="18k">18k</option>
            <option value="21k">21k</option>
            <option value="24k">24k</option>
          </select>
        </div>

        {/* City */}
        <div className="filter-group">
          <label className="filter-label">{t('city')}</label>
          <select 
            className="filter-input"
            value={selectedCity}
            onChange={(e) => setSelectedCity(e.target.value)}
          >
            <option value="">{t('allCategories')}</option>
            {cities.map(city => (
              <option key={city} value={city}>{city}</option>
            ))}
          </select>
        </div>
      </aside>

      {/* Main product area */}
      <main>
        {/* Modern 3D Hero Banner */}
        <div className="hero-3d-banner">
          <div className="hero-3d-info">
            <span className="hero-3d-badge">✨ {t('heroBadge')}</span>
            <h1 className="hero-3d-title">{t('heroTitle')}</h1>
            <p className="hero-3d-subtitle">{t('heroSubtitle')}</p>
            <div style={{ display: 'flex', gap: '15px', marginTop: '25px', flexWrap: 'wrap' }}>
              <button 
                className="btn-gold" 
                onClick={() => {
                  const searchWrapper = document.querySelector('.search-container');
                  if (searchWrapper) searchWrapper.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                👑 {lang === 'fr' ? 'Découvrir la collection' : (lang === 'ar' ? 'اكتشف المجموعة' : 'Explore Collection')}
              </button>
              <button 
                className="btn-outline-gold" 
                onClick={() => {
                  setSaleType('auction');
                  const searchWrapper = document.querySelector('.search-container');
                  if (searchWrapper) searchWrapper.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                🔨 {lang === 'fr' ? 'Enchères en Direct' : (lang === 'ar' ? 'المزادات المباشرة' : 'Live Auctions')}
              </button>
            </div>
          </div>
          <div className="hero-3d-visual">
            <div className="hero-3d-card-wrapper">
              <div className="hero-3d-card">
                <div className="hero-3d-card-inner">
                  <div className="hero-3d-card-front luxury-jewel-showcase">
                    <div className="showcase-sparkle">✨</div>
                    <div className="showcase-emblem">👑</div>
                    <div className="showcase-badge">🔥 ENCHÈRE PRIVÉE VIP</div>
                    <h3 className="showcase-title">Solitaire Royal Or 18K & Diamant</h3>
                    <p className="showcase-desc">Artisanat Impérial • Fès</p>
                    <div className="showcase-bid-box">
                      <span className="showcase-bid-label">Dernière Enchère :</span>
                      <span className="showcase-bid-amount">48 500 MAD</span>
                    </div>
                    <div className="showcase-cert-row">
                      <span>🇲🇦 Poinçon d'État</span>
                      <span>•</span>
                      <span>💎 Certifié FMB</span>
                    </div>
                    <div className="hero-3d-card-shine"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Moroccan Jewelry Trust Pillars */}
        <div className="trust-pillars-grid">
          <div className="trust-pillar-card">
            <div className="trust-pillar-icon">💎</div>
            <div className="trust-pillar-text">
              <h4>100% Or Poinçonné</h4>
              <p>Authenticité garantie & titrage officiel</p>
            </div>
          </div>
          <div className="trust-pillar-card">
            <div className="trust-pillar-icon">🔨</div>
            <div className="trust-pillar-text">
              <h4>Enchères Sécurisées</h4>
              <p>Adjudications transparentes en direct</p>
            </div>
          </div>
          <div className="trust-pillar-card">
            <div className="trust-pillar-icon">🇲🇦</div>
            <div className="trust-pillar-text">
              <h4>Maîtres Joailliers</h4>
              <p>Fès, Marrakech, Casablanca & Tanger</p>
            </div>
          </div>
          <div className="trust-pillar-card">
            <div className="trust-pillar-icon">🛡️</div>
            <div className="trust-pillar-text">
              <h4>Livraison Blindée</h4>
              <p>Expédition assurée partout au Maroc</p>
            </div>
          </div>
        </div>

        {/* Interactive Category Pills Bar */}
        <div className="category-pills-bar">
          <button 
            type="button" 
            className={`category-pill ${!selectedCategory && saleType === 'all' ? 'active' : ''}`}
            onClick={() => { setSelectedCategory(''); setSaleType('all'); }}
          >
            ✨ {t('allCategories')}
          </button>
          <button 
            type="button" 
            className={`category-pill ${saleType === 'auction' ? 'active' : ''}`}
            onClick={() => { setSaleType('auction'); setSelectedCategory(''); }}
          >
            🔥 {t('auctions')} ({auctions.length})
          </button>
          {categories.map(cat => {
            const icons = {
              'cat_rings': '💍',
              'cat_necklaces': '📿',
              'cat_bracelets': '✨',
              'cat_earrings': '💎',
              'cat_watches': '⌚'
            };
            return (
              <button 
                key={cat.id}
                type="button" 
                className={`category-pill ${selectedCategory === cat.id ? 'active' : ''}`}
                onClick={() => { setSelectedCategory(cat.id); setSaleType('all'); }}
              >
                {icons[cat.id] || '👑'} {lang === 'fr' ? cat.nom_fr : (lang === 'ar' ? cat.nom_ar : cat.nom_en)}
              </button>
            );
          })}
        </div>

        {/* Search Input */}
        <div className="search-container">
          <div className="search-input-wrapper">
            <input 
              type="text" 
              placeholder={t('searchPlaceholder')}
              className="search-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button className="search-btn">🔍</button>
          </div>
        </div>

        {/* Products Grid */}
        {filteredProducts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-gray)' }}>
            <div style={{ fontSize: '3rem', marginBottom: '15px' }}>💎</div>
            <p style={{ fontSize: '1.1rem' }}>{t('noProducts')}</p>
          </div>
        ) : (
          <div className="products-grid">
            {filteredProducts.map(product => {
              const activeAuction = auctions.find(a => a.bijou_id === product.id && a.statut === 'Active');
              const isFav = user && user.favoris && user.favoris.includes(product.id);

              return (
                <div 
                  key={product.id} 
                  className="product-card"
                  onMouseMove={handleMouseMove}
                  onMouseLeave={handleMouseLeave}
                >
                  {/* Badges */}
                  {activeAuction ? (
                    <span className="card-badge auction-live">
                      🔥 {t('auctions')}
                    </span>
                  ) : (
                    <span className="card-badge">✨ {t('directSale')}</span>
                  )}

                  {/* Favorite button */}
                  {user && user.role === 'client' && (
                    <button 
                      className={`card-fav-btn ${isFav ? 'active' : ''}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavorite(product.id);
                      }}
                      title="Favoris"
                    >
                      {isFav ? '❤️' : '🤍'}
                    </button>
                  )}

                  <div className="card-image-container" onClick={() => onSelectProduct(product)}>
                    <img 
                      src={product.images[0]} 
                      alt={product.titre} 
                      className="card-image"
                    />
                    {activeAuction && (
                      <AuctionTimer endDate={activeAuction.date_fin} auctionId={activeAuction.id} />
                    )}
                  </div>

                  <div className="card-content">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <span className="card-category">
                        {categories.find(c => c.id === product.category_id)?.nom_fr || ''}
                      </span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-gray)' }}>
                        📍 {product.city}
                      </span>
                    </div>

                    <h4 className="card-title" onClick={() => onSelectProduct(product)} style={{ cursor: 'pointer' }}>
                      {product.titre}
                    </h4>
                    
                    <div className="card-specs">
                      <span className="card-specs-pill">⚖️ {product.gramme}g</span>
                      <span className="card-specs-pill">👑 {product.purete}</span>
                      <span className="card-specs-pill">🇲🇦 Poinçonné</span>
                    </div>

                    <div className="card-footer">
                      <div>
                        <span className="card-price-label">
                          {activeAuction ? t('currentBid') : t('price')}
                        </span>
                        <div className="card-price">
                          {activeAuction ? activeAuction.highestBid : product.prix} <span style={{ fontSize: '0.9rem', color: 'var(--primary-gold)' }}>{t('currency')}</span>
                        </div>
                      </div>

                      {activeAuction ? (
                        <button className="btn-gold" onClick={() => onSelectProduct(product)} style={{ padding: '8px 16px', fontSize: '0.78rem' }}>
                          🔨 {t('placeBid')}
                        </button>
                      ) : (
                        product.stock > 0 ? (
                          <button 
                            className="btn-gold" 
                            onClick={() => addToCart(product)} 
                            style={{ padding: '8px 16px', fontSize: '0.78rem' }}
                          >
                            🛒 {t('addToCart')}
                          </button>
                        ) : (
                          <span style={{ color: 'var(--danger-red)', fontSize: '0.8rem', fontWeight: 'bold' }}>
                            {t('outOfStock')}
                          </span>
                        )
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
