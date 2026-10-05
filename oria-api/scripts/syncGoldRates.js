const fs = require('fs');
const path = require('path');

const RAILWAY_GOLD_API = 'https://goldprojectbackend-production.up.railway.app';
const dbPath = path.join(__dirname, '..', 'data', 'database.json');

async function syncGoldRates() {
  try {
    console.log('[GoldSync] Fetching from', RAILWAY_GOLD_API, '...');
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

    const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
    db.goldRates = {
      currentPrice18k: currentPrice,
      carat: '18K',
      unit: priceData.unit ? `${priceData.currency || 'MAD'}/${priceData.unit}` : 'MAD/g',
      lastUpdated: priceData.date || new Date().toISOString(),
      updatedBy: priceData.username ? `PrixOr Railway (${priceData.username})` : 'PrixOr Railway',
      history: formattedHistory
    };

    fs.writeFileSync(dbPath, JSON.stringify(db, null, 2), 'utf8');
    console.log(`[GoldSync] SUCCESS! Updated gold rate to ${currentPrice} MAD/g with ${formattedHistory.length} history records.`);
    return {
      success: true,
      currentPrice18k: currentPrice,
      lastUpdated: db.goldRates.lastUpdated,
      historyCount: formattedHistory.length
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
