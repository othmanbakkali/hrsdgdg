import React from 'react';

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
  onResetFilters,
  totalResultsCount = 0
}) {
  if (!isOpen) return null;

  return (
    <div className="jewelia-modal-backdrop mobile-sheet-backdrop" onClick={onClose}>
      <div className="mobile-bottom-sheet filter-sheet" onClick={e => e.stopPropagation()}>
        {/* Drag Handle */}
        <div className="sheet-drag-handle" />

        {/* Sheet Header */}
        <div className="sheet-header">
          <div>
            <h3 className="sheet-title">⚡ Filtres Avancés</h3>
            <p className="sheet-subtitle">Affinez votre recherche sur mesure</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button className="sheet-reset-btn" onClick={onResetFilters}>
              Réinitialiser
            </button>
            <button className="sheet-close-btn" onClick={onClose}>✕</button>
          </div>
        </div>

        {/* Scrollable Filter Options */}
        <div className="filter-sheet-body">
          {/* 1. Univers de vente */}
          <div className="sheet-filter-group">
            <label className="sheet-filter-label">Univers de Vente</label>
            <div className="sheet-chips-grid">
              <button 
                className={`sheet-chip ${saleUniverse === 'ALL' && !dealsOnly ? 'active' : ''}`}
                onClick={() => onSelectUniverse('ALL')}
              >
                💎 Tous les bijoux
              </button>
              <button 
                className={`sheet-chip first ${saleUniverse === 'FIRST_HAND' ? 'active' : ''}`}
                onClick={() => onSelectUniverse('FIRST_HAND')}
              >
                ✨ Première Main (Neuf)
              </button>
              <button 
                className={`sheet-chip second ${saleUniverse === 'SECOND_HAND' ? 'active' : ''}`}
                onClick={() => onSelectUniverse('SECOND_HAND')}
              >
                ♻️ Seconde Main (Occasion)
              </button>
            </div>
          </div>

          {/* 2. Ville sélectionnée */}
          <div className="sheet-filter-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <label className="sheet-filter-label" style={{ margin: 0 }}>📍 Localisation au Maroc</label>
              <button 
                onClick={onOpenCityPicker}
                className="sheet-link-btn"
              >
                Changer de ville ❯
              </button>
            </div>
            <div 
              className="sheet-city-pill-display"
              onClick={onOpenCityPicker}
            >
              <span>📍 {selectedCity || 'Toutes les villes du Maroc'}</span>
              <span style={{ color: 'var(--primary-gold)' }}>Modifier</span>
            </div>
          </div>

          {/* 3. Budget Max Slider */}
          <div className="sheet-filter-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <label className="sheet-filter-label" style={{ margin: 0 }}>Budget Maximum</label>
              <span className="sheet-price-tag">
                {priceMax.toLocaleString()} DH
              </span>
            </div>
            <input 
              type="range"
              min="500"
              max="35000"
              step="500"
              value={priceMax}
              onChange={e => onChangePriceMax(parseFloat(e.target.value))}
              className="sheet-range-slider"
            />
            <div className="range-min-max-labels">
              <span>500 DH</span>
              <span>15 000 DH</span>
              <span>35 000+ DH</span>
            </div>
          </div>

          {/* 4. Catégories */}
          <div className="sheet-filter-group">
            <label className="sheet-filter-label">Catégorie de Bijou</label>
            <div className="sheet-chips-grid">
              <button 
                className={`sheet-chip ${!selectedCategory ? 'active' : ''}`}
                onClick={() => onSelectCategory('')}
              >
                Toutes
              </button>
              {categories.map(c => (
                <button 
                  key={c.id}
                  className={`sheet-chip ${selectedCategory === c.id ? 'active' : ''}`}
                  onClick={() => onSelectCategory(selectedCategory === c.id ? '' : c.id)}
                >
                  {c.icon || '💎'} {c.nom_fr}
                </button>
              ))}
            </div>
          </div>

          {/* 5. Matière & Or */}
          <div className="sheet-filter-group">
            <label className="sheet-filter-label">Matière & Pureté</label>
            <div className="sheet-chips-grid">
              {[
                { id: 'ALL', label: 'Toutes' },
                { id: 'Or', label: '🥇 Or 18K / 24K' },
                { id: 'Argent', label: '🥈 Argent 925' },
                { id: 'Diamant', label: '💠 Diamant' },
                { id: 'Plaqué or', label: '✨ Plaqué or' }
              ].map(mat => (
                <button 
                  key={mat.id}
                  className={`sheet-chip ${selectedMaterial === mat.id ? 'active' : ''}`}
                  onClick={() => onSelectMaterial(mat.id)}
                >
                  {mat.label}
                </button>
              ))}
            </div>
          </div>

          {/* 6. État du bijou */}
          <div className="sheet-filter-group">
            <label className="sheet-filter-label">État du bijou</label>
            <div className="sheet-chips-grid">
              {[
                { id: 'ALL', label: 'Tous' },
                { id: 'Neuf', label: 'Neuf' },
                { id: 'Comme neuf', label: 'Comme neuf' },
                { id: 'Excellent état', label: 'Excellent état' },
                { id: 'Très bon état', label: 'Très bon état' }
              ].map(cond => (
                <button 
                  key={cond.id}
                  className={`sheet-chip ${selectedCondition === cond.id ? 'active' : ''}`}
                  onClick={() => onSelectCondition(cond.id)}
                >
                  {cond.label}
                </button>
              ))}
            </div>
          </div>

          {/* 7. Garanties & Badges */}
          <div className="sheet-filter-group">
            <label className="sheet-filter-label">Garanties & Confiance</label>
            <div className="sheet-toggles-list">
              <label className="sheet-toggle-item">
                <input 
                  type="checkbox" 
                  checked={verifiedOnly}
                  onChange={e => onToggleVerified(e.target.checked)}
                />
                <div className="toggle-text">
                  <strong>🛡️ Bijou Vérifié & Expertisé</strong>
                  <span>Contrôlé par un joaillier agréé avec poinçon d'État</span>
                </div>
              </label>

              <label className="sheet-toggle-item">
                <input 
                  type="checkbox" 
                  checked={dealsOnly}
                  onChange={e => onToggleDeals(e.target.checked)}
                />
                <div className="toggle-text">
                  <strong>🔥 Bonnes Affaires & Promotions</strong>
                  <span>Uniquement les annonces avec remise de prix</span>
                </div>
              </label>
            </div>
          </div>

          {/* 8. Tri */}
          <div className="sheet-filter-group">
            <label className="sheet-filter-label">Trier les annonces par</label>
            <select 
              value={sortBy}
              onChange={e => onChangeSortBy(e.target.value)}
              className="sheet-select-input"
            >
              <option value="popular">⭐ Popularité & Favoris</option>
              <option value="newest">🕒 Plus récents d'abord</option>
              <option value="price_asc">💰 Prix croissant (Moins cher)</option>
              <option value="price_desc">💎 Prix décroissant (Luxe d'abord)</option>
              <option value="rating">🏆 Meilleures notes vendeurs</option>
            </select>
          </div>
        </div>

        {/* Sticky Apply Button at Bottom */}
        <div className="filter-sheet-footer">
          <button className="sheet-apply-btn" onClick={onClose}>
            <span>Afficher les {totalResultsCount} annonces</span>
            <span className="apply-arrow">➔</span>
          </button>
        </div>
      </div>
    </div>
  );
}
