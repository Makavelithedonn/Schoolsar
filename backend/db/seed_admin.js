#!/usr/bin/env node
require('dotenv').config();
const { Pool } = require('pg');

const DATABASE_URL = process.env.DATABASE_URL;
const ADMIN_USER = process.env.ADMIN_USER || 'admin';
const ADMIN_PASS = process.env.ADMIN_PASS || 'change_me';

if (!DATABASE_URL) {
  console.error('Please set DATABASE_URL in environment (Supabase connection string)');
  process.exit(1);
}

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

async function seed() {
  try {
    await pool.query("CREATE EXTENSION IF NOT EXISTS pgcrypto;");
  } catch (e) {
    // ignore if extension cannot be created (may already exist or permissions)
  }

  const sql = `INSERT INTO admins (username, password)
VALUES ($1, crypt($2, gen_salt('bf')))
ON CONFLICT (username) DO UPDATE SET password = EXCLUDED.password`;

  try {
    await pool.query(sql, [ADMIN_USER, ADMIN_PASS]);
    console.log('Admin seeded:', ADMIN_USER);
    console.log('If you used the default password, change it in the database now.');
  } catch (err) {
    console.error('Failed to seed admin:', err.message || err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

seed();
