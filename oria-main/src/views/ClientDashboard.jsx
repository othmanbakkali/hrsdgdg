import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../config/api';

export default function ClientDashboard({ onSelectProduct }) {
  const { t, lang } = useLanguage();
  const { user, switchEvalRole } = useAuth();
  
  const [activeTab, setActiveTab] = useState('orders'); // 'orders', 'auctions', 'favorites', 'messages'
  const [orders, setOrders] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [userBids, setUserBids] = useState([]);
  
  // Messaging
  const [merchants, setMerchants] = useState([]);
  const [selectedMerchantId, setSelectedMerchantId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessageText, setNewMessageText] = useState('');

  // Invoice simulation modal
  const [selectedOrderForInvoice, setSelectedOrderForInvoice] = useState(null);

  const fetchClientData = async () => {
    if (!user) return;
    try {
      // Fetch Orders
      const ordRes = await fetch(`${API_URL}/commandes?client_id=${user.id}`);
      const ordData = await ordRes.json();
      setOrders(ordData);

      // Fetch Favorites details
      const favsRes = await fetch(`${API_URL}/bijoux?status=Validated`);
      const allFavs = await favsRes.json();
      setFavorites(allFavs.filter(b => user.favoris && user.favoris.includes(b.id)));

      // Fetch Auctions for user bids
      const aucRes = await fetch(`${API_URL}/encheres`);
      const allAuctions = await aucRes.json();

      // Fetch merchants for messaging
      const msgRes = await fetch(`${API_URL}/messages?user1=${user.id}`);
      const msgData = await msgRes.json();
      
      // Get unique merchants communicating with this client
      const uniqueMerchantIds = [...new Set(msgData.map(m => m.sender_id === user.id ? m.receiver_id : m.sender_id))];
      // Fetch merchant details (names)
      const listMerchants = [
        { id: 'u_merchant1', shopName: 'Maison El Fassi' },
        { id: 'u_merchant2', shopName: 'Maroc Chrono' }
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
    const interval = setInterval(fetchClientData, 4000);
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
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  if (!user) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 20px' }}>
        <h2>Veuillez sélectionner le rôle "Client" en haut pour accéder à cet espace.</h2>
      </div>
    );
  }

  return (
    <div className="dashboard-layout">
      <div className="dashboard-header">
        <div>
          <h2>Bonjour, {user.nom}</h2>
          <p style={{ color: 'var(--text-gray)' }}>Client Oria • {user.email}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="dashboard-nav-tabs">
        <button 
          className={`dashboard-tab ${activeTab === 'orders' ? 'active' : ''}`}
          onClick={() => setActiveTab('orders')}
        >
          📦 {t('orders')}
        </button>
        <button 
          className={`dashboard-tab ${activeTab === 'favorites' ? 'active' : ''}`}
          onClick={() => setActiveTab('favorites')}
        >
          ♥ {t('favorites')}
        </button>
        <button 
          className={`dashboard-tab ${activeTab === 'messages' ? 'active' : ''}`}
          onClick={() => setActiveTab('messages')}
        >
          💬 {t('messages')}
        </button>
      </div>

      {/* Active Tab View */}
      {activeTab === 'orders' && (
        <div>
          {orders.length === 0 ? (
            <p style={{ color: 'var(--text-gray)', textAlign: 'center', padding: '40px' }}>{t('noOrders')}</p>
          ) : (
            <div className="oria-table-wrapper">
              <table className="oria-table">
                <thead>
                  <tr>
                    <th>Numéro</th>
                    <th>Date</th>
                    <th>Articles</th>
                    <th>Montant Total</th>
                    <th>Statut</th>
                    <th>Facture</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map(order => (
                    <tr key={order.id}>
                      <td style={{ fontWeight: '600' }}>#{order.id.substring(4, 9).toUpperCase()}</td>
                      <td>{new Date(order.date_commande).toLocaleDateString()}</td>
                      <td>
                        {order.items.map(i => `${i.titre} (x${i.quantite})`).join(', ')}
                      </td>
                      <td style={{ color: 'var(--primary-gold)', fontWeight: 'bold' }}>
                        {order.total} {t('currency')}
                      </td>
                      <td>
                        <span className={`badge-status ${order.statut.toLowerCase()}`}>
                          {order.statut}
                        </span>
                      </td>
                      <td>
                        <button 
                          className="btn-outline-gold"
                          style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                          onClick={() => setSelectedOrderForInvoice(order)}
                        >
                          📄 Facture
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === 'favorites' && (
        <div>
          {favorites.length === 0 ? (
            <p style={{ color: 'var(--text-gray)', textAlign: 'center', padding: '40px' }}>Aucun favori enregistré.</p>
          ) : (
            <div className="products-grid">
              {favorites.map(product => (
                <div key={product.id} className="product-card" onClick={() => onSelectProduct(product)}>
                  <div className="card-image-container">
                    <img src={product.images[0]} alt={product.titre} className="card-image" />
                  </div>
                  <div className="card-content">
                    <h4 className="card-title">{product.titre}</h4>
                    <div className="card-specs">
                      <span>{product.gramme}g</span>
                      <span>•</span>
                      <span>{product.purete}</span>
                    </div>
                    <div className="card-price-container">
                      <span className="card-price">{product.prix} {t('currency')}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'messages' && (
        <div className="chat-window">
          {/* Contacts */}
          <div className="chat-contacts">
            {merchants.length === 0 ? (
              <p style={{ padding: '20px', color: 'var(--text-gray)', fontSize: '0.85rem' }}>Aucune conversation active.</p>
            ) : (
              merchants.map(m => (
                <div 
                  key={m.id}
                  className={`contact-item ${selectedMerchantId === m.id ? 'active' : ''}`}
                  onClick={() => setSelectedMerchantId(m.id)}
                >
                  <strong style={{ display: 'block' }}>{m.shopName}</strong>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-gray)' }}>Boutique de bijoux</span>
                </div>
              ))
            )}
          </div>

          {/* Active Chat Box */}
          <div className="chat-box">
            {selectedMerchantId ? (
              <>
                <div className="chat-history">
                  {messages.map(msg => (
                    <div 
                      key={msg.id}
                      className={`chat-bubble ${msg.sender_id === user.id ? 'sent' : 'received'}`}
                    >
                      {msg.content}
                    </div>
                  ))}
                </div>
                <form className="chat-input-area" onSubmit={handleSendMessage}>
                  <input 
                    type="text" 
                    placeholder={t('messagePlaceholder')}
                    className="filter-input"
                    value={newMessageText}
                    onChange={(e) => setNewMessageText(e.target.value)}
                  />
                  <button type="submit" className="btn-gold">
                    {t('sendMessage')}
                  </button>
                </form>
              </>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-gray)' }}>
                Sélectionnez un contact pour commencer à discuter.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Invoice Simulation Modal */}
      {selectedOrderForInvoice && (
        <div className="modal-overlay" onClick={() => setSelectedOrderForInvoice(null)}>
          <div className="modal-content" style={{ maxWidth: '600px', padding: '40px', color: '#121212', backgroundColor: '#ffffff' }} onClick={(e) => e.stopPropagation()}>
            <button className="modal-close-btn" style={{ color: '#121212', borderColor: '#121212', background: 'transparent' }} onClick={() => setSelectedOrderForInvoice(null)}>✕</button>
            
            <div style={{ textAlign: 'center', marginBottom: '30px', borderBottom: '2px solid #d4af37', paddingBottom: '15px' }}>
              <h2 style={{ fontFamily: 'Playfair Display', color: '#aa7c11', margin: 0 }}>FACTURE ORIA BIJOUX</h2>
              <p style={{ fontSize: '0.85rem', color: '#666', margin: '5px 0 0 0' }}>Maison de Luxe & Courtage en Ligne</p>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', marginBottom: '30px' }}>
              <div>
                <strong>Client:</strong>
                <div>{selectedOrderForInvoice.client_nom}</div>
                <div>{selectedOrderForInvoice.client_adresse}</div>
                <div>{selectedOrderForInvoice.client_ville}</div>
                <div>{selectedOrderForInvoice.client_telephone}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div><strong>Facture N°:</strong> {selectedOrderForInvoice.id.substring(4, 9).toUpperCase()}</div>
                <div><strong>Date:</strong> {new Date(selectedOrderForInvoice.date_commande).toLocaleDateString()}</div>
                <div><strong>Statut de Paiement:</strong> En attente (À la livraison)</div>
              </div>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '30px', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #ddd', textAlign: 'left' }}>
                  <th style={{ padding: '10px 0' }}>Article</th>
                  <th style={{ padding: '10px 0', textAlign: 'center' }}>Qté</th>
                  <th style={{ padding: '10px 0', textAlign: 'right' }}>Prix Unitaire</th>
                  <th style={{ padding: '10px 0', textAlign: 'right' }}>Sous-total</th>
                </tr>
              </thead>
              <tbody>
                {selectedOrderForInvoice.items.map((item, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={{ padding: '10px 0' }}>{item.titre}</td>
                    <td style={{ padding: '10px 0', textAlign: 'center' }}>{item.quantite}</td>
                    <td style={{ padding: '10px 0', textAlign: 'right' }}>{item.prix} MAD</td>
                    <td style={{ padding: '10px 0', textAlign: 'right' }}>{item.prix * item.quantite} MAD</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div style={{ width: '50%', marginLeft: 'auto', marginRight: 0, borderTop: '2px solid #d4af37', paddingTop: '15px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.95rem' }}>
                <span><strong>Total Général:</strong></span>
                <span style={{ color: '#aa7c11', fontWeight: 'bold' }}>{selectedOrderForInvoice.total} MAD</span>
              </div>
            </div>

            <div style={{ textAlign: 'center', marginTop: '40px', fontSize: '0.75rem', color: '#999', borderTop: '1px solid #eee', paddingTop: '15px' }}>
              Cette facture est générée automatiquement par la plateforme Oria.<br />
              Merci pour votre confiance.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
