import React, { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { ALL_MOROCCAN_CITIES } from '../../utils/moroccanCities';

const ALL_CITIES_OPTION = {
  key: '',
  fr: 'Toutes les villes',
  ar: 'كل المدن',
  regionFr: 'Maroc entier',
  regionAr: 'المغرب بأكمله',
  count: '100+'
};

const MOROCCAN_CITIES = [
  ALL_CITIES_OPTION,
  ...ALL_MOROCCAN_CITIES.map(c => ({
    key: c.key,
    fr: c.fr,
    ar: c.ar,
    regionFr: c.regionFr,
    regionAr: c.regionAr,
    count: '10+'
  }))
];

export default function MobileCityPicker({ isOpen, onClose, selectedCity, onSelectCity }) {
  const [search, setSearch] = useState('');
  const { lang } = useLanguage();
  const isAr = lang === 'ar';

  if (!isOpen) return null;

  const filteredCities = MOROCCAN_CITIES.filter(c => 
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
            const isSelected = (selectedCity === city.fr) || (selectedCity === city.ar) || (selectedCity === city.key) || (!selectedCity && isAll);
            return (
              <div 
                key={city.key || city.fr}
                className={`city-list-item ${isSelected ? 'active' : ''}`}
                onClick={() => {
                  onSelectCity(isAll ? '' : (isAr ? city.ar : city.fr));
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
                  <span className="city-item-count">{city.count} {isAr ? 'إعلان' : 'annonces'}</span>
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
