import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../config/api';

export default function SellJewelModal({ isOpen, onClose, onProductPublished }) {
  const { t } = useLanguage();
  const { user } = useAuth();

  const [formData, setFormData] = useState({
    titre: '',
    description: '',
    type_vente: 'SECOND_HAND', // 'FIRST_HAND', 'SECOND_HAND', 'AUCTION'
    category_id: 'cat_rings',
    matiere: 'Or',
    purete: '18k',
    poids: '',
    pierre: 'Aucune',
    taille: '52',
    etat: 'Excellent état',
    annee: '2020',
    prix: '',
    ancien_prix: '',
    prix_depart: '',
    duree_enchere: '48',
    city: user?.city || 'Casablanca',
    facture: true,
    certificat: true,
    boite: true,
    garantie: false,
    images: [
      'https://images.unsplash.com/photo-1603561591411-07134e71a2a9?w=800&auto=format&fit=crop&q=80'
    ]
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  if (!isOpen) return null;

  const sampleImages = [
    'https://images.unsplash.com/photo-1603561591411-07134e71a2a9?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1611591475168-5e8a719003ff?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1598560917505-59a3ad559071?w=800&auto=format&fit=crop&q=80'
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    const effectivePrice = formData.type_vente === 'AUCTION' 
      ? (formData.prix_depart || formData.prix) 
      : (formData.prix || formData.prix_depart);
    if (!formData.titre || !effectivePrice) {
      alert('Veuillez renseigner le titre et le prix de votre bijou.');
      return;
    }

    setIsSubmitting(true);
    try {
      const isAuction = formData.type_vente === 'AUCTION';
      const payload = {
        ...formData,
        prix: parseFloat(effectivePrice),
        ancien_prix: formData.ancien_prix ? parseFloat(formData.ancien_prix) : null,
        poids: parseFloat(formData.poids || 3),
        gramme: parseFloat(formData.poids || 3),
        type_vente: isAuction ? 'SECOND_HAND' : formData.type_vente,
        disponibilite: isAuction ? 'enchere' : 'disponible',
        commercant_id: user ? user.id : 'u_particulier1',
        vendeur_nom: user ? (user.shopName || user.nom) : 'Particulier Vérifié',
        vendeur_type: user?.role === 'commercant' ? 'bijouterie' : 'particulier',
        statut: 'Validated'
      };

      const res = await fetch(`${API_URL}/bijoux`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const createdBijou = await res.json();

        // If it's an auction, launch the auction entity
        if (isAuction) {
          const durationHours = parseInt(formData.duree_enchere) || 48;
          const auctionRes = await fetch(`${API_URL}/encheres`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              bijou_id: createdBijou.id,
              prix_depart: parseFloat(formData.prix_depart) || parseFloat(formData.prix),
              date_debut: new Date().toISOString(),
              date_fin: new Date(Date.now() + durationHours * 60 * 60 * 1000).toISOString(),
              increment_min: 50,
              prix_reserve: parseFloat(formData.prix_depart) || parseFloat(formData.prix)
            })
          });

          if (!auctionRes.ok) {
            console.error('Failed to create auction entity');
          }
        }

        setSuccessMessage(isAuction 
          ? '🔨 Enchère lancée avec succès ! Le lot est désormais en direct.' 
          : '✨ Félicitations ! Votre bijou a été publié avec succès sur JEWELIA.'
        );

        setTimeout(() => {
          if (onProductPublished) onProductPublished(createdBijou);
          setIsSubmitting(false);
          setSuccessMessage('');
          onClose();
        }, 1800);
      } else {
        const errData = await res.json();
        if (errData.error === 'QUOTA_EXCEEDED') {
          alert(`⚠️ ${errData.message}`);
        } else {
          alert(errData.message || 'Erreur lors de la publication.');
        }
        setIsSubmitting(false);
      }
    } catch (err) {
      console.error(err);
      alert('Erreur de connexion au serveur.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 1000, overflowY: 'auto', padding: '16px' }}>
      <div 
        className="modal-content" 
        style={{ maxWidth: '780px', padding: '32px', margin: 'auto', maxHeight: '92vh', overflowY: 'auto' }}
        onClick={e => e.stopPropagation()}
      >
        <button className="modal-close-btn" onClick={onClose}>✕</button>

        <div style={{ textAlign: 'center', marginBottom: '22px' }}>
          <div className="section-micro-badge" style={{ margin: '0 auto 8px' }}>
            💎 DÉPÔT DE BIJOU & ENCHÈRE
          </div>
          <h2 style={{ fontSize: '1.75rem', marginBottom: '6px', color: 'var(--text-dark)', fontFamily: 'var(--font-serif)' }}>
            Déposer ou Mettre aux Enchères un Bijou
          </h2>
          <p style={{ color: 'var(--text-gray)', fontSize: '0.88rem' }}>
            Particulier ou Bijoutier Professionnel : touchez des milliers de passionnés de haute joaillerie.
          </p>
        </div>

        {successMessage ? (
          <div style={{ padding: '30px', background: 'rgba(16, 185, 129, 0.12)', border: '1px solid #10b981', borderRadius: 'var(--radius-md)', textAlign: 'center', color: '#065f46' }}>
            <span style={{ fontSize: '2.5rem', display: 'block', marginBottom: '10px' }}>✨</span>
            <h3 style={{ fontSize: '1.3rem', marginBottom: '8px' }}>{successMessage}</h3>
            <p style={{ fontSize: '0.9rem' }}>Actualisation du catalogue en cours...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Type de vente selector (3 Choices) */}
            <div>
              <label className="form-label" style={{ marginBottom: '8px' }}>Format de Vente</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, type_vente: 'FIRST_HAND', etat: 'Neuf' })}
                  style={{
                    padding: '12px 10px',
                    borderRadius: 'var(--radius-md)',
                    background: formData.type_vente === 'FIRST_HAND' ? 'var(--first-hand-bg)' : 'var(--bg-surface-elevated)',
                    border: `1.5px solid ${formData.type_vente === 'FIRST_HAND' ? 'var(--primary-gold)' : 'var(--border-subtle)'}`,
                    color: formData.type_vente === 'FIRST_HAND' ? 'var(--first-hand-text)' : 'var(--text-dark)',
                    fontWeight: 700,
                    fontSize: '0.84rem',
                    cursor: 'pointer',
                    textAlign: 'center'
                  }}
                >
                  ✨ Première Main (Neuf)
                </button>

                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, type_vente: 'SECOND_HAND', etat: 'Excellent état' })}
                  style={{
                    padding: '12px 10px',
                    borderRadius: 'var(--radius-md)',
                    background: formData.type_vente === 'SECOND_HAND' ? 'var(--second-hand-bg)' : 'var(--bg-surface-elevated)',
                    border: `1.5px solid ${formData.type_vente === 'SECOND_HAND' ? 'var(--second-hand-emerald)' : 'var(--border-subtle)'}`,
                    color: formData.type_vente === 'SECOND_HAND' ? 'var(--second-hand-text)' : 'var(--text-dark)',
                    fontWeight: 700,
                    fontSize: '0.84rem',
                    cursor: 'pointer',
                    textAlign: 'center'
                  }}
                >
                  ♻️ Seconde Main (Occasion)
                </button>

                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, type_vente: 'AUCTION', etat: 'Très bon état' })}
                  style={{
                    padding: '12px 10px',
                    borderRadius: 'var(--radius-md)',
                    background: formData.type_vente === 'AUCTION' ? 'rgba(179, 135, 40, 0.15)' : 'var(--bg-surface-elevated)',
                    border: `1.5px solid ${formData.type_vente === 'AUCTION' ? 'var(--primary-gold)' : 'var(--border-subtle)'}`,
                    color: formData.type_vente === 'AUCTION' ? 'var(--primary-gold)' : 'var(--text-dark)',
                    fontWeight: 700,
                    fontSize: '0.84rem',
                    cursor: 'pointer',
                    textAlign: 'center'
                  }}
                >
                  🔨 Enchère en Direct
                </button>
              </div>
            </div>

            {/* Titre & Catégorie */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px' }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Titre de la pièce *</label>
                <input 
                  type="text"
                  required
                  placeholder="Ex: Bague Solitaire Or 18K & Diamant 0.70ct"
                  value={formData.titre}
                  onChange={e => setFormData({ ...formData, titre: e.target.value })}
                  className="form-input"
                />
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Catégorie</label>
                <select 
                  value={formData.category_id}
                  onChange={e => setFormData({ ...formData, category_id: e.target.value })}
                  className="form-input"
                >
                  <option value="cat_rings">💍 Bagues</option>
                  <option value="cat_necklaces">📿 Colliers</option>
                  <option value="cat_bracelets">🔗 Bracelets</option>
                  <option value="cat_earrings">👂 Boucles d'oreilles</option>
                  <option value="cat_sets">💎 Parures</option>
                  <option value="cat_men">⌚ Bijoux Homme</option>
                  <option value="cat_boxes">🎁 Coffrets & Cadeaux</option>
                </select>
              </div>
            </div>

            {/* Description */}
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Description & Histoire de la pièce</label>
              <textarea 
                rows="2"
                placeholder="Poinçon officiel, certification gemmologique, finition artisanale, provenance..."
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                className="form-input"
                style={{ resize: 'vertical' }}
              />
            </div>

            {/* Pricing / Auction specifics */}
            {formData.type_vente === 'AUCTION' ? (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', background: 'rgba(179,135,40,0.06)', border: '1px solid var(--border-gold)', padding: '14px', borderRadius: 'var(--radius-md)' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ color: 'var(--primary-gold)' }}>Prix de Départ de l'Enchère (DH) *</label>
                  <input 
                    type="number"
                    required
                    placeholder="Ex: 5000"
                    value={formData.prix_depart}
                    onChange={e => setFormData({ ...formData, prix_depart: e.target.value, prix: e.target.value })}
                    className="form-input"
                  />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ color: 'var(--primary-gold)' }}>Durée de l'Enchère</label>
                  <select 
                    value={formData.duree_enchere}
                    onChange={e => setFormData({ ...formData, duree_enchere: e.target.value })}
                    className="form-input"
                  >
                    <option value="24">24 Heures (Flash)</option>
                    <option value="48">48 Heures (2 Jours)</option>
                    <option value="72">72 Heures (3 Jours)</option>
                    <option value="168">7 Jours (Semaine VIP)</option>
                  </select>
                </div>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Prix de Vente (DH) *</label>
                  <input 
                    type="number"
                    required
                    placeholder="Ex: 3890"
                    value={formData.prix}
                    onChange={e => setFormData({ ...formData, prix: e.target.value })}
                    className="form-input"
                  />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Ancien Prix / Valeur d'origine (Optionnel)</label>
                  <input 
                    type="number"
                    placeholder="Ex: 4500"
                    value={formData.ancien_prix}
                    onChange={e => setFormData({ ...formData, ancien_prix: e.target.value })}
                    className="form-input"
                  />
                </div>
              </div>
            )}

            {/* Matière, Pureté & Poids */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px' }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Matière</label>
                <select 
                  value={formData.matiere}
                  onChange={e => setFormData({ ...formData, matiere: e.target.value })}
                  className="form-input"
                >
                  <option value="Or">Or Jaune (750‰)</option>
                  <option value="Or Blanc">Or Blanc</option>
                  <option value="Or Rose">Or Rose</option>
                  <option value="Argent">Argent 925</option>
                  <option value="Platine">Platine</option>
                </select>
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Pureté</label>
                <select 
                  value={formData.purete}
                  onChange={e => setFormData({ ...formData, purete: e.target.value })}
                  className="form-input"
                >
                  <option value="18k">18 Carats (750‰)</option>
                  <option value="21k">21 Carats (875‰)</option>
                  <option value="24k">24 Carats (Or Pur 999‰)</option>
                  <option value="925">Argent Massif 925</option>
                </select>
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Poids (grammes)</label>
                <input 
                  type="number"
                  step="0.1"
                  placeholder="Ex: 4.8"
                  value={formData.poids}
                  onChange={e => setFormData({ ...formData, poids: e.target.value })}
                  className="form-input"
                />
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Ville</label>
                <input 
                  type="text"
                  value={formData.city}
                  onChange={e => setFormData({ ...formData, city: e.target.value })}
                  className="form-input"
                />
              </div>
            </div>

            {/* Image Picker */}
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Photos du bijou (Sélectionnez ou URL)</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '8px', marginBottom: '8px' }}>
                {sampleImages.map((img, i) => (
                  <div
                    key={i}
                    onClick={() => setFormData({ ...formData, images: [img] })}
                    style={{
                      aspectRatio: '1/1',
                      borderRadius: '8px',
                      overflow: 'hidden',
                      border: formData.images[0] === img ? '2.5px solid var(--primary-gold)' : '1px solid var(--border-subtle)',
                      cursor: 'pointer',
                      transform: formData.images[0] === img ? 'scale(1.05)' : 'none',
                      boxShadow: formData.images[0] === img ? '0 0 10px rgba(179,135,40,0.3)' : 'none',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <img src={img} alt={`Exemple ${i}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                ))}
              </div>
              <input 
                type="text"
                placeholder="Ou collez une URL d'image directe..."
                value={formData.images[0] || ''}
                onChange={e => setFormData({ ...formData, images: [e.target.value] })}
                className="form-input"
                style={{ fontSize: '0.82rem' }}
              />
            </div>

            {/* Submit Button */}
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '10px' }}>
              <button 
                type="button" 
                onClick={onClose}
                className="btn-jewelia-secondary"
                style={{ padding: '10px 20px', fontSize: '0.88rem' }}
              >
                Annuler
              </button>
              <button 
                type="submit" 
                disabled={isSubmitting}
                className="btn-jewelia-primary"
                style={{ padding: '10px 28px', fontSize: '0.88rem' }}
              >
                {isSubmitting ? 'Publication en cours...' : (formData.type_vente === 'AUCTION' ? '🔨 Lancer l\'Enchère' : '✨ Publier le Bijou')}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
