const { Pool } = require('pg');
const jwt = require('jsonwebtoken');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

module.exports = async function (req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { username, password } = req.body || {};
  if (!username || !password) return res.status(400).json({ error: 'username and password required' });

  try {
    const result = await pool.query(
      'SELECT id FROM admins WHERE username=$1 AND crypt($2, password)=password LIMIT 1',
      [username, password]
    );

    if (result.rows.length === 0) return res.status(401).json({ error: 'Invalid credentials' });

    const admin = result.rows[0];
    const token = jwt.sign({ adminId: admin.id }, process.env.SESSION_SECRET || 'devsecret', { expiresIn: '6h' });

    return res.json({ ok: true, token });
  } catch (err) {
    console.error('admin login error', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
