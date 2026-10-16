import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage, translateCityToArabic } from '../context/LanguageContext';

export default function ProductCard({
  product,
  onSelectProduct,
  onOpenChatWithSeller,
  viewMode = 'desktop', // 'desktop', 'grid', or 'list'
  isMobile = false
}) {
  const { lang, t } = useLanguage();
  const { user, toggleFavorite } = useAuth();
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

  const isAr = lang === 'ar';

  const grammageDisplay = realGramme !== null && realGramme !== undefined && Number(realGramme) > 0
    ? `${realGramme} ${isAr ? 'غ' : 'g'}`
    : (isAr ? 'غير محدد' : 'Non renseigné');

  const cityDisplay = isAr ? translateCityToArabic(product.city) : (product.city || 'Casablanca');

  // Pre-filled WhatsApp message matching exact specification (Req 9)
  const whatsappPreFilledText = isAr
    ? `السلام عليكم، أرغب في الحصول على معلومات حول هذه القطعة.

القطعة : ${displayTitle}
المرجع : ${product.id}
السعر : ${product.prix ? product.prix.toLocaleString('fr-FR') : 'غير محدد'} د.م
الوزن : ${grammageDisplay}
المدينة : ${cityDisplay}
رابط القطعة : ${productUrl}

هل هذه القطعة لا تزال متوفرة ؟

شكراً.`
    : `Bonjour, je souhaite avoir des informations sur cet article.

Article : ${displayTitle}
Référence : ${product.id}
Prix : ${product.prix ? product.prix.toLocaleString('fr-FR') : 'N/A'} MAD
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
      alert(isAr ? 'هذه القطعة تم بيعها.' : 'Cet article a déjà été vendu.');
      return;
    }
    if (!hasValidPhone) {
      alert(isAr ? 'رقم هاتف البائع غير متوفر حالياً.' : 'Le numéro WhatsApp de ce vendeur n\'est pas encore renseigné.');
      return;
    }
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
  };

  // State display text
  const etatDisplay = isSold 
    ? (isAr ? 'تم البيع' : 'Vendu') 
    : (isAr
        ? (product.etat && (product.etat.toLowerCase().includes('occ') || product.etat.includes('مستعمل')) ? 'مستعمل ممتازة' : (isSecondHand ? 'مستعمل ممتازة' : 'جديد 100%'))
        : (product.etat || (isSecondHand ? 'Occasion' : 'Neuf')));

  return (
    <div 
      className={`avito-white-card ${isSold ? 'sold-card' : (isAuction ? 'auction-card' : (isSecondHand ? 'second-hand' : 'first-hand'))} ${isMobile ? (viewMode === 'list' ? 'card-mode-list' : 'card-mode-grid') : 'desktop-card'}`}
      onClick={() => onSelectProduct && onSelectProduct(product)}
      style={{
        display: 'flex',
        flexDirection: 'column',
        borderRadius: '10px',
        overflow: 'hidden',
        background: '#ffffff',
        border: isSold ? '1.5px solid #ef4444' : '1px solid rgba(212, 175, 55, 0.22)',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
        transition: 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.2s ease',
        cursor: 'pointer',
        position: 'relative'
      }}
    >
      {/* 1. PHOTO PRINCIPALE & COMPACT CAROUSEL CONTROLS */}
      <div className="avito-card-gallery" style={{ position: 'relative', width: '100%', background: '#0b0c10', overflow: 'hidden' }}>
        <div className="gallery-main-photo-wrap" style={{ position: 'relative', width: '100%', aspectRatio: '1 / 1', overflow: 'hidden' }}>
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

          {/* Interactive photo arrows on hover/desktop */}
          {productImages.length > 1 && (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveImgIndex((prev) => (prev > 0 ? prev - 1 : productImages.length - 1));
                }}
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: '4px',
                  transform: 'translateY(-50%)',
                  background: 'rgba(0, 0, 0, 0.45)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '50%',
                  width: '24px',
                  height: '24px',
                  fontSize: '13px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  zIndex: 3,
                  transition: 'background 0.2s ease'
                }}
                title={lang === 'ar' ? 'الصورة السابقة' : 'Photo précédente'}
              >
                ‹
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveImgIndex((prev) => (prev < productImages.length - 1 ? prev + 1 : 0));
                }}
                style={{
                  position: 'absolute',
                  top: '50%',
                  right: '4px',
                  transform: 'translateY(-50%)',
                  background: 'rgba(0, 0, 0, 0.45)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '50%',
                  width: '24px',
                  height: '24px',
                  fontSize: '13px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  zIndex: 3,
                  transition: 'background 0.2s ease'
                }}
                title={lang === 'ar' ? 'الصورة التالية' : 'Photo suivante'}
              >
                ›
              </button>
            </>
          )}

          {/* Floating Photo Dot Indicators */}
          {productImages.length > 1 && (
            <div 
              style={{
                position: 'absolute',
                bottom: '6px',
                left: '50%',
                transform: 'translateX(-50%)',
                display: 'flex',
                gap: '4px',
                background: 'rgba(0, 0, 0, 0.45)',
                backdropFilter: 'blur(4px)',
                padding: '2px 6px',
                borderRadius: '10px',
                zIndex: 3
              }}
            >
              {productImages.slice(0, 5).map((_, idx) => (
                <span
                  key={idx}
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveImgIndex(idx);
                  }}
                  style={{
                    width: activeImgIndex === idx ? '12px' : '5px',
                    height: '5px',
                    borderRadius: '3px',
                    background: activeImgIndex === idx ? '#D4AF37' : 'rgba(255, 255, 255, 0.7)',
                    display: 'inline-block',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                />
              ))}
            </div>
          )}

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
              top: '6px',
              right: lang === 'ar' ? 'auto' : '6px',
              left: lang === 'ar' ? '6px' : 'auto',
              background: 'rgba(255, 255, 255, 0.88)',
              border: 'none',
              borderRadius: '50%',
              width: '28px',
              height: '28px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              zIndex: 3,
              boxShadow: '0 2px 6px rgba(0,0,0,0.1)'
            }}
            title={isFavorited ? (lang === 'ar' ? "إزالة من المفضلة" : "Retirer des favoris") : (lang === 'ar' ? "إضافة إلى المفضلة" : "Ajouter aux favoris")}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill={isFavorited ? "#ef4444" : "none"} stroke={isFavorited ? "#ef4444" : "#475569"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
            </svg>
          </button>

          {/* Badges: Sold, Auction, or Condition */}
          {isSold ? (
            <span style={{
              position: 'absolute',
              top: '6px',
              left: lang === 'ar' ? 'auto' : '6px',
              right: lang === 'ar' ? '6px' : 'auto',
              background: '#dc2626',
              color: '#ffffff',
              fontSize: '0.68rem',
              fontWeight: 800,
              padding: '2px 7px',
              borderRadius: '4px',
              letterSpacing: '0.5px',
              zIndex: 3
            }}>
              🏷️ {lang === 'ar' ? 'تم البيع' : 'Vendu'}
            </span>
          ) : isAuction ? (
            <span style={{
              position: 'absolute',
              top: '6px',
              left: lang === 'ar' ? 'auto' : '6px',
              right: lang === 'ar' ? '6px' : 'auto',
              background: '#ef4444',
              color: '#ffffff',
              fontSize: '0.68rem',
              fontWeight: 800,
              padding: '2px 7px',
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
              bottom: '6px',
              right: lang === 'ar' ? 'auto' : '6px',
              left: lang === 'ar' ? '6px' : 'auto',
              background: '#b38728',
              color: '#fff',
              fontSize: '0.68rem',
              fontWeight: 800,
              padding: '2px 5px',
              borderRadius: '4px',
              zIndex: 3
            }}>
              -{discountPercent}%
            </span>
          )}
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
      <div style={{ padding: '8px 10px 10px', display: 'flex', flexDirection: 'column', gap: '4px', flex: 1, minWidth: 0, width: '100%', boxSizing: 'border-box' }}>
        <div style={{ minWidth: 0, width: '100%' }}>
          {/* 2. Nom de l'article ou de la parure (avec retour à la ligne automatique sans déformer l'affichage) */}
          <h4 
            className="avito-card-title"
            style={{
              fontSize: '0.88rem',
              fontWeight: 700,
              color: '#0f172a',
              margin: '0 0 4px 0',
              lineHeight: 1.35,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              wordBreak: 'break-word',
              overflowWrap: 'anywhere',
              minHeight: '2.7em',
              maxHeight: '2.7em',
              width: '100%',
              minWidth: 0,
              boxSizing: 'border-box'
            }}
            title={displayTitle}
          >
            {displayTitle}
          </h4>

          {/* 3 & 4. Prix et Grammage sur la même ligne */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px', marginBottom: '3px' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '3px', minWidth: 0, overflow: 'hidden' }}>
              <span style={{ fontSize: '1.08rem', fontWeight: 800, color: isSold ? '#64748b' : '#b38728', whiteSpace: 'nowrap' }}>
                {product.prix ? product.prix.toLocaleString() : (lang === 'ar' ? 'غير محدد' : 'N/A')}
              </span>
              <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b', whiteSpace: 'nowrap' }}>
                {lang === 'ar' ? 'د.م' : 'MAD'}
              </span>
              {discountPercent > 0 && product.ancien_prix && !isSold && (
                <span style={{ fontSize: '0.68rem', color: '#94a3b8', textDecoration: 'line-through', whiteSpace: 'nowrap' }}>
                  {product.ancien_prix.toLocaleString()}
                </span>
              )}
            </div>

            {/* Grammage (sur la même ligne que le prix) */}
            <div style={{ 
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: '3px', 
              fontSize: '0.74rem', 
              color: realGramme ? '#0f172a' : '#64748b', 
              whiteSpace: 'nowrap',
              flexShrink: 0,
              padding: '1px 5px',
              borderRadius: '4px',
              background: '#f8fafc',
              border: '1px solid #e2e8f0'
            }}>
              <span style={{ color: '#b38728', fontWeight: 700, fontSize: '0.74rem' }}>⚖️</span>
              <strong style={{ fontWeight: 700 }}>
                {realGramme ? `${realGramme} ${lang === 'ar' ? 'غ' : 'g'}` : (lang === 'ar' ? 'غير محدد' : 'N/A')}
              </strong>
            </div>
          </div>

          {/* 5. Ville */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.74rem', color: '#64748b', marginTop: '2px', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
            <span>📍</span>
            <span style={{ fontWeight: 600, color: '#334155' }}>{cityDisplay}</span>
            <span style={{ opacity: 0.4 }}>•</span>
            <span style={{ fontSize: '0.7rem', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {product.vendeur_nom || (lang === 'ar' ? 'بائع موثق' : 'Vendeur Vérifié')}
            </span>
          </div>

          {/* 6. État de l'article & Petite icône WhatsApp en face sur la même ligne */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px', marginTop: '6px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', minWidth: 0, overflow: 'hidden' }}>
              <span style={{ fontSize: '0.7rem', color: '#64748b', flexShrink: 0 }}>{lang === 'ar' ? 'الحالة :' : 'État :'}</span>
              <span style={{
                display: 'inline-block',
                padding: '1px 6px',
                borderRadius: '4px',
                fontSize: '0.68rem',
                fontWeight: 700,
                background: isSold ? '#fee2e2' : '#f1f5f9',
                color: isSold ? '#dc2626' : '#334155',
                border: isSold ? '1px solid #fca5a5' : '1px solid #e2e8f0',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}>
                {etatDisplay}
              </span>
            </div>

            {/* Petite icône WhatsApp juste en face de l'état sur la même ligne */}
            {!isSold ? (
              <button
                type="button"
                onClick={handleWhatsAppClick}
                disabled={!hasValidPhone}
                style={{
                  background: hasValidPhone ? 'linear-gradient(135deg, #25D366 0%, #128C7E 100%)' : '#e2e8f0',
                  color: hasValidPhone ? '#ffffff' : '#94a3b8',
                  border: 'none',
                  borderRadius: '50%',
                  width: '26px',
                  height: '26px',
                  minWidth: '26px',
                  minHeight: '26px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: hasValidPhone ? 'pointer' : 'not-allowed',
                  boxShadow: hasValidPhone ? '0 2px 6px rgba(37, 211, 102, 0.35)' : 'none',
                  transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                  padding: 0,
                  flexShrink: 0
                }}
                onMouseEnter={e => {
                  if (hasValidPhone) e.currentTarget.style.transform = 'scale(1.15)';
                }}
                onMouseLeave={e => {
                  if (hasValidPhone) e.currentTarget.style.transform = 'scale(1)';
                }}
                title={hasValidPhone ? (lang === 'ar' ? "تواصل مع البائع عبر واتساب" : "Contacter le vendeur sur WhatsApp") : (lang === 'ar' ? "رقم غير متوفر" : "Numéro indisponible")}
                aria-label="WhatsApp"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" style={{ display: 'block' }}>
                  <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91C2.13 13.66 2.59 15.36 3.45 16.86L2.05 22L7.3 20.62C8.75 21.41 10.38 21.83 12.04 21.83C17.5 21.83 21.95 17.38 21.95 11.92C21.95 9.27 20.92 6.78 19.05 4.91C17.18 3.03 14.69 2 12.04 2ZM12.04 20.15C10.56 20.15 9.11 19.76 7.85 19L7.55 18.83L4.43 19.65L5.26 16.61L5.07 16.3C4.24 14.98 3.81 13.47 3.81 11.91C3.81 7.37 7.5 3.68 12.04 3.68C14.25 3.68 16.31 4.54 17.87 6.1C19.42 7.66 20.28 9.72 20.28 11.92C20.28 16.46 16.58 20.15 12.04 20.15ZM16.55 14.39C16.3 14.27 15.08 13.67 14.86 13.59C14.63 13.5 14.47 13.46 14.3 13.71C14.14 13.96 13.67 14.51 13.53 14.67C13.38 14.84 13.24 14.86 12.99 14.73C12.74 14.61 11.94 14.35 11 13.51C10.26 12.85 9.77 12.04 9.63 11.79C9.48 11.54 9.61 11.41 9.74 11.28C9.85 11.17 9.99 11 10.11 10.86C10.24 10.72 10.28 10.61 10.36 10.45C10.45 10.28 10.4 10.14 10.34 10.02C10.28 9.9 9.81 8.74 9.61 8.27C9.42 7.81 9.22 7.87 9.08 7.86C8.94 7.86 8.78 7.85 8.61 7.85C8.45 7.85 8.18 7.91 7.96 8.16C7.73 8.4 7.1 8.99 7.1 10.19C7.1 11.39 7.98 12.55 8.1 12.71C8.22 12.87 9.82 15.35 12.28 16.41C12.86 16.66 13.32 16.82 13.67 16.93C14.26 17.12 14.79 17.09 15.22 17.03C15.7 16.96 16.69 16.43 16.9 15.85C17.1 15.27 17.1 14.77 17.04 14.67C16.98 14.56 16.81 14.51 16.55 14.39Z" />
                </svg>
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
