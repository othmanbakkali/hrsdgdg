import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useCart } from '../context/CartContext';

export default function JewelFinderWizard({ isOpen, onClose, products = [], onSelectProduct }) {
  const { t, isRtl, lang } = useLanguage();
  const isAr = lang === 'ar';
  const { addToCart } = useCart();

  const [step, setStep] = useState(1);
  const [answers, setAnswers] = useState({
    target: '', // 'Moi', 'Femme', 'Homme', 'Enfant'
    occasion: '', // 'Mariage', 'Anniversaire', 'Fiançailles', 'Cadeau', 'Travail', 'Quotidien'
    style: '', // 'Élégant', 'Moderne', 'Traditionnel', 'Vintage', 'Minimaliste'
    budget: 10000,
    universe: 'ALL' // 'FIRST_HAND', 'SECOND_HAND', 'ALL'
  });

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
      budget: 10000,
      universe: 'ALL'
    });
  };

  // Score algorithm to find best matching products
  const calculateMatches = () => {
    return products.map(product => {
      let score = 0;
      let totalCriteria = 4;

      // 1. Target match
      if (answers.target) {
        if (product.pour_qui && product.pour_qui.toLowerCase() === answers.target.toLowerCase()) {
          score += 1;
        } else if (answers.target === 'Moi') {
          score += 0.8;
        }
      }

      // 2. Occasion match
      if (answers.occasion) {
        if (product.occasion && product.occasion.toLowerCase().includes(answers.occasion.toLowerCase())) {
          score += 1;
        } else if (answers.occasion === 'Cadeau') {
          score += 0.7;
        }
      }

      // 3. Style match
      if (answers.style) {
        if (product.style && product.style.toLowerCase().includes(answers.style.toLowerCase())) {
          score += 1;
        } else if (answers.style === 'Artisanal' && (product.category_id === 'cat_artisanal' || (product.titre || '').toLowerCase().includes('artisan') || (product.description || '').toLowerCase().includes('artisan') || (product.style || '').toLowerCase() === 'traditionnel')) {
          score += 1;
        }
      }

      // 4. Budget match
      if (answers.budget) {
        if (product.prix <= answers.budget) {
          score += 1;
        } else if (product.prix <= answers.budget * 1.15) {
          score += 0.5; // Slightly over budget
        }
      }

      // 5. Universe filter
      if (answers.universe && answers.universe !== 'ALL') {
        if (product.type_vente !== answers.universe) {
          score = score * 0.3; // Penalize wrong universe heavily
        }
      }

      const matchPercent = Math.min(Math.round((score / totalCriteria) * 100), 99);

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
    <div className="jewelia-modal-backdrop" onClick={onClose}>
      <div 
        className="jewelia-modal-content" 
        style={{ maxWidth: '780px', padding: '36px' }} 
        onClick={e => e.stopPropagation()}
      >
        <button className="modal-close-btn" onClick={onClose}>✕</button>

        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div className="hero-pill-badge" style={{ margin: '0 auto 12px' }}>
            ✨ {isAr ? 'المساعد الذكي HRSDGDG' : 'ASSISTANT INTELLIGENT HRSDGDG'}
          </div>
          <h2 style={{ fontSize: '1.8rem', marginBottom: '8px' }}>
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
                    background: s <= step ? 'var(--primary-gold)' : 'rgba(255, 255, 255, 0.15)',
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
            <h3 style={{ fontSize: '1.2rem', marginBottom: '18px', textAlign: 'center', color: 'var(--light-gold)' }}>
              1. {t('finderStep1')}
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '14px' }}>
              {[
                { id: 'Moi', label: isAr ? 'لنفسي' : 'Pour Moi-même', icon: '✨' },
                { id: 'Femme', label: isAr ? 'امرأة' : 'Une Femme', icon: '👩' },
                { id: 'Homme', label: isAr ? 'رجل' : 'Un Homme', icon: '👨' },
                { id: 'Enfant', label: isAr ? 'طفل' : 'Un Enfant', icon: '🧒' }
              ].map(opt => (
                <button
                  key={opt.id}
                  onClick={() => handleSelectOption('target', opt.id)}
                  style={{
                    padding: '24px 16px',
                    background: answers.target === opt.id ? 'rgba(212, 175, 55, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                    border: `1.5px solid ${answers.target === opt.id ? 'var(--primary-gold)' : 'rgba(255, 255, 255, 0.08)'}`,
                    borderRadius: 'var(--radius-md)',
                    color: '#fff',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '10px',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <span style={{ fontSize: '2rem' }}>{opt.icon}</span>
                  <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>{opt.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* STEP 2: OCCASION ? */}
        {step === 2 && (
          <div>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '18px', textAlign: 'center', color: 'var(--light-gold)' }}>
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
              ].map(opt => (
                <button
                  key={opt.id}
                  onClick={() => handleSelectOption('occasion', opt.id)}
                  style={{
                    padding: '20px 14px',
                    background: answers.occasion === opt.id ? 'rgba(212, 175, 55, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                    border: `1.5px solid ${answers.occasion === opt.id ? 'var(--primary-gold)' : 'rgba(255, 255, 255, 0.08)'}`,
                    borderRadius: 'var(--radius-md)',
                    color: '#fff',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '8px',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <span style={{ fontSize: '1.8rem' }}>{opt.icon}</span>
                  <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{opt.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* STEP 3: STYLE ? */}
        {step === 3 && (
          <div>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '18px', textAlign: 'center', color: 'var(--light-gold)' }}>
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
              ].map(opt => (
                <button
                  key={opt.id}
                  onClick={() => handleSelectOption('style', opt.id)}
                  style={{
                    padding: '18px 14px',
                    background: answers.style === opt.id ? 'rgba(212, 175, 55, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                    border: `1.5px solid ${answers.style === opt.id ? 'var(--primary-gold)' : 'rgba(255, 255, 255, 0.08)'}`,
                    borderRadius: 'var(--radius-md)',
                    color: '#fff',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '6px',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>{opt.label}</span>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-gray)' }}>{opt.desc}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* STEP 4: BUDGET ? */}
        {step === 4 && (
          <div style={{ textAlign: 'center', padding: '10px 20px' }}>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '18px', color: 'var(--light-gold)' }}>
              4. {t('finderStep4')}
            </h3>
            <div style={{ margin: '30px 0' }}>
              <span style={{ fontSize: '2.4rem', fontWeight: 800, fontFamily: 'var(--font-serif)', color: 'var(--primary-gold)' }} dir="ltr">
                {answers.budget.toLocaleString()} {isAr ? 'درهم' : 'DH'}
              </span>
              <p style={{ color: 'var(--text-gray)', fontSize: '0.88rem', marginTop: '6px' }}>
                {isAr ? 'الميزانية القصوى المرغوبة' : 'Budget maximum souhaité'}
              </p>
            </div>
            <input 
              type="range" 
              min="500" 
              max="30000" 
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
              <span>500 DH</span>
              <span>15 000 DH</span>
              <span>30 000+ DH</span>
            </div>
          </div>
        )}

        {/* STEP 5: PREFERENCE UNIVERS ? */}
        {step === 5 && (
          <div>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '18px', textAlign: 'center', color: 'var(--light-gold)' }}>
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
              ].map(opt => (
                <button
                  key={opt.id}
                  onClick={() => handleSelectOption('universe', opt.id)}
                  style={{
                    padding: '24px 18px',
                    background: answers.universe === opt.id ? 'rgba(212, 175, 55, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                    border: `1.5px solid ${answers.universe === opt.id ? 'var(--primary-gold)' : 'rgba(255, 255, 255, 0.08)'}`,
                    borderRadius: 'var(--radius-md)',
                    color: '#fff',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                    textAlign: isAr ? 'right' : 'left',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <span style={{ fontWeight: 800, fontSize: '1.05rem', color: opt.id === 'SECOND_HAND' ? '#6ee7b7' : 'var(--light-gold)' }}>
                    {opt.title}
                  </span>
                  <span style={{ fontSize: '0.84rem', color: 'var(--text-gray)', lineHeight: 1.4 }}>
                    {opt.desc}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* STEP 6: RESULTATS RECOMMANDES */}
        {step === 6 && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <div>
                <h3 style={{ fontSize: '1.3rem', color: 'var(--light-gold)' }}>
                  {t('finderResultsTitle')}
                </h3>
                <p style={{ color: 'var(--text-gray)', fontSize: '0.85rem' }}>
                  {isAr 
                    ? `بناءً على معاييرك: ${answers.target || 'الكل'}, ${answers.occasion || 'جميع المناسبات'}, ${answers.style || 'كل الأنماط'}, ميزانية ≤ ${answers.budget.toLocaleString()} درهم`
                    : `Basé sur vos critères : ${answers.target || 'Tous'}, ${answers.occasion || 'Toutes occasions'}, ${answers.style || 'Tous styles'}, budget ≤ ${answers.budget.toLocaleString()} DH`
                  }
                </p>
              </div>
              <button 
                onClick={resetFinder}
                style={{
                  background: 'none',
                  border: '1px solid var(--border-gold)',
                  color: 'var(--light-gold)',
                  padding: '6px 14px',
                  borderRadius: 'var(--radius-full)',
                  fontSize: '0.8rem',
                  cursor: 'pointer'
                }}
              >
                🔄 {isAr ? 'إعادة الاختبار' : 'Relancer le test'}
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', maxHeight: '420px', overflowY: 'auto', paddingRight: '4px' }}>
              {recommendations.map(item => (
                <div 
                  key={item.id}
                  style={{
                    background: 'rgba(22, 22, 30, 0.9)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-md)',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    position: 'relative'
                  }}
                >
                  <div style={{ position: 'relative', width: '100%', paddingTop: '80%' }}>
                    <img 
                      src={item.images[0]} 
                      alt={item.titre}
                      style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                    <span 
                      style={{
                        position: 'absolute',
                        top: '8px',
                        left: '8px',
                        background: 'rgba(10, 10, 14, 0.9)',
                        color: item.type_vente === 'SECOND_HAND' ? '#6ee7b7' : 'var(--light-gold)',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        fontSize: '0.68rem',
                        fontWeight: 800,
                        border: `1px solid ${item.type_vente === 'SECOND_HAND' ? '#10b981' : 'var(--primary-gold)'}`
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
                        background: 'var(--primary-gold)',
                        color: '#08080a',
                        padding: '2px 8px',
                        borderRadius: '12px',
                        fontSize: '0.72rem',
                        fontWeight: 800
                      }}
                    >
                      {item.matchPercent}% {isAr ? 'تطابق' : 'match'}
                    </span>
                  </div>

                  <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <span style={{ fontSize: '0.88rem', fontWeight: 700, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {item.titre}
                    </span>
                    <span style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--light-gold)' }} dir="ltr">
                      {item.prix.toLocaleString()} {isAr ? 'درهم' : 'DH'}
                    </span>
                    <div style={{ display: 'flex', gap: '6px', marginTop: '6px' }}>
                      <button 
                        onClick={() => {
                          onSelectProduct(item);
                          onClose();
                        }}
                        style={{
                          flex: 1,
                          padding: '6px',
                          background: 'rgba(255, 255, 255, 0.08)',
                          border: '1px solid var(--border-gold)',
                          color: '#fff',
                          borderRadius: '4px',
                          fontSize: '0.76rem',
                          fontWeight: 600,
                          cursor: 'pointer'
                        }}
                      >
                        {isAr ? 'عرض التفاصيل' : 'Voir détails'}
                      </button>
                      <button 
                        onClick={() => addToCart(item)}
                        style={{
                          padding: '6px 10px',
                          background: 'var(--primary-gold)',
                          border: 'none',
                          color: '#08080a',
                          borderRadius: '4px',
                          fontSize: '0.76rem',
                          fontWeight: 800,
                          cursor: 'pointer'
                        }}
                      >
                        {isAr ? '+ السلة' : '+ Panier'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Controls Footer */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '28px', paddingTop: '18px', borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
          {step > 1 && step <= 5 ? (
            <button 
              onClick={handlePrev}
              style={{
                background: 'transparent',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                color: 'var(--text-light-gray)',
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
              onClick={handleNext}
              className="btn-jewelia-primary"
            >
              {isAr ? 'التالي ›' : 'Suivant →'}
            </button>
          ) : step === 5 ? (
            <button 
              onClick={handleNext}
              className="btn-jewelia-primary"
            >
              {isAr ? 'عرض ترشيحاتي ✨' : 'Voir mes recommandations ✨'}
            </button>
          ) : (
            <button 
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
