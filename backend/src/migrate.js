const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
require('dotenv').config();

async function runMigration() {
  const sqlPath = path.join(__dirname, '..', 'db', 'migrations', '001_init.sql');

  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL not set. Aborting migration.');
    process.exit(1);
  }

  const sql = fs.readFileSync(sqlPath, 'utf8');

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  });

  try {
    console.log('Connecting to database...');
    const client = await pool.connect();
    try {
      console.log('Running migration SQL...');
      await client.query(sql);
      console.log('Migration completed.');
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('Migration failed:', err.message || err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigration();
