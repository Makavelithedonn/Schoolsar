const store = require('./store');
const bcrypt = require('bcrypt');
require('dotenv').config();

async function seed() {
  const user = process.env.ADMIN_USER || 'admin';
  const pass = process.env.ADMIN_PASS || 'changeme';
  const hash = await bcrypt.hash(pass, 10);

  try {
    await store.init();
    await store.upsertAdmin(1, user, hash);
    console.log('Admin user seeded:', user);
  } catch (err) {
    console.error('Failed to seed admin:', err.message);
  }
  process.exit(0);
}

seed();
