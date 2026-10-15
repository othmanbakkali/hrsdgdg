import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../config/api';
import ProductCard from '../components/ProductCard';

export default function ClientDashboard({ onSelectProduct, onOpenSellModal }) {
  const { t } = useLanguage();
  const { user } = useAuth();
  
  const [activeTab, setActiveTab] = useState('orders'); // 'orders', 'my-listings', 'favorites', 'messages'
  const [orders, setOrders] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [myListings, setMyListings] = useState([]);
  
  // Messaging
  const [merchants, setMerchants] = useState([]);
  const [selectedMerchantId, setSelectedMerchantId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessageText, setNewMessageText] = useState('');

  const fetchClientData = async () => {
    if (!user) return;
    try {
      // 1. Orders
      const ordRes = await fetch(`${API_URL}/commandes?client_id=${user.id}`);
      const ordData = await ordRes.json();
      setOrders(ordData);

      // 2. All active products for Favorites & My listings
      const prodRes = await fetch(`${API_URL}/bijoux`);
      const allProds = await prodRes.json();
      
      setFavorites(allProds.filter(b => user.favoris && user.favoris.includes(b.id)));
      setMyListings(allProds.filter(b => b.commercant_id === user.id || (user.email && b.commercant_id === 'u_particulier1')));

      // 3. Messages
      const msgRes = await fetch(`${API_URL}/messages?user1=${user.id}`);
      const msgData = await msgRes.json();
      
      const uniqueMerchantIds = [...new Set(msgData.map(m => m.sender_id === user.id ? m.receiver_id : m.sender_id))];
      const listMerchants = [
        { id: 'u_merchant1', shopName: 'Maison Royale Casablanca' },
        { id: 'u_merchant2', shopName: 'Héritage & Joyaux d\'Époque' },
        { id: 'u_merchant3', shopName: 'Marrakech Diamonds Co.' }
      ].filter(m => uniqueMerchantIds.includes(m.id));
      
      setMerchants(listMerchants);
      if (listMerchants.length > 0 && !selectedMerchantId) {
        setSelectedMerchantId(listMerchants[0].id);
      }
    } catch (error) {
      console.error('Error fetching client dashboard data:', error);
    }
  };

  const fetchChatMessages = async () => {
    if (!user || !selectedMerchantId) return;
    try {
      const res = await fetch(`${API_URL}/messages?user1=${user.id}&user2=${selectedMerchantId}`);
      const data = await res.json();
      setMessages(data);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  useEffect(() => {
    fetchClientData();
    const interval = setInterval(fetchClientData, 5000);
    return () => clearInterval(interval);
  }, [user]);

  useEffect(() => {
    fetchChatMessages();
  }, [selectedMerchantId]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessageText.trim() || !selectedMerchantId) return;

    try {
      const res = await fetch(`${API_URL}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sender_id: user.id,
          receiver_id: selectedMerchantId,
          content: newMessageText
        })
      });
      if (res.ok) {
        const msg = await res.json();
        setMessages([...messages, msg]);
        setNewMessageText('');
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '24px 16px 80px' }}>
      {/* Header Profile Info */}
      <div style={{ 
        background: 'var(--bg-card)', 
        border: '1px solid var(--border-gold)', 
        borderRadius: 'var(--radius-lg)', 
        padding: '20px', 
        marginBottom: '24px', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        flexWrap: 'wrap', 
        gap: '16px',
        boxShadow: 'var(--shadow-card)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ 
            width: '56px', 
            height: '56px', 
            borderRadius: '50%', 
            background: 'var(--gold-gradient-btn)', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            fontSize: '1.6rem', 
            color: '#ffffff', 
            fontWeight: 800,
            flexShrink: 0
          }}>
            {user?.nom ? user.nom[0].toUpperCase() : 'U'}
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <h2 style={{ fontSize: '1.3rem', color: 'var(--text-dark)' }}>{user?.nom || 'Client JEWELIA'}</h2>
              <span style={{ 
                padding: '2px 8px', 
                borderRadius: 'var(--radius-full)', 
                background: 'var(--first-hand-bg)', 
                color: 'var(--primary-gold)', 
                fontSize: '0.72rem', 
                fontWeight: 700, 
                border: '1px solid var(--border-gold)' 
              }}>
                Membre Privé
              </span>
            </div>
            <p style={{ color: 'var(--text-gray)', fontSize: '0.82rem' }}>{user?.email} • {user?.telephone || '+212 661-000000'}</p>
          </div>
        </div>

        <button 
          onClick={onOpenSellModal}
          className="btn-jewelia-primary"
          style={{ padding: '10px 18px', fontSize: '0.85rem' }}
        >
          ♻️ Déposer une annonce Seconde Main
        </button>
      </div>

      {/* Tabs */}
      <div style={{ 
        display: 'flex', 
        gap: '8px', 
        borderBottom: '1px solid var(--border-gold)', 
        marginBottom: '24px', 
        overflowX: 'auto', 
        paddingBottom: '4px',
        WebkitOverflowScrolling: 'touch'
      }}>
        {[
          { id: 'orders', label: '📦 Mes Commandes', count: orders.length },
          { id: 'my-listings', label: '♻️ Mes Annonces', count: myListings.length },
          { id: 'favorites', label: '❤️ Mes Favoris', count: favorites.length },
          { id: 'messages', label: '💬 Messages', count: messages.length }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '10px 16px',
              background: activeTab === tab.id ? 'rgba(179, 135, 40, 0.12)' : 'transparent',
              border: 'none',
              borderBottom: activeTab === tab.id ? '2.5px solid var(--primary-gold)' : '2.5px solid transparent',
              borderRadius: '8px 8px 0 0',
              color: activeTab === tab.id ? 'var(--primary-gold)' : 'var(--text-gray)',
              fontWeight: activeTab === tab.id ? 800 : 600,
              fontSize: '0.88rem',
              cursor: 'pointer',
              whiteSpace: 'nowrap'
            }}
          >
            {tab.label} ({tab.count})
          </button>
        ))}
      </div>

      {/* TAB 1: MES COMMANDES & SUIVI */}
      {activeTab === 'orders' && (
        <div>
          {orders.length === 0 ? (
            <div style={{ padding: '48px 20px', textAlign: 'center', background: 'var(--bg-card)', border: '1px solid var(--border-gold)', borderRadius: 'var(--radius-md)' }}>
              <span style={{ fontSize: '2.5rem', display: 'block', marginBottom: '12px' }}>📦</span>
              <p style={{ color: 'var(--text-gray)' }}>Vous n'avez pas encore passé de commande sur JEWELIA.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {orders.map(order => (
                <div 
                  key={order.id}
                  style={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-gold)',
                    borderRadius: 'var(--radius-md)',
                    padding: '18px',
                    boxShadow: 'var(--shadow-card)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '12px', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
                    <div>
                      <span style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--primary-gold)', fontFamily: 'var(--font-serif)' }}>
                        Commande #{order.id}
                      </span>
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-gray)', marginLeft: '10px' }}>
                        Passée le {new Date(order.date_commande || Date.now()).toLocaleDateString('fr-FR')}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span 
                        style={{
                          padding: '3px 10px',
                          borderRadius: 'var(--radius-full)',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          background: order.statut === 'Delivered' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(179, 135, 40, 0.15)',
                          color: order.statut === 'Delivered' ? '#059669' : 'var(--primary-gold)',
                          border: `1px solid ${order.statut === 'Delivered' ? '#10b981' : 'var(--border-gold)'}`
                        }}
                      >
                        ● {order.statut === 'Confirmed' ? 'Confirmée' : order.statut === 'In Preparation' ? 'En préparation' : order.statut === 'Shipped' ? 'Expédiée' : order.statut === 'Delivered' ? 'Livrée' : order.statut}
                      </span>
                      <strong style={{ fontSize: '1.1rem', color: 'var(--text-dark)' }}>{order.total?.toLocaleString()} DH</strong>
                    </div>
                  </div>

                  {/* Order Items */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                    {(order.items || []).map((item, idx) => (
                      <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: 'var(--bg-surface-elevated)', borderRadius: '6px', border: '1px solid var(--border-subtle)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '0.72rem', padding: '2px 6px', borderRadius: '4px', background: item.type_vente === 'SECOND_HAND' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(179, 135, 40, 0.15)', color: item.type_vente === 'SECOND_HAND' ? '#065f46' : 'var(--dark-gold)' }}>
                            {item.type_vente === 'SECOND_HAND' ? '♻️ Seconde main' : '✨ Première main'}
                          </span>
                          <strong style={{ fontSize: '0.85rem', color: 'var(--text-dark)' }}>{item.titre}</strong>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-gray)' }}>x{item.quantite}</span>
                        </div>
                        <span style={{ fontWeight: 700, color: 'var(--primary-gold)', fontSize: '0.88rem' }}>
                          {(item.prix * item.quantite).toLocaleString()} DH
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Section 27: SUIVI VISUEL EN 4 ÉTAPES */}
                  <div className="order-tracking-card" style={{ margin: 0, padding: '12px' }}>
                    <h4 style={{ fontSize: '0.85rem', color: 'var(--primary-gold)', marginBottom: '10px' }}>
                      🚚 Suivi en temps réel de votre colis
                    </h4>
                    <div className="tracking-steps-timeline">
                      {[
                        { title: '1. Confirmée', done: true },
                        { title: '2. Préparation', done: ['In Preparation', 'Shipped', 'Delivered'].includes(order.statut) },
                        { title: '3. Expédiée', done: ['Shipped', 'Delivered'].includes(order.statut) },
                        { title: '4. Livrée', done: order.statut === 'Delivered' }
                      ].map((step, sIdx) => (
                        <div key={sIdx} className={`tracking-step ${step.done ? 'done' : ''}`}>
                          <div className="tracking-step-dot">
                            {step.done ? '✓' : sIdx + 1}
                          </div>
                          <span className="tracking-step-title">{step.title}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: MES ANNONCES EN VENTE */}
      {activeTab === 'my-listings' && (
        <div>
          {myListings.length === 0 ? (
            <div style={{ padding: '48px 20px', textAlign: 'center', background: 'var(--bg-card)', border: '1px solid var(--border-gold)', borderRadius: 'var(--radius-md)' }}>
              <span style={{ fontSize: '2.5rem', display: 'block', marginBottom: '12px' }}>♻️</span>
              <p style={{ color: 'var(--text-gray)', marginBottom: '16px' }}>Vous n'avez pas encore d'annonce de bijoux en vente.</p>
              <button onClick={onOpenSellModal} className="btn-jewelia-primary">
                Publier mon premier bijou
              </button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '14px' }}>
              {myListings.map(item => (
                <ProductCard 
                  key={item.id} 
                  product={item} 
                  onSelectProduct={onSelectProduct} 
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: FAVORIS */}
      {activeTab === 'favorites' && (
        <div>
          {favorites.length === 0 ? (
            <div style={{ padding: '48px 20px', textAlign: 'center', background: 'var(--bg-card)', border: '1px solid var(--border-gold)', borderRadius: 'var(--radius-md)' }}>
              <span style={{ fontSize: '2.5rem', display: 'block', marginBottom: '12px' }}>❤️</span>
              <p style={{ color: 'var(--text-gray)' }}>Aucun bijou dans vos favoris pour le moment.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '14px' }}>
              {favorites.map(item => (
                <ProductCard 
                  key={item.id} 
                  product={item} 
                  onSelectProduct={onSelectProduct} 
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: MESSAGES */}
      {activeTab === 'messages' && (
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'minmax(200px, 260px) 1fr', 
          gap: '16px', 
          background: 'var(--bg-card)', 
          border: '1px solid var(--border-gold)', 
          borderRadius: 'var(--radius-md)', 
          minHeight: '420px',
          boxShadow: 'var(--shadow-card)'
        }}>
          {/* Sellers list */}
          <div style={{ borderRight: '1px solid var(--border-subtle)', padding: '14px' }}>
            <h4 style={{ fontSize: '0.85rem', color: 'var(--primary-gold)', marginBottom: '10px' }}>Vos Vendeurs</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {merchants.length === 0 ? (
                <p style={{ fontSize: '0.78rem', color: 'var(--text-gray)' }}>Aucune conversation active</p>
              ) : (
                merchants.map(m => (
                  <button
                    key={m.id}
                    onClick={() => setSelectedMerchantId(m.id)}
                    style={{
                      padding: '8px 10px',
                      borderRadius: '6px',
                      background: selectedMerchantId === m.id ? 'rgba(179, 135, 40, 0.15)' : 'var(--bg-surface-elevated)',
                      border: '1px solid var(--border-subtle)',
                      color: 'var(--text-dark)',
                      textAlign: 'left',
                      fontWeight: 600,
                      fontSize: '0.8rem',
                      cursor: 'pointer'
                    }}
                  >
                    🏪 {m.shopName}
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Chat thread */}
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '14px' }}>
            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px', paddingRight: '6px', maxHeight: '320px' }}>
              {messages.map(msg => (
                <div 
                  key={msg.id}
                  style={{
                    alignSelf: msg.sender_id === user.id ? 'flex-end' : 'flex-start',
                    background: msg.sender_id === user.id ? 'var(--gold-gradient-btn)' : 'var(--bg-surface-elevated)',
                    color: msg.sender_id === user.id ? '#ffffff' : 'var(--text-dark)',
                    border: `1px solid ${msg.sender_id === user.id ? 'transparent' : 'var(--border-subtle)'}`,
                    padding: '8px 12px',
                    borderRadius: '12px',
                    maxWidth: '80%',
                    fontSize: '0.84rem'
                  }}
                >
                  <p style={{ margin: 0 }}>{msg.content}</p>
                  <span style={{ fontSize: '0.65rem', opacity: 0.7, display: 'block', marginTop: '3px', textAlign: 'right' }}>
                    {new Date(msg.timestamp).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))}
            </div>

            <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
              <input 
                type="text"
                placeholder="Votre message..."
                value={newMessageText}
                onChange={e => setNewMessageText(e.target.value)}
                style={{ flex: 1, padding: '8px 12px', borderRadius: 'var(--radius-full)', border: '1.5px solid var(--border-gold)', background: 'var(--bg-surface-elevated)', color: 'var(--text-dark)', fontSize: '0.84rem', outline: 'none' }}
              />
              <button type="submit" className="btn-jewelia-primary" style={{ padding: '8px 16px', fontSize: '0.84rem' }}>
                Envoyer
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
