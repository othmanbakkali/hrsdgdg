import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useLanguage } from '../context/LanguageContext';

export default function ProductCard({
  product,
  onSelectProduct,
  onOpenChatWithSeller,
  viewMode = 'desktop', // 'desktop', 'grid', or 'list'
  isMobile = false
}) {
  const { lang, t } = useLanguage();
  const { user, toggleFavorite } = useAuth();
  const { addToCart } = useCart();
  const [activeImgIndex, setActiveImgIndex] = useState(0);

  const displayTitle = (lang === 'ar' && product.titre_ar) 
    ? product.titre_ar 
    : (product.titre_fr || product.titre);

  const isAuction = product.disponibilite === 'enchere' || product.type_vente === 'AUCTION';
  const isSecondHand = product.type_vente === 'SECOND_HAND' && !isAuction;
  const isFavorited = user?.favoris?.includes(product.id);
  const discountPercent = product.ancien_prix && product.ancien_prix > product.prix
    ? Math.round(((product.ancien_prix - product.prix) / product.ancien_prix) * 100)
    : 0;

  // Multi-image list with fallback to 3 thumbnails always available
  const productImages = product.images && product.images.length > 0 
    ? product.images 
    : ['https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=600&auto=format&fit=crop&q=80'];

  const thumbnailList = [
    productImages[0],
    productImages[1] || (productImages[0].includes('unsplash') ? `${productImages[0]}&crop=entropy&cs=tinysrgb&fit=crop` : productImages[0]),
    productImages[2] || (productImages.length > 1 ? productImages[1] : 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=300&auto=format&fit=crop&q=80')
  ];

  const sellerPhone = product.vendeur_phone || '+212661889900';
  const sellerCleanPhone = sellerPhone.replace(/[^0-9]/g, '');
  const whatsappUrl = `https://wa.me/${sellerCleanPhone}?text=${encodeURIComponent(lang === 'ar' ? `السلام عليكم، أنا مهتم بقطعة المجوهرات على HRSDGDG: ${displayTitle} (${product.prix?.toLocaleString()} درهم)` : `Bonjour, je suis intéressé par votre bijou sur HRSDGDG : ${displayTitle} (${product.prix?.toLocaleString()} DH)`)}`;

  // Specs text
  const specsText = [
    isAuction 
      ? (lang === 'ar' ? 'مزاد علني مباشر' : 'Enchère en Direct') 
      : (product.etat || (isSecondHand ? (lang === 'ar' ? 'مستعمل' : 'Occasion') : (lang === 'ar' ? 'جديد' : 'Neuf'))),
    product.matiere ? `${product.matiere} ${product.purete || '18K'}` : (lang === 'ar' ? 'ذهب 18 قيراط' : 'Or 18K'),
    product.poids ? `${product.poids} ${t('grams') || 'غ'}` : null
  ].filter(Boolean).join(' • ');

  const monthlyEstimate = Math.round(product.prix / 12);

  // Time since posted simulation
  const timeText = product.date_creation 
    ? (lang === 'ar' ? 'منذ دقائق' : 'il y a 6 min') 
    : (lang === 'ar' ? 'منذ قليل' : 'il y a 8 min');

  return (
    <div 
      className={`avito-white-card ${isAuction ? 'auction-card' : (isSecondHand ? 'second-hand' : 'first-hand')} ${isMobile ? (viewMode === 'list' ? 'card-mode-list' : 'card-mode-grid') : 'desktop-card'}`}
      onClick={() => onSelectProduct && onSelectProduct(product)}
      style={isAuction ? { border: '1.5px solid rgba(239, 68, 68, 0.4)' } : {}}
    >
      {/* 1. TOP MULTI-PHOTO GALLERY (AVITO MOROCCO FORMAT) */}
      <div className="avito-card-gallery">
        {/* Main Photo */}
        <div className="gallery-main-photo-wrap">
          <img 
            src={productImages[activeImgIndex] || productImages[0]} 
            alt={displayTitle}
            className="gallery-main-photo"
            loading="lazy"
          />

          {/* Top-Right Round Favorite Button */}
          <button 
            type="button"
            className={`avito-fav-btn ${isFavorited ? 'favorited' : ''}`}
            onClick={(e) => {
              e.stopPropagation();
              toggleFavorite(product.id);
            }}
            title={isFavorited ? (lang === 'ar' ? "إزالة من المفضلة" : "Retirer des favoris") : (lang === 'ar' ? "إضافة إلى المفضلة" : "Ajouter aux favoris")}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill={isFavorited ? "#ef4444" : "none"} stroke={isFavorited ? "#ef4444" : "#475569"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
            </svg>
          </button>

          {/* Universe Badge */}
          {isAuction ? (
            <span className="avito-universe-tag" style={{ background: '#ef4444', color: '#ffffff', fontWeight: 800 }}>
              🔨 {lang === 'ar' ? 'مزاد مباشر' : 'Enchère en Direct'}
            </span>
          ) : (
            <span className={`avito-universe-tag ${isSecondHand ? 'second' : 'first'}`}>
              {isSecondHand ? (lang === 'ar' ? '♻️ مستعمل' : '♻️ Seconde Main') : (lang === 'ar' ? '✨ جديد' : '✨ Neuf')}
            </span>
          )}

          {/* Discount Badge */}
          {discountPercent > 0 && !isAuction && (
            <span className="avito-discount-tag">-{discountPercent}%</span>
          )}
        </div>

        {/* 3 Thumbnails Strip Underneath */}
        <div className="gallery-thumbs-strip">
          {thumbnailList.map((thumbUrl, idx) => (
            <div 
              key={idx}
              className={`gallery-thumb-item ${activeImgIndex === idx ? 'active' : ''}`}
              onClick={(e) => {
                e.stopPropagation();
                setActiveImgIndex(idx);
              }}
              onMouseEnter={() => !isMobile && setActiveImgIndex(idx)}
            >
              <img src={thumbUrl} alt="" className="thumb-img" loading="lazy" />
            </div>
          ))}

          {/* Orange Verified Seller Badge on Thumbnail corner */}
          <div className="avito-verified-star-badge" title={lang === 'ar' ? 'تاجر معتمد ومفحوص على المنصة' : 'Vendeur Certifié & Vérifié HRSDGDG'}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="white">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
            </svg>
          </div>
        </div>
      </div>

      {/* 2. CARD CONTENT ON CRISP WHITE BACKGROUND */}
      <div className="avito-card-body">
        {/* Title */}
        <h4 className="avito-card-title" title={displayTitle}>
          {displayTitle}
        </h4>

        {/* Specs / Condition Subtitle */}
        <div className="avito-card-specs">
          <span>{specsText}</span>
        </div>

        {/* Rating & Fast Delivery Line */}
        <div className="avito-delivery-rating-line">
          <span className="avito-rating-badge">★ {product.note || '4.9'}</span>
          <span className="avito-delivery-tag">⚡ {lang === 'ar' ? 'شحن 24 ساعة' : 'Expédié 24h'}</span>
        </div>

        {/* Price Row */}
        <div className="avito-price-row">
          {isAuction ? (
            <div>
              <div style={{ fontSize: '0.72rem', color: '#ef4444', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                {lang === 'ar' ? '🔥 بداية المزاد' : '🔥 MISE DE DÉPART'}
              </div>
              <div className="avito-main-price-wrap">
                <span className="avito-main-price" style={{ color: '#b38728' }}>
                  {product.prix ? product.prix.toLocaleString() : '1 000'} <span className="avito-dh-label">{t('currency') || 'درهم'}</span>
                </span>
              </div>
            </div>
          ) : (
            <div>
              <div style={{ fontSize: '0.72rem', color: '#b38728', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                {lang === 'ar' ? '💎 سعر مباشر' : '💎 PRIX DIRECT'}
              </div>
              <div className="avito-main-price-wrap">
                <span className="avito-main-price">
                  {product.prix ? product.prix.toLocaleString() : (lang === 'ar' ? 'السعر غير محدد' : 'Prix non spécifié')} <span className="avito-dh-label">{t('currency') || 'درهم'}</span>
                </span>
                {discountPercent > 0 && product.ancien_prix && (
                  <span className="avito-strike-price">
                    {product.ancien_prix.toLocaleString()} {t('currency') || 'درهم'}
                  </span>
                )}
              </div>
            </div>
          )}
          {!isAuction && product.prix && (
            <span className="avito-monthly-price">
              {lang === 'ar' ? `أو ${monthlyEstimate.toLocaleString()} درهم/شهر` : `ou ${monthlyEstimate.toLocaleString()} DH/mois`}
            </span>
          )}
        </div>

        {/* Location & Relative Time */}
        <div className="avito-location-time-row">
          <span className="avito-city-name">{product.city || 'Casablanca'}</span>
          <span className="avito-time-text">• {timeText}</span>
        </div>

        {/* 3. FOOTER ROW: SELLER INFO & 3 ACTION BUTTONS (CHAT, WHATSAPP, CALL) */}
        <div className="avito-card-footer">
          {/* Seller profile on left */}
          <div className="avito-seller-info">
            <div className="avito-seller-avatar">
              {(product.vendeur_nom || (lang === 'ar' ? 'صائغ' : 'Joaillerie')).charAt(0).toUpperCase()}
            </div>
            <div className="avito-seller-text-wrap">
              <div className="seller-name-row">
                <span className="avito-seller-name">{product.vendeur_nom || (lang === 'ar' ? 'مجوهرات ملكية' : 'Joaillerie Royale')}</span>
                <span className="seller-pro-star">⭐</span>
              </div>
              <span className="avito-boutique-tag">🏪 {lang === 'ar' ? 'متجر معتمد' : 'Boutique'}</span>
            </div>
          </div>

          {/* 4 Quick Action Round Buttons */}
          <div className="avito-action-buttons">
            {/* 1. Chat Button */}
            <button 
              type="button"
              className="avito-circle-btn btn-chat"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '32px',
                height: '32px',
                minWidth: '32px',
                minHeight: '32px',
                borderRadius: '50%',
                background: '#fffbf0',
                border: '1.5px solid #d4af37',
                color: '#b38728',
                cursor: 'pointer',
                padding: 0,
                outline: 'none',
                boxShadow: '0 2px 5px rgba(179, 135, 40, 0.15)'
              }}
              onClick={(e) => {
                e.stopPropagation();
                onOpenChatWithSeller && onOpenChatWithSeller(product);
              }}
              title={lang === 'ar' ? "مراسلة الصائغ" : "Discuter avec le joaillier"}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
              </svg>
            </button>

            {/* 2. WhatsApp Button */}
            <a 
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="avito-circle-btn btn-whatsapp"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '32px',
                height: '32px',
                minWidth: '32px',
                minHeight: '32px',
                borderRadius: '50%',
                background: '#f0fdf4',
                border: '1.5px solid #22c55e',
                color: '#16a34a',
                cursor: 'pointer',
                textDecoration: 'none',
                padding: 0,
                outline: 'none',
                boxShadow: '0 2px 5px rgba(22, 163, 74, 0.15)'
              }}
              onClick={(e) => e.stopPropagation()}
              title={lang === 'ar' ? "تواصل عبر واتساب" : "Contacter sur WhatsApp"}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91C2.13 13.66 2.59 15.36 3.45 16.86L2.05 22L7.3 20.62C8.75 21.41 10.38 21.83 12.04 21.83C17.5 21.83 21.95 17.38 21.95 11.92C21.95 9.27 20.92 6.78 19.05 4.91C17.18 3.03 14.69 2 12.04 2ZM12.04 20.15C10.56 20.15 9.11 19.76 7.85 19L7.55 18.83L4.43 19.65L5.26 16.61L5.07 16.3C4.24 14.98 3.81 13.47 3.81 11.91C3.81 7.37 7.5 3.68 12.04 3.68C14.25 3.68 16.31 4.54 17.87 6.1C19.42 7.66 20.28 9.72 20.28 11.92C20.28 16.46 16.58 20.15 12.04 20.15ZM16.55 14.39C16.3 14.27 15.08 13.67 14.86 13.59C14.63 13.5 14.47 13.46 14.3 13.71C14.14 13.96 13.67 14.51 13.53 14.67C13.38 14.84 13.24 14.86 12.99 14.73C12.74 14.61 11.94 14.35 11 13.51C10.26 12.85 9.77 12.04 9.63 11.79C9.48 11.54 9.61 11.41 9.74 11.28C9.85 11.17 9.99 11 10.11 10.86C10.24 10.72 10.28 10.61 10.36 10.45C10.45 10.28 10.4 10.14 10.34 10.02C10.28 9.9 9.81 8.74 9.61 8.27C9.42 7.81 9.22 7.87 9.08 7.86C8.94 7.86 8.78 7.85 8.61 7.85C8.45 7.85 8.18 7.91 7.96 8.16C7.73 8.4 7.1 8.99 7.1 10.19C7.1 11.39 7.98 12.55 8.1 12.71C8.22 12.87 9.82 15.35 12.28 16.41C12.86 16.66 13.32 16.82 13.67 16.93C14.26 17.12 14.79 17.09 15.22 17.03C15.7 16.96 16.69 16.43 16.9 15.85C17.1 15.27 17.1 14.77 17.04 14.67C16.98 14.56 16.81 14.51 16.55 14.39Z" />
              </svg>
            </a>

            {/* 3. Call Button */}
            <a 
              href={`tel:${sellerCleanPhone}`}
              className="avito-circle-btn btn-call"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '32px',
                height: '32px',
                minWidth: '32px',
                minHeight: '32px',
                borderRadius: '50%',
                background: '#eff6ff',
                border: '1.5px solid #3b82f6',
                color: '#2563eb',
                cursor: 'pointer',
                textDecoration: 'none',
                padding: 0,
                outline: 'none',
                boxShadow: '0 2px 5px rgba(37, 99, 235, 0.15)'
              }}
              onClick={(e) => e.stopPropagation()}
              title={lang === 'ar' ? "الاتصال بالصائغ" : "Appeler le joaillier"}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
              </svg>
            </a>

            {/* 4. Cart Button */}
            <button 
              type="button"
              className="avito-circle-btn btn-cart"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '32px',
                height: '32px',
                minWidth: '32px',
                minHeight: '32px',
                borderRadius: '50%',
                background: '#faf5ff',
                border: '1.5px solid #a855f7',
                color: '#9333ea',
                cursor: 'pointer',
                padding: 0,
                outline: 'none',
                boxShadow: '0 2px 5px rgba(147, 51, 234, 0.15)'
              }}
              onClick={(e) => {
                e.stopPropagation();
                addToCart(product);
              }}
              title={lang === 'ar' ? "إضافة إلى السلة" : "Ajouter au panier"}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="9" cy="21" r="1"></circle>
                <circle cx="20" cy="21" r="1"></circle>
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
