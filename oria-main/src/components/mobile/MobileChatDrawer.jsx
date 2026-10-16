import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';

export default function MobileChatDrawer({
  isOpen,
  onClose,
  targetProduct = null
}) {
  const { user } = useAuth();
  const { lang, isRtl } = useLanguage();
  const [messages, setMessages] = useState([
    {
      id: '1',
      sender: 'seller',
      text: 'Bonjour ! Merci pour votre intérêt. Ce bijou en or 18k est bien disponible avec son certificat et son écrin.',
      time: '14:15'
    },
    {
      id: '2',
      sender: 'user',
      text: 'Bonjour, la remise en main propre est-elle possible sur Casablanca ?',
      time: '14:22'
    },
    {
      id: '3',
      sender: 'seller',
      text: 'Oui tout à fait, au Triangle d\'Or ou par livraison sécurisée avec paiement à la livraison ! ✨',
      time: '14:25'
    }
  ]);

  const [inputVal, setInputVal] = useState('');

  if (!isOpen) return null;

  const quickQuestions = [
    'Est-ce toujours disponible ?',
    'Quel est votre dernier prix ?',
    'Poinçon officiel vérifié ?',
    'Remise en main propre possible ?'
  ];

  const handleSend = (textToSend) => {
    const txt = textToSend || inputVal;
    if (!txt.trim()) return;

    const newMsg = {
      id: Date.now().toString(),
      sender: 'user',
      text: txt,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, newMsg]);
    setInputVal('');

    // Simulated auto-reply
    setTimeout(() => {
      setMessages(prev => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: 'seller',
          text: 'Parfait, je reste à votre disposition. Vous pouvez aussi commander directement avec paiement à la livraison sécurisé ! 💎',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    }, 1500);
  };

  const sellerName = targetProduct?.vendeur_nom || 'Maison Royale Joaillerie';

  return (
    <div className="jewelia-modal-backdrop mobile-sheet-backdrop" onClick={onClose}>
      <div className="mobile-chat-drawer" onClick={e => e.stopPropagation()}>
        {/* Chat Header */}
        <div className="chat-drawer-header">
          <div className="chat-seller-profile">
            <div className="chat-avatar-badge">👑</div>
            <div>
              <strong className="chat-seller-name">{sellerName}</strong>
              <div className="chat-status-row">
                <span className="online-dot" />
                <span>En ligne • Vendeur vérifié</span>
              </div>
            </div>
          </div>
          <button className="sheet-close-btn" onClick={onClose}>✕</button>
        </div>

        {/* Product mini Banner if attached */}
        {targetProduct && (() => {
          const formatWhatsAppPhone = (rawPhone) => {
            let cleaned = (rawPhone || '').replace(/[^0-9]/g, '');
            if (!cleaned) return '212661889900';
            if (cleaned.startsWith('00212')) {
              cleaned = cleaned.substring(2);
            } else if (cleaned.startsWith('0') && cleaned.length >= 9) {
              cleaned = '212' + cleaned.substring(1);
            } else if (!cleaned.startsWith('212') && cleaned.length === 9) {
              cleaned = '212' + cleaned;
            }
            return cleaned;
          };

          const sellerPhone = targetProduct.vendeur_phone || targetProduct.telephone || targetProduct.phone || '';
          const cleanPhone = formatWhatsAppPhone(sellerPhone);
          const isAr = lang === 'ar';
          const targetTitle = (isAr && targetProduct.titre_ar) ? targetProduct.titre_ar : (targetProduct.titre_fr || targetProduct.titre || (isAr ? 'قطعة مجوهرات' : 'Bijou'));
          const waMsg = isAr
            ? `السلام عليكم، أتواصل معكم بخصوص هذه القطعة: ${targetTitle} (${targetProduct.prix?.toLocaleString()} د.م)`
            : `Bonjour, je vous contacte à propos du bijou: ${targetTitle} (${targetProduct.prix?.toLocaleString()} DH)`;
          const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(waMsg)}`;

          return (
            <div className="chat-product-banner">
              <img src={targetProduct.images && targetProduct.images[0]} alt={targetTitle} className="chat-banner-thumb" />
              <div className="chat-banner-info">
                <strong className="chat-banner-title">{targetTitle}</strong>
                <span className="chat-banner-price">{targetProduct.prix?.toLocaleString()} {isAr ? 'د.م' : 'DH'}</span>
              </div>
              <a 
                href={waUrl} 
                target="_blank" 
                rel="noreferrer"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" style={{ flexShrink: 0, width: '15px', height: '15px', display: 'inline-block', verticalAlign: 'middle' }}>
                  <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91C2.13 13.66 2.59 15.36 3.45 16.86L2.05 22L7.3 20.62C8.75 21.41 10.38 21.83 12.04 21.83C17.5 21.83 21.95 17.38 21.95 11.92C21.95 9.27 20.92 6.78 19.05 4.91C17.18 3.03 14.69 2 12.04 2ZM12.04 20.15C10.56 20.15 9.11 19.76 7.85 19L7.55 18.83L4.43 19.65L5.26 16.61L5.07 16.3C4.24 14.98 3.81 13.47 3.81 11.91C3.81 7.37 7.5 3.68 12.04 3.68C14.25 3.68 16.31 4.54 17.87 6.1C19.42 7.66 20.28 9.72 20.28 11.92C20.28 16.46 16.58 20.15 12.04 20.15ZM16.55 14.39C16.3 14.27 15.08 13.67 14.86 13.59C14.63 13.5 14.47 13.46 14.3 13.71C14.14 13.96 13.67 14.51 13.53 14.67C13.38 14.84 13.24 14.86 12.99 14.73C12.74 14.61 11.94 14.35 11 13.51C10.26 12.85 9.77 12.04 9.63 11.79C9.48 11.54 9.61 11.41 9.74 11.28C9.85 11.17 9.99 11 10.11 10.86C10.24 10.72 10.28 10.61 10.36 10.45C10.45 10.28 10.4 10.14 10.34 10.02C10.28 9.9 9.81 8.74 9.61 8.27C9.42 7.81 9.22 7.87 9.08 7.86C8.94 7.86 8.78 7.85 8.61 7.85C8.45 7.85 8.18 7.91 7.96 8.16C7.73 8.4 7.1 8.99 7.1 10.19C7.1 11.39 7.98 12.55 8.1 12.71C8.22 12.87 9.82 15.35 12.28 16.41C12.86 16.66 13.32 16.82 13.67 16.93C14.26 17.12 14.79 17.09 15.22 17.03C15.7 16.96 16.69 16.43 16.9 15.85C17.1 15.27 17.1 14.77 17.04 14.67C16.98 14.56 16.81 14.51 16.55 14.39Z" />
                </svg>
                <span>WhatsApp</span>
              </a>
            </div>
          );
        })()}

        {/* Messages List */}
        <div className="chat-messages-container">
          {messages.map(m => (
            <div key={m.id} className={`chat-bubble-row ${m.sender === 'user' ? 'outgoing' : 'incoming'}`}>
              <div className="chat-bubble">
                <p className="chat-text">{m.text}</p>
                <span className="chat-time">{m.time}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Quick Question Chips */}
        <div className="chat-quick-chips">
          {quickQuestions.map((q, idx) => (
            <button 
              key={idx}
              className="quick-chip-btn"
              onClick={() => handleSend(q)}
            >
              {q}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div className="chat-input-bar">
          <input 
            type="text"
            placeholder="Écrivez un message au vendeur..."
            value={inputVal}
            onChange={e => setInputVal(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSend()}
            className="chat-text-input"
          />
          <button 
            className="chat-send-btn"
            onClick={() => handleSend()}
            disabled={!inputVal.trim()}
          >
            ➤
          </button>
        </div>
      </div>
    </div>
  );
}
