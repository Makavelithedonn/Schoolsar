const express = require('express');
const router = express.Router();
const store = require('../store');
const stringify = require('csv-stringify').stringify;

function requireAuth(req, res, next) {
  if (req.session && req.session.user) return next();
  return res.status(401).json({ error: 'unauthorized' });
}

router.post('/login', async (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) return res.status(400).json({ error: 'missing' });

  try {
    await store.init();
    const row = await store.getAdminByUsername(username);
    if (!row) return res.status(401).json({ error: 'invalid' });
    const bcrypt = require('bcrypt');
    const ok = await bcrypt.compare(password, row.password_hash);
    if (!ok) return res.status(401).json({ error: 'invalid' });
    req.session.user = { id: row.id, username: row.username };
    return res.json({ ok: true });
  } catch (err) {
    console.error('login error', err);
    return res.status(500).json({ error: 'server' });
  }
});

router.post('/logout', (req, res) => {
  req.session.destroy(() => res.json({ ok: true }));
});

router.get('/submissions', requireAuth, async (req, res) => {
  const page = req.query.page || null;
  const q = req.query.q || null;
  try {
    await store.init();
    const rows = await store.listSubmissions({ page: page, q: q });
    res.json(rows);
  } catch (err) {
    console.error('list submissions error', err);
    res.status(500).json({ error: 'server' });
  }
});

router.get('/export', requireAuth, async (req, res) => {
  try {
    await store.init();
    const rows = await store.listSubmissions();
    const parsed = rows.map(r => ({ id: r.id, page: r.page, created_at: r.created_at, ...(r.data || {}) }));
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="submissions.csv"');
    stringify(parsed, { header: true }).pipe(res);
  } catch (err) {
    console.error('export error', err);
    res.status(500).json({ error: 'server' });
  }
});

router.get('/submission/:id', requireAuth, async (req, res) => {
  const id = req.params.id;
  try {
    await store.init();
    const row = await store.getSubmission(id);
    if (!row) return res.status(404).json({ error: 'not_found' });
    res.json(row);
  } catch (err) {
    console.error('get submission error', err);
    res.status(500).json({ error: 'server' });
  }
});

module.exports = router;
