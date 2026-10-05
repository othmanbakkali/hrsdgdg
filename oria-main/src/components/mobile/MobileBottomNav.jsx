import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useLanguage } from '../../context/LanguageContext';

export default function MobileBottomNav({
  activeTab, // 'home', 'explore', 'cart', 'account'
  onChangeTab,
  onOpenCart,
  onOpenFinder
}) {
  const { user } = useAuth();
  const { cartItems } = useCart();
  const { lang, t } = useLanguage();
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

      {/* 3. Panier / Cart */}
      <button 
        className={`mobile-nav-item ${activeTab === 'cart' ? 'active' : ''}`}
        onClick={() => {
          onChangeTab('cart');
          if (onOpenCart) onOpenCart();
        }}
      >
        <span className="nav-icon-wrap" style={{ position: 'relative' }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={activeTab === 'cart' ? 'var(--primary-gold)' : '#64748b'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="9" cy="21" r="1"></circle>
            <circle cx="20" cy="21" r="1"></circle>
            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
          </svg>
          {cartCount > 0 && (
            <span className="nav-badge-pill" style={{ background: '#ef4444' }}>{cartCount}</span>
          )}
        </span>
        <span className="nav-text">{t('cart')}</span>
      </button>

      {/* 4. Mon Compte */}
      <button 
        className={`mobile-nav-item ${activeTab === 'account' ? 'active' : ''}`}
        onClick={() => onChangeTab('account')}
      >
        <span className="nav-icon-wrap">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={activeTab === 'account' ? 'var(--primary-gold)' : '#64748b'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
            <circle cx="12" cy="7" r="4"></circle>
          </svg>
        </span>
        <span className="nav-text">{user ? (user.nom.split(' ')[0] || t('account')) : t('account')}</span>
      </button>
    </div>
  );
}
