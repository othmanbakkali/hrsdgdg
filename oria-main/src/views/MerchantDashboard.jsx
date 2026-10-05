import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../config/api';
import ProductCard from '../components/ProductCard';

export default function MerchantDashboard({ onOpenSellModal }) {
  const { t } = useLanguage();
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState('listings'); // 'listings', 'orders', 'add-product', 'subscription', 'verifications'
  const [stats, setStats] = useState({ totalSales: 0, totalCommission: 0, netEarnings: 0, itemsSold: 0 });
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [orders, setOrders] = useState([]);

  // Subscription state
  const [subscriptionData, setSubscriptionData] = useState(null);
  const [billingCycle, setBillingCycle] = useState('monthly'); // 'monthly' or 'annual'
  const [selectedPlanForUpgrade, setSelectedPlanForUpgrade] = useState(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [subscriptionFeedback, setSubscriptionFeedback] = useState(null);

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
    stock: '2',
    category_id: 'cat_rings',
    images: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=800&auto=format&fit=crop&q=80',
    facture: true,
    certificat: true,
    boite: true,
    garantie: true
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

      // Products
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

      // Subscription & Quotas
      const subRes = await fetch(`${API_URL}/merchants/${user.id}/subscription`);
      if (subRes.ok) {
        const subData = await subRes.json();
        setSubscriptionData(subData);
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

    // Check quota before submitting
    const quotaMax = subscriptionData?.metrics?.max_slots || 50;
    const currentCount = products.length;
    if (currentCount >= quotaMax) {
      alert(`⚠️ Quota atteint (${currentCount}/${quotaMax} bijoux). Veuillez mettre à niveau votre abonnement pour ajouter plus de bijoux.`);
      setActiveTab('subscription');
      return;
    }

    setIsSubmitting(true);
    try {
      const isAuction = newProduct.type_vente === 'AUCTION';
      const payload = {
        ...newProduct,
        prix: parseFloat(effectivePrice),
        ancien_prix: newProduct.ancien_prix ? parseFloat(newProduct.ancien_prix) : null,
        poids: parseFloat(newProduct.poids || 3),
        gramme: parseFloat(newProduct.poids || 3),
        type_vente: isAuction ? 'SECOND_HAND' : newProduct.type_vente,
        disponibilite: isAuction ? 'enchere' : 'disponible',
        stock: parseInt(newProduct.stock || 1),
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
        if (errData.error === 'QUOTA_EXCEEDED') {
          alert(`⚠️ ${errData.message}`);
          setActiveTab('subscription');
        } else {
          alert(errData.message || 'Erreur lors de la publication du bijou.');
        }
        setIsSubmitting(false);
      }
    } catch (err) {
      console.error(err);
      setIsSubmitting(false);
    }
  };

  const handleSubscribePlan = async (plan) => {
    if (!user) return;
    setIsSubscribing(true);
    try {
      const res = await fetch(`${API_URL}/merchants/${user.id}/subscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan_id: plan.id,
          billing_cycle: billingCycle
        })
      });

      if (res.ok) {
        const data = await res.json();
        setSubscriptionFeedback({
          type: 'success',
          message: data.message || `Félicitations ! Votre abonnement au ${plan.name} est activé.`
        });
        fetchMerchantData();
        setShowUpgradeModal(false);
        setTimeout(() => setSubscriptionFeedback(null), 5000);
      } else {
        const errorData = await res.json();
        setSubscriptionFeedback({
          type: 'error',
          message: errorData.message || 'Une erreur est survenue lors de la souscription.'
        });
      }
    } catch (err) {
      console.error(err);
      setSubscriptionFeedback({
        type: 'error',
        message: 'Erreur de connexion au serveur.'
      });
    } finally {
      setIsSubscribing(false);
    }
  };

  const handleCancelAutoRenew = async () => {
    if (!confirm('Désactiver le renouvellement automatique de votre forfait ?')) return;
    try {
      const res = await fetch(`${API_URL}/merchants/${user.id}/cancel-subscription`, {
        method: 'POST'
      });
      if (res.ok) {
        fetchMerchantData();
        alert('Renouvellement automatique désactivé.');
      }
    } catch (err) {
      console.error(err);
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

            {/* Current Subscription Badge in Header */}
            <span 
              onClick={() => setActiveTab('subscription')}
              style={{
                padding: '4px 14px',
                borderRadius: 'var(--radius-full)',
                background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.18) 0%, rgba(179, 135, 40, 0.28) 100%)',
                color: 'var(--primary-gold)',
                fontSize: '0.8rem',
                fontWeight: 800,
                border: '1px solid var(--border-gold)',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px'
              }}
              title="Cliquer pour gérer votre forfait"
            >
              <span>👑 {currentPlan.name || 'Pass Essentiel'}</span>
              <span style={{ opacity: 0.8, fontSize: '0.75rem' }}>({metrics.used_slots}/{metrics.max_slots > 1000 ? '∞' : metrics.max_slots} bijoux)</span>
            </span>
          </div>
          <p style={{ color: 'var(--text-gray)', fontSize: '0.9rem' }}>
            Espace Vendeur Professionnel • Gestion du catalogue, commandes clients et forfait d'abonnement
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button 
            onClick={() => setActiveTab('subscription')}
            className="btn-jewelia-secondary"
            style={{ padding: '10px 20px', fontSize: '0.88rem' }}
          >
            🌟 Mon Forfait & Quota
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
            {stats.totalSales?.toLocaleString()} DH
          </h3>
          <span style={{ fontSize: '0.75rem', color: 'var(--success-green)', fontWeight: 600 }}>+14% de croissance</span>
        </div>

        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-gold)', borderRadius: 'var(--radius-md)', padding: '20px', boxShadow: 'var(--shadow-card)' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-gray)', textTransform: 'uppercase', letterSpacing: '1px' }}>Revenus Nets Vendeur</span>
          <h3 style={{ fontSize: '1.75rem', color: 'var(--text-white)', fontFamily: 'var(--font-serif)', marginTop: '4px' }}>
            {stats.netEarnings?.toLocaleString()} DH
          </h3>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-gray)' }}>Taux commission : <strong style={{ color: 'var(--primary-gold)' }}>{metrics.commission_rate}%</strong></span>
        </div>

        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-gold)', borderRadius: 'var(--radius-md)', padding: '20px', boxShadow: 'var(--shadow-card)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-gray)', textTransform: 'uppercase', letterSpacing: '1px' }}>Quota Catalogue</span>
            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--primary-gold)' }}>{metrics.used_slots} / {metrics.max_slots > 1000 ? 'Illimité' : metrics.max_slots}</span>
          </div>
          <h3 style={{ fontSize: '1.75rem', color: 'var(--primary-gold)', fontFamily: 'var(--font-serif)', marginTop: '4px' }}>
            {metrics.remaining_slots > 1000 ? '∞' : metrics.remaining_slots} <span style={{ fontSize: '0.9rem', color: 'var(--text-gray)', fontFamily: 'var(--font-sans)' }}>places libres</span>
          </h3>
          {/* Progress bar */}
          <div style={{ width: '100%', height: '6px', background: 'rgba(0,0,0,0.08)', borderRadius: '4px', overflow: 'hidden', marginTop: '6px' }}>
            <div style={{ width: `${metrics.usage_percentage}%`, height: '100%', background: 'linear-gradient(90deg, var(--primary-gold), #10b981)', borderRadius: '4px' }} />
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
          { id: 'subscription', label: '🌟 Mon Abonnement & Forfaits', count: null, highlight: true },
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
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '22px' }}>
              {products.map(p => (
                <div key={p.id} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <ProductCard product={p} />
                  <button 
                    onClick={() => handleDeleteProduct(p.id)}
                    style={{ padding: '8px 12px', background: '#fee2e2', border: '1px solid #fca5a5', color: '#dc2626', borderRadius: '10px', fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', transition: 'all 0.2s ease' }}
                  >
                    🗑️ Retirer de la vitrine
                  </button>
                </div>
              ))}
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
          {/* Quota Check Banner */}
          {metrics.used_slots >= metrics.max_slots ? (
            <div style={{
              background: 'linear-gradient(135deg, rgba(239,68,68,0.1) 0%, rgba(212,175,55,0.15) 100%)',
              border: '1px solid #ef4444',
              borderRadius: 'var(--radius-md)',
              padding: '24px',
              textAlign: 'center',
              marginBottom: '24px'
            }}>
              <span style={{ fontSize: '2.5rem', display: 'block', marginBottom: '8px' }}>⚠️</span>
              <h3 style={{ fontSize: '1.3rem', color: '#dc2626', marginBottom: '8px' }}>
                Quota de dépôt atteint ({metrics.used_slots}/{metrics.max_slots} bijoux)
              </h3>
              <p style={{ color: 'var(--text-gray)', fontSize: '0.92rem', maxWidth: '560px', margin: '0 auto 18px' }}>
                Votre forfait actuel <strong>{currentPlan.name}</strong> a atteint sa limite maximale. Mettez à niveau votre abonnement pour continuer à déposer de nouveaux bijoux et réduire vos commissions.
              </p>
              <button 
                onClick={() => setActiveTab('subscription')} 
                className="btn-jewelia-primary"
                style={{ padding: '12px 28px' }}
              >
                🚀 Mettre à niveau mon abonnement
              </button>
            </div>
          ) : (
            <div style={{
              background: 'rgba(179, 135, 40, 0.08)',
              border: '1px solid var(--border-gold)',
              borderRadius: 'var(--radius-md)',
              padding: '12px 18px',
              marginBottom: '24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.88rem', color: 'var(--text-white)' }}>
                <span>✨</span>
                <span>Forfait <strong>{currentPlan.name}</strong> : il vous reste <strong style={{ color: 'var(--primary-gold)' }}>{metrics.remaining_slots} dépôts</strong> disponibles.</span>
              </div>
              <button 
                onClick={() => setActiveTab('subscription')}
                style={{ background: 'none', border: 'none', color: 'var(--primary-gold)', fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer', textDecoration: 'underline' }}
              >
                Changer de forfait →
              </button>
            </div>
          )}

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
                  <label className="filter-label">Poids (g) *</label>
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
                  <label className="filter-label">Poids (g) *</label>
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
              disabled={isSubmitting || metrics.used_slots >= metrics.max_slots} 
              className="btn-jewelia-primary" 
              style={{ marginTop: '10px', opacity: (metrics.used_slots >= metrics.max_slots) ? 0.6 : 1 }}
            >
              {isSubmitting ? 'Publication en cours...' : '✨ Déposer & Publier le bijou'}
            </button>
          </form>
        </div>
      )}

      {/* TAB 4: SUBSCRIPTIONS & PLANS MANAGEMENT */}
      {activeTab === 'subscription' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '36px' }}>
          {/* Active Plan Overview Card */}
          <div style={{
            background: 'linear-gradient(135deg, var(--bg-surface) 0%, var(--bg-surface-elevated) 100%)',
            border: '2px solid var(--border-gold)',
            borderRadius: 'var(--radius-lg)',
            padding: '32px',
            boxShadow: 'var(--shadow-card-hover)',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '20px', marginBottom: '24px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                  <span style={{ fontSize: '1.8rem' }}>👑</span>
                  <h3 style={{ fontSize: '1.6rem', color: 'var(--text-white)', fontFamily: 'var(--font-serif)' }}>
                    {subscriptionData?.subscription?.plan_name || 'Pass Essentiel'}
                  </h3>
                  <span style={{
                    padding: '3px 10px',
                    borderRadius: '12px',
                    background: 'rgba(16, 185, 129, 0.15)',
                    color: '#059669',
                    fontSize: '0.78rem',
                    fontWeight: 800,
                    border: '1px solid rgba(16, 185, 129, 0.3)'
                  }}>
                    ● ACTIF
                  </span>
                </div>
                <p style={{ color: 'var(--text-gray)', fontSize: '0.9rem' }}>
                  Cycle : <strong style={{ color: 'var(--text-white)' }}>{subscriptionData?.subscription?.billing_cycle === 'annual' ? 'Facturation Annuelle' : 'Facturation Mensuelle'}</strong> • Renouvellement : <strong style={{ color: 'var(--text-white)' }}>{subscriptionData?.subscription?.end_date ? new Date(subscriptionData.subscription.end_date).toLocaleDateString('fr-FR') : 'Automatique'}</strong>
                </p>
              </div>

              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-gray)', display: 'block', textTransform: 'uppercase' }}>Commission Vendeur</span>
                  <strong style={{ fontSize: '1.4rem', color: 'var(--primary-gold)' }}>{metrics.commission_rate}%</strong>
                </div>
                {subscriptionData?.subscription?.auto_renew && (
                  <button 
                    onClick={handleCancelAutoRenew}
                    style={{ padding: '8px 14px', background: 'none', border: '1px solid var(--border-subtle)', borderRadius: '6px', color: 'var(--text-gray)', fontSize: '0.78rem', cursor: 'pointer' }}
                  >
                    Désactiver auto-renouvellement
                  </button>
                )}
              </div>
            </div>

            {/* Quota meter gauge */}
            <div style={{ background: 'rgba(0,0,0,0.03)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-white)' }}>
                  Consommation de votre quota de dépôt
                </span>
                <span style={{ fontSize: '0.88rem', fontWeight: 800, color: 'var(--primary-gold)' }}>
                  {metrics.used_slots} / {metrics.max_slots > 1000 ? 'Illimité' : metrics.max_slots} bijoux ({metrics.usage_percentage}%)
                </span>
              </div>
              <div style={{ width: '100%', height: '10px', background: 'rgba(0,0,0,0.08)', borderRadius: '6px', overflow: 'hidden' }}>
                <div style={{
                  width: `${metrics.usage_percentage}%`,
                  height: '100%',
                  background: metrics.usage_percentage > 90 ? 'linear-gradient(90deg, #f59e0b, #ef4444)' : 'linear-gradient(90deg, #b38728, #10b981)',
                  borderRadius: '6px',
                  transition: 'width 0.5s ease'
                }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', fontSize: '0.8rem', color: 'var(--text-gray)' }}>
                <span>{metrics.used_slots} bijoux en ligne</span>
                <span>{metrics.remaining_slots > 1000 ? 'Emplacements illimités' : `${metrics.remaining_slots} dépôts restants`}</span>
              </div>
            </div>
          </div>

          {/* Pricing Plans Selection Grid */}
          <div>
            <div style={{ textAlign: 'center', marginBottom: '32px' }}>
              <span className="hero-pill-badge" style={{ marginBottom: '10px' }}>
                FORFAITS JOAILLIERS & COMMERÇANTS
              </span>
              <h2 style={{ fontSize: '2rem', color: 'var(--text-white)', fontFamily: 'var(--font-serif)', marginBottom: '8px' }}>
                Choisissez la Formule Adaptée à votre Maison
              </h2>
              <p style={{ color: 'var(--text-gray)', fontSize: '0.95rem', maxWidth: '600px', margin: '0 auto 20px' }}>
                Déposez davantage de bijoux, réduisez vos commissions et bénéficiez de services de conciergerie VIP exclusifs.
              </p>

              {/* Monthly / Annual Toggle Switch */}
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                background: 'var(--bg-card)',
                border: '1px solid var(--border-gold)',
                borderRadius: 'var(--radius-full)',
                padding: '4px',
                gap: '4px',
                boxShadow: 'var(--shadow-card)'
              }}>
                <button
                  onClick={() => setBillingCycle('monthly')}
                  style={{
                    padding: '8px 20px',
                    borderRadius: 'var(--radius-full)',
                    border: 'none',
                    background: billingCycle === 'monthly' ? 'var(--primary-gold)' : 'transparent',
                    color: billingCycle === 'monthly' ? '#fff' : 'var(--text-gray)',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  Facturation Mensuelle
                </button>
                <button
                  onClick={() => setBillingCycle('annual')}
                  style={{
                    padding: '8px 20px',
                    borderRadius: 'var(--radius-full)',
                    border: 'none',
                    background: billingCycle === 'annual' ? 'var(--primary-gold)' : 'transparent',
                    color: billingCycle === 'annual' ? '#fff' : 'var(--text-gray)',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <span>Facturation Annuelle</span>
                  <span style={{ padding: '2px 6px', background: '#10b981', color: '#fff', borderRadius: '8px', fontSize: '0.7rem', fontWeight: 800 }}>-20%</span>
                </button>
              </div>
            </div>

            {/* Plans Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '26px' }}>
              {availablePlans.map(plan => {
                const isCurrent = subscriptionData?.subscription?.plan_id === plan.id;
                const price = billingCycle === 'annual' ? plan.price_annual : plan.price_monthly;
                const perMonth = billingCycle === 'annual' ? Math.round(plan.price_annual / 12) : plan.price_monthly;

                return (
                  <div
                    key={plan.id}
                    style={{
                      background: 'var(--bg-card)',
                      border: isCurrent ? '2px solid var(--primary-gold)' : (plan.popular ? '2px solid var(--primary-gold)' : '1px solid var(--border-gold)'),
                      borderRadius: 'var(--radius-lg)',
                      padding: '32px 28px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      position: 'relative',
                      boxShadow: isCurrent || plan.popular ? 'var(--shadow-card-hover)' : 'var(--shadow-card)',
                      transform: plan.popular ? 'scale(1.02)' : 'none'
                    }}
                  >
                    {plan.popular && (
                      <div style={{
                        position: 'absolute',
                        top: '-12px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        background: 'linear-gradient(135deg, #d4af37, #996515)',
                        color: '#fff',
                        padding: '4px 16px',
                        borderRadius: 'var(--radius-full)',
                        fontSize: '0.72rem',
                        fontWeight: 800,
                        letterSpacing: '1px',
                        boxShadow: '0 4px 12px rgba(212, 175, 55, 0.4)'
                      }}>
                        ⭐ PLUS POPULAIRE
                      </div>
                    )}

                    {isCurrent && (
                      <div style={{
                        position: 'absolute',
                        top: '16px',
                        right: '16px',
                        background: 'rgba(16, 185, 129, 0.15)',
                        color: '#059669',
                        padding: '3px 10px',
                        borderRadius: '12px',
                        fontSize: '0.75rem',
                        fontWeight: 800,
                        border: '1px solid #10b981'
                      }}>
                        ✓ Votre Forfait
                      </div>
                    )}

                    <div>
                      <h3 style={{ fontSize: '1.4rem', color: 'var(--text-white)', fontFamily: 'var(--font-serif)', marginBottom: '4px' }}>
                        {plan.name}
                      </h3>
                      <p style={{ color: 'var(--text-gray)', fontSize: '0.85rem', minHeight: '38px', marginBottom: '20px' }}>
                        {plan.tagline}
                      </p>

                      <div style={{ marginBottom: '24px', paddingBottom: '20px', borderBottom: '1px solid var(--border-subtle)' }}>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                          <span style={{ fontSize: '2.4rem', fontWeight: 800, color: 'var(--primary-gold)', fontFamily: 'var(--font-serif)' }}>
                            {perMonth.toLocaleString()}
                          </span>
                          <span style={{ fontSize: '1rem', color: 'var(--text-white)', fontWeight: 700 }}>DH</span>
                          <span style={{ color: 'var(--text-gray)', fontSize: '0.82rem' }}>/ mois</span>
                        </div>
                        {billingCycle === 'annual' && plan.price_annual > 0 && (
                          <span style={{ fontSize: '0.78rem', color: '#059669', fontWeight: 600 }}>
                            Facturé {plan.price_annual.toLocaleString()} DH / an (-20% inclus)
                          </span>
                        )}
                        {plan.price_monthly === 0 && (
                          <span style={{ fontSize: '0.78rem', color: 'var(--text-gray)' }}>
                            Sans engagement ni frais récurrents
                          </span>
                        )}
                      </div>

                      {/* Key specs highlight */}
                      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                        <div style={{ flex: 1, background: 'rgba(179, 135, 40, 0.06)', padding: '8px 10px', borderRadius: '8px', border: '1px solid var(--border-subtle)', textAlign: 'center' }}>
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-gray)', display: 'block', textTransform: 'uppercase' }}>Dépôts Max</span>
                          <strong style={{ fontSize: '0.95rem', color: 'var(--primary-gold)' }}>
                            {plan.max_products > 1000 ? 'Illimités' : `${plan.max_products} bijoux`}
                          </strong>
                        </div>
                        <div style={{ flex: 1, background: 'rgba(179, 135, 40, 0.06)', padding: '8px 10px', borderRadius: '8px', border: '1px solid var(--border-subtle)', textAlign: 'center' }}>
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-gray)', display: 'block', textTransform: 'uppercase' }}>Commission</span>
                          <strong style={{ fontSize: '0.95rem', color: 'var(--primary-gold)' }}>
                            {plan.commission_rate}%
                          </strong>
                        </div>
                      </div>

                      {/* Features checklist */}
                      <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 24px 0', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {plan.features.map((feat, idx) => (
                          <li key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '0.86rem', color: 'var(--text-light-gray)' }}>
                            <span style={{ color: '#059669', fontWeight: 'bold' }}>✓</span>
                            <span>{feat}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <button
                      disabled={isCurrent || isSubscribing}
                      onClick={() => {
                        setSelectedPlanForUpgrade(plan);
                        setShowUpgradeModal(true);
                      }}
                      className={isCurrent ? 'btn-jewelia-secondary' : 'btn-jewelia-primary'}
                      style={{
                        width: '100%',
                        padding: '12px',
                        fontSize: '0.9rem',
                        cursor: isCurrent ? 'default' : 'pointer',
                        opacity: isCurrent ? 0.7 : 1
                      }}
                    >
                      {isCurrent ? 'Forfait Actif' : `Choisir ${plan.name}`}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Invoices & Billing History */}
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-gold)', borderRadius: 'var(--radius-lg)', padding: '28px', boxShadow: 'var(--shadow-card)' }}>
            <h3 style={{ fontSize: '1.25rem', color: 'var(--text-white)', fontFamily: 'var(--font-serif)', marginBottom: '16px' }}>
              📜 Historique des Factures & Reçus d'Abonnement
            </h3>

            {(subscriptionData?.invoices || []).length === 0 ? (
              <p style={{ color: 'var(--text-gray)', fontSize: '0.88rem' }}>Aucune facture enregistrée.</p>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-gold)', textAlign: 'left', color: 'var(--text-gray)' }}>
                      <th style={{ padding: '10px 14px' }}>N° Facture</th>
                      <th style={{ padding: '10px 14px' }}>Date</th>
                      <th style={{ padding: '10px 14px' }}>Forfait</th>
                      <th style={{ padding: '10px 14px' }}>Cycle</th>
                      <th style={{ padding: '10px 14px' }}>Montant</th>
                      <th style={{ padding: '10px 14px' }}>Statut</th>
                      <th style={{ padding: '10px 14px' }}>Reçu</th>
                    </tr>
                  </thead>
                  <tbody>
                    {subscriptionData.invoices.map(inv => (
                      <tr key={inv.id} style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-white)' }}>
                        <td style={{ padding: '12px 14px', fontWeight: 700 }}>{inv.invoice_number}</td>
                        <td style={{ padding: '12px 14px', color: 'var(--text-gray)' }}>{new Date(inv.date).toLocaleDateString('fr-FR')}</td>
                        <td style={{ padding: '12px 14px', color: 'var(--primary-gold)', fontWeight: 600 }}>{inv.plan_name}</td>
                        <td style={{ padding: '12px 14px' }}>{inv.billing_cycle === 'annual' ? 'Annuel' : 'Mensuel'}</td>
                        <td style={{ padding: '12px 14px', fontWeight: 700 }}>{inv.amount?.toLocaleString()} DH</td>
                        <td style={{ padding: '12px 14px' }}>
                          <span style={{ padding: '2px 8px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.15)', color: '#059669', fontSize: '0.75rem', fontWeight: 700 }}>
                            {inv.status}
                          </span>
                        </td>
                        <td style={{ padding: '12px 14px' }}>
                          <button
                            onClick={() => setSelectedInvoice(inv)}
                            style={{ padding: '4px 10px', background: 'none', border: '1px solid var(--border-gold)', borderRadius: '4px', color: 'var(--primary-gold)', fontSize: '0.78rem', cursor: 'pointer', fontWeight: 600 }}
                          >
                            📄 Voir Reçu
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
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

      {/* UPGRADE CONFIRMATION MODAL */}
      {showUpgradeModal && selectedPlanForUpgrade && (
        <div className="jewelia-modal-backdrop" onClick={() => setShowUpgradeModal(false)}>
          <div className="jewelia-modal-content" style={{ maxWidth: '540px', padding: '32px' }} onClick={e => e.stopPropagation()}>
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <span style={{ fontSize: '2.5rem', display: 'block', marginBottom: '6px' }}>👑</span>
              <h3 style={{ fontSize: '1.5rem', color: 'var(--text-white)', fontFamily: 'var(--font-serif)' }}>
                Confirmer votre Abonnement
              </h3>
              <p style={{ color: 'var(--text-gray)', fontSize: '0.9rem' }}>
                Vous allez souscrire au <strong>{selectedPlanForUpgrade.name}</strong>
              </p>
            </div>

            <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-gold)', borderRadius: 'var(--radius-md)', padding: '18px', marginBottom: '22px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.9rem' }}>
                <span style={{ color: 'var(--text-gray)' }}>Formule :</span>
                <strong style={{ color: 'var(--text-white)' }}>{selectedPlanForUpgrade.name}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.9rem' }}>
                <span style={{ color: 'var(--text-gray)' }}>Périodicité :</span>
                <strong style={{ color: 'var(--text-white)' }}>{billingCycle === 'annual' ? 'Annuelle (-20%)' : 'Mensuelle'}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.9rem' }}>
                <span style={{ color: 'var(--text-gray)' }}>Limite de bijoux :</span>
                <strong style={{ color: 'var(--primary-gold)' }}>{selectedPlanForUpgrade.max_products > 1000 ? 'Illimités' : `${selectedPlanForUpgrade.max_products} pièces`}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.9rem' }}>
                <span style={{ color: 'var(--text-gray)' }}>Taux de commission :</span>
                <strong style={{ color: '#059669' }}>{selectedPlanForUpgrade.commission_rate}%</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '10px', borderTop: '1px solid var(--border-subtle)', fontSize: '1.1rem' }}>
                <span>Montant à régler :</span>
                <strong style={{ color: 'var(--primary-gold)' }}>
                  {(billingCycle === 'annual' ? selectedPlanForUpgrade.price_annual : selectedPlanForUpgrade.price_monthly).toLocaleString()} DH
                </strong>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button 
                onClick={() => setShowUpgradeModal(false)}
                className="btn-jewelia-secondary" 
                style={{ flex: 1, padding: '10px' }}
              >
                Annuler
              </button>
              <button 
                disabled={isSubscribing}
                onClick={() => handleSubscribePlan(selectedPlanForUpgrade)}
                className="btn-jewelia-primary" 
                style={{ flex: 1, padding: '10px' }}
              >
                {isSubscribing ? 'Activation...' : 'Valider & Activer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* INVOICE DETAIL RECEIPT MODAL */}
      {selectedInvoice && (
        <div className="jewelia-modal-backdrop" onClick={() => setSelectedInvoice(null)}>
          <div className="jewelia-modal-content" style={{ maxWidth: '520px', padding: '36px' }} onClick={e => e.stopPropagation()}>
            <div style={{ borderBottom: '2px solid var(--border-gold)', paddingBottom: '16px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ fontSize: '1.4rem', color: 'var(--primary-gold)', fontFamily: 'var(--font-serif)' }}>HRSDGDG JEWELIA</h3>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-gray)' }}>Facture Pro Forma Marchand</span>
              </div>
              <span style={{ fontWeight: 800, color: 'var(--text-white)' }}>{selectedInvoice.invoice_number}</span>
            </div>

            <div style={{ fontSize: '0.88rem', display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-gray)' }}>Boutique :</span>
                <strong>{selectedInvoice.merchant_name}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-gray)' }}>Date d'émission :</span>
                <span>{new Date(selectedInvoice.date).toLocaleDateString('fr-FR')}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-gray)' }}>Prestation :</span>
                <strong style={{ color: 'var(--primary-gold)' }}>Abonnement {selectedInvoice.plan_name}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-gray)' }}>Cycle :</span>
                <span>{selectedInvoice.billing_cycle === 'annual' ? 'Annuel' : 'Mensuel'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-gray)' }}>État du paiement :</span>
                <span style={{ color: '#059669', fontWeight: 800 }}>✓ {selectedInvoice.status}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '10px', borderTop: '1px solid var(--border-subtle)', fontSize: '1.15rem' }}>
                <span>Total Net Payé :</span>
                <strong style={{ color: 'var(--primary-gold)' }}>{selectedInvoice.amount?.toLocaleString()} DH</strong>
              </div>
            </div>

            <button 
              onClick={() => setSelectedInvoice(null)}
              className="btn-jewelia-primary"
              style={{ width: '100%', padding: '10px' }}
            >
              Fermer le Reçu
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
