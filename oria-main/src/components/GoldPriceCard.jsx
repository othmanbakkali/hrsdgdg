import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { API_URL } from '../config/api';
import SilverIcon from './SilverIcon';

export default function GoldPriceCard({ onOpenHistoryModal }) {
  const { lang, isRtl } = useLanguage();
  const isAr = lang === 'ar';

  const [price18k, setPrice18k] = useState(1045);
  const [priceSilver, setPriceSilver] = useState(14.50);
  const [change, setChange] = useState('+0.7%');
  const [currentDateObj, setCurrentDateObj] = useState(() => new Date());

  useEffect(() => {
    fetch(`${API_URL}/gold-rates`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          if (data.currentPrice18k) setPrice18k(data.currentPrice18k);
          if (data.currentPriceSilver) setPriceSilver(data.currentPriceSilver);
          if (data.history && data.history.length > 0) {
            setChange(data.history[data.history.length - 1].change || '+0.7%');
          }
        }
      })
      .catch(() => setPrice18k(1045));

    // Real-time ticking clock with seconds
    const timer = setInterval(() => {
      setCurrentDateObj(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const dateStr = isAr
    ? currentDateObj.toLocaleDateString('ar-MA-u-nu-latn', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
    : currentDateObj.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  const timeStr = currentDateObj.toLocaleTimeString('fr-FR', { hour12: false });

  return (
    <aside 
      aria-label={isAr ? "أسعار الذهب والفضة الحية اليوم" : "Cours officiel en direct de l'Or 18K et de l'Argent"}
      className="gold-luxury-card-widget"
      onClick={onOpenHistoryModal}
      role="button"
      tabIndex={0}
      style={{
        width: '100%',
        maxWidth: '960px',
        margin: '8px auto 18px',
        background: 'linear-gradient(155deg, #161922 0%, #0d0f15 100%)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '20px',
        padding: '18px 22px',
        boxShadow: '0 16px 36px rgba(0, 0, 0, 0.55), 0 0 25px rgba(245, 176, 39, 0.08)',
        display: 'flex',
        flexDirection: 'column',
        gap: '14px',
        cursor: 'pointer',
        direction: isRtl ? 'rtl' : 'ltr',
        boxSizing: 'border-box',
        transition: 'transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease',
        userSelect: 'none',
        position: 'relative',
        overflow: 'hidden'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.borderColor = 'rgba(245, 176, 39, 0.35)';
        e.currentTarget.style.boxShadow = '0 20px 42px rgba(0, 0, 0, 0.65), 0 0 32px rgba(245, 176, 39, 0.15)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
        e.currentTarget.style.boxShadow = '0 16px 36px rgba(0, 0, 0, 0.55), 0 0 25px rgba(245, 176, 39, 0.08)';
      }}
    >
      {/* Ambient background glows */}
      <div 
        style={{
          position: 'absolute',
          top: '-25%',
          right: isRtl ? '5%' : 'auto',
          left: isRtl ? 'auto' : '5%',
          width: '260px',
          height: '180px',
          background: 'radial-gradient(circle, rgba(245, 176, 39, 0.14) 0%, rgba(0,0,0,0) 70%)',
          pointerEvents: 'none'
        }}
      />
      <div 
        style={{
          position: 'absolute',
          bottom: '-30%',
          left: isRtl ? '5%' : 'auto',
          right: isRtl ? 'auto' : '5%',
          width: '260px',
          height: '180px',
          background: 'radial-gradient(circle, rgba(203, 213, 225, 0.12) 0%, rgba(0,0,0,0) 70%)',
          pointerEvents: 'none'
        }}
      />

      {/* Top Header Row: Live Date, Time & Market Status Badge */}
      <div style={{
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '10px',
        paddingBottom: '12px',
        borderBottom: '1px solid rgba(255, 255, 255, 0.07)',
        position: 'relative',
        zIndex: 2
      }}>
        {/* Date & Monospace Live Time */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          flexWrap: 'wrap'
        }}>
          <div style={{
            fontSize: '0.84rem',
            color: '#e2e8f0',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            <span>🗓️</span>
            <span>{dateStr}</span>
          </div>
          <div 
            dir="ltr"
            style={{
              fontSize: '0.82rem',
              color: '#94a3b8',
              fontWeight: 700,
              fontFamily: 'monospace, monospace',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              padding: '2px 8px',
              borderRadius: '6px',
              letterSpacing: '0.5px'
            }}
          >
            {timeStr}
          </div>
        </div>

        {/* Live Market Status Pill */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '7px',
          padding: '4px 12px',
          background: 'rgba(16, 185, 129, 0.1)',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          borderRadius: '9999px',
          fontSize: '0.76rem',
          fontWeight: 700,
          color: '#34d399'
        }}>
          <span style={{
            width: '7px',
            height: '7px',
            borderRadius: '50%',
            backgroundColor: '#10b981',
            boxShadow: '0 0 8px #10b981',
            display: 'inline-block'
          }} />
          <span>{isAr ? 'السوق المباشر • آخر تحديث' : 'Marché en direct • Dernière mise à jour'}</span>
        </div>
      </div>

      {/* Dual Metal Showcase Grid: GOLD first, then SILVER */}
      <div 
        className="precious-metals-grid"
        style={{
          width: '100%',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '16px',
          position: 'relative',
          zIndex: 2
        }}
      >
        {/* 1. PRIMARY HIGHLIGHT: GOLD 18K (ذهب 18 قيراط) */}
        <div 
          className="metal-card gold-metal-card"
          onClick={(e) => {
            e.stopPropagation();
            if (onOpenHistoryModal) onOpenHistoryModal('gold');
          }}
          style={{
            background: 'linear-gradient(145deg, rgba(38, 30, 14, 0.65) 0%, rgba(18, 20, 27, 0.9) 100%)',
            border: '1.5px solid rgba(245, 176, 39, 0.35)',
            borderRadius: '16px',
            padding: '14px 18px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            gap: '12px',
            position: 'relative',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(245, 176, 39, 0.25)',
            transition: 'border-color 0.2s ease, transform 0.2s ease',
            cursor: 'pointer'
          }}
        >
          {/* Top Metal Badge & Hallmark */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '8px'
          }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: 'rgba(245, 176, 39, 0.15)',
              border: '1px solid rgba(245, 176, 39, 0.35)',
              borderRadius: '8px',
              padding: '3px 10px',
              color: '#f6b22b',
              fontWeight: 800,
              fontSize: '0.78rem',
              letterSpacing: '0.3px'
            }}>
              <span>🏆</span>
              <span>{isAr ? 'ذهب 18 قيراط (750‰)' : 'Or 18 Karats (750‰)'}</span>
            </div>

            {/* Daily Trend Pill */}
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '2px 8px',
              borderRadius: '6px',
              fontSize: '0.74rem',
              fontWeight: 800,
              background: 'rgba(16, 185, 129, 0.15)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              color: '#10b981'
            }}>
              ▲ {change} {isAr ? 'اليوم' : 'Aujourd\'hui'}
            </span>
          </div>

          {/* Center: 3D Gold Bars + Big Gold Price */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '14px',
            padding: '4px 0'
          }}>
            {/* Visual Graphic & Subtitle */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <img 
                src="/gold-bars-perfect.png" 
                alt="Lingots d'or 18K"
                style={{
                  width: '92px',
                  height: 'auto',
                  display: 'block',
                  filter: 'drop-shadow(0 4px 14px rgba(245, 176, 39, 0.35))',
                  pointerEvents: 'none'
                }}
              />
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{
                  fontSize: '0.74rem',
                  color: '#cbd5e1',
                  fontWeight: 600,
                  maxWidth: '120px',
                  lineHeight: 1.3
                }}>
                  {isAr ? 'المعيار الرسمي للصياغة بالمغرب' : 'Standard officiel de joaillerie'}
                </span>
              </div>
            </div>

            {/* Price Column */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: isRtl ? 'flex-start' : 'flex-end',
              justifyContent: 'center'
            }}>
              <span style={{
                fontSize: '0.76rem',
                color: '#94a3b8',
                fontWeight: 600,
                marginBottom: '2px'
              }}>
                {isAr ? 'ابتداءً من' : 'à partir de'}
              </span>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                <span style={{
                  fontSize: '2.7rem',
                  fontWeight: 900,
                  color: '#f6b22b',
                  lineHeight: 1,
                  letterSpacing: '-1px',
                  textShadow: '0 0 25px rgba(246, 178, 43, 0.45)',
                  fontFamily: 'system-ui, -apple-system, sans-serif'
                }}>
                  {price18k}
                </span>
                <span style={{
                  fontSize: '0.95rem',
                  fontWeight: 700,
                  color: '#d4af37'
                }}>
                  {isAr ? 'د.م/غ' : 'MAD/g'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 2. SECONDARY HIGHLIGHT: SILVER 1000 (فضة عيار 1000) */}
        <div 
          className="metal-card silver-metal-card"
          onClick={(e) => {
            e.stopPropagation();
            if (onOpenHistoryModal) onOpenHistoryModal('silver');
          }}
          style={{
            background: 'linear-gradient(145deg, rgba(28, 34, 48, 0.65) 0%, rgba(16, 18, 25, 0.9) 100%)',
            border: '1.5px solid rgba(203, 213, 225, 0.35)',
            borderRadius: '16px',
            padding: '14px 18px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            gap: '12px',
            position: 'relative',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
            transition: 'border-color 0.2s ease, transform 0.2s ease',
            cursor: 'pointer'
          }}
        >
          {/* Top Metal Badge & Hallmark */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '8px'
          }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: 'rgba(203, 213, 225, 0.15)',
              border: '1px solid rgba(203, 213, 225, 0.35)',
              borderRadius: '8px',
              padding: '3px 10px',
              color: '#e2e8f0',
              fontWeight: 800,
              fontSize: '0.78rem',
              letterSpacing: '0.3px'
            }}>
              <SilverIcon size={16} />
              <span>{isAr ? 'فضة 1000 نقية (Ag 1000)' : 'Argent Pur 1000‰ (Ag 1000)'}</span>
            </div>

            {/* Purity Hallmark Tag */}
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '2px 8px',
              borderRadius: '6px',
              fontSize: '0.74rem',
              fontWeight: 800,
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              color: '#cbd5e1'
            }}>
              🛡️ {isAr ? 'نقاوة 100%' : 'Pureté 999.9'}
            </span>
          </div>

          {/* Center: 3D Silver Bars + Big Silver Price */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '14px',
            padding: '4px 0'
          }}>
            {/* Visual Graphic & Subtitle */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <img 
                src="/silver-bars-perfect.jpg" 
                alt="Lingots d'argent pur 1000"
                style={{
                  width: '84px',
                  height: '56px',
                  objectFit: 'cover',
                  borderRadius: '10px',
                  display: 'block',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  filter: 'drop-shadow(0 4px 14px rgba(203, 213, 225, 0.25))',
                  pointerEvents: 'none'
                }}
              />
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{
                  fontSize: '0.74rem',
                  color: '#cbd5e1',
                  fontWeight: 600,
                  maxWidth: '120px',
                  lineHeight: 1.3
                }}>
                  {isAr ? 'عيار الفضة الصافية المعتمد' : 'Standard officiel argent pur'}
                </span>
              </div>
            </div>

            {/* Price Column */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: isRtl ? 'flex-start' : 'flex-end',
              justifyContent: 'center'
            }}>
              <span style={{
                fontSize: '0.76rem',
                color: '#94a3b8',
                fontWeight: 600,
                marginBottom: '2px'
              }}>
                {isAr ? 'السعر الرسمي' : 'Cours officiel'}
              </span>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                <span style={{
                  fontSize: '2.7rem',
                  fontWeight: 900,
                  color: '#f8fafc',
                  lineHeight: 1,
                  letterSpacing: '-1px',
                  textShadow: '0 0 25px rgba(248, 250, 252, 0.45)',
                  fontFamily: 'system-ui, -apple-system, sans-serif'
                }}>
                  {typeof priceSilver === 'number' ? priceSilver.toFixed(2) : priceSilver}
                </span>
                <span style={{
                  fontSize: '0.95rem',
                  fontWeight: 700,
                  color: '#94a3b8'
                }}>
                  {isAr ? 'د.م/غ' : 'MAD/g'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer / Quick Actions Row */}
      <div style={{
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '10px',
        paddingTop: '6px',
        position: 'relative',
        zIndex: 2
      }}>
        {/* Market Notice info */}
        <span style={{
          fontSize: '0.76rem',
          color: '#94a3b8',
          display: 'flex',
          alignItems: 'center',
          gap: '6px'
        }}>
          <span>💡</span>
          <span>{isAr ? 'الأسعار تحدث بانتظام وفق تداولات السوق المغربي للصياغة' : 'Cotations actualisées selon les cours de référence au Maroc'}</span>
        </span>

        {/* Interactive History Button */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onOpenHistoryModal();
          }}
          style={{
            background: 'linear-gradient(135deg, #d4af37 0%, #aa7c11 100%)',
            color: '#0a0a0d',
            border: 'none',
            borderRadius: '10px',
            padding: '7px 16px',
            fontSize: '0.82rem',
            fontWeight: 800,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '7px',
            boxShadow: '0 4px 14px rgba(212, 175, 55, 0.35)',
            transition: 'transform 0.2s ease, box-shadow 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-1px)';
            e.currentTarget.style.boxShadow = '0 6px 18px rgba(212, 175, 55, 0.55)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 4px 14px rgba(212, 175, 55, 0.35)';
          }}
        >
          <span>📈</span>
          <span>{isAr ? 'سجل أسعار الذهب والفضة' : 'Historique des Cours'}</span>
        </button>
      </div>
    </aside>
  );
}
