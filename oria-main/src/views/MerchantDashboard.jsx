import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../config/api';
import ProductCard from '../components/ProductCard';

export default function MerchantDashboard({ onOpenSellModal }) {
  const { t } = useLanguage();
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState('listings'); // 'listings', 'orders', 'add-product', 'sales-history', 'verifications'
  const [stats, setStats] = useState({ totalSales: 0, totalCommission: 0, netEarnings: 0, itemsSold: 0 });
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [orders, setOrders] = useState([]);
  const [salesHistory, setSalesHistory] = useState([]);

  // New product form
  const [newProduct, setNewProduct] = useState({
    titre: '',
    description: '',
    prix: '',
    ancien_prix: '',
    prix_depart: '',
    duree_enchere: '48',
    type_vente: 'FIRST_HAND',
    matiere: 'Or',
    purete: '18k',
    poids: '4.5',
    pierre: 'Aucune',
    taille: '54',
    etat: 'Neuf',
    annee: '2026',
    city: user?.city || 'Casablanca',
    adresse: '',
    stock: '1',
    category_id: 'cat_rings',
    images: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=800&auto=format&fit=crop&q=80',
    facture: true,
    certificat: true,
    boite: true,
    garantie: true,
    composants_poids: {
      collier: '',
      bracelet: '',
      bague: '',
      boucles: ''
    }
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchMerchantData = async () => {
    if (!user) return;
    try {
      // Stats
      const statRes = await fetch(`${API_URL}/stats/merchant/${user.id}`);
      if (statRes.ok) {
        const statData = await statRes.json();
        setStats(statData);
      }

      // Products (include merchant's products even if sold)
      const prodRes = await fetch(`${API_URL}/bijoux?commercant=${user.id}`);
      if (prodRes.ok) {
        const prodData = await prodRes.json();
        setProducts(prodData);
      }

      // Categories
      const catRes = await fetch(`${API_URL}/categories`);
      if (catRes.ok) {
        const catData = await catRes.json();
        setCategories(catData);
      }

      // Orders
      const ordRes = await fetch(`${API_URL}/commandes?merchant_id=${user.id}`);
      if (ordRes.ok) {
        const ordData = await ordRes.json();
        setOrders(ordData);
      }

      // Sales History (for administrative & merchant tracking)
      const salesRes = await fetch(`${API_URL}/sales-history?vendeur_id=${user.id}`);
      if (salesRes.ok) {
        const salesData = await salesRes.json();
        setSalesHistory(salesData);
      }
    } catch (err) {
      console.error('Error fetching merchant data:', err);
    }
  };

  useEffect(() => {
    fetchMerchantData();
    const interval = setInterval(fetchMerchantData, 6000);
    return () => clearInterval(interval);
  }, [user]);

  const handleCreateProduct = async (e) => {
    e.preventDefault();
    const effectivePrice = newProduct.type_vente === 'AUCTION' ? newProduct.prix_depart : newProduct.prix;
    if (!newProduct.titre || !effectivePrice) return;

    setIsSubmitting(true);
    try {
      const isAuction = newProduct.type_vente === 'AUCTION';
      
      // Clean up parure components weight if provided
      let cleanComposants = null;
      if (newProduct.category_id === 'cat_sets' && newProduct.composants_poids) {
        cleanComposants = {};
        for (const [key, val] of Object.entries(newProduct.composants_poids)) {
          if (val && parseFloat(val) > 0) {
            cleanComposants[key] = parseFloat(val);
          }
        }
        if (Object.keys(cleanComposants).length === 0) cleanComposants = null;
      }

      const payload = {
        ...newProduct,
        prix: parseFloat(effectivePrice),
        ancien_prix: newProduct.ancien_prix ? parseFloat(newProduct.ancien_prix) : null,
        poids: parseFloat(newProduct.poids || 0),
        gramme: parseFloat(newProduct.poids || 0),
        composants_poids: cleanComposants,
        type_vente: isAuction ? 'SECOND_HAND' : newProduct.type_vente,
        disponibilite: isAuction ? 'enchere' : 'disponible',
        stock: parseInt(newProduct.stock || 1),
        city: newProduct.city || user.city || 'Casablanca',
        adresse: newProduct.adresse || '',
        images: [newProduct.images],
        commercant_id: user.id,
        vendeur_nom: user.shopName || user.nom,
        vendeur_phone: user.phone || user.telephone || '',
        vendeur_type: 'bijouterie',
        statut: 'Validated'
      };

      const res = await fetch(`${API_URL}/bijoux`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const createdBijou = await res.json();

        // If auction, post to /api/encheres
        if (isAuction) {
          const durationHours = parseInt(newProduct.duree_enchere) || 48;
          await fetch(`${API_URL}/encheres`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              bijou_id: createdBijou.id,
              prix_depart: parseFloat(newProduct.prix_depart || newProduct.prix),
              date_debut: new Date().toISOString(),
              date_fin: new Date(Date.now() + durationHours * 60 * 60 * 1000).toISOString(),
              increment_min: 50,
              prix_reserve: parseFloat(newProduct.prix_depart || newProduct.prix)
            })
          });
        }

        alert(isAuction ? '🔨 Enchère en direct créée et publiée avec succès !' : '✨ Bijou ajouté avec succès au catalogue JEWELIA !');
        fetchMerchantData();
        setActiveTab('listings');
        setIsSubmitting(false);
      } else {
        const errData = await res.json();
        alert(errData.message || 'Erreur lors de la publication du bijou.');
        setIsSubmitting(false);
      }
    } catch (err) {
      console.error(err);
      setIsSubmitting(false);
    }
  };

  const handleMarkAsSold = async (productId) => {
    if (!confirm('Confirmer le passage de cet article à l\'état « Vendu » ?\n\nConformément aux règles YAZ, l\'article restera visible avec le badge "Vendu" pendant 12 heures avant masquage automatique du catalogue public.')) return;
    try {
      const res = await fetch(`${API_URL}/bijoux/${productId}/vendre`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_phone: 'Vente directe boutique',
          canal: 'Direct'
        })
      });
      const data = await res.json();
      if (res.ok) {
        alert('✓ Vente confirmée ! L\'article est maintenant marqué comme "Vendu". Il sera masqué automatiquement après 12 heures.');
        fetchMerchantData();
      } else {
        alert(data.message || 'Impossible de marquer cet article comme vendu.');
      }
    } catch (err) {
      console.error('Error marking as sold:', err);
      alert('Erreur réseau lors de la validation de la vente.');
    }
  };

  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    try {
      const res = await fetch(`${API_URL}/commandes/${orderId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        fetchMerchantData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteProduct = async (productId) => {
    if (!confirm('Supprimer ce bijou du catalogue ?')) return;
    try {
      await fetch(`${API_URL}/bijoux/${productId}`, { method: 'DELETE' });
      fetchMerchantData();
    } catch (err) {
      console.error(err);
    }
  };

  const currentPlan = subscriptionData?.plan_details || {};
  const metrics = subscriptionData?.metrics || { used_slots: products.length, max_slots: 5, remaining_slots: Math.max(0, 5 - products.length), usage_percentage: 20, commission_rate: 8 };
  const availablePlans = subscriptionData?.available_plans || [
    {
      id: 'plan_starter',
      name: 'Pass Essentiel',
      tagline: 'Idéal pour débuter et tester vos premiers dépôts',
      price_monthly: 0,
      price_annual: 0,
      max_products: 5,
      commission_rate: 8,
      badge: 'Vendeur Partenaire',
      popular: false,
      color: '#9ca3af',
      features: [
        "Jusqu'à 5 bijoux actifs en ligne",
        "Commission standard de 8% par vente",
        "Fiche produit & messagerie client instantanée",
        "Paiement à la livraison sécurisé",
        "Support standard par email"
      ]
    },
    {
      id: 'plan_pro',
      name: 'Pack Prestige Joaillier',
      tagline: 'Le choix numéro 1 des bijouteries & créateurs',
      price_monthly: 490,
      price_annual: 4700,
      max_products: 30,
      commission_rate: 4,
      badge: '💎 Joaillier Partenaire',
      popular: true,
      color: '#d4af37',
      features: [
        "Jusqu'à 30 bijoux actifs en ligne",
        "Commission ultra-réduite à 4%",
        "Badge officiel '💎 Joaillier Partenaire'",
        "Mise en avant prioritaire dans le catalogue",
        "Certificats d'authenticité numériques inclus",
        "Statistiques de vente avancées & conversion",
        "Support WhatsApp prioritaire 7j/7"
      ]
    },
    {
      id: 'plan_vip',
      name: 'Haute Joaillerie VIP',
      tagline: "Visibilité maximale et conciergerie d'exception",
      price_monthly: 1290,
      price_annual: 11900,
      max_products: 9999,
      commission_rate: 2,
      badge: '👑 Maison Haute Joaillerie',
      popular: false,
      color: '#b76e79',
      features: [
        "Dépôts de bijoux ILLIMITÉS au catalogue",
        "Commission minimale exclusive de 2%",
        "Badge exclusif '👑 Maison Haute Joaillerie'",
        "Bannière publicitaire en tête de marketplace",
        "Vitrine boutique personnalisée dédiée (URL pro)",
        "Service shooting photo & retouche IA",
        "Concierge Joaillerie & Account Manager dédié",
        "Accès prioritaire aux enchères et ventes privées"
      ]
    }
  ];

  return (
    <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '36px 24px 60px' }}>
      {/* Toast feedback banner */}
      {subscriptionFeedback && (
        <div style={{
          background: subscriptionFeedback.type === 'success' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
          border: `1px solid ${subscriptionFeedback.type === 'success' ? '#10b981' : '#ef4444'}`,
          color: subscriptionFeedback.type === 'success' ? '#065f46' : '#991b1b',
          padding: '14px 20px',
          borderRadius: 'var(--radius-md)',
          marginBottom: '24px',
          fontWeight: 700,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <span>{subscriptionFeedback.type === 'success' ? '✨' : '⚠️'} {subscriptionFeedback.message}</span>
          <button onClick={() => setSubscriptionFeedback(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem' }}>✕</button>
        </div>
      )}

      {/* 1. SELLER HEADER */}
      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-gold)',
        borderRadius: 'var(--radius-lg)',
        padding: '28px',
        marginBottom: '30px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '20px',
        boxShadow: 'var(--shadow-card)'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '1.8rem' }}>🏪</span>
            <h2 style={{ fontSize: '1.6rem', color: 'var(--text-white)' }}>{user?.shopName || user?.nom || 'Maison Joaillière'}</h2>
            
            <span style={{
              padding: '4px 12px',
              borderRadius: 'var(--radius-full)',
              background: 'rgba(16, 185, 129, 0.12)',
              color: '#059669',
              fontSize: '0.78rem',
              fontWeight: 700,
              border: '1px solid rgba(16, 185, 129, 0.3)'
            }}>
              ✓ Vendeur Agréé
            </span>

          </div>
          <p style={{ color: 'var(--text-gray)', fontSize: '0.9rem' }}>
            Espace Vendeur Professionnel • Gestion du catalogue, commandes clients et traçabilité des ventes
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button 
            onClick={() => setActiveTab('sales-history')}
            className="btn-jewelia-secondary"
            style={{ padding: '10px 20px', fontSize: '0.88rem' }}
          >
            📜 Historique des Ventes
          </button>

          <button 
            onClick={() => setActiveTab('add-product')}
            className="btn-jewelia-primary"
            style={{ padding: '10px 22px', fontSize: '0.88rem' }}
          >
            ➕ Déposer un bijou
          </button>
        </div>
      </div>

      {/* 2. KPIS ROW */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '32px' }}>
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-gold)', borderRadius: 'var(--radius-md)', padding: '20px', boxShadow: 'var(--shadow-card)' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-gray)', textTransform: 'uppercase', letterSpacing: '1px' }}>Ventes Totales</span>
          <h3 style={{ fontSize: '1.75rem', color: 'var(--primary-gold)', fontFamily: 'var(--font-serif)', marginTop: '4px' }}>
            {stats.totalSales?.toLocaleString()} MAD
          </h3>
          <span style={{ fontSize: '0.75rem', color: 'var(--success-green)', fontWeight: 600 }}>Volume commercial réalisé</span>
        </div>

        {/* INDICATEUR ARGENT (REVENUS NETS REELS DB) */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-gold)', borderRadius: 'var(--radius-md)', padding: '20px', boxShadow: 'var(--shadow-card)' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-gray)', textTransform: 'uppercase', letterSpacing: '1px' }}>Argent (Revenus Nets)</span>
          <h3 style={{ fontSize: '1.75rem', color: '#10b981', fontFamily: 'var(--font-serif)', marginTop: '4px' }}>
            {stats.netEarnings?.toLocaleString()} MAD
          </h3>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-gray)' }}>Solde net disponible • Vendeur vérifié</span>
        </div>

        {/* ARTICLES VENDUS & TRACABILITE */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-gold)', borderRadius: 'var(--radius-md)', padding: '20px', boxShadow: 'var(--shadow-card)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-gray)', textTransform: 'uppercase', letterSpacing: '1px' }}>Articles Vendus</span>
            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--primary-gold)' }}>✓ Actif</span>
          </div>
          <h3 style={{ fontSize: '1.75rem', color: 'var(--primary-gold)', fontFamily: 'var(--font-serif)', marginTop: '4px' }}>
            {salesHistory.length} <span style={{ fontSize: '0.9rem', color: 'var(--text-gray)', fontFamily: 'var(--font-sans)' }}>transactions</span>
          </h3>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-gray)', marginTop: '6px' }}>
            Articles conservés en historique après 12h
          </div>
        </div>

        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-gold)', borderRadius: 'var(--radius-md)', padding: '20px', boxShadow: 'var(--shadow-card)' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-gray)', textTransform: 'uppercase', letterSpacing: '1px' }}>Commandes Reçues</span>
          <h3 style={{ fontSize: '1.75rem', color: 'var(--text-white)', fontFamily: 'var(--font-serif)', marginTop: '4px' }}>
            {orders.length}
          </h3>
          <span style={{ fontSize: '0.75rem', color: 'var(--primary-gold)' }}>⭐ Note vendeur 4.9/5</span>
        </div>
      </div>

      {/* 3. NAVIGATION TABS */}
      <div style={{ display: 'flex', gap: '10px', borderBottom: '1px solid var(--border-gold)', marginBottom: '28px', overflowX: 'auto', paddingBottom: '6px' }}>
        {[
          { id: 'listings', label: '💎 Mes Produits en Ligne', count: products.length },
          { id: 'orders', label: '📦 Commandes Reçues', count: orders.length },
          { id: 'add-product', label: '➕ Déposer un Bijou', count: null },
          { id: 'sales-history', label: '📜 Historique des Ventes', count: salesHistory.length, highlight: true },
          { id: 'verifications', label: '🛡️ Certifications & Preuves', count: products.filter(p => p.type_vente === 'SECOND_HAND').length }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '12px 20px',
              background: activeTab === tab.id 
                ? (tab.highlight ? 'linear-gradient(135deg, rgba(212,175,55,0.2) 0%, rgba(179,135,40,0.15) 100%)' : 'rgba(179, 135, 40, 0.12)') 
                : 'transparent',
              border: 'none',
              borderBottom: activeTab === tab.id ? '3px solid var(--primary-gold)' : '3px solid transparent',
              borderRadius: '8px 8px 0 0',
              color: activeTab === tab.id ? 'var(--primary-gold)' : 'var(--text-gray)',
              fontWeight: activeTab === tab.id ? 800 : 600,
              fontSize: '0.92rem',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'var(--transition-smooth)'
            }}
          >
            {tab.label} {tab.count !== null && `(${tab.count})`}
          </button>
        ))}
      </div>

      {/* TAB 1: LISTING */}
      {activeTab === 'listings' && (
        <div>
          {products.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', border: '1px dashed var(--border-gold)' }}>
              <span style={{ fontSize: '3rem', display: 'block', marginBottom: '14px' }}>💍</span>
              <h3 style={{ fontSize: '1.3rem', color: 'var(--text-white)', marginBottom: '8px' }}>Aucun bijou déposé pour le moment</h3>
              <p style={{ color: 'var(--text-gray)', fontSize: '0.9rem', marginBottom: '20px' }}>
                Commencez dès maintenant à publier vos créations et bijoux sur JEWELIA.
              </p>
              <button onClick={() => setActiveTab('add-product')} className="btn-jewelia-primary">
                ➕ Déposer mon premier bijou
              </button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '14px' }}>
              {products.map(p => {
                const isSold = p.etat === 'Vendu';
                return (
                  <div key={p.id} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <ProductCard product={p} />
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                      {isSold ? (
                        <div style={{ padding: '8px 10px', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid #ef4444', color: '#ef4444', borderRadius: '10px', fontSize: '0.78rem', fontWeight: 800, textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          ✓ Vendu {p.sold_at ? `(${new Date(p.sold_at).toLocaleDateString('fr-FR')})` : ''}
                        </div>
                      ) : (
                        <button 
                          onClick={() => handleMarkAsSold(p.id)}
                          style={{ padding: '8px 10px', background: 'linear-gradient(135deg, #10b981, #059669)', border: 'none', color: '#fff', borderRadius: '10px', fontSize: '0.78rem', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', transition: 'all 0.2s ease' }}
                          title="Marquer l'article comme vendu (conservé 12h en catalogue puis masqué)"
                        >
                          🏷️ Marquer Vendu
                        </button>
                      )}
                      <button 
                        onClick={() => handleDeleteProduct(p.id)}
                        style={{ padding: '8px 10px', background: '#fee2e2', border: '1px solid #fca5a5', color: '#dc2626', borderRadius: '10px', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', transition: 'all 0.2s ease' }}
                      >
                        🗑️ Retirer
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: ORDERS */}
      {activeTab === 'orders' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {orders.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', border: '1px dashed var(--border-gold)' }}>
              <span style={{ fontSize: '3rem', display: 'block', marginBottom: '14px' }}>📦</span>
              <h3 style={{ fontSize: '1.3rem', color: 'var(--text-white)', marginBottom: '8px' }}>Aucune commande en attente</h3>
              <p style={{ color: 'var(--text-gray)', fontSize: '0.9rem' }}>
                Vos commandes apparaîtront ici dès que les acheteurs valideront leur panier.
              </p>
            </div>
          ) : (
            orders.map(order => (
              <div key={order.id} style={{ background: 'var(--bg-card)', border: '1px solid var(--border-gold)', borderRadius: 'var(--radius-md)', padding: '22px', boxShadow: 'var(--shadow-card)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
                  <div>
                    <span style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--primary-gold)' }}>
                      Commande #{order.id}
                    </span>
                    <span style={{ color: 'var(--text-gray)', fontSize: '0.85rem', marginLeft: '12px' }}>
                      Client : <strong style={{ color: 'var(--text-white)' }}>{order.client_nom}</strong> ({order.client_telephone}) • {order.client_ville}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '0.84rem', color: 'var(--text-gray)' }}>Statut :</span>
                    <select 
                      value={order.statut} 
                      onChange={e => handleUpdateOrderStatus(order.id, e.target.value)}
                      style={{ padding: '6px 12px', background: 'var(--bg-surface)', border: '1px solid var(--border-gold)', color: 'var(--text-white)', borderRadius: '6px', fontSize: '0.84rem', outline: 'none' }}
                    >
                      <option value="Confirmed">Confirmée</option>
                      <option value="In Preparation">En préparation</option>
                      <option value="Shipped">Expédiée 🚚</option>
                      <option value="Delivered">Livrée ✓</option>
                      <option value="Cancelled">Annulée</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {(order.items || []).map((item, idx) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem', padding: '8px 12px', background: 'rgba(0,0,0,0.03)', borderRadius: '6px', border: '1px solid var(--border-subtle)' }}>
                      <span>{item.titre} (x{item.quantite})</span>
                      <strong style={{ color: 'var(--primary-gold)' }}>{(item.prix * item.quantite).toLocaleString()} DH</strong>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* TAB 3: ADD PRODUCT */}
      {activeTab === 'add-product' && (
        <div style={{ maxWidth: '820px', margin: '0 auto', background: 'var(--bg-card)', border: '1px solid var(--border-gold)', borderRadius: 'var(--radius-lg)', padding: '32px', boxShadow: 'var(--shadow-card)' }}>
          <h3 style={{ fontSize: '1.35rem', color: 'var(--primary-gold)', marginBottom: '20px', fontFamily: 'var(--font-serif)' }}>
            Ajouter un Nouveau Bijou ou Lancer une Enchère
          </h3>

          <form onSubmit={handleCreateProduct} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px' }}>
              <div>
                <label className="filter-label">Univers de Vente</label>
                <select 
                  value={newProduct.type_vente} 
                  onChange={e => setNewProduct({ ...newProduct, type_vente: e.target.value })}
                  className="filter-select-control"
                >
                  <option value="FIRST_HAND">✨ Première Main (Neuf)</option>
                  <option value="SECOND_HAND">♻️ Seconde Main (Occasion)</option>
                  <option value="AUCTION">🔨 Enchère en Direct (Vente aux Enchères)</option>
                </select>
              </div>

              <div>
                <label className="filter-label">Catégorie / Type de bijou</label>
                <select 
                  value={newProduct.category_id} 
                  onChange={e => setNewProduct({ ...newProduct, category_id: e.target.value })}
                  className="filter-select-control"
                >
                  {categories && categories.length > 0 ? (
                    categories.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.icon || '💎'} {c.nom_fr || c.nom_ar || c.nom}
                      </option>
                    ))
                  ) : (
                    <>
                      <option value="cat_rings">💍 Bagues</option>
                      <option value="cat_necklaces">📿 Colliers</option>
                      <option value="cat_bracelets">🔗 Bracelets</option>
                      <option value="cat_earrings">👂 Boucles d'oreilles</option>
                      <option value="cat_sets">💎 Parures</option>
                      <option value="cat_men">⌚ Bijoux Homme</option>
                      <option value="cat_boxes">🎁 Coffrets & Cadeaux</option>
                      <option value="cat_traditional">👑 Bijoux Traditionnels</option>
                      <option value="cat_artisanal">🏺 Bijoux Artisanaux</option>
                    </>
                  )}
                </select>
              </div>
            </div>

            {newProduct.type_vente === 'AUCTION' && (
              <div style={{ padding: '12px 16px', background: 'rgba(179, 135, 40, 0.08)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-gold)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '1.4rem' }}>🔨</span>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-dark)' }}>
                  <strong>Mode Vente aux Enchères activé :</strong> Les acheteurs pourront surenchérir en temps réel à partir de votre prix de départ avec un pas d'enchère minimal de 50 DH.
                </div>
              </div>
            )}

            <div>
              <label className="filter-label">Titre du bijou</label>
              <input 
                type="text" 
                required
                placeholder="Ex: Solitaire Or Blanc 18K & Diamant 0.50ct"
                value={newProduct.titre}
                onChange={e => setNewProduct({ ...newProduct, titre: e.target.value })}
                className="filter-select-control"
              />
            </div>

            <div>
              <label className="filter-label">Description & Spécifications</label>
              <textarea 
                rows="3"
                placeholder="Détails du bijou, poinçon d'État, certificat de gemmologie, histoire de la pièce..."
                value={newProduct.description}
                onChange={e => setNewProduct({ ...newProduct, description: e.target.value })}
                className="filter-select-control"
                style={{ resize: 'vertical' }}
              />
            </div>

            {newProduct.type_vente === 'AUCTION' ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px' }}>
                <div>
                  <label className="filter-label">Grammage (g) *</label>
                  <input 
                    type="number"
                    step="0.1"
                    placeholder="4.5"
                    value={newProduct.poids}
                    onChange={e => setNewProduct({ ...newProduct, poids: e.target.value })}
                    className="filter-select-control"
                    required
                  />
                </div>

                <div>
                  <label className="filter-label">Prix de Départ (DH) *</label>
                  <input 
                    type="number"
                    required
                    placeholder="Mise de départ (ex: 4500)"
                    value={newProduct.prix_depart || newProduct.prix}
                    onChange={e => setNewProduct({ ...newProduct, prix_depart: e.target.value, prix: e.target.value })}
                    className="filter-select-control"
                  />
                </div>

                <div>
                  <label className="filter-label">Durée de l'Enchère</label>
                  <select 
                    value={newProduct.duree_enchere || '48'}
                    onChange={e => setNewProduct({ ...newProduct, duree_enchere: e.target.value })}
                    className="filter-select-control"
                  >
                    <option value="24">⏱️ 24 Heures (Flash)</option>
                    <option value="48">⏱️ 48 Heures (Recommandé)</option>
                    <option value="72">⏱️ 72 Heures (3 Jours)</option>
                    <option value="168">⏱️ 7 Jours (Prestige)</option>
                  </select>
                </div>

                <div>
                  <label className="filter-label">Matière</label>
                  <select 
                    value={newProduct.matiere}
                    onChange={e => setNewProduct({ ...newProduct, matiere: e.target.value })}
                    className="filter-select-control"
                  >
                    <option value="Or">Or 18K (750‰)</option>
                    <option value="Argent">Argent 925</option>
                    <option value="Platine">Platine</option>
                    <option value="Diamant">Diamant</option>
                  </select>
                </div>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px' }}>
                <div>
                  <label className="filter-label">Grammage (g) *</label>
                  <input 
                    type="number"
                    step="0.1"
                    placeholder="4.5"
                    value={newProduct.poids}
                    onChange={e => setNewProduct({ ...newProduct, poids: e.target.value })}
                    className="filter-select-control"
                    required
                  />
                </div>

                <div>
                  <label className="filter-label">Prix de Vente (DH) *</label>
                  <input 
                    type="number"
                    required
                    placeholder="3890"
                    value={newProduct.prix}
                    onChange={e => setNewProduct({ ...newProduct, prix: e.target.value })}
                    className="filter-select-control"
                  />
                </div>

                <div>
                  <label className="filter-label">Matière</label>
                  <select 
                    value={newProduct.matiere}
                    onChange={e => setNewProduct({ ...newProduct, matiere: e.target.value })}
                    className="filter-select-control"
                  >
                    <option value="Or">Or 18K (750‰)</option>
                    <option value="Argent">Argent 925</option>
                    <option value="Platine">Platine</option>
                    <option value="Diamant">Diamant</option>
                  </select>
                </div>
              </div>
            )}

            {/* DÉTAIL DU GRAMMAGE POUR LES PARURES */}
            {newProduct.category_id === 'cat_sets' && (
              <div style={{ background: 'rgba(212, 175, 55, 0.05)', border: '1px dashed var(--border-gold)', borderRadius: 'var(--radius-sm)', padding: '16px' }}>
                <div style={{ fontSize: '0.86rem', fontWeight: 700, color: 'var(--primary-gold)', marginBottom: '4px' }}>
                  💎 Grammage par composant de la parure (Optionnel)
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-gray)', marginBottom: '12px' }}>
                  Enregistrez le poids individuel des éléments pour une transparence totale envers les acheteurs.
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px' }}>
                  <div>
                    <label className="filter-label" style={{ fontSize: '0.78rem' }}>Collier (g)</label>
                    <input
                      type="number"
                      step="0.1"
                      placeholder="Ex: 14.5"
                      value={newProduct.composants_poids?.collier || ''}
                      onChange={e => setNewProduct({
                        ...newProduct,
                        composants_poids: { ...newProduct.composants_poids, collier: e.target.value }
                      })}
                      className="filter-select-control"
                    />
                  </div>
                  <div>
                    <label className="filter-label" style={{ fontSize: '0.78rem' }}>Bracelet (g)</label>
                    <input
                      type="number"
                      step="0.1"
                      placeholder="Ex: 8.2"
                      value={newProduct.composants_poids?.bracelet || ''}
                      onChange={e => setNewProduct({
                        ...newProduct,
                        composants_poids: { ...newProduct.composants_poids, bracelet: e.target.value }
                      })}
                      className="filter-select-control"
                    />
                  </div>
                  <div>
                    <label className="filter-label" style={{ fontSize: '0.78rem' }}>Bague (g)</label>
                    <input
                      type="number"
                      step="0.1"
                      placeholder="Ex: 4.1"
                      value={newProduct.composants_poids?.bague || ''}
                      onChange={e => setNewProduct({
                        ...newProduct,
                        composants_poids: { ...newProduct.composants_poids, bague: e.target.value }
                      })}
                      className="filter-select-control"
                    />
                  </div>
                  <div>
                    <label className="filter-label" style={{ fontSize: '0.78rem' }}>Boucles (g)</label>
                    <input
                      type="number"
                      step="0.1"
                      placeholder="Ex: 5.0"
                      value={newProduct.composants_poids?.boucles || ''}
                      onChange={e => setNewProduct({
                        ...newProduct,
                        composants_poids: { ...newProduct.composants_poids, boucles: e.target.value }
                      })}
                      className="filter-select-control"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* REGROUPEMENT VILLE & LOCALISATION */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
              <div>
                <label className="filter-label">📍 Ville de l'Atelier / Boutique *</label>
                <select 
                  value={newProduct.city} 
                  onChange={e => setNewProduct({ ...newProduct, city: e.target.value })}
                  className="filter-select-control"
                >
                  <option value="Casablanca">Casablanca (الدار البيضاء)</option>
                  <option value="Rabat">Rabat (الرباط)</option>
                  <option value="Marrakech">Marrakech (مراكش)</option>
                  <option value="Fès">Fès (فاس)</option>
                  <option value="Tanger">Tanger (طنجة)</option>
                  <option value="Agadir">Agadir (أكادير)</option>
                  <option value="Meknès">Meknès (مكناس)</option>
                  <option value="Oujda">Oujda (وجدة)</option>
                  <option value="Tétouan">Tétouan (تطوان)</option>
                  <option value="Kenitra">Kénitra (القنيطرة)</option>
                  <option value="Essaouira">Essaouira (الصويرة)</option>
                  <option value="Autre">Autre Ville (مدينة أخرى)</option>
                </select>
              </div>

              <div>
                <label className="filter-label">🏢 Quartier / Emplacement</label>
                <input 
                  type="text"
                  placeholder="Ex: Kissariat El Korra, Maarif"
                  value={newProduct.adresse}
                  onChange={e => setNewProduct({ ...newProduct, adresse: e.target.value })}
                  className="filter-select-control"
                />
              </div>
            </div>

            <div>
              <label className="filter-label">URL de la photo principale</label>
              <input 
                type="url"
                required
                value={newProduct.images}
                onChange={e => setNewProduct({ ...newProduct, images: e.target.value })}
                className="filter-select-control"
              />
            </div>

            <button 
              type="submit" 
              disabled={isSubmitting} 
              className="btn-jewelia-primary" 
              style={{ marginTop: '10px' }}
            >
              {isSubmitting ? 'Publication en cours...' : '✨ Déposer & Publier le bijou'}
            </button>
          </form>
        </div>
      )}

      {/* TAB 4: HISTORIQUE DES VENTES & TRACABILITE */}
      {activeTab === 'sales-history' && (
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-gold)', borderRadius: 'var(--radius-lg)', padding: '28px', boxShadow: 'var(--shadow-card)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '22px' }}>
            <div>
              <div className="hero-pill-badge" style={{ background: 'rgba(212, 175, 55, 0.15)', borderColor: 'var(--primary-gold)', color: 'var(--primary-gold)', marginBottom: '8px' }}>
                📜 REGISTRE COMMERCIAL DES VENTES
              </div>
              <h3 style={{ fontSize: '1.4rem', color: 'var(--text-white)', fontFamily: 'var(--font-serif)', margin: 0 }}>
                Historique des Ventes & Transactions
              </h3>
              <p style={{ color: 'var(--text-gray)', fontSize: '0.88rem', margin: '4px 0 0' }}>
                Traçabilité des articles vendus. Conformément aux règles YAZ, les pièces vendues restent enregistrées ici pour l'historique vendeur.
              </p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-gray)', textTransform: 'uppercase' }}>Volume Vendu Total</span>
              <div style={{ fontSize: '1.6rem', color: 'var(--primary-gold)', fontWeight: 800 }}>
                {salesHistory.reduce((sum, s) => sum + (Number(s.prix_vente) || 0), 0).toLocaleString()} MAD
              </div>
            </div>
          </div>

          {salesHistory.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '50px 20px', background: 'var(--bg-surface)', borderRadius: 'var(--radius-md)', border: '1px dashed var(--border-gold)' }}>
              <span style={{ fontSize: '2.5rem', display: 'block', marginBottom: '10px' }}>📦</span>
              <h4 style={{ color: 'var(--text-white)', fontSize: '1.1rem', marginBottom: '6px' }}>Aucune vente enregistrée</h4>
              <p style={{ color: 'var(--text-gray)', fontSize: '0.88rem' }}>
                Lorsqu'un article est vendu ou marqué comme vendu, ses informations complètes (référence, prix, date et heure) sont archivées ici.
              </p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-gold)', textAlign: 'left', color: 'var(--text-gray)' }}>
                    <th style={{ padding: '12px 14px' }}>Réf. Article</th>
                    <th style={{ padding: '12px 14px' }}>Nom de l'article</th>
                    <th style={{ padding: '12px 14px' }}>Vendeur</th>
                    <th style={{ padding: '12px 14px' }}>Prix de Vente</th>
                    <th style={{ padding: '12px 14px' }}>Date & Heure</th>
                    <th style={{ padding: '12px 14px' }}>État</th>
                    <th style={{ padding: '12px 14px' }}>N° Transaction</th>
                  </tr>
                </thead>
                <tbody>
                  {salesHistory.map((s, idx) => (
                    <tr key={s.id || idx} style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-white)' }}>
                      <td style={{ padding: '12px 14px', fontFamily: 'monospace', color: 'var(--primary-gold)', fontWeight: 700 }}>
                        {s.reference || s.article_id || 'YAZ-ART'}
                      </td>
                      <td style={{ padding: '12px 14px', fontWeight: 600 }}>
                        {s.titre || s.article_nom}
                      </td>
                      <td style={{ padding: '12px 14px', color: 'var(--text-gray)' }}>
                        {s.vendeur_nom || 'Atelier YAZ'}
                      </td>
                      <td style={{ padding: '12px 14px', fontWeight: 800, color: 'var(--primary-gold)' }}>
                        {(Number(s.prix_vente) || 0).toLocaleString()} MAD
                      </td>
                      <td style={{ padding: '12px 14px', color: 'var(--text-gray)', fontSize: '0.82rem' }}>
                        {s.sold_at ? new Date(s.sold_at).toLocaleString('fr-FR') : 'Confirmé'}
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        <span style={{ padding: '3px 10px', borderRadius: '12px', background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', fontSize: '0.75rem', fontWeight: 800, border: '1px solid rgba(239, 68, 68, 0.3)' }}>
                          ✓ Vendu
                        </span>
                      </td>
                      <td style={{ padding: '12px 14px', fontFamily: 'monospace', color: 'var(--text-gray)', fontSize: '0.78rem' }}>
                        {s.transaction_id || `TRX-${s.id || idx}`}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}



      {/* TAB 5: AUTHENTIFICATION */}
      {activeTab === 'verifications' && (
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-gold)', borderRadius: 'var(--radius-lg)', padding: '30px', boxShadow: 'var(--shadow-card)' }}>
          <div className="hero-pill-badge" style={{ background: 'rgba(6, 182, 212, 0.15)', borderColor: '#06b6d4', color: '#0891b2' }}>
            🛡️ LABORATOIRE D'EXPERTISE & AUTHENTIFICATION
          </div>
          <h3 style={{ fontSize: '1.4rem', color: 'var(--text-white)', marginBottom: '10px' }}>
            Suivi des Vérifications de vos Pièces
          </h3>
          <p style={{ color: 'var(--text-gray)', fontSize: '0.9rem', marginBottom: '24px' }}>
            Chaque bijou d'occasion reçoit un certificat numérique inviolable après contrôle spectrométrique de pureté d'or et test des pierres.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {products.filter(p => p.type_vente === 'SECOND_HAND').map(p => (
              <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 20px', background: 'var(--bg-surface)', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                <div>
                  <strong style={{ color: 'var(--text-white)' }}>{p.titre}</strong>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-gray)', marginTop: '2px' }}>
                    État : {p.etat} • Année : {p.annee || '2015'} • Certificat : {p.certificat ? 'Fourni' : 'En attente'}
                  </div>
                </div>

                <span style={{ padding: '4px 12px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.15)', color: '#059669', fontWeight: 700, fontSize: '0.8rem', border: '1px solid #10b981' }}>
                  ✓ {p.authentifie || 'Vérifié'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
