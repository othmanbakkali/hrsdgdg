import React, { useState } from 'react';

const MOROCCAN_CITIES = [
  { name: 'Toutes les villes', region: 'Maroc entier', count: '100+' },
  { name: 'Casablanca', region: 'Grand Casablanca', count: '48' },
  { name: 'Rabat', region: 'Rabat-Salé-Kénitra', count: '32' },
  { name: 'Marrakech', region: 'Marrakech-Safi', count: '29' },
  { name: 'Tanger', region: 'Tanger-Tétouan-Al Hoceïma', count: '24' },
  { name: 'Fès', region: 'Fès-Meknès', count: '18' },
  { name: 'Agadir', region: 'Souss-Massa', count: '16' },
  { name: 'Meknès', region: 'Fès-Meknès', count: '12' },
  { name: 'Oujda', region: 'Oriental', count: '9' },
  { name: 'Kénitra', region: 'Rabat-Salé-Kénitra', count: '11' },
  { name: 'Tétouan', region: 'Tanger-Tétouan', count: '8' },
  { name: 'El Jadida', region: 'Casablanca-Settat', count: '7' },
  { name: 'Nador', region: 'Oriental', count: '6' },
  { name: 'Mohammédia', region: 'Casablanca-Settat', count: '8' },
  { name: 'Béni Mellal', region: 'Béni Mellal-Khénifra', count: '5' }
];

export default function MobileCityPicker({ isOpen, onClose, selectedCity, onSelectCity }) {
  const [search, setSearch] = useState('');

  if (!isOpen) return null;

  const filteredCities = MOROCCAN_CITIES.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) || 
    c.region.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="jewelia-modal-backdrop mobile-sheet-backdrop" onClick={onClose}>
      <div className="mobile-bottom-sheet" onClick={e => e.stopPropagation()}>
        {/* Drag Handle */}
        <div className="sheet-drag-handle" />

        {/* Sheet Header */}
        <div className="sheet-header">
          <div>
            <h3 className="sheet-title">📍 Choisir une ville</h3>
            <p className="sheet-subtitle">Trouvez les bijoux disponibles près de chez vous au Maroc</p>
          </div>
          <button className="sheet-close-btn" onClick={onClose}>✕</button>
        </div>

        {/* Search City Input */}
        <div className="city-search-box">
          <span className="city-search-icon">🔍</span>
          <input 
            type="text"
            placeholder="Rechercher une ville (ex: Casablanca, Marrakech...)"
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
            const isSelected = (selectedCity === city.name) || (!selectedCity && city.name === 'Toutes les villes');
            return (
              <div 
                key={city.name}
                className={`city-list-item ${isSelected ? 'active' : ''}`}
                onClick={() => {
                  onSelectCity(city.name === 'Toutes les villes' ? '' : city.name);
                  onClose();
                }}
              >
                <div className="city-item-info">
                  <span className="city-item-icon">{city.name === 'Toutes les villes' ? '🇲🇦' : '📍'}</span>
                  <div>
                    <strong className="city-item-name">{city.name}</strong>
                    <span className="city-item-region">{city.region}</span>
                  </div>
                </div>
                <div className="city-item-right">
                  <span className="city-item-count">{city.count} annonces</span>
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
