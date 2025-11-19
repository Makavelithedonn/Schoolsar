const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Supabase requires SSL; when running locally you may omit ssl
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

module.exports = async function (req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const payload = req.body || {};
    const page = payload.page || req.query.page || 'unknown';

    if (!process.env.DATABASE_URL) {
      return res.status(500).json({ error: 'DATABASE_URL not set in environment' });
    }

    await pool.query('INSERT INTO submissions (page, data) VALUES ($1, $2)', [page, payload]);

    // Optionally forward to FormSubmit (if email is configured)
    if (process.env.FORMSUBMIT_EMAIL) {
      try {
        await fetch(`https://formsubmit.co/ajax/${process.env.FORMSUBMIT_EMAIL}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } catch (e) {
        // non-fatal; just log
        console.error('FormSubmit forward failed', e?.message || e);
      }
    }

    return res.json({ ok: true });
  } catch (err) {
    console.error('submit error', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
