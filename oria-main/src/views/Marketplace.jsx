import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import MobileProductCard from '../components/mobile/MobileProductCard';
import ProductCard from '../components/ProductCard';
import GoldPriceCard from '../components/GoldPriceCard';
import { API_URL } from '../config/api';

export default function Marketplace({ 
  onSelectProduct, 
  onOpenFinder, 
  onOpenSellModal,
  onOpenAIModal,
  onOpenComparator,
  onOpenGoldModal,
  comparedProductIds = [],
  onToggleCompare,
  initialUniverse = 'ALL',
  initialCategory = '',
  initialDealsOnly = false,
  selectedCity = '',
  onOpenCityPicker,
  onOpenFilterSheet,
  onOpenChatWithSeller,
  searchQuery = '',
  setSearchQuery,
  saleUniverse = 'ALL',
  setSaleUniverse,
  selectedCategory = '',
  setSelectedCategory,
  selectedMaterial = 'ALL',
  setSelectedMaterial,
  selectedCondition = 'ALL',
  setSelectedCondition,
  selectedStyle = 'ALL',
  setSelectedStyle,
  selectedOccasion = 'ALL',
  setSelectedOccasion,
  verifiedOnly = false,
  setVerifiedOnly,
  dealsOnly = false,
  setDealsOnly,
  priceMax = 35000,
  setPriceMax,
  sortBy = 'popular',
  setSortBy,
  resetAllFilters
}) {
  const { t, isRtl, lang } = useLanguage();
  const { user, toggleFavorite } = useAuth();
  const { addToCart } = useCart();

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mobileViewMode, setMobileViewMode] = useState('list'); // 'list' (1 article per line, Amazon/Temu mobile style) or 'grid' (2 columns)

  const fetchData = async () => {
    try {
      const res = await fetch(`${API_URL}/bijoux?status=Validated`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setProducts(data);
        }
      }

      const catRes = await fetch(`${API_URL}/categories`);
      if (catRes.ok) {
        const catData = await catRes.json();
        if (Array.isArray(catData)) {
          setCategories(catData);
        }
      }
      setLoading(false);
    } catch (err) {
      console.error('Error fetching marketplace data:', err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 6000);
    return () => clearInterval(interval);
  }, []);

  // Filter products locally
  const filteredProducts = products.filter(product => {
    // 1. Natural search or query
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchText = (
        (product.titre_fr || product.titre || '') + ' ' + 
        (product.titre_ar || '') + ' ' + 
        (product.titre_en || '') + ' ' + 
        (product.description_fr || product.description || '') + ' ' + 
        (product.description_ar || '') + ' ' + 
        (product.description_en || '') + ' ' + 
        (product.matiere || '') + ' ' + 
        (product.pierre || '') + ' ' + 
        (product.style || '') + ' ' + 
        (product.occasion || '') + ' ' + 
        (product.pour_qui || '') + ' ' + 
        (product.etat || '') + ' ' +
        (product.city || '') + ' ' +
        (product.vendeur_nom || '')
      ).toLowerCase();

      // Check max price in search query
      const priceMatch = q.match(/moins de (\d+)/i) || q.match(/< ?(\d+)/i);
      if (priceMatch && product.prix > parseFloat(priceMatch[1])) {
        return false;
      }

      if (q.includes('seconde main') || q.includes('occasion') || q.includes('vintage')) {
        if (product.type_vente !== 'SECOND_HAND') return false;
      }
      if (q.includes('neuf') || q.includes('première main')) {
        if (product.type_vente !== 'FIRST_HAND') return false;
      }

      const terms = q.replace(/moins de \d+/gi, '').replace(/dh/gi, '').trim().split(/\s+/);
      const matchesAnyTerm = terms.every(term => matchText.includes(term) || term.length < 2);
      if (!matchesAnyTerm) return false;
    }

    // 2. City Filter
    if (selectedCity && selectedCity !== 'Toutes les villes') {
      if ((product.city || '').toLowerCase() !== selectedCity.toLowerCase()) {
        return false;
      }
    }

    // 3. Universe
    if (saleUniverse === 'AUCTION') {
      if (product.disponibilite !== 'enchere' && product.type_vente !== 'AUCTION') {
        return false;
      }
    } else if (saleUniverse !== 'ALL' && product.type_vente !== saleUniverse) {
      return false;
    }

    // 4. Category
    if (selectedCategory && product.category_id !== selectedCategory) {
      return false;
    }

    // 5. Material
    if (selectedMaterial !== 'ALL' && (product.matiere || '').toLowerCase() !== selectedMaterial.toLowerCase()) {
      return false;
    }

    // 6. Condition
    if (selectedCondition !== 'ALL' && product.etat !== selectedCondition) {
      return false;
    }

    // 7. Style
    if (selectedStyle !== 'ALL' && (product.style || '').toLowerCase() !== selectedStyle.toLowerCase()) {
      return false;
    }

    // 8. Occasion
    if (selectedOccasion !== 'ALL' && (product.occasion || '').toLowerCase() !== selectedOccasion.toLowerCase()) {
      return false;
    }

    // 9. Verified only
    if (verifiedOnly && product.authentifie !== 'Vérifié') {
      return false;
    }

    // 10. Deals only
    if (dealsOnly && (!product.ancien_prix || product.ancien_prix <= product.prix)) {
      return false;
    }

    // 11. Max price
    if (product.prix > priceMax) {
      return false;
    }

    return true;
  });

  // Sort products
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    if (sortBy === 'price_asc') return a.prix - b.prix;
    if (sortBy === 'price_desc') return b.prix - a.prix;
    if (sortBy === 'rating') return (b.note || 0) - (a.note || 0);
    if (sortBy === 'newest') return new Date(b.date_creation || 0) - new Date(a.date_creation || 0);
    return (b.favoris_count || 0) - (a.favoris_count || 0); // popular default
  });

  // Mobile Pagination & On-Demand Loading State (10 items initially)
  const MOBILE_PAGE_SIZE = 10;
  const [mobilePaginationMode, setMobilePaginationMode] = useState('demand'); // 'demand' (charger 10 de plus) or 'page' (pagination 1, 2, 3...)
  const [mobileCurrentPage, setMobileCurrentPage] = useState(1);
  const [mobileVisibleCount, setMobileVisibleCount] = useState(10);

  // Total pages for mobile
  const totalMobilePages = Math.max(1, Math.ceil(sortedProducts.length / MOBILE_PAGE_SIZE));

  // Reset pagination whenever filters, category or sort order change
  useEffect(() => {
    setMobileCurrentPage(1);
    setMobileVisibleCount(10);
  }, [
    searchQuery,
    selectedCity,
    saleUniverse,
    selectedCategory,
    selectedMaterial,
    selectedCondition,
    selectedStyle,
    selectedOccasion,
    verifiedOnly,
    dealsOnly,
    priceMax,
    sortBy
  ]);

  // Mobile Products to display: strictly 10 per page in 'page' mode, or accumulated in 'demand' mode
  const mobileDisplayProducts = mobilePaginationMode === 'page'
    ? sortedProducts.slice((mobileCurrentPage - 1) * MOBILE_PAGE_SIZE, mobileCurrentPage * MOBILE_PAGE_SIZE)
    : sortedProducts.slice(0, mobileVisibleCount);


  const popularSuggestions = [
    { label: lang === 'ar' ? 'خاتم ذهب 18 قيراط نسائي' : 'Bague or 18k femme', icon: '💍' },
    { label: lang === 'ar' ? 'هدية أقل من 2000 درهم' : 'Cadeau moins de 2000 DH', icon: '🎁' },
    { label: lang === 'ar' ? 'سوار رجالي ذهب 18 قيراط' : 'Bracelet homme 18k', icon: '👔' },
    { label: lang === 'ar' ? 'خاتم فينتاج ذهب وألماس' : 'Bague vintage or & diamant', icon: '✨' },
    { label: lang === 'ar' ? 'قلادة صدف وذهب' : 'Collier nacre & or', icon: '📿' },
    { label: lang === 'ar' ? 'طقم زفاف ملكي' : 'Parure mariage royale', icon: '👑' }
  ];

  return (
    <div className="marketplace-container">
      {/* 1. OFFICIAL LIVE GOLD RATE BANNER (DISPLAYED ON MOBILE & DESKTOP) */}
      <div className="gold-ribbon-placement-container" style={{ padding: '0 16px', maxWidth: '1400px', margin: '4px auto 14px', width: '100%', boxSizing: 'border-box' }}>
        <GoldPriceCard onOpenHistoryModal={onOpenGoldModal} />
      </div>

      {/* 2. CATEGORIES BAR (Direct Category Access) */}
      <section className="jewelia-categories-section">

        <div className="categories-pills-row">
          <button 
            className={`category-pill ${!selectedCategory ? 'active' : ''}`}
            onClick={() => setSelectedCategory('')}
          >
            <span className="pill-icon">💎</span>
            <span className="pill-text">{t('allCategories') || (lang === 'ar' ? 'جميع الفئات' : 'Toutes les catégories')}</span>
          </button>
          {categories.map(cat => (
            <button 
              key={cat.id}
              className={`category-pill ${selectedCategory === cat.id ? 'active' : ''}`}
              onClick={() => setSelectedCategory(selectedCategory === cat.id ? '' : cat.id)}
            >
              <span className="pill-icon">{cat.icon || '💎'}</span>
              <span className="pill-text">{(lang === 'ar' && cat.nom_ar) ? cat.nom_ar : (cat.nom_fr || cat.nom)}</span>
            </button>
          ))}
        </div>
      </section>

      {/* LUXURY TRUST PILLARS BANNER */}
      <div className="hero-trust-banner hide-on-mobile">
        <div className="trust-item">
          <div className="trust-icon">🇲🇦</div>
          <div className="trust-text">
            <strong>{lang === 'ar' ? 'طابع وضمان الدولة' : 'Poinçon d\'État Garanti'}</strong>
            <span>{lang === 'ar' ? 'ذهب عيار 18 قيراط / 750‰ معتمد' : 'Or 18K / 750‰ titré & certifié'}</span>
          </div>
        </div>
        <div className="trust-item">
          <div className="trust-icon">💎</div>
          <div className="trust-text">
            <strong>{lang === 'ar' ? 'فحص وخبرة الصياغة' : 'Expertise Joaillière'}</strong>
            <span>{lang === 'ar' ? 'فحص دقيق وشامل في الورشة' : 'Contrôle systématique en atelier'}</span>
          </div>
        </div>
        <div className="trust-item">
          <div className="trust-icon">🛡️</div>
          <div className="trust-text">
            <strong>{lang === 'ar' ? 'أداء آمن وموثوق' : 'Paiement Sécurisé'}</strong>
            <span>{lang === 'ar' ? 'عند الاستلام أو بالبطاقة البنكية' : 'À la livraison ou par Carte'}</span>
          </div>
        </div>
        <div className="trust-item">
          <div className="trust-icon">⚡</div>
          <div className="trust-text">
            <strong>{lang === 'ar' ? 'توصيل لجميع مدن المغرب' : 'Livraison au Maroc'}</strong>
            <span>{lang === 'ar' ? 'شحن سري وسريع خلال 24/48 ساعة' : 'Expédition discrète 24/48h'}</span>
          </div>
        </div>
      </div>

      {/* SEARCH SHORTCUT SUGGESTIONS (Refined Modern Glass Chips) */}
      <div className="search-suggestions-row hide-on-mobile">
        <span className="suggestions-label">{lang === 'ar' ? '💡 اقتراحات :' : '💡 Suggestions :'}</span>
        <div className="suggestions-chips-wrap">
          {popularSuggestions.map((tag, i) => (
            <button 
              key={i}
              onClick={() => setSearchQuery(tag.label)}
              className="suggestion-tag-btn"
            >
              <span className="suggestion-icon">{tag.icon}</span>
              <span>{tag.label}</span>
            </button>
          ))}
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="suggestion-clear-btn"
            >
              {lang === 'ar' ? 'مسح البحث ✕' : 'Effacer la recherche ✕'}
            </button>
          )}
        </div>
      </div>

      {/* 3. MARKETPLACE CATALOGUE PRINCIPAL */}
      <div className="marketplace-layout">
        {/* Desktop Sidebar Filters */}
        <aside className="filters-panel hide-on-mobile">
          <div className="filters-panel-header">
            <div className="filters-header-title">
              <span className="filters-lightning">⚡</span>
              <h3>{lang === 'ar' ? 'تصفية النتائج' : 'Filtres de Recherche'}</h3>
            </div>
            <button 
              onClick={resetAllFilters}
              className="filters-reset-btn"
            >
              {lang === 'ar' ? 'إعادة ضبط' : 'Réinitialiser'}
            </button>
          </div>

          {/* Universe Filter */}
          <div className="filter-group">
            <label className="filter-label">{lang === 'ar' ? 'نوع المعروضات' : 'Univers de Vente'}</label>
            <div className="filter-universe-options">
              <button 
                onClick={() => setSaleUniverse('ALL')}
                className={`filter-universe-btn ${saleUniverse === 'ALL' && !dealsOnly ? 'active' : ''}`}
              >
                <span>💎 {lang === 'ar' ? 'جميع المجوهرات' : 'Tous les bijoux'}</span>
                <span className="count-tag">{products.length}</span>
              </button>

              <button 
                onClick={() => setSaleUniverse('FIRST_HAND')}
                className={`filter-universe-btn first ${saleUniverse === 'FIRST_HAND' ? 'active' : ''}`}
              >
                <span>✨ {lang === 'ar' ? 'مجوهرات جديدة' : 'Première Main (Neuf)'}</span>
                <span className="count-tag">{products.filter(p => p.type_vente === 'FIRST_HAND').length}</span>
              </button>

              <button 
                onClick={() => setSaleUniverse('SECOND_HAND')}
                className={`filter-universe-btn second ${saleUniverse === 'SECOND_HAND' ? 'active' : ''}`}
              >
                <span>♻️ {lang === 'ar' ? 'مجوهرات مستعملة' : 'Seconde Main (Occasion)'}</span>
                <span className="count-tag second">{products.filter(p => p.type_vente === 'SECOND_HAND').length}</span>
              </button>
            </div>
          </div>

          {/* Prix Max */}
          <div className="filter-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <label className="filter-label" style={{ margin: 0 }}>{lang === 'ar' ? 'الميزانية القصوى' : 'Budget Max'}</label>
              <span className="filter-price-display" dir="ltr">
                {priceMax.toLocaleString()} {t('currency') || 'DH'}
              </span>
            </div>
            <input 
              type="range"
              min="500"
              max="35000"
              step="500"
              value={priceMax}
              onChange={e => setPriceMax(parseFloat(e.target.value))}
              className="filter-range-input"
            />
            <div className="range-labels-row" dir="ltr">
              <span>500 {t('currency') || 'DH'}</span>
              <span>15 000 {t('currency') || 'DH'}</span>
              <span>35 000+ {t('currency') || 'DH'}</span>
            </div>
          </div>

          {/* Matière */}
          <div className="filter-group">
            <label className="filter-label">{lang === 'ar' ? 'المعدن والمادة' : 'Matière & Métal'}</label>
            <select 
              value={selectedMaterial}
              onChange={e => setSelectedMaterial(e.target.value)}
              className="filter-select-control"
            >
              <option value="ALL">{lang === 'ar' ? 'جميع المواد' : 'Toutes les matières'}</option>
              <option value="Or">{lang === 'ar' ? '🥇 ذهب 18 / 24 قيراط' : '🥇 Or 18k / 24k'}</option>
              <option value="Argent">{lang === 'ar' ? '🥈 فضة 925' : '🥈 Argent 925'}</option>
              <option value="Diamant">{lang === 'ar' ? '💠 ألماس وسوليتير' : '💠 Diamant & Solitaire'}</option>
              <option value="Plaqué or">{lang === 'ar' ? '✨ مطلي بالذهب' : '✨ Plaqué or'}</option>
              <option value="Acier">{lang === 'ar' ? '⚙️ فولاذ مقاوم للصدأ' : '⚙️ Acier inoxydable'}</option>
            </select>
          </div>

          {/* État */}
          <div className="filter-group">
            <label className="filter-label">{lang === 'ar' ? 'حالة القطعة' : 'État du bijou'}</label>
            <select 
              value={selectedCondition}
              onChange={e => setSelectedCondition(e.target.value)}
              className="filter-select-control"
            >
              <option value="ALL">{lang === 'ar' ? 'جميع الحالات' : 'Tous les états'}</option>
              <option value="Neuf">{lang === 'ar' ? 'جديد (مع البطاقة)' : 'Neuf (avec étiquette)'}</option>
              <option value="Comme neuf">{lang === 'ar' ? 'كالجديد (لم يلبس)' : 'Comme neuf (jamais porté)'}</option>
              <option value="Excellent état">{lang === 'ar' ? 'حالة ممتازة (مصقول)' : 'Excellent état (poli)'}</option>
              <option value="Très bon état">{lang === 'ar' ? 'حالة جيدة جداً' : 'Très bon état'}</option>
              <option value="Bon état">{lang === 'ar' ? 'حالة جيدة' : 'Bon état'}</option>
            </select>
          </div>

          {/* Style */}
          <div className="filter-group">
            <label className="filter-label">{lang === 'ar' ? 'النمط والتصميم' : 'Style & Allure'}</label>
            <select 
              value={selectedStyle}
              onChange={e => setSelectedStyle(e.target.value)}
              className="filter-select-control"
            >
              <option value="ALL">{lang === 'ar' ? 'جميع الأنماط' : 'Tous les styles'}</option>
              <option value="Moderne">{lang === 'ar' ? 'عصري وناعم' : 'Moderne & Épuré'}</option>
              <option value="Classique">{lang === 'ar' ? 'كلاسيكي أنيق' : 'Classique Chic'}</option>
              <option value="Traditionnel">{lang === 'ar' ? 'تقليدي مغربي' : 'Traditionnel Marocain'}</option>
              <option value="Artisanal">{lang === 'ar' ? 'حرفي / صناعة يدوية' : 'Artisanal & Fait main'}</option>
              <option value="Vintage">{lang === 'ar' ? 'فينتاج وأثري' : 'Vintage & Ancien'}</option>
              <option value="Luxe">{lang === 'ar' ? 'مجوهرات فاخرة' : 'Haute Joaillerie'}</option>
              <option value="Minimaliste">{lang === 'ar' ? 'بسيط مينيست' : 'Minimaliste'}</option>
            </select>
          </div>

          {/* Special toggles */}
          <div className="filter-group">
            <label className="filter-checkbox-item">
              <input 
                type="checkbox" 
                checked={verifiedOnly}
                onChange={e => setVerifiedOnly(e.target.checked)}
                className="filter-checkbox-input"
              />
              <div className="checkbox-text-wrap">
                <strong>{lang === 'ar' ? '🛡️ مفحوص وموثق 100%' : '🛡️ 100% Vérifié & Expertisé'}</strong>
                <span>{lang === 'ar' ? 'طابع الدولة وشهادة الأصالة مضمونة' : 'Poinçon d\'État et certificat garantis'}</span>
              </div>
            </label>

            <label className="filter-checkbox-item" style={{ marginTop: '10px' }}>
              <input 
                type="checkbox" 
                checked={dealsOnly}
                onChange={e => setDealsOnly(e.target.checked)}
                className="filter-checkbox-input"
              />
              <div className="checkbox-text-wrap">
                <strong>{lang === 'ar' ? '🔥 عروض وتخفيضات خاصة' : '🔥 Bonnes Affaires & Remises'}</strong>
                <span>{lang === 'ar' ? 'قطع بأسعار مخفضة ومميزة' : 'Pièces avec réduction de prix'}</span>
              </div>
            </label>
          </div>
        </aside>

        {/* Products Grid & Mobile Feed */}
        <main style={{ width: '100%' }}>
          {/* Header Bar */}
          <div className="products-grid-header">
            <div className="products-count-text">
              <span className="results-badge">{sortedProducts.length}</span>
              <span>{lang === 'ar' ? 'قطعة مجوهرات متوفرة' : 'bijoux disponibles'}</span>
              {selectedCity && <span className="city-filter-highlight"> {lang === 'ar' ? 'في' : 'à'} <strong>{selectedCity}</strong></span>}
              {saleUniverse === 'FIRST_HAND' && <span className="universe-tag-first"> • {lang === 'ar' ? '✨ مجوهرات جديدة' : '✨ Première Main'}</span>}
              {saleUniverse === 'SECOND_HAND' && <span className="universe-tag-second"> • {lang === 'ar' ? '♻️ مجوهرات مستعملة' : '♻️ Seconde Main'}</span>}
              {saleUniverse === 'AUCTION' && <span className="universe-tag-first" style={{ background: '#fee2e2', color: '#dc2626', borderColor: '#fca5a5' }}> • {lang === 'ar' ? '🔨 مزادات مباشرة' : '🔨 Enchères en Direct'}</span>}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '0.84rem', color: 'var(--text-gray)' }} className="hide-on-mobile">{lang === 'ar' ? 'ترتيب حسب :' : 'Trier par :'}</span>
              <select 
                value={sortBy}
                onChange={e => setSortBy(e.target.value)}
                className="products-sort-select"
              >
                <option value="popular">{lang === 'ar' ? '⭐ الأكثر شعبية' : '⭐ Popularité'}</option>
                <option value="newest">{lang === 'ar' ? '🕒 الأحدث' : '🕒 Plus récents'}</option>
                <option value="price_asc">{lang === 'ar' ? '💰 السعر: تصاعدي' : '💰 Prix croissant'}</option>
                <option value="price_desc">{lang === 'ar' ? '💎 السعر: تنازلي' : '💎 Prix décroissant'}</option>
                <option value="rating">{lang === 'ar' ? '🏆 الأعلى تقييماً' : '🏆 Meilleures notes'}</option>
              </select>
            </div>
          </div>

          {/* Empty state */}
          {sortedProducts.length === 0 ? (
            <div className="empty-results-box">
              <span style={{ fontSize: '3.5rem', display: 'block', marginBottom: '16px' }}>🔍</span>
              <h3 style={{ fontSize: '1.4rem', marginBottom: '8px', color: '#fff' }}>{lang === 'ar' ? 'لم يتم العثور على قطع تطابق البحث' : 'Aucun bijou correspondant trouvé'}</h3>
              <p style={{ color: 'var(--text-gray)', fontSize: '0.92rem', marginBottom: '24px', maxWidth: '400px', margin: '0 auto 24px' }}>
                {lang === 'ar' ? 'يرجى تجربة توسيع نطاق الميزانية أو اختيار مدينة أخرى أو تغيير نوع المعدن.' : 'Essayez d\'élargir votre budget, votre ville ou vos critères de matière.'}
              </p>
              <button onClick={resetAllFilters} className="btn-jewelia-primary">
                {lang === 'ar' ? 'إعادة ضبط كافة الفلاتر' : 'Réinitialiser tous les filtres'}
              </button>
            </div>
          ) : (
            <>
              {/* MOBILE FEED (Avito Grid 2 Col or List) */}
              <div className={`mobile-avito-products-container ${mobileViewMode === 'list' ? 'mode-list' : 'mode-grid'} show-on-mobile-only`}>
                {mobileDisplayProducts.map(product => (
                  <MobileProductCard 
                    key={product.id}
                    product={product}
                    onSelectProduct={onSelectProduct}
                    viewMode={mobileViewMode}
                    onToggleCompare={onToggleCompare}
                    isCompared={comparedProductIds.includes(product.id)}
                    onOpenChatWithSeller={onOpenChatWithSeller}
                  />
                ))}
              </div>

              {/* MOBILE PAGINATION & LOAD ON DEMAND CONTROLS */}
              {sortedProducts.length > MOBILE_PAGE_SIZE && (
                <div className="mobile-pagination-section show-on-mobile-only">
                  {/* Mode Switch Tabs: À la demande vs Par page */}
                  <div className="mobile-pagination-mode-switch">
                    <button
                      type="button"
                      className={`mobile-mode-pill-btn ${mobilePaginationMode === 'demand' ? 'active' : ''}`}
                      onClick={() => setMobilePaginationMode('demand')}
                    >
                      ⚡ {lang === 'ar' ? `عرض تدريجي (${Math.min(mobileVisibleCount, sortedProducts.length)}/${sortedProducts.length})` : `À la demande (${Math.min(mobileVisibleCount, sortedProducts.length)}/${sortedProducts.length})`}
                    </button>
                    <button
                      type="button"
                      className={`mobile-mode-pill-btn ${mobilePaginationMode === 'page' ? 'active' : ''}`}
                      onClick={() => setMobilePaginationMode('page')}
                    >
                      📄 {lang === 'ar' ? `بالصفحات (${mobileCurrentPage}/${totalMobilePages})` : `Par page (${mobileCurrentPage}/${totalMobilePages})`}
                    </button>
                  </div>

                  {/* Mode 1: À la demande (Load More 10 by 10) */}
                  {mobilePaginationMode === 'demand' ? (
                    <div className="mobile-demand-container">
                      <div className="mobile-demand-progress-header">
                        <span className="progress-text">
                          {lang === 'ar' ? (
                            <>عرض <strong>{Math.min(mobileVisibleCount, sortedProducts.length)}</strong> من أصل <strong>{sortedProducts.length}</strong> قطعة مجوهرات</>
                          ) : (
                            <>Affichage de <strong>{Math.min(mobileVisibleCount, sortedProducts.length)}</strong> sur <strong>{sortedProducts.length}</strong> bijoux</>
                          )}
                        </span>
                        <span className="progress-pct">
                          {Math.round((Math.min(mobileVisibleCount, sortedProducts.length) / sortedProducts.length) * 100)}%
                        </span>
                      </div>
                      <div className="mobile-progress-bar-wrap">
                        <div 
                          className="mobile-progress-bar-fill" 
                          style={{ width: `${(Math.min(mobileVisibleCount, sortedProducts.length) / sortedProducts.length) * 100}%` }}
                        />
                      </div>

                      {mobileVisibleCount < sortedProducts.length ? (
                        <div className="mobile-demand-actions">
                          <button
                            type="button"
                            className="mobile-load-more-btn"
                            onClick={() => setMobileVisibleCount(prev => Math.min(prev + MOBILE_PAGE_SIZE, sortedProducts.length))}
                          >
                            <span>{lang === 'ar' ? 'عرض 10 مجوهرات إضافية ▾' : 'Afficher 10 bijoux de plus ▾'}</span>
                            <span className="load-more-badge">+{Math.min(MOBILE_PAGE_SIZE, sortedProducts.length - mobileVisibleCount)}</span>
                          </button>
                          
                          {sortedProducts.length - mobileVisibleCount > MOBILE_PAGE_SIZE && (
                            <button
                              type="button"
                              className="mobile-load-all-link"
                              onClick={() => setMobileVisibleCount(sortedProducts.length)}
                            >
                              {lang === 'ar' ? `عرض الكل (${sortedProducts.length} قطعة)` : `Tout afficher (${sortedProducts.length} pièces)`}
                            </button>
                          )}
                        </div>
                      ) : (
                        <div className="mobile-all-loaded-banner">
                          <span>✨ {lang === 'ar' ? `تم عرض جميع قطع المجوهرات المتوفرة (${sortedProducts.length} قطعة)` : `Tous les ${sortedProducts.length} bijoux disponibles sont affichés`}</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    /* Mode 2: Pagination Numérotée (1, 2, 3...) */
                    <div className="mobile-page-container">
                      <div className="mobile-pagination-controls">
                        <button
                          type="button"
                          className="mobile-nav-btn prev"
                          disabled={mobileCurrentPage <= 1}
                          onClick={() => {
                            setMobileCurrentPage(p => Math.max(1, p - 1));
                            const el = document.querySelector('.mobile-avito-products-container') || document.querySelector('.products-grid-header');
                            el?.scrollIntoView({ behavior: 'smooth' });
                          }}
                        >
                          {lang === 'ar' ? 'السابق ‹' : '‹ Précédent'}
                        </button>

                        <div className="mobile-pages-list">
                          {Array.from({ length: totalMobilePages }, (_, idx) => idx + 1).map(page => (
                            <button
                              key={page}
                              type="button"
                              className={`mobile-page-num-btn ${mobileCurrentPage === page ? 'active' : ''}`}
                              onClick={() => {
                                setMobileCurrentPage(page);
                                const el = document.querySelector('.mobile-avito-products-container') || document.querySelector('.products-grid-header');
                                el?.scrollIntoView({ behavior: 'smooth' });
                              }}
                            >
                              {page}
                            </button>
                          ))}
                        </div>

                        <button
                          type="button"
                          className="mobile-nav-btn next"
                          disabled={mobileCurrentPage >= totalMobilePages}
                          onClick={() => {
                            setMobileCurrentPage(p => Math.min(totalMobilePages, p + 1));
                            const el = document.querySelector('.mobile-avito-products-container') || document.querySelector('.products-grid-header');
                            el?.scrollIntoView({ behavior: 'smooth' });
                          }}
                        >
                          {lang === 'ar' ? '› التالي' : 'Suivant ›'}
                        </button>
                      </div>

                      <div className="mobile-pages-summary">
                        {lang === 'ar' ? (
                          `الصفحة ${mobileCurrentPage} من ${totalMobilePages} • المجوهرات من ${(mobileCurrentPage - 1) * MOBILE_PAGE_SIZE + 1} إلى ${Math.min(mobileCurrentPage * MOBILE_PAGE_SIZE, sortedProducts.length)} من ${sortedProducts.length}`
                        ) : (
                          <>Page {mobileCurrentPage} sur {totalMobilePages} • Bijoux {(mobileCurrentPage - 1) * MOBILE_PAGE_SIZE + 1} à {Math.min(mobileCurrentPage * MOBILE_PAGE_SIZE, sortedProducts.length)} sur {sortedProducts.length}</>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* DESKTOP GRID (Avito Morocco Multi-Photo White Card Layout) */}
              <div className="products-grid hide-on-mobile">
                {sortedProducts.map(product => (
                  <ProductCard 
                    key={product.id}
                    product={product}
                    onSelectProduct={onSelectProduct}
                    onOpenChatWithSeller={onOpenChatWithSeller}
                    viewMode="desktop"
                    isMobile={false}
                  />
                ))}
              </div>
            </>
          )}
        </main>
      </div>

      {/* 4. LES DEUX UNIVERS CARDS (Desktop bottom section) */}
      <section className="jewelia-universes-section hide-on-mobile" style={{ marginTop: '50px', marginBottom: '40px' }}>
        <div className="universes-grid">
          {/* Première Main */}
          <div 
            className="universe-card first-hand"
            onClick={() => {
              setSaleUniverse('FIRST_HAND');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          >
            <div>
              <div className="universe-header-tag">
                <span>{lang === 'ar' ? '✨ مجوهرات جديدة' : '✨ PREMIÈRE MAIN'}</span>
              </div>
              <h3 className="universe-title">
                {lang === 'ar' ? '« مجوهرات جديدة مباشرة من كبار الصاغة المعتمدين »' : '« Des bijoux neufs, directement des bijouteries certifiées »'}
              </h3>
              <p className="universe-desc">
                {lang === 'ar' 
                  ? 'اكتشفوا تشكيلات حصرية من شركائنا الصاغة مع ضمان رسمي وطابع الدولة وتعديل المقاس مجاناً.'
                  : 'Découvrez les collections exclusives de joailliers partenaires avec garantie officielle, poinçon d\'État et mise à taille offerte.'
                }
              </p>
            </div>
            <button className="universe-btn">
              {t('universeFirstHandBtn')} ↑
            </button>
          </div>

          {/* Seconde Main */}
          <div 
            className="universe-card second-hand"
            onClick={() => {
              setSaleUniverse('SECOND_HAND');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          >
            <div>
              <div className="universe-header-tag">
                <span>{lang === 'ar' ? '♻️ مجوهرات مستعملة' : '♻️ SECONDE MAIN'}</span>
              </div>
              <h3 className="universe-title">
                {lang === 'ar' ? '« مجوهرات مستعملة موثقة تمنح حياة ثانية »' : '« Des bijoux d\'occasion authentifiés pour une seconde vie »'}
              </h3>
              <p className="universe-desc">
                {lang === 'ar'
                  ? 'قطع أثرية ونادرة ومجوهرات ثمينة معروضة من أفراد، مفحوصة ومختبرة بدقة من خبرائنا قبل الشحن.'
                  : 'Pièces vintage rares et bijoux précieux proposés par des particuliers. Contrôlés, expertisés et testés par nos experts avant envoi.'
                }
              </p>
            </div>
            <button className="universe-btn">
              {t('universeSecondHandBtn')} ↑
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
