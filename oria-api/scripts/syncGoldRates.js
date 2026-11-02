const fs = require('fs');
const path = require('path');

const RAILWAY_GOLD_API = 'https://goldprojectbackend-production.up.railway.app';
const dbPath = path.join(__dirname, '..', 'data', 'database.json');

async function syncGoldRates() {
  try {
    console.log('[GoldSync] Manual admin sync requested: Fetching from', RAILWAY_GOLD_API, '...');
    const [priceRes, historyRes] = await Promise.all([
      fetch(`${RAILWAY_GOLD_API}/api/price`),
      fetch(`${RAILWAY_GOLD_API}/api/price/history`)
    ]);

    if (!priceRes.ok) {
      throw new Error(`Failed to fetch current price: HTTP ${priceRes.status}`);
    }

    const priceData = await priceRes.json();
    let rawHistory = [];
    if (historyRes.ok) {
      rawHistory = await historyRes.json();
    }

    const currentPrice = Number(priceData.price) || 1035;

    // Process history
    let prevPrice = null;
    const formattedHistory = Array.isArray(rawHistory) ? rawHistory.map((item, idx) => {
      const d = new Date(item.date);
      const dateFormatted = !isNaN(d.getTime())
        ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
        : item.date;

      let changeStr = '0.0%';
      if (prevPrice !== null && prevPrice > 0) {
        const diff = item.price - prevPrice;
        const pct = ((diff / prevPrice) * 100).toFixed(1);
        changeStr = diff > 0 ? `+${pct}%` : (diff < 0 ? `${pct}%` : '0.0%');
      }
      prevPrice = item.price;

      return {
        id: `gh_railway_${item.id || idx + 1}`,
        date: dateFormatted,
        price18k: item.price,
        change: changeStr,
        source: item.username ? `Fixation ${item.username}` : 'Fixation Officielle Maroc',
        note: 'Synchronisé via PrixOr (Railway)'
      };
    }) : [];

    const defaultSilverHistory = [
      { id: 'sh_1', date: '2026-10-18 09:30', priceSilver: 13.80, change: '0.0%', source: 'Marché National Argent', note: 'Fixation matinale Ag 1000' },
      { id: 'sh_2', date: '2026-10-20 11:15', priceSilver: 13.95, change: '+1.1%', source: 'Bourse Casablanca', note: 'Raffinement lingots 1000' },
      { id: 'sh_3', date: '2026-10-22 10:00', priceSilver: 14.10, change: '+1.1%', source: 'Marché National Argent', note: 'Hausse demande industrielle & bijouterie' },
      { id: 'sh_4', date: '2026-10-24 15:45', priceSilver: 14.25, change: '+1.1%', source: 'Fixation Officielle Maroc', note: 'Cours certifié Ag 1000‰' },
      { id: 'sh_5', date: '2026-10-25 10:30', priceSilver: 14.40, change: '+1.1%', source: 'Bourse Casablanca', note: 'Progression continue de l\'argent pur' },
      { id: 'sh_6', date: '2026-10-26 12:00', priceSilver: 14.50, change: '+0.7%', source: 'Fixation Officielle Maroc', note: 'Cours actuel du jour (Ag 1000)' }
    ];

    if (!fs.existsSync(dbPath)) {
      throw new Error('database.json does not exist');
    }

    const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));

    // [DATA IMMUTABILITY & PRESERVATION]
    // 1. Strictly preserve whatever silver price the admin has configured in the database
    const existingSilver = (db.goldRates && db.goldRates.currentPriceSilver !== undefined)
      ? db.goldRates.currentPriceSilver
      : 15.00;

    const existingSilverUnit = (db.goldRates && db.goldRates.silverUnit) || 'MAD/g';

    const existingSilverHistory = (db.goldRates && Array.isArray(db.goldRates.silverHistory) && db.goldRates.silverHistory.length > 0)
      ? db.goldRates.silverHistory
      : defaultSilverHistory;

    // 2. Preserve any custom entries added manually by admins
    const customAdminEntries = (db.goldRates && Array.isArray(db.goldRates.history))
      ? db.goldRates.history.filter(h => h && h.id && !h.id.startsWith('gh_railway_'))
      : [];

    const mergedHistory = [...formattedHistory, ...customAdminEntries];

    db.goldRates = {
      ...db.goldRates,
      currentPrice18k: currentPrice,
      currentPriceSilver: existingSilver, // 100% PRESERVED
      carat: '18K',
      unit: priceData.unit ? `${priceData.currency || 'MAD'}/${priceData.unit}` : 'MAD/g',
      silverUnit: existingSilverUnit, // 100% PRESERVED
      lastUpdated: priceData.date || new Date().toISOString(),
      updatedBy: priceData.username ? `PrixOr Railway (${priceData.username})` : 'PrixOr Railway',
      history: mergedHistory,
      silverHistory: existingSilverHistory // 100% PRESERVED
    };

    // Atomic write to prevent file corruption
    const tempPath = `${dbPath}.tmp`;
    fs.writeFileSync(tempPath, JSON.stringify(db, null, 2), 'utf8');
    fs.renameSync(tempPath, dbPath);

    console.log(`[GoldSync] SUCCESS! Updated gold rate to ${currentPrice} MAD/g (Silver preserved at ${existingSilver} ${existingSilverUnit}).`);
    return {
      success: true,
      currentPrice18k: currentPrice,
      currentPriceSilver: existingSilver,
      lastUpdated: db.goldRates.lastUpdated,
      historyCount: mergedHistory.length
    };
  } catch (err) {
    console.error('[GoldSync] ERROR:', err.message);
    return {
      success: false,
      error: err.message
    };
  }
}

module.exports = { syncGoldRates };

if (require.main === module) {
  syncGoldRates();
}
