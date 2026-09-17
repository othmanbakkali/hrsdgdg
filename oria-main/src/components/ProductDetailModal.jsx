import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
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
  const { addToCart } = useCart();

  const displayTitle = (lang === 'ar' && product?.titre_ar) 
    ? product.titre_ar 
    : ((lang === 'en' && product?.titre_en) ? product.titre_en : (product?.titre_fr || product?.titre || ''));

  const displayDesc = (lang === 'ar' && product?.description_ar) 
    ? product.description_ar 
    : ((lang === 'en' && product?.description_en) ? product.description_en : (product?.description_fr || product?.description || ''));

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
      setBidFeedback({ type: 'error', message: `Le montant minimal requis est de ${minRequired.toLocaleString()} DH` });
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
        setBidFeedback({ type: 'success', message: `🎉 Enchère de ${numericBid.toLocaleString()} DH déposée avec succès ! Vous menez actuellement la vente.` });
        fetchAuctionDetails();
        setTimeout(() => setBidFeedback(null), 5000);
      } else {
        const err = await res.json();
        setBidFeedback({ type: 'error', message: err.message || 'Erreur lors du dépôt de l\'offre.' });
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

  const handlePrevImage = () => {
    setActiveImageIndex(prev => (prev === 0 ? galleryImages.length - 1 : prev - 1));
  };

  const handleNextImage = () => {
    setActiveImageIndex(prev => (prev === galleryImages.length - 1 ? 0 : prev + 1));
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

  const handleAddFullLookToCart = () => {
    addToCart(product);
    complementaryItems.forEach(item => addToCart(item));
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
                    aria-label="Image précédente"
                  >
                    ‹
                  </button>
                  <button 
                    type="button"
                    className="gallery-nav-arrow gallery-next-btn"
                    onClick={(e) => { e.stopPropagation(); handleNextImage(); }}
                    aria-label="Image suivante"
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
                      <button className="lightbox-nav-btn prev" onClick={handlePrevImage}>‹</button>
                      <button className="lightbox-nav-btn next" onClick={handleNextImage}>›</button>
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

            {/* Trust Badges */}
            <div className="detail-trust-card">
              <div className="detail-trust-title">
                🛡️ GARANTIES & SÉCURITÉ JEWELIA
              </div>
              <ul className="detail-trust-list">
                {isSecondHand ? (
                  <>
                    <li>✓ <strong>Authentification :</strong> Contrôlé par spectrométrie & gemmologue</li>
                    <li>✓ <strong>Justificatifs :</strong> {product.certificat ? 'Certificat inclus' : 'Vérification garantie'} & facture</li>
                    <li>✓ <strong>Protection :</strong> Droit de retour 14 jours & remise sécurisée</li>
                  </>
                ) : (
                  <>
                    <li>✓ <strong>Produit Neuf :</strong> Poinçon d'État officiel 18k / 24k</li>
                    <li>✓ <strong>Garantie :</strong> Garantie joaillier 2 ans avec certificat</li>
                    <li>✓ <strong>Écrin :</strong> Boîte et emballage cadeau de luxe offerts</li>
                  </>
                )}
                <li>✓ <strong>Livraison :</strong> Expédition express blindée 24/48h assurée à 100%</li>
              </ul>
            </div>
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
                  🔨 ENCHÈRE EN DIRECT
                </span>
              ) : (
                <span 
                  className={`universe-badge ${isSecondHand ? 'second-hand' : 'first-hand'}`}
                  style={{ position: 'static', padding: '6px 14px', fontSize: '0.78rem' }}
                >
                  {isSecondHand ? '♻️ SECONDE MAIN' : '✨ PREMIÈRE MAIN'}
                </span>
              )}

              {isAuction && timeLeftText && (
                <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#dc2626', background: 'rgba(239, 68, 68, 0.1)', padding: '4px 10px', borderRadius: '12px', border: '1px solid rgba(239, 68, 68, 0.25)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span className="gold-pulse-indicator" style={{ background: '#ef4444' }} />
                  ⏱️ Fin dans : {timeLeftText}
                </span>
              )}

              {isSecondHand && !isAuction && (
                <span className="chip-tag condition-badge">
                  ♻️ {product.etat || 'Excellent état'}
                </span>
              )}

              {product.authentifie === 'Vérifié' && (
                <span className="chip-tag verified-badge">
                  ✓ Bijou vérifié
                </span>
              )}
            </div>

            {/* Title */}
            <h1 style={{ fontSize: '1.6rem', lineHeight: 1.25, color: 'var(--text-dark)', margin: '4px 0', fontFamily: 'var(--font-serif)' }}>
              {displayTitle}
            </h1>

            {/* Rating & Seller */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.86rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span className="star-icon">⭐</span>
                <strong>{product.note || 4.9}</strong>
                <span style={{ color: 'var(--text-gray)' }}>({product.nombre_avis || reviewsList.length} avis)</span>
              </div>
              <span style={{ color: 'var(--text-gray)' }}>•</span>
              <div style={{ color: 'var(--text-gray)' }}>
                Vendu par : <strong style={{ color: 'var(--primary-gold)' }}>{product.vendeur_nom || 'Maison Joaillerie'}</strong>
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
                      Offre Actuelle la plus Haute
                    </span>
                    <span style={{ fontSize: '2.2rem', fontWeight: 900, color: 'var(--primary-gold)', fontFamily: 'var(--font-serif)' }}>
                      {(auctionInfo?.highestBid || product.prix).toLocaleString()} <small style={{ fontSize: '1rem' }}>DH</small>
                    </span>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-gray)', display: 'block' }}>
                      Prix de départ : <strong>{(auctionInfo?.prix_depart || product.prix).toLocaleString()} DH</strong>
                    </span>
                    <span style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 700 }}>
                      🔥 {auctionInfo?.bidsCount || 0} enchère{(auctionInfo?.bidsCount || 0) > 1 ? 's' : ''} déposée{(auctionInfo?.bidsCount || 0) > 1 ? 's' : ''}
                    </span>
                  </div>
                </div>

                {/* Interactive Bidding Form */}
                <form onSubmit={handlePlaceBid} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <label style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-dark)' }}>
                    Votre Enchère (Palier minimal +{(auctionInfo?.increment_min || 50)} DH) :
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
                          +{inc} DH ({target.toLocaleString()} DH)
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
                      placeholder="Ex: 7500"
                      className="filter-select-control"
                      style={{ fontSize: '1.05rem', fontWeight: 700, borderColor: 'var(--primary-gold)' }}
                    />
                    <button 
                      type="submit" 
                      disabled={isBidding}
                      className="btn-jewelia-primary"
                      style={{ padding: '10px 22px', whiteSpace: 'nowrap', fontWeight: 800 }}
                    >
                      {isBidding ? 'Envoi...' : '🔨 Enchérir'}
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
              /* Normal Price Row */
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px', padding: '12px 0', borderBottom: '1px solid rgba(0, 0, 0, 0.08)' }}>
                <span style={{ fontSize: '2rem', fontWeight: 800, fontFamily: 'var(--font-serif)', color: 'var(--primary-gold)' }}>
                  {product.prix.toLocaleString()} DH
                </span>
                {product.ancien_prix && product.ancien_prix > product.prix && (
                  <>
                    <span style={{ fontSize: '1.1rem', color: 'var(--text-gray)', textDecoration: 'line-through' }}>
                      {product.ancien_prix.toLocaleString()} DH
                    </span>
                    <span className="card-discount-badge">
                      -{Math.round(((product.ancien_prix - product.prix) / product.ancien_prix) * 100)}%
                    </span>
                  </>
                )}
              </div>
            )}

            {/* Description */}
            <p style={{ color: 'var(--text-gray)', fontSize: '0.9rem', lineHeight: 1.5 }}>
              {displayDesc}
            </p>

            {/* Specs Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 16px', padding: '12px', background: 'var(--bg-surface-elevated)', borderRadius: 'var(--radius-sm)', fontSize: '0.84rem', border: '1px solid var(--border-subtle)' }}>
              <div><span style={{ color: 'var(--text-gray)' }}>Matière :</span> <strong>{product.matiere} {product.purete || '18K'}</strong></div>
              <div><span style={{ color: 'var(--text-gray)' }}>Poids :</span> <strong>{product.gramme || product.poids || 0} g</strong></div>
              <div><span style={{ color: 'var(--text-gray)' }}>Pierre :</span> <strong>{product.pierre || 'Aucune'}</strong></div>
              <div><span style={{ color: 'var(--text-gray)' }}>Taille :</span> <strong>{product.taille || 'Standard'}</strong></div>
              {isSecondHand && (
                <>
                  <div><span style={{ color: 'var(--text-gray)' }}>Année :</span> <strong>{product.annee || 'Vintage'}</strong></div>
                  <div><span style={{ color: 'var(--text-gray)' }}>État :</span> <strong style={{ color: '#059669' }}>{product.etat}</strong></div>
                </>
              )}
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '10px', marginTop: '6px', flexWrap: 'wrap' }}>
              {!isAuction && (
                <>
                  <button 
                    onClick={() => {
                      addToCart(product);
                    }}
                    className="btn-jewelia-primary"
                    style={{ flex: 1.5, padding: '14px' }}
                  >
                    🛒 {t('addToCart')}
                  </button>

                  <button 
                    onClick={() => {
                      addToCart(product);
                      if (onDirectBuy) onDirectBuy();
                      onClose();
                    }}
                    className="btn-jewelia-secondary"
                    style={{ flex: 1, padding: '14px' }}
                  >
                    ⚡ {t('buyNow')}
                  </button>
                </>
              )}

              <button 
                onClick={() => {
                  if (onOpenChatWithSeller) onOpenChatWithSeller(product);
                  onClose();
                }}
                className="btn-jewelia-secondary"
                style={{ borderColor: 'var(--primary-gold)', color: 'var(--primary-gold)', padding: '14px' }}
                title="Discuter avec le vendeur"
              >
                💬 Discuter
              </button>

              <a 
                href={`https://wa.me/212600000000?text=Bonjour, je suis intéressé par votre bijou : ${encodeURIComponent(displayTitle)}`}
                target="_blank"
                rel="noreferrer"
                className="btn-jewelia-secondary"
                style={{ borderColor: '#25d366', color: '#065f46', background: 'rgba(37, 211, 102, 0.12)', padding: '14px', textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
                title="Contacter sur WhatsApp"
              >
                <span>🟢</span> WhatsApp
              </a>

              <button 
                onClick={() => toggleFavorite(product.id)}
                className={`card-favorite-btn ${isFavorited ? 'favorited' : ''}`}
                style={{ position: 'static', width: '48px', height: '48px', borderRadius: 'var(--radius-sm)' }}
                title="Favoris"
              >
                ♥
              </button>

              <button 
                onClick={() => onAddToCompare(product)}
                className={`btn-card-compare ${isCompared ? 'active' : ''}`}
                style={{ width: '48px', height: '48px', borderRadius: 'var(--radius-sm)' }}
                title="Comparer"
              >
                ⚖️
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
                paddingBottom: '8px'
              }}
            >
              💎 {t('completeLook')}
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
                paddingBottom: '8px'
              }}
            >
              ⭐ {t('customerReviews')} ({reviewsList.length})
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
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-gray)', display: 'block', marginTop: '2px' }}>Votre bijou</span>
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
                        <span style={{ fontSize: '0.72rem', color: 'var(--light-gold)', display: 'block', marginTop: '2px' }}>{c.prix} DH</span>
                      </div>
                    </React.Fragment>
                  ))}
                </div>

                <button 
                  onClick={handleAddFullLookToCart}
                  className="btn-jewelia-primary"
                  style={{ padding: '10px 20px', fontSize: '0.88rem' }}
                >
                  ✨ {t('addLookToCart')}
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
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-gray)' }}>Votre note :</span>
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
                    placeholder="Partagez votre avis sur l'éclat, l'état ou la livraison..."
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
                  <p style={{ color: 'var(--text-gray)', fontSize: '0.88rem' }}>Soyez le premier à donner votre avis sur ce bijou.</p>
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
