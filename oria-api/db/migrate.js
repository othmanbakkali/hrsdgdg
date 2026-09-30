const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const DB_JSON_PATH = path.join(__dirname, '..', 'data', 'database.json');
const SCHEMA_PATH = path.join(__dirname, 'schema.sql');

const connectionString = process.env.DATABASE_URL || 
  (process.env.PGHOST ? `postgresql://${process.env.PGUSER || 'postgres'}:${encodeURIComponent(process.env.PGPASSWORD || '')}@${process.env.PGHOST}:${process.env.PGPORT || 5432}/${process.env.PGDATABASE || 'hrsdgdg_db'}` : 'postgresql://postgres:postgres@localhost:5432/hrsdgdg_db');

const pool = new Pool({
  connectionString,
  ssl: process.env.PGSSL === 'true' ? { rejectUnauthorized: false } : false
});

async function runMigration() {
  console.log('🚀 Starting PostgreSQL migration for HRSDGDG...');
  console.log(`📡 Connecting to: ${connectionString.replace(/:[^:@]+@/, ':****@')}`);

  const client = await pool.connect();

  try {
    // 1. Run DDL Schema
    console.log('📐 Applying schema.sql...');
    const schemaSql = fs.readFileSync(SCHEMA_PATH, 'utf8');
    await client.query(schemaSql);

    // 2. Read database.json
    if (!fs.existsSync(DB_JSON_PATH)) {
      console.error('❌ database.json file not found at:', DB_JSON_PATH);
      return;
    }
    const rawData = fs.readFileSync(DB_JSON_PATH, 'utf8');
    const db = JSON.parse(rawData);

    // 3. Migrate Users
    console.log(`👤 Migrating ${db.users?.length || 0} users...`);
    for (const u of (db.users || [])) {
      await client.query(`
        INSERT INTO users (
          id, email, nom, mot_de_passe, role, seller_type, shop_name, phone, address, city, badges, satisfaction, rating, sales_count, favoris, subscription
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
        ON CONFLICT (id) DO UPDATE SET
          email = EXCLUDED.email,
          nom = EXCLUDED.nom,
          mot_de_passe = EXCLUDED.mot_de_passe,
          role = EXCLUDED.role,
          shop_name = EXCLUDED.shop_name,
          phone = EXCLUDED.phone,
          address = EXCLUDED.address,
          city = EXCLUDED.city,
          badges = EXCLUDED.badges,
          favoris = EXCLUDED.favoris,
          subscription = EXCLUDED.subscription
      `, [
        u.id,
        u.email,
        u.nom,
        u.mot_de_passe || 'password123',
        u.role || 'client',
        u.seller_type || (u.role === 'commercant' ? 'bijouterie' : null),
        u.shopName || u.nom,
        u.phone || u.telephone || '',
        u.address || u.adresse || '',
        u.city || u.ville || 'Casablanca',
        JSON.stringify(u.badges || []),
        u.satisfaction || 100,
        u.rating || 5.0,
        u.sales_count || 0,
        JSON.stringify(u.favoris || []),
        u.subscription ? JSON.stringify(u.subscription) : null
      ]);
    }
    // Update any admin named Sophia Bennani to Hakim Benchaib
    await client.query(`UPDATE users SET nom = 'Hakim Benchaib' WHERE role = 'admin' AND nom ILIKE '%bennani%'`);

    // 4. Migrate Categories
    console.log(`🏷️  Migrating ${db.categories?.length || 0} categories...`);
    for (const c of (db.categories || [])) {
      await client.query(`
        INSERT INTO categories (id, nom_fr, nom_ar, nom_en, icon)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (id) DO UPDATE SET
          nom_fr = EXCLUDED.nom_fr,
          nom_ar = EXCLUDED.nom_ar,
          nom_en = EXCLUDED.nom_en,
          icon = EXCLUDED.icon
      `, [
        c.id,
        c.nom_fr,
        c.nom_ar || '',
        c.nom_en || '',
        c.icon || '💎'
      ]);
    }

    // Ensure multilingual columns exist
    await client.query(`
      ALTER TABLE bijoux ADD COLUMN IF NOT EXISTS titre_fr VARCHAR(255);
      ALTER TABLE bijoux ADD COLUMN IF NOT EXISTS titre_ar VARCHAR(255);
      ALTER TABLE bijoux ADD COLUMN IF NOT EXISTS titre_en VARCHAR(255);
      ALTER TABLE bijoux ADD COLUMN IF NOT EXISTS description_fr TEXT;
      ALTER TABLE bijoux ADD COLUMN IF NOT EXISTS description_ar TEXT;
      ALTER TABLE bijoux ADD COLUMN IF NOT EXISTS description_en TEXT;
      ALTER TABLE subscription_plans ADD COLUMN IF NOT EXISTS name_fr VARCHAR(100);
      ALTER TABLE subscription_plans ADD COLUMN IF NOT EXISTS name_ar VARCHAR(100);
      ALTER TABLE subscription_plans ADD COLUMN IF NOT EXISTS name_en VARCHAR(100);
    `);

    // 5. Migrate Bijoux (Products)
    console.log(`💎 Migrating ${db.bijoux?.length || 0} jewelry products...`);
    for (const b of (db.bijoux || [])) {
      await client.query(`
        INSERT INTO bijoux (
          id, titre, titre_fr, titre_ar, titre_en, description, description_fr, description_ar, description_en,
          prix, ancien_prix, type_vente, matiere, gramme, poids, purete, pierre, taille, etat, annee, nombre_proprietaires,
          style, occasion, pour_qui, images, disponibilite, city, stock, category_id, commercant_id, vendeur_nom, vendeur_type,
          vendeur_badge, garantie, facture, certificat, boite, authentifie, badge, note, nombre_avis, favoris_count, statut,
          rejection_reason, why_this_item, look_complementary_ids
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9,
          $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21,
          $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32,
          $33, $34, $35, $36, $37, $38, $39, $40, $41, $42, $43,
          $44, $45, $46
        )
        ON CONFLICT (id) DO UPDATE SET
          titre = EXCLUDED.titre,
          titre_fr = EXCLUDED.titre_fr,
          titre_ar = EXCLUDED.titre_ar,
          titre_en = EXCLUDED.titre_en,
          description = EXCLUDED.description,
          description_fr = EXCLUDED.description_fr,
          description_ar = EXCLUDED.description_ar,
          description_en = EXCLUDED.description_en,
          prix = EXCLUDED.prix,
          ancien_prix = EXCLUDED.ancien_prix,
          stock = EXCLUDED.stock,
          disponibilite = EXCLUDED.disponibilite,
          statut = EXCLUDED.statut
      `, [
        b.id,
        b.titre || b.titre_fr,
        b.titre_fr || b.titre,
        b.titre_ar || '',
        b.titre_en || '',
        b.description || b.description_fr || '',
        b.description_fr || b.description || '',
        b.description_ar || '',
        b.description_en || '',
        parseFloat(b.prix) || 0,
        b.ancien_prix ? parseFloat(b.ancien_prix) : null,
        b.type_vente || 'FIRST_HAND',
        b.matiere || 'Or',
        parseFloat(b.gramme || b.poids || 0),
        parseFloat(b.poids || b.gramme || 0),
        b.purete || '18k',
        b.pierre || 'Aucune',
        b.taille || 'Unique',
        b.etat || 'Neuf',
        b.annee || new Date().getFullYear(),
        b.nombre_proprietaires || 1,
        b.style || 'Moderne',
        b.occasion || 'Cadeau',
        b.pour_qui || 'Femme',
        JSON.stringify(b.images || []),
        b.disponibilite || 'disponible',
        b.city || 'Casablanca',
        parseInt(b.stock || 1, 10),
        b.category_id || null,
        b.commercant_id || 'u_merchant1',
        b.vendeur_nom || 'Maison Royale',
        b.vendeur_type || 'bijouterie',
        b.vendeur_badge || '✓ Vendeur vérifié',
        Boolean(b.garantie),
        Boolean(b.facture),
        Boolean(b.certificat),
        Boolean(b.boite),
        b.authentifie || 'Vérifié',
        b.badge || null,
        parseFloat(b.note || 5.0),
        parseInt(b.nombre_avis || 0, 10),
        parseInt(b.favoris_count || 0, 10),
        b.statut || 'Validated',
        b.rejectionReason || '',
        JSON.stringify(b.why_this_item || []),
        JSON.stringify(b.look_complementary_ids || [])
      ]);
    }

    // 6. Migrate Auctions (Enchères)
    console.log(`🔨 Migrating ${db.encheres?.length || 0} auctions...`);
    for (const e of (db.encheres || [])) {
      await client.query(`
        INSERT INTO encheres (id, bijou_id, prix_depart, date_debut, date_fin, increment_min, prix_reserve, statut)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT (id) DO NOTHING
      `, [
        e.id,
        e.bijou_id,
        parseFloat(e.prix_depart) || 1000,
        e.date_debut || new Date().toISOString(),
        e.date_fin || new Date(Date.now() + 48 * 3600 * 1000).toISOString(),
        parseFloat(e.increment_min) || 50,
        e.prix_reserve ? parseFloat(e.prix_reserve) : null,
        e.statut || 'Active'
      ]);
    }

    // 7. Migrate Orders (Commandes)
    console.log(`📦 Migrating ${db.commandes?.length || 0} orders...`);
    for (const ord of (db.commandes || [])) {
      await client.query(`
        INSERT INTO commandes (id, client_id, client_nom, client_telephone, client_adresse, client_ville, mode_paiement, items, total, commission, statut, tracking_steps, date_commande)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        ON CONFLICT (id) DO NOTHING
      `, [
        ord.id,
        ord.client_id || 'u_client1',
        ord.client_nom || '',
        ord.client_telephone || '',
        ord.client_adresse || '',
        ord.client_ville || 'Casablanca',
        ord.mode_paiement || 'cash_on_delivery',
        JSON.stringify(ord.items || []),
        parseFloat(ord.total) || 0,
        parseFloat(ord.commission) || 0,
        ord.statut || 'Confirmed',
        JSON.stringify(ord.tracking_steps || []),
        ord.date_commande || new Date().toISOString()
      ]);
    }

    // 8. Migrate Subscription Plans
    console.log(`💳 Migrating ${db.subscription_plans?.length || 0} subscription plans...`);
    for (const plan of (db.subscription_plans || [])) {
      await client.query(`
        INSERT INTO subscription_plans (id, name, badge, price_monthly, price_annual, max_products, commission_rate, features)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          price_monthly = EXCLUDED.price_monthly,
          price_annual = EXCLUDED.price_annual,
          max_products = EXCLUDED.max_products,
          commission_rate = EXCLUDED.commission_rate,
          features = EXCLUDED.features
      `, [
        plan.id,
        plan.name,
        plan.badge || '',
        parseFloat(plan.price_monthly) || 0,
        parseFloat(plan.price_annual) || 0,
        parseInt(plan.max_products) || 5,
        parseFloat(plan.commission_rate) || 8.0,
        JSON.stringify(plan.features || [])
      ]);
    }

    // 9. Migrate Platform Config
    if (db.config) {
      console.log('⚙️  Migrating platform configuration...');
      await client.query(`
        INSERT INTO system_config (key, value, updated_at)
        VALUES ('platform_config', $1, CURRENT_TIMESTAMP)
        ON CONFLICT (key) DO NOTHING
      `, [JSON.stringify(db.config)]);
    }

    console.log('🎉 PostgreSQL database migration completed successfully!');
  } catch (err) {
    console.error('❌ Migration failed:', err);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

if (require.main === module) {
  runMigration().catch(console.error);
}

module.exports = { runMigration };
