require('dotenv').config();
const DATABASE_URL = process.env.DATABASE_URL || null;

if (DATABASE_URL) {
  // Postgres implementation
  const { Pool } = require('pg');
  const pool = new Pool({ connectionString: DATABASE_URL });

  async function init() {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS submissions (
        id SERIAL PRIMARY KEY,
        page TEXT,
        data JSONB,
        created_at TIMESTAMPTZ
      );
    `);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS admins (
        id SERIAL PRIMARY KEY,
        username TEXT UNIQUE,
        password_hash TEXT
      );
    `);
  }

  async function insertSubmission(page, data) {
    const res = await pool.query('INSERT INTO submissions (page, data, created_at) VALUES ($1, $2, $3) RETURNING id', [page, data, new Date().toISOString()]);
    return res.rows[0].id;
  }

  async function listSubmissions(opts) {
    opts = opts || {};
    if (opts.q) {
      const res = await pool.query("SELECT * FROM submissions WHERE data::text ILIKE $1 ORDER BY id DESC", [`%${opts.q}%`]);
      return res.rows.map(r => ({ id: r.id, page: r.page, data: r.data, created_at: r.created_at }));
    }
    if (opts.page) {
      const res = await pool.query('SELECT * FROM submissions WHERE page = $1 ORDER BY id DESC', [opts.page]);
      return res.rows.map(r => ({ id: r.id, page: r.page, data: r.data, created_at: r.created_at }));
    }
    const res = await pool.query('SELECT * FROM submissions ORDER BY id DESC');
    return res.rows.map(r => ({ id: r.id, page: r.page, data: r.data, created_at: r.created_at }));
  }

  async function getSubmission(id) {
    const res = await pool.query('SELECT * FROM submissions WHERE id = $1', [id]);
    if (!res.rows[0]) return null;
    const r = res.rows[0];
    return { id: r.id, page: r.page, data: r.data, created_at: r.created_at };
  }

  async function upsertAdmin(id, username, password_hash) {
    // Use upsert by username
    await pool.query(`INSERT INTO admins (id, username, password_hash) VALUES ($1, $2, $3)
      ON CONFLICT (id) DO UPDATE SET username = EXCLUDED.username, password_hash = EXCLUDED.password_hash`, [id, username, password_hash]);
  }

  async function getAdminByUsername(username) {
    const res = await pool.query('SELECT * FROM admins WHERE username = $1', [username]);
    return res.rows[0] || null;
  }

  module.exports = { init, insertSubmission, listSubmissions, getSubmission, upsertAdmin, getAdminByUsername };

} else {
  // SQLite implementation (existing)
  const path = require('path');
  const fs = require('fs');
  const Database = require('better-sqlite3');
  const dbFile = process.env.DATABASE_FILE || path.join(__dirname, '..', 'data', 'payit.db');
  const dbDir = path.dirname(dbFile);
  if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true });
  const db = new Database(dbFile);

  db.exec(`
    CREATE TABLE IF NOT EXISTS submissions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      page TEXT,
      data TEXT,
      created_at TEXT
    );

    CREATE TABLE IF NOT EXISTS admins (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE,
      password_hash TEXT
    );
  `);

  function init() { return Promise.resolve(); }

  function insertSubmission(page, data) {
    const insert = db.prepare('INSERT INTO submissions (page, data, created_at) VALUES (?, ?, ?)');
    const info = insert.run(page, JSON.stringify(data), new Date().toISOString());
    return info.lastInsertRowid;
  }

  function listSubmissions(opts) {
    opts = opts || {};
    if (opts.q) {
      const rows = db.prepare('SELECT * FROM submissions WHERE data LIKE ? ORDER BY id DESC').all(`%${opts.q}%`);
      return rows.map(r => ({ id: r.id, page: r.page, data: JSON.parse(r.data), created_at: r.created_at }));
    }
    if (opts.page) {
      const rows = db.prepare('SELECT * FROM submissions WHERE page = ? ORDER BY id DESC').all(opts.page);
      return rows.map(r => ({ id: r.id, page: r.page, data: JSON.parse(r.data), created_at: r.created_at }));
    }
    const rows = db.prepare('SELECT * FROM submissions ORDER BY id DESC').all();
    return rows.map(r => ({ id: r.id, page: r.page, data: JSON.parse(r.data), created_at: r.created_at }));
  }

  function getSubmission(id) {
    const row = db.prepare('SELECT * FROM submissions WHERE id = ?').get(id);
    if (!row) return null;
    return { id: row.id, page: row.page, data: JSON.parse(row.data), created_at: row.created_at };
  }

  function upsertAdmin(id, username, password_hash) {
    const stmt = db.prepare('INSERT OR REPLACE INTO admins (id, username, password_hash) VALUES (?, ?, ?)');
    stmt.run(id, username, password_hash);
    return true;
  }

  function getAdminByUsername(username) {
    const row = db.prepare('SELECT * FROM admins WHERE username = ?').get(username);
    return row || null;
  }

  module.exports = { init, insertSubmission, listSubmissions, getSubmission, upsertAdmin, getAdminByUsername };
}
