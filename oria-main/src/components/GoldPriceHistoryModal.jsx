import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { API_URL } from '../config/api';
import SilverIcon from './SilverIcon';

export default function GoldPriceHistoryModal({ isOpen, onClose, onOpenSellModal, initialMetal = 'gold' }) {
  const { lang, isRtl } = useLanguage();
  const isAr = lang === 'ar';

  const [activeMetal, setActiveMetal] = useState(initialMetal || 'gold'); // 'gold' | 'silver'
  const [goldData, setGoldData] = useState({
    currentPrice18k: 1032,
    currentPriceSilver: 14.50,
    carat: '18K',
    unit: 'MAD/g',
    silverUnit: 'MAD/g',
    lastUpdated: '',
    history: [],
    silverHistory: []
  });
  const [isLoading, setIsLoading] = useState(false);
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const [selectedRange, setSelectedRange] = useState('all'); // '7d', '30d', 'all'
  const svgRef = useRef(null);

  // Sync initialMetal when modal opens
  useEffect(() => {
    if (isOpen && initialMetal) {
      setActiveMetal(initialMetal);
    }
  }, [isOpen, initialMetal]);

  useEffect(() => {
    if (!isOpen) return;
    setIsLoading(true);
    fetch(`${API_URL}/gold-rates`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setGoldData(data);
        }
      })
      .catch(err => console.error('Failed to fetch metal rates:', err))
      .finally(() => setIsLoading(false));
  }, [isOpen]);

  // Reset hover on tab or filter change
  useEffect(() => {
    setHoveredIndex(null);
  }, [activeMetal, selectedRange, goldData]);

  // Fallback history for Gold 18K
  const fallbackGoldHistory = useMemo(() => [
    { id: 'gh_1', date: '2026-10-18 09:30', price18k: 1010, change: '+0.5%', source: isAr ? 'تحديد الدار البيضاء' : 'Fixation Casablanca', note: isAr ? 'السعر الصباحي الافتتاحي' : 'Cours matinal' },
    { id: 'gh_2', date: '2026-10-20 11:15', price18k: 1025, change: '+1.5%', source: isAr ? 'السوق الوطني للذهب' : 'Marché national', note: isAr ? 'طلب متزايد على الصياغة' : 'Forte demande' },
    { id: 'gh_3', date: '2026-10-22 10:00', price18k: 1028, change: '+0.3%', source: isAr ? 'بورصة الذهب المعتمدة' : 'Bourse de référence', note: isAr ? 'اتجاه تصاعدي في السوق' : 'Hausse continue' },
    { id: 'gh_4', date: '2026-10-24 15:45', price18k: 1030, change: '+0.2%', source: isAr ? 'السعر الرسمي للإغلاق' : 'Cours officiel clôture', note: isAr ? 'استقرار تداولات عيار 18' : 'Stabilité marché' },
    { id: 'gh_5', date: '2026-10-26 12:00', price18k: 1032, change: '+0.2%', source: isAr ? 'السعر الرسمي للإغلاق' : 'Cours officiel clôture', note: isAr ? 'السعر الرسمي المعتمد اليوم' : 'Cours actuel du jour' }
  ], [isAr]);

  // Fallback history for Silver 1000
  const fallbackSilverHistory = useMemo(() => [
    { id: 'sh_1', date: '2026-10-18 09:30', priceSilver: 13.80, change: '0.0%', source: isAr ? 'السوق الوطني للفضة' : 'Marché National Argent', note: isAr ? 'السعر الصباحي الافتتاحي' : 'Fixation matinale Ag 1000' },
    { id: 'sh_2', date: '2026-10-20 11:15', priceSilver: 13.95, change: '+1.1%', source: isAr ? 'بورصة الدار البيضاء' : 'Bourse Casablanca', note: isAr ? 'طلب متزايد على السبائك' : 'Raffinement lingots 1000' },
    { id: 'sh_3', date: '2026-10-22 10:00', priceSilver: 14.10, change: '+1.1%', source: isAr ? 'السوق الوطني للفضة' : 'Marché National Argent', note: isAr ? 'طلب صناعي وصياغة' : 'Forte demande joaillerie' },
    { id: 'sh_4', date: '2026-10-24 15:45', priceSilver: 14.25, change: '+1.1%', source: isAr ? 'السعر الرسمي للإغلاق' : 'Fixation Officielle Maroc', note: isAr ? 'تأكيد السعر المرجعي' : 'Cours certifié Ag 1000‰' },
    { id: 'sh_5', date: '2026-10-25 10:30', priceSilver: 14.40, change: '+1.1%', source: isAr ? 'بورصة الدار البيضاء' : 'Bourse Casablanca', note: isAr ? 'اتجاه تصاعدي للفضة' : 'Progression continue' },
    { id: 'sh_6', date: '2026-10-26 12:00', priceSilver: 14.50, change: '+0.7%', source: isAr ? 'السعر الرسمي للإغلاق' : 'Fixation Officielle Maroc', note: isAr ? 'السعر الرسمي المعتمد اليوم' : 'Cours actuel du jour' }
  ], [isAr]);

  // Active full list depending on selected metal
  const fullHistoryList = useMemo(() => {
    if (activeMetal === 'silver') {
      return (goldData.silverHistory && goldData.silverHistory.length > 0)
        ? goldData.silverHistory
        : fallbackSilverHistory;
    }
    return (goldData.history && goldData.history.length > 0)
      ? goldData.history
      : fallbackGoldHistory;
  }, [activeMetal, goldData, fallbackGoldHistory, fallbackSilverHistory]);

  // Filter history by time range
  const filteredHistory = useMemo(() => {
    if (selectedRange === '7d') return fullHistoryList.slice(-7);
    if (selectedRange === '30d') return fullHistoryList.slice(-30);
    return fullHistoryList;
  }, [fullHistoryList, selectedRange]);

  const formatSource = (src) => {
    if (!src) return isAr ? 'سوق المعادن بالمغرب' : 'Marché Maroc';
    if (isAr) {
      const map = {
        'Fixation Casablanca': 'تحديد الدار البيضاء',
        'Bourse Casablanca': 'بورصة الدار البيضاء',
        'Marché national': 'السوق الوطني للذهب',
        'Marché National Argent': 'السوق الوطني للفضة',
        'Bourse de référence': 'بورصة الذهب المعتمدة',
        'Cours officiel de clôture': 'السعر الرسمي للإغلاق',
        'Cours officiel clôture': 'السعر الرسمي للإغلاق',
        'Fixation Officielle Maroc': 'السعر الرسمي المحدد بالمغرب',
        'Fixation Argent Maroc': 'سعر الفضة المحدد بالمغرب',
        'Marché Maroc': 'سوق المعادن الثمينة بالمغرب'
      };
      return map[src] || src;
    }
    const reverseMap = {
      'تحديد الدار البيضاء': 'Fixation Casablanca',
      'بورصة الدار البيضاء': 'Bourse Casablanca',
      'السوق الوطني للذهب': 'Marché national',
      'السوق الوطني للفضة': 'Marché National Argent',
      'بورصة الذهب المعتمدة': 'Bourse de référence',
      'السعر الرسمي للإغلاق': 'Cours officiel de clôture',
      'السعر الرسمي المحدد بالمغرب': 'Fixation Officielle Maroc',
      'سعر الفضة المحدد بالمغرب': 'Fixation Argent Maroc',
      'سوق المعادن بالمغرب': 'Marché Maroc'
    };
    return reverseMap[src] || src;
  };

  const formatNote = (nt) => {
    if (!nt || nt === '-') return '-';
    if (isAr) {
      const map = {
        'Cours matinal': 'السعر الصباحي الافتتاحي',
        'Fixation matinale Ag 1000': 'السعر الصباحي الافتتاحي Ag 1000',
        'Forte demande joaillerie': 'طلب متزايد على الصياغة',
        'Forte demande': 'طلب متزايد على الصياغة',
        'Raffinement lingots 1000': 'تنقية وسبك فضة 1000',
        'Raffinement lingots': 'تنقية وسبك السبائك',
        'Tendance haussière': 'اتجاه تصاعدي في السوق',
        'Hausse continue': 'اتجاه تصاعدي مستمر',
        'Progression continue': 'تطور إيجابي وتصاعدي',
        'Cours actuel du jour': 'السعر الرسمي المعتمد اليوم',
        'Cours actuel du jour (Ag 1000)': 'السعر المعتمد اليوم (Ag 1000)',
        'Validation 18K': 'تأكيد سعر عيار 18',
        'Cours certifié Ag 1000‰': 'سعر الفضة المعتمد 1000‰',
        'Mise à jour régulière': 'تحديث دوري معتمد',
        'Stabilité marché': 'استقرار السوق'
      };
      return map[nt] || nt;
    }
    return nt;
  };

  // --- STATS COMPUTATION ---
  const isSilver = activeMetal === 'silver';
  const prices = filteredHistory.map(h => {
    if (isSilver) {
      return Number(h.priceSilver || h.price || 14.50);
    }
    return Number(h.price18k || h.price || 1032);
  });

  const rawMin = prices.length > 0 ? Math.min(...prices) : (isSilver ? 14.50 : 1032);
  const rawMax = prices.length > 0 ? Math.max(...prices) : (isSilver ? 14.50 : 1032);
  const avgPrice = prices.length > 0
    ? (prices.reduce((a, b) => a + b, 0) / prices.length)
    : (isSilver ? 14.50 : 1032);

  const firstPrice = prices[0] || (isSilver ? 14.50 : 1032);
  const lastPrice = prices[prices.length - 1] || (isSilver ? 14.50 : 1032);
  const totalChangeVal = lastPrice - firstPrice;
  const totalChangePct = firstPrice ? ((totalChangeVal / firstPrice) * 100).toFixed(1) : '0.0';

  // SVG Chart Dimensions & Padding
  const svgWidth = 640;
  const svgHeight = 220;
  const padLeft = isSilver ? 70 : 65;
  const padRight = 35;
  const padTop = 32;
  const padBottom = 38;

  const chartInnerWidth = svgWidth - padLeft - padRight;
  const chartInnerHeight = svgHeight - padTop - padBottom;

  const pricePadding = isSilver
    ? Math.max((rawMax - rawMin) * 0.22, 0.45)
    : Math.max((rawMax - rawMin) * 0.15, 6);

  const minPrice = isSilver
    ? Number((rawMin - pricePadding).toFixed(2))
    : Math.floor(rawMin - pricePadding);

  const maxPrice = isSilver
    ? Number((rawMax + pricePadding).toFixed(2))
    : Math.ceil(rawMax + pricePadding);

  const priceRange = maxPrice - minPrice || (isSilver ? 1 : 10);

  // 4 Horizontal Grid Levels
  const gridLevels = [0, 0.33, 0.66, 1].map(ratio => {
    const val = minPrice + ratio * priceRange;
    const y = padTop + (1 - ratio) * chartInnerHeight;
    const displayVal = isSilver ? val.toFixed(2) : Math.round(val);
    return { val: displayVal, y };
  });

  // Vector Points
  const points = filteredHistory.map((h, i) => {
    const x = padLeft + (i / Math.max(filteredHistory.length - 1, 1)) * chartInnerWidth;
    const p = isSilver ? Number(h.priceSilver || h.price || 14.50) : Number(h.price18k || h.price || 1032);
    const y = padTop + (1 - (p - minPrice) / priceRange) * chartInnerHeight;
    return {
      x,
      y,
      price: p,
      displayPrice: isSilver ? p.toFixed(2) : Math.round(p),
      date: h.date?.split(' ')[0] || h.date,
      fullDate: h.date,
      change: h.change || '+0.0%',
      source: h.source,
      note: h.note,
      rawIndex: i
    };
  });

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

  // Non-overlapping X-axis ticks
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

  const handleMouseMove = (e) => {
    if (!svgRef.current || points.length === 0) return;
    const rect = svgRef.current.getBoundingClientRect();
    const clientX = e.clientX || (e.touches && e.touches[0]?.clientX);
    if (!clientX) return;
    const mouseX = ((clientX - rect.left) / rect.width) * svgWidth;

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

  // Visual Theme Colors based on active metal
  const themeStroke = isSilver ? '#38bdf8' : '#F6B22B';
  const themeGlow = isSilver ? 'rgba(56, 189, 248, 0.45)' : 'rgba(246, 178, 43, 0.4)';
  const themeAreaGradId = isSilver ? 'luxurySilverAreaGrad' : 'luxuryGoldAreaGrad';
  const themeUnit = isAr ? 'د.م/غ' : 'MAD/g';
  const themeCurrency = isAr ? 'د.م' : 'DH';

  if (!isOpen) return null;

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
          border: isSilver ? '1.5px solid rgba(56, 189, 248, 0.35)' : '1.5px solid rgba(212, 175, 55, 0.35)',
          borderRadius: '24px',
          width: '100%',
          maxWidth: '760px',
          maxHeight: '94vh',
          overflowY: 'auto',
          boxShadow: isSilver 
            ? '0 25px 50px -12px rgba(0, 0, 0, 0.8), 0 0 40px rgba(56, 189, 248, 0.15)'
            : '0 25px 50px -12px rgba(0, 0, 0, 0.8), 0 0 40px rgba(212, 175, 55, 0.12)',
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '18px', paddingBottom: '16px', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
          <div style={{
            width: '52px',
            height: '52px',
            borderRadius: '16px',
            background: isSilver 
              ? 'linear-gradient(135deg, #38bdf8 0%, #1e293b 100%)' 
              : 'linear-gradient(135deg, #d4af37 0%, #996515 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.8rem',
            boxShadow: isSilver ? '0 6px 18px rgba(56, 189, 248, 0.35)' : '0 6px 18px rgba(212, 175, 55, 0.35)',
            flexShrink: 0
          }}>
            {isSilver ? '🛡️' : '🥇'}
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <h2 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 800, color: isSilver ? '#e2e8f0' : '#fef3c7', fontFamily: 'Cinzel, Playfair Display, serif' }}>
                {isSilver
                  ? (isAr ? 'سعر الفضة عيار 1000 وسجل التغييرات' : 'Cours Officiel & Historique de l\'Argent 1000‰')
                  : (isAr ? 'سعر الذهب عيار 18 وسجل التغييرات' : 'Cours Officiel & Historique de l\'Or 18K')}
              </h2>
              <span style={{
                background: isSilver ? 'rgba(56, 189, 248, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                color: isSilver ? '#38bdf8' : '#10b981',
                padding: '3px 10px',
                borderRadius: '12px',
                fontSize: '0.72rem',
                fontWeight: 700,
                border: isSilver ? '1px solid rgba(56, 189, 248, 0.3)' : '1px solid rgba(16, 185, 129, 0.3)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px'
              }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: isSilver ? '#38bdf8' : '#10b981' }}></span>
                {isAr ? 'المعيار الرسمي بالمغرب' : 'Standard Officiel Maroc'}
              </span>
            </div>
            <p style={{ margin: '4px 0 0 0', fontSize: '0.82rem', color: '#94a3b8' }}>
              {isSilver
                ? (isAr ? 'متابعة حية لسعر غرام الفضة الخالصة عيار 1000 بالدرهم المغربي (MAD)' : 'Cotation en direct du gramme d\'argent pur 1000‰ en Dirhams Marocains (MAD)')
                : (isAr ? 'متابعة حية لسعر غرام الذهب عيار 18 قيراط بالدرهم المغربي (MAD)' : 'Cotation en direct du gramme d\'or 18 carats en Dirhams Marocains (MAD)')}
            </p>
          </div>
        </div>

        {/* --- PROMINENT METAL SELECTOR TABS --- */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '12px',
          marginBottom: '18px'
        }}>
          {/* 1. Tab Or 18K */}
          <button
            type="button"
            onClick={() => { setActiveMetal('gold'); setHoveredIndex(null); }}
            style={{
              padding: '12px 16px',
              borderRadius: '14px',
              border: activeMetal === 'gold' ? '2px solid #d4af37' : '1px solid rgba(255, 255, 255, 0.1)',
              background: activeMetal === 'gold'
                ? 'linear-gradient(135deg, rgba(212, 175, 55, 0.28) 0%, rgba(15, 23, 42, 0.9) 100%)'
                : 'rgba(255, 255, 255, 0.04)',
              color: activeMetal === 'gold' ? '#fef3c7' : '#94a3b8',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              boxShadow: activeMetal === 'gold' ? '0 0 24px rgba(212, 175, 55, 0.25)' : 'none',
              transition: 'all 0.25s ease'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '1.25rem' }}>🏆</span>
              <div style={{ textAlign: isRtl ? 'right' : 'left' }}>
                <div style={{ fontWeight: 800, fontSize: '0.88rem' }}>
                  {isAr ? 'الذهب عيار 18 (750‰)' : 'Or 18 Karats (750‰)'}
                </div>
                <div style={{ fontSize: '0.72rem', opacity: 0.8 }}>
                  {isAr ? 'المعيار الرسمي للذهب' : 'Cotation officielle Or'}
                </div>
              </div>
            </div>
            <div style={{
              fontSize: '1.2rem',
              fontWeight: 900,
              color: '#f6b22b',
              fontFamily: 'system-ui, sans-serif'
            }}>
              {goldData.currentPrice18k || 1032} <span style={{ fontSize: '0.72rem', color: '#d4af37' }}>{themeCurrency}</span>
            </div>
          </button>

          {/* 2. Tab Argent 1000 */}
          <button
            type="button"
            onClick={() => { setActiveMetal('silver'); setHoveredIndex(null); }}
            style={{
              padding: '12px 16px',
              borderRadius: '14px',
              border: activeMetal === 'silver' ? '2px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.1)',
              background: activeMetal === 'silver'
                ? 'linear-gradient(135deg, rgba(56, 189, 248, 0.25) 0%, rgba(15, 23, 42, 0.9) 100%)'
                : 'rgba(255, 255, 255, 0.04)',
              color: activeMetal === 'silver' ? '#f8fafc' : '#94a3b8',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              boxShadow: activeMetal === 'silver' ? '0 0 24px rgba(56, 189, 248, 0.25)' : 'none',
              transition: 'all 0.25s ease'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <SilverIcon size={22} />
              <div style={{ textAlign: isRtl ? 'right' : 'left' }}>
                <div style={{ fontWeight: 800, fontSize: '0.88rem' }}>
                  {isAr ? 'الفضة عيار 1000 (Ag 1000)' : 'Argent Pur 1000‰ (Ag 1000)'}
                </div>
                <div style={{ fontSize: '0.72rem', opacity: 0.8 }}>
                  {isAr ? 'المعيار الرسمي للفضة' : 'Cotation officielle Argent'}
                </div>
              </div>
            </div>
            <div style={{
              fontSize: '1.2rem',
              fontWeight: 900,
              color: '#38bdf8',
              fontFamily: 'system-ui, sans-serif'
            }}>
              {Number(goldData.currentPriceSilver || 14.50).toFixed(2)} <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>{themeCurrency}</span>
            </div>
          </button>
        </div>

        {/* --- PREMIUM FINANCIAL GRAPH CONTAINER --- */}
        <div style={{
          background: 'linear-gradient(180deg, rgba(20, 24, 38, 0.9) 0%, rgba(10, 12, 20, 0.95) 100%)',
          border: isSilver ? '1px solid rgba(56, 189, 248, 0.3)' : '1px solid rgba(212, 175, 55, 0.25)',
          borderRadius: '20px',
          padding: '20px 22px',
          marginBottom: '22px',
          boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.05), 0 12px 28px rgba(0, 0, 0, 0.45)'
        }}>
          {/* Graph Header: Title + Period Selector */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
            <div>
              <div style={{ fontSize: '0.92rem', fontWeight: 800, color: isSilver ? '#e2e8f0' : '#fef3c7', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>📈</span>
                <span>
                  {isSilver
                    ? (isAr ? 'المنحنى البياني لتطور سعر غرام الفضة 1000 مؤخراً' : 'Évolution du cours de l\'Argent Pur 1000‰')
                    : (isAr ? 'المنحنى البياني لتطور سعر غرام الذهب عيار 18 مؤخراً' : 'Évolution du cours de l\'Or 18 Karats')}
                </span>
                <span style={{
                  fontSize: '0.72rem',
                  padding: '2px 8px',
                  borderRadius: '6px',
                  fontWeight: 700,
                  background: isSilver ? 'rgba(56, 189, 248, 0.15)' : 'rgba(212, 175, 55, 0.15)',
                  color: isSilver ? '#38bdf8' : '#f6b22b',
                  border: isSilver ? '1px solid rgba(56, 189, 248, 0.3)' : '1px solid rgba(212, 175, 55, 0.3)'
                }}>
                  {isSilver ? 'Ag 1000‰' : 'Au 750‰'}
                </span>
              </div>
              <div style={{ fontSize: '0.74rem', color: '#94a3b8', marginTop: '3px' }}>
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
                    background: selectedRange === tab.key 
                      ? (isSilver ? 'linear-gradient(135deg, #38bdf8 0%, #0284c7 100%)' : 'linear-gradient(135deg, #d4af37 0%, #aa7c11 100%)')
                      : 'transparent',
                    color: selectedRange === tab.key ? (isSilver ? '#0f172a' : '#000000') : '#cbd5e1',
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

          {/* Interactive Inspection Banner */}
          {activePoint && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: isSilver ? 'rgba(56, 189, 248, 0.08)' : 'rgba(212, 175, 55, 0.08)',
              border: isSilver ? '1px solid rgba(56, 189, 248, 0.25)' : '1px solid rgba(212, 175, 55, 0.25)',
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
                <span style={{ color: themeStroke, fontWeight: 800, fontSize: '0.98rem' }}>
                  {activePoint.displayPrice} {themeCurrency} / g
                </span>
                <span style={{
                  padding: '1px 6px',
                  borderRadius: '4px',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  background: activePoint.change?.startsWith('+') ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255, 255, 255, 0.08)',
                  color: activePoint.change?.startsWith('+') ? '#10b981' : '#cbd5e1'
                }}>
                  {activePoint.change}
                </span>
              </div>
              <div style={{ color: '#cbd5e1', fontSize: '0.75rem', opacity: 0.9 }}>
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

                <linearGradient id="luxurySilverAreaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.4" />
                  <stop offset="60%" stopColor="#94a3b8" stopOpacity="0.12" />
                  <stop offset="100%" stopColor="#94a3b8" stopOpacity="0.0" />
                </linearGradient>

                <filter id="metalGlowShadow" x="-10%" y="-10%" width="120%" height="130%">
                  <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor={themeStroke} floodOpacity="0.45" />
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
                    {lvl.val} {themeCurrency}
                  </text>
                </g>
              ))}

              {/* Gradient Area under Curve */}
              {smoothAreaPath && (
                <path 
                  d={smoothAreaPath} 
                  fill={`url(#${themeAreaGradId})`} 
                />
              )}

              {/* Smooth Curve Stroke */}
              {smoothLinePath && (
                <path 
                  d={smoothLinePath} 
                  fill="none" 
                  stroke={themeStroke} 
                  strokeWidth="3.2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  filter="url(#metalGlowShadow)"
                />
              )}

              {/* Min and Max Badges on Curve */}
              {points.length > 2 && (
                <>
                  {/* Max Point Badge */}
                  <g>
                    <circle cx={points[maxPointIndex].x} cy={points[maxPointIndex].y} r="5" fill="#10b981" stroke="#ffffff" strokeWidth="1.5" />
                    <rect 
                      x={points[maxPointIndex].x - 42} 
                      y={points[maxPointIndex].y - 24} 
                      width="84" 
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
                      ▲ {points[maxPointIndex].displayPrice} {themeCurrency}
                    </text>
                  </g>

                  {/* Min Point Badge */}
                  {minPointIndex !== maxPointIndex && (
                    <g>
                      <circle cx={points[minPointIndex].x} cy={points[minPointIndex].y} r="5" fill="#e11d48" stroke="#ffffff" strokeWidth="1.5" />
                      <rect 
                        x={points[minPointIndex].x - 42} 
                        y={Math.min(points[minPointIndex].y + 8, svgHeight - padBottom - 18)} 
                        width="84" 
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
                        ▼ {points[minPointIndex].displayPrice} {themeCurrency}
                      </text>
                    </g>
                  )}
                </>
              )}

              {/* Hover Crosshair & Selected Coordinate */}
              {hoveredIndex !== null && points[hoveredIndex] && (
                <g>
                  <line 
                    x1={points[hoveredIndex].x} 
                    y1={padTop} 
                    x2={points[hoveredIndex].x} 
                    y2={chartBottomY} 
                    stroke={themeStroke} 
                    strokeDasharray="3 3" 
                    strokeWidth="1.5"
                    opacity="0.8"
                  />
                  <circle 
                    cx={points[hoveredIndex].x} 
                    cy={points[hoveredIndex].y} 
                    r="9" 
                    fill={themeGlow} 
                  />
                  <circle 
                    cx={points[hoveredIndex].x} 
                    cy={points[hoveredIndex].y} 
                    r="5.5" 
                    fill="#151824" 
                    stroke={themeStroke} 
                    strokeWidth="3" 
                  />
                </g>
              )}

              {/* Latest Point Indicator */}
              {hoveredIndex === null && points.length > 0 && (
                <g>
                  <circle 
                    cx={points[points.length - 1].x} 
                    cy={points[points.length - 1].y} 
                    r="7" 
                    fill={themeGlow} 
                  />
                  <circle 
                    cx={points[points.length - 1].x} 
                    cy={points[points.length - 1].y} 
                    r="4" 
                    fill={themeStroke} 
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
              <div style={{ fontSize: '0.98rem', fontWeight: 800, color: '#10b981', marginTop: '2px' }}>
                {isSilver ? rawMax.toFixed(2) : Math.round(rawMax)} {themeCurrency}
              </div>
            </div>
            <div style={{ background: 'rgba(255, 255, 255, 0.04)', borderRadius: '10px', padding: '8px 12px', textAlign: 'center' }}>
              <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>{isAr ? 'أدنى سعر' : 'Plus bas'}</div>
              <div style={{ fontSize: '0.98rem', fontWeight: 800, color: '#ef4444', marginTop: '2px' }}>
                {isSilver ? rawMin.toFixed(2) : Math.round(rawMin)} {themeCurrency}
              </div>
            </div>
            <div style={{ background: 'rgba(255, 255, 255, 0.04)', borderRadius: '10px', padding: '8px 12px', textAlign: 'center' }}>
              <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>{isAr ? 'متوسط السعر' : 'Prix moyen'}</div>
              <div style={{ fontSize: '0.98rem', fontWeight: 800, color: isSilver ? '#e2e8f0' : '#fef3c7', marginTop: '2px' }}>
                {isSilver ? Number(avgPrice).toFixed(2) : Math.round(avgPrice)} {themeCurrency}
              </div>
            </div>
            <div style={{ background: 'rgba(255, 255, 255, 0.04)', borderRadius: '10px', padding: '8px 12px', textAlign: 'center' }}>
              <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>{isAr ? 'عدد التسجيلات' : 'Enregistrements'}</div>
              <div style={{ fontSize: '0.98rem', fontWeight: 800, color: themeStroke, marginTop: '2px' }}>
                {filteredHistory.length}
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
