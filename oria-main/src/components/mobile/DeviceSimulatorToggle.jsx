import React from 'react';
import { useLanguage } from '../../context/LanguageContext';

export default function DeviceSimulatorToggle({ isMobileSimulator, onToggleSimulator, className = '' }) {
  const { lang } = useLanguage();

  return (
    <div className={`device-simulator-floating-bar ${className}`}>
      <div className="simulator-toggle-inner">
        <span className="simulator-label">{lang === 'ar' ? 'العرض :' : 'Expérience :'}</span>
        <button 
          className={`simulator-btn ${!isMobileSimulator ? 'active' : ''}`}
          onClick={() => onToggleSimulator(false)}
        >
          {lang === 'ar' ? '💻 كمبيوتر' : '💻 Bureau'}
        </button>
        <button 
          className={`simulator-btn ${isMobileSimulator ? 'active' : ''}`}
          onClick={() => onToggleSimulator(true)}
        >
          {lang === 'ar' ? '📱 هاتف' : '📱 Mobile Avito'}
        </button>
      </div>
    </div>
  );
}
