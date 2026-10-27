import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';

export default function JewelFinderWizard({ isOpen, onClose, products = [], onSelectProduct }) {
  const { t, isRtl, lang } = useLanguage();
  const isAr = lang === 'ar';

  const [step, setStep] = useState(1);
  const [answers, setAnswers] = useState({
    target: '', // 'Moi', 'Femme', 'Homme', 'Enfant'
    occasion: '', // 'Mariage', 'Anniversaire', 'Fiançailles', 'Cadeau', 'Travail', 'Quotidien'
    style: '', // 'Élégant', 'Moderne', 'Traditionnel', 'Artisanal', 'Vintage', 'Minimaliste'
    budget: 20000,
    universe: 'ALL' // 'FIRST_HAND', 'SECOND_HAND', 'ALL'
  });

  // Local fallback if products prop is empty or not yet loaded
  const [fetchedProducts, setFetchedProducts] = useState([]);

  useEffect(() => {
    if (isOpen && (!products || products.length === 0)) {
      const apiUrl = import.meta.env.VITE_API_URL || '/api';
      fetch(`${apiUrl}/bijoux?status=Validated`)
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data) && data.length > 0) {
            setFetchedProducts(data);
          }
        })
        .catch(err => console.error('Error fetching products for finder:', err));
    }
  }, [isOpen, products]);

  if (!isOpen) return null;

  const handleSelectOption = (field, value) => {
    setAnswers(prev => ({ ...prev, [field]: value }));
  };

  const handleNext = () => {
    if (step < 5) {
      setStep(step + 1);
    } else {
      setStep(6); // Results step
    }
  };

  const handlePrev = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const resetFinder = () => {
    setStep(1);
    setAnswers({
      target: '',
      occasion: '',
      style: '',
      budget: 20000,
      universe: 'ALL'
    });
  };

  // Smart scoring algorithm to find best matching products
  const calculateMatches = () => {
    const pool = (products && products.length > 0) ? products : fetchedProducts;
    if (!pool || pool.length === 0) return [];

    return pool.map(product => {
      let score = 0;
      let totalCriteria = 4;

      // 1. Target match (Pour qui ?)
      if (answers.target) {
        const pTarget = (product.pour_qui || '').toLowerCase();
        const aTarget = answers.target.toLowerCase();
        if (pTarget && pTarget === aTarget) {
          score += 1;
        } else if (answers.target === 'Femme') {
          score += (product.category_id !== 'cat_men') ? 0.85 : 0.2;
        } else if (answers.target === 'Homme') {
          score += (product.category_id === 'cat_men' || product.category_id === 'cat_watches' || pTarget === 'homme') ? 1 : 0.3;
        } else if (answers.target === 'Moi') {
          score += 0.85;
        } else {
          score += 0.6;
        }
      } else {
        score += 1;
      }

      // 2. Occasion match
      if (answers.occasion) {
        const pOccasion = (product.occasion || '').toLowerCase();
        const aOccasion = answers.occasion.toLowerCase();
        const pTitle = ((product.titre_fr || product.titre || '') + ' ' + (product.description || '')).toLowerCase();

        if (pOccasion && pOccasion.includes(aOccasion)) {
          score += 1;
        } else if (answers.occasion === 'Fiançailles') {
          if (product.category_id === 'cat_rings' || pTitle.includes('solitaire') || pTitle.includes('diamant') || pTitle.includes('bague')) {
            score += 0.95;
          } else if (pOccasion.includes('mariage')) {
            score += 0.9;
          } else {
            score += 0.55;
          }
        } else if (answers.occasion === 'Mariage') {
          if (pOccasion.includes('fiançailles') || product.category_id === 'cat_rings' || product.category_id === 'cat_sets') {
            score += 0.95;
          } else {
            score += 0.55;
          }
        } else if (answers.occasion === 'Cadeau') {
          score += 0.85;
        } else {
          score += 0.6;
        }
      } else {
        score += 1;
      }

      // 3. Style match
      if (answers.style) {
        const pStyle = (product.style || '').toLowerCase();
        const aStyle = answers.style.toLowerCase();
        const pTitle = ((product.titre_fr || product.titre || '') + ' ' + (product.description || '')).toLowerCase();

        if (pStyle && pStyle.includes(aStyle)) {
          score += 1;
        } else if (answers.style === 'Artisanal' || answers.style === 'Traditionnel') {
          if (product.category_id === 'cat_artisanal' || product.category_id === 'cat_traditional' || pTitle.includes('artisan') || pTitle.includes('traditionnel')) {
            score += 1;
          } else {
            score += 0.45;
          }
        } else if (answers.style === 'Vintage') {
          score += (pStyle.includes('vintage') || product.type_vente === 'SECOND_HAND') ? 0.9 : 0.45;
        } else if (answers.style === 'Moderne' || answers.style === 'Élégant') {
          score += 0.85;
        } else {
          score += 0.65;
        }
      } else {
        score += 1;
      }

      // 4. Budget match
      if (answers.budget) {
        if (product.prix <= answers.budget) {
          score += 1;
        } else if (product.prix <= answers.budget * 1.15) {
          score += 0.75;
        } else if (product.prix <= answers.budget * 1.35) {
          score += 0.45;
        } else {
          score += 0.25;
        }
      } else {
        score += 1;
      }

      // 5. Universe filter
      if (answers.universe && answers.universe !== 'ALL') {
        if (product.type_vente === answers.universe) {
          score += 0.5;
          totalCriteria += 0.5;
        } else {
          score = score * 0.4;
        }
      }

      const matchPercent = Math.min(Math.max(Math.round((score / totalCriteria) * 100), 60), 99);

      return {
        ...product,
        matchPercent
      };
    })
    .sort((a, b) => b.matchPercent - a.matchPercent)
    .slice(0, 6);
  };

  const recommendations = step === 6 ? calculateMatches() : [];

  return (
    <div className="jewelia-modal-backdrop" onClick={onClose} dir={isAr ? 'rtl' : 'ltr'}>
      <div 
        className="jewelia-modal-content" 
        style={{ maxWidth: '780px', padding: '36px' }} 
        onClick={e => e.stopPropagation()}
      >
        <button className="modal-close-btn" onClick={onClose} aria-label={isAr ? 'إغلاق' : 'Fermer'}>✕</button>

        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div className="hero-pill-badge" style={{ margin: '0 auto 12px' }}>
            ✨ {isAr ? 'المساعد الذكي HRSDGDG' : 'ASSISTANT INTELLIGENT HRSDGDG'}
          </div>
          <h2 style={{ fontSize: '1.8rem', marginBottom: '8px', color: 'var(--text-dark)' }}>
            {t('finderTitle')}
          </h2>
          <p style={{ color: 'var(--text-gray)', fontSize: '0.92rem', maxWidth: '520px', margin: '0 auto' }}>
            {t('finderSubtitle')}
          </p>

          {step <= 5 && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '18px' }}>
              {[1, 2, 3, 4, 5].map(s => (
                <div 
                  key={s} 
                  style={{
                    width: s === step ? '28px' : '10px',
                    height: '8px',
                    borderRadius: '4px',
                    background: s <= step ? 'var(--primary-gold)' : 'var(--border-subtle)',
                    transition: 'all 0.3s ease'
                  }}
                />
              ))}
            </div>
          )}
        </div>

        {/* STEP 1: POUR QUI ? */}
        {step === 1 && (
          <div>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '18px', textAlign: 'center', color: 'var(--primary-gold)' }}>
              1. {t('finderStep1')}
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '14px' }}>
              {[
                { id: 'Moi', label: isAr ? 'لنفسي' : 'Pour Moi-même', icon: '✨' },
                { id: 'Femme', label: isAr ? 'امرأة' : 'Une Femme', icon: '👩' },
                { id: 'Homme', label: isAr ? 'رجل' : 'Un Homme', icon: '👨' },
                { id: 'Enfant', label: isAr ? 'طفل' : 'Un Enfant', icon: '🧒' }
              ].map(opt => {
                const isSelected = answers.target === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => handleSelectOption('target', opt.id)}
                    className={`finder-option-card ${isSelected ? 'selected' : ''}`}
                  >
                    <span style={{ fontSize: '2.2rem' }}>{opt.icon}</span>
                    <span className="finder-opt-title">{opt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* STEP 2: OCCASION ? */}
        {step === 2 && (
          <div>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '18px', textAlign: 'center', color: 'var(--primary-gold)' }}>
              2. {t('finderStep2')}
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '14px' }}>
              {[
                { id: 'Mariage', label: isAr ? 'زفاف' : 'Mariage', icon: '💍' },
                { id: 'Fiançailles', label: isAr ? 'خطوبة' : 'Fiançailles', icon: '💎' },
                { id: 'Anniversaire', label: isAr ? 'عيد ميلاد' : 'Anniversaire', icon: '🎂' },
                { id: 'Cadeau', label: isAr ? 'هدية مميزة' : 'Cadeau Spécial', icon: '🎁' },
                { id: 'Travail', label: isAr ? 'عمل / مناسبات رسمية' : 'Travail / Affaires', icon: '💼' },
                { id: 'Quotidien', label: isAr ? 'استخدام يومي' : 'Quotidien', icon: '✨' }
              ].map(opt => {
                const isSelected = answers.occasion === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => handleSelectOption('occasion', opt.id)}
                    className={`finder-option-card ${isSelected ? 'selected' : ''}`}
                  >
                    <span style={{ fontSize: '2rem' }}>{opt.icon}</span>
                    <span className="finder-opt-title">{opt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* STEP 3: STYLE ? */}
        {step === 3 && (
          <div>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '18px', textAlign: 'center', color: 'var(--primary-gold)' }}>
              3. {t('finderStep3')}
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '14px' }}>
              {[
                { id: 'Élégant', label: isAr ? 'أنيق وراقٍ' : 'Élégant & Chic', desc: isAr ? 'فخامة كلاسيكية دائمة' : 'Raffinement intemporel' },
                { id: 'Moderne', label: isAr ? 'عصري وجذاب' : 'Moderne & Tendance', desc: isAr ? 'خطوط وتصاميم معاصرة' : 'Lignes épurées' },
                { id: 'Traditionnel', label: isAr ? 'تقليدي أصيل' : 'Traditionnel', desc: isAr ? 'صناعة وصياغة مغربية' : 'Artisanal marocain' },
                { id: 'Artisanal', label: isAr ? 'حرفي / يدوي' : 'Bijoux Artisanaux', desc: isAr ? 'نقش وصياغة يدوية' : 'Créations artisanales' },
                { id: 'Vintage', label: isAr ? 'فينتاج / نادر' : 'Vintage / Rétro', desc: isAr ? 'قطع أثرية فريدة' : 'Pièces d\'époque uniques' },
                { id: 'Minimaliste', label: isAr ? 'بسيط وهادئ' : 'Minimaliste', desc: isAr ? 'ناعم ومناسب لليومي' : 'Discret et quotidien' }
              ].map(opt => {
                const isSelected = answers.style === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => handleSelectOption('style', opt.id)}
                    className={`finder-option-card ${isSelected ? 'selected' : ''}`}
                  >
                    <span className="finder-opt-title">{opt.label}</span>
                    <span className="finder-opt-desc">{opt.desc}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* STEP 4: BUDGET ? */}
        {step === 4 && (
          <div style={{ textAlign: 'center', padding: '10px 20px' }}>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '18px', color: 'var(--primary-gold)' }}>
              4. {t('finderStep4')}
            </h3>
            <div style={{ margin: '30px 0' }}>
              <span style={{ fontSize: '2.4rem', fontWeight: 800, fontFamily: 'var(--font-serif)', color: 'var(--primary-gold)' }} dir="ltr">
                {answers.budget.toLocaleString()} {isAr ? 'د.م' : 'DH'}
              </span>
              <p style={{ color: 'var(--text-gray)', fontSize: '0.88rem', marginTop: '6px' }}>
                {isAr ? 'الميزانية القصوى المرغوبة' : 'Budget maximum souhaité'}
              </p>
            </div>
            <input 
              type="range" 
              min="500" 
              max="40000" 
              step="500"
              value={answers.budget}
              onChange={e => handleSelectOption('budget', parseFloat(e.target.value))}
              style={{
                width: '100%',
                accentColor: 'var(--primary-gold)',
                cursor: 'pointer',
                height: '8px',
                borderRadius: '4px'
              }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-gray)', fontSize: '0.8rem', marginTop: '8px' }} dir="ltr">
              <span>500 {isAr ? 'د.م' : 'DH'}</span>
              <span>20 000 {isAr ? 'د.م' : 'DH'}</span>
              <span>40 000+ {isAr ? 'د.م' : 'DH'}</span>
            </div>
          </div>
        )}

        {/* STEP 5: PREFERENCE UNIVERS ? */}
        {step === 5 && (
          <div>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '18px', textAlign: 'center', color: 'var(--primary-gold)' }}>
              5. {t('finderStep5')}
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
              {[
                { 
                  id: 'FIRST_HAND', 
                  title: isAr ? '✨ مجوهرات جديدة' : '✨ Première main', 
                  desc: isAr ? 'مجوهرات جديدة معتمدة مباشرة من كبار الصاغة.' : 'Bijoux neufs certifiés directement des bijoutiers professionnels.' 
                },
                { 
                  id: 'SECOND_HAND', 
                  title: isAr ? '♻️ مجوهرات مستعملة' : '♻️ Seconde main', 
                  desc: isAr ? 'قطع فريدة ونادرة، مفحوصة وموثوقة بتوفير كبير.' : 'Bijoux d\'occasion uniques, authentifiés avec fortes économies.' 
                },
                { 
                  id: 'ALL', 
                  title: isAr ? '💎 كلا القسمين' : '💎 Les deux univers', 
                  desc: isAr ? 'عرض أفضل الفرص من الجديد والمستعمل معاً.' : 'Montrez-moi les meilleures opportunités neuves et occasions.' 
                }
              ].map(opt => {
                const isSelected = answers.universe === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => handleSelectOption('universe', opt.id)}
                    className={`finder-option-card ${isSelected ? 'selected' : ''}`}
                    style={{ textAlign: isAr ? 'right' : 'left', alignItems: 'flex-start' }}
                  >
                    <span className="finder-opt-title" style={{ color: opt.id === 'SECOND_HAND' ? 'var(--second-hand-emerald, #059669)' : undefined }}>
                      {opt.title}
                    </span>
                    <span className="finder-opt-desc">
                      {opt.desc}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* STEP 6: RESULTATS RECOMMANDES */}
        {step === 6 && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <h3 style={{ fontSize: '1.3rem', color: 'var(--primary-gold)', marginBottom: '4px' }}>
                  {t('finderResultsTitle')}
                </h3>
                <p style={{ color: 'var(--text-gray)', fontSize: '0.85rem', margin: 0 }}>
                  {isAr 
                    ? `بناءً على معاييرك: ${answers.target || 'الكل'}، ${answers.occasion || 'جميع المناسبات'}، ${answers.style || 'كل الأنماط'}، ميزانية حتى ${answers.budget.toLocaleString()} د.م`
                    : `Basé sur vos critères : ${answers.target || 'Tous'}, ${answers.occasion || 'Toutes occasions'}, ${answers.style || 'Tous styles'}, budget jusqu'à ${answers.budget.toLocaleString()} DH`
                  }
                </p>
              </div>
              <button 
                type="button"
                onClick={resetFinder}
                style={{
                  background: 'transparent',
                  border: '1.5px solid var(--border-gold)',
                  color: 'var(--primary-gold)',
                  padding: '6px 14px',
                  borderRadius: 'var(--radius-full)',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                🔄 {isAr ? 'إعادة الاختبار' : 'Relancer le test'}
              </button>
            </div>

            {recommendations.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 20px', background: 'var(--bg-surface-elevated, #faf9f6)', borderRadius: '16px', border: '1px dashed var(--border-gold)' }}>
                <span style={{ fontSize: '2.5rem', display: 'block', marginBottom: '10px' }}>🔍</span>
                <h4 style={{ color: 'var(--primary-gold)', marginBottom: '8px' }}>
                  {isAr ? 'لم نجد قطعاً تطابق هذه المعايير بدقة' : 'Aucun bijou ne correspond exactement à tous ces critères'}
                </h4>
                <p style={{ color: 'var(--text-gray)', fontSize: '0.88rem', marginBottom: '16px' }}>
                  {isAr ? 'جرّب توسيع نطاق الميزانية أو اختيار كل الأنماط.' : 'Essayez d\'élargir votre budget ou de choisir tous les styles.'}
                </p>
                <button type="button" onClick={resetFinder} className="btn-jewelia-primary" style={{ padding: '8px 18px' }}>
                  🔄 {isAr ? 'تعديل المعايير' : 'Modifier les critères'}
                </button>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '16px', maxHeight: '460px', overflowY: 'auto', paddingRight: '4px' }}>
                {recommendations.map(item => {
                  const imgUrl = (Array.isArray(item.images) && item.images[0]) || (typeof item.images === 'string' && item.images) || item.image || 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=800&auto=format&fit=crop&q=80';
                  return (
                    <div 
                      key={item.id}
                      className="finder-result-card"
                    >
                      <div style={{ position: 'relative', width: '100%', paddingTop: '80%', background: '#f1efe9' }}>
                        <img 
                          src={imgUrl} 
                          alt={item.titre}
                          style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                        <span 
                          style={{
                            position: 'absolute',
                            top: '8px',
                            left: '8px',
                            background: item.type_vente === 'SECOND_HAND' ? 'rgba(5, 150, 105, 0.95)' : 'rgba(179, 135, 40, 0.95)',
                            color: '#ffffff',
                            padding: '3px 8px',
                            borderRadius: '6px',
                            fontSize: '0.68rem',
                            fontWeight: 800,
                            letterSpacing: '0.3px',
                            boxShadow: '0 2px 6px rgba(0,0,0,0.2)'
                          }}
                        >
                          {item.type_vente === 'SECOND_HAND' 
                            ? (isAr ? '♻️ مستعمل' : '♻️ SECONDE MAIN')
                            : (isAr ? '✨ جديد' : '✨ PREMIÈRE MAIN')
                          }
                        </span>
                        <span 
                          style={{
                            position: 'absolute',
                            top: '8px',
                            right: '8px',
                            background: 'var(--primary-gold, #b38728)',
                            color: '#ffffff',
                            padding: '3px 8px',
                            borderRadius: '12px',
                            fontSize: '0.72rem',
                            fontWeight: 800,
                            boxShadow: '0 2px 6px rgba(0,0,0,0.2)'
                          }}
                        >
                          {item.matchPercent}% {isAr ? 'تطابق' : 'match'}
                        </span>
                      </div>

                      <div style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <span className="result-title" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {(isAr && item.titre_ar) ? item.titre_ar : (item.titre_fr || item.titre)}
                        </span>
                        <span style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--primary-gold)' }} dir="ltr">
                          {item.prix ? item.prix.toLocaleString() : 0} {isAr ? 'د.م' : 'DH'}
                        </span>
                        <div style={{ display: 'flex', gap: '6px', marginTop: '4px' }}>
                          <button 
                            type="button"
                            onClick={() => {
                              onSelectProduct(item);
                              onClose();
                            }}
                            className="btn-jewelia-primary"
                            style={{
                              width: '100%',
                              padding: '8px 12px',
                              fontSize: '0.84rem',
                              fontWeight: 700
                            }}
                          >
                            👁️ {isAr ? 'عرض وتواصل' : 'Voir la pièce'}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Action Controls Footer */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '28px', paddingTop: '18px', borderTop: '1px solid var(--border-subtle)' }}>
          {step > 1 && step <= 5 ? (
            <button 
              type="button"
              onClick={handlePrev}
              style={{
                background: 'transparent',
                border: '1.5px solid var(--border-subtle)',
                color: 'var(--text-dark)',
                padding: '10px 20px',
                borderRadius: 'var(--radius-full)',
                cursor: 'pointer',
                fontWeight: 600
              }}
            >
              {isAr ? '‹ السابق' : '← Précédent'}
            </button>
          ) : <div />}

          {step < 5 ? (
            <button 
              type="button"
              onClick={handleNext}
              className="btn-jewelia-primary"
            >
              {isAr ? 'التالي ›' : 'Suivant →'}
            </button>
          ) : step === 5 ? (
            <button 
              type="button"
              onClick={handleNext}
              className="btn-jewelia-primary"
            >
              {isAr ? 'عرض ترشيحاتي ✨' : 'Voir mes recommandations ✨'}
            </button>
          ) : (
            <button 
              type="button"
              onClick={onClose}
              className="btn-jewelia-secondary"
            >
              {isAr ? 'إغلاق المساعد' : "Fermer l'assistant"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
