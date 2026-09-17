const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const { initPostgres, isPostgresAvailable, query } = require('./db/db');

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Initialize PostgreSQL on bootstrap
initPostgres().catch(err => console.warn('PostgreSQL auto-init error:', err.message));

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
  
  const normalizedEmail = (email || '').trim().toLowerCase();
  const baseUserPart = normalizedEmail.split('@')[0];
  const allowedDomains = ['hrsdgdg.com', 'oria.com', 'jewelia.com'];

  const user = db.users.find(u => {
    const uEmail = (u.email || '').toLowerCase();
    const uBase = uEmail.split('@')[0];
    const matchEmail = uEmail === normalizedEmail || (uBase === baseUserPart && allowedDomains.some(d => normalizedEmail.endsWith('@' + d)));
    return matchEmail && u.mot_de_passe === password;
  });

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
  let results = db.bijoux || [];

  // Search filter
  const { 
    q, 
    category, 
    priceMin, 
    priceMax, 
    weightMin, 
    weightMax, 
    purity, 
    city, 
    status, 
    commercant,
    type_vente,
    etat,
    matiere,
    pierre,
    style,
    occasion,
    pour_qui,
    authentifie,
    dealsOnly
  } = req.query;

  // Smart Natural Search Parser
  if (q) {
    const rawQuery = q.toLowerCase();
    
    // Natural query extraction
    let queryPriceMax = null;
    const priceMatch = rawQuery.match(/moins de (\d+)/i) || rawQuery.match(/budget (\d+)/i) || rawQuery.match(/< ?(\d+)/i);
    if (priceMatch) {
      queryPriceMax = parseFloat(priceMatch[1]);
    }

    const wantsSecondHand = rawQuery.includes('seconde main') || rawQuery.includes('occasion') || rawQuery.includes('vintage') || rawQuery.includes('ancien');
    const wantsFirstHand = rawQuery.includes('neuf') || rawQuery.includes('premiere main') || rawQuery.includes('première main');

    results = results.filter(b => {
      const matchText = (
        (b.titre || '') + ' ' + 
        (b.description || '') + ' ' + 
        (b.matiere || '') + ' ' + 
        (b.pierre || '') + ' ' + 
        (b.style || '') + ' ' + 
        (b.occasion || '') + ' ' + 
        (b.pour_qui || '') + ' ' + 
        (b.etat || '') + ' ' +
        (b.vendeur_nom || '')
      ).toLowerCase();

      // Check tokens
      const searchTerms = rawQuery
        .replace(/moins de \d+/gi, '')
        .replace(/budget \d+/gi, '')
        .replace(/dh/gi, '')
        .replace(/mad/gi, '')
        .trim()
        .split(/\s+/)
        .filter(term => term.length > 1 && !['pour', 'les', 'des', 'une', 'qui', 'avec', 'sans', 'dans'].includes(term));

      const matchesTerms = searchTerms.length === 0 || searchTerms.some(term => matchText.includes(term));
      const matchesPrice = !queryPriceMax || b.prix <= queryPriceMax;
      const matchesType = wantsSecondHand ? b.type_vente === 'SECOND_HAND' : (wantsFirstHand ? b.type_vente === 'FIRST_HAND' : true);

      return matchesTerms && matchesPrice && matchesType;
    });
  }

  if (category) {
    results = results.filter(b => b.category_id === category);
  }
  if (type_vente && type_vente !== 'ALL') {
    results = results.filter(b => b.type_vente === type_vente);
  }
  if (etat && etat !== 'ALL') {
    results = results.filter(b => b.etat === etat);
  }
  if (matiere && matiere !== 'ALL') {
    results = results.filter(b => (b.matiere || '').toLowerCase() === matiere.toLowerCase());
  }
  if (pierre && pierre !== 'ALL') {
    results = results.filter(b => (b.pierre || '').toLowerCase() === pierre.toLowerCase());
  }
  if (style && style !== 'ALL') {
    results = results.filter(b => (b.style || '').toLowerCase() === style.toLowerCase());
  }
  if (occasion && occasion !== 'ALL') {
    results = results.filter(b => (b.occasion || '').toLowerCase() === occasion.toLowerCase());
  }
  if (pour_qui && pour_qui !== 'ALL') {
    results = results.filter(b => (b.pour_qui || '').toLowerCase() === pour_qui.toLowerCase());
  }
  if (authentifie === 'true' || authentifie === 'Vérifié') {
    results = results.filter(b => b.authentifie === 'Vérifié');
  }
  if (dealsOnly === 'true') {
    results = results.filter(b => b.ancien_prix && b.ancien_prix > b.prix);
  }
  if (priceMin) {
    results = results.filter(b => b.prix >= parseFloat(priceMin));
  }
  if (priceMax) {
    results = results.filter(b => b.prix <= parseFloat(priceMax));
  }
  if (weightMin) {
    results = results.filter(b => (b.gramme || b.poids || 0) >= parseFloat(weightMin));
  }
  if (weightMax) {
    results = results.filter(b => (b.gramme || b.poids || 0) <= parseFloat(weightMax));
  }
  if (purity) {
    results = results.filter(b => b.purete === purity);
  }
  if (city) {
    results = results.filter(b => (b.city || '').toLowerCase() === city.toLowerCase());
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
  
  // Attach reviews
  const reviews = (db.reviews || []).filter(r => r.bijou_id === product.id);
  res.json({ ...product, customer_reviews: reviews });
});

app.post('/api/bijoux', (req, res) => {
  const { 
    titre, 
    description, 
    prix, 
    ancien_prix,
    type_vente,
    matiere,
    gramme, 
    poids,
    purete, 
    pierre,
    taille,
    etat,
    annee,
    nombre_proprietaires,
    style,
    occasion,
    pour_qui,
    images, 
    city, 
    stock, 
    category_id, 
    commercant_id,
    vendeur_nom,
    vendeur_type,
    vendeur_badge,
    garantie,
    facture,
    certificat,
    boite,
    statut,
    why_this_item
  } = req.body;
  const db = readDB();

  const isSecondHand = type_vente === 'SECOND_HAND';
  const targetMerchantId = commercant_id || 'u_merchant1';

  // Check merchant subscription quota (exempt if admin or auction)
  const merchantUser = (db.users || []).find(u => u.id === targetMerchantId);
  if (merchantUser && merchantUser.role === 'commercant' && req.headers['x-admin'] !== 'true') {
    const activeSub = merchantUser.subscription || { plan_id: 'plan_starter', max_products: 50 };
    const maxAllowed = activeSub.max_products || 50;
    const currentCount = (db.bijoux || []).filter(b => b.commercant_id === targetMerchantId).length;

    if (currentCount >= maxAllowed) {
      return res.status(403).json({
        error: 'QUOTA_EXCEEDED',
        message: `Quota maximum de dépôt atteint (${currentCount}/${maxAllowed} bijoux). Mettez à niveau votre abonnement pour continuer à déposer vos bijoux.`,
        currentCount,
        maxAllowed,
        subscription: activeSub
      });
    }
  }

  const effectiveDisponibilite = req.body.disponibilite 
    ? req.body.disponibilite 
    : (type_vente === 'AUCTION' || req.body.type_vente === 'enchere' ? 'enchere' : (parseInt(stock || 1) > 0 ? 'disponible' : 'rupture'));

  const newProduct = {
    id: 'b_' + Math.random().toString(36).substr(2, 9),
    titre,
    description: description || '',
    prix: parseFloat(prix) || 0,
    ancien_prix: ancien_prix ? parseFloat(ancien_prix) : null,
    type_vente: (type_vente === 'AUCTION' || req.body.type_vente === 'enchere') ? 'SECOND_HAND' : (type_vente || (isSecondHand ? 'SECOND_HAND' : 'FIRST_HAND')),
    matiere: matiere || 'Or',
    gramme: parseFloat(gramme || poids || 0),
    poids: parseFloat(poids || gramme || 0),
    purete: purete || '18k',
    pierre: pierre || 'Aucune',
    taille: taille || 'Unique',
    etat: etat || (isSecondHand ? 'Très bon état' : 'Neuf'),
    annee: annee ? parseInt(annee) : (isSecondHand ? new Date().getFullYear() - 5 : new Date().getFullYear()),
    nombre_proprietaires: nombre_proprietaires ? parseInt(nombre_proprietaires) : 1,
    style: style || 'Moderne',
    occasion: occasion || 'Cadeau',
    pour_qui: pour_qui || 'Femme',
    images: (images && images.length > 0) ? images : ['https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=800&auto=format&fit=crop&q=80'],
    disponibilite: effectiveDisponibilite,
    city: city || 'Casablanca',
    stock: parseInt(stock || 1),
    category_id: category_id || 'cat_rings',
    commercant_id: targetMerchantId,
    vendeur_nom: vendeur_nom || merchantUser?.shopName || merchantUser?.nom || 'Particulier Vérifié',
    vendeur_type: vendeur_type || (merchantUser?.role === 'commercant' ? 'bijouterie' : (isSecondHand ? 'particulier' : 'bijouterie')),
    vendeur_badge: vendeur_badge || (merchantUser?.subscription?.badge || '✓ Vendeur vérifié'),
    garantie: Boolean(garantie),
    facture: Boolean(facture),
    certificat: Boolean(certificat),
    boite: Boolean(boite),
    authentifie: isSecondHand ? (certificat ? 'Vérifié' : 'En attente de vérification') : 'Vérifié',
    badge: (type_vente === 'AUCTION' || req.body.type_vente === 'enchere' || effectiveDisponibilite === 'enchere') ? '🔨 ENCHÈRE EN DIRECT' : (isSecondHand ? (certificat ? '🛡️ BIJOU VÉRIFIÉ' : 'SECONDE MAIN') : 'NOUVEAU'),
    note: 5.0,
    nombre_avis: 0,
    favoris_count: 1,
    statut: statut || 'Validated',
    rejectionReason: '',
    date_creation: new Date().toISOString(),
    why_this_item: why_this_item || [
      isSecondHand ? "Pièce d'occasion sélectionnée et vérifiée par JEWELIA" : "Création neuve certifiée avec garantie joaillier",
      certificat ? "Certificat et justificatifs d'authenticité fournis" : "Poinçon officiel de garantie",
      "Livraison sécurisée avec suivi en temps réel"
    ],
    look_complementary_ids: []
  };

  if (!db.bijoux) db.bijoux = [];
  db.bijoux.unshift(newProduct);
  writeDB(db);
  res.status(201).json(newProduct);
});

app.put('/api/bijoux/:id', (req, res) => {
  const db = readDB();
  const idx = db.bijoux.findIndex(b => b.id === req.params.id);
  if (idx === -1) return res.status(404).json({ message: 'Bijou non trouvé' });

  const current = db.bijoux[idx];
  db.bijoux[idx] = {
    ...current,
    ...req.body,
    prix: req.body.prix !== undefined ? parseFloat(req.body.prix) : current.prix,
    stock: req.body.stock !== undefined ? parseInt(req.body.stock) : current.stock,
    disponibilite: req.body.stock !== undefined ? (parseInt(req.body.stock) > 0 ? 'disponible' : 'rupture') : current.disponibilite
  };

  writeDB(db);
  res.json(db.bijoux[idx]);
});

// Admin validation / Verification
app.put('/api/bijoux/:id/verify', (req, res) => {
  const { status } = req.body; // 'Vérifié', 'En attente de vérification', 'Non vérifié'
  const db = readDB();
  const product = db.bijoux.find(b => b.id === req.params.id);
  if (!product) return res.status(404).json({ message: 'Bijou non trouvé' });

  product.authentifie = status || 'Vérifié';
  if (product.authentifie === 'Vérifié') {
    product.badge = '🛡️ BIJOU VÉRIFIÉ';
  }
  writeDB(db);
  res.json(product);
});

// Reviews API
app.get('/api/reviews', (req, res) => {
  const { bijou_id } = req.query;
  const db = readDB();
  let reviews = db.reviews || [];
  if (bijou_id) {
    reviews = reviews.filter(r => r.bijou_id === bijou_id);
  }
  res.json(reviews);
});

app.post('/api/reviews', (req, res) => {
  const { bijou_id, client_id, client_nom, note, commentaire } = req.body;
  const db = readDB();
  if (!db.reviews) db.reviews = [];

  const newReview = {
    id: 'rev_' + Math.random().toString(36).substr(2, 9),
    bijou_id,
    client_id: client_id || 'u_anon',
    client_nom: client_nom || 'Client JEWELIA',
    note: parseInt(note) || 5,
    commentaire: commentaire || '',
    date: new Date().toISOString()
  };

  db.reviews.push(newReview);

  // Update product avg rating
  const product = db.bijoux.find(b => b.id === bijou_id);
  if (product) {
    const productReviews = db.reviews.filter(r => r.bijou_id === bijou_id);
    const avg = productReviews.reduce((acc, curr) => acc + curr.note, 0) / productReviews.length;
    product.note = parseFloat(avg.toFixed(1));
    product.nombre_avis = productReviews.length;
  }

  writeDB(db);
  res.status(201).json(newReview);
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

  // Update product favorites count
  const product = db.bijoux.find(b => b.id === itemId);
  if (product) {
    product.favoris_count = (product.favoris_count || 0) + (user.favoris.includes(itemId) ? 1 : -1);
    if (product.favoris_count < 0) product.favoris_count = 0;
  }

  writeDB(db);
  res.json(user.favoris);
});

// Orders & Commissions
app.post('/api/commandes', (req, res) => {
  const { client_id, client_nom, client_telephone, client_adresse, client_ville, mode_paiement, items } = req.body;
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
      type_vente: bijou.type_vente || 'FIRST_HAND',
      prix: bijou.prix,
      quantite: item.quantite,
      commercant_id: bijou.commercant_id,
      vendeur_nom: bijou.vendeur_nom || 'Vendeur Certifié',
      commission_rate: itemRate,
      commission_amount: itemCommission
    };
  });

  const now = new Date();
  const orderNumber = `JW-${now.getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;

  const newOrder = {
    id: orderNumber,
    client_id: client_id || 'u_anon',
    client_nom,
    client_telephone,
    client_adresse,
    client_ville,
    mode_paiement: mode_paiement || 'cash_on_delivery',
    items: processedItems,
    total: totalOrderAmount,
    commission: totalCommissionAmount,
    statut: 'Confirmed',
    date_commande: now.toISOString(),
    tracking_steps: [
      { title: 'Commande confirmée', date: now.toLocaleString('fr-FR'), done: true },
      { title: 'Préparation & Contrôle Qualité', date: 'En cours', done: true },
      { title: 'Expédition Sécurisée', date: 'Prévue sous 24h', done: false },
      { title: 'Livraison', date: 'En attente', done: false }
    ]
  };

  if (!db.commandes) db.commandes = [];
  db.commandes.unshift(newOrder);
  writeDB(db);
  res.status(201).json(newOrder);
});

app.get('/api/commandes', (req, res) => {
  const { client_id, merchant_id } = req.query;
  const db = readDB();
  let orders = db.commandes || [];

  if (client_id) {
    orders = orders.filter(o => o.client_id === client_id);
  }
  if (merchant_id) {
    orders = orders.filter(o => o.items && o.items.some(item => item.commercant_id === merchant_id))
      .map(o => {
        const merchantItems = (o.items || []).filter(item => item.commercant_id === merchant_id);
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
  const { status } = req.body; // Confirmed, In Preparation, Shipped, Delivered, Cancelled
  const db = readDB();
  const order = db.commandes.find(o => o.id === req.params.id);
  if (!order) return res.status(404).json({ message: 'Commande non trouvée' });

  order.statut = status;
  
  // Update tracking steps dynamically
  if (order.tracking_steps && order.tracking_steps.length >= 4) {
    if (status === 'Confirmed') {
      order.tracking_steps[0].done = true;
    } else if (status === 'In Preparation') {
      order.tracking_steps[0].done = true;
      order.tracking_steps[1].done = true;
    } else if (status === 'Shipped') {
      order.tracking_steps[0].done = true;
      order.tracking_steps[1].done = true;
      order.tracking_steps[2].done = true;
    } else if (status === 'Delivered') {
      order.tracking_steps.forEach(s => s.done = true);
    }
  }

  writeDB(db);
  res.json(order);
});

// Auctions
app.get('/api/encheres', (req, res) => {
  const db = readDB();
  const encheresList = db.encheres || [];
  const activeAuctions = encheresList.map(auc => {
    const bijou = (db.bijoux || []).find(b => b.id === auc.bijou_id);
    const bids = (db.offresEncheres || []).filter(o => o.enchere_id === auc.id);
    const highestBid = bids.reduce((max, b) => b.montant > max ? b.montant : max, auc.prix_depart);
    return {
      ...auc,
      bijou: bijou || {
        id: auc.bijou_id,
        titre: 'Lot Joaillerie d\'Exception',
        prix: auc.prix_depart,
        matiere: 'Or',
        purete: '18k',
        gramme: 5,
        city: 'Casablanca',
        images: ['https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=800&auto=format&fit=crop&q=80']
      },
      highestBid,
      bidsCount: bids.length
    };
  });
  res.json(activeAuctions);
});

app.post('/api/encheres', (req, res) => {
  const { bijou_id, prix_depart, date_debut, date_fin, increment_min, prix_reserve } = req.body;
  const db = readDB();
  if (!db.encheres) db.encheres = [];
  if (!db.offresEncheres) db.offresEncheres = [];

  // Validate jewelry belongs to merchant and exists
  const bijou = (db.bijoux || []).find(b => b.id === bijou_id);
  if (!bijou) return res.status(404).json({ message: 'Bijou non trouvé' });

  const startPrice = parseFloat(prix_depart) || parseFloat(bijou.prix) || 1000;
  const startDate = date_debut || new Date().toISOString();
  const endDate = date_fin || new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();
  const minInc = parseFloat(increment_min) || 50;

  const newAuction = {
    id: 'e_' + Math.random().toString(36).substr(2, 9),
    bijou_id,
    prix_depart: startPrice,
    date_debut: startDate,
    date_fin: endDate,
    increment_min: minInc,
    prix_reserve: prix_reserve ? parseFloat(prix_reserve) : startPrice,
    statut: 'Active'
  };

  db.encheres.push(newAuction);
  
  // Update jewelry availability to auction
  bijou.disponibilite = 'enchere';
  bijou.badge = '🔨 ENCHÈRE EN DIRECT';
  bijou.statut = 'Validated';
  
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

// ==========================================================================
// SUBSCRIPTION PLANS & MERCHANT SUBSCRIPTIONS MANAGEMENT
// ==========================================================================

// 1. Get all available subscription plans
app.get('/api/subscription-plans', (req, res) => {
  const db = readDB();
  res.json(db.subscription_plans || []);
});

// 1b. Admin create new subscription plan
app.post('/api/subscription-plans', (req, res) => {
  const db = readDB();
  if (!db.subscription_plans) db.subscription_plans = [];

  const newPlan = {
    id: 'plan_' + Math.random().toString(36).substr(2, 7),
    name: req.body.name || 'Nouveau Forfait',
    tagline: req.body.tagline || '',
    price_monthly: Number(req.body.price_monthly || 0),
    price_annual: Number(req.body.price_annual || 0),
    max_products: Number(req.body.max_products || 10),
    commission_rate: Number(req.body.commission_rate || 5),
    badge: req.body.badge || '💎 Partenaire',
    popular: !!req.body.popular,
    color: req.body.color || '#b38728',
    features: Array.isArray(req.body.features) ? req.body.features : [
      `Jusqu'à ${req.body.max_products || 10} bijoux actifs`,
      `Commission de ${req.body.commission_rate || 5}% par vente`,
      "Support prioritaire"
    ]
  };

  db.subscription_plans.push(newPlan);
  writeDB(db);
  res.json(newPlan);
});

// 2. Admin update subscription plan
app.put('/api/subscription-plans/:id', (req, res) => {
  const db = readDB();
  const planId = req.params.id;
  const planIndex = (db.subscription_plans || []).findIndex(p => p.id === planId);
  
  if (planIndex === -1) {
    return res.status(404).json({ message: 'Plan introuvable' });
  }

  const updatedPlan = {
    ...db.subscription_plans[planIndex],
    ...req.body,
    id: planId // preserve ID
  };

  db.subscription_plans[planIndex] = updatedPlan;
  writeDB(db);
  res.json(updatedPlan);
});

// 3. Get merchant subscription details & quota metrics
app.get('/api/merchants/:merchantId/subscription', (req, res) => {
  const { merchantId } = req.params;
  const db = readDB();

  const merchant = (db.users || []).find(u => u.id === merchantId);
  if (!merchant) {
    return res.status(404).json({ message: 'Commerçant introuvable' });
  }

  const plans = db.subscription_plans || [];
  const currentSub = merchant.subscription || {
    plan_id: 'plan_starter',
    plan_name: 'Pass Essentiel',
    billing_cycle: 'monthly',
    price: 0,
    status: 'active',
    start_date: new Date().toISOString(),
    end_date: new Date(Date.now() + 365 * 86400000).toISOString(),
    auto_renew: true,
    max_products: 5,
    commission_rate: 8
  };

  const currentPlan = plans.find(p => p.id === currentSub.plan_id) || plans[0] || {};
  const currentCount = (db.bijoux || []).filter(b => b.commercant_id === merchantId).length;
  const maxAllowed = currentSub.max_products || currentPlan.max_products || 5;
  const remainingSlots = Math.max(0, maxAllowed - currentCount);

  // Invoices for this merchant
  const invoices = (db.subscriptions_history || []).filter(h => h.merchant_id === merchantId);

  res.json({
    subscription: currentSub,
    plan_details: currentPlan,
    available_plans: plans,
    metrics: {
      used_slots: currentCount,
      max_slots: maxAllowed,
      remaining_slots: remainingSlots,
      usage_percentage: Math.min(100, Math.round((currentCount / maxAllowed) * 100)),
      commission_rate: currentSub.commission_rate || currentPlan.commission_rate || 8
    },
    invoices
  });
});

// 4. Merchant subscribe / upgrade / change plan
app.post('/api/merchants/:merchantId/subscribe', (req, res) => {
  const { merchantId } = req.params;
  const { plan_id, billing_cycle = 'monthly' } = req.body;
  const db = readDB();

  const merchantIndex = (db.users || []).findIndex(u => u.id === merchantId);
  if (merchantIndex === -1) {
    return res.status(404).json({ message: 'Commerçant introuvable' });
  }

  const plans = db.subscription_plans || [];
  const plan = plans.find(p => p.id === plan_id);
  if (!plan) {
    return res.status(400).json({ message: 'Forfait sélectionné invalide' });
  }

  const isAnnual = billing_cycle === 'annual';
  const price = isAnnual ? plan.price_annual : plan.price_monthly;
  const durationDays = isAnnual ? 365 : 30;

  const now = new Date();
  const endDate = new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000);

  const updatedSubscription = {
    plan_id: plan.id,
    plan_name: plan.name,
    billing_cycle,
    price,
    status: 'active',
    start_date: now.toISOString(),
    end_date: endDate.toISOString(),
    auto_renew: true,
    max_products: plan.max_products,
    commission_rate: plan.commission_rate
  };

  db.users[merchantIndex].subscription = updatedSubscription;

  // Add transaction invoice to history
  const invoice = {
    id: 'sub_tx_' + Math.random().toString(36).substr(2, 9),
    merchant_id: merchantId,
    merchant_name: db.users[merchantIndex].shopName || db.users[merchantIndex].nom,
    plan_id: plan.id,
    plan_name: plan.name,
    amount: price,
    billing_cycle,
    status: 'Paid',
    date: now.toISOString(),
    invoice_number: `INV-${now.getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`
  };

  if (!db.subscriptions_history) db.subscriptions_history = [];
  db.subscriptions_history.unshift(invoice);

  writeDB(db);

  res.json({
    message: `Félicitations ! Vous êtes désormais abonné au ${plan.name}.`,
    subscription: updatedSubscription,
    invoice
  });
});

// 5. Merchant cancel auto-renewal
app.post('/api/merchants/:merchantId/cancel-subscription', (req, res) => {
  const { merchantId } = req.params;
  const db = readDB();

  const merchantIndex = (db.users || []).findIndex(u => u.id === merchantId);
  if (merchantIndex === -1) {
    return res.status(404).json({ message: 'Commerçant introuvable' });
  }

  if (db.users[merchantIndex].subscription) {
    db.users[merchantIndex].subscription.auto_renew = false;
  }

  writeDB(db);
  res.json({ message: 'Renouvellement automatique désactivé', subscription: db.users[merchantIndex].subscription });
});

// 6. Admin get all merchant subscriptions overview
app.get('/api/subscriptions/all', (req, res) => {
  const db = readDB();
  const merchants = (db.users || []).filter(u => u.role === 'commercant');
  const plans = db.subscription_plans || [];
  const history = db.subscriptions_history || [];

  const merchantList = merchants.map(m => {
    const sub = m.subscription || {
      plan_id: 'plan_starter',
      plan_name: 'Pass Essentiel',
      billing_cycle: 'monthly',
      price: 0,
      status: 'active',
      start_date: '2026-01-01T00:00:00Z',
      end_date: '2026-12-31T23:59:59Z',
      auto_renew: true,
      max_products: 5,
      commission_rate: 8
    };
    const currentProducts = (db.bijoux || []).filter(b => b.commercant_id === m.id).length;
    return {
      id: m.id,
      shopName: m.shopName || m.nom,
      nom: m.nom,
      email: m.email,
      phone: m.phone || '',
      city: m.city || 'Casablanca',
      subscription: sub,
      current_products_count: currentProducts,
      max_products: sub.max_products || 5,
      usage_percentage: Math.min(100, Math.round((currentProducts / (sub.max_products || 5)) * 100))
    };
  });

  // Calculate MRR (Monthly Recurring Revenue) & ARR
  let mrr = 0;
  merchantList.forEach(m => {
    if (m.subscription.status === 'active') {
      if (m.subscription.billing_cycle === 'annual') {
        mrr += Math.round(m.subscription.price / 12);
      } else {
        mrr += Number(m.subscription.price || 0);
      }
    }
  });

  res.json({
    merchants: merchantList,
    plans,
    invoices: history,
    stats: {
      total_merchants: merchantList.length,
      subscribed_paying: merchantList.filter(m => (m.subscription?.price || 0) > 0).length,
      mrr,
      arr: mrr * 12,
      by_plan: {
        plan_starter: merchantList.filter(m => m.subscription?.plan_id === 'plan_starter').length,
        plan_pro: merchantList.filter(m => m.subscription?.plan_id === 'plan_pro').length,
        plan_vip: merchantList.filter(m => m.subscription?.plan_id === 'plan_vip').length
      }
    }
  });
});

// 7. Admin modify merchant subscription status or plan directly
app.put('/api/subscriptions/:merchantId/status', (req, res) => {
  const { merchantId } = req.params;
  const { status, plan_id, billing_cycle } = req.body;
  const db = readDB();

  const merchantIndex = (db.users || []).findIndex(u => u.id === merchantId);
  if (merchantIndex === -1) {
    return res.status(404).json({ message: 'Commerçant introuvable' });
  }

  const merchant = db.users[merchantIndex];
  if (!merchant.subscription) {
    merchant.subscription = {
      plan_id: 'plan_starter',
      plan_name: 'Pass Essentiel',
      billing_cycle: 'monthly',
      price: 0,
      status: 'active',
      start_date: new Date().toISOString(),
      end_date: new Date(Date.now() + 30 * 86400000).toISOString(),
      auto_renew: true,
      max_products: 5,
      commission_rate: 8
    };
  }

  if (status) {
    merchant.subscription.status = status;
  }

  if (plan_id) {
    const plan = (db.subscription_plans || []).find(p => p.id === plan_id);
    if (plan) {
      merchant.subscription.plan_id = plan.id;
      merchant.subscription.plan_name = plan.name;
      merchant.subscription.max_products = plan.max_products;
      merchant.subscription.commission_rate = plan.commission_rate;
      if (billing_cycle) {
        merchant.subscription.billing_cycle = billing_cycle;
        merchant.subscription.price = billing_cycle === 'annual' ? plan.price_annual : plan.price_monthly;
      }
    }
  }

  writeDB(db);
  res.json({ message: 'Abonnement mis à jour par l’administrateur', merchant });
});

// Static Files & Production SPA Serving with PWA headers
const mainDistPath = path.join(__dirname, '..', 'oria-main', 'dist');
const adminDistPath = path.join(__dirname, '..', 'oria-admin', 'dist');

const staticOptions = {
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.webmanifest')) {
      res.setHeader('Content-Type', 'application/manifest+json; charset=utf-8');
    }
    if (filePath.endsWith('sw.js')) {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Service-Worker-Allowed', '/');
    }
  }
};

// 1. Serve Admin SPA at /admin
if (fs.existsSync(adminDistPath)) {
  app.use('/admin', express.static(adminDistPath, staticOptions));
  app.get('/admin/*', (req, res) => {
    res.sendFile(path.join(adminDistPath, 'index.html'));
  });
}

// 2. Serve Main Marketplace SPA at /
if (fs.existsSync(mainDistPath)) {
  app.use(express.static(mainDistPath, staticOptions));
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
  console.log(`HRSDGDG Unified Server is running on http://${HOST === '0.0.0.0' ? 'localhost' : HOST}:${PORT}`);
  if (fs.existsSync(mainDistPath)) {
    console.log(`- Marketplace: http://localhost:${PORT}/`);
  }
  if (fs.existsSync(adminDistPath)) {
    console.log(`- Admin Dashboard: http://localhost:${PORT}/admin/`);
  }
  console.log(`- REST API: http://localhost:${PORT}/api/`);
});
