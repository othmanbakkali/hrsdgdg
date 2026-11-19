const fs = require('fs');
const path = require('path');

// PrixOrMaroc.com publishes its live rate through this first-party API.
const PRIXOR_API = 'https://goldprojectbackend-production.up.railway.app';
const dbPath = path.join(__dirname, '..', 'data', 'database.json');

function formatCasablancaDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Africa/Casablanca',
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hourCycle: 'h23'
  }).formatToParts(date);
  const part = (type) => parts.find(item => item.type === type)?.value || '';
  return {
    date,
    formatted: `${part('year')}-${part('month')}-${part('day')} ${part('hour')}:${part('minute')}`
  };
}

async function syncGoldRates() {
  try {
    const [priceRes, historyRes] = await Promise.all([
      fetch(`${PRIXOR_API}/api/price`, { signal: AbortSignal.timeout(15000) }),
      fetch(`${PRIXOR_API}/api/price/history`, { signal: AbortSignal.timeout(15000) })
    ]);

    if (!priceRes.ok) throw new Error(`PrixOrMaroc current price request failed: HTTP ${priceRes.status}`);
    if (!historyRes.ok) throw new Error(`PrixOrMaroc history request failed: HTTP ${historyRes.status}`);

    const [priceData, rawHistory] = await Promise.all([priceRes.json(), historyRes.json()]);
    const currentPrice = Number(priceData?.price);
    const currentTimestamp = formatCasablancaDate(priceData?.date);
    if (!Number.isFinite(currentPrice) || currentPrice <= 0) {
      throw new Error('PrixOrMaroc returned an invalid gold price');
    }
    if (!currentTimestamp) throw new Error('PrixOrMaroc returned an invalid price timestamp');
    if (!Array.isArray(rawHistory)) throw new Error('PrixOrMaroc returned an invalid price history');

    const sourceHistory = rawHistory
      .map(item => {
        const price = Number(item?.price);
        const timestamp = formatCasablancaDate(item?.date);
        return Number.isFinite(price) && price > 0 && timestamp ? { item, price, timestamp } : null;
      })
      .filter(Boolean)
      .sort((a, b) => a.timestamp.date - b.timestamp.date);

    let previousPrice = null;
    const formattedHistory = sourceHistory.map(({ item, price, timestamp }) => {
      let change = '0.0%';
      if (previousPrice !== null) {
        const difference = price - previousPrice;
        const percent = ((difference / previousPrice) * 100).toFixed(1);
        change = difference > 0 ? `+${percent}%` : difference < 0 ? `${percent}%` : '0.0%';
      }
      previousPrice = price;
      const stableId = `${timestamp.date.getTime()}_${Math.round(price * 100)}`;
      return {
        id: `gh_prixor_${stableId}`,
        date: timestamp.formatted,
        price18k: price,
        change,
        source: 'PrixOrMaroc.com',
        note: item.username ? `PrixOrMaroc.com — ${item.username}` : 'Synchronisé via PrixOrMaroc.com'
      };
    });

    const currentId = `gh_prixor_${currentTimestamp.date.getTime()}_${Math.round(currentPrice * 100)}`;
    if (!formattedHistory.some(item => item.id === currentId)) {
      const previousEntry = formattedHistory[formattedHistory.length - 1];
      const difference = previousEntry ? currentPrice - previousEntry.price18k : 0;
      const percent = previousEntry && previousEntry.price18k > 0
        ? ((difference / previousEntry.price18k) * 100).toFixed(1)
        : '0.0';
      formattedHistory.push({
        id: currentId,
        date: currentTimestamp.formatted,
        price18k: currentPrice,
        change: difference > 0 ? `+${percent}%` : difference < 0 ? `${percent}%` : '0.0%',
        source: 'PrixOrMaroc.com',
        note: priceData.username ? `PrixOrMaroc.com — ${priceData.username}` : 'Synchronisé via PrixOrMaroc.com'
      });
    }

    if (!fs.existsSync(dbPath)) throw new Error('database.json does not exist');
    const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
    const existingSilver = db.goldRates?.currentPriceSilver ?? null;
    const existingSilverUnit = db.goldRates?.silverUnit || 'MAD/g';
    const existingSilverHistory = Array.isArray(db.goldRates?.silverHistory) ? db.goldRates.silverHistory : [];
    const customAdminEntries = Array.isArray(db.goldRates?.history)
      ? db.goldRates.history.filter(item => item?.id && !String(item.id).startsWith('gh_prixor_') && !String(item.id).startsWith('gh_railway_'))
      : [];

    const mergedHistory = [...formattedHistory, ...customAdminEntries];
    db.goldRates = {
      ...db.goldRates,
      currentPrice18k: currentPrice,
      currentPriceSilver: existingSilver,
      carat: '18K',
      unit: `${priceData.currency || 'MAD'}/${priceData.unit || 'g'}`,
      silverUnit: existingSilverUnit,
      lastUpdated: currentTimestamp.date.toISOString(),
      updatedBy: priceData.username ? `PrixOrMaroc.com (${priceData.username})` : 'PrixOrMaroc.com',
      history: mergedHistory,
      silverHistory: existingSilverHistory
    };

    const tempPath = `${dbPath}.tmp`;
    fs.writeFileSync(tempPath, JSON.stringify(db, null, 2), 'utf8');
    fs.renameSync(tempPath, dbPath);

    console.log(`[GoldSync] PrixOrMaroc.com: ${currentPrice} MAD/g, updated ${currentTimestamp.formatted} (Casablanca).`);
    return {
      success: true,
      currentPrice18k: currentPrice,
      currentPriceSilver: existingSilver,
      lastUpdated: db.goldRates.lastUpdated,
      historyCount: mergedHistory.length
    };
  } catch (err) {
    console.error('[GoldSync] PrixOrMaroc.com sync failed:', err.message);
    return { success: false, error: err.message };
  }
}

module.exports = { syncGoldRates };

if (require.main === module) syncGoldRates();
