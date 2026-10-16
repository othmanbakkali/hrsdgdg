import React from 'react';
import { useLanguage } from '../context/LanguageContext';

export default function ProductComparatorModal({ isOpen, onClose, comparedProducts = [], onRemoveProduct, onSelectProduct }) {
  const { t, lang, isRtl } = useLanguage();

  if (!isOpen) return null;

  return (
    <div className="jewelia-modal-backdrop" onClick={onClose} dir={isRtl ? 'rtl' : 'ltr'}>
      <div 
        className="jewelia-modal-content" 
        style={{ maxWidth: '1080px', padding: '36px' }}
        onClick={e => e.stopPropagation()}
      >
        <button className="modal-close-btn" onClick={onClose}>✕</button>

        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div className="hero-pill-badge" style={{ margin: '0 auto 10px' }}>
            ⚖️ {lang === 'ar' ? 'مقارن العروض YAZ' : "COMPARATEUR D'OFFRES YAZ"}
          </div>
          <h2 style={{ fontSize: '1.8rem', marginBottom: '6px' }}>
            {lang === 'ar' ? 'مقارنة المجوهرات' : 'Comparer les Bijoux'}
          </h2>
          <p style={{ color: 'var(--text-gray)', fontSize: '0.9rem' }}>
            {lang === 'ar' ? 'قارن جنباً إلى جنب المواصفات، الحالة، وزن الذهب والضمانات لاختيار الأنسب.' : "Analysez côte-à-côte les caractéristiques, l'état, le poids d'or et les garanties pour faire le meilleur choix."}
          </p>
        </div>

        {comparedProducts.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-gray)' }}>
            <span style={{ fontSize: '2.5rem', display: 'block', marginBottom: '12px' }}>⚖️</span>
            <p>{lang === 'ar' ? 'لم يتم اختيار أي قطعة للمقارنة.' : 'Aucun bijou sélectionné pour la comparaison.'}</p>
            <p style={{ fontSize: '0.85rem', marginTop: '6px' }}>
              {lang === 'ar' ? 'اضغط على أيقونة ⚖️ على بطاقات المجوهرات لإضافتها هنا.' : "Cochez l'icône ⚖️ sur les cartes de bijoux pour les ajouter ici."}
            </p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: isRtl ? 'right' : 'left', fontSize: '0.9rem' }}>
              <thead>
                <tr>
                  <th style={{ padding: '12px', borderBottom: '1px solid var(--border-gold)', color: 'var(--text-gray)', width: '160px' }}>
                    {lang === 'ar' ? 'المعايير' : 'Critères'}
                  </th>
                  {comparedProducts.map(p => {
                    const title = (lang === 'ar' && p.titre_ar) ? p.titre_ar : p.titre;
                    return (
                      <th key={p.id} style={{ padding: '12px', borderBottom: '1px solid var(--border-gold)', minWidth: '200px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div style={{ width: '100%' }}>
                            <img 
                              src={p.images[0]} 
                              alt={title}
                              style={{ width: '100%', height: '140px', objectFit: 'cover', borderRadius: '8px', marginBottom: '8px' }}
                            />
                            <h4 style={{ fontSize: '0.95rem', color: 'var(--text-dark)', lineHeight: 1.3 }}>{title}</h4>
                          </div>
                          <button 
                            onClick={() => onRemoveProduct(p.id)}
                            style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '1rem', marginLeft: '6px' }}
                            title={lang === 'ar' ? "حذف" : "Retirer"}
                          >
                            ✕
                          </button>
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ padding: '12px', color: 'var(--light-gold)', fontWeight: 700, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    {lang === 'ar' ? 'السعر' : 'Prix'}
                  </td>
                  {comparedProducts.map(p => (
                    <td key={p.id} style={{ padding: '12px', fontWeight: 800, fontSize: '1.1rem', color: 'var(--light-gold)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                      {p.prix.toLocaleString()} {lang === 'ar' ? 'د.م' : 'DH'}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td style={{ padding: '12px', color: 'var(--text-gray)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    {lang === 'ar' ? 'نوع البيع' : 'Type de vente'}
                  </td>
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
                        {p.type_vente === 'SECOND_HAND' 
                          ? (lang === 'ar' ? '♻️ مستعمل ممتازة' : '♻️ Seconde main')
                          : (lang === 'ar' ? '✨ جديد 100%' : '✨ Première main')}
                      </span>
                    </td>
                  ))}
                </tr>
                <tr>
                  <td style={{ padding: '12px', color: 'var(--text-gray)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    {lang === 'ar' ? 'الحالة' : 'État'}
                  </td>
                  {comparedProducts.map(p => (
                    <td key={p.id} style={{ padding: '12px', color: '#fff', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                      {p.etat || (lang === 'ar' ? 'جديد' : 'Neuf')}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td style={{ padding: '12px', color: 'var(--text-gray)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    {lang === 'ar' ? 'المعدن والعيار' : 'Matière & Pureté'}
                  </td>
                  {comparedProducts.map(p => (
                    <td key={p.id} style={{ padding: '12px', color: '#fff', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                      {p.matiere} {p.purete || '18K'}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td style={{ padding: '12px', color: 'var(--text-gray)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    {lang === 'ar' ? 'الوزن' : 'Poids'}
                  </td>
                  {comparedProducts.map(p => (
                    <td key={p.id} style={{ padding: '12px', color: '#fff', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                      {p.gramme || p.poids || 0} {lang === 'ar' ? 'غ' : 'g'}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td style={{ padding: '12px', color: 'var(--text-gray)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    {lang === 'ar' ? 'الأحجار' : 'Pierre'}
                  </td>
                  {comparedProducts.map(p => (
                    <td key={p.id} style={{ padding: '12px', color: '#fff', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                      {p.pierre || (lang === 'ar' ? 'بدون' : 'Aucune')}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td style={{ padding: '12px', color: 'var(--text-gray)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    {lang === 'ar' ? 'البائع' : 'Vendeur'}
                  </td>
                  {comparedProducts.map(p => (
                    <td key={p.id} style={{ padding: '12px', color: '#fff', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                      <div>{p.vendeur_nom || (lang === 'ar' ? 'بائع موثق' : 'Vendeur Certifié')}</div>
                      <span style={{ fontSize: '0.75rem', color: '#f59e0b' }}>⭐ {p.note || 4.8} ({p.nombre_avis || 10} {lang === 'ar' ? 'تقييم' : 'avis'})</span>
                    </td>
                  ))}
                </tr>
                <tr>
                  <td style={{ padding: '12px', color: 'var(--text-gray)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    {lang === 'ar' ? 'الشهادة والفاتورة' : 'Certificat & Facture'}
                  </td>
                  {comparedProducts.map(p => (
                    <td key={p.id} style={{ padding: '12px', color: '#10b981', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                      {p.certificat ? (lang === 'ar' ? '✓ متوفرة' : '✓ Inclus') : (lang === 'ar' ? 'غير متوفرة' : 'Non requis')} / {p.facture ? (lang === 'ar' ? '✓ متوفرة' : '✓ Fournie') : '—'}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td style={{ padding: '12px', color: 'var(--text-gray)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    {lang === 'ar' ? 'التوصيل' : 'Livraison'}
                  </td>
                  {comparedProducts.map(p => (
                    <td key={p.id} style={{ padding: '12px', color: '#a7f3d0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                      🚚 {lang === 'ar' ? 'توصيل آمن ومضمون' : '24/48h Sécurisée'}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td style={{ padding: '16px 12px' }}>
                    {lang === 'ar' ? 'الإجراء' : 'Action'}
                  </td>
                  {comparedProducts.map(p => (
                    <td key={p.id} style={{ padding: '16px 12px' }}>
                      <button 
                        onClick={() => {
                          if (onSelectProduct) onSelectProduct(p);
                          onClose();
                        }}
                        className="btn-jewelia-primary"
                        style={{ width: '100%', padding: '10px 14px', fontSize: '0.85rem' }}
                      >
                        👁️ {lang === 'ar' ? 'عرض التفاصيل' : 'Voir les détails'}
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
