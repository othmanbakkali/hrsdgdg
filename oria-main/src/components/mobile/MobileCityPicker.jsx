import React, { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';

const MOROCCAN_CITIES = [
  { name: 'Toutes les villes', nameAr: 'كل المدن', region: 'Maroc entier', regionAr: 'المغرب بأكمله', count: '100+' },
  { name: 'Casablanca', nameAr: 'الدار البيضاء', region: 'Grand Casablanca', regionAr: 'جهة الدار البيضاء - سطات', count: '48' },
  { name: 'Rabat', nameAr: 'الرباط', region: 'Rabat-Salé-Kénitra', regionAr: 'الرباط - سلا - القنيطرة', count: '32' },
  { name: 'Marrakech', nameAr: 'مراكش', region: 'Marrakech-Safi', regionAr: 'مراكش - آسفي', count: '29' },
  { name: 'Tanger', nameAr: 'طنجة', region: 'Tanger-Tétouan-Al Hoceïma', regionAr: 'طنجة - تطوان - الحسيمة', count: '24' },
  { name: 'Fès', nameAr: 'فاس', region: 'Fès-Meknès', regionAr: 'فاس - مكناس', count: '18' },
  { name: 'Agadir', nameAr: 'أكادير', region: 'Souss-Massa', regionAr: 'سوس - ماسة', count: '16' },
  { name: 'Meknès', nameAr: 'مكناس', region: 'Fès-Meknès', regionAr: 'فاس - مكناس', count: '12' },
  { name: 'Oujda', nameAr: 'وجدة', region: 'Oriental', regionAr: 'الجهة الشرقية', count: '9' },
  { name: 'Kénitra', nameAr: 'القنيطرة', region: 'Rabat-Salé-Kénitra', regionAr: 'الرباط - سلا - القنيطرة', count: '11' },
  { name: 'Tétouan', nameAr: 'تطوان', region: 'Tanger-Tétouan', regionAr: 'طنجة - تطوان', count: '8' },
  { name: 'El Jadida', nameAr: 'الجديدة', region: 'Casablanca-Settat', regionAr: 'الدار البيضاء - سطات', count: '7' },
  { name: 'Nador', nameAr: 'الناظور', region: 'Oriental', regionAr: 'الجهة الشرقية', count: '6' },
  { name: 'Mohammédia', nameAr: 'المحمدية', region: 'Casablanca-Settat', regionAr: 'الدار البيضاء - سطات', count: '8' },
  { name: 'Béni Mellal', nameAr: 'بني ملال', region: 'Béni Mellal-Khénifra', regionAr: 'بني ملال - خنيفرة', count: '5' }
];

export default function MobileCityPicker({ isOpen, onClose, selectedCity, onSelectCity }) {
  const [search, setSearch] = useState('');
  const { lang } = useLanguage();
  const isAr = lang === 'ar';

  if (!isOpen) return null;

  const filteredCities = MOROCCAN_CITIES.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) || 
    c.nameAr.includes(search) ||
    c.region.toLowerCase().includes(search.toLowerCase()) ||
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
            const cityName = isAr ? city.nameAr : city.name;
            const isAll = city.name === 'Toutes les villes';
            const isSelected = (selectedCity === city.name) || (selectedCity === city.nameAr) || (!selectedCity && isAll);
            return (
              <div 
                key={city.name}
                className={`city-list-item ${isSelected ? 'active' : ''}`}
                onClick={() => {
                  onSelectCity(isAll ? '' : (isAr ? city.nameAr : city.name));
                  onClose();
                }}
              >
                <div className="city-item-info">
                  <span className="city-item-icon">{isAll ? '🇲🇦' : '📍'}</span>
                  <div>
                    <strong className="city-item-name">{cityName}</strong>
                    <span className="city-item-region">{isAr ? city.regionAr : city.region}</span>
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
