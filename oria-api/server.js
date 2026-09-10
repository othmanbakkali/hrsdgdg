const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

const DB_PATH = path.join(__dirname, 'data', 'database.json');

// Helper to read database
function readDB() {
  try {
    const data = fs.readFileSync(DB_PATH, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading database file:', error);
    return { users: [], categories: [], bijoux: [], encheres: [], offresEncheres: [], commandes: [], messages: [], config: {} };
  }
}

// Helper to write database
function writeDB(data) {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf8');
  } catch (error) {
    console.error('Error writing database file:', error);
  }
}

// Authentication
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  const db = readDB();
  const user = db.users.find(u => u.email === email && u.mot_de_passe === password);
  if (!user) {
    return res.status(401).json({ message: 'Identifiants incorrects' });
  }
  res.json(user);
});

app.post('/api/auth/register', (req, res) => {
  const { email, nom, mot_de_passe, role, shopName, phone, address, city } = req.body;
  const db = readDB();
  
  if (db.users.some(u => u.email === email)) {
    return res.status(400).json({ message: 'Cet email est déjà enregistré' });
  }

  const newUser = {
    id: 'u_' + Math.random().toString(36).substr(2, 9),
    email,
    nom,
    mot_de_passe,
    role,
    favoris: []
  };

  if (role === 'commercant') {
    newUser.shopName = shopName || nom;
    newUser.phone = phone || '';
    newUser.address = address || '';
    newUser.city = city || '';
  }

  db.users.push(newUser);
  writeDB(db);
  res.status(201).json(newUser);
});

// User Management CRUD APIs
app.get('/api/users', (req, res) => {
  const db = readDB();
  res.json(db.users);
});

app.post('/api/users', (req, res) => {
  const { email, nom, mot_de_passe, role, shopName, phone, address, city } = req.body;
  const db = readDB();
  
  if (db.users.some(u => u.email === email)) {
    return res.status(400).json({ message: 'Cet email est déjà enregistré' });
  }

  const newUser = {
    id: 'u_' + Math.random().toString(36).substr(2, 9),
    email,
    nom,
    mot_de_passe: mot_de_passe || 'password123',
    role: role || 'client',
    favoris: []
  };

  if (newUser.role === 'commercant') {
    newUser.shopName = shopName || nom;
    newUser.phone = phone || '';
    newUser.address = address || '';
    newUser.city = city || '';
  }

  db.users.push(newUser);
  writeDB(db);
  res.status(201).json(newUser);
});

app.put('/api/users/:id', (req, res) => {
  const { email, nom, mot_de_passe, role, shopName, phone, address, city } = req.body;
  const db = readDB();
  const user = db.users.find(u => u.id === req.params.id);
  if (!user) return res.status(404).json({ message: 'Utilisateur non trouvé' });

  if (email && email !== user.email && db.users.some(u => u.email === email)) {
    return res.status(400).json({ message: 'Cet email est déjà enregistré' });
  }

  user.email = email || user.email;
  user.nom = nom || user.nom;
  user.mot_de_passe = mot_de_passe || user.mot_de_passe;
  user.role = role || user.role;

  if (user.role === 'commercant') {
    user.shopName = shopName || user.shopName || user.nom;
    user.phone = phone || user.phone || '';
    user.address = address || user.address || '';
    user.city = city || user.city || '';
  } else {
    delete user.shopName;
    delete user.phone;
    delete user.address;
    delete user.city;
  }

  writeDB(db);
  res.json(user);
});

app.delete('/api/users/:id', (req, res) => {
  const db = readDB();
  const index = db.users.findIndex(u => u.id === req.params.id);
  if (index === -1) return res.status(404).json({ message: 'Utilisateur non trouvé' });
  
  const userToDelete = db.users[index];
  if (userToDelete.role === 'admin' && db.users.filter(u => u.role === 'admin').length <= 1) {
    return res.status(400).json({ message: 'Impossible de supprimer le dernier administrateur' });
  }

  db.users.splice(index, 1);
  writeDB(db);
  res.json({ message: 'Utilisateur supprimé avec succès' });
});

// Categories
app.get('/api/categories', (req, res) => {
  const db = readDB();
  res.json(db.categories);
});

app.post('/api/categories', (req, res) => {
  const { nom_fr, nom_ar, nom_en } = req.body;
  const db = readDB();
  const newCat = {
    id: 'cat_' + Math.random().toString(36).substr(2, 9),
    nom_fr,
    nom_ar,
    nom_en
  };
  db.categories.push(newCat);
  writeDB(db);
  res.status(201).json(newCat);
});

app.delete('/api/categories/:id', (req, res) => {
  const { id } = req.params;
  const db = readDB();
  db.categories = db.categories.filter(c => c.id !== id);
  writeDB(db);
  res.json({ message: 'Catégorie supprimée avec succès' });
});

// Products (Bijoux)
app.get('/api/bijoux', (req, res) => {
  const db = readDB();
  let results = db.bijoux;

  // Search filter
  const { q, category, priceMin, priceMax, weightMin, weightMax, purity, city, status, commercant } = req.query;

  if (q) {
    const query = q.toLowerCase();
    results = results.filter(b => b.titre.toLowerCase().includes(query) || b.description.toLowerCase().includes(query));
  }
  if (category) {
    results = results.filter(b => b.category_id === category);
  }
  if (priceMin) {
    results = results.filter(b => b.prix >= parseFloat(priceMin));
  }
  if (priceMax) {
    results = results.filter(b => b.prix <= parseFloat(priceMax));
  }
  if (weightMin) {
    results = results.filter(b => b.gramme >= parseFloat(weightMin));
  }
  if (weightMax) {
    results = results.filter(b => b.gramme <= parseFloat(weightMax));
  }
  if (purity) {
    results = results.filter(b => b.purete === purity);
  }
  if (city) {
    results = results.filter(b => b.city.toLowerCase() === city.toLowerCase());
  }
  if (status) {
    results = results.filter(b => b.statut === status);
  }
  if (commercant) {
    results = results.filter(b => b.commercant_id === commercant);
  }

  res.json(results);
});

app.get('/api/bijoux/:id', (req, res) => {
  const db = readDB();
  const product = db.bijoux.find(b => b.id === req.params.id);
  if (!product) return res.status(404).json({ message: 'Bijou non trouvé' });
  res.json(product);
});

app.post('/api/bijoux', (req, res) => {
  const { titre, description, prix, gramme, purete, images, city, stock, category_id, commercant_id, statut } = req.body;
  const db = readDB();

  const newProduct = {
    id: 'b_' + Math.random().toString(36).substr(2, 9),
    titre,
    description,
    prix: parseFloat(prix),
    gramme: parseFloat(gramme),
    purete,
    images: images || ['https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=600&auto=format&fit=crop&q=80'],
    disponibilite: parseInt(stock) > 0 ? 'disponible' : 'rupture',
    city,
    stock: parseInt(stock),
    category_id,
    commercant_id,
    statut: 'Pending',
    rejectionReason: '',
    date_creation: new Date().toISOString()
  };

  db.bijoux.push(newProduct);
  writeDB(db);
  res.status(201).json(newProduct);
});

app.put('/api/bijoux/:id', (req, res) => {
  const { titre, description, prix, gramme, purete, images, city, stock, category_id, statut, commercant_id } = req.body;
  const db = readDB();
  const idx = db.bijoux.findIndex(b => b.id === req.params.id);
  if (idx === -1) return res.status(404).json({ message: 'Bijou non trouvé' });

  const current = db.bijoux[idx];
  db.bijoux[idx] = {
    ...current,
    titre: titre || current.titre,
    description: description || current.description,
    prix: prix !== undefined ? parseFloat(prix) : current.prix,
    gramme: gramme !== undefined ? parseFloat(gramme) : current.gramme,
    purete: purete || current.purete,
    images: images || current.images,
    city: city || current.city,
    stock: stock !== undefined ? parseInt(stock) : current.stock,
    disponibilite: stock !== undefined ? (parseInt(stock) > 0 ? 'disponible' : 'rupture') : current.disponibilite,
    category_id: category_id || current.category_id,
    commercant_id: commercant_id || current.commercant_id,
    statut: statut || current.statut
  };

  writeDB(db);
  res.json(db.bijoux[idx]);
});

// Admin validation queue
app.put('/api/bijoux/:id/status', (req, res) => {
  const { status, rejectionReason } = req.body; // status: Validated, Rejected
  const db = readDB();
  const product = db.bijoux.find(b => b.id === req.params.id);
  if (!product) return res.status(404).json({ message: 'Bijou non trouvé' });

  product.statut = status;
  product.rejectionReason = rejectionReason || '';
  writeDB(db);
  res.json(product);
});

app.delete('/api/bijoux/:id', (req, res) => {
  const db = readDB();
  const index = db.bijoux.findIndex(b => b.id === req.params.id);
  if (index === -1) return res.status(404).json({ message: 'Bijou non trouvé' });

  db.bijoux.splice(index, 1);

  // Clean up linked auctions
  db.encheres = db.encheres.filter(e => e.bijou_id !== req.params.id);

  writeDB(db);
  res.json({ message: 'Bijou supprimé avec succès' });
});

// Favorites Toggle
app.post('/api/users/:userId/favorites', (req, res) => {
  const { itemId } = req.body;
  const db = readDB();
  const user = db.users.find(u => u.id === req.params.userId);
  if (!user) return res.status(404).json({ message: 'Utilisateur non trouvé' });

  if (!user.favoris) user.favoris = [];
  if (user.favoris.includes(itemId)) {
    user.favoris = user.favoris.filter(id => id !== itemId);
  } else {
    user.favoris.push(itemId);
  }

  writeDB(db);
  res.json(user.favoris);
});

// Orders & Commissions
app.post('/api/commandes', (req, res) => {
  const { client_id, client_nom, client_telephone, client_adresse, client_ville, items } = req.body;
  const db = readDB();

  // 1. Verify availability of items
  for (let item of items) {
    const bijou = db.bijoux.find(b => b.id === item.bijou_id);
    if (!bijou || bijou.stock < item.quantite || bijou.statut !== 'Validated') {
      return res.status(400).json({ message: `Le bijou '${item.titre}' n'est pas disponible dans le stock requis.` });
    }
  }

  // 2. Process commission configurations
  const globalRate = db.config.commission_globale || 5;
  const catRates = db.config.commission_categories || {};
  const merchantRates = db.config.commission_commercants || {};

  let totalOrderAmount = 0;
  let totalCommissionAmount = 0;

  const processedItems = items.map(item => {
    const bijou = db.bijoux.find(b => b.id === item.bijou_id);
    
    // Determine commission rate for this item:
    // merchant override > category override > global rate
    let itemRate = globalRate;
    if (catRates[bijou.category_id] !== undefined) {
      itemRate = catRates[bijou.category_id];
    }
    if (merchantRates[bijou.commercant_id] !== undefined) {
      itemRate = merchantRates[bijou.commercant_id];
    }

    const itemTotal = bijou.prix * item.quantite;
    const itemCommission = (itemTotal * itemRate) / 100;

    totalOrderAmount += itemTotal;
    totalCommissionAmount += itemCommission;

    // Deduct stock
    bijou.stock -= item.quantite;
    if (bijou.stock <= 0) {
      bijou.disponibilite = 'rupture';
    }

    return {
      bijou_id: item.bijou_id,
      titre: bijou.titre,
      prix: bijou.prix,
      quantite: item.quantite,
      commercant_id: bijou.commercant_id,
      commission_rate: itemRate,
      commission_amount: itemCommission
    };
  });

  const newOrder = {
    id: 'cmd_' + Math.random().toString(36).substr(2, 9),
    client_id,
    client_nom,
    client_telephone,
    client_adresse,
    client_ville,
    items: processedItems,
    total: totalOrderAmount,
    commission: totalCommissionAmount,
    statut: 'Pending',
    date_commande: new Date().toISOString()
  };

  db.commandes.push(newOrder);
  writeDB(db);
  res.status(201).json(newOrder);
});

app.get('/api/commandes', (req, res) => {
  const { client_id, merchant_id } = req.query;
  const db = readDB();
  let orders = db.commandes;

  if (client_id) {
    orders = orders.filter(o => o.client_id === client_id);
  }
  if (merchant_id) {
    // Return orders containing items belonging to this merchant
    orders = orders.filter(o => o.items.some(item => item.commercant_id === merchant_id))
      .map(o => {
        // Only return details relevant to this merchant for transparency
        const merchantItems = o.items.filter(item => item.commercant_id === merchant_id);
        const merchantTotal = merchantItems.reduce((acc, curr) => acc + (curr.prix * curr.quantite), 0);
        const merchantComm = merchantItems.reduce((acc, curr) => acc + curr.commission_amount, 0);
        return {
          ...o,
          items: merchantItems,
          total: merchantTotal,
          commission: merchantComm
        };
      });
  }

  res.json(orders);
});

app.put('/api/commandes/:id/status', (req, res) => {
  const { status } = req.body; // Pending, Confirmed, In Preparation, Shipped, Delivered, Cancelled
  const db = readDB();
  const order = db.commandes.find(o => o.id === req.params.id);
  if (!order) return res.status(404).json({ message: 'Commande non trouvée' });

  order.statut = status;
  writeDB(db);
  res.json(order);
});

// Auctions
app.get('/api/encheres', (req, res) => {
  const db = readDB();
  const activeAuctions = db.encheres.map(auc => {
    const bijou = db.bijoux.find(b => b.id === auc.bijou_id);
    const bids = db.offresEncheres.filter(o => o.enchere_id === auc.id);
    const highestBid = bids.reduce((max, b) => b.montant > max ? b.montant : max, auc.prix_depart);
    return {
      ...auc,
      bijou,
      highestBid,
      bidsCount: bids.length
    };
  });
  res.json(activeAuctions);
});

app.post('/api/encheres', (req, res) => {
  const { bijou_id, prix_depart, date_debut, date_fin, increment_min, prix_reserve } = req.body;
  const db = readDB();

  // Validate jewelry belongs to merchant and exists
  const bijou = db.bijoux.find(b => b.id === bijou_id);
  if (!bijou) return res.status(404).json({ message: 'Bijou non trouvé' });

  const newAuction = {
    id: 'e_' + Math.random().toString(36).substr(2, 9),
    bijou_id,
    prix_depart: parseFloat(prix_depart),
    date_debut,
    date_fin,
    increment_min: parseFloat(increment_min),
    prix_reserve: prix_reserve ? parseFloat(prix_reserve) : null,
    statut: 'Active'
  };

  db.encheres.push(newAuction);
  
  // Update jewelry status to Validated (just in case) or bind it
  bijou.disponibilite = 'enchere';
  
  writeDB(db);
  res.status(201).json(newAuction);
});

app.post('/api/encheres/:id/bid', (req, res) => {
  const { client_id, montant } = req.body;
  const db = readDB();
  const auction = db.encheres.find(e => e.id === req.params.id);
  if (!auction) return res.status(404).json({ message: 'Enchère non trouvée' });

  if (auction.statut !== 'Active' || new Date(auction.date_fin) < new Date()) {
    return res.status(400).json({ message: "L'enchère est terminée ou inactive." });
  }

  // Get current highest bid
  const bids = db.offresEncheres.filter(o => o.enchere_id === auction.id);
  const highestBid = bids.reduce((max, b) => b.montant > max ? b.montant : max, auction.prix_depart);
  
  const minBidAllowed = bids.length === 0 ? auction.prix_depart : highestBid + auction.increment_min;

  if (parseFloat(montant) < minBidAllowed) {
    return res.status(400).json({ message: `Le montant de l'offre doit être d'au moins ${minBidAllowed} MAD.` });
  }

  const newBid = {
    id: 'o_' + Math.random().toString(36).substr(2, 9),
    enchere_id: auction.id,
    client_id,
    montant: parseFloat(montant),
    date_offre: new Date().toISOString()
  };

  db.offresEncheres.push(newBid);
  writeDB(db);

  res.status(201).json(newBid);
});

// Endpoint to resolve ended auctions and trigger winning orders
app.post('/api/encheres/:id/resolve', (req, res) => {
  const db = readDB();
  const auction = db.encheres.find(e => e.id === req.params.id);
  if (!auction) return res.status(404).json({ message: 'Enchère non trouvée' });

  if (auction.statut === 'Finished') {
    return res.json({ message: 'Enchère déjà clôturée.' });
  }

  auction.statut = 'Finished';

  const bids = db.offresEncheres.filter(o => o.enchere_id === auction.id);
  if (bids.length === 0) {
    // No bids placed
    writeDB(db);
    return res.json({ message: 'Enchère clôturée sans aucun participant.', winner: null });
  }

  // Find highest bid
  const sortedBids = bids.sort((a, b) => b.montant - a.montant);
  const winningBid = sortedBids[0];

  // If reserve price is not met, cancel it
  if (auction.prix_reserve && winningBid.montant < auction.prix_reserve) {
    auction.statut = 'ReserveNotMet';
    writeDB(db);
    return res.json({ message: 'Prix de réserve non atteint. Enchère annulée.', winner: null });
  }

  // Create a commission order automatically for the winner!
  const bijou = db.bijoux.find(b => b.id === auction.bijou_id);
  const client = db.users.find(u => u.id === winningBid.client_id);

  const globalRate = db.config.commission_globale || 5;
  const catRates = db.config.commission_categories || {};
  const merchantRates = db.config.commission_commercants || {};

  let itemRate = globalRate;
  if (catRates[bijou.category_id] !== undefined) {
    itemRate = catRates[bijou.category_id];
  }
  if (merchantRates[bijou.commercant_id] !== undefined) {
    itemRate = merchantRates[bijou.commercant_id];
  }

  const commissionAmount = (winningBid.montant * itemRate) / 100;

  // Deduct stock
  bijou.stock = Math.max(0, bijou.stock - 1);
  bijou.disponibilite = 'rupture';

  const newOrder = {
    id: 'cmd_' + Math.random().toString(36).substr(2, 9),
    client_id: winningBid.client_id,
    client_nom: client ? client.nom : 'Enchérisseur Anonyme',
    client_telephone: '+212 600-000000',
    client_adresse: 'Adresse Enchères',
    client_ville: bijou.city,
    items: [
      {
        bijou_id: bijou.id,
        titre: `[ENCHÈRE] ${bijou.titre}`,
        prix: winningBid.montant,
        quantite: 1,
        commercant_id: bijou.commercant_id,
        commission_rate: itemRate,
        commission_amount: commissionAmount
      }
    ],
    total: winningBid.montant,
    commission: commissionAmount,
    statut: 'Confirmed',
    date_commande: new Date().toISOString()
  };

  db.commandes.push(newOrder);
  writeDB(db);

  res.json({ message: 'Enchère résolue avec succès.', order: newOrder, winner: client ? client.nom : 'Client' });
});

// Admin Auction Moderation - Cancel an auction
app.delete('/api/encheres/:id', (req, res) => {
  const db = readDB();
  const auction = db.encheres.find(e => e.id === req.params.id);
  if (!auction) return res.status(404).json({ message: 'Enchère non trouvée' });

  auction.statut = 'Cancelled';
  
  // Revert jewelry availability
  const bijou = db.bijoux.find(b => b.id === auction.bijou_id);
  if (bijou) {
    bijou.disponibilite = 'disponible';
  }

  writeDB(db);
  res.json({ message: 'Enchère annulée avec succès', auction });
});

// Admin Bid Moderation - Delete a bid
app.delete('/api/offresEncheres/:bidId', (req, res) => {
  const db = readDB();
  const bidIndex = db.offresEncheres.findIndex(o => o.id === req.params.bidId);
  if (bidIndex === -1) return res.status(404).json({ message: 'Offre non trouvée' });

  const bid = db.offresEncheres[bidIndex];
  db.offresEncheres.splice(bidIndex, 1);
  writeDB(db);
  res.json({ message: 'Offre supprimée avec succès', bid });
});

// Admin get all bids for an auction
app.get('/api/encheres/:id/bids', (req, res) => {
  const db = readDB();
  const bids = db.offresEncheres.filter(o => o.enchere_id === req.params.id);
  // Enrich with client names
  const enrichedBids = bids.map(b => {
    const client = db.users.find(u => u.id === b.client_id);
    return {
      ...b,
      clientName: client ? client.nom : 'Client Inconnu',
      clientEmail: client ? client.email : ''
    };
  });
  res.json(enrichedBids);
});

// Configurations
app.get('/api/config', (req, res) => {
  const db = readDB();
  res.json(db.config);
});

app.put('/api/config', (req, res) => {
  const db = readDB();
  db.config = {
    ...db.config,
    ...req.body
  };
  writeDB(db);
  res.json(db.config);
});

// Messages
app.get('/api/messages', (req, res) => {
  const { user1, user2 } = req.query;
  const db = readDB();
  let msgs = db.messages;

  if (user1 && user2) {
    msgs = msgs.filter(m => 
      (m.sender_id === user1 && m.receiver_id === user2) || 
      (m.sender_id === user2 && m.receiver_id === user1)
    ).sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  } else if (user1) {
    msgs = msgs.filter(m => m.sender_id === user1 || m.receiver_id === user1);
  }

  res.json(msgs);
});

app.post('/api/messages', (req, res) => {
  const { sender_id, receiver_id, bijou_id, content } = req.body;
  const db = readDB();

  const newMsg = {
    id: 'msg_' + Math.random().toString(36).substr(2, 9),
    sender_id,
    receiver_id,
    bijou_id: bijou_id || null,
    content,
    timestamp: new Date().toISOString()
  };

  db.messages.push(newMsg);
  writeDB(db);
  res.status(201).json(newMsg);
});

// Financial Stats and Admin Panel Analytics
app.get('/api/stats/admin', (req, res) => {
  const db = readDB();
  
  const totalSales = db.commandes.reduce((acc, curr) => acc + curr.total, 0);
  const totalCommissions = db.commandes.reduce((acc, curr) => acc + curr.commission, 0);
  
  const merchantSales = {};
  db.users.filter(u => u.role === 'commercant').forEach(m => {
    merchantSales[m.id] = { id: m.id, shopName: m.shopName, sales: 0, commission: 0, itemsCount: 0 };
  });

  db.commandes.forEach(o => {
    (o.items || []).forEach(item => {
      if (merchantSales[item.commercant_id]) {
        const itemSales = (Number(item.prix) || 0) * (Number(item.quantite) || 1);
        const itemComm = Number(item.commission_amount) || 0;
        merchantSales[item.commercant_id].sales += itemSales;
        merchantSales[item.commercant_id].commission += itemComm;
        merchantSales[item.commercant_id].itemsCount += (Number(item.quantite) || 1);
      }
    });
  });

  res.json({
    totalSales,
    totalCommissions,
    totalMerchants: db.users.filter(u => u.role === 'commercant').length,
    totalClients: db.users.filter(u => u.role === 'client').length,
    totalProducts: db.bijoux.length,
    merchantsBreakdown: Object.values(merchantSales)
  });
});

app.get('/api/stats/merchant/:merchantId', (req, res) => {
  const { merchantId } = req.params;
  const db = readDB();

  let totalSales = 0;
  let totalCommission = 0;
  let itemsSold = 0;

  db.commandes.forEach(o => {
    (o.items || []).forEach(item => {
      if (item.commercant_id === merchantId) {
        const itemSales = (Number(item.prix) || 0) * (Number(item.quantite) || 1);
        const itemComm = Number(item.commission_amount) || 0;
        totalSales += itemSales;
        totalCommission += itemComm;
        itemsSold += (Number(item.quantite) || 1);
      }
    });
  });

  const activeAuctions = db.encheres.filter(e => {
    const bijou = db.bijoux.find(b => b.id === e.bijou_id);
    return bijou && bijou.commercant_id === merchantId && e.statut === 'Active';
  }).length;

  res.json({
    totalSales,
    totalCommission,
    netEarnings: totalSales - totalCommission,
    itemsSold,
    activeAuctions
  });
});

// Static Files & Production SPA Serving
const mainDistPath = path.join(__dirname, '..', 'oria-main', 'dist');
const adminDistPath = path.join(__dirname, '..', 'oria-admin', 'dist');

// 1. Serve Admin SPA at /admin
if (fs.existsSync(adminDistPath)) {
  app.use('/admin', express.static(adminDistPath));
  app.get('/admin/*', (req, res) => {
    res.sendFile(path.join(adminDistPath, 'index.html'));
  });
}

// 2. Serve Main Marketplace SPA at /
if (fs.existsSync(mainDistPath)) {
  app.use(express.static(mainDistPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/admin')) {
      return next();
    }
    res.sendFile(path.join(mainDistPath, 'index.html'));
  });
}

// Server Initialization
const PORT = process.env.PORT || 5077;
const HOST = process.env.HOST || '0.0.0.0';
app.listen(PORT, HOST, () => {
  console.log(`Oria Unified Server is running on http://${HOST === '0.0.0.0' ? 'localhost' : HOST}:${PORT}`);
  if (fs.existsSync(mainDistPath)) {
    console.log(`- Marketplace: http://localhost:${PORT}/`);
  }
  if (fs.existsSync(adminDistPath)) {
    console.log(`- Admin Dashboard: http://localhost:${PORT}/admin/`);
  }
  console.log(`- REST API: http://localhost:${PORT}/api/`);
});
