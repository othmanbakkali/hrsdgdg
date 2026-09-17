import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useCart } from '../context/CartContext';

export default function ProductComparatorModal({ isOpen, onClose, comparedProducts = [], onRemoveProduct, onSelectProduct }) {
  const { t } = useLanguage();
  const { addToCart } = useCart();

  if (!isOpen) return null;

  return (
    <div className="jewelia-modal-backdrop" onClick={onClose}>
      <div 
        className="jewelia-modal-content" 
        style={{ maxWidth: '1080px', padding: '36px' }}
        onClick={e => e.stopPropagation()}
      >
        <button className="modal-close-btn" onClick={onClose}>✕</button>

        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div className="hero-pill-badge" style={{ margin: '0 auto 10px' }}>
            ⚖️ COMPARATEUR D'OFFRES JEWELIA
          </div>
          <h2 style={{ fontSize: '1.8rem', marginBottom: '6px' }}>
            Comparer les Bijoux
          </h2>
          <p style={{ color: 'var(--text-gray)', fontSize: '0.9rem' }}>
            Analysez côte-à-côte les caractéristiques, l'état, le poids d'or et les garanties pour faire le meilleur choix.
          </p>
        </div>

        {comparedProducts.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-gray)' }}>
            <span style={{ fontSize: '2.5rem', display: 'block', marginBottom: '12px' }}>⚖️</span>
            <p>Aucun bijou sélectionné pour la comparaison.</p>
            <p style={{ fontSize: '0.85rem', marginTop: '6px' }}>
              Cochez l'icône ⚖️ sur les cartes de bijoux pour les ajouter ici.
            </p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
              <thead>
                <tr>
                  <th style={{ padding: '12px', borderBottom: '1px solid var(--border-gold)', color: 'var(--text-gray)', width: '160px' }}>
                    Critères
                  </th>
                  {comparedProducts.map(p => (
                    <th key={p.id} style={{ padding: '12px', borderBottom: '1px solid var(--border-gold)', minWidth: '200px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div style={{ width: '100%' }}>
                          <img 
                            src={p.images[0]} 
                            alt={p.titre}
                            style={{ width: '100%', height: '140px', objectFit: 'cover', borderRadius: '8px', marginBottom: '8px' }}
                          />
                          <h4 style={{ fontSize: '0.95rem', color: 'var(--text-dark)', lineHeight: 1.3 }}>{p.titre}</h4>
                        </div>
                        <button 
                          onClick={() => onRemoveProduct(p.id)}
                          style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '1rem', marginLeft: '6px' }}
                          title="Retirer"
                        >
                          ✕
                        </button>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ padding: '12px', color: 'var(--light-gold)', fontWeight: 700, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>Prix</td>
                  {comparedProducts.map(p => (
                    <td key={p.id} style={{ padding: '12px', fontWeight: 800, fontSize: '1.1rem', color: 'var(--light-gold)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                      {p.prix.toLocaleString()} DH
                    </td>
                  ))}
                </tr>
                <tr>
                  <td style={{ padding: '12px', color: 'var(--text-gray)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>Type de vente</td>
                  {comparedProducts.map(p => (
                    <td key={p.id} style={{ padding: '12px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                      <span 
                        style={{
                          padding: '3px 8px',
                          borderRadius: '4px',
                          fontSize: '0.78rem',
                          fontWeight: 800,
                          background: p.type_vente === 'SECOND_HAND' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(212, 175, 55, 0.2)',
                          color: p.type_vente === 'SECOND_HAND' ? '#6ee7b7' : 'var(--light-gold)',
                          border: `1px solid ${p.type_vente === 'SECOND_HAND' ? '#10b981' : 'var(--primary-gold)'}`
                        }}
                      >
                        {p.type_vente === 'SECOND_HAND' ? '♻️ Seconde main' : '✨ Première main'}
                      </span>
                    </td>
                  ))}
                </tr>
                <tr>
                  <td style={{ padding: '12px', color: 'var(--text-gray)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>État</td>
                  {comparedProducts.map(p => (
                    <td key={p.id} style={{ padding: '12px', color: '#fff', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                      {p.etat || 'Neuf'}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td style={{ padding: '12px', color: 'var(--text-gray)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>Matière & Pureté</td>
                  {comparedProducts.map(p => (
                    <td key={p.id} style={{ padding: '12px', color: '#fff', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                      {p.matiere} {p.purete || '18K'}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td style={{ padding: '12px', color: 'var(--text-gray)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>Poids</td>
                  {comparedProducts.map(p => (
                    <td key={p.id} style={{ padding: '12px', color: '#fff', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                      {p.gramme || p.poids || 0} g
                    </td>
                  ))}
                </tr>
                <tr>
                  <td style={{ padding: '12px', color: 'var(--text-gray)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>Pierre</td>
                  {comparedProducts.map(p => (
                    <td key={p.id} style={{ padding: '12px', color: '#fff', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                      {p.pierre || 'Aucune'}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td style={{ padding: '12px', color: 'var(--text-gray)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>Vendeur</td>
                  {comparedProducts.map(p => (
                    <td key={p.id} style={{ padding: '12px', color: '#fff', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                      <div>{p.vendeur_nom || 'Vendeur Certifié'}</div>
                      <span style={{ fontSize: '0.75rem', color: '#f59e0b' }}>⭐ {p.note || 4.8} ({p.nombre_avis || 10} avis)</span>
                    </td>
                  ))}
                </tr>
                <tr>
                  <td style={{ padding: '12px', color: 'var(--text-gray)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>Certificat & Facture</td>
                  {comparedProducts.map(p => (
                    <td key={p.id} style={{ padding: '12px', color: '#10b981', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                      {p.certificat ? '✓ Inclus' : 'Non requis'} / {p.facture ? '✓ Fournie' : '—'}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td style={{ padding: '12px', color: 'var(--text-gray)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>Livraison</td>
                  {comparedProducts.map(p => (
                    <td key={p.id} style={{ padding: '12px', color: '#a7f3d0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                      🚚 24/48h Sécurisée
                    </td>
                  ))}
                </tr>
                <tr>
                  <td style={{ padding: '16px 12px' }}>Action</td>
                  {comparedProducts.map(p => (
                    <td key={p.id} style={{ padding: '16px 12px' }}>
                      <button 
                        onClick={() => addToCart(p)}
                        className="btn-jewelia-primary"
                        style={{ width: '100%', padding: '10px 14px', fontSize: '0.85rem' }}
                      >
                        + Ajouter au panier
                      </button>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
