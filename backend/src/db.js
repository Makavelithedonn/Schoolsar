const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');
require('dotenv').config();

const dbFile = process.env.DATABASE_FILE || path.join(__dirname, '..', 'data', 'payit.db');
const dbDir = path.dirname(dbFile);

if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true });

const db = new Database(dbFile);

// Initialize tables
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

module.exports = db;
