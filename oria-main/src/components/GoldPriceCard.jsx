import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { API_URL } from '../config/api';

export default function GoldPriceCard({ onOpenHistoryModal }) {
  const { lang, isRtl } = useLanguage();
  const isAr = lang === 'ar';

  const [price18k, setPrice18k] = useState(1045);
  const [change, setChange] = useState('+0.7%');

  const [currentDateObj, setCurrentDateObj] = useState(() => new Date());

  useEffect(() => {
    fetch(`${API_URL}/gold-rates`)
      .then(res => res.json())
      .then(data => {
        if (data.success && data.currentPrice18k) {
          setPrice18k(data.currentPrice18k);
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
      aria-label={isAr ? "سعر الذهب اليوم عيار 18" : "Cours officiel de l'or 18K"}
      className="gold-luxury-card-widget"
      onClick={onOpenHistoryModal}
      role="button"
      tabIndex={0}
      style={{
        width: '100%',
        maxWidth: '880px',
        margin: '8px auto 18px',
        background: 'linear-gradient(150deg, #181b26 0%, #12141c 100%)',
        border: '1px solid rgba(255, 255, 255, 0.09)',
        borderRadius: '16px',
        padding: '16px 24px',
        boxShadow: '0 12px 30px rgba(0, 0, 0, 0.45), 0 0 20px rgba(245, 176, 39, 0.08)',
        display: 'flex',
        flexDirection: 'column',
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
        e.currentTarget.style.boxShadow = '0 16px 36px rgba(0, 0, 0, 0.55), 0 0 28px rgba(245, 176, 39, 0.15)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.09)';
        e.currentTarget.style.boxShadow = '0 12px 30px rgba(0, 0, 0, 0.45), 0 0 20px rgba(245, 176, 39, 0.08)';
      }}
    >
      {/* Ambient background gold glow */}
      <div 
        style={{
          position: 'absolute',
          top: '-40%',
          left: isRtl ? '25%' : '75%',
          width: '280px',
          height: '140px',
          background: 'radial-gradient(ellipse, rgba(245, 176, 39, 0.12) 0%, rgba(0,0,0,0) 70%)',
          pointerEvents: 'none'
        }}
      />

      {/* Top Header Row: Date & Status Badge */}
      <div style={{
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '12px',
        paddingBottom: '10px',
        borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
        position: 'relative',
        zIndex: 1
      }}>
        {/* Date: formatted السبت، 19 شتنبر 2026 \n 13:58:45 */}
        <div 
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            flexWrap: 'wrap'
          }}
        >
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
              fontSize: '0.84rem',
              color: '#94a3b8',
              fontWeight: 700,
              fontFamily: 'monospace, monospace',
              background: 'rgba(255, 255, 255, 0.05)',
              padding: '2px 8px',
              borderRadius: '6px'
            }}
          >
            {timeStr}
          </div>
        </div>

        {/* Status Pill Badge with Glowing Green Dot */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '7px',
          padding: '4px 12px',
          background: 'rgba(255, 255, 255, 0.05)',
          border: '1px solid rgba(255, 255, 255, 0.09)',
          borderRadius: '9999px',
          fontSize: '0.76rem',
          fontWeight: 700,
          color: '#cbd5e1'
        }}>
          {isAr ? (
            <>
              <span style={{
                width: '7px',
                height: '7px',
                borderRadius: '50%',
                backgroundColor: '#10b981',
                boxShadow: '0 0 8px #10b981',
                display: 'inline-block'
              }} />
              <span>آخر تحديث</span>
            </>
          ) : (
            <>
              <span>Dernière mise à jour</span>
              <span style={{
                width: '7px',
                height: '7px',
                borderRadius: '50%',
                backgroundColor: '#10b981',
                boxShadow: '0 0 8px #10b981',
                display: 'inline-block'
              }} />
            </>
          )}
        </div>
      </div>

      {/* Main Horizontal Rectangular Body */}
      <div style={{
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px',
        position: 'relative',
        zIndex: 1
      }}>
        {/* Left: 3D Gold Bars Graphic */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <img 
            src="/gold-bars-perfect.png" 
            alt="Lingots d'or 18K"
            style={{
              width: '110px',
              height: 'auto',
              display: 'block',
              filter: 'drop-shadow(0 4px 14px rgba(245, 176, 39, 0.25))',
              pointerEvents: 'none'
            }}
          />
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{
              fontSize: '0.72rem',
              color: 'var(--primary-gold)',
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              {isAr ? 'ذهب 18 قيراط (750‰)' : 'Or 18 Karats (750‰)'}
            </span>
            <span style={{
              fontSize: '0.78rem',
              color: '#cbd5e1',
              fontWeight: 600
            }}>
              {isAr ? 'المعيار الرسمي للصياغة بالمغرب' : 'Cours officiel de référence'}
            </span>
          </div>
        </div>

        {/* Center: à partir de & Big 1045 Price */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '0 12px'
        }}>
          <div style={{
            fontSize: '0.92rem',
            fontWeight: 600,
            color: '#94a3b8',
            marginBottom: '2px'
          }}>
            {isAr ? 'ابتداءً من' : 'à partir de'}
          </div>
          <div style={{
            display: 'flex',
            alignItems: 'baseline',
            gap: '8px'
          }}>
            <span style={{
              fontSize: '3.4rem',
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
              fontSize: '1.05rem',
              fontWeight: 700,
              color: '#8e9aa8'
            }}>
              {isAr ? 'درهم/غرام' : 'MAD/gramme'}
            </span>
          </div>
        </div>

        {/* Right: Trend badge & Interactive button */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: isRtl ? 'flex-start' : 'flex-end',
          gap: '8px'
        }}>
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            padding: '3px 9px',
            borderRadius: '6px',
            fontSize: '0.78rem',
            fontWeight: 800,
            background: 'rgba(16, 185, 129, 0.15)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            color: '#10b981'
          }}>
            ▲ {change} {isAr ? 'اليوم' : '24h'}
          </span>

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
              padding: '8px 16px',
              fontSize: '0.82rem',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 4px 14px rgba(212, 175, 55, 0.35)',
              transition: 'transform 0.2s, box-shadow 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-1px)';
              e.currentTarget.style.boxShadow = '0 6px 18px rgba(212, 175, 55, 0.5)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 14px rgba(212, 175, 55, 0.35)';
            }}
          >
            <span>📈</span>
            <span>{isAr ? 'سجل أسعار الذهب' : 'Historique des Cours'}</span>
          </button>
        </div>
      </div>
    </aside>
  );
}
