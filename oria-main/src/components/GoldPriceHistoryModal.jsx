import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { API_URL } from '../config/api';

export default function GoldPriceHistoryModal({ isOpen, onClose, onOpenSellModal }) {
  const { lang, isRtl } = useLanguage();
  const isAr = lang === 'ar';

  const [goldData, setGoldData] = useState({
    currentPrice18k: 1045,
    carat: '18K',
    unit: 'MAD/g',
    lastUpdated: '',
    history: []
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setIsLoading(true);
    fetch(`${API_URL}/gold-rates`)
      .then(res => res.json())
      .then(data => {
        if (data.success && data.currentPrice18k) {
          setGoldData(data);
        }
      })
      .catch(err => console.error('Failed to fetch gold rates:', err))
      .finally(() => setIsLoading(false));
  }, [isOpen]);

  if (!isOpen) return null;

  const currentPrice = goldData.currentPrice18k || 1045;

  const historyList = (goldData.history && goldData.history.length > 0)
    ? goldData.history
    : [
        { id: '1', date: '15/09', price18k: 1010, change: '+0.5%', source: isAr ? 'تحديد الدار البيضاء' : 'Fixation Casablanca', note: isAr ? 'السعر الصباحي الافتتاحي' : 'Cours matinal' },
        { id: '2', date: '17/09', price18k: 1025, change: '+1.5%', source: isAr ? 'السوق الوطني للذهب' : 'Marché national', note: isAr ? 'طلب متزايد على الصياغة' : 'Forte demande' },
        { id: '3', date: '19/09', price18k: 1038, change: '+1.3%', source: isAr ? 'بورصة الذهب المعتمدة' : 'Bourse de référence', note: isAr ? 'اتجاه تصاعدي في السوق' : 'Hausse continue' },
        { id: '4', date: '20/09', price18k: 1045, change: '+0.7%', source: isAr ? 'السعر الرسمي للإغلاق' : 'Cours officiel clôture', note: isAr ? 'السعر الرسمي المعتمد اليوم' : 'Cours actuel du jour' }
      ];

  const formatSource = (src) => {
    if (!src) return isAr ? 'سوق الذهب المغربي' : 'Marché Maroc';
    if (isAr) {
      const map = {
        'Fixation Casablanca': 'تحديد الدار البيضاء',
        'Marché national': 'السوق الوطني للذهب',
        'Bourse de référence': 'بورصة الذهب المعتمدة',
        'Cours officiel de clôture': 'السعر الرسمي للإغلاق',
        'Cours officiel clôture': 'السعر الرسمي للإغلاق',
        'Fixation Officielle Maroc': 'السعر الرسمي المحدد بالمغرب',
        'Marché Maroc': 'سوق الذهب المغربي'
      };
      return map[src] || src;
    }
    const reverseMap = {
      'تحديد الدار البيضاء': 'Fixation Casablanca',
      'السوق الوطني للذهب': 'Marché national',
      'بورصة الذهب المعتمدة': 'Bourse de référence',
      'السعر الرسمي للإغلاق': 'Cours officiel de clôture',
      'السعر الرسمي المحدد بالمغرب': 'Fixation Officielle Maroc',
      'سوق الذهب المغربي': 'Marché Maroc'
    };
    return reverseMap[src] || src;
  };

  const formatNote = (nt) => {
    if (!nt || nt === '-') return '-';
    if (isAr) {
      const map = {
        'Cours matinal': 'السعر الصباحي الافتتاحي',
        'Forte demande joaillerie': 'طلب متزايد على الصياغة',
        'Forte demande': 'طلب متزايد على الصياغة',
        'Tendance haussière': 'اتجاه تصاعدي في السوق',
        'Hausse continue': 'اتجاه تصاعدي في السوق',
        'Cours actuel du jour': 'السعر الرسمي المعتمد اليوم',
        'Validation 18K': 'تأكيد سعر عيار 18',
        'Mise à jour régulière': 'تحديث دوري معتمد'
      };
      return map[nt] || nt;
    }
    const reverseMap = {
      'السعر الصباحي الافتتاحي': 'Cours matinal',
      'طلب متزايد على الصياغة': 'Forte demande joaillerie',
      'اتجاه تصاعدي في السوق': 'Tendance haussière',
      'السعر الرسمي المعتمد اليوم': 'Cours actuel du jour',
      'تأكيد سعر عيار 18': 'Validation 18K',
      'تحديث دوري معتمد': 'Mise à jour régulière'
    };
    return reverseMap[nt] || nt;
  };

  const prices = historyList.map(h => h.price18k || 1045);
  const minPrice = Math.min(...prices) * 0.99;
  const maxPrice = Math.max(...prices) * 1.01;
  const range = maxPrice - minPrice || 1;

  const svgWidth = 460;
  const svgHeight = 140;
  const padX = 35;
  const padY = 22;

  const points = historyList.map((h, i) => {
    const x = padX + (i / Math.max(historyList.length - 1, 1)) * (svgWidth - 2 * padX);
    const p = h.price18k || 1045;
    const y = svgHeight - padY - ((p - minPrice) / range) * (svgHeight - 2 * padY);
    return { x, y, price: p, date: h.date?.split(' ')[0] || h.date };
  });

  const polylinePoints = points.map(pt => `${pt.x},${pt.y}`).join(' ');

  return (
    <div 
      className="gold-modal-backdrop"
      onClick={onClose}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(5, 7, 15, 0.85)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        direction: isRtl ? 'rtl' : 'ltr',
        boxSizing: 'border-box'
      }}
    >
      <div 
        className="gold-modal-container"
        onClick={e => e.stopPropagation()}
        style={{
          background: 'linear-gradient(170deg, #161724 0%, #0d0e18 100%)',
          border: '1.5px solid rgba(212, 175, 55, 0.4)',
          borderRadius: '24px',
          width: '100%',
          maxWidth: '680px',
          maxHeight: '92vh',
          overflowY: 'auto',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7), 0 0 35px rgba(212, 175, 55, 0.15)',
          padding: '28px',
          color: '#ffffff',
          position: 'relative',
          boxSizing: 'border-box'
        }}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          type="button"
          style={{
            position: 'absolute',
            top: '20px',
            [isRtl ? 'left' : 'right']: '20px',
            background: 'rgba(255, 255, 255, 0.08)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            color: '#fff',
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.1rem',
            zIndex: 10,
            transition: 'all 0.2s'
          }}
          title={isAr ? 'إغلاق' : 'Fermer'}
        >
          ✕
        </button>

        {/* Modal Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '22px', paddingBottom: '16px', borderBottom: '1px solid rgba(212, 175, 55, 0.2)' }}>
          <div style={{
            width: '52px',
            height: '52px',
            borderRadius: '16px',
            background: 'linear-gradient(135deg, #d4af37 0%, #996515 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.8rem',
            boxShadow: '0 6px 18px rgba(212, 175, 55, 0.35)',
            flexShrink: 0
          }}>
            🥇
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <h2 style={{ margin: 0, fontSize: '1.45rem', fontWeight: 800, color: '#fef3c7', fontFamily: 'Cinzel, Playfair Display, serif' }}>
                {isAr ? 'سعر الذهب عيار 18 قيراط وسجل التغييرات' : 'Cours Officiel & Historique de l\'Or 18K'}
              </h2>
              <span style={{
                background: 'rgba(16, 185, 129, 0.15)',
                color: '#10b981',
                padding: '3px 10px',
                borderRadius: '12px',
                fontSize: '0.72rem',
                fontWeight: 700,
                border: '1px solid rgba(16, 185, 129, 0.3)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px'
              }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981' }}></span>
                {isAr ? 'المعيار الرسمي بالمغرب' : 'Standard Officiel Maroc'}
              </span>
            </div>
            <p style={{ margin: '4px 0 0 0', fontSize: '0.82rem', color: '#94a3b8' }}>
              {isAr 
                ? 'متابعة حية لسعر غرام الذهب عيار 18 قيراط بالدرهم المغربي (MAD)' 
                : 'Cotation en direct du gramme d\'or 18 carats en Dirhams Marocains (MAD)'}
            </p>
          </div>
        </div>

        {/* Current Rate Hero Box (18K @ 1045 DH) */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.16) 0%, rgba(15, 23, 42, 0.6) 100%)',
          border: '1.5px solid rgba(212, 175, 55, 0.4)',
          borderRadius: '18px',
          padding: '20px 24px',
          marginBottom: '22px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
          boxShadow: '0 8px 24px rgba(212, 175, 55, 0.12)'
        }}>
          <div>
            <div style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--primary-gold)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>
              {isAr ? 'السعر الحالي للغرام (عيار 18)' : 'Prix Actuel au Gramme (Or 18K)'}
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
              <span style={{
                fontSize: '2.8rem',
                fontWeight: 900,
                fontFamily: 'system-ui, -apple-system, sans-serif',
                background: 'linear-gradient(180deg, #ffd700 0%, #f59e0b 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                filter: 'drop-shadow(0 2px 8px rgba(245, 158, 11, 0.4))'
              }}>
                {currentPrice}
              </span>
              <span style={{ fontSize: '1.1rem', fontWeight: 800, color: '#fef3c7' }}>
                {isAr ? 'درهم / غرام' : 'DH / gramme'}
              </span>
            </div>
          </div>

          <div style={{ textAlign: isRtl ? 'left' : 'right' }}>
            <span style={{
              display: 'inline-block',
              background: 'rgba(16, 185, 129, 0.2)',
              color: '#10b981',
              padding: '6px 14px',
              borderRadius: '8px',
              fontSize: '0.9rem',
              fontWeight: 800,
              border: '1px solid rgba(16, 185, 129, 0.35)',
              marginBottom: '6px'
            }}>
              ▲ +0.7% {isAr ? 'ارتفاع' : 'Hausse'}
            </span>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
              {isAr ? 'مستقر وموثوق للصياغة' : 'Cours de référence certifié'}
            </div>
          </div>
        </div>

        {/* Visual Trend Chart */}
        <div style={{
          background: 'rgba(0, 0, 0, 0.3)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '16px',
          padding: '16px 20px',
          marginBottom: '22px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#cbd5e1' }}>
              📈 {isAr ? 'المنحنى البياني لتطور سعر غرام عيار 18 مؤخراً' : 'Évolution récente du cours Or 18K'}
            </span>
            <span style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 700 }}>
              {isAr ? 'تطور إيجابي مستمر' : 'Tendance à la hausse'}
            </span>
          </div>

          <div style={{ width: '100%', overflowX: 'auto' }}>
            <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} style={{ width: '100%', height: 'auto', minWidth: '320px', display: 'block' }}>
              <defs>
                <linearGradient id="goldGradientArea18k" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#d4af37" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="#d4af37" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              <line x1="20" y1="30" x2={svgWidth - 20} y2="30" stroke="rgba(255,255,255,0.06)" strokeDasharray="4 4" />
              <line x1="20" y1="80" x2={svgWidth - 20} y2="80" stroke="rgba(255,255,255,0.06)" strokeDasharray="4 4" />
              <line x1="20" y1="120" x2={svgWidth - 20} y2="120" stroke="rgba(255,255,255,0.06)" strokeDasharray="4 4" />

              {points.length > 1 && (
                <polygon
                  points={`${points[0].x},${svgHeight - 15} ${polylinePoints} ${points[points.length - 1].x},${svgHeight - 15}`}
                  fill="url(#goldGradientArea18k)"
                />
              )}

              {points.length > 1 && (
                <polyline
                  points={polylinePoints}
                  fill="none"
                  stroke="#d4af37"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}

              {points.map((pt, idx) => (
                <g key={idx}>
                  <circle cx={pt.x} cy={pt.y} r="5" fill="#161724" stroke="#d4af37" strokeWidth="2.5" />
                  <text x={pt.x} y={pt.y - 10} fill="#fef3c7" fontSize="10.5" fontWeight="bold" textAnchor="middle">
                    {pt.price} DH
                  </text>
                  <text x={pt.x} y={svgHeight - 4} fill="#64748b" fontSize="9" textAnchor="middle">
                    {pt.date}
                  </text>
                </g>
              ))}
            </svg>
          </div>
        </div>

        {/* History Table (18K) */}
        <div style={{ marginBottom: '22px' }}>
          <h4 style={{ margin: '0 0 12px 0', fontSize: '1rem', color: '#fef3c7', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span>📜</span>
            <span>{isAr ? 'سجل التغييرات والتواريخ (عيار 18)' : 'Historique Chronologique des Variations (18K)'}</span>
          </h4>

          <div style={{ maxHeight: '180px', overflowY: 'auto', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem', textAlign: isRtl ? 'right' : 'left' }}>
              <thead>
                <tr style={{ background: 'rgba(255,255,255,0.05)', color: '#94a3b8' }}>
                  <th style={{ padding: '10px 14px' }}>{isAr ? 'التاريخ' : 'Date'}</th>
                  <th style={{ padding: '10px 14px' }}>{isAr ? 'السعر (د.م/غ)' : 'Prix 18K (DH/g)'}</th>
                  <th style={{ padding: '10px 14px' }}>{isAr ? 'التغير' : 'Variation'}</th>
                  <th style={{ padding: '10px 14px' }}>{isAr ? 'المصدر' : 'Source'}</th>
                  <th style={{ padding: '10px 14px' }}>{isAr ? 'ملاحظة' : 'Note'}</th>
                </tr>
              </thead>
              <tbody>
                {[...historyList].reverse().map((item, idx) => (
                  <tr key={item.id || idx} style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                    <td style={{ padding: '9px 14px', color: '#cbd5e1', fontWeight: 600 }} dir="ltr">{item.date}</td>
                    <td style={{ padding: '9px 14px', color: '#d4af37', fontWeight: 800, fontSize: '0.95rem' }} dir="ltr">{item.price18k || 1045} {isAr ? 'د.م' : 'DH'}</td>
                    <td style={{ padding: '9px 14px' }}>
                      <span dir="ltr" style={{
                        display: 'inline-block',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        fontSize: '0.72rem',
                        fontWeight: 800,
                        background: (item.change && item.change.startsWith('+')) ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.08)',
                        color: (item.change && item.change.startsWith('+')) ? '#10b981' : '#cbd5e1'
                      }}>
                        {item.change || '0.0%'}
                      </span>
                    </td>
                    <td style={{ padding: '9px 14px', color: '#cbd5e1', fontSize: '0.8rem', fontWeight: 500 }}>{formatSource(item.source)}</td>
                    <td style={{ padding: '9px 14px', color: '#94a3b8', fontSize: '0.8rem' }}>{formatNote(item.note)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
