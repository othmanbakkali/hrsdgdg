import React, { useState } from 'react';
import { useLanguage, translateCityToArabic } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../config/api';

export default function ProductDetailModal({ 
  product, 
  isOpen, 
  onClose, 
  allProducts = [], 
  onSelectProduct,
  onAddToCompare,
  isCompared,
  onDirectBuy,
  onOpenChatWithSeller
}) {
  const isModalOpen = isOpen !== undefined ? isOpen : Boolean(product);
  const { t, isRtl, lang } = useLanguage();
  const { user, toggleFavorite } = useAuth();

  const displayTitle = (lang === 'ar' && product?.titre_ar) 
    ? product.titre_ar 
    : (product?.titre_fr || product?.titre || '');

  const displayDesc = (lang === 'ar' && product?.description_ar) 
    ? product.description_ar 
    : (product?.description_fr || product?.description || '');

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

  const sellerPhone = product?.vendeur_phone || product?.telephone || product?.phone || '';
  const sellerCleanPhone = formatWhatsAppPhone(sellerPhone);
  const hasValidSellerPhone = Boolean(sellerCleanPhone && sellerCleanPhone.length >= 11);

  const realGramme = product?.gramme !== undefined && product?.gramme !== null && product?.gramme !== '' 
    ? product.gramme 
    : (product?.poids !== undefined && product?.poids !== null && product?.poids !== '' ? product.poids : null);
  const grammageDisplay = realGramme ? `${realGramme} ${lang === 'ar' ? 'غ' : 'g'}` : (lang === 'ar' ? 'غير محدد' : 'Non renseigné');
  const cityDisplay = lang === 'ar' ? translateCityToArabic(product?.city) : (product?.city || 'Casablanca');

  const productUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}/?product=${product?.id}` 
    : `https://hrsdgdg.ma/?product=${product?.id}`;

  const sellerWhatsAppMsg = lang === 'ar'
    ? `السلام عليكم، أرغب في الحصول على معلومات حول هذه القطعة.

القطعة : ${displayTitle}
المرجع : ${product?.id}
السعر : ${product?.prix ? product.prix.toLocaleString() : 'غير محدد'} د.م
الوزن : ${grammageDisplay}
المدينة : ${cityDisplay}
رابط القطعة : ${productUrl}

هل هذه القطعة لا تزال متوفرة ؟

شكراً.`
    : `Bonjour, je souhaite avoir des informations sur cet article.

Article : ${displayTitle}
Référence : ${product?.id}
Prix : ${product?.prix ? product.prix.toLocaleString() : 'N/A'} MAD
Grammage : ${grammageDisplay}
Ville : ${cityDisplay}
Lien du produit : ${productUrl}

Cet article est-il toujours disponible ?

Merci.`;

  const whatsappUrl = hasValidSellerPhone 
    ? `https://wa.me/${sellerCleanPhone}?text=${encodeURIComponent(sellerWhatsAppMsg)}`
    : '#';

  const isSold = product?.etat === 'Vendu' || product?.disponibilite === 'vendu' || product?.disponibilite === 'archive_vendu';

  // Real photo sharing handler (Req 10)
  const handleShareProductPhoto = async () => {
    const mainPhotoUrl = galleryImages[activeImageIndex] || galleryImages[0];
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        let sharedWithFile = false;
        try {
          const response = await fetch(mainPhotoUrl, { mode: 'cors' });
          if (response.ok) {
            const blob = await response.blob();
            const file = new File([blob], `bijou_${product?.id || 'photo'}.jpg`, { type: blob.type || 'image/jpeg' });
            if (navigator.canShare && navigator.canShare({ files: [file] })) {
              await navigator.share({
                title: displayTitle,
                text: sellerWhatsAppMsg,
                url: productUrl,
                files: [file]
              });
              sharedWithFile = true;
            }
          }
        } catch {
          sharedWithFile = false;
        }

        if (!sharedWithFile) {
          await navigator.share({
            title: displayTitle,
            text: `${sellerWhatsAppMsg}\n\nPhoto du bijou : ${mainPhotoUrl}`,
            url: productUrl
          });
        }
        return;
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.warn('Native share error, fallback to wa.me:', err.message);
        } else {
          return;
        }
      }
    }

    const photoShareMsg = `${sellerWhatsAppMsg}\n\nPhoto haute définition : ${mainPhotoUrl}`;
    const fallbackUrl = hasValidSellerPhone 
      ? `https://wa.me/${sellerCleanPhone}?text=${encodeURIComponent(photoShareMsg)}`
      : `https://wa.me/?text=${encodeURIComponent(photoShareMsg)}`;
    window.open(fallbackUrl, '_blank', 'noopener,noreferrer');
  };

  const formatMaterial = (mat, purity) => {
    if (lang === 'ar') {
      let m = mat || '';
      const mLower = m.toLowerCase();
      if (mLower.includes('or jaune')) m = 'ذهب أصفر';
      else if (mLower.includes('or blanc')) m = 'ذهب أبيض';
      else if (mLower.includes('or rose')) m = 'ذهب وردي';
      else if (mLower.includes('or')) m = 'ذهب';
      else if (mLower.includes('argent')) m = 'فضة';
      else if (mLower.includes('platine')) m = 'بلاتين';
      else if (mLower.includes('diamant')) m = 'ألماس';
      const pure = purity || '18K';
      const pureAr = pure.toLowerCase().includes('18') ? '18 قيراط' : pure.toLowerCase().includes('24') ? '24 قيراط' : pure.toLowerCase().includes('22') ? '22 قيراط' : pure;
      return `${m} ${pureAr}`;
    }
    return `${mat || 'Or'} ${purity || '18K'}`;
  };

  const formatStone = (stone) => {
    if (!stone || stone.toLowerCase() === 'aucune' || stone.toLowerCase() === 'none') {
      return lang === 'ar' ? 'بدون' : 'Aucune';
    }
    if (lang === 'ar') {
      const s = stone.toLowerCase();
      if (s.includes('diamant')) return 'ألماس';
      if (s.includes('émeraude') || s.includes('emeraude')) return 'زمرد';
      if (s.includes('saphir')) return 'ياقوت أزرق';
      if (s.includes('rubis')) return 'ياقوت أحمر';
      if (s.includes('perle')) return 'لؤلؤ';
      if (s.includes('zircon')) return 'زركون';
      if (s.includes('précieuse') || s.includes('precieuse') || s.includes('pierre')) return 'أحجار كريمة';
    }
    return stone;
  };

  const formatSize = (taille) => {
    if (!taille) return lang === 'ar' ? 'قياسي' : 'Standard';
    if (lang === 'ar') {
      const t = taille.toLowerCase();
      if (t.includes('mesure') || t.includes('sur mesure')) return 'حسب المقاس';
      if (t.includes('standard') || t.includes('unique')) return 'قياسي';
    }
    return taille;
  };

  const formatYear = (annee) => {
    if (!annee || annee.toString().toLowerCase() === 'vintage') {
      return lang === 'ar' ? 'كلاسيكي / قديم' : 'Vintage';
    }
    return annee;
  };

  const formatCondition = (etat) => {
    if (!etat) return '';
    const e = etat.toLowerCase();
    if (lang === 'ar') {
      if (e.includes('art') || e.includes('حرف') || e.includes('تقليد')) return '🏺 قطعة تقليدية / حرفية';
      if (e.includes('comme neuf')) return t('condLikeNew') || 'كالجديد تماماً';
      if (e.includes('neuf')) return t('condNew') || 'جديد';
      if (e.includes('occasion')) return 'مستعمل بحالة ممتازة';
      if (e.includes('excellent')) return t('condExcellent') || 'حالة ممتازة';
      if (e.includes('très bon') || e.includes('tres bon')) return t('condVeryGood') || 'حالة جيدة جداً';
      if (e.includes('bon')) return t('condGood') || 'حالة جيدة';
      if (e.includes('restaur')) return t('condRestore') || 'يحتاج صيانة';
    } else {
      if (e.includes('art')) return '🏺 Pièce artisanale';
      if (e.includes('occasion')) return 'Occasion (Très bon état)';
    }
    return etat;
  };

  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [activeTab, setActiveTab] = useState('details'); // 'details', 'reviews', 'look'
  const [newRating, setNewRating] = useState(5);
  const [newComment, setNewComment] = useState('');
  const [reviewsList, setReviewsList] = useState(product?.customer_reviews || []);
  const [reviewSubmitted, setReviewSubmitted] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [zoomPos, setZoomPos] = useState({ x: 50, y: 50 });
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  // Auction State
  const isAuction = product?.disponibilite === 'enchere' || product?.type_vente === 'AUCTION';
  const [auctionInfo, setAuctionInfo] = useState(null);
  const [bidAmount, setBidAmount] = useState('');
  const [isBidding, setIsBidding] = useState(false);
  const [bidFeedback, setBidFeedback] = useState(null);
  const [timeLeftText, setTimeLeftText] = useState('');

  // Fetch auction details
  const fetchAuctionDetails = async () => {
    if (!product || !isAuction) return;
    try {
      const res = await fetch(`${API_URL}/encheres`);
      if (res.ok) {
        const allAuctions = await res.json();
        const found = allAuctions.find(a => a.bijou_id === product.id);
        if (found) {
          setAuctionInfo(found);
          const currentMax = found.highestBid || found.prix_depart;
          const minNext = currentMax + (found.increment_min || 50);
          setBidAmount(minNext.toString());
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  React.useEffect(() => {
    if (isModalOpen && isAuction) {
      fetchAuctionDetails();
      const interval = setInterval(fetchAuctionDetails, 4000);
      return () => clearInterval(interval);
    }
  }, [isModalOpen, product, isAuction]);

  // Countdown timer
  React.useEffect(() => {
    if (!auctionInfo?.date_fin) return;
    const updateCountdown = () => {
      const diff = new Date(auctionInfo.date_fin) - new Date();
      if (diff <= 0) {
        setTimeLeftText('Enchère terminée');
        return;
      }
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((diff / 1000 / 60) % 60);
      const seconds = Math.floor((diff / 1000) % 60);
      setTimeLeftText(`${days > 0 ? `${days}j ` : ''}${hours}h ${minutes}m ${seconds}s`);
    };
    updateCountdown();
    const tInterval = setInterval(updateCountdown, 1000);
    return () => clearInterval(tInterval);
  }, [auctionInfo]);

  const handlePlaceBid = async (e) => {
    e.preventDefault();
    if (!auctionInfo) return;
    const numericBid = parseFloat(bidAmount);
    const currentHighest = auctionInfo.highestBid || auctionInfo.prix_depart;
    const minRequired = (auctionInfo.bidsCount > 0) ? (currentHighest + (auctionInfo.increment_min || 50)) : auctionInfo.prix_depart;

    if (numericBid < minRequired) {
      setBidFeedback({ 
        type: 'error', 
        message: lang === 'ar' 
          ? `الحد الأدنى المطلوب للمزايدة هو ${minRequired.toLocaleString()} د.م` 
          : `Le montant minimal requis est de ${minRequired.toLocaleString()} DH` 
      });
      return;
    }

    setIsBidding(true);
    try {
      const res = await fetch(`${API_URL}/encheres/${auctionInfo.id}/bid`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: user?.id || 'u_guest',
          montant: numericBid
        })
      });

      if (res.ok) {
        setBidFeedback({ 
          type: 'success', 
          message: lang === 'ar' 
            ? `🎉 تم تسجيل مزايدتكم بمبلغ ${numericBid.toLocaleString()} د.م بنجاح! أنتم تتصدرون المزاد حالياً.` 
            : `🎉 Enchère de ${numericBid.toLocaleString()} DH déposée avec succès ! Vous menez actuellement la vente.` 
        });
        fetchAuctionDetails();
        setTimeout(() => setBidFeedback(null), 5000);
      } else {
        const err = await res.json();
        setBidFeedback({ 
          type: 'error', 
          message: err.message || (lang === 'ar' ? 'حدث خطأ أثناء تسجيل المزايدة.' : 'Erreur lors du dépôt de l\'offre.') 
        });
      }
    } catch (err) {
      console.error(err);
      setBidFeedback({ type: 'error', message: 'Erreur réseau lors de la transmission de l\'offre.' });
    } finally {
      setIsBidding(false);
    }
  };

  // Build luxury multi-angle gallery
  const rawImages = (product?.images && product.images.length > 0) 
    ? product.images 
    : ['https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=800&auto=format&fit=crop&q=80'];
  const images = rawImages;

  const galleryImages = rawImages.length > 1
    ? rawImages.map((url, i) => ({
        url,
        label: i === 0 ? 'Vue principale' : i === 1 ? 'Angle de profil' : i === 2 ? 'Macro sertissage' : `Vue ${i + 1}`
      }))
    : [
        { url: rawImages[0], label: 'Vue principale' },
        { url: `${rawImages[0]}${rawImages[0].includes('?') ? '&' : '?'}auto=format&fit=crop&w=1200&q=95`, label: 'Zoom 4K Macro' },
        { url: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=800&auto=format&fit=crop&q=80', label: 'Écrin & Certificat' }
      ];

  const currentImgUrl = galleryImages[activeImageIndex]?.url || galleryImages[0]?.url;

  // Inverted arrows for natural image progression
  const handlePrevImage = () => {
    setActiveImageIndex(prev => (prev === galleryImages.length - 1 ? 0 : prev + 1));
  };

  const handleNextImage = () => {
    setActiveImageIndex(prev => (prev === 0 ? galleryImages.length - 1 : prev - 1));
  };

  // Keyboard navigation (Hook called unconditionally before any early return)
  React.useEffect(() => {
    if (!isModalOpen || !product) return;
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowLeft') handlePrevImage();
      if (e.key === 'ArrowRight') handleNextImage();
      if (e.key === 'Escape') {
        if (isLightboxOpen) {
          setIsLightboxOpen(false);
        } else {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isModalOpen, isLightboxOpen, product, galleryImages.length]);

  if (!isModalOpen || !product) return null;

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
    const y = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));
    setZoomPos({ x, y });
  };

  const isSecondHand = product.type_vente === 'SECOND_HAND';
  const isFavorited = user?.favoris?.includes(product.id);

  // Complementary look items
  const complementaryItems = allProducts
    .filter(p => p.id !== product.id && (product.look_complementary_ids?.includes(p.id) || p.category_id !== product.category_id))
    .slice(0, 2);

  const handleAddReview = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      const res = await fetch(`${API_URL}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bijou_id: product.id,
          client_id: user?.id || 'u_guest',
          client_nom: user?.nom || 'Client JEWELIA',
          note: newRating,
          commentaire: newComment
        })
      });

      if (res.ok) {
        const added = await res.json();
        setReviewsList(prev => [added, ...prev]);
        setNewComment('');
        setReviewSubmitted(true);
        setTimeout(() => setReviewSubmitted(false), 3000);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleInquireFullLook = () => {
    const titles = [displayTitle, ...complementaryItems.map(c => (lang === 'ar' && c.titre_ar) ? c.titre_ar : (c.titre_fr || c.titre))].join(' + ');
    const msg = encodeURIComponent(
      lang === 'ar'
        ? `السلام عليكم، أنا مهتم بالحصول على هذا الطقم المتناسق: ${titles}. هل هو متوفر وما هو السعر الإجمالي؟`
        : `Bonjour, je suis intéressé(e) par cet ensemble assorti : ${titles}. Est-il disponible et quel est le prix total ?`
    );
    const phone = product?.vendeur_telephone ? product.vendeur_telephone.replace(/\s+/g, '').replace('+', '') : '212600000000';
    window.open(`https://wa.me/${phone}?text=${msg}`, '_blank');
  };

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 1000, padding: '16px' }}>
      <div 
        className="modal-content" 
        style={{ maxWidth: '980px', padding: '28px 34px 28px 28px', maxHeight: '90vh', overflowY: 'auto', margin: 'auto' }}
        onClick={e => e.stopPropagation()}
      >
        <button className="modal-close-btn" onClick={onClose} title="Fermer">✕</button>

        <div className="product-detail-grid">
          {/* Left Column: Luxury Showcase Gallery */}
          <div className="detail-gallery">
            <div 
              className="detail-main-img-wrap"
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => { setIsHovered(false); setZoomPos({ x: 50, y: 50 }); }}
              onMouseMove={handleMouseMove}
              onClick={() => setIsLightboxOpen(true)}
              title="Cliquer pour afficher en plein écran haute résolution"
            >
              {/* Photo Counter Pill */}
              <div className="gallery-counter-badge">
                📷 {activeImageIndex + 1} / {galleryImages.length}
              </div>

              {/* 4K Certification Badge */}
              <div className="gallery-badge-hd">
                ✨ 4K HAUTE DÉFINITION
              </div>

              {/* Navigation Arrows */}
              {galleryImages.length > 1 && (
                <>
                  <button 
                    type="button"
                    className="gallery-nav-arrow gallery-prev-btn"
                    onClick={(e) => { e.stopPropagation(); handlePrevImage(); }}
                    aria-label={lang === 'ar' ? 'الصورة التالية' : 'Image suivante'}
                    title={lang === 'ar' ? 'الصورة التالية' : 'Image suivante'}
                  >
                    ‹
                  </button>
                  <button 
                    type="button"
                    className="gallery-nav-arrow gallery-next-btn"
                    onClick={(e) => { e.stopPropagation(); handleNextImage(); }}
                    aria-label={lang === 'ar' ? 'الصورة السابقة' : 'Image précédente'}
                    title={lang === 'ar' ? 'الصورة السابقة' : 'Image précédente'}
                  >
                    ›
                  </button>
                </>
              )}

              {/* Showcase Image with interactive lens zoom */}
              <img 
                src={currentImgUrl} 
                alt={displayTitle} 
                className="detail-main-img"
                style={{
                  transformOrigin: `${zoomPos.x}% ${zoomPos.y}%`,
                  transform: isHovered ? 'scale(1.8)' : 'scale(1)'
                }}
              />

              {/* Fullscreen Expand CTA */}
              <button 
                type="button"
                className="gallery-expand-btn"
                onClick={(e) => { e.stopPropagation(); setIsLightboxOpen(true); }}
              >
                ⛶ Agrandir
              </button>
            </div>

            {/* Thumbnail Carousel Strip */}
            <div className="detail-thumbs-row">
              {galleryImages.map((item, idx) => (
                <button 
                  key={idx}
                  type="button"
                  className={`detail-thumb-btn ${activeImageIndex === idx ? 'active' : ''}`}
                  onClick={() => setActiveImageIndex(idx)}
                  title={item.label}
                >
                  <img 
                    src={item.url} 
                    alt={item.label} 
                    className="detail-thumb-img"
                  />
                  <span className="detail-thumb-label">{item.label}</span>
                </button>
              ))}
            </div>

            {/* Product 10s Video Showcase if available */}
            {product?.video && (
              <div className="product-video-showcase-box" style={{ marginTop: '14px' }}>
                <div style={{ fontSize: '0.82rem', fontWeight: '700', color: '#2563eb', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>🎥</span>
                  <span>{lang === 'ar' ? 'فيديو حقيقي للقطعة (10 ثوانٍ كحد أقصى) :' : 'Vidéo authentique de la pièce (10s max) :'}</span>
                </div>
                <div style={{ borderRadius: '14px', overflow: 'hidden', border: '1.5px solid #3b82f6', background: '#0b0f19', boxShadow: '0 4px 16px rgba(59, 130, 246, 0.2)' }}>
                  <video 
                    src={product.video} 
                    controls 
                    playsInline 
                    loop 
                    muted 
                    style={{ width: '100%', maxHeight: '220px', objectFit: 'contain', display: 'block' }} 
                  />
                </div>
              </div>
            )}

            {/* Lightbox Modal */}
            {isLightboxOpen && (
              <div className="gallery-lightbox-overlay" onClick={() => setIsLightboxOpen(false)}>
                <div className="gallery-lightbox-content" onClick={e => e.stopPropagation()}>
                  <button className="gallery-lightbox-close" onClick={() => setIsLightboxOpen(false)}>✕</button>
                  <div className="gallery-lightbox-img-wrap">
                    <img 
                      src={currentImgUrl} 
                      alt={displayTitle} 
                      className="gallery-lightbox-img" 
                    />
                  </div>
                  {galleryImages.length > 1 && (
                    <>
                      <button className="lightbox-nav-btn prev" onClick={handlePrevImage} title={lang === 'ar' ? 'الصورة التالية' : 'Image suivante'}>‹</button>
                      <button className="lightbox-nav-btn next" onClick={handleNextImage} title={lang === 'ar' ? 'الصورة السابقة' : 'Image précédente'}>›</button>
                      <div className="gallery-lightbox-thumbs">
                        {galleryImages.map((item, idx) => (
                          <button 
                            key={idx} 
                            className={`lightbox-thumb ${activeImageIndex === idx ? 'active' : ''}`}
                            onClick={() => setActiveImageIndex(idx)}
                          >
                            <img src={item.url} alt="" />
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}


          </div>

          {/* Right Column: Information & Actions */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {/* Universe Badge */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
              {isAuction ? (
                <span 
                  className="universe-badge"
                  style={{ position: 'static', padding: '6px 14px', fontSize: '0.82rem', background: '#ef4444', color: '#fff', fontWeight: 800 }}
                >
                  {lang === 'ar' ? '🔨 مزاد علني مباشر' : '🔨 ENCHÈRE EN DIRECT'}
                </span>
              ) : (
                <span 
                  className={`universe-badge ${isSecondHand ? 'second-hand' : 'first-hand'}`}
                  style={{ position: 'static', padding: '6px 14px', fontSize: '0.78rem' }}
                >
                  {isSecondHand 
                    ? (lang === 'ar' ? '♻️ مجوهرات مستعملة (فرصة)' : '♻️ SECONDE MAIN') 
                    : (lang === 'ar' ? '✨ مجوهرات جديدة' : '✨ PREMIÈRE MAIN')}
                </span>
              )}

              {isAuction && timeLeftText && (
                <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#dc2626', background: 'rgba(239, 68, 68, 0.1)', padding: '4px 10px', borderRadius: '12px', border: '1px solid rgba(239, 68, 68, 0.25)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span className="gold-pulse-indicator" style={{ background: '#ef4444' }} />
                  {lang === 'ar' ? `⏱️ ينتهي بعد : ${timeLeftText}` : `⏱️ Fin dans : ${timeLeftText}`}
                </span>
              )}

              {isSecondHand && !isAuction && (
                <span className="chip-tag condition-badge">
                  ♻️ {formatCondition(product.etat) || (lang === 'ar' ? 'حالة ممتازة' : 'Excellent état')}
                </span>
              )}

              {product.authentifie === 'Vérifié' && (
                <span className="chip-tag verified-badge">
                  {lang === 'ar' ? '✓ مجوهرات موثقة ومفحوصة' : '✓ Bijou vérifié'}
                </span>
              )}
            </div>

            {/* Title */}
            <h1 style={{ fontSize: '1.6rem', lineHeight: 1.25, color: 'var(--text-dark)', margin: '4px 0', fontFamily: 'var(--font-serif)', wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
              {displayTitle}
            </h1>

            {/* Rating & Seller */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.86rem', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span className="star-icon">⭐</span>
                <strong>{product.note || 4.9}</strong>
                <span style={{ color: 'var(--text-gray)' }}>
                  {lang === 'ar' ? `(${product.nombre_avis || reviewsList.length} تقييم)` : `(${product.nombre_avis || reviewsList.length} avis)`}
                </span>
              </div>
              <span style={{ color: 'var(--text-gray)' }}>•</span>
              <div style={{ color: 'var(--text-gray)' }}>
                {lang === 'ar' ? 'البائع والمصدر :' : 'Vendu par :'} <strong style={{ color: 'var(--primary-gold)' }}>{product.vendeur_nom || (lang === 'ar' ? 'دار المجوهرات' : 'Maison Joaillerie')}</strong>
              </div>
            </div>

            {/* LIVE AUCTION BIDDING CARD */}
            {isAuction ? (
              <div style={{ 
                padding: '20px', 
                background: 'linear-gradient(135deg, rgba(179, 135, 40, 0.08) 0%, rgba(255, 255, 255, 0.95) 100%)', 
                border: '1.5px solid var(--primary-gold)', 
                borderRadius: 'var(--radius-md)', 
                boxShadow: '0 8px 24px rgba(179, 135, 40, 0.12)' 
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
                  <div>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-gray)', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block' }}>
                      {lang === 'ar' ? 'أعلى عرض حالي' : 'Offre Actuelle la plus Haute'}
                    </span>
                    <span style={{ fontSize: '2.2rem', fontWeight: 900, color: 'var(--primary-gold)', fontFamily: 'var(--font-serif)' }}>
                      {(auctionInfo?.highestBid || product.prix).toLocaleString()} <small style={{ fontSize: '1rem' }}>{lang === 'ar' ? 'د.م' : 'DH'}</small>
                    </span>
                  </div>

                  <div style={{ textAlign: isRtl ? 'left' : 'right' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-gray)', display: 'block' }}>
                      {lang === 'ar' ? 'سعر الافتتاح :' : 'Prix de départ :'} <strong>{(auctionInfo?.prix_depart || product.prix).toLocaleString()} {lang === 'ar' ? 'د.م' : 'DH'}</strong>
                    </span>
                    <span style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 700 }}>
                      🔥 {lang === 'ar' ? `${auctionInfo?.bidsCount || 0} مزايدة مسجلة` : `${auctionInfo?.bidsCount || 0} enchère${(auctionInfo?.bidsCount || 0) > 1 ? 's' : ''} déposée${(auctionInfo?.bidsCount || 0) > 1 ? 's' : ''}`}
                    </span>
                  </div>
                </div>

                {/* Interactive Bidding Form */}
                <form onSubmit={handlePlaceBid} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <label style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-dark)' }}>
                    {lang === 'ar' ? `مزايدتكم (الحد الأدنى للزيادة +${auctionInfo?.increment_min || 50} د.م) :` : `Votre Enchère (Palier minimal +${auctionInfo?.increment_min || 50} DH) :`}
                  </label>

                  {/* Quick increment pills */}
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {[50, 100, 250, 500].map(inc => {
                      const currentMax = auctionInfo?.highestBid || auctionInfo?.prix_depart || product.prix;
                      const target = currentMax + inc;
                      return (
                        <button
                          key={inc}
                          type="button"
                          onClick={() => setBidAmount(target.toString())}
                          style={{
                            padding: '4px 10px',
                            background: bidAmount === target.toString() ? 'var(--primary-gold)' : 'rgba(179, 135, 40, 0.1)',
                            color: bidAmount === target.toString() ? '#ffffff' : 'var(--primary-gold)',
                            border: '1px solid var(--border-gold)',
                            borderRadius: '16px',
                            fontSize: '0.76rem',
                            fontWeight: 700,
                            cursor: 'pointer'
                          }}
                        >
                          +{inc} {lang === 'ar' ? 'د.م' : 'DH'} ({target.toLocaleString()} {lang === 'ar' ? 'د.م' : 'DH'})
                        </button>
                      );
                    })}
                  </div>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input 
                      type="number" 
                      value={bidAmount}
                      onChange={e => setBidAmount(e.target.value)}
                      required
                      placeholder={lang === 'ar' ? "مثال: 7500" : "Ex: 7500"}
                      className="filter-select-control"
                      style={{ fontSize: '1.05rem', fontWeight: 700, borderColor: 'var(--primary-gold)' }}
                    />
                    <button 
                      type="submit" 
                      disabled={isBidding}
                      className="btn-jewelia-primary"
                      style={{ padding: '10px 22px', whiteSpace: 'nowrap', fontWeight: 800 }}
                    >
                      {isBidding ? (lang === 'ar' ? 'جاري الإرسال...' : 'Envoi...') : (lang === 'ar' ? '🔨 تقديم المزايدة' : '🔨 Enchérir')}
                    </button>
                  </div>

                  {bidFeedback && (
                    <div style={{
                      padding: '10px',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '0.82rem',
                      fontWeight: 600,
                      background: bidFeedback.type === 'success' ? '#ecfdf5' : '#fef2f2',
                      color: bidFeedback.type === 'success' ? '#065f46' : '#991b1b',
                      border: `1px solid ${bidFeedback.type === 'success' ? '#a7f3d0' : '#fecaca'}`
                    }}>
                      {bidFeedback.message}
                    </div>
                  )}
                </form>
              </div>
            ) : (
              /* Normal Price Row with Grammage on the same line */
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', padding: '12px 0', borderBottom: '1px solid rgba(0, 0, 0, 0.08)', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px' }}>
                  <span style={{ fontSize: '2rem', fontWeight: 800, fontFamily: 'var(--font-serif)', color: 'var(--primary-gold)' }}>
                    {product.prix.toLocaleString()} {lang === 'ar' ? 'د.م' : 'DH'}
                  </span>
                  {product.ancien_prix && product.ancien_prix > product.prix && (
                    <>
                      <span style={{ fontSize: '1.1rem', color: 'var(--text-gray)', textDecoration: 'line-through' }}>
                        {product.ancien_prix.toLocaleString()} {lang === 'ar' ? 'د.م' : 'DH'}
                      </span>
                      <span className="card-discount-badge">
                        -{Math.round(((product.ancien_prix - product.prix) / product.ancien_prix) * 100)}%
                      </span>
                    </>
                  )}
                </div>

                {realGramme && (
                  <div style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 14px',
                    background: 'rgba(212, 175, 55, 0.08)',
                    border: '1.5px solid var(--border-gold)',
                    borderRadius: '20px',
                    fontSize: '0.95rem',
                    fontWeight: 800,
                    color: 'var(--primary-gold)'
                  }}>
                    <span>⚖️</span>
                    <span>{realGramme} {lang === 'ar' ? 'غ' : 'g'}</span>
                  </div>
                )}
              </div>
            )}

            {/* Sold Banner if already sold */}
            {isSold && (
              <div style={{ padding: '10px 14px', background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: '10px', color: '#dc2626', fontWeight: 700, fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <span>🏷️</span>
                <span>{lang === 'ar' ? 'هذه القطعة تم بيعها. تم تغيير حالتها إلى "مباع" وتظل مرئية لمدة 12 ساعة في الكتالوج.' : 'Cet article a été vendu. Il est marqué "Vendu" et restera consultable 12h avant masquage automatique.'}</span>
              </div>
            )}

            {/* Description */}
            <p style={{ color: 'var(--text-gray)', fontSize: '0.9rem', lineHeight: 1.5 }}>
              {displayDesc}
            </p>

            {/* Specs Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 16px', padding: '12px', background: 'var(--bg-surface-elevated)', borderRadius: 'var(--radius-sm)', fontSize: '0.84rem', border: '1px solid var(--border-subtle)' }}>
              <div><span style={{ color: 'var(--text-gray)' }}>{t('material')} :</span> <strong>{formatMaterial(product.matiere, product.purete)}</strong></div>
              <div>
                <span style={{ color: 'var(--text-gray)' }}>{lang === 'ar' ? 'الوزن (غرام)' : 'Grammage'} :</span>{' '}
                <strong style={{ color: 'var(--primary-gold)' }}>
                  {product.gramme || product.poids ? `${product.gramme || product.poids} ${lang === 'ar' ? 'غ' : 'g'}` : (lang === 'ar' ? 'غير محدد' : 'Non renseigné')}
                </strong>
              </div>
              <div><span style={{ color: 'var(--text-gray)' }}>{t('stone')} :</span> <strong>{formatStone(product.pierre)}</strong></div>
              <div><span style={{ color: 'var(--text-gray)' }}>{t('size')} :</span> <strong>{formatSize(product.taille)}</strong></div>
              <div><span style={{ color: 'var(--text-gray)' }}>{lang === 'ar' ? 'المدينة' : 'Ville'} :</span> <strong>{cityDisplay}</strong></div>
              <div>
                <span style={{ color: 'var(--text-gray)' }}>{lang === 'ar' ? 'الحالة' : 'État'} :</span>{' '}
                <strong style={{ color: isSold ? '#dc2626' : '#059669' }}>
                  {isSold ? (lang === 'ar' ? 'تم البيع' : 'Vendu') : formatCondition(product.etat)}
                </strong>
              </div>
            </div>

            {/* Parure Component Weights breakdown if available */}
            {product.composants_poids && typeof product.composants_poids === 'object' && Object.keys(product.composants_poids).length > 0 && (
              <div style={{ marginTop: '8px', padding: '10px 14px', background: 'rgba(212, 175, 55, 0.06)', border: '1px solid var(--border-gold)', borderRadius: 'var(--radius-sm)', fontSize: '0.82rem' }}>
                <span style={{ fontWeight: 700, color: 'var(--primary-gold)', display: 'block', marginBottom: '4px' }}>
                  💎 {lang === 'ar' ? 'تفصيل أوزان عناصر الطقم / البارور :' : 'Détail du grammage par élément de la parure :'}
                </span>
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                  {Object.entries(product.composants_poids).map(([comp, weight]) => (
                    <span key={comp} style={{ color: 'var(--text-dark)' }}>
                      • <strong>{comp} :</strong> {weight} {lang === 'ar' ? 'غ' : 'g'}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '14px' }}>
              {/* If Sold, show clear non-clickable notification */}
              {isSold ? (
                <div style={{ padding: '12px', textAlign: 'center', background: '#f8fafc', border: '1.5px solid #cbd5e1', borderRadius: '12px', color: '#64748b', fontWeight: 700, fontSize: '0.92rem' }}>
                  🔒 {lang === 'ar' ? 'هذه القطعة مباعة وغير قابلة لإعادة البيع' : 'Cet article est vendu et n\'est plus disponible à l\'achat'}
                </div>
              ) : (
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                  {/* WhatsApp Contact & Reserve Button */}
                  <a 
                    href={whatsappUrl}
                    target="_blank"
                    rel="noreferrer"
                    onClick={e => {
                      if (!hasValidSellerPhone) {
                        e.preventDefault();
                        alert(lang === 'ar' ? 'رقم هاتف البائع غير متوفر حالياً.' : 'Le numéro WhatsApp de ce vendeur n\'est pas encore renseigné.');
                      }
                    }}
                    style={{
                      flex: 2,
                      minWidth: '220px',
                      color: '#ffffff',
                      background: hasValidSellerPhone ? 'linear-gradient(135deg, #25D366 0%, #128C7E 100%)' : '#94a3b8',
                      padding: '13px 20px',
                      borderRadius: '12px',
                      fontSize: '0.96rem',
                      fontWeight: 800,
                      textDecoration: 'none',
                      minHeight: '48px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '10px',
                      cursor: hasValidSellerPhone ? 'pointer' : 'not-allowed',
                      boxShadow: hasValidSellerPhone ? '0 4px 16px rgba(37, 211, 102, 0.35)' : 'none',
                      transition: 'transform 0.15s ease, box-shadow 0.15s ease'
                    }}
                    title={hasValidSellerPhone ? (lang === 'ar' ? 'تواصل مع البائع عبر واتساب' : 'Contacter le vendeur sur WhatsApp') : 'Numéro indisponible'}
                  >
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="#ffffff" style={{ flexShrink: 0 }}>
                      <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91C2.13 13.66 2.59 15.36 3.45 16.86L2.05 22L7.3 20.62C8.75 21.41 10.38 21.83 12.04 21.83C17.5 21.83 21.95 17.38 21.95 11.92C21.95 9.27 20.92 6.78 19.05 4.91C17.18 3.03 14.69 2 12.04 2ZM12.04 20.15C10.56 20.15 9.11 19.76 7.85 19L7.55 18.83L4.43 19.65L5.26 16.61L5.07 16.3C4.24 14.98 3.81 13.47 3.81 11.91C3.81 7.37 7.5 3.68 12.04 3.68C14.25 3.68 16.31 4.54 17.87 6.1C19.42 7.66 20.28 9.72 20.28 11.92C20.28 16.46 16.58 20.15 12.04 20.15ZM16.55 14.39C16.3 14.27 15.08 13.67 14.86 13.59C14.63 13.5 14.47 13.46 14.3 13.71C14.14 13.96 13.67 14.51 13.53 14.67C13.38 14.84 13.24 14.86 12.99 14.73C12.74 14.61 11.94 14.35 11 13.51C10.26 12.85 9.77 12.04 9.63 11.79C9.48 11.54 9.61 11.41 9.74 11.28C9.85 11.17 9.99 11 10.11 10.86C10.24 10.72 10.28 10.61 10.36 10.45C10.45 10.28 10.4 10.14 10.34 10.02C10.28 9.9 9.81 8.74 9.61 8.27C9.42 7.81 9.22 7.87 9.08 7.86C8.94 7.86 8.78 7.85 8.61 7.85C8.45 7.85 8.18 7.91 7.96 8.16C7.73 8.4 7.1 8.99 7.1 10.19C7.1 11.39 7.98 12.55 8.1 12.71C8.22 12.87 9.82 15.35 12.28 16.41C12.86 16.66 13.32 16.82 13.67 16.93C14.26 17.12 14.79 17.09 15.22 17.03C15.7 16.96 16.69 16.43 16.9 15.85C17.1 15.27 17.1 14.77 17.04 14.67C16.98 14.56 16.81 14.51 16.55 14.39Z" />
                    </svg>
                    <span>{lang === 'ar' ? 'تواصل واطلب عبر واتساب' : 'Commander via WhatsApp'}</span>
                  </a>

                  {/* Photo Sharing Button */}
                  <button
                    type="button"
                    onClick={handleShareProductPhoto}
                    className="btn-jewelia-secondary"
                    style={{
                      padding: '12px 18px',
                      borderRadius: '12px',
                      fontSize: '0.88rem',
                      fontWeight: '700',
                      borderColor: 'var(--primary-gold)',
                      background: 'rgba(212, 175, 55, 0.08)',
                      color: 'var(--primary-gold)',
                      minHeight: '48px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      cursor: 'pointer'
                    }}
                    title={lang === 'ar' ? 'مشاركة صورة ورابط القطعة' : 'Partager la photo du bijou'}
                  >
                    <span>📸</span>
                    <span>{lang === 'ar' ? 'مشاركة الصورة' : 'Partager la photo'}</span>
                  </button>
                </div>
              )}

                <button 
                  onClick={() => toggleFavorite(product.id)}
                  style={{
                    width: '42px',
                    height: '42px',
                    minWidth: '42px',
                    borderRadius: '10px',
                    border: isFavorited ? '1.5px solid #ef4444' : '1px solid var(--border-gold)',
                    background: isFavorited ? '#fef2f2' : 'var(--bg-surface)',
                    color: isFavorited ? '#ef4444' : 'var(--text-gray)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.04)'
                  }}
                  title={lang === 'ar' ? 'إضافة إلى المفضلة' : 'Favoris'}
                >
                  <svg width="19" height="19" viewBox="0 0 24 24" fill={isFavorited ? "#ef4444" : "none"} stroke={isFavorited ? "#ef4444" : "currentColor"} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                  </svg>
                </button>

                <button 
                  onClick={() => onAddToCompare(product)}
                  style={{
                    width: '42px',
                    height: '42px',
                    minWidth: '42px',
                    borderRadius: '10px',
                    border: isCompared ? '1.5px solid var(--primary-gold)' : '1px solid var(--border-gold)',
                    background: isCompared ? 'rgba(212, 175, 55, 0.12)' : 'var(--bg-surface)',
                    color: isCompared ? 'var(--primary-gold)' : 'var(--text-gray)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.04)'
                  }}
                  title={lang === 'ar' ? 'مقارنة القطعة' : 'Comparer'}
                >
                  <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M16 16l3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1z"></path>
                    <path d="M2 16l3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1z"></path>
                    <path d="M7 21h10"></path>
                    <path d="M12 3v18"></path>
                    <path d="M3 7h18"></path>
                  </svg>
                </button>
              </div>
            </div>
          </div>

        {/* SECTION 20: « COMPLÉTEZ VOTRE LOOK » & REVIEWS TABS */}
        <div style={{ borderTop: '1px solid var(--border-gold)', padding: '24px 32px', background: 'var(--bg-surface-elevated)', borderRadius: '0 0 var(--radius-md) var(--radius-md)' }}>
          <div style={{ display: 'flex', gap: '16px', marginBottom: '20px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '12px' }}>
            <button 
              onClick={() => setActiveTab('details')}
              style={{
                background: 'none',
                border: 'none',
                color: activeTab === 'details' ? 'var(--primary-gold)' : 'var(--text-gray)',
                fontWeight: 700,
                fontSize: '0.95rem',
                cursor: 'pointer',
                borderBottom: activeTab === 'details' ? '2px solid var(--primary-gold)' : 'none',
                paddingBottom: '8px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 3h12l4 6-10 12L2 9z"></path>
                <path d="M11 3L8 9l4 12 4-12-3-6"></path>
                <path d="M2 9h20"></path>
              </svg>
              <span>{t('completeLook')}</span>
            </button>
            <button 
              onClick={() => setActiveTab('reviews')}
              style={{
                background: 'none',
                border: 'none',
                color: activeTab === 'reviews' ? 'var(--primary-gold)' : 'var(--text-gray)',
                fontWeight: 700,
                fontSize: '0.95rem',
                cursor: 'pointer',
                borderBottom: activeTab === 'reviews' ? '2px solid var(--primary-gold)' : 'none',
                paddingBottom: '8px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#eab308' }}>
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
              </svg>
              <span>{t('customerReviews')} ({reviewsList.length})</span>
            </button>
          </div>

          {/* Tab 1: Complétez votre look */}
          {activeTab === 'details' && (
            <div className="complete-look-section" style={{ margin: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div style={{ textAlign: 'center' }}>
                    <img 
                      src={rawImages[0]} 
                      alt="Current" 
                      style={{ width: '70px', height: '70px', borderRadius: '8px', objectFit: 'cover', border: '1px solid var(--primary-gold)' }}
                    />
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-gray)', display: 'block', marginTop: '2px' }}>
                      {lang === 'ar' ? 'قطعتكم' : 'Votre bijou'}
                    </span>
                  </div>

                  {complementaryItems.map((c, i) => (
                    <React.Fragment key={c.id}>
                      <span className="bundle-plus">+</span>
                      <div style={{ textAlign: 'center', cursor: 'pointer' }} onClick={() => onSelectProduct(c)}>
                        <img 
                          src={c.images[0]} 
                          alt={c.titre} 
                          style={{ width: '70px', height: '70px', borderRadius: '8px', objectFit: 'cover', border: '1px solid rgba(255,255,255,0.15)' }}
                        />
                        <span style={{ fontSize: '0.72rem', color: 'var(--light-gold)', display: 'block', marginTop: '2px' }}>{c.prix} {lang === 'ar' ? 'د.م' : 'DH'}</span>
                      </div>
                    </React.Fragment>
                  ))}
                </div>

                <button 
                  onClick={handleInquireFullLook}
                  style={{
                    padding: '10px 18px',
                    fontSize: '0.88rem',
                    fontWeight: 700,
                    borderRadius: '10px',
                    color: '#ffffff',
                    background: '#25D366',
                    border: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    cursor: 'pointer'
                  }}
                  title={lang === 'ar' ? 'طلب الطقم المتناسق عبر واتساب' : 'Commander le look complet via WhatsApp'}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="#ffffff">
                    <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91C2.13 13.66 2.59 15.36 3.45 16.86L2.05 22L7.3 20.62C8.75 21.41 10.38 21.83 12.04 21.83C17.5 21.83 21.95 17.38 21.95 11.92C21.95 9.27 20.92 6.78 19.05 4.91C17.18 3.03 14.69 2 12.04 2Z" />
                  </svg>
                  <span>{lang === 'ar' ? 'طلب الطقم عبر واتساب' : 'Commander le look (WhatsApp)'}</span>
                </button>
              </div>
            </div>
          )}

          {/* Tab 2: Avis Clients */}
          {activeTab === 'reviews' && (
            <div>
              {/* Add review form */}
              <form onSubmit={handleAddReview} style={{ marginBottom: '24px', padding: '16px', background: 'rgba(255, 255, 255, 0.03)', borderRadius: 'var(--radius-md)' }}>
                <h4 style={{ fontSize: '0.95rem', marginBottom: '10px', color: 'var(--light-gold)' }}>
                  {t('leaveReview')}
                </h4>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px' }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-gray)' }}>
                    {lang === 'ar' ? 'تقييمك :' : 'Votre note :'}
                  </span>
                  {[1, 2, 3, 4, 5].map(star => (
                    <span 
                      key={star}
                      onClick={() => setNewRating(star)}
                      style={{ cursor: 'pointer', fontSize: '1.2rem', color: star <= newRating ? '#f59e0b' : '#4b5563' }}
                    >
                      ★
                    </span>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <input 
                    type="text"
                    required
                    placeholder={lang === 'ar' ? "شاركنا رأيك حول اللمعان، الجودة أو سرعة التوصيل..." : "Partagez votre avis sur l'éclat, l'état ou la livraison..."}
                    value={newComment}
                    onChange={e => setNewComment(e.target.value)}
                    className="filter-number-input"
                    style={{ flex: 1, padding: '10px' }}
                  />
                  <button type="submit" className="btn-jewelia-primary" style={{ padding: '10px 18px', fontSize: '0.85rem' }}>
                    {t('submitReview')}
                  </button>
                </div>
                {reviewSubmitted && (
                  <p style={{ color: '#10b981', fontSize: '0.84rem', marginTop: '6px' }}>{t('reviewSuccess')}</p>
                )}
              </form>

              {/* Reviews List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {reviewsList.length === 0 ? (
                  <p style={{ color: 'var(--text-gray)', fontSize: '0.88rem' }}>
                    {lang === 'ar' ? 'كن أول من يقيّم هذه القطعة المميزة.' : 'Soyez le premier à donner votre avis sur ce bijou.'}
                  </p>
                ) : (
                  reviewsList.map((rev, i) => (
                    <div key={i} style={{ padding: '12px', background: 'rgba(255, 255, 255, 0.02)', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <strong style={{ fontSize: '0.88rem', color: 'var(--light-gold)' }}>{rev.client_nom}</strong>
                        <span style={{ color: '#f59e0b', fontSize: '0.85rem' }}>{'★'.repeat(rev.note || 5)}</span>
                      </div>
                      <p style={{ fontSize: '0.84rem', color: 'var(--text-light-gray)' }}>{rev.commentaire}</p>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-gray)', display: 'block', marginTop: '4px' }}>
                        {new Date(rev.date || Date.now()).toLocaleDateString('fr-FR')}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
