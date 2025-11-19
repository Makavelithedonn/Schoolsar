-- Seed an admin user in Supabase/Postgres using pgcrypto
-- Edit the username and password below before running, or run as-is then change credentials.

-- Replace 'admin' and 'change_me' with preferred username and password
INSERT INTO admins (username, password)
VALUES (
  'admin',
  crypt('change_me', gen_salt('bf'))
)
ON CONFLICT (username) DO NOTHING;

-- To verify:
-- SELECT id, username, created_at FROM admins;
