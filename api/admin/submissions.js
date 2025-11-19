const { Pool } = require('pg');
const jwt = require('jsonwebtoken');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

function verifyToken(req) {
  const auth = req.headers?.authorization;
  if (!auth) return null;
  const parts = auth.split(' ');
  if (parts.length !== 2) return null;
  const token = parts[1];
  try {
    return jwt.verify(token, process.env.SESSION_SECRET || 'devsecret');
  } catch (e) {
    return null;
  }
}

module.exports = async function (req, res) {
  const verified = verifyToken(req);
  if (!verified) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const { rows } = await pool.query(
      'SELECT id, page, data, created_at FROM submissions ORDER BY created_at DESC LIMIT 100'
    );
    return res.json({ ok: true, submissions: rows });
  } catch (err) {
    console.error('list submissions error', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
