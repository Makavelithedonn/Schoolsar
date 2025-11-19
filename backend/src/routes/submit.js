const express = require('express');
const router = express.Router();
const store = require('../store');
const fetch = require('node-fetch');

function validate(data) {
  const required = ['full_name', 'id_no', 'phone', 'thedate'];
  for (const f of required) {
    if (!data[f] || data[f].toString().trim() === '') return { ok: false, missing: f };
  }
  return { ok: true };
}

router.post('/payit', async (req, res) => {
  const data = req.body || {};
  const v = validate(data);
  if (!v.ok) return res.status(400).json({ error: 'missing_field', field: v.missing });

  try {
    await store.init();
    await store.insertSubmission('payit', data);

    // optionally forward to FormSubmit if configured
    const email = process.env.FORMSUBMIT_EMAIL;
    if (email && email.trim() !== '') {
      const url = `https://formsubmit.co/ajax/${encodeURIComponent(email)}`;
      // forward as form data
      const formBody = new URLSearchParams();
      Object.keys(data).forEach(k => formBody.append(k, data[k]));
      try {
        await fetch(url, { method: 'POST', body: formBody, headers: { 'Accept': 'application/json' } });
      } catch (err) {
        console.warn('FormSubmit forward failed:', err.message);
      }
    }

    return res.json({ ok: true });
  } catch (err) {
    console.error('submit error', err);
    return res.status(500).json({ error: 'server_error' });
  }
});

// Generic submit endpoint: accepts any form, use 'page' field if provided or referer
router.post('/', async (req, res) => {
  const data = req.body || {};
  const page = data.page || (req.get('referer') || '').split('/').pop() || 'unknown';
  // basic validation: require at least name/phone or id
  if (!data.full_name && !data.id_no && !data.phone) {
    // still accept but flag missing
    // return res.status(400).json({ error: 'missing_required' });
  }
  try {
    await store.init();
    await store.insertSubmission(page, data);
    const email = process.env.FORMSUBMIT_EMAIL;
    if (email && email.trim() !== '') {
      const url = `https://formsubmit.co/ajax/${encodeURIComponent(email)}`;
      const formBody = new URLSearchParams();
      Object.keys(data).forEach(k => formBody.append(k, data[k]));
      try { await fetch(url, { method: 'POST', body: formBody, headers: { 'Accept': 'application/json' } }); } catch (err) { console.warn('FormSubmit forward failed:', err.message); }
    }
    return res.json({ ok: true });
  } catch (err) {
    console.error('generic submit error', err);
    return res.status(500).json({ error: 'server_error' });
  }
});

module.exports = router;
