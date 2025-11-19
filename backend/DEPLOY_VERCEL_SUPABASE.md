# Deploying to Vercel (serverless) + Supabase (Postgres)

Follow these steps to deploy your site and serverless API on free tiers.

1) Create a Supabase project
  - Go to https://app.supabase.com and create a new project (free tier).
  - In the Supabase project, open the SQL editor and run `backend/db/migrations/001_init.sql` to create the tables.
  - Run `backend/db/seed_admin.sql` in the SQL editor to insert an admin user (change the password before running).
  - In Project Settings -> Database, copy the `Connection string` (the `postgres://...` URL). This is your `DATABASE_URL`.

2) Prepare Vercel
  - Install Vercel CLI locally (optional): `npm i -g vercel`
  - From your repo root, you can run locally with `vercel dev` (requires Vercel CLI and `DATABASE_URL` set locally).

3) Environment variables to set in Vercel (Project Settings -> Environment Variables)
  - `DATABASE_URL` = your Supabase connection string
  - `FORMSUBMIT_EMAIL` = (optional) the email used by FormSubmit to forward form data
  - `SESSION_SECRET` = a secure random string used to sign JWTs
  - `ADMIN_USER` / `ADMIN_PASS` are not required (seeded via SQL), kept for backward compatibility

4) Deploy
  - Push the repo to GitHub.
  - On Vercel, create a new project and import from GitHub.
  - Set the environment variables listed above in Vercel settings.
  - Deploy. Vercel will build serverless functions in the `api/` folder.

5) Seeding the admin account (two options)

- Option A — SQL editor (recommended):
  - In Supabase SQL editor, run `backend/db/seed_admin.sql` after editing the default password.

- Option B — JS helper: run locally against `DATABASE_URL`:
  - Create a `.env` in `backend/` with `DATABASE_URL`, `ADMIN_USER`, and `ADMIN_PASS` set.
  - From the repo root run:
    ```bash
    cd backend
    npm install
    node db/seed_admin.js
    ```
  - The script uses `ADMIN_USER` and `ADMIN_PASS` environment variables (defaults to `admin` / `change_me`).

6) Connect GitHub + Vercel
  - Push the repository to GitHub (create a new repo and `git push`).
  - In Vercel, click "Import Project" -> select the GitHub repo -> Configure.
  - Under Environment Variables, add `DATABASE_URL`, `SESSION_SECRET`, and optionally `FORMSUBMIT_EMAIL`.

7) Quick test after deployment
  - Visit `https://<your-vercel-project>.vercel.app/admin.html` and log in with the seeded admin.
  - Submit a form from your frontend pages; it should be stored in Supabase and visible in the admin UI.

Local testing reminder
  - To run serverless functions locally use `vercel dev` from the repo root. Make sure `DATABASE_URL` is set in `backend/.env` or your shell.


5) Admin usage
  - POST to `/api/admin/login` with JSON `{ "username": "admin", "password": "yourpassword" }` to receive `{ token }`.
  - Use `Authorization: Bearer <token>` when calling `/api/admin/submissions` to list recent submissions.

Local testing
  - Create a `.env` in the `backend/` folder with `DATABASE_URL` and `SESSION_SECRET` set.
  - Run `cd backend && npm install` to install dependencies.
  - Run `npm run dev` (this uses `vercel dev`) or run serverless functions via `vercel dev` at repo root.

Notes
  - The SQL migration uses `pgcrypto` for password hashing. Supabase usually has that extension available.
  - Serverless functions use JWTs for admin authentication. Tokens expire in 6 hours.
