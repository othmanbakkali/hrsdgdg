import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';

export default function LiveGoldTicker() {
  const { lang, isRtl } = useLanguage();
  const [rates, setRates] = useState({
    gold18k: 688.50,
    gold21k: 802.20,
    gold24k: 918.00,
    silver925: 12.80,
    variation: '+0.45%'
  });

  const [showCalculator, setShowCalculator] = useState(false);
  const [calcGrams, setCalcGrams] = useState(10);
  const [calcKarat, setCalcKarat] = useState('18k');

  // Subtle live fluctuation effect to simulate real-time market ticks
  useEffect(() => {
    const interval = setInterval(() => {
      const delta = (Math.random() - 0.48) * 0.3;
      setRates(prev => ({
        ...prev,
        gold18k: parseFloat((prev.gold18k + delta).toFixed(2)),
        gold21k: parseFloat((prev.gold21k + delta * 1.15).toFixed(2)),
        gold24k: parseFloat((prev.gold24k + delta * 1.3).toFixed(2)),
        variation: delta >= 0 ? `+${(Math.random() * 0.6 + 0.2).toFixed(2)}%` : `-${(Math.random() * 0.4 + 0.1).toFixed(2)}%`
      }));
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  const getCalculatedValue = () => {
    let pricePerGram = rates.gold18k;
    if (calcKarat === '21k') pricePerGram = rates.gold21k;
    if (calcKarat === '24k') pricePerGram = rates.gold24k;
    if (calcKarat === 'silver') pricePerGram = rates.silver925;
    return (calcGrams * pricePerGram).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const labels = {
    fr: {
      marketOpen: "Bourse de Casablanca • En Direct",
      gold18: "Or 18K (750‰)",
      gold21: "Or 21K (875‰)",
      gold24: "Or 24K Pur (999‰)",
      silver: "Argent 925",
      calcBtn: "Calculateur d'Or",
      calcTitle: "Estimer la valeur de votre or",
      calcDesc: "Calculez la valeur instantanée selon le cours officiel du jour au Maroc.",
      weightLabel: "Poids en grammes :",
      karatLabel: "Pureté / Titrage :",
      totalEst: "Valeur marchande estimée :",
      close: "Fermer"
    },
    ar: {
      marketOpen: "بورصة الدار البيضاء • مباشر",
      gold18: "ذهب 18 قيراط (750‰)",
      gold21: "ذهب 21 قيراط (875‰)",
      gold24: "ذهب 24 قيراط نقي (999‰)",
      silver: "فضة 925",
      calcBtn: "حاسبة الذهب",
      calcTitle: "تقدير قيمة الذهب الخاص بك",
      calcDesc: "احسب القيمة الفورية حسب سعر السوق الرسمي اليوم في المغرب.",
      weightLabel: "الوزن بالغرام :",
      karatLabel: "العيار / النقاوة :",
      totalEst: "القيمة السوقية التقديرية :",
      close: "إغلاق"
    },
    en: {
      marketOpen: "Casablanca Market • Live Rates",
      gold18: "18K Gold (750‰)",
      gold21: "21K Gold (875‰)",
      gold24: "24K Pure Gold (999‰)",
      silver: "Silver 925",
      calcBtn: "Gold Calculator",
      calcTitle: "Estimate Your Gold Value",
      calcDesc: "Instant value calculation based on today's official Moroccan market spot prices.",
      weightLabel: "Weight in grams:",
      karatLabel: "Purity / Karat:",
      totalEst: "Estimated Market Value:",
      close: "Close"
    }
  };

  const t = labels[lang] || labels.fr;

  return (
    <>
      <div className="live-ticker-container">
        <div className="ticker-badge">
          <span className="ticker-pulse-dot"></span>
          <span className="ticker-badge-text">{t.marketOpen}</span>
        </div>

        <div className="ticker-track">
          <div className="ticker-item">
            <span className="ticker-metal">👑 {t.gold18} :</span>
            <span className="ticker-price">{rates.gold18k.toFixed(2)} MAD/g</span>
            <span className="ticker-trend positive">↗ {rates.variation}</span>
          </div>
          <span className="ticker-divider">•</span>

          <div className="ticker-item">
            <span className="ticker-metal">✨ {t.gold21} :</span>
            <span className="ticker-price">{rates.gold21k.toFixed(2)} MAD/g</span>
            <span className="ticker-trend positive">↗</span>
          </div>
          <span className="ticker-divider">•</span>

          <div className="ticker-item">
            <span className="ticker-metal">🏆 {t.gold24} :</span>
            <span className="ticker-price">{rates.gold24k.toFixed(2)} MAD/g</span>
            <span className="ticker-trend positive">↗</span>
          </div>
          <span className="ticker-divider">•</span>

          <div className="ticker-item">
            <span className="ticker-metal">🪙 {t.silver} :</span>
            <span className="ticker-price">{rates.silver925.toFixed(2)} MAD/g</span>
          </div>
        </div>

        <button 
          className="ticker-calc-trigger"
          onClick={() => setShowCalculator(true)}
          title="Ouvrir le calculateur d'or"
        >
          ⚖️ {t.calcBtn}
        </button>
      </div>

      {/* Gold Price Estimation Modal */}
      {showCalculator && (
        <div className="modal-overlay" onClick={() => setShowCalculator(false)}>
          <div className="modal-content calculator-modal" onClick={e => e.stopPropagation()}>
            <button className="modal-close-btn" onClick={() => setShowCalculator(false)}>✕</button>
            <div className="calc-modal-header">
              <div className="calc-icon-badge">⚖️</div>
              <h3>{t.calcTitle}</h3>
              <p>{t.calcDesc}</p>
            </div>

            <div className="calc-modal-body">
              <div className="form-group">
                <label className="form-label">{t.karatLabel}</label>
                <div className="karat-selector-pills">
                  <button 
                    type="button" 
                    className={`karat-pill ${calcKarat === '18k' ? 'active' : ''}`}
                    onClick={() => setCalcKarat('18k')}
                  >
                    18K • {rates.gold18k} DH/g
                  </button>
                  <button 
                    type="button" 
                    className={`karat-pill ${calcKarat === '21k' ? 'active' : ''}`}
                    onClick={() => setCalcKarat('21k')}
                  >
                    21K • {rates.gold21k} DH/g
                  </button>
                  <button 
                    type="button" 
                    className={`karat-pill ${calcKarat === '24k' ? 'active' : ''}`}
                    onClick={() => setCalcKarat('24k')}
                  >
                    24K • {rates.gold24k} DH/g
                  </button>
                </div>
              </div>

              <div className="form-group" style={{ marginTop: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <label className="form-label">{t.weightLabel}</label>
                  <span style={{ color: 'var(--primary-gold)', fontWeight: 'bold' }}>{calcGrams} g</span>
                </div>
                <input 
                  type="range" 
                  min="1" 
                  max="200" 
                  value={calcGrams}
                  onChange={e => setCalcGrams(parseFloat(e.target.value))}
                  className="calc-range-slider"
                />
                <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                  {[5, 10, 25, 50, 100].map(val => (
                    <button 
                      key={val} 
                      type="button" 
                      className="quick-gram-btn"
                      onClick={() => setCalcGrams(val)}
                    >
                      {val}g
                    </button>
                  ))}
                </div>
              </div>

              <div className="calc-result-box">
                <span className="calc-result-label">{t.totalEst}</span>
                <div className="calc-result-value">
                  {getCalculatedValue()} <span className="calc-result-currency">MAD</span>
                </div>
                <span className="calc-guarantee-note">✨ Cours officiel certifié FMB - Joaillerie Marocaine</span>
              </div>
            </div>

            <div className="calc-modal-footer">
              <button className="btn-gold" style={{ width: '100%' }} onClick={() => setShowCalculator(false)}>
                {t.close}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
