import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useLanguage } from '../../context/LanguageContext';

export default function MobileBottomNav({
  activeTab, // 'home', 'explore', 'sell', 'messages', 'account'
  onChangeTab,
  onOpenSell,
  onOpenChat,
  onOpenFinder,
  unreadMessagesCount = 1
}) {
  const { user } = useAuth();
  const { cartItems } = useCart();
  const { lang, t } = useLanguage();
  const isAr = lang === 'ar';
  const cartCount = cartItems.length;

  return (
    <div className="mobile-avito-bottom-nav">
      {/* 1. Home / Accueil */}
      <button 
        className={`mobile-nav-item ${activeTab === 'home' ? 'active' : ''}`}
        onClick={() => onChangeTab('home')}
      >
        <span className="nav-icon-wrap">
          <svg width="22" height="22" viewBox="0 0 24 24" fill={activeTab === 'home' ? 'var(--primary-gold)' : 'none'} stroke={activeTab === 'home' ? 'var(--primary-gold)' : '#64748b'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
            <polyline points="9 22 9 12 15 12 15 22"></polyline>
          </svg>
        </span>
        <span className="nav-text">{t('home')}</span>
      </button>

      {/* 2. Explorer / Finder */}
      <button 
        className={`mobile-nav-item ${activeTab === 'explore' ? 'active' : ''}`}
        onClick={() => {
          onChangeTab('explore');
          if (onOpenFinder) onOpenFinder();
        }}
      >
        <span className="nav-icon-wrap">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={activeTab === 'explore' ? 'var(--primary-gold)' : '#64748b'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
        </span>
        <span className="nav-text">{t('search')}</span>
      </button>

      {/* 3. Central Big "+ Déposer" CTA Button (Avito Key Hallmark) */}
      <div className="mobile-nav-sell-wrapper">
        <button 
          className="mobile-nav-sell-btn"
          onClick={onOpenSell}
          title={isAr ? "نشر إعلان أو إطلاق مزاد" : "Déposer une annonce ou lancer une enchère"}
        >
          <div className="sell-btn-inner">
            <span className="sell-plus-icon">+</span>
          </div>
          <span className="sell-btn-label">{isAr ? 'بيع' : 'Vendre'}</span>
        </button>
      </div>

      {/* 4. Messages / Chat */}
      <button 
        className={`mobile-nav-item ${activeTab === 'messages' ? 'active' : ''}`}
        onClick={() => {
          onChangeTab('messages');
          if (onOpenChat) onOpenChat();
        }}
      >
        <span className="nav-icon-wrap" style={{ position: 'relative' }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={activeTab === 'messages' ? 'var(--primary-gold)' : '#64748b'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
          </svg>
          {unreadMessagesCount > 0 && (
            <span className="nav-badge-pill">{unreadMessagesCount}</span>
          )}
        </span>
        <span className="nav-text">{t('messages')}</span>
      </button>

      {/* 5. Mon Compte */}
      <button 
        className={`mobile-nav-item ${activeTab === 'account' ? 'active' : ''}`}
        onClick={() => onChangeTab('account')}
      >
        <span className="nav-icon-wrap" style={{ position: 'relative' }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={activeTab === 'account' ? 'var(--primary-gold)' : '#64748b'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
            <circle cx="12" cy="7" r="4"></circle>
          </svg>
          {cartCount > 0 && (
            <span className="nav-badge-pill" style={{ background: 'var(--primary-gold)' }}>{cartCount}</span>
          )}
        </span>
        <span className="nav-text">{user ? (user.nom.split(' ')[0] || t('account')) : t('account')}</span>
      </button>
    </div>
  );
}
