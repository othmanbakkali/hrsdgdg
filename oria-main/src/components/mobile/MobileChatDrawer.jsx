import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';

export default function MobileChatDrawer({
  isOpen,
  onClose,
  targetProduct = null
}) {
  const { user } = useAuth();
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
        {targetProduct && (
          <div className="chat-product-banner">
            <img src={targetProduct.images[0]} alt={targetProduct.titre} className="chat-banner-thumb" />
            <div className="chat-banner-info">
              <strong className="chat-banner-title">{targetProduct.titre}</strong>
              <span className="chat-banner-price">{targetProduct.prix.toLocaleString()} DH</span>
            </div>
            <a 
              href={`https://wa.me/212600000000?text=Bonjour, je vous contacte à propos du bijou: ${encodeURIComponent(targetProduct.titre)}`} 
              target="_blank" 
              rel="noreferrer"
              className="chat-whatsapp-btn"
            >
              WhatsApp 💬
            </a>
          </div>
        )}

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
