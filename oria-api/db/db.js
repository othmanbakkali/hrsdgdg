const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const connectionString = process.env.DATABASE_URL || 
  (process.env.PGHOST ? `postgresql://${process.env.PGUSER || 'postgres'}:${encodeURIComponent(process.env.PGPASSWORD || '')}@${process.env.PGHOST}:${process.env.PGPORT || 5432}/${process.env.PGDATABASE || 'hrsdgdg_db'}` : null);

let pool = null;
let isPostgresAvailable = false;

if (connectionString) {
  pool = new Pool({
    connectionString,
    ssl: process.env.PGSSL === 'true' ? { rejectUnauthorized: false } : false,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  });
}

async function initPostgres() {
  if (!pool) {
    console.log('ℹ️  PostgreSQL: No connection string provided, running in local database.json storage mode.');
    return false;
  }

  try {
    const client = await pool.connect();
    console.log('🐘 PostgreSQL: Connected successfully to database.');

    const schemaPath = path.join(__dirname, 'schema.sql');
    if (fs.existsSync(schemaPath)) {
      const sql = fs.readFileSync(schemaPath, 'utf8');
      await client.query(sql);
      console.log('✅ PostgreSQL: Schema tables and indexes initialized.');
    }
    client.release();
    isPostgresAvailable = true;
    return true;
  } catch (err) {
    console.warn('⚠️  PostgreSQL: Connection failed, falling back to database.json storage mode:', err.message);
    isPostgresAvailable = false;
    return false;
  }
}

async function query(text, params) {
  if (!pool || !isPostgresAvailable) {
    throw new Error('PostgreSQL is not connected.');
  }
  return pool.query(text, params);
}

module.exports = {
  pool,
  initPostgres,
  query,
  get isPostgresAvailable() {
    return isPostgresAvailable;
  }
};
