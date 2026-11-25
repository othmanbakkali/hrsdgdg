import React, { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { ALL_MOROCCAN_CITIES, isSameCity } from '../../utils/moroccanCities';
import { matchProduct } from '../../utils/searchEngine';

const ALL_CITIES_OPTION = {
  key: '',
  fr: 'Toutes les villes',
  ar: 'كل المدن',
  regionFr: 'Maroc entier',
  regionAr: 'المغرب بأكمله',
};

export default function MobileCityPicker({ isOpen, onClose, selectedCity, onSelectCity, products = [], filters = {} }) {
  const [search, setSearch] = useState('');
  const { lang } = useLanguage();
  const isAr = lang === 'ar';

  if (!isOpen) return null;

  const cities = [ALL_CITIES_OPTION, ...ALL_MOROCCAN_CITIES];
  const productsMatchingFilters = products.filter(product => {
    if (filters.searchQuery && !matchProduct(product, filters.searchQuery)) return false;
    if (filters.saleUniverse === 'AUCTION') {
      if (product.disponibilite !== 'enchere' && product.type_vente !== 'AUCTION') return false;
    } else if (filters.saleUniverse && filters.saleUniverse !== 'ALL') {
      if (filters.saleUniverse === 'FIRST_HAND' && !(product.type_vente === 'FIRST_HAND' || (product.type_vente === 'direct' && product.etat === 'Neuf'))) return false;
      if (filters.saleUniverse === 'SECOND_HAND' && !(product.type_vente === 'SECOND_HAND' || (product.type_vente === 'direct' && product.etat !== 'Neuf') || product.type_vente === 'OCCASION')) return false;
    }
    if (filters.selectedCategory && product.category_id !== filters.selectedCategory) return false;
    if (filters.selectedMaterial && filters.selectedMaterial !== 'ALL' && (product.matiere || '').toLowerCase() !== filters.selectedMaterial.toLowerCase()) return false;
    if (filters.selectedCondition && filters.selectedCondition !== 'ALL' && product.etat !== filters.selectedCondition) return false;
    if (filters.selectedStyle && filters.selectedStyle !== 'ALL' && (product.style || '').toLowerCase() !== filters.selectedStyle.toLowerCase()) return false;
    if (filters.selectedOccasion && filters.selectedOccasion !== 'ALL' && (product.occasion || '').toLowerCase() !== filters.selectedOccasion.toLowerCase()) return false;
    if (filters.verifiedOnly && product.authentifie !== 'Vérifié') return false;
    if (filters.dealsOnly && (!product.ancien_prix || product.ancien_prix <= product.prix)) return false;
    if (Number.isFinite(filters.priceMax) && filters.priceMax < 35000 && product.prix > filters.priceMax) return false;
    return true;
  });
  const getCityCount = (city) => city === ALL_CITIES_OPTION
    ? productsMatchingFilters.length
    : productsMatchingFilters.filter(product => isSameCity(product.city || product.ville, city.key)).length;

  const filteredCities = cities.filter(c =>
    c.fr.toLowerCase().includes(search.toLowerCase()) || 
    c.ar.includes(search) ||
    c.regionFr.toLowerCase().includes(search.toLowerCase()) ||
    c.regionAr.includes(search)
  );

  return (
    <div className="jewelia-modal-backdrop mobile-sheet-backdrop" onClick={onClose}>
      <div className="mobile-bottom-sheet" onClick={e => e.stopPropagation()}>
        {/* Drag Handle */}
        <div className="sheet-drag-handle" />

        {/* Sheet Header */}
        <div className="sheet-header">
          <div>
            <h3 className="sheet-title">📍 {isAr ? 'اختر المدينة' : 'Choisir une ville'}</h3>
            <p className="sheet-subtitle">{isAr ? 'ابحث عن المجوهرات المتوفرة بالقرب منك في المغرب' : 'Trouvez les bijoux disponibles près de chez vous au Maroc'}</p>
          </div>
          <button className="sheet-close-btn" onClick={onClose}>✕</button>
        </div>

        {/* Search City Input */}
        <div className="city-search-box">
          <span className="city-search-icon">🔍</span>
          <input 
            type="text"
            placeholder={isAr ? "ابحث عن مدينة (مثال: الدار البيضاء، مراكش...)" : "Rechercher une ville (ex: Casablanca, Marrakech...)"}
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="city-search-input"
            autoFocus
          />
          {search && (
            <button className="city-search-clear" onClick={() => setSearch('')}>✕</button>
          )}
        </div>

        {/* Cities List */}
        <div className="cities-scroll-list">
          {filteredCities.map((city) => {
            const cityName = isAr ? city.ar : city.fr;
            const isAll = city.fr === 'Toutes les villes';
            const isSelected = isSameCity(selectedCity, city.key) || isSameCity(selectedCity, city.fr) || isSameCity(selectedCity, city.ar) || (!selectedCity && isAll);
            const count = getCityCount(city);
            return (
              <div 
                key={city.key || city.fr}
                className={`city-list-item ${isSelected ? 'active' : ''}`}
                onClick={() => {
                  onSelectCity(isAll ? '' : (city.key || city.fr));
                  onClose();
                }}
              >
                <div className="city-item-info">
                  <span className="city-item-icon">{isAll ? '🇲🇦' : '📍'}</span>
                  <div>
                    <strong className="city-item-name">{cityName}</strong>
                    <span className="city-item-region">{isAr ? city.regionAr : city.regionFr}</span>
                  </div>
                </div>
                <div className="city-item-right">
                  <span className="city-item-count">
                    {count === 0
                      ? (isAr ? 'لا توجد إعلانات' : 'Aucune annonce')
                      : `${count} ${isAr ? 'إعلان' : count > 1 ? 'annonces' : 'annonce'}`}
                  </span>
                  {isSelected && <span className="city-check">✓</span>}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
