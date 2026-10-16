const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
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
    const parsed = JSON.parse(data);
    if (!Array.isArray(parsed.sessions)) parsed.sessions = [];
    return parsed;
  } catch (error) {
    console.error('Error reading database file:', error);
    return { users: [], categories: [], bijoux: [], encheres: [], offresEncheres: [], commandes: [], messages: [], config: {}, sessions: [] };
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

// Session Management Helpers
function createSession(user, expiresInMs = 24 * 60 * 60 * 1000) {
  const db = readDB();
  if (!Array.isArray(db.sessions)) {
    db.sessions = [];
  }
  const now = Date.now();
  // Filter out expired sessions
  db.sessions = db.sessions.filter(s => s && s.expiresAt > now);

  const token = 'sess_' + crypto.randomBytes(32).toString('hex');
  const session = {
    token,
    userId: user.id,
    email: user.email,
    nom: user.nom,
    role: user.role,
    createdAt: new Date().toISOString(),
    expiresAt: now + expiresInMs
  };
  db.sessions.push(session);
  writeDB(db);
  return session;
}

function getSession(token) {
  if (!token) return null;
  const db = readDB();
  if (!Array.isArray(db.sessions)) return null;
  const now = Date.now();
  const session = db.sessions.find(s => s && s.token === token);
  if (!session) return null;
  if (session.expiresAt <= now) {
    db.sessions = db.sessions.filter(s => s && s.token !== token);
    writeDB(db);
    return null;
  }
  return session;
}

function deleteSession(token) {
  if (!token) return;
  const db = readDB();
  if (!Array.isArray(db.sessions)) return;
  db.sessions = db.sessions.filter(s => s && s.token !== token);
  writeDB(db);
}

// Helper: Normalize Moroccan phone numbers to standard international format (+212XXXXXXXXX)
function normalizeMoroccanPhone(raw) {
  if (!raw || typeof raw !== 'string') return '';
  let cleaned = raw.replace(/[^\d+]/g, '');
  if (cleaned.startsWith('00212')) {
    cleaned = '+212' + cleaned.substring(5);
  } else if (cleaned.startsWith('212')) {
    cleaned = '+' + cleaned;
  } else if (cleaned.startsWith('0') && cleaned.length >= 10) {
    cleaned = '+212' + cleaned.substring(1);
  } else if (!cleaned.startsWith('+212') && cleaned.length === 9) {
    cleaned = '+212' + cleaned;
  }
  return cleaned;
}

// Server-side automatic 12-hour sold items archival task (runs on boot & recurring timer)
function checkAndArchiveExpiredSoldItems() {
  try {
    const db = readDB();
    const now = Date.now();
    const TWELVE_HOURS_MS = 12 * 60 * 60 * 1000;
    let modified = false;

    (db.bijoux || []).forEach(b => {
      if ((b.etat === 'Vendu' || b.disponibilite === 'vendu') && b.sold_at) {
        const soldTime = new Date(b.sold_at).getTime();
        if (now - soldTime >= TWELVE_HOURS_MS) {
          if (!b.is_publicly_hidden || b.disponibilite !== 'archive_vendu') {
            b.is_publicly_hidden = true;
            b.disponibilite = 'archive_vendu';
            b.archived_at = new Date().toISOString();
            modified = true;
          }
        }
      }
    });

    if (modified) {
      writeDB(db);
      console.log('⏰ [Auto-Archive 12h] Sold items expired and archived from public catalog.');
    }
  } catch (err) {
    console.error('Error in checkAndArchiveExpiredSoldItems:', err.message);
  }
}

// Initialize 12-hour archival task immediately & schedule every 5 minutes
checkAndArchiveExpiredSoldItems();
setInterval(checkAndArchiveExpiredSoldItems, 5 * 60 * 1000);

// Helper: Parse HTTP Cookie Header
function parseCookies(req) {
  const list = {};
  const rc = req.headers.cookie;
  if (rc) {
    rc.split(';').forEach(cookie => {
      const parts = cookie.split('=');
      if (parts.length >= 2) {
        list[parts[0].trim()] = decodeURIComponent(parts.slice(1).join('=').trim());
      }
    });
  }
  return list;
}

// Middleware: Require Admin Session
function requireAdminSession(req, res, next) {
  const cookies = parseCookies(req);
  const authHeader = req.headers['authorization'];
  const token = (authHeader && authHeader.startsWith('Bearer ')) 
    ? authHeader.substring(7).trim() 
    : (req.headers['x-session-token'] || cookies['oria_admin_session'] || req.query?.sessionToken);

  if (!token) {
    return res.status(401).json({ error: 'Accès non autorisé : session administrateur requise' });
  }

  const session = getSession(token);
  if (!session || session.role !== 'admin') {
    return res.status(403).json({ error: 'Accès refusé : privilèges administrateur requis' });
  }

  req.adminSession = session;
  next();
}



// Uploads directory and static serving
const UPLOADS_DIR = path.join(__dirname, 'data', 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}
app.use('/uploads', express.static(UPLOADS_DIR, { maxAge: '30d' }));

function processImages(images) {
  if (!images) return [];
  const list = Array.isArray(images) ? images : [images];
  return list.map(img => {
    if (typeof img === 'string' && img.startsWith('data:image/')) {
      try {
        const matches = img.match(/^data:image\/([a-zA-Z0-9+]+);base64,(.+)$/);
        if (matches) {
          const rawExt = matches[1].toLowerCase();
          const ext = rawExt === 'jpeg' ? 'jpg' : (rawExt === 'svg+xml' ? 'svg' : rawExt);
          const buffer = Buffer.from(matches[2], 'base64');
          const filename = `img_${Date.now()}_${Math.random().toString(36).substr(2, 6)}.${ext}`;
          fs.writeFileSync(path.join(UPLOADS_DIR, filename), buffer);
          return `/uploads/${filename}`;
        }
      } catch (err) {
        console.error('Failed to save base64 image:', err.message);
      }
    }
    return img;
  });
}

function processDocument(doc, prefix = 'patente') {
  if (!doc || typeof doc !== 'string') return '';
  if (doc.startsWith('/uploads/') || doc.startsWith('http')) return doc;
  if (doc.startsWith('data:')) {
    try {
      const matches = doc.match(/^data:([a-zA-Z0-9/+-]+);base64,(.+)$/);
      if (matches) {
        const mime = matches[1].toLowerCase();
        let ext = 'pdf';
        if (mime.includes('png')) ext = 'png';
        else if (mime.includes('jpeg') || mime.includes('jpg')) ext = 'jpg';
        else if (mime.includes('webp')) ext = 'webp';
        else if (mime.includes('pdf')) ext = 'pdf';

        const buffer = Buffer.from(matches[2], 'base64');
        const filename = `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 6)}.${ext}`;
        fs.writeFileSync(path.join(UPLOADS_DIR, filename), buffer);
        return `/uploads/${filename}`;
      }
    } catch (err) {
      console.error('Failed to save document:', err.message);
    }
  }
  return doc;
}

// In-memory translation cache to optimize performance
const translationCache = new Map();

function cleanTranslatedHtml(text) {
  if (!text || typeof text !== 'string') return '';
  return text
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(dec))
    .trim();
}

async function translateText(text, fromLang = 'auto', toLang = 'fr') {
  if (!text || typeof text !== 'string' || !text.trim()) return '';
  const trimmed = text.trim();
  const cacheKey = `${fromLang}->${toLang}:${trimmed}`;
  if (translationCache.has(cacheKey)) {
    return translationCache.get(cacheKey);
  }

  const sl = fromLang === 'ar' ? 'ar' : (fromLang === 'en' ? 'en' : (fromLang === 'fr' ? 'fr' : 'auto'));
  const tl = toLang === 'ar' ? 'ar' : (toLang === 'en' ? 'en' : 'fr');
  if (sl === tl) return trimmed;

  // 1. MyMemory Translation API (Highly reliable, supports FR, AR, EN)
  try {
    const pair = `${sl === 'auto' ? 'fr' : sl}|${tl}`;
    const myMemoryUrl = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(trimmed)}&langpair=${pair}&de=admin@hrsdgdg.com`;
    const mmRes = await fetch(myMemoryUrl, {
      headers: {
        'Accept': 'application/json'
      }
    });
    if (mmRes.ok) {
      const mmData = await mmRes.json();
      if (mmData && mmData.responseData && mmData.responseData.translatedText) {
        const cleaned = cleanTranslatedHtml(mmData.responseData.translatedText);
        // If MyMemory returns something valid and not an error string
        if (cleaned && !cleaned.toLowerCase().includes('mymemory warning') && !cleaned.toLowerCase().includes('quota exceeded')) {
          translationCache.set(cacheKey, cleaned);
          return cleaned;
        }
      }
    }
  } catch (err) {
    console.warn(`[Translate MyMemory] Error:`, err.message);
  }

  // 2. Google Translate GTX Fallback
  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sl}&tl=${tl}&dt=t&q=${encodeURIComponent(trimmed)}`;
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    if (response.ok) {
      const data = await response.json();
      if (Array.isArray(data) && Array.isArray(data[0])) {
        const translated = data[0].map(item => item[0]).filter(Boolean).join('');
        if (translated) {
          const cleaned = cleanTranslatedHtml(translated);
          translationCache.set(cacheKey, cleaned);
          return cleaned;
        }
      }
    }
  } catch (err) {
    console.warn(`[Translate Google] Error for "${trimmed.slice(0, 20)}":`, err.message);
  }

  return trimmed;
}

// Translation endpoint (supports single text or batch of fields)
app.post('/api/translate', async (req, res) => {
  try {
    const { text, from = 'auto', to = 'fr', fields } = req.body;

    // Single text
    if (text !== undefined) {
      const translated = await translateText(text, from, to);
      return res.json({ translatedText: translated, from, to });
    }

    // Batch dictionary of fields (e.g. { titre: "...", description: "..." })
    if (fields && typeof fields === 'object') {
      const sourceLang = from || 'ar';
      const allLangs = ['ar', 'fr'];
      const targetLangs = req.body.targets || allLangs.filter(l => l !== sourceLang);

      const translations = {};
      for (const targetLang of targetLangs) {
        translations[targetLang] = {};
        for (const [key, val] of Object.entries(fields)) {
          if (typeof val === 'string' && val.trim()) {
            translations[targetLang][key] = await translateText(val, sourceLang, targetLang);
          } else {
            translations[targetLang][key] = val || '';
          }
        }
      }

      return res.json({
        success: true,
        sourceLang,
        translations
      });
    }

    return res.status(400).json({ error: 'Texte ou champs requis' });
  } catch (error) {
    console.error('Translation error:', error);
    res.status(500).json({ error: 'Erreur lors de la traduction', message: error.message });
  }
});

// Authentication
app.post('/api/auth/login', (req, res) => {
  const { email, password, rememberMe } = req.body;
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

  // Account status validation (Admin accounts always bypass)
  if (user.role !== 'admin') {
    const status = user.account_status || (user.is_active === false ? 'en_attente' : 'actif');
    if (status === 'bloque' || user.is_blocked) {
      return res.status(403).json({
        blocked: true,
        message: user.block_reason
          ? `Compte bloqué par l'administration : ${user.block_reason}`
          : 'Votre compte a été bloqué suite à une réclamation ou non-conformité. Veuillez contacter le support.'
      });
    }
    if (status === 'en_attente' || user.is_active === false) {
      return res.status(403).json({
        pending: true,
        message: 'Votre compte professionnel est en cours de validation par un administrateur après vérification de votre patente.'
      });
    }
  }

  // Duration: 24h if rememberMe, otherwise 4h session
  const duration = rememberMe ? 24 * 60 * 60 * 1000 : 4 * 60 * 60 * 1000;
  const session = createSession(user, duration);

  if (user.role === 'admin') {
    const maxAgeSec = Math.floor(duration / 1000);
    res.setHeader('Set-Cookie', `oria_admin_session=${session.token}; Path=/; SameSite=Lax; Max-Age=${maxAgeSec}`);
  }

  // Detect if this is the user's first login / authentication
  const isFirstLogin = Boolean(
    user.premier_login === true ||
    user.doit_changer_mot_de_passe === true ||
    user.first_login === true ||
    (!user.login_count || user.login_count === 0) ||
    !user.derniere_connexion ||
    user.mot_de_passe_modifie === false
  );

  // Update user login statistics
  user.login_count = (user.login_count || 0) + 1;
  user.derniere_connexion = new Date().toISOString();
  writeDB(db);

  const { mot_de_passe, ...safeUser } = user;
  res.json({
    ...safeUser,
    first_login: isFirstLogin,
    sessionToken: session.token,
    expiresAt: session.expiresAt
  });
});

// Change Password Endpoint
app.post('/api/auth/change-password', async (req, res) => {
  const { userId, email, currentPassword, newPassword } = req.body;

  if (!newPassword || typeof newPassword !== 'string' || newPassword.trim().length < 6) {
    return res.status(400).json({ 
      success: false, 
      message: 'Le mot de passe doit comporter au moins 6 caractères.' 
    });
  }

  const db = readDB();
  const normalizedEmail = (email || '').trim().toLowerCase();
  const user = db.users.find(u => 
    (userId && u.id === userId) || 
    (normalizedEmail && (u.email || '').toLowerCase() === normalizedEmail)
  );

  if (!user) {
    return res.status(404).json({ success: false, message: 'Utilisateur introuvable.' });
  }

  // If currentPassword is provided and user already had a password, verify match
  if (currentPassword && user.mot_de_passe && user.mot_de_passe !== currentPassword) {
    return res.status(400).json({ success: false, message: 'L\'ancien mot de passe saisi est incorrect.' });
  }

  // Update password and clear first-login requirement flags
  user.mot_de_passe = newPassword.trim();
  user.premier_login = false;
  user.doit_changer_mot_de_passe = false;
  user.first_login = false;
  user.mot_de_passe_modifie = true;
  user.password_updated_at = new Date().toISOString();

  writeDB(db);

  // Sync to PostgreSQL if active
  if (isPostgresAvailable) {
    try {
      await query('UPDATE users SET mot_de_passe = $1, updated_at = NOW() WHERE id = $2', [user.mot_de_passe, user.id]);
    } catch (pgErr) {
      console.warn('PostgreSQL password update warning:', pgErr.message);
    }
  }

  const { mot_de_passe: _, ...safeUser } = user;
  res.json({
    success: true,
    message: 'Votre mot de passe a été modifié avec succès.',
    user: {
      ...safeUser,
      first_login: false,
      premier_login: false,
      doit_changer_mot_de_passe: false
    }
  });
});

// Dismiss First Login Modal (Save choice to not ask again)
app.post('/api/auth/dismiss-first-login', (req, res) => {
  const { userId, email } = req.body;
  const db = readDB();
  const normalizedEmail = (email || '').trim().toLowerCase();
  const user = db.users.find(u => 
    (userId && u.id === userId) || 
    (normalizedEmail && (u.email || '').toLowerCase() === normalizedEmail)
  );

  if (user) {
    user.premier_login = false;
    user.doit_changer_mot_de_passe = false;
    user.first_login = false;
    writeDB(db);
  }
  res.json({ success: true });
});

// Verify active session
app.post('/api/auth/verify-session', (req, res) => {
  const cookies = parseCookies(req);
  const authHeader = req.headers['authorization'];
  const token = (authHeader && authHeader.startsWith('Bearer ')) 
    ? authHeader.substring(7).trim() 
    : (req.headers['x-session-token'] || cookies['oria_admin_session'] || req.body?.token);

  if (!token) {
    return res.status(401).json({ valid: false, message: 'Aucun jeton de session fourni' });
  }

  const session = getSession(token);
  if (!session) {
    return res.status(401).json({ valid: false, message: 'Session expirée ou invalide' });
  }

  const db = readDB();
  const user = db.users.find(u => u.id === session.userId);
  if (!user) {
    return res.status(401).json({ valid: false, message: 'Utilisateur introuvable' });
  }

  const { mot_de_passe, ...safeUser } = user;
  res.json({
    valid: true,
    user: safeUser,
    sessionToken: session.token,
    expiresAt: session.expiresAt
  });
});

// Invalidate session (Logout)
app.post('/api/auth/logout', (req, res) => {
  const cookies = parseCookies(req);
  const authHeader = req.headers['authorization'];
  const token = (authHeader && authHeader.startsWith('Bearer ')) 
    ? authHeader.substring(7).trim() 
    : (req.headers['x-session-token'] || cookies['oria_admin_session'] || req.body?.token);

  if (token) {
    deleteSession(token);
  }
  res.setHeader('Set-Cookie', 'oria_admin_session=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; Max-Age=0');
  res.json({ success: true, message: 'Session déconnectée avec succès' });
});

app.post('/api/auth/register', (req, res) => {
  const { 
    email, 
    nom, 
    mot_de_passe, 
    shopName, 
    phone, 
    address, 
    city, 
    plan_id, 
    billing_cycle,
    numero_patente,
    numeroPatente,
    patente_document,
    patenteDocument,
    patente_filename,
    patenteFileName
  } = req.body;
  const db = readDB();
  
  const userPhone = (phone || '').trim();
  const cleanPhone = userPhone.replace(/\D/g, '');
  const userEmail = (email && email.trim()) ? email.trim() : (cleanPhone ? `pro_${cleanPhone}@hrsdgdg.ma` : `pro_${Date.now()}@hrsdgdg.ma`);
  const userPass = (mot_de_passe && mot_de_passe.trim()) ? mot_de_passe.trim() : `Pro!${Math.random().toString(36).slice(-8)}*Gold`;

  const rawDoc = patente_document || patenteDocument || '';
  const savedDocUrl = processDocument(rawDoc, 'patente');
  const numPatente = (numero_patente || numeroPatente || '').trim();

  // If phone/email already submitted, update the existing pending request
  const existingUser = db.users.find(u => u.email === userEmail || (cleanPhone && (u.phone || '').replace(/\D/g, '') === cleanPhone));
  if (existingUser) {
    existingUser.nom = nom || existingUser.nom;
    existingUser.shopName = shopName || existingUser.shopName;
    existingUser.phone = userPhone || existingUser.phone;
    existingUser.telephone = userPhone || existingUser.telephone;
    existingUser.city = city || existingUser.city;
    existingUser.ville = city || existingUser.ville;
    existingUser.numero_patente = numPatente || existingUser.numero_patente;
    if (savedDocUrl) existingUser.patente_document = savedDocUrl;
    existingUser.account_status = 'en_attente';
    existingUser.verification_status = 'en_attente_validation';
    writeDB(db);
    return res.status(200).json({ success: true, message: 'Un administrateur va vous contacter pour validation du compte', user: existingUser });
  }

  const newUser = {
    id: 'u_' + Math.random().toString(36).substr(2, 9),
    email: userEmail,
    nom,
    mot_de_passe: userPass,
    role: 'commercant', // Inscription strictement réservée aux professionnels
    is_professional: true,
    shopName: shopName || nom,
    phone: userPhone,
    telephone: userPhone,
    city: city || 'Casablanca',
    ville: city || 'Casablanca',
    address: address || city || '',
    seller_type: 'bijouterie',
    numero_patente: numPatente,
    patente_document: savedDocUrl,
    patente_filename: patente_filename || patenteFileName || (numPatente ? `Patente_${numPatente}` : 'Patente_Officielle.pdf'),
    account_status: 'en_attente', // Tout compte créé doit être activé par un administrateur
    is_active: false,
    is_blocked: false,
    block_reason: '',
    verification_status: 'en_attente_validation',
    created_at: new Date().toISOString(),
    badges: ['Professionnel Agréé', 'Patente Déposée'],
    favoris: [],
    premier_login: true,
    doit_changer_mot_de_passe: true,
    first_login: true,
    login_count: 0
  };

  // Setup initial subscription
  const plans = db.subscription_plans || [];
  const selectedPlan = plans.find(p => p.id === plan_id) || plans.find(p => p.id === 'plan_pro') || plans[0] || {
    id: 'plan_starter',
    name: 'Pass Essentiel',
    price_monthly: 0,
    price_annual: 0,
    max_products: 5,
    commission_rate: 8
  };

  const cycle = billing_cycle === 'annual' ? 'annual' : 'monthly';
  const price = cycle === 'annual' ? Number(selectedPlan.price_annual || 0) : Number(selectedPlan.price_monthly || 0);
  const durationDays = cycle === 'annual' ? 365 : 30;
  const now = new Date();
  const endDate = new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000);

  newUser.subscription = {
    plan_id: selectedPlan.id,
    plan_name: selectedPlan.name,
    billing_cycle: cycle,
    price: price,
    status: 'active',
    start_date: now.toISOString(),
    end_date: endDate.toISOString(),
    auto_renew: true,
    max_products: Number(selectedPlan.max_products || 5),
    commission_rate: Number(selectedPlan.commission_rate || 8)
  };

  // If paid plan, generate invoice in history
  if (price > 0) {
    if (!db.subscriptions_history) db.subscriptions_history = [];
    db.subscriptions_history.unshift({
      id: 'sub_tx_' + Math.random().toString(36).substr(2, 9),
      merchant_id: newUser.id,
      merchant_name: newUser.shopName,
      plan_id: selectedPlan.id,
      plan_name: selectedPlan.name,
      amount: price,
      billing_cycle: cycle,
      status: 'Paid',
      date: now.toISOString(),
      invoice_number: `INV-${now.getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`
    });
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
  const { 
    email, 
    nom, 
    mot_de_passe, 
    role, 
    shopName, 
    phone, 
    address, 
    city, 
    plan_id, 
    billing_cycle,
    numero_patente,
    numeroPatente,
    patente_document,
    patenteDocument,
    patente_filename
  } = req.body;
  const db = readDB();
  
  if (db.users.some(u => u.email === email)) {
    return res.status(400).json({ message: 'Cet email est déjà enregistré' });
  }

  const rawDoc = patente_document || patenteDocument || '';
  const savedDocUrl = processDocument(rawDoc, 'patente');
  const numPatente = (numero_patente || numeroPatente || '').trim();

  const newUser = {
    id: 'u_' + Math.random().toString(36).substr(2, 9),
    email,
    nom,
    mot_de_passe: mot_de_passe || 'password123',
    role: role || 'commercant',
    phone: phone || '',
    telephone: phone || '',
    is_professional: role === 'commercant' || true,
    numero_patente: numPatente,
    patente_document: savedDocUrl,
    patente_filename: patente_filename || (numPatente ? `Patente_${numPatente}` : 'Patente_Officielle.pdf'),
    favoris: [],
    premier_login: true,
    doit_changer_mot_de_passe: true,
    first_login: true,
    login_count: 0
  };

  if (newUser.role === 'commercant') {
    newUser.shopName = shopName || nom;
    newUser.address = address || '';
    newUser.city = city || '';
    newUser.seller_type = 'bijouterie';
    newUser.badges = ['Vendeur vérifié'];

    // Setup initial subscription for merchant created by Admin
    const plans = db.subscription_plans || [];
    const selectedPlan = plans.find(p => p.id === plan_id) || plans.find(p => p.id === 'plan_starter') || plans[0] || {
      id: 'plan_starter',
      name: 'Pass Essentiel',
      price_monthly: 0,
      price_annual: 0,
      max_products: 5,
      commission_rate: 8
    };

    const cycle = billing_cycle === 'annual' ? 'annual' : 'monthly';
    const price = cycle === 'annual' ? Number(selectedPlan.price_annual || 0) : Number(selectedPlan.price_monthly || 0);
    const durationDays = cycle === 'annual' ? 365 : 30;
    const now = new Date();
    const endDate = new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000);

    newUser.subscription = {
      plan_id: selectedPlan.id,
      plan_name: selectedPlan.name,
      billing_cycle: cycle,
      price: price,
      status: 'active',
      start_date: now.toISOString(),
      end_date: endDate.toISOString(),
      auto_renew: true,
      max_products: Number(selectedPlan.max_products || 5),
      commission_rate: Number(selectedPlan.commission_rate || 8)
    };

    if (price > 0) {
      if (!db.subscriptions_history) db.subscriptions_history = [];
      db.subscriptions_history.unshift({
        id: 'sub_tx_' + Math.random().toString(36).substr(2, 9),
        merchant_id: newUser.id,
        merchant_name: newUser.shopName,
        plan_id: selectedPlan.id,
        plan_name: selectedPlan.name,
        amount: price,
        billing_cycle: cycle,
        status: 'Paid',
        date: now.toISOString(),
        invoice_number: `INV-${now.getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`
      });
    }
  }

  db.users.push(newUser);
  writeDB(db);
  res.status(201).json(newUser);
});

app.put('/api/users/:id', (req, res) => {
  const { 
    email, 
    nom, 
    mot_de_passe, 
    role, 
    shopName, 
    phone, 
    address, 
    city, 
    plan_id, 
    billing_cycle,
    numero_patente,
    numeroPatente,
    patente_document,
    patenteDocument,
    patente_filename
  } = req.body;
  const db = readDB();
  const user = db.users.find(u => u.id === req.params.id);
  if (!user) return res.status(404).json({ message: 'Utilisateur non trouvé' });

  if (email && email !== user.email && db.users.some(u => u.email === email)) {
    return res.status(400).json({ message: 'Cet email est déjà enregistré' });
  }

  if (email) user.email = email;
  if (nom) user.nom = nom;
  if (mot_de_passe) user.mot_de_passe = mot_de_passe;
  if (role) user.role = role;
  if (shopName) user.shopName = shopName;
  if (phone !== undefined) {
    user.phone = phone;
    user.telephone = phone;
  }
  if (address) user.address = address;
  if (city) user.city = city;
  
  if (numero_patente !== undefined || numeroPatente !== undefined) {
    user.numero_patente = (numero_patente || numeroPatente || '').trim();
  }
  if (patente_document !== undefined || patenteDocument !== undefined) {
    const rawDoc = patente_document || patenteDocument || '';
    user.patente_document = processDocument(rawDoc, 'patente');
  }
  if (patente_filename !== undefined) {
    user.patente_filename = patente_filename;
  }

  user.email = email || user.email;
  user.nom = nom || user.nom;
  user.mot_de_passe = mot_de_passe || user.mot_de_passe;
  user.role = role || user.role;

  if (user.role === 'commercant') {
    user.shopName = shopName || user.shopName || user.nom;
    if (phone) {
      user.phone = phone;
      user.telephone = phone;
    }
    user.address = address || user.address || '';
    user.city = city || user.city || '';

    if (plan_id) {
      const plans = db.subscription_plans || [];
      const plan = plans.find(p => p.id === plan_id);
      if (plan) {
        if (!user.subscription) user.subscription = {};
        user.subscription.plan_id = plan.id;
        user.subscription.plan_name = plan.name;
        user.subscription.max_products = Number(plan.max_products || 5);
        user.subscription.commission_rate = Number(plan.commission_rate || 8);
        if (billing_cycle) {
          user.subscription.billing_cycle = billing_cycle;
          user.subscription.price = billing_cycle === 'annual' ? Number(plan.price_annual || 0) : Number(plan.price_monthly || 0);
        }
      }
    }
  } else {
    delete user.shopName;
    delete user.address;
    delete user.city;
  }

  // Account status & blocking handling
  if (req.body.account_status !== undefined) {
    user.account_status = req.body.account_status;
    user.is_active = req.body.account_status === 'actif';
    if (req.body.account_status === 'bloque') {
      user.is_blocked = true;
      user.block_reason = req.body.block_reason || user.block_reason || 'Bloqué suite à une réclamation';
    } else {
      user.is_blocked = false;
      if (req.body.account_status === 'actif') {
        user.verification_status = 'verifie';
      }
    }
  }
  if (req.body.block_reason !== undefined) {
    user.block_reason = req.body.block_reason;
  }
  if (req.body.is_active !== undefined) {
    user.is_active = Boolean(req.body.is_active);
    user.account_status = user.is_active ? 'actif' : (user.account_status || 'en_attente');
  }

  writeDB(db);
  res.json(user);
});

// Dedicated Account Status & Block/Activate Endpoint
app.put('/api/users/:id/status', (req, res) => {
  const { status, account_status, block_reason, reason } = req.body;
  const db = readDB();
  const user = db.users.find(u => u.id === req.params.id);
  if (!user) return res.status(404).json({ message: 'Utilisateur non trouvé' });

  const targetStatus = account_status || status || 'actif';
  user.account_status = targetStatus;
  user.is_active = targetStatus === 'actif';

  if (targetStatus === 'bloque') {
    user.is_blocked = true;
    user.block_reason = block_reason || reason || 'Compte bloqué suite à une réclamation ou non-conformité';
  } else if (targetStatus === 'actif') {
    user.is_blocked = false;
    user.block_reason = '';
    user.verification_status = 'verifie';
  } else {
    user.is_blocked = false;
    user.account_status = 'en_attente';
    user.verification_status = 'en_attente_validation';
  }

  writeDB(db);
  res.json({ success: true, message: `Statut du compte mis à jour: ${targetStatus}`, user });
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

app.put('/api/categories/:id', (req, res) => {
  const { id } = req.params;
  const { nom_fr, nom_ar, nom_en, icon } = req.body;
  const db = readDB();
  const idx = db.categories.findIndex(c => c.id === id);
  if (idx === -1) return res.status(404).json({ message: 'Catégorie non trouvée' });

  db.categories[idx] = {
    ...db.categories[idx],
    nom_fr: nom_fr !== undefined ? nom_fr : db.categories[idx].nom_fr,
    nom_ar: nom_ar !== undefined ? nom_ar : db.categories[idx].nom_ar,
    nom_en: nom_en !== undefined ? nom_en : db.categories[idx].nom_en,
    icon: icon !== undefined ? icon : db.categories[idx].icon
  };

  writeDB(db);
  res.json(db.categories[idx]);
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

  // 12-hour visibility filter for sold items in public catalog
  const now = Date.now();
  const TWELVE_HOURS_MS = 12 * 60 * 60 * 1000;
  const isInternalOrSeller = !!commercant || req.query.includeSold === 'true' || req.query.adminView === 'true';

  if (!isInternalOrSeller) {
    results = results.filter(b => {
      // If manually archived or marked as hidden
      if (b.is_publicly_hidden) return false;
      // If sold, check if 12h deadline has expired
      if (b.etat === 'Vendu' || b.disponibilite === 'vendu' || b.disponibilite === 'archive_vendu') {
        if (!b.sold_at) return true; // Keep visible as Vendu if sold_at not set yet
        const soldTime = new Date(b.sold_at).getTime();
        return (now - soldTime) < TWELVE_HOURS_MS;
      }
      return true;
    });
  }

  // Sort from newest to oldest (du récent vers le plus ancien)
  results.sort((a, b) => {
    const dateA = new Date(a.date_creation || a.created_at || 0).getTime();
    const dateB = new Date(b.date_creation || b.created_at || 0).getTime();
    if (dateB !== dateA) return dateB - dateA;
    return String(b.id || '').localeCompare(String(a.id || ''), undefined, { numeric: true });
  });

  const usersMap = new Map((db.users || []).map(u => [u.id, u]));
  const enrichedResults = results.map(b => {
    const seller = usersMap.get(b.commercant_id) || usersMap.get(b.vendeur_id);
    const sellerPhone = b.vendeur_phone || b.telephone || seller?.phone || seller?.telephone || '';
    const sellerNom = b.vendeur_nom || seller?.shopName || seller?.nom || 'Particulier Vérifié';
    return {
      ...b,
      gramme: b.gramme !== undefined ? b.gramme : (b.poids !== undefined ? b.poids : null),
      vendeur_phone: sellerPhone,
      vendeur_nom: sellerNom
    };
  });

  res.json(enrichedResults);
});

app.get('/api/bijoux/:id', (req, res) => {
  const db = readDB();
  const product = db.bijoux.find(b => b.id === req.params.id);
  if (!product) return res.status(404).json({ message: 'Bijou non trouvé' });
  
  const now = Date.now();
  const TWELVE_HOURS_MS = 12 * 60 * 60 * 1000;
  const isSold = product.etat === 'Vendu' || product.disponibilite === 'vendu' || product.disponibilite === 'archive_vendu';
  const isExpired = isSold && product.sold_at && (now - new Date(product.sold_at).getTime() >= TWELVE_HOURS_MS);

  if (isExpired && req.query.adminView !== 'true') {
    return res.status(410).json({ 
      error: 'Article Vendu', 
      message: 'Cet article a été vendu et archivé du catalogue public.',
      isSold: true,
      sold_at: product.sold_at,
      product: { ...product, is_archived_sold: true, etat: 'Vendu' }
    });
  }

  const seller = (db.users || []).find(u => u.id === product.commercant_id || u.id === product.vendeur_id);
  const sellerPhone = product.vendeur_phone || product.telephone || seller?.phone || seller?.telephone || '';
  const sellerNom = product.vendeur_nom || seller?.shopName || seller?.nom || 'Particulier Vérifié';

  // Attach reviews
  const reviews = (db.reviews || []).filter(r => r.bijou_id === product.id);
  res.json({ 
    ...product,
    gramme: product.gramme !== undefined ? product.gramme : (product.poids !== undefined ? product.poids : null),
    vendeur_phone: sellerPhone, 
    vendeur_nom: sellerNom, 
    customer_reviews: reviews 
  });
});

// Sale confirmation endpoint (immediately switches state to 'Vendu', records sold_at, prevents double-sale)
app.post('/api/bijoux/:id/vendre', (req, res) => {
  const { id } = req.params;
  const db = readDB();
  const bijou = (db.bijoux || []).find(b => b.id === id);

  if (!bijou) {
    return res.status(404).json({ error: 'Bijou introuvable' });
  }

  // Anti-double-sale check
  if (bijou.etat === 'Vendu' || bijou.disponibilite === 'vendu' || bijou.disponibilite === 'archive_vendu') {
    return res.status(409).json({ 
      error: 'Article déjà vendu', 
      message: `Cet article a déjà été vendu le ${new Date(bijou.sold_at || Date.now()).toLocaleString('fr-FR')}. Impossible de le revendre.`,
      sold_at: bijou.sold_at,
      etat: 'Vendu'
    });
  }

  const now = new Date();
  const transactionId = req.body.transaction_id || `TRX-${now.getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;
  const soldPrice = parseFloat(req.body.prix) || bijou.prix;
  const buyerNom = req.body.buyer_nom || req.body.client_nom || 'Client Direct';
  const buyerPhone = normalizeMoroccanPhone(req.body.buyer_phone || req.body.client_telephone || '');

  bijou.etat = 'Vendu';
  bijou.disponibilite = 'vendu';
  bijou.stock = 0;
  bijou.sold_at = now.toISOString();
  bijou.sold_price = soldPrice;
  bijou.transaction_id = transactionId;
  bijou.buyer_nom = buyerNom;
  bijou.buyer_phone = buyerPhone;

  // Add to sales_history for audit and admin tracking
  if (!Array.isArray(db.sales_history)) {
    db.sales_history = [];
  }
  const saleRecord = {
    id: `sale_${Date.now()}`,
    transaction_id: transactionId,
    bijou_id: bijou.id,
    titre: bijou.titre,
    reference: bijou.id,
    vendeur_id: bijou.commercant_id || 'u_merchant1',
    vendeur_nom: bijou.vendeur_nom || 'Vendeur Certifié',
    prix_vente: soldPrice,
    gramme: bijou.gramme || bijou.poids || 0,
    date_vente: now.toISOString(),
    etat: 'Vendu',
    buyer_nom: buyerNom,
    buyer_phone: buyerPhone
  };
  db.sales_history.unshift(saleRecord);

  writeDB(db);

  res.json({
    success: true,
    message: 'Vente confirmée avec succès. L\'état de l\'article est désormais "Vendu" et restera visible 12 heures dans le catalogue public avant masquage automatique.',
    bijou,
    saleRecord
  });
});

// Sales history endpoint for administrative and tracking purposes
app.get('/api/sales-history', (req, res) => {
  const db = readDB();
  const { merchant_id } = req.query;
  
  const historyMap = new Map();

  (db.sales_history || []).forEach(s => {
    historyMap.set(`${s.bijou_id}_${s.date_vente || s.transaction_id}`, s);
  });

  (db.bijoux || []).filter(b => b.etat === 'Vendu' || b.sold_at).forEach(b => {
    const key = `${b.id}_${b.sold_at || 'sale'}`;
    if (!historyMap.has(key)) {
      historyMap.set(key, {
        id: `sale_${b.id}`,
        transaction_id: b.transaction_id || b.sold_order_id || `TRX-${b.id}`,
        bijou_id: b.id,
        titre: b.titre,
        reference: b.id,
        vendeur_id: b.commercant_id,
        vendeur_nom: b.vendeur_nom || 'Vendeur Certifié',
        prix_vente: b.sold_price || b.prix,
        gramme: b.gramme || b.poids || 0,
        date_vente: b.sold_at || b.date_creation,
        etat: 'Vendu',
        buyer_nom: b.buyer_nom || 'Client Marketplace',
        buyer_phone: b.buyer_phone || ''
      });
    }
  });

  let allSales = Array.from(historyMap.values());
  if (merchant_id) {
    allSales = allSales.filter(s => s.vendeur_id === merchant_id);
  }

  allSales.sort((a, b) => new Date(b.date_vente || 0).getTime() - new Date(a.date_vente || 0).getTime());
  res.json(allSales);
});

app.post('/api/bijoux', (req, res) => {
  const { 
    titre, 
    titre_fr,
    titre_ar,
    titre_en,
    description, 
    description_fr,
    description_ar,
    description_en,
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

  const finalTitreFr = titre_fr || titre || '';
  const finalDescFr = description_fr || description || '';

  const newProduct = {
    id: 'b_' + Math.random().toString(36).substr(2, 9),
    titre: finalTitreFr,
    titre_fr: finalTitreFr,
    titre_ar: titre_ar || '',
    titre_en: titre_en || '',
    description: finalDescFr,
    description_fr: finalDescFr,
    description_ar: description_ar || '',
    description_en: description_en || '',
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
    images: (processImages(images) && processImages(images).length > 0) ? processImages(images) : ['https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=800&auto=format&fit=crop&q=80'],
    video: req.body.video || null,
    disponibilite: effectiveDisponibilite,
    city: city || 'Casablanca',
    stock: (stock !== undefined && stock !== null && stock !== '') ? (parseInt(stock) || 1) : 1,
    category_id: category_id || 'cat_rings',
    commercant_id: targetMerchantId,
    vendeur_nom: vendeur_nom || merchantUser?.shopName || merchantUser?.nom || 'Particulier Vérifié',
    vendeur_phone: req.body.vendeur_phone || merchantUser?.phone || merchantUser?.telephone || '',
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
  const updatedTitreFr = req.body.titre_fr !== undefined ? req.body.titre_fr : (req.body.titre !== undefined ? req.body.titre : current.titre_fr);
  const updatedDescFr = req.body.description_fr !== undefined ? req.body.description_fr : (req.body.description !== undefined ? req.body.description : current.description_fr);
  const updatedImages = req.body.images !== undefined ? processImages(req.body.images) : current.images;

  db.bijoux[idx] = {
    ...current,
    ...req.body,
    images: updatedImages,
    titre: updatedTitreFr || current.titre,
    titre_fr: updatedTitreFr || current.titre_fr,
    titre_ar: req.body.titre_ar !== undefined ? req.body.titre_ar : current.titre_ar,
    titre_en: req.body.titre_en !== undefined ? req.body.titre_en : current.titre_en,
    description: updatedDescFr || current.description,
    description_fr: updatedDescFr || current.description_fr,
    description_ar: req.body.description_ar !== undefined ? req.body.description_ar : current.description_ar,
    description_en: req.body.description_en !== undefined ? req.body.description_en : current.description_en,
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

// Orders & Commissions (with atomic double-sale prevention and sold_at tracking)
app.post('/api/commandes', (req, res) => {
  const { client_id, client_nom, client_adresse, client_ville, mode_paiement, items } = req.body;
  const client_telephone = normalizeMoroccanPhone(req.body.client_telephone || '');
  const db = readDB();

  // 1. Strict anti-double-sale verification
  for (let item of items) {
    const bijou = db.bijoux.find(b => b.id === item.bijou_id);
    if (!bijou) {
      return res.status(404).json({ error: 'Bijou introuvable', message: `Le bijou '${item.titre}' est introuvable.` });
    }
    if (bijou.etat === 'Vendu' || bijou.disponibilite === 'vendu' || bijou.disponibilite === 'archive_vendu' || (bijou.stock !== undefined && bijou.stock < item.quantite)) {
      return res.status(409).json({ 
        error: 'Article déjà vendu', 
        message: `L'article "${bijou.titre}" (Réf: ${bijou.id}) a déjà été vendu et n'est plus disponible.` 
      });
    }
    if (bijou.statut !== 'Validated') {
      return res.status(400).json({ message: `Le bijou '${item.titre}' n'est pas encore validé.` });
    }
  }

  // 2. Process commission configurations
  const globalRate = db.config.commission_globale || 5;
  const catRates = db.config.commission_categories || {};
  const merchantRates = db.config.commission_commercants || {};

  let totalOrderAmount = 0;
  let totalCommissionAmount = 0;
  const now = new Date();
  const orderNumber = `JW-${now.getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;

  if (!Array.isArray(db.sales_history)) {
    db.sales_history = [];
  }

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

    // Deduct stock and switch to Vendu
    bijou.stock = (bijou.stock || 1) - item.quantite;
    if (bijou.stock <= 0) {
      bijou.stock = 0;
      bijou.etat = 'Vendu';
      bijou.disponibilite = 'vendu';
      bijou.sold_at = now.toISOString();
      bijou.sold_order_id = orderNumber;
      bijou.transaction_id = orderNumber;
      bijou.sold_price = bijou.prix;
      bijou.buyer_nom = client_nom;
      bijou.buyer_phone = client_telephone;
    }

    // Record in sales history
    db.sales_history.unshift({
      id: `sale_${orderNumber}_${bijou.id}`,
      transaction_id: orderNumber,
      bijou_id: bijou.id,
      titre: bijou.titre,
      reference: bijou.id,
      vendeur_id: bijou.commercant_id,
      vendeur_nom: bijou.vendeur_nom || 'Vendeur Certifié',
      prix_vente: bijou.prix,
      gramme: bijou.gramme || bijou.poids || 0,
      date_vente: now.toISOString(),
      etat: 'Vendu',
      buyer_nom: client_nom,
      buyer_phone: client_telephone
    });

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
      { title: 'Expédition Sécurisée', date: 'Prise en charge logistique', done: false },
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
app.get('/api/config', async (req, res) => {
  const defaultConfig = { commission_globale: 5, commission_categories: {}, commission_commercants: {} };
  try {
    if (isPostgresAvailable()) {
      const pgRes = await query(`SELECT value FROM system_config WHERE key = 'platform_config'`);
      if (pgRes && pgRes.rows && pgRes.rows.length > 0) {
        const val = pgRes.rows[0].value;
        return res.json({ ...defaultConfig, ...val });
      }
    }
  } catch (err) {
    console.error('Error reading config from PostgreSQL:', err.message);
  }
  const db = readDB();
  res.json({ ...defaultConfig, ...(db.config || {}) });
});

app.put('/api/config', async (req, res) => {
  const newConfig = {
    commission_globale: parseInt(req.body.commission_globale, 10) || 5,
    commission_categories: req.body.commission_categories || {},
    commission_commercants: req.body.commission_commercants || {}
  };

  try {
    if (isPostgresAvailable()) {
      await query(`
        INSERT INTO system_config (key, value, updated_at) 
        VALUES ('platform_config', $1, CURRENT_TIMESTAMP)
        ON CONFLICT (key) DO UPDATE 
        SET value = $1, updated_at = CURRENT_TIMESTAMP
      `, [JSON.stringify(newConfig)]);
    }
  } catch (err) {
    console.error('Error writing config to PostgreSQL:', err.message);
  }

  const db = readDB();
  db.config = {
    ...(db.config || {}),
    ...newConfig
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
app.get('/api/stats/admin', requireAdminSession, (req, res) => {
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

  const max_products = Number(req.body.max_products || 10);
  const commission_rate = Number(req.body.commission_rate || 5);

  const newPlan = {
    id: 'plan_' + Math.random().toString(36).substr(2, 7),
    name: req.body.name || 'Nouveau Forfait',
    name_fr: req.body.name || 'Nouveau Forfait',
    name_ar: req.body.name_ar || req.body.name || 'باقة جديدة',
    tagline: req.body.tagline || 'Formule sur mesure pour bijoutiers',
    price_monthly: Number(req.body.price_monthly || 0),
    price_annual: Number(req.body.price_annual || 0),
    max_products: max_products,
    commission_rate: commission_rate,
    badge: req.body.badge || '💎 Partenaire',
    popular: !!req.body.popular,
    color: req.body.color || '#b38728',
    features: Array.isArray(req.body.features) && req.body.features.length > 0 ? req.body.features : [
      `Jusqu'à ${max_products > 1000 ? 'Illimité' : max_products} bijoux actifs`,
      `Commission de ${commission_rate}% par vente`,
      "Mise en avant et support prioritaire"
    ]
  };

  db.subscription_plans.push(newPlan);
  writeDB(db);
  res.status(201).json(newPlan);
});

// 2. Admin update subscription plan
app.put('/api/subscription-plans/:id', (req, res) => {
  const db = readDB();
  const planId = req.params.id;
  const planIndex = (db.subscription_plans || []).findIndex(p => p.id === planId);
  
  if (planIndex === -1) {
    return res.status(404).json({ message: 'Plan introuvable' });
  }

  const existing = db.subscription_plans[planIndex];
  const max_products = req.body.max_products !== undefined ? Number(req.body.max_products) : existing.max_products;
  const commission_rate = req.body.commission_rate !== undefined ? Number(req.body.commission_rate) : existing.commission_rate;

  const updatedPlan = {
    ...existing,
    ...req.body,
    price_monthly: req.body.price_monthly !== undefined ? Number(req.body.price_monthly) : existing.price_monthly,
    price_annual: req.body.price_annual !== undefined ? Number(req.body.price_annual) : existing.price_annual,
    max_products,
    commission_rate,
    id: planId // preserve ID
  };

  db.subscription_plans[planIndex] = updatedPlan;
  writeDB(db);
  res.json(updatedPlan);
});

// 2b. Admin delete subscription plan
app.delete('/api/subscription-plans/:id', (req, res) => {
  const db = readDB();
  const planId = req.params.id;
  const planIndex = (db.subscription_plans || []).findIndex(p => p.id === planId);

  if (planIndex === -1) {
    return res.status(404).json({ message: 'Plan introuvable' });
  }

  const deleted = db.subscription_plans.splice(planIndex, 1)[0];
  writeDB(db);
  res.json({ message: 'Plan supprimé avec succès', plan: deleted });
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

// ==========================================
// GOLD RATES & HISTORY API (EXCLUSIVE OR 18K)
// ==========================================

// Public: Get current precious metals rates (Or 18K & Argent 925) and history
app.get('/api/gold-rates', (req, res) => {
  const db = readDB();
  const goldRates = db.goldRates || {
    currentPrice18k: 1045,
    currentPriceSilver: 14.50,
    carat: '18K',
    unit: 'MAD/g',
    silverUnit: 'MAD/g',
    lastUpdated: new Date().toISOString(),
    updatedBy: 'Admin',
    history: []
  };

  const currentPrice18k = Number(goldRates.currentPrice18k) || 1045;
  const currentPriceSilver = Number(goldRates.currentPriceSilver) || 14.50;

  res.json({
    success: true,
    currentPrice18k,
    currentPriceSilver,
    carat: '18K',
    unit: goldRates.unit || 'MAD/g',
    silverUnit: goldRates.silverUnit || 'MAD/g',
    lastUpdated: goldRates.lastUpdated,
    updatedBy: goldRates.updatedBy || 'Administration',
    history: goldRates.history || []
  });
});

// Admin: Update rates (Or 18K & Argent 925) & record history
app.post('/api/admin/gold-rates', requireAdminSession, (req, res) => {
  const { price18k, price, price24k, priceSilver, source, note, updatedBy } = req.body;
  const db = readDB();
  if (!db.goldRates) {
    db.goldRates = {
      currentPrice18k: 1045,
      currentPriceSilver: 14.50,
      carat: '18K',
      unit: 'MAD/g',
      silverUnit: 'MAD/g',
      lastUpdated: new Date().toISOString(),
      updatedBy: 'Admin',
      history: []
    };
  }

  const now = new Date();
  const dateFormatted = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  let updatedRates = {};

  // Handle Silver (Argent) update
  if (priceSilver !== undefined && priceSilver !== null && priceSilver !== '') {
    const numSilver = parseFloat(priceSilver);
    if (isNaN(numSilver) || numSilver <= 0) {
      return res.status(400).json({ error: 'Le prix de l\'argent doit être un nombre positif valide (ex: 14.50).' });
    }
    db.goldRates.currentPriceSilver = numSilver;
    db.goldRates.silverUnit = 'MAD/g';
    updatedRates.currentPriceSilver = numSilver;
  }

  // Handle Gold (Or 18K) update
  const rawGoldPrice = price18k || price || price24k;
  if (rawGoldPrice !== undefined && rawGoldPrice !== null && rawGoldPrice !== '') {
    const numPrice = parseFloat(rawGoldPrice);
    if (isNaN(numPrice) || numPrice <= 0) {
      return res.status(400).json({ error: 'Le prix de l\'or 18K doit être un nombre positif valide (ex: 1045).' });
    }

    const oldPrice = Number(db.goldRates.currentPrice18k) || numPrice;
    const diff = numPrice - oldPrice;
    const pct = oldPrice > 0 ? ((diff / oldPrice) * 100).toFixed(1) : '0.0';
    const changeStr = diff > 0 ? `+${pct}%` : (diff < 0 ? `${pct}%` : '0.0%');

    const newHistoryEntry = {
      id: `gh_${Date.now()}`,
      date: dateFormatted,
      price18k: numPrice,
      priceSilver: db.goldRates.currentPriceSilver || 14.50,
      change: changeStr,
      source: source ? source.trim() : 'Fixation Officielle Maroc',
      note: note ? note.trim() : ''
    };

    db.goldRates.currentPrice18k = numPrice;
    db.goldRates.carat = '18K';

    if (!Array.isArray(db.goldRates.history)) {
      db.goldRates.history = [];
    }
    db.goldRates.history.push(newHistoryEntry);
    updatedRates.newEntry = newHistoryEntry;
  }

  db.goldRates.lastUpdated = now.toISOString();
  db.goldRates.updatedBy = updatedBy || 'Super-Admin';

  writeDB(db);

  res.json({
    success: true,
    message: 'Cours des métaux précieux mis à jour avec succès',
    currentPrice18k: db.goldRates.currentPrice18k,
    currentPriceSilver: db.goldRates.currentPriceSilver,
    carat: '18K',
    history: db.goldRates.history,
    ...updatedRates
  });
});

// Admin: Delete history record
app.delete('/api/admin/gold-rates/history/:id', requireAdminSession, (req, res) => {
  const { id } = req.params;
  const db = readDB();

  if (!db.goldRates || !Array.isArray(db.goldRates.history)) {
    return res.status(404).json({ error: 'Historique introuvable' });
  }

  const initialLen = db.goldRates.history.length;
  db.goldRates.history = db.goldRates.history.filter(item => item.id !== id);

  if (db.goldRates.history.length === initialLen) {
    return res.status(404).json({ error: 'Entrée introuvable' });
  }

  writeDB(db);
  res.json({ success: true, message: 'Entrée supprimée avec succès', history: db.goldRates.history });
});

// Sync with external PrixOr Railway backend
const { syncGoldRates } = require('./scripts/syncGoldRates');
app.post(['/api/gold-rates/sync', '/api/admin/gold-rates/sync'], async (req, res) => {
  try {
    const result = await syncGoldRates();
    if (result.success) {
      const db = readDB();
      res.json({
        success: true,
        message: `Synchronisation réussie avec Railway : ${result.currentPrice18k} MAD/g (${result.historyCount} entrées)`,
        goldRates: db.goldRates
      });
    } else {
      res.status(500).json({ error: result.error || 'Erreur lors de la synchronisation' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
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
    if (req.path.startsWith('/api') || req.path.startsWith('/admin') || req.path.startsWith('/uploads')) {
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

  // Initial Sync from Railway + Periodic 15-min sync
  syncGoldRates().catch(e => console.error('[GoldSync] Initial sync error:', e.message));
  setInterval(() => {
    syncGoldRates().catch(e => console.error('[GoldSync] Periodic sync error:', e.message));
  }, 15 * 60 * 1000);
});
