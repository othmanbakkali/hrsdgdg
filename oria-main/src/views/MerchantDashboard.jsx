import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../config/api';

export default function MerchantDashboard() {
  const { t, lang } = useLanguage();
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState('listings'); // 'listings', 'orders', 'messages', 'add-product'
  const [stats, setStats] = useState({ totalSales: 0, totalCommission: 0, netEarnings: 0, activeAuctions: 0 });
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [orders, setOrders] = useState([]);

  // Add Product Form State
  const [newProduct, setNewProduct] = useState({
    titre: '',
    description: '',
    prix: '',
    gramme: '',
    purete: '18k',
    city: user ? user.city : 'Casablanca',
    stock: '1',
    category_id: '',
    images: '',
    isAuction: false,
    prix_depart: '',
    min_increment: '100',
    prix_reserve: '',
    date_fin: ''
  });

  // Chats
  const [clients, setClients] = useState([]);
  const [selectedClientId, setSelectedClientId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessageText, setNewMessageText] = useState('');

  const fetchMerchantData = async () => {
    if (!user) return;
    try {
      // Stats
      const statRes = await fetch(`${API_URL}/stats/merchant/${user.id}`);
      const statData = await statRes.json();
      setStats(statData);

      // Products
      const prodRes = await fetch(`${API_URL}/bijoux?commercant=${user.id}`);
      const prodData = await prodRes.json();
      setProducts(prodData);

      // Categories
      const catRes = await fetch(`${API_URL}/categories`);
      const catData = await catRes.json();
      setCategories(catData);
      if (catData.length > 0 && !newProduct.category_id) {
        setNewProduct(prev => ({ ...prev, category_id: catData[0].id }));
      }

      // Orders
      const ordRes = await fetch(`${API_URL}/commandes?merchant_id=${user.id}`);
      const ordData = await ordRes.json();
      setOrders(ordData);

      // Messages
      const msgRes = await fetch(`${API_URL}/messages?user1=${user.id}`);
      const msgData = await msgRes.json();

      // Find unique clients talking to this merchant
      const uniqueClientIds = [...new Set(msgData.map(m => m.sender_id === user.id ? m.receiver_id : m.sender_id))];
      // Set mock client data
      const mockClients = [
        { id: 'u_client1', nom: 'Yassine Alami', email: 'client@oria.com' }
      ].filter(c => uniqueClientIds.includes(c.id));
      
      setClients(mockClients);
      if (mockClients.length > 0 && !selectedClientId) {
        setSelectedClientId(mockClients[0].id);
      }

    } catch (error) {
      console.error('Error fetching merchant dashboard data:', error);
    }
  };

  const fetchChatMessages = async () => {
    if (!user || !selectedClientId) return;
    try {
      const res = await fetch(`${API_URL}/messages?user1=${user.id}&user2=${selectedClientId}`);
      const data = await res.json();
      setMessages(data);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  useEffect(() => {
    fetchMerchantData();
    const interval = setInterval(fetchMerchantData, 4000);
    return () => clearInterval(interval);
  }, [user]);

  useEffect(() => {
    fetchChatMessages();
  }, [selectedClientId]);

  const handleCreateProduct = async (e) => {
    e.preventDefault();
    if (!newProduct.titre || !newProduct.prix || !newProduct.gramme || !newProduct.category_id) return;

    try {
      // 1. Create Jewelry listing
      const res = await fetch(`${API_URL}/bijoux`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          titre: newProduct.titre,
          description: newProduct.description,
          prix: parseFloat(newProduct.prix),
          gramme: parseFloat(newProduct.gramme),
          purete: newProduct.purete,
          city: newProduct.city,
          stock: parseInt(newProduct.stock),
          category_id: newProduct.category_id,
          commercant_id: user.id,
          images: newProduct.images ? [newProduct.images] : undefined
        })
      });

      if (!res.ok) throw new Error('Failed to create listing');
      const createdBijou = await res.json();

      // 2. If Auction check is checked, create auction
      if (newProduct.isAuction) {
        const startPrice = newProduct.prix_depart || newProduct.prix;
        const endDateStr = newProduct.date_fin || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(); // 7 days default
        
        await fetch(`${API_URL}/encheres`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            bijou_id: createdBijou.id,
            prix_depart: parseFloat(startPrice),
            date_debut: new Date().toISOString(),
            date_fin: endDateStr,
            increment_min: parseFloat(newProduct.min_increment),
            prix_reserve: newProduct.prix_reserve ? parseFloat(newProduct.prix_reserve) : null
          })
        });
      }

      // Reset Form and redirect
      setNewProduct({
        titre: '',
        description: '',
        prix: '',
        gramme: '',
        purete: '18k',
        city: user.city,
        stock: '1',
        category_id: categories.length > 0 ? categories[0].id : '',
        images: '',
        isAuction: false,
        prix_depart: '',
        min_increment: '100',
        prix_reserve: '',
        date_fin: ''
      });
      setActiveTab('listings');
      fetchMerchantData();

    } catch (error) {
      console.error('Error creating listing/auction:', error);
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
    } catch (error) {
      console.error('Error updating order status:', error);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessageText.trim() || !selectedClientId) return;

    try {
      const res = await fetch(`${API_URL}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sender_id: user.id,
          receiver_id: selectedClientId,
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
        <h2>Veuillez sélectionner le rôle "Commerçant" en haut pour accéder à cet espace.</h2>
      </div>
    );
  }

  return (
    <div className="dashboard-layout">
      <div className="dashboard-header">
        <div>
          <h2>Boutique {user.shopName}</h2>
          <p style={{ color: 'var(--text-gray)' }}>Commerçant Oria • {user.nom} • {user.phone}</p>
        </div>
        <button className="btn-gold" onClick={() => setActiveTab('add-product')}>
          + {t('addListing')}
        </button>
      </div>

      {/* Analytics stats */}
      <div className="stats-grid">
        <div className="stat-card">
          <span style={{ fontSize: '0.8rem', color: 'var(--text-gray)' }}>{t('totalSales')}</span>
          <div className="stat-value">{stats.totalSales} {t('currency')}</div>
        </div>
        <div className="stat-card" style={{ borderColor: 'rgba(231, 76, 60, 0.4)' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-gray)' }}>{t('commissionsPaid')}</span>
          <div className="stat-value" style={{ color: 'var(--danger-red)' }}>-{stats.totalCommission} {t('currency')}</div>
        </div>
        <div className="stat-card" style={{ borderColor: 'rgba(46, 204, 113, 0.4)' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-gray)' }}>{t('netEarnings')}</span>
          <div className="stat-value" style={{ color: 'var(--success-green)' }}>{stats.netEarnings} {t('currency')}</div>
        </div>
        <div className="stat-card">
          <span style={{ fontSize: '0.8rem', color: 'var(--text-gray)' }}>{t('activeAuctionsCount')}</span>
          <div className="stat-value">{stats.activeAuctions}</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="dashboard-nav-tabs">
        <button 
          className={`dashboard-tab ${activeTab === 'listings' ? 'active' : ''}`}
          onClick={() => setActiveTab('listings')}
        >
          💎 {t('myListings')}
        </button>
        <button 
          className={`dashboard-tab ${activeTab === 'orders' ? 'active' : ''}`}
          onClick={() => setActiveTab('orders')}
        >
          📦 {t('orders')}
        </button>
        <button 
          className={`dashboard-tab ${activeTab === 'messages' ? 'active' : ''}`}
          onClick={() => setActiveTab('messages')}
        >
          💬 {t('messages')}
        </button>
      </div>

      {/* Add Product View */}
      {activeTab === 'add-product' && (
        <form className="oria-form" onSubmit={handleCreateProduct} style={{ margin: '0 auto' }}>
          <h3 style={{ borderBottom: '1px solid var(--primary-gold)', paddingBottom: '10px', marginBottom: '25px', color: 'var(--primary-gold)' }}>
            {t('addListing')}
          </h3>

          <div className="form-group">
            <label className="form-label">{t('title')}</label>
            <input 
              type="text" 
              className="form-input" 
              value={newProduct.titre}
              onChange={(e) => setNewProduct({ ...newProduct, titre: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">{t('description')}</label>
            <textarea 
              className="form-input" 
              rows="4" 
              value={newProduct.description}
              onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">{t('category')}</label>
              <select 
                className="form-input"
                value={newProduct.category_id}
                onChange={(e) => setNewProduct({ ...newProduct, category_id: e.target.value })}
              >
                {categories.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.nom_fr}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">{t('city')}</label>
              <input 
                type="text" 
                className="form-input" 
                value={newProduct.city}
                onChange={(e) => setNewProduct({ ...newProduct, city: e.target.value })}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">{t('price')} (MAD)</label>
              <input 
                type="number" 
                className="form-input" 
                value={newProduct.prix}
                onChange={(e) => setNewProduct({ ...newProduct, prix: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">{t('weight')} (grams)</label>
              <input 
                type="number" 
                step="0.01" 
                className="form-input" 
                value={newProduct.gramme}
                onChange={(e) => setNewProduct({ ...newProduct, gramme: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">{t('purity')}</label>
              <select 
                className="form-input"
                value={newProduct.purete}
                onChange={(e) => setNewProduct({ ...newProduct, purete: e.target.value })}
              >
                <option value="18k">18k</option>
                <option value="21k">21k</option>
                <option value="24k">24k</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">{t('stock')}</label>
              <input 
                type="number" 
                className="form-input" 
                value={newProduct.stock}
                onChange={(e) => setNewProduct({ ...newProduct, stock: e.target.value })}
              />
            </div>
          </div>

          <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
            <label className="form-label">{t('images')} (URL ou Fichier Local)</label>
            <input 
              type="text" 
              placeholder="https://images.unsplash.com/... (URL)" 
              className="form-input" 
              value={newProduct.images && !newProduct.images.startsWith('data:') ? newProduct.images : ''}
              onChange={(e) => setNewProduct({ ...newProduct, images: e.target.value })}
            />
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '5px' }}>
              <input 
                type="file" 
                accept="image/*"
                style={{ display: 'none' }}
                id="merchant-product-file-upload"
                onChange={(e) => {
                  const file = e.target.files[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onloadend = () => {
                      setNewProduct({ ...newProduct, images: reader.result });
                    };
                    reader.readAsDataURL(file);
                  }
                }}
              />
              <label htmlFor="merchant-product-file-upload" className="btn-outline-gold" style={{ margin: 0, padding: '6px 12px', fontSize: '0.75rem', cursor: 'pointer', display: 'inline-block' }}>
                📁 Choisir un fichier local
              </label>
              {newProduct.images && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <img 
                    src={newProduct.images} 
                    alt="Aperçu" 
                    style={{ width: '32px', height: '32px', borderRadius: '4px', objectFit: 'cover', border: '1px solid var(--primary-gold)' }} 
                  />
                  <span style={{ fontSize: '0.7rem', color: 'var(--success-green)' }}>
                    {newProduct.images.startsWith('data:') ? 'Image locale chargée' : 'URL image chargée'}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Auction Option */}
          <div className="form-group" style={{ backgroundColor: '#211802', padding: '15px', borderRadius: '4px', border: '1px dashed var(--primary-gold)' }}>
            <label className="filter-checkbox-label">
              <input 
                type="checkbox" 
                className="filter-checkbox" 
                checked={newProduct.isAuction}
                onChange={(e) => setNewProduct({ ...newProduct, isAuction: e.target.checked })}
              />
              <strong>⚡ Activer le mode Enchère sur ce bijou</strong>
            </label>

            {newProduct.isAuction && (
              <div style={{ marginTop: '15px' }}>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">{t('startingBid')} (MAD)</label>
                    <input 
                      type="number" 
                      className="form-input"
                      value={newProduct.prix_depart}
                      placeholder={newProduct.prix}
                      onChange={(e) => setNewProduct({ ...newProduct, prix_depart: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">{t('minIncrement')} (MAD)</label>
                    <input 
                      type="number" 
                      className="form-input"
                      value={newProduct.min_increment}
                      onChange={(e) => setNewProduct({ ...newProduct, min_increment: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">{t('reservePrice')} (MAD - Optionnel)</label>
                    <input 
                      type="number" 
                      className="form-input"
                      value={newProduct.prix_reserve}
                      onChange={(e) => setNewProduct({ ...newProduct, prix_reserve: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Date de Clôture</label>
                    <input 
                      type="datetime-local" 
                      className="form-input"
                      value={newProduct.date_fin}
                      onChange={(e) => setNewProduct({ ...newProduct, date_fin: e.target.value })}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: '15px', justifyContent: 'flex-end', marginTop: '30px' }}>
            <button type="button" className="btn-outline-gold" onClick={() => setActiveTab('listings')}>
              Annuler
            </button>
            <button type="submit" className="btn-gold">
              {t('createListingButton')}
            </button>
          </div>
        </form>
      )}

      {/* Listings Manager */}
      {activeTab === 'listings' && (
        <div>
          {products.length === 0 ? (
            <p style={{ color: 'var(--text-gray)', textAlign: 'center', padding: '40px' }}>Aucun produit publié.</p>
          ) : (
            <div className="oria-table-wrapper">
              <table className="oria-table">
                <thead>
                  <tr>
                    <th>Article</th>
                    <th>Prix</th>
                    <th>Poids / Purity</th>
                    <th>Stock / City</th>
                    <th>Statut</th>
                    <th>Note Admin</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map(p => (
                    <tr key={p.id}>
                      <td style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                        {p.images && p.images[0] ? (
                          <img src={p.images[0]} alt={p.titre} style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '4px' }} />
                        ) : (
                          <div style={{ width: '40px', height: '40px', backgroundColor: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '4px', fontSize: '0.65rem', color: 'var(--text-gray)' }}>
                            Sans img
                          </div>
                        )}
                        <div>
                          <strong>{p.titre}</strong>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-gray)' }}>
                            {categories.find(c => c.id === p.category_id)?.nom_fr}
                          </div>
                        </div>
                      </td>
                      <td style={{ color: 'var(--primary-gold)', fontWeight: 'bold' }}>{p.prix} MAD</td>
                      <td>{p.gramme}g / {p.purete}</td>
                      <td>{p.stock} ex. / {p.city}</td>
                      <td>
                        <span className={`badge-status ${p.statut.toLowerCase()}`}>
                          {p.statut}
                        </span>
                      </td>
                      <td style={{ color: 'var(--danger-red)', fontSize: '0.8rem' }}>
                        {p.statut === 'Rejected' ? p.rejectionReason : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Orders Manager */}
      {activeTab === 'orders' && (
        <div>
          {orders.length === 0 ? (
            <p style={{ color: 'var(--text-gray)', textAlign: 'center', padding: '40px' }}>{t('noOrders')}</p>
          ) : (
            <div className="oria-table-wrapper">
              <table className="oria-table">
                <thead>
                  <tr>
                    <th>Commande</th>
                    <th>Date</th>
                    <th>Articles Concernés</th>
                    <th>Total Boutique</th>
                    <th>Commission Prélevée</th>
                    <th>Statut</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map(o => (
                    <tr key={o.id}>
                      <td style={{ fontWeight: '600' }}>#{o.id.substring(4, 9).toUpperCase()}</td>
                      <td>{new Date(o.date_commande).toLocaleDateString()}</td>
                      <td>
                        {o.items.map(i => `${i.titre} (x${i.quantite})`).join(', ')}
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-gray)', marginTop: '4px' }}>
                          Client: {o.client_nom} • Tel: {o.client_telephone} • Addr: {o.client_adresse}, {o.client_ville}
                        </div>
                      </td>
                      <td style={{ color: 'var(--primary-gold)', fontWeight: 'bold' }}>{o.total} MAD</td>
                      <td style={{ color: 'var(--danger-red)' }}>-{o.commission} MAD</td>
                      <td>
                        <span className={`badge-status ${o.statut.toLowerCase()}`}>
                          {o.statut}
                        </span>
                      </td>
                      <td>
                        {o.statut === 'Pending' && (
                          <button className="btn-gold" style={{ padding: '4px 10px', fontSize: '0.75rem' }} onClick={() => handleUpdateOrderStatus(o.id, 'Confirmed')}>
                            Confirmer
                          </button>
                        )}
                        {o.statut === 'Confirmed' && (
                          <button className="btn-gold" style={{ padding: '4px 10px', fontSize: '0.75rem' }} onClick={() => handleUpdateOrderStatus(o.id, 'In Preparation')}>
                            Préparer
                          </button>
                        )}
                        {o.statut === 'In Preparation' && (
                          <button className="btn-gold" style={{ padding: '4px 10px', fontSize: '0.75rem' }} onClick={() => handleUpdateOrderStatus(o.id, 'Shipped')}>
                            Expédier
                          </button>
                        )}
                        {o.statut === 'Shipped' && (
                          <button className="btn-gold" style={{ padding: '4px 10px', fontSize: '0.75rem' }} onClick={() => handleUpdateOrderStatus(o.id, 'Delivered')}>
                            Livrer
                          </button>
                        )}
                        {o.statut !== 'Delivered' && o.statut !== 'Cancelled' && (
                          <button className="btn-outline-gold" style={{ padding: '4px 10px', fontSize: '0.75rem', margin: '0 5px' }} onClick={() => handleUpdateOrderStatus(o.id, 'Cancelled')}>
                            Annuler
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Messages */}
      {activeTab === 'messages' && (
        <div className="chat-window">
          <div className="chat-contacts">
            {clients.map(c => (
              <div 
                key={c.id} 
                className={`contact-item ${selectedClientId === c.id ? 'active' : ''}`}
                onClick={() => setSelectedClientId(c.id)}
              >
                <strong>{c.nom}</strong>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-gray)' }}>{c.email}</div>
              </div>
            ))}
          </div>

          <div className="chat-box">
            {selectedClientId ? (
              <>
                <div className="chat-history">
                  {messages.map(m => (
                    <div 
                      key={m.id} 
                      className={`chat-bubble ${m.sender_id === user.id ? 'sent' : 'received'}`}
                    >
                      {m.content}
                    </div>
                  ))}
                </div>
                <form className="chat-input-area" onSubmit={handleSendMessage}>
                  <input 
                    type="text" 
                    placeholder="Saisissez votre réponse..." 
                    className="filter-input"
                    value={newMessageText}
                    onChange={(e) => setNewMessageText(e.target.value)}
                  />
                  <button type="submit" className="btn-gold">{t('sendMessage')}</button>
                </form>
              </>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-gray)' }}>
                Sélectionnez un client pour discuter.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
