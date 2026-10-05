import React, { useState, useEffect, useMemo, useRef } from 'react';
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
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const [selectedRange, setSelectedRange] = useState('all'); // '7d', '30d', 'all'
  const svgRef = useRef(null);

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

  const fullHistoryList = (goldData.history && goldData.history.length > 0)
    ? goldData.history
    : [
        { id: '1', date: '15/09', price18k: 1010, change: '+0.5%', source: isAr ? 'تحديد الدار البيضاء' : 'Fixation Casablanca', note: isAr ? 'السعر الصباحي الافتتاحي' : 'Cours matinal' },
        { id: '2', date: '17/09', price18k: 1025, change: '+1.5%', source: isAr ? 'السوق الوطني للذهب' : 'Marché national', note: isAr ? 'طلب متزايد على الصياغة' : 'Forte demande' },
        { id: '3', date: '19/09', price18k: 1038, change: '+1.3%', source: isAr ? 'بورصة الذهب المعتمدة' : 'Bourse de référence', note: isAr ? 'اتجاه تصاعدي في السوق' : 'Hausse continue' },
        { id: '4', date: '20/09', price18k: 1045, change: '+0.7%', source: isAr ? 'السعر الرسمي للإغلاق' : 'Cours officiel clôture', note: isAr ? 'السعر الرسمي المعتمد اليوم' : 'Cours actuel du jour' }
      ];

  // Filter history by range
  const filteredHistory = useMemo(() => {
    if (selectedRange === '7d') {
      return fullHistoryList.slice(-7);
    }
    if (selectedRange === '30d') {
      return fullHistoryList.slice(-30);
    }
    return fullHistoryList;
  }, [fullHistoryList, selectedRange]);

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

  // --- STATS COMPUTATION ---
  const prices = filteredHistory.map(h => Number(h.price18k) || 1045);
  const rawMin = Math.min(...prices);
  const rawMax = Math.max(...prices);
  const avgPrice = Math.round(prices.reduce((a, b) => a + b, 0) / (prices.length || 1));
  const firstPrice = prices[0] || 1045;
  const lastPrice = prices[prices.length - 1] || 1045;
  const totalChangeVal = lastPrice - firstPrice;
  const totalChangePct = firstPrice ? ((totalChangeVal / firstPrice) * 100).toFixed(1) : '0.0';

  // Chart dimensions & scaling
  const svgWidth = 640;
  const svgHeight = 220;
  const padLeft = 65;
  const padRight = 35;
  const padTop = 32;
  const padBottom = 38;

  const chartInnerWidth = svgWidth - padLeft - padRight;
  const chartInnerHeight = svgHeight - padTop - padBottom;

  const pricePadding = Math.max((rawMax - rawMin) * 0.15, 6);
  const minPrice = Math.floor(rawMin - pricePadding);
  const maxPrice = Math.ceil(rawMax + pricePadding);
  const priceRange = maxPrice - minPrice || 1;

  // Grid levels (4 evenly spaced horizontal guide lines)
  const gridLevels = [0, 0.33, 0.66, 1].map(ratio => {
    const val = Math.round(minPrice + ratio * priceRange);
    const y = padTop + (1 - ratio) * chartInnerHeight;
    return { val, y };
  });

  // Points coordinates
  const points = filteredHistory.map((h, i) => {
    const x = padLeft + (i / Math.max(filteredHistory.length - 1, 1)) * chartInnerWidth;
    const p = Number(h.price18k) || 1045;
    const y = padTop + (1 - (p - minPrice) / priceRange) * chartInnerHeight;
    return {
      x,
      y,
      price: p,
      date: h.date?.split(' ')[0] || h.date,
      fullDate: h.date,
      change: h.change || '+0.0%',
      source: h.source,
      note: h.note,
      rawIndex: i
    };
  });

  // Min and Max point indices
  let maxPointIndex = 0;
  let minPointIndex = 0;
  points.forEach((pt, idx) => {
    if (pt.price > points[maxPointIndex].price) maxPointIndex = idx;
    if (pt.price < points[minPointIndex].price) minPointIndex = idx;
  });

  // Smooth Bezier Curve Path Generator
  const getSmoothPath = (pts) => {
    if (!pts || pts.length === 0) return '';
    if (pts.length === 1) return `M ${pts[0].x} ${pts[0].y}`;
    if (pts.length === 2) return `M ${pts[0].x} ${pts[0].y} L ${pts[1].x} ${pts[1].y}`;

    let d = `M ${pts[0].x},${pts[0].y}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i === 0 ? 0 : i - 1];
      const p1 = pts[i];
      const p2 = pts[i + 1];
      const p3 = pts[i + 2] || p2;

      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;

      d += ` C ${cp1x.toFixed(1)},${cp1y.toFixed(1)} ${cp2x.toFixed(1)},${cp2y.toFixed(1)} ${p2.x.toFixed(1)},${p2.y.toFixed(1)}`;
    }
    return d;
  };

  const smoothLinePath = getSmoothPath(points);
  const chartBottomY = padTop + chartInnerHeight;
  const smoothAreaPath = points.length > 1
    ? `${smoothLinePath} L ${points[points.length - 1].x.toFixed(1)},${chartBottomY} L ${points[0].x.toFixed(1)},${chartBottomY} Z`
    : '';

  // Calculate clean non-overlapping X-axis ticks (4 to 6 items max)
  const xTicks = useMemo(() => {
    if (points.length <= 6) {
      return points.map(p => ({ x: p.x, date: p.date }));
    }
    const step = (points.length - 1) / 4;
    const indices = [
      0,
      Math.round(step),
      Math.round(step * 2),
      Math.round(step * 3),
      points.length - 1
    ];
    return Array.from(new Set(indices)).map(idx => ({
      x: points[idx].x,
      date: points[idx].date
    }));
  }, [points]);

  // Handle interactive hover over SVG
  const handleMouseMove = (e) => {
    if (!svgRef.current || points.length === 0) return;
    const rect = svgRef.current.getBoundingClientRect();
    const clientX = e.clientX || (e.touches && e.touches[0]?.clientX);
    if (!clientX) return;
    const mouseX = ((clientX - rect.left) / rect.width) * svgWidth;

    // Find closest point by X coordinate
    let closestIndex = 0;
    let minDiff = Infinity;
    points.forEach((pt, idx) => {
      const diff = Math.abs(pt.x - mouseX);
      if (diff < minDiff) {
        minDiff = diff;
        closestIndex = idx;
      }
    });

    setHoveredIndex(closestIndex);
  };

  const activePoint = hoveredIndex !== null ? points[hoveredIndex] : points[points.length - 1];

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
        backgroundColor: 'rgba(5, 7, 15, 0.88)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
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
          background: 'linear-gradient(170deg, #151824 0%, #0b0d14 100%)',
          border: '1.5px solid rgba(212, 175, 55, 0.35)',
          borderRadius: '24px',
          width: '100%',
          maxWidth: '740px',
          maxHeight: '94vh',
          overflowY: 'auto',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8), 0 0 40px rgba(212, 175, 55, 0.12)',
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '20px', paddingBottom: '16px', borderBottom: '1px solid rgba(212, 175, 55, 0.2)' }}>
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
              <h2 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 800, color: '#fef3c7', fontFamily: 'Cinzel, Playfair Display, serif' }}>
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
          background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.14) 0%, rgba(15, 23, 42, 0.7) 100%)',
          border: '1.5px solid rgba(212, 175, 55, 0.35)',
          borderRadius: '18px',
          padding: '18px 24px',
          marginBottom: '20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
          boxShadow: '0 8px 24px rgba(212, 175, 55, 0.1)'
        }}>
          <div>
            <div style={{ fontSize: '0.76rem', fontWeight: 800, color: 'var(--primary-gold)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>
              {isAr ? 'السعر الحالي للغرام (عيار 18)' : 'Prix Actuel au Gramme (Or 18K)'}
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
              <span style={{
                fontSize: '2.6rem',
                fontWeight: 900,
                fontFamily: 'system-ui, -apple-system, sans-serif',
                background: 'linear-gradient(180deg, #ffd700 0%, #f59e0b 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                filter: 'drop-shadow(0 2px 8px rgba(245, 158, 11, 0.4))'
              }}>
                {currentPrice}
              </span>
              <span style={{ fontSize: '1.05rem', fontWeight: 800, color: '#fef3c7' }}>
                {isAr ? 'درهم / غرام' : 'DH / gramme'}
              </span>
            </div>
          </div>

          <div style={{ textAlign: isRtl ? 'left' : 'right' }}>
            <span style={{
              display: 'inline-block',
              background: (totalChangeVal >= 0) ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
              color: (totalChangeVal >= 0) ? '#10b981' : '#ef4444',
              padding: '6px 14px',
              borderRadius: '8px',
              fontSize: '0.88rem',
              fontWeight: 800,
              border: (totalChangeVal >= 0) ? '1px solid rgba(16, 185, 129, 0.35)' : '1px solid rgba(239, 68, 68, 0.35)',
              marginBottom: '6px'
            }}>
              {totalChangeVal >= 0 ? `▲ +${totalChangePct}%` : `▼ ${totalChangePct}%`} {isAr ? 'التغير الإجمالي' : 'Variation Globale'}
            </span>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
              {isAr ? 'مستقر وموثوق للصياغة بالمغرب' : 'Cours de référence certifié'}
            </div>
          </div>
        </div>

        {/* --- PREMIUM FINANCIAL GRAPH CONTAINER --- */}
        <div style={{
          background: 'linear-gradient(180deg, rgba(20, 24, 38, 0.9) 0%, rgba(10, 12, 20, 0.95) 100%)',
          border: '1px solid rgba(212, 175, 55, 0.25)',
          borderRadius: '20px',
          padding: '20px 22px',
          marginBottom: '22px',
          boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.05), 0 12px 28px rgba(0, 0, 0, 0.45)'
        }}>
          {/* Graph Header: Title + Period Selector */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
            <div>
              <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#fef3c7', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span>📈</span>
                <span>{isAr ? 'المنحنى البياني لتطور سعر غرام عيار 18 مؤخراً' : 'Évolution récente du cours Or 18K'}</span>
              </div>
              <div style={{ fontSize: '0.74rem', color: '#94a3b8', marginTop: '2px' }}>
                {isAr ? 'حرك المؤشر فوق الخط البياني لمعاينة التفاصيل اليومية' : 'Survolez la courbe pour inspecter les cotations'}
              </div>
            </div>

            {/* Time Period Filter Tabs */}
            <div style={{ display: 'flex', background: 'rgba(255, 255, 255, 0.06)', borderRadius: '10px', padding: '3px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
              {[
                { key: '7d', label: isAr ? '7 أيام' : '7J' },
                { key: '30d', label: isAr ? '30 يوم' : '30J' },
                { key: 'all', label: isAr ? 'الكل' : 'Tout' }
              ].map(tab => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => { setSelectedRange(tab.key); setHoveredIndex(null); }}
                  style={{
                    border: 'none',
                    background: selectedRange === tab.key ? 'linear-gradient(135deg, #d4af37 0%, #aa7c11 100%)' : 'transparent',
                    color: selectedRange === tab.key ? '#000000' : '#cbd5e1',
                    fontWeight: selectedRange === tab.key ? '800' : '600',
                    fontSize: '0.74rem',
                    padding: '4px 12px',
                    borderRadius: '7px',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Interactive Inspection Banner (shows when hovering or latest) */}
          {activePoint && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'rgba(212, 175, 55, 0.08)',
              border: '1px solid rgba(212, 175, 55, 0.25)',
              borderRadius: '12px',
              padding: '8px 14px',
              marginBottom: '12px',
              fontSize: '0.8rem',
              flexWrap: 'wrap',
              gap: '8px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ color: '#94a3b8' }}>🗓️ {activePoint.fullDate || activePoint.date}</span>
                <span style={{ color: 'rgba(255,255,255,0.2)' }}>|</span>
                <span style={{ color: '#f6b22b', fontWeight: 800, fontSize: '0.95rem' }}>
                  {activePoint.price} DH / g
                </span>
                <span style={{
                  padding: '1px 6px',
                  borderRadius: '4px',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  background: activePoint.change?.startsWith('+') ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                  color: activePoint.change?.startsWith('+') ? '#10b981' : '#ef4444'
                }}>
                  {activePoint.change}
                </span>
              </div>
              <div style={{ color: '#cbd5e1', fontSize: '0.75rem', opacity: 0.85 }}>
                🏛️ {formatSource(activePoint.source)} {activePoint.note ? `• ${formatNote(activePoint.note)}` : ''}
              </div>
            </div>
          )}

          {/* SVG Vector Canvas */}
          <div 
            style={{ width: '100%', position: 'relative', touchAction: 'none' }}
            onMouseMove={handleMouseMove}
            onTouchMove={handleMouseMove}
            onMouseLeave={() => setHoveredIndex(null)}
          >
            <svg 
              ref={svgRef}
              viewBox={`0 0 ${svgWidth} ${svgHeight}`} 
              style={{ width: '100%', height: 'auto', display: 'block', overflow: 'visible', cursor: 'crosshair' }}
            >
              <defs>
                <linearGradient id="luxuryGoldAreaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#F6B22B" stopOpacity="0.45" />
                  <stop offset="60%" stopColor="#D4AF37" stopOpacity="0.12" />
                  <stop offset="100%" stopColor="#D4AF37" stopOpacity="0.0" />
                </linearGradient>
                <filter id="goldGlowShadow" x="-10%" y="-10%" width="120%" height="130%">
                  <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#F6B22B" floodOpacity="0.4" />
                </filter>
              </defs>

              {/* Horizontal Grid Lines & Price Labels */}
              {gridLevels.map((lvl, idx) => (
                <g key={idx}>
                  <line 
                    x1={padLeft} 
                    y1={lvl.y} 
                    x2={svgWidth - padRight} 
                    y2={lvl.y} 
                    stroke="rgba(255, 255, 255, 0.08)" 
                    strokeDasharray="4 4" 
                    strokeWidth="1"
                  />
                  <text 
                    x={isRtl ? svgWidth - padRight + 6 : padLeft - 8} 
                    y={lvl.y + 3.5} 
                    fill="#94a3b8" 
                    fontSize="10" 
                    fontWeight="600" 
                    textAnchor={isRtl ? 'start' : 'end'}
                    fontFamily="system-ui, monospace"
                  >
                    {lvl.val} DH
                  </text>
                </g>
              ))}

              {/* Gradient Area under Curve */}
              {smoothAreaPath && (
                <path 
                  d={smoothAreaPath} 
                  fill="url(#luxuryGoldAreaGrad)" 
                />
              )}

              {/* Smooth Gold Curve Stroke */}
              {smoothLinePath && (
                <path 
                  d={smoothLinePath} 
                  fill="none" 
                  stroke="#F6B22B" 
                  strokeWidth="3.2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  filter="url(#goldGlowShadow)"
                />
              )}

              {/* Min and Max Badges on the Curve */}
              {points.length > 2 && (
                <>
                  {/* Max Point Badge */}
                  <g>
                    <circle cx={points[maxPointIndex].x} cy={points[maxPointIndex].y} r="5" fill="#10b981" stroke="#ffffff" strokeWidth="1.5" />
                    <rect 
                      x={points[maxPointIndex].x - 38} 
                      y={points[maxPointIndex].y - 24} 
                      width="76" 
                      height="18" 
                      rx="4" 
                      fill="rgba(16, 185, 129, 0.95)" 
                    />
                    <text 
                      x={points[maxPointIndex].x} 
                      y={points[maxPointIndex].y - 12} 
                      fill="#ffffff" 
                      fontSize="9.5" 
                      fontWeight="800" 
                      textAnchor="middle"
                    >
                      ▲ {points[maxPointIndex].price} DH
                    </text>
                  </g>

                  {/* Min Point Badge */}
                  {minPointIndex !== maxPointIndex && (
                    <g>
                      <circle cx={points[minPointIndex].x} cy={points[minPointIndex].y} r="5" fill="#e11d48" stroke="#ffffff" strokeWidth="1.5" />
                      <rect 
                        x={points[minPointIndex].x - 38} 
                        y={Math.min(points[minPointIndex].y + 8, svgHeight - padBottom - 18)} 
                        width="76" 
                        height="18" 
                        rx="4" 
                        fill="rgba(225, 29, 72, 0.95)" 
                      />
                      <text 
                        x={points[minPointIndex].x} 
                        y={Math.min(points[minPointIndex].y + 20, svgHeight - padBottom - 6)} 
                        fill="#ffffff" 
                        fontSize="9.5" 
                        fontWeight="800" 
                        textAnchor="middle"
                      >
                        ▼ {points[minPointIndex].price} DH
                      </text>
                    </g>
                  )}
                </>
              )}

              {/* Interactive Hover Crosshair & Selected Coordinate */}
              {hoveredIndex !== null && points[hoveredIndex] && (
                <g>
                  {/* Vertical Crosshair Line */}
                  <line 
                    x1={points[hoveredIndex].x} 
                    y1={padTop} 
                    x2={points[hoveredIndex].x} 
                    y2={chartBottomY} 
                    stroke="rgba(246, 178, 43, 0.7)" 
                    strokeDasharray="3 3" 
                    strokeWidth="1.5"
                  />
                  {/* Glowing Target Node */}
                  <circle 
                    cx={points[hoveredIndex].x} 
                    cy={points[hoveredIndex].y} 
                    r="9" 
                    fill="rgba(246, 178, 43, 0.3)" 
                  />
                  <circle 
                    cx={points[hoveredIndex].x} 
                    cy={points[hoveredIndex].y} 
                    r="5.5" 
                    fill="#151824" 
                    stroke="#F6B22B" 
                    strokeWidth="3"
                  />
                </g>
              )}

              {/* Latest Point Indicator (when not hovering) */}
              {hoveredIndex === null && points.length > 0 && (
                <g>
                  <circle 
                    cx={points[points.length - 1].x} 
                    cy={points[points.length - 1].y} 
                    r="7" 
                    fill="rgba(246, 178, 43, 0.35)" 
                  />
                  <circle 
                    cx={points[points.length - 1].x} 
                    cy={points[points.length - 1].y} 
                    r="4" 
                    fill="#F6B22B" 
                  />
                </g>
              )}

              {/* X-Axis Clean Date Labels */}
              {xTicks.map((tick, idx) => (
                <g key={idx}>
                  <line 
                    x1={tick.x} 
                    y1={chartBottomY} 
                    x2={tick.x} 
                    y2={chartBottomY + 5} 
                    stroke="rgba(255, 255, 255, 0.2)" 
                    strokeWidth="1"
                  />
                  <text 
                    x={tick.x} 
                    y={chartBottomY + 18} 
                    fill="#94a3b8" 
                    fontSize="9.5" 
                    fontWeight="600" 
                    textAnchor="middle"
                    fontFamily="system-ui, sans-serif"
                  >
                    {tick.date}
                  </text>
                </g>
              ))}
            </svg>
          </div>

          {/* Quick Summary Metric Cards */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
            gap: '10px',
            marginTop: '16px',
            paddingTop: '14px',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)'
          }}>
            <div style={{ background: 'rgba(255, 255, 255, 0.04)', borderRadius: '10px', padding: '8px 12px', textAlign: 'center' }}>
              <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>{isAr ? 'أعلى سعر' : 'Plus haut'}</div>
              <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#10b981', marginTop: '2px' }}>{rawMax} DH</div>
            </div>
            <div style={{ background: 'rgba(255, 255, 255, 0.04)', borderRadius: '10px', padding: '8px 12px', textAlign: 'center' }}>
              <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>{isAr ? 'أدنى سعر' : 'Plus bas'}</div>
              <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#ef4444', marginTop: '2px' }}>{rawMin} DH</div>
            </div>
            <div style={{ background: 'rgba(255, 255, 255, 0.04)', borderRadius: '10px', padding: '8px 12px', textAlign: 'center' }}>
              <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>{isAr ? 'متوسط السعر' : 'Prix moyen'}</div>
              <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#fef3c7', marginTop: '2px' }}>{avgPrice} DH</div>
            </div>
            <div style={{ background: 'rgba(255, 255, 255, 0.04)', borderRadius: '10px', padding: '8px 12px', textAlign: 'center' }}>
              <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>{isAr ? 'عدد التسجيلات' : 'Enregistrements'}</div>
              <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#d4af37', marginTop: '2px' }}>{filteredHistory.length}</div>
            </div>
          </div>
        </div>

        {/* History Table (18K) */}
        <div style={{ marginBottom: '10px' }}>
          <h4 style={{ margin: '0 0 12px 0', fontSize: '0.96rem', color: '#fef3c7', display: 'flex', alignItems: 'center', gap: '6px' }}>
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
                {[...filteredHistory].reverse().map((item, idx) => (
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

