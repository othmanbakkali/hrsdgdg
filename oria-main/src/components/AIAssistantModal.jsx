import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useCart } from '../context/CartContext';

export default function AIAssistantModal({ isOpen, onClose, products = [], onSelectProduct }) {
  const { lang, t } = useLanguage();
  const isAr = lang === 'ar';
  const { addToCart } = useCart();

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

  if (!isOpen) return null;

  const handleSend = (e) => {
    e.preventDefault();
    if (!inputQuery.trim()) return;

    const userText = inputQuery;
    setInputQuery('');
    setMessages(prev => [...prev, { role: 'user', content: userText }]);
    setIsThinking(true);

    setTimeout(() => {
      // Analyze text
      const lower = userText.toLowerCase();
      let maxBudget = 25000;
      const budgetMatch = lower.match(/(\d+)\s*(dh|mad|dhs|درهم)?/i);
      if (budgetMatch && parseInt(budgetMatch[1]) > 100) {
        maxBudget = parseInt(budgetMatch[1]);
      }

      // Filter products based on keywords & budget
      const matches = products.filter(p => {
        const full = (p.titre + ' ' + p.description + ' ' + p.matiere + ' ' + p.pierre + ' ' + p.style + ' ' + p.occasion + ' ' + p.pour_qui).toLowerCase();
        
        let matchesKey = true;
        if ((lower.includes('femme') || lower.includes('نساء') || lower.includes('زوجتي')) && p.pour_qui && p.pour_qui !== 'Femme') matchesKey = false;
        if ((lower.includes('homme') || lower.includes('رجال') || lower.includes('زوجي')) && p.pour_qui && p.pour_qui !== 'Homme') matchesKey = false;
        if ((lower.includes('vintage') || lower.includes('مستعمل') || lower.includes('قديم')) && p.type_vente !== 'SECOND_HAND') matchesKey = false;
        if ((lower.includes('bague') || lower.includes('خاتم')) && p.category_id !== 'cat_rings') matchesKey = false;
        if ((lower.includes('collier') || lower.includes('قلادة') || lower.includes('عقد')) && p.category_id !== 'cat_necklaces') matchesKey = false;
        if ((lower.includes('bracelet') || lower.includes('سوار') || lower.includes('دملج')) && p.category_id !== 'cat_bracelets') matchesKey = false;
        if ((lower.includes('artisanal') || lower.includes('artisanale') || lower.includes('حرفي') || lower.includes('صناعة يدوية') || lower.includes('artisanat')) && p.category_id !== 'cat_artisanal' && (p.style || '').toLowerCase() !== 'artisanal' && (p.style || '').toLowerCase() !== 'traditionnel') matchesKey = false;

        return matchesKey && p.prix <= maxBudget;
      }).slice(0, 4);

      const firstHandCount = matches.filter(m => m.type_vente === 'FIRST_HAND').length;
      const secondHandCount = matches.filter(m => m.type_vente === 'SECOND_HAND').length;

      const aiContent = isAr 
        ? `✨ وجدت ${matches.length} قطعة مجوهرات تطابق بحثكم بدقة (الميزانية ≤ ${maxBudget.toLocaleString()} درهم).\n\n• ${firstHandCount} قطعة جديدة مع الضمان والفاتورة\n• ${secondHandCount} قطعة مستعملة معتمدة ومفحوصة`
        : `✨ J'ai trouvé ${matches.length} bijoux qui correspondent parfaitement à votre recherche (budget ≤ ${maxBudget.toLocaleString()} DH).\n\n• ${firstHandCount} bijou(x) Première Main (neufs avec garantie)\n• ${secondHandCount} bijou(x) Seconde Main (d'époque certifiés)`;

      const aiResponse = {
        role: 'assistant',
        content: aiContent,
        recommendations: matches
      };

      setMessages(prev => [...prev, aiResponse]);
      setIsThinking(false);
    }, 900);
  };

  return (
    <div className="jewelia-modal-backdrop" onClick={onClose}>
      <div 
        className="jewelia-modal-content" 
        style={{ maxWidth: '720px', height: '620px', display: 'flex', flexDirection: 'column' }}
        onClick={e => e.stopPropagation()}
      >
        <button className="modal-close-btn" onClick={onClose}>✕</button>

        {/* Header */}
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-gold)', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'linear-gradient(135deg, #d4af37, #996515)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', boxShadow: '0 0 15px rgba(212, 175, 55, 0.4)' }}>
            ✨
          </div>
          <div>
            <h3 style={{ fontSize: '1.15rem', color: '#fff' }}>
              {isAr ? 'المساعد الذكي HRSDGDG' : 'Concierge IA HRSDGDG'}
            </h3>
            <span style={{ fontSize: '0.78rem', color: '#10b981' }}>
              ● {isAr ? 'متصل الآن • ترشيحات ذكية وفورية' : 'En ligne • Recommandations intelligentes'}
            </span>
          </div>
        </div>

        {/* Messages List */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {messages.map((msg, i) => (
            <div 
              key={i}
              style={{
                alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                maxWidth: '85%',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
              }}
            >
              <div 
                style={{
                  padding: '14px 18px',
                  borderRadius: '16px',
                  background: msg.role === 'user' ? 'linear-gradient(135deg, #d4af37, #aa7c11)' : 'rgba(255, 255, 255, 0.06)',
                  color: msg.role === 'user' ? '#08080a' : '#fff',
                  fontWeight: msg.role === 'user' ? 700 : 400,
                  fontSize: '0.9rem',
                  lineHeight: 1.5,
                  border: msg.role === 'user' ? 'none' : '1px solid rgba(255, 255, 255, 0.08)',
                  whiteSpace: 'pre-line'
                }}
              >
                {msg.content}
              </div>

              {/* Recommendations cards */}
              {msg.recommendations && msg.recommendations.length > 0 && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '4px' }}>
                  {msg.recommendations.map(item => (
                    <div 
                      key={item.id}
                      style={{
                        background: 'rgba(22, 22, 30, 0.95)',
                        border: '1px solid var(--border-gold)',
                        borderRadius: '8px',
                        padding: '10px',
                        display: 'flex',
                        gap: '10px',
                        alignItems: 'center'
                      }}
                    >
                      <img 
                        src={item.images[0]} 
                        alt={item.titre}
                        style={{ width: '50px', height: '50px', borderRadius: '6px', objectFit: 'cover' }}
                      />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {(isAr && item.titre_ar) ? item.titre_ar : item.titre}
                        </div>
                        <div style={{ fontSize: '0.88rem', fontWeight: 800, color: 'var(--primary-gold)' }} dir="ltr">
                          {item.prix} {isAr ? 'د.م' : 'DH'}
                        </div>
                      </div>
                      <button 
                        onClick={() => {
                          onSelectProduct(item);
                          onClose();
                        }}
                        style={{
                          background: 'rgba(212, 175, 55, 0.2)',
                          border: '1px solid var(--border-gold)',
                          color: 'var(--light-gold)',
                          borderRadius: '4px',
                          padding: '6px 8px',
                          fontSize: '0.75rem',
                          cursor: 'pointer'
                        }}
                      >
                        {isAr ? 'عرض' : 'Voir'}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}

          {isThinking && (
            <div style={{ alignSelf: 'flex-start', padding: '12px 18px', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '16px', color: 'var(--light-gold)', fontSize: '0.85rem' }}>
              ✨ {isAr ? 'المساعد الذكي يبحث لكم عن أنسب القطع...' : 'Le Concierge recherche les meilleures pièces...'}
            </div>
          )}
        </div>

        {/* Input */}
        <form onSubmit={handleSend} style={{ padding: '16px 20px', borderTop: '1px solid rgba(255, 255, 255, 0.08)', display: 'flex', gap: '10px' }}>
          <input 
            type="text" 
            placeholder={isAr ? "مثال: أبحث عن هدية لزوجتي بميزانية 2500 د.م..." : "Ex: Je cherche un cadeau pour ma femme, budget 1500 DH..."}
            value={inputQuery}
            onChange={e => setInputQuery(e.target.value)}
            className="filter-number-input"
            style={{ flex: 1, padding: '12px 16px' }}
          />
          <button type="submit" className="btn-jewelia-primary" style={{ padding: '12px 20px' }}>
            {isAr ? 'إرسال' : 'Envoyer'}
          </button>
        </form>
      </div>
    </div>
  );
}
