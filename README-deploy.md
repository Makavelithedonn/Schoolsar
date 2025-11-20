# Deploying this project on Render (step-by-step)

This repository already includes a `render.yaml` manifest that creates a web service `payit-backend` and a Postgres database `payit-db`.

Follow these steps to go live on Render and seed the database.

1) Push your repo to GitHub

- Commit and push your code to the GitHub repository you will connect to Render.

2) Create the service from `render.yaml`

- In Render dashboard: New → Web Service → Connect GitHub → select this repo.
- Render will detect `render.yaml` and propose the `payit-backend` service and the `payit-db` Postgres instance. Create them.
- Confirm build command: `cd backend && npm install`
- Confirm start command: `cd backend && npm start`

3) Set environment variables for the web service

- Go to the `payit-backend` service → Environment → Environment Variables and add:
  - `DATABASE_URL` : the Postgres connection string (either the Render DB or your Supabase DB)
  - `SESSION_SECRET` : a long random string
  - `CORS_ORIGIN` : your site domain (e.g., `https://yourdomain.com`) or `*` for testing
  - `NODE_ENV` : `production` (render.yaml already sets this but double-check)
  - `FORMSUBMIT_EMAIL` : optional
  - `ADMIN_USER` and `ADMIN_PASS` : optional values used by the seed script

4) Run DB migrations

Two ways to run the migration SQL that creates tables:

- Locally (recommended if you have `psql` or want to run from your machine):

```bash
cd backend
npm install
export DATABASE_URL="postgres://user:pass@host:5432/dbname"
npm run migrate
```

- On Render (using the service shell):

  - Render → Service → Shell
  - Run:

```bash
cd backend
npm run migrate
```

The repo includes `backend/src/migrate.js` which will read `backend/db/migrations/001_init.sql` and apply it to the database using `DATABASE_URL`.

5) Seed admin user

- Locally:

```bash
cd backend
export DATABASE_URL="postgres://user:pass@host:5432/dbname"
export ADMIN_USER="admin"
export ADMIN_PASS="yourStrongPassword"
npm run seed-admin
```

- On Render via Shell:

```bash
cd backend
npm run seed-admin
```

6) Verify the site

- Visit the Render service URL (something like `https://payit-backend.onrender.com`). The backend serves `index.html` at `/` and admin pages under `/admin`.
- Test the API endpoint:

```bash
curl -X POST https://<your-render-service>.onrender.com/api/submit \
  -H "Content-Type: application/json" \
  -d '{"page":"test","name":"Test User"}'
```

7) Add custom domain (optional)

- Render → Service → Settings → Custom Domains → Add Domain. Follow Render’s DNS instructions. After DNS propagation, update `CORS_ORIGIN` to include your custom domain.

Troubleshooting notes

- If the API logs show `DATABASE_URL not set`, double-check the environment variables in Render.
- If the seeder fails because tables are missing, re-run the migration step.
- Check Render build and runtime logs for stack traces.

Files added to help deploy

- `backend/.env.example` — a template of the environment variables required.
- `backend/src/migrate.js` — Node script to apply `backend/db/migrations/001_init.sql`.
- `README-deploy.md` — this file.

If you want, I can also:
- Add a small `deploy.sh` helper script that performs migrations and seeding from your machine.
- Run additional patches to make the frontend use a configurable API base URL.
