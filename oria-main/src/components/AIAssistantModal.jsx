import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { API_URL } from '../config/api';

export default function AIAssistantModal({ isOpen, onClose, products = [], onSelectProduct }) {
  const { lang, isRtl } = useLanguage();
  const isAr = lang === 'ar';

  const [availableProducts, setAvailableProducts] = useState(products);
  const [inputQuery, setInputQuery] = useState('');
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: isAr 
        ? "✨ مرحباً بكم! أنا المساعد الذكي لمجوهرات HRSDGDG. صفوا لي ما تبحثون عنه (المناسبة، لمن الهدية، النمط، الميزانية...) وسأختار لكم أفضل القطع من تشكيلاتنا الجديدة والمستعملة المعتمدة."
        : "✨ Bonjour ! Je suis votre Concierge IA HRSDGDG. Décrivez-moi ce que vous cherchez (occasion, destinataire, style, budget...) et je sélectionnerai pour vous les plus belles pièces de nos univers Première & Seconde Main.",
      recommendations: []
    }
  ]);
  const [isThinking, setIsThinking] = useState(false);
  const messagesEndRef = useRef(null);

  // Sync products or fetch if empty
  useEffect(() => {
    if (products && products.length > 0) {
      setAvailableProducts(products);
    } else if (isOpen) {
      fetch(`${API_URL}/bijoux`)
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) {
            setAvailableProducts(data);
          } else if (data && Array.isArray(data.bijoux)) {
            setAvailableProducts(data.bijoux);
          }
        })
        .catch(() => {});
    }
  }, [products, isOpen]);

  // Auto-scroll messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isThinking]);

  if (!isOpen) return null;

  const quickPrompts = isAr ? [
    { label: '💍 خاتم خطوبة أو زواج', query: 'أبحث عن خاتم خطوبة ذهب 18 قيراط' },
    { label: '🎁 هدية بميزانية أقل من 3000 د.م', query: 'هدية راقية بميزانية أقل من 3000 درهم' },
    { label: '✨ قطعة فينتاج مستعملة ونادرة', query: 'مجوهرات فينتاج أصلية من مجوهرات دلال' },
    { label: '👑 طقم أو قلادة ذهب خالص', query: 'قلادة ذهب عيار 18 للمناسبات' }
  ] : [
    { label: '💍 Solitaire ou Bague de fiançailles', query: 'Je cherche une bague de fiançailles en or 18 carats' },
    { label: '🎁 Idée cadeau budget < 3000 DH', query: 'Cadeau élégant pour femme budget 3000 DH' },
    { label: '✨ Pièce Vintage certifiée', query: 'Bijou vintage seconde main d époque certifié' },
    { label: '👑 Collier ou Parure Or 18K', query: 'Collier ou parure en or 18k pour occasion' }
  ];

  const handleSendQuery = (textToSend) => {
    const text = textToSend || inputQuery;
    if (!text.trim()) return;

    setInputQuery('');
    setMessages(prev => [...prev, { role: 'user', content: text }]);
    setIsThinking(true);

    setTimeout(() => {
      const lower = text.toLowerCase();
      let maxBudget = 25000;
      const budgetMatch = lower.match(/(\d+)\s*(dh|mad|dhs|درهم)?/i);
      if (budgetMatch && parseInt(budgetMatch[1], 10) > 100) {
        maxBudget = parseInt(budgetMatch[1], 10);
      }

      const activeList = availableProducts.filter(p => p.statut === 'Validated' || !p.statut);

      // Filter products based on keywords & budget
      let matches = activeList.filter(p => {
        const full = (
          (p.titre || '') + ' ' + 
          (p.titre_ar || '') + ' ' + 
          (p.description || '') + ' ' + 
          (p.matiere || '') + ' ' + 
          (p.pierre || '') + ' ' + 
          (p.style || '') + ' ' + 
          (p.occasion || '') + ' ' + 
          (p.pour_qui || '')
        ).toLowerCase();
        
        let matchesKey = true;
        if ((lower.includes('femme') || lower.includes('نساء') || lower.includes('زوجتي') || lower.includes('بنت')) && p.pour_qui && p.pour_qui !== 'Femme') matchesKey = false;
        if ((lower.includes('homme') || lower.includes('رجال') || lower.includes('زوجي')) && p.pour_qui && p.pour_qui !== 'Homme') matchesKey = false;
        if ((lower.includes('vintage') || lower.includes('مستعمل') || lower.includes('قديم') || lower.includes('seconde')) && p.type_vente !== 'SECOND_HAND') matchesKey = false;
        if ((lower.includes('neuf') || lower.includes('جديد') || lower.includes('premiere')) && p.type_vente !== 'FIRST_HAND') matchesKey = false;
        if ((lower.includes('bague') || lower.includes('خاتم') || lower.includes('خواتم')) && p.category_id !== 'cat_rings') matchesKey = false;
        if ((lower.includes('collier') || lower.includes('قلادة') || lower.includes('عقد')) && p.category_id !== 'cat_necklaces') matchesKey = false;
        if ((lower.includes('bracelet') || lower.includes('سوار') || lower.includes('دملج') || lower.includes('أساور')) && p.category_id !== 'cat_bracelets') matchesKey = false;

        return matchesKey && (p.prix <= maxBudget || !budgetMatch);
      }).slice(0, 4);

      // If no strict match found, fallback to top featured / relevant picks
      let isFallback = false;
      if (matches.length === 0) {
        matches = activeList.slice(0, 3);
        isFallback = true;
      }

      const firstHandCount = matches.filter(m => m.type_vente === 'FIRST_HAND').length;
      const secondHandCount = matches.filter(m => m.type_vente === 'SECOND_HAND').length;

      let aiContent = '';
      if (!isFallback) {
        aiContent = isAr 
          ? `✨ وجدت ${matches.length} قطعة مجوهرات تطابق معاييركم بدقة (الميزانية ≤ ${maxBudget.toLocaleString()} درهم):\n\n• ${firstHandCount} قطعة جديدة بالضمان والفاتورة\n• ${secondHandCount} قطعة مستعملة ومفحوصة أصلياً`
          : `✨ J'ai sélectionné ${matches.length} bijoux correspondant à votre demande (budget ≤ ${maxBudget.toLocaleString()} DH) :\n\n• ${firstHandCount} bijou(x) Première Main (neufs avec garantie)\n• ${secondHandCount} bijou(x) Seconde Main (certifiés d'époque)`;
      } else {
        aiContent = isAr
          ? `✨ إليكم تشكيلة مختارة من أرقى قطع المجوهرات الأكثر طلباً لدينا التي قد تناسب ذوقكم:`
          : `✨ Voici une sélection personnalisée de nos plus belles créations joaillières recommandées pour vous :`;
      }

      const aiResponse = {
        role: 'assistant',
        content: aiContent,
        recommendations: matches
      };

      setMessages(prev => [...prev, aiResponse]);
      setIsThinking(false);
    }, 800);
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    handleSendQuery(inputQuery);
  };

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
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
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
          background: 'linear-gradient(175deg, #151824 0%, #0d0f17 100%)',
          border: '1.5px solid rgba(212, 175, 55, 0.35)',
          borderRadius: '24px',
          width: '100%',
          maxWidth: '740px',
          height: '660px',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 60px -12px rgba(0, 0, 0, 0.85), 0 0 35px rgba(212, 175, 55, 0.15)',
          position: 'relative',
          overflow: 'hidden',
          color: '#ffffff',
          boxSizing: 'border-box'
        }}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          type="button"
          style={{
            position: 'absolute',
            top: '18px',
            [isRtl ? 'left' : 'right']: '18px',
            background: 'rgba(255, 255, 255, 0.08)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            color: '#ffffff',
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

        {/* Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid rgba(212, 175, 55, 0.2)',
          display: 'flex',
          alignItems: 'center',
          gap: '14px',
          background: 'linear-gradient(180deg, rgba(212, 175, 55, 0.08) 0%, transparent 100%)'
        }}>
          <div style={{
            width: '46px',
            height: '46px',
            borderRadius: '14px',
            background: 'linear-gradient(135deg, #d4af37 0%, #aa7c11 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.4rem',
            boxShadow: '0 6px 18px rgba(212, 175, 55, 0.35)',
            flexShrink: 0
          }}>
            ✨
          </div>
          <div>
            <h3 style={{
              margin: 0,
              fontSize: '1.25rem',
              fontWeight: 800,
              color: '#fef3c7',
              fontFamily: 'Cinzel, Playfair Display, serif',
              letterSpacing: '0.3px'
            }}>
              {isAr ? 'المساعد الذكي لمجوهرات HRSDGDG' : 'Concierge IA Joaillerie HRSDGDG'}
            </h3>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              marginTop: '4px',
              fontSize: '0.78rem',
              color: '#10b981',
              fontWeight: 700
            }}>
              <span style={{
                width: '7px',
                height: '7px',
                borderRadius: '50%',
                background: '#10b981',
                boxShadow: '0 0 8px #10b981'
              }}></span>
              <span>
                {isAr ? 'متصل الآن • استشارات فورية ومطابقة ذكية' : 'En ligne • Recommandations privées & sur-mesure'}
              </span>
            </div>
          </div>
        </div>

        {/* Messages List Area */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '22px',
          display: 'flex',
          flexDirection: 'column',
          gap: '18px'
        }}>
          {messages.map((msg, i) => {
            const isUser = msg.role === 'user';

            return (
              <div 
                key={i}
                style={{
                  alignSelf: isUser ? 'flex-end' : 'flex-start',
                  maxWidth: '85%',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px'
                }}
              >
                {/* Bubble Container */}
                <div style={{
                  padding: '16px 20px',
                  borderRadius: isUser ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                  background: isUser 
                    ? 'linear-gradient(135deg, #f6b22b 0%, #c48b18 100%)' 
                    : 'linear-gradient(145deg, rgba(28, 34, 48, 0.85) 0%, rgba(18, 22, 32, 0.95) 100%)',
                  color: isUser ? '#0a0d14' : '#f8fafc',
                  fontWeight: isUser ? 800 : 500,
                  fontSize: '0.94rem',
                  lineHeight: 1.65,
                  border: isUser ? 'none' : '1px solid rgba(212, 175, 55, 0.25)',
                  boxShadow: isUser 
                    ? '0 6px 20px rgba(246, 178, 43, 0.35)' 
                    : '0 6px 20px rgba(0, 0, 0, 0.35)',
                  whiteSpace: 'pre-line'
                }}>
                  {!isUser && (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      marginBottom: '8px',
                      fontSize: '0.74rem',
                      fontWeight: 800,
                      color: 'var(--primary-gold, #f6b22b)',
                      letterSpacing: '0.5px',
                      textTransform: 'uppercase'
                    }}>
                      <span>✨</span>
                      <span>{isAr ? 'المستشار الذكي' : 'Concierge IA'}</span>
                    </div>
                  )}
                  {msg.content}
                </div>

                {/* Recommendations Grid */}
                {msg.recommendations && msg.recommendations.length > 0 && (
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                    gap: '12px',
                    marginTop: '4px'
                  }}>
                    {msg.recommendations.map(item => {
                      const isFirstHand = item.type_vente === 'FIRST_HAND';
                      const itemTitle = (isAr && item.titre_ar) ? item.titre_ar : item.titre;
                      const itemImg = (item.images && item.images[0]) || '/gold-bars-perfect.png';

                      return (
                        <div 
                          key={item.id}
                          style={{
                            background: 'rgba(21, 25, 36, 0.95)',
                            border: '1px solid rgba(212, 175, 55, 0.3)',
                            borderRadius: '14px',
                            padding: '12px',
                            display: 'flex',
                            gap: '12px',
                            alignItems: 'center',
                            boxShadow: '0 6px 16px rgba(0, 0, 0, 0.4)',
                            transition: 'transform 0.2s, border-color 0.2s'
                          }}
                        >
                          <img 
                            src={itemImg} 
                            alt={itemTitle}
                            style={{
                              width: '56px',
                              height: '56px',
                              borderRadius: '10px',
                              objectFit: 'cover',
                              border: '1px solid rgba(255, 255, 255, 0.1)',
                              flexShrink: 0
                            }}
                          />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{
                              fontSize: '0.84rem',
                              fontWeight: 700,
                              color: '#ffffff',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              marginBottom: '4px'
                            }}>
                              {itemTitle}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                              <span style={{
                                fontSize: '0.68rem',
                                padding: '1px 6px',
                                borderRadius: '4px',
                                fontWeight: 800,
                                background: isFirstHand ? 'rgba(16, 185, 129, 0.15)' : 'rgba(212, 175, 55, 0.15)',
                                color: isFirstHand ? '#10b981' : '#f6b22b',
                                border: isFirstHand ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(212, 175, 55, 0.3)'
                              }}>
                                {isFirstHand 
                                  ? (isAr ? 'جديد (أصلي)' : 'Première Main') 
                                  : (isAr ? 'مستعمل معتمد' : 'Seconde Main')}
                              </span>
                            </div>
                            <div style={{
                              fontSize: '0.98rem',
                              fontWeight: 900,
                              color: '#f6b22b',
                              fontFamily: 'system-ui, sans-serif'
                            }} dir="ltr">
                              {Number(item.prix).toLocaleString('fr-FR')} {isAr ? 'د.م' : 'DH'}
                            </div>
                          </div>
                          <button 
                            type="button"
                            onClick={() => {
                              if (onSelectProduct) onSelectProduct(item);
                              onClose();
                            }}
                            style={{
                              background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.25) 0%, rgba(212, 175, 55, 0.1) 100%)',
                              border: '1px solid rgba(212, 175, 55, 0.45)',
                              color: '#fef3c7',
                              borderRadius: '8px',
                              padding: '8px 12px',
                              fontSize: '0.78rem',
                              fontWeight: 800,
                              cursor: 'pointer',
                              flexShrink: 0,
                              transition: 'all 0.2s'
                            }}
                          >
                            {isAr ? 'معاينة' : 'Voir'}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}

          {/* Prompt suggestions if only initial message */}
          {messages.length === 1 && (
            <div style={{ marginTop: '8px' }}>
              <div style={{ fontSize: '0.78rem', color: '#94a3b8', fontWeight: 600, marginBottom: '8px' }}>
                💡 {isAr ? 'اقتراحات سريعة للبدء :' : 'Suggestions rapides pour commencer :'}
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {quickPrompts.map((qp, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSendQuery(qp.query)}
                    style={{
                      background: 'rgba(212, 175, 55, 0.08)',
                      border: '1px solid rgba(212, 175, 55, 0.25)',
                      color: '#fef3c7',
                      borderRadius: '10px',
                      padding: '7px 14px',
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      textAlign: 'start'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(212, 175, 55, 0.18)';
                      e.currentTarget.style.borderColor = 'rgba(212, 175, 55, 0.5)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(212, 175, 55, 0.08)';
                      e.currentTarget.style.borderColor = 'rgba(212, 175, 55, 0.25)';
                    }}
                  >
                    {qp.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Thinking / Searching Animation */}
          {isThinking && (
            <div style={{
              alignSelf: 'flex-start',
              padding: '14px 20px',
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(212, 175, 55, 0.25)',
              borderRadius: '16px 16px 16px 4px',
              color: '#fef3c7',
              fontSize: '0.9rem',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              <span style={{ animation: 'spin 1.5s linear infinite', display: 'inline-block' }}>✨</span>
              <span>{isAr ? 'المساعد الذكي يبحث لكم عن أنسب القطع في الكتالوج...' : 'Le Concierge recherche les plus belles pièces pour vous...'}</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Form Bar */}
        <form 
          onSubmit={handleFormSubmit} 
          style={{
            padding: '16px 20px',
            borderTop: '1px solid rgba(212, 175, 55, 0.2)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            background: 'rgba(10, 12, 18, 0.95)'
          }}
        >
          <input 
            type="text" 
            placeholder={isAr ? "مثال: أبحث عن هدية لزوجتي بميزانية 3000 درهم..." : "Ex: Je cherche une bague en or 18k pour fiançailles, budget 5000 DH..."}
            value={inputQuery}
            onChange={e => setInputQuery(e.target.value)}
            style={{
              flex: 1,
              padding: '13px 18px',
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(212, 175, 55, 0.35)',
              borderRadius: '14px',
              color: '#ffffff',
              fontSize: '0.92rem',
              outline: 'none',
              transition: 'border-color 0.2s, box-shadow 0.2s',
              boxSizing: 'border-box'
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = '#f6b22b';
              e.currentTarget.style.boxShadow = '0 0 14px rgba(246, 178, 43, 0.25)';
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = 'rgba(212, 175, 55, 0.35)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          />
          <button 
            type="submit" 
            disabled={!inputQuery.trim() || isThinking}
            style={{
              padding: '13px 24px',
              background: (!inputQuery.trim() || isThinking) 
                ? 'rgba(255, 255, 255, 0.1)' 
                : 'linear-gradient(135deg, #f6b22b 0%, #aa7c11 100%)',
              color: (!inputQuery.trim() || isThinking) ? '#64748b' : '#08080a',
              border: 'none',
              borderRadius: '14px',
              fontWeight: 800,
              fontSize: '0.92rem',
              cursor: (!inputQuery.trim() || isThinking) ? 'not-allowed' : 'pointer',
              boxShadow: (!inputQuery.trim() || isThinking) ? 'none' : '0 4px 16px rgba(246, 178, 43, 0.3)',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <span>{isAr ? 'إرسال' : 'Envoyer'}</span>
            <span>{isRtl ? '←' : '→'}</span>
          </button>
        </form>
      </div>
    </div>
  );
}
