import React from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { isSameCity, getCityDisplayName } from '../../utils/moroccanCities';

export default function MobileFilterSheet({
  isOpen,
  onClose,
  saleUniverse,
  onSelectUniverse,
  selectedCategory,
  onSelectCategory,
  categories = [],
  selectedMaterial,
  onSelectMaterial,
  selectedCondition,
  onSelectCondition,
  selectedStyle,
  onSelectStyle,
  verifiedOnly,
  onToggleVerified,
  dealsOnly,
  onToggleDeals,
  priceMax,
  onChangePriceMax,
  sortBy,
  onChangeSortBy,
  selectedCity,
  onOpenCityPicker,
  onSelectCity,
  onResetFilters,
  totalResultsCount = 0,
  mobileViewMode = 'grid',
  onChangeMobileViewMode
}) {
  const { lang, t } = useLanguage();
  if (!isOpen) return null;

  const isAr = lang === 'ar';

  // Major Moroccan cities for quick tap
  const quickCities = [
    { id: '', label: isAr ? 'كل المغرب 🇲🇦' : 'Tout le Maroc 🇲🇦' },
    { id: 'Casablanca', label: isAr ? 'الدار البيضاء' : 'Casablanca' },
    { id: 'Rabat', label: isAr ? 'الرباط' : 'Rabat' },
    { id: 'Marrakech', label: isAr ? 'مراكش' : 'Marrakech' },
    { id: 'Fès', label: isAr ? 'فاس' : 'Fès' },
    { id: 'Tanger', label: isAr ? 'طنجة' : 'Tanger' },
    { id: 'Agadir', label: isAr ? 'أكادير' : 'Agadir' },
    { id: 'Meknès', label: isAr ? 'مكناس' : 'Meknès' }
  ];

  // Budget presets
  const budgetPresets = [
    { value: 5000, label: isAr ? '5 000 د.م' : '5 000 DH' },
    { value: 10000, label: isAr ? '10 000 د.م' : '10 000 DH' },
    { value: 20000, label: isAr ? '20 000 د.م' : '20 000 DH' },
    { value: 35000, label: isAr ? '35 000+ د.م (الكل)' : '35 000+ DH (Tout)' }
  ];

  return (
    <div className="jewelia-modal-backdrop mobile-sheet-backdrop" onClick={onClose} dir={isAr ? 'rtl' : 'ltr'}>
      <div className="mobile-bottom-sheet filter-sheet" onClick={e => e.stopPropagation()}>
        {/* Drag Handle */}
        <div className="sheet-drag-handle" />

        {/* Sheet Header */}
        <div className="sheet-header">
          <div>
            <h3 className="sheet-title">⚡ {isAr ? 'فلاتر وتصفية البحث' : 'Filtres de Recherche'}</h3>
            <p className="sheet-subtitle">{isAr ? 'خصص معايير البحث بدقة حسب رغبتك' : 'Affinez vos critères sur mesure'}</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button className="sheet-reset-btn" onClick={onResetFilters}>
              {isAr ? 'إعادة ضبط' : 'Réinitialiser'}
            </button>
            <button className="sheet-close-btn" onClick={onClose} aria-label={isAr ? 'إغلاق' : 'Fermer'}>✕</button>
          </div>
        </div>

        {/* Quick Action Chips Bar inside the Filter Sheet */}
        <div className="sheet-quick-chips-summary">
          <span className="quick-summary-label">{isAr ? '💡 اختصارات سريعة :' : '💡 Raccourcis rapides :'}</span>
          <div className="quick-summary-chips-row">
            {/* City Quick Chip */}
            <button 
              className={`sheet-quick-summary-chip ${selectedCity ? 'active' : ''}`}
              onClick={onOpenCityPicker}
            >
              <span>📍 {getCityDisplayName(selectedCity, isAr ? 'ar' : 'fr')}</span>
              <span className="chip-chevron">▼</span>
            </button>

            {/* Price Quick Chip */}
            <button 
              className={`sheet-quick-summary-chip ${priceMax < 35000 ? 'active' : ''}`}
              onClick={() => {
                const nextBudget = priceMax <= 5000 ? 10000 : priceMax <= 10000 ? 20000 : priceMax <= 20000 ? 35000 : 5000;
                onChangePriceMax(nextBudget);
              }}
            >
              <span>💰 {isAr 
                ? (priceMax >= 35000 ? 'جميع الميزانيات' : `ميزانية حتى ${priceMax.toLocaleString('fr-FR')} د.م`) 
                : (priceMax >= 35000 ? 'Tous les budgets' : `Max ${priceMax.toLocaleString('fr-FR')} DH`)}</span>
            </button>

            {/* 18k Gold Quick Chip */}
            <button 
              className={`sheet-quick-summary-chip ${selectedMaterial === 'Or' ? 'active' : ''}`}
              onClick={() => onSelectMaterial(selectedMaterial === 'Or' ? 'ALL' : 'Or')}
            >
              <span>🥇 {isAr ? 'ذهب 18 قيراط' : 'Or 18K'}</span>
            </button>

            {/* Verified Quick Chip */}
            <button 
              className={`sheet-quick-summary-chip ${verifiedOnly ? 'active' : ''}`}
              onClick={() => onToggleVerified(!verifiedOnly)}
            >
              <span>🛡️ {isAr ? 'قطع مفحوصة' : 'Vérifiés'}</span>
            </button>

            {/* Deals Quick Chip */}
            <button 
              className={`sheet-quick-summary-chip ${dealsOnly ? 'active' : ''}`}
              onClick={() => onToggleDeals(!dealsOnly)}
            >
              <span>🔥 {isAr ? 'تخفيضات %' : 'Remises %'}</span>
            </button>
          </div>
        </div>

        {/* Scrollable Filter Options */}
        <div className="filter-sheet-body">
          {/* 1. View Mode Switcher (Grille 2 Colonnes vs Liste 1 Colonne) */}
          {onChangeMobileViewMode && (
            <div className="sheet-filter-group">
              <label className="sheet-filter-label">{isAr ? 'طريقة عرض المجوهرات في الصفحة' : 'Mode d\'Affichage'}</label>
              <div className="sheet-view-mode-toggle">
                <button 
                  type="button"
                  className={`sheet-view-btn ${mobileViewMode === 'grid' ? 'active' : ''}`}
                  onClick={() => onChangeMobileViewMode('grid')}
                >
                  <span className="view-ico">⊞</span>
                  <span className="view-txt">{isAr ? 'عرض عمودين (Grille)' : '2 Colonnes (Grille)'}</span>
                </button>
                <button 
                  type="button"
                  className={`sheet-view-btn ${mobileViewMode === 'list' ? 'active' : ''}`}
                  onClick={() => onChangeMobileViewMode('list')}
                >
                  <span className="view-ico">☰</span>
                  <span className="view-txt">{isAr ? 'قطعة في السطر (Liste)' : '1 par ligne (Détaillé)'}</span>
                </button>
              </div>
            </div>
          )}

          {/* 2. Ville sélectionnée (Localisation au Maroc) */}
          <div className="sheet-filter-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <label className="sheet-filter-label" style={{ margin: 0 }}>📍 {isAr ? 'المدينة في المغرب' : 'Localisation au Maroc'}</label>
              <button 
                onClick={onOpenCityPicker}
                className="sheet-link-btn"
                type="button"
              >
                {isAr ? 'جميع المدن ❯' : 'Toutes les villes ❯'}
              </button>
            </div>

            {/* Quick City Pills */}
            <div className="sheet-chips-grid">
              {quickCities.map(city => {
                const isActive = isSameCity(selectedCity, city.id) || (!selectedCity && !city.id);
                return (
                  <button 
                    key={city.id || 'all'}
                    type="button"
                    className={`sheet-chip ${isActive ? 'active' : ''}`}
                    onClick={() => {
                      if (onSelectCity) onSelectCity(city.id);
                      else onOpenCityPicker();
                    }}
                  >
                    {city.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. Budget Max Slider + Quick Presets */}
          <div className="sheet-filter-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <label className="sheet-filter-label" style={{ margin: 0 }}>💰 {isAr ? 'الميزانية القصوى' : 'Budget Maximum'}</label>
              
              <div className={`sheet-luxury-price-badge ${priceMax >= 35000 ? 'max-unlimited' : ''}`} dir={isAr ? 'rtl' : 'ltr'}>
                {priceMax >= 35000 ? (
                  <span className="badge-unlimited">{isAr ? '✨ الكل (بدون سقف)' : '✨ Illimité (Tous)'}</span>
                ) : (
                  <>
                    <span className="badge-prefix">{isAr ? 'حتى' : 'Jusqu\'à'}</span>
                    <strong className="badge-amount">{String(Math.round(priceMax || 0)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ')}</strong>
                    <span className="badge-currency">{isAr ? 'د.م' : 'DH'}</span>
                  </>
                )}
              </div>
            </div>
            
            <input 
              type="range"
              min="500"
              max="35000"
              step="500"
              value={priceMax}
              onChange={e => onChangePriceMax(parseFloat(e.target.value))}
              className="sheet-range-slider"
              dir="ltr"
              style={{
                background: `linear-gradient(to right, #d4af37 0%, #d4af37 ${Math.min(100, Math.max(0, ((priceMax - 500) / 34500) * 100))}%, #e2e8f0 ${Math.min(100, Math.max(0, ((priceMax - 500) / 34500) * 100))}%, #e2e8f0 100%)`
              }}
            />

            {/* Range Bounds */}
            <div className="sheet-range-bounds" dir="ltr">
              <span className="bound-min">500 {isAr ? 'د.م' : 'DH'}</span>
              <span className="bound-mid">15 000 {isAr ? 'د.م' : 'DH'}</span>
              <span className="bound-max">35 000+ {isAr ? 'د.م' : 'DH'}</span>
            </div>
            
            {/* Quick Budget Presets */}
            <div className="sheet-budget-presets-row">
              {budgetPresets.map(b => {
                const isActive = priceMax === b.value;
                return (
                  <button 
                    key={b.value}
                    type="button"
                    className={`sheet-budget-preset-btn ${isActive ? 'active' : ''}`}
                    onClick={() => onChangePriceMax(b.value)}
                  >
                    {isActive && <span style={{ fontSize: '0.75rem', lineHeight: 1 }}>✓</span>}
                    <span>{b.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 4. Matière & Métal */}
          <div className="sheet-filter-group">
            <label className="sheet-filter-label">🥇 {isAr ? 'المعدن والمادة' : 'Matière & Métal'}</label>
            <div className="sheet-chips-grid">
              {[
                { id: 'ALL', label: isAr ? 'جميع المعادن' : 'Toutes les matières' },
                { id: 'Or', label: isAr ? '🥇 ذهب' : '🥇 Or' },
                { id: 'Argent', label: isAr ? '▫️ فضة' : '▫️ Argent' },
                { id: 'Piece Rare', label: isAr ? '🪙 قطعة نادرة' : '🪙 Pièce rare' },
                { id: 'Diamant', label: isAr ? '💠 ألماس وأحجار كريمة' : '💠 Diamants' },
                { id: 'Plaqué or', label: isAr ? '✨ مطلي بالذهب' : '✨ Plaqué or' }
              ].map(mat => (
                <button 
                  key={mat.id}
                  type="button"
                  className={`sheet-chip ${selectedMaterial === mat.id ? 'active' : ''}`}
                  onClick={() => onSelectMaterial(mat.id)}
                >
                  {mat.label}
                </button>
              ))}
            </div>
          </div>

          {/* 5. Garanties, Authenticité & Remises */}
          <div className="sheet-filter-group">
            <label className="sheet-filter-label">🛡️ {isAr ? 'الضمانات والتوثيق' : 'Garanties & Confiance'}</label>
            <div className="sheet-toggles-list">
              <label className="sheet-toggle-item">
                <input 
                  type="checkbox" 
                  checked={verifiedOnly}
                  onChange={e => onToggleVerified(e.target.checked)}
                />
                <div className="toggle-text">
                  <strong>{isAr ? '🛡️ قطع مفحوصة ومضمونة (طابع الدولة)' : '🛡️ Bijou Vérifié & Expertisé'}</strong>
                  <span>{isAr ? 'مفحوصة من صائغ معتمد ومختومة بطابع الدولة الرسمي 🇲🇦' : 'Contrôlé par un joaillier agréé avec poinçon officiel'}</span>
                </div>
              </label>

              <label className="sheet-toggle-item">
                <input 
                  type="checkbox" 
                  checked={dealsOnly}
                  onChange={e => onToggleDeals(e.target.checked)}
                />
                <div className="toggle-text">
                  <strong>{isAr ? '🔥 عروض وتخفيضات خاصة (Promotions)' : '🔥 Bonnes Affaires & Promotions'}</strong>
                  <span>{isAr ? 'عرض القطع التي تحتوي على تخفيض مباشر في السعر' : 'Uniquement les annonces avec remise de prix'}</span>
                </div>
              </label>
            </div>
          </div>

          {/* 6. Univers de vente */}
          <div className="sheet-filter-group">
            <label className="sheet-filter-label">{isAr ? 'نوع المعروضات' : 'Univers de Vente'}</label>
            <div className="sheet-chips-grid">
              <button 
                type="button"
                className={`sheet-chip ${saleUniverse === 'ALL' && !dealsOnly ? 'active' : ''}`}
                onClick={() => onSelectUniverse('ALL')}
              >
                💎 {isAr ? 'جميع المجوهرات' : 'Tous les bijoux'}
              </button>
              <button 
                type="button"
                className={`sheet-chip first ${saleUniverse === 'FIRST_HAND' ? 'active' : ''}`}
                onClick={() => onSelectUniverse('FIRST_HAND')}
              >
                ✨ {isAr ? 'مجوهرات جديدة' : 'Première Main (Neuf)'}
              </button>
              <button 
                type="button"
                className={`sheet-chip second ${saleUniverse === 'SECOND_HAND' ? 'active' : ''}`}
                onClick={() => onSelectUniverse('SECOND_HAND')}
              >
                ♻️ {isAr ? 'مجوهرات مستعملة' : 'Seconde Main (Occasion)'}
              </button>
              <button 
                type="button"
                className={`sheet-chip ${saleUniverse === 'AUCTION' ? 'active' : ''}`}
                style={saleUniverse === 'AUCTION' ? { background: '#ef4444', color: '#ffffff', borderColor: '#ef4444' } : {}}
                onClick={() => onSelectUniverse('AUCTION')}
              >
                🔨 {isAr ? 'مزادات حية' : 'Enchères'}
              </button>
            </div>
          </div>

          {/* 7. Catégories de bijoux */}
          <div className="sheet-filter-group">
            <label className="sheet-filter-label">{isAr ? 'فئة المجوهرات' : 'Catégorie de Bijou'}</label>
            <div className="sheet-chips-grid">
              <button 
                type="button"
                className={`sheet-chip ${!selectedCategory ? 'active' : ''}`}
                onClick={() => onSelectCategory('')}
              >
                {isAr ? 'الكل' : 'Toutes'}
              </button>
              {categories.map(c => (
                <button 
                  key={c.id}
                  type="button"
                  className={`sheet-chip ${selectedCategory === c.id ? 'active' : ''}`}
                  onClick={() => onSelectCategory(selectedCategory === c.id ? '' : c.id)}
                >
                  {c.icon || '💎'} {(isAr && c.nom_ar) ? c.nom_ar : (c.nom_fr || c.nom)}
                </button>
              ))}
            </div>
          </div>

          {/* 8. État du bijou */}
          <div className="sheet-filter-group">
            <label className="sheet-filter-label">{isAr ? 'حالة القطعة' : 'État du bijou'}</label>
            <div className="sheet-chips-grid">
              {[
                { id: 'ALL', label: isAr ? 'الكل' : 'Tous' },
                { id: 'Neuf', label: isAr ? 'جديد' : 'Neuf' },
                { id: 'Comme neuf', label: isAr ? 'كالجديد' : 'Comme neuf' },
                { id: 'Excellent état', label: isAr ? 'حالة ممتازة' : 'Excellent état' },
                { id: 'Très bon état', label: isAr ? 'حالة جيدة جداً' : 'Très bon état' }
              ].map(cond => (
                <button 
                  key={cond.id}
                  type="button"
                  className={`sheet-chip ${selectedCondition === cond.id ? 'active' : ''}`}
                  onClick={() => onSelectCondition(cond.id)}
                >
                  {cond.label}
                </button>
              ))}
            </div>
          </div>

          {/* 9. Tri */}
          <div className="sheet-filter-group">
            <label className="sheet-filter-label">{isAr ? 'ترتيب النتائج حسب' : 'Trier les annonces par'}</label>
            <select 
              value={sortBy}
              onChange={e => onChangeSortBy(e.target.value)}
              className="sheet-select-input"
            >
              <option value="newest">{isAr ? '🕒 الأحدث أولاً (من الأحدث إلى الأقدم)' : '🕒 Plus récents d\'abord'}</option>
              <option value="popular">{isAr ? '⭐ الأكثر شعبية' : '⭐ Popularité & Favoris'}</option>
              <option value="price_asc">{isAr ? '💰 السعر: الأقل أولاً' : '💰 Prix croissant (Moins cher)'}</option>
              <option value="price_desc">{isAr ? '💎 السعر: الأعلى أولاً' : '💎 Prix décroissant (Luxe d\'abord)'}</option>
              <option value="rating">{isAr ? '🏆 أفضل تقييمات التجار' : '🏆 Meilleures notes vendeurs'}</option>
            </select>
          </div>
        </div>

        {/* Sticky Apply Button at Bottom */}
        <div className="filter-sheet-footer">
          <button className="sheet-apply-btn" onClick={onClose} type="button">
            <span>{isAr ? `عرض ${totalResultsCount} قطعة متوفرة` : `Afficher les ${totalResultsCount} annonces`}</span>
            <span className="apply-arrow">{isAr ? '‹' : '➔'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
