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
    : (product.titre_fr || product.titre || 'Bijou Précieux');

  const isSold = product.etat === 'Vendu' || product.disponibilite === 'vendu' || product.disponibilite === 'archive_vendu';
  const isAuction = !isSold && (product.disponibilite === 'enchere' || product.type_vente === 'AUCTION');
  const isSecondHand = !isSold && !isAuction && product.type_vente === 'SECOND_HAND';
  const isFavorited = user?.favoris?.includes(product.id);
  const discountPercent = product.ancien_prix && product.ancien_prix > product.prix
    ? Math.round(((product.ancien_prix - product.prix) / product.ancien_prix) * 100)
    : 0;

  // Real grammage from database
  const realGramme = product.gramme !== undefined && product.gramme !== null && product.gramme !== '' 
    ? product.gramme 
    : (product.poids !== undefined && product.poids !== null && product.poids !== '' ? product.poids : null);

  // Multi-image list with fallback
  const productImages = product.images && product.images.length > 0 
    ? product.images 
    : ['https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=600&auto=format&fit=crop&q=80'];

  const thumbnailList = [
    productImages[0],
    productImages[1] || (productImages[0].includes('unsplash') ? `${productImages[0]}&crop=entropy&cs=tinysrgb&fit=crop` : productImages[0]),
    productImages[2] || (productImages.length > 1 ? productImages[1] : 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=300&auto=format&fit=crop&q=80')
  ];

  // Moroccan WhatsApp phone formatter (strictly cleans and ensures international format without leading + in wa.me)
  const formatWhatsAppPhone = (rawPhone) => {
    if (!rawPhone) return '';
    let cleaned = String(rawPhone).replace(/[^0-9]/g, '');
    if (cleaned.startsWith('00212')) {
      cleaned = cleaned.substring(2);
    } else if (cleaned.startsWith('0') && cleaned.length >= 9) {
      cleaned = '212' + cleaned.substring(1);
    } else if (!cleaned.startsWith('212') && cleaned.length === 9) {
      cleaned = '212' + cleaned;
    }
    return cleaned;
  };

  const sellerRawPhone = product.vendeur_phone || product.telephone || product.phone || '';
  const sellerCleanPhone = formatWhatsAppPhone(sellerRawPhone);
  const hasValidPhone = Boolean(sellerCleanPhone && sellerCleanPhone.length >= 11);

  // Public direct product URL
  const productUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}/?product=${product.id}` 
    : `https://hrsdgdg.ma/?product=${product.id}`;

  const grammageDisplay = realGramme !== null && realGramme !== undefined && Number(realGramme) > 0
    ? `${realGramme} g`
    : (lang === 'ar' ? 'غير محدد' : 'Non renseigné');

  const cityDisplay = product.city || (lang === 'ar' ? 'الدار البيضاء' : 'Casablanca');

  // Pre-filled WhatsApp message matching exact specification (Req 9)
  const whatsappPreFilledText = lang === 'ar'
    ? `السلام عليكم، أرغب في الحصول على معلومات حول هذه القطعة.

القطعة : ${displayTitle}
المرجع : ${product.id}
السعر : ${product.prix ? product.prix.toLocaleString() : 'N/A'} MAD
الوزن : ${grammageDisplay}
المدينة : ${cityDisplay}
رابط القطعة : ${productUrl}

هل هذه القطعة لا تزال متوفرة ؟

شكراً.`
    : `Bonjour, je souhaite avoir des informations sur cet article.

Article : ${displayTitle}
Référence : ${product.id}
Prix : ${product.prix ? product.prix.toLocaleString() : 'N/A'} MAD
Grammage : ${grammageDisplay}
Ville : ${cityDisplay}
Lien du produit : ${productUrl}

Cet article est-il toujours disponible ?

Merci.`;

  const whatsappUrl = hasValidPhone 
    ? `https://wa.me/${sellerCleanPhone}?text=${encodeURIComponent(whatsappPreFilledText)}`
    : '#';

  const handleWhatsAppClick = (e) => {
    e.stopPropagation();
    if (isSold) {
      alert(lang === 'ar' ? 'هذه القطعة تم بيعها.' : 'Cet article a déjà été vendu.');
      return;
    }
    if (!hasValidPhone) {
      alert(lang === 'ar' ? 'رقم هاتف البائع غير متوفر حالياً.' : 'Le numéro WhatsApp de ce vendeur n\'est pas encore renseigné.');
      return;
    }
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
  };

  // State display text
  const etatDisplay = isSold 
    ? (lang === 'ar' ? 'تم البيع' : 'Vendu') 
    : (product.etat || (isSecondHand ? (lang === 'ar' ? 'مستعمل ممتازة' : 'Occasion') : (lang === 'ar' ? 'جديد 100%' : 'Neuf')));

  return (
    <div 
      className={`avito-white-card ${isSold ? 'sold-card' : (isAuction ? 'auction-card' : (isSecondHand ? 'second-hand' : 'first-hand'))} ${isMobile ? (viewMode === 'list' ? 'card-mode-list' : 'card-mode-grid') : 'desktop-card'}`}
      onClick={() => onSelectProduct && onSelectProduct(product)}
      style={{
        display: 'flex',
        flexDirection: 'column',
        borderRadius: '12px',
        overflow: 'hidden',
        background: '#ffffff',
        border: isSold ? '1.5px solid #ef4444' : '1px solid rgba(212, 175, 55, 0.22)',
        boxShadow: '0 3px 12px rgba(0, 0, 0, 0.05)',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        cursor: 'pointer',
        position: 'relative'
      }}
    >
      {/* 1. PHOTO PRINCIPALE & THUMBNAILS */}
      <div className="avito-card-gallery" style={{ position: 'relative', width: '100%', background: '#0b0c10' }}>
        <div className="gallery-main-photo-wrap" style={{ position: 'relative', width: '100%', aspectRatio: '4/3', overflow: 'hidden' }}>
          <img 
            src={productImages[activeImgIndex] || productImages[0]} 
            alt={displayTitle}
            className="gallery-main-photo"
            loading="lazy"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              filter: isSold ? 'grayscale(0.6)' : 'none',
              transition: 'transform 0.3s ease'
            }}
          />

          {/* Favorite button */}
          <button 
            type="button"
            className={`avito-fav-btn ${isFavorited ? 'favorited' : ''}`}
            onClick={(e) => {
              e.stopPropagation();
              toggleFavorite(product.id);
            }}
            style={{
              position: 'absolute',
              top: '8px',
              right: lang === 'ar' ? 'auto' : '8px',
              left: lang === 'ar' ? '8px' : 'auto',
              background: 'rgba(255, 255, 255, 0.9)',
              border: 'none',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              zIndex: 3
            }}
            title={isFavorited ? (lang === 'ar' ? "إزالة من المفضلة" : "Retirer des favoris") : (lang === 'ar' ? "إضافة إلى المفضلة" : "Ajouter aux favoris")}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill={isFavorited ? "#ef4444" : "none"} stroke={isFavorited ? "#ef4444" : "#475569"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
            </svg>
          </button>

          {/* Badges: Sold, Auction, or Condition */}
          {isSold ? (
            <span style={{
              position: 'absolute',
              top: '8px',
              left: lang === 'ar' ? 'auto' : '8px',
              right: lang === 'ar' ? '8px' : 'auto',
              background: '#dc2626',
              color: '#ffffff',
              fontSize: '0.72rem',
              fontWeight: 800,
              padding: '3px 8px',
              borderRadius: '4px',
              letterSpacing: '0.5px',
              zIndex: 3
            }}>
              🏷️ {lang === 'ar' ? 'تم البيع' : 'Vendu'}
            </span>
          ) : isAuction ? (
            <span style={{
              position: 'absolute',
              top: '8px',
              left: lang === 'ar' ? 'auto' : '8px',
              right: lang === 'ar' ? '8px' : 'auto',
              background: '#ef4444',
              color: '#ffffff',
              fontSize: '0.72rem',
              fontWeight: 800,
              padding: '3px 8px',
              borderRadius: '4px',
              zIndex: 3
            }}>
              🔨 {lang === 'ar' ? 'مزاد حي' : 'Enchère'}
            </span>
          ) : null}

          {/* Discount Badge */}
          {discountPercent > 0 && !isAuction && !isSold && (
            <span style={{
              position: 'absolute',
              bottom: '8px',
              right: lang === 'ar' ? 'auto' : '8px',
              left: lang === 'ar' ? '8px' : 'auto',
              background: '#b38728',
              color: '#fff',
              fontSize: '0.7rem',
              fontWeight: 800,
              padding: '2px 6px',
              borderRadius: '4px',
              zIndex: 3
            }}>
              -{discountPercent}%
            </span>
          )}
        </div>

        {/* 3 Thumbnails Strip */}
        <div style={{ display: 'flex', gap: '4px', padding: '4px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
          {thumbnailList.map((thumbUrl, idx) => (
            <div 
              key={idx}
              onClick={(e) => {
                e.stopPropagation();
                setActiveImgIndex(idx);
              }}
              style={{
                flex: 1,
                height: '36px',
                borderRadius: '4px',
                overflow: 'hidden',
                cursor: 'pointer',
                opacity: activeImgIndex === idx ? 1 : 0.6,
                border: activeImgIndex === idx ? '2px solid #b38728' : '1px solid #cbd5e1'
              }}
            >
              <img src={thumbUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} loading="lazy" />
            </div>
          ))}
        </div>
      </div>

      {/* CARD BODY WITH STRICT ORDERING (REQ 7):
          2. Nom de l'article ou parure
          3. Prix
          4. Grammage
          5. Ville
          6. État de l'article
          7. Bouton d'action WhatsApp
      */}
      <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: '6px', flex: 1, justifyContent: 'space-between' }}>
        <div>
          {/* 2. Nom de l'article ou de la parure */}
          <h4 
            style={{
              fontSize: '0.96rem',
              fontWeight: 700,
              color: '#0f172a',
              margin: '0 0 4px 0',
              lineHeight: 1.3,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}
            title={displayTitle}
          >
            {displayTitle}
          </h4>

          {/* 3. Prix */}
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginBottom: '4px' }}>
            <span style={{ fontSize: '1.18rem', fontWeight: 800, color: isSold ? '#64748b' : '#b38728' }}>
              {product.prix ? product.prix.toLocaleString() : (lang === 'ar' ? 'السعر غير محدد' : 'Prix non spécifié')}
            </span>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b' }}>MAD</span>
            {discountPercent > 0 && product.ancien_prix && !isSold && (
              <span style={{ fontSize: '0.78rem', color: '#94a3b8', textDecoration: 'line-through' }}>
                {product.ancien_prix.toLocaleString()} MAD
              </span>
            )}
          </div>

          {/* 4. Grammage (en grammes 'g') */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: '#334155' }}>
            <span style={{ color: '#b38728', fontWeight: 700 }}>⚖️ {lang === 'ar' ? 'الوزن :' : 'Grammage :'}</span>
            <strong style={{ color: realGramme ? '#0f172a' : '#64748b' }}>
              {realGramme ? `${realGramme} g` : (lang === 'ar' ? 'غير محدد' : 'Non renseigné')}
            </strong>
          </div>

          {/* 5. Ville */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: '#64748b', marginTop: '2px' }}>
            <span>📍</span>
            <span style={{ fontWeight: 600 }}>{cityDisplay}</span>
            <span style={{ opacity: 0.5 }}>•</span>
            <span style={{ fontSize: '0.74rem' }}>{product.vendeur_nom || 'Vendeur Vérifié'}</span>
          </div>

          {/* 6. État de l'article */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px' }}>
            <span style={{ fontSize: '0.74rem', color: '#64748b' }}>{lang === 'ar' ? 'الحالة :' : 'État :'}</span>
            <span style={{
              display: 'inline-block',
              padding: '2px 8px',
              borderRadius: '4px',
              fontSize: '0.72rem',
              fontWeight: 700,
              background: isSold ? '#fee2e2' : '#f1f5f9',
              color: isSold ? '#dc2626' : '#334155',
              border: isSold ? '1px solid #fca5a5' : '1px solid #e2e8f0'
            }}>
              {etatDisplay}
            </span>
          </div>
        </div>

        {/* 7. BOUTON D'ACTION APPROPRIÉ : WHATSAPP */}
        <div style={{ marginTop: '10px', paddingTop: '8px', borderTop: '1px solid #f1f5f9' }}>
          {isSold ? (
            <button
              disabled
              style={{
                width: '100%',
                padding: '8px 10px',
                background: '#f1f5f9',
                color: '#94a3b8',
                border: '1px solid #cbd5e1',
                borderRadius: '8px',
                fontSize: '0.82rem',
                fontWeight: 700,
                cursor: 'not-allowed',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px'
              }}
            >
              🔒 {lang === 'ar' ? 'هذه القطعة مباعة' : 'Article Vendu'}
            </button>
          ) : (
            <button
              type="button"
              onClick={handleWhatsAppClick}
              disabled={!hasValidPhone}
              style={{
                width: '100%',
                padding: '9px 12px',
                background: hasValidPhone 
                  ? 'linear-gradient(135deg, #25D366 0%, #128C7E 100%)' 
                  : '#e2e8f0',
                color: hasValidPhone ? '#ffffff' : '#64748b',
                border: 'none',
                borderRadius: '8px',
                fontSize: '0.84rem',
                fontWeight: 700,
                cursor: hasValidPhone ? 'pointer' : 'not-allowed',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: hasValidPhone ? '0 3px 10px rgba(37, 211, 102, 0.28)' : 'none',
                transition: 'transform 0.15s ease, box-shadow 0.15s ease'
              }}
              title={hasValidPhone ? (lang === 'ar' ? "تواصل مع البائع عبر واتساب" : "Contacter le vendeur sur WhatsApp") : "Numéro de vendeur indisponible"}
            >
              <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91C2.13 13.66 2.59 15.36 3.45 16.86L2.05 22L7.3 20.62C8.75 21.41 10.38 21.83 12.04 21.83C17.5 21.83 21.95 17.38 21.95 11.92C21.95 9.27 20.92 6.78 19.05 4.91C17.18 3.03 14.69 2 12.04 2ZM12.04 20.15C10.56 20.15 9.11 19.76 7.85 19L7.55 18.83L4.43 19.65L5.26 16.61L5.07 16.3C4.24 14.98 3.81 13.47 3.81 11.91C3.81 7.37 7.5 3.68 12.04 3.68C14.25 3.68 16.31 4.54 17.87 6.1C19.42 7.66 20.28 9.72 20.28 11.92C20.28 16.46 16.58 20.15 12.04 20.15ZM16.55 14.39C16.3 14.27 15.08 13.67 14.86 13.59C14.63 13.5 14.47 13.46 14.3 13.71C14.14 13.96 13.67 14.51 13.53 14.67C13.38 14.84 13.24 14.86 12.99 14.73C12.74 14.61 11.94 14.35 11 13.51C10.26 12.85 9.77 12.04 9.63 11.79C9.48 11.54 9.61 11.41 9.74 11.28C9.85 11.17 9.99 11 10.11 10.86C10.24 10.72 10.28 10.61 10.36 10.45C10.45 10.28 10.4 10.14 10.34 10.02C10.28 9.9 9.81 8.74 9.61 8.27C9.42 7.81 9.22 7.87 9.08 7.86C8.94 7.86 8.78 7.85 8.61 7.85C8.45 7.85 8.18 7.91 7.96 8.16C7.73 8.4 7.1 8.99 7.1 10.19C7.1 11.39 7.98 12.55 8.1 12.71C8.22 12.87 9.82 15.35 12.28 16.41C12.86 16.66 13.32 16.82 13.67 16.93C14.26 17.12 14.79 17.09 15.22 17.03C15.7 16.96 16.69 16.43 16.9 15.85C17.1 15.27 17.1 14.77 17.04 14.67C16.98 14.56 16.81 14.51 16.55 14.39Z" />
              </svg>
              <span>{lang === 'ar' ? 'تواصل مع البائع عبر واتساب' : 'Contacter le vendeur sur WhatsApp'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
