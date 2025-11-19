# payit-backend

Simple Node.js + Express backend to receive the `payit` form submissions, store them in SQLite, optionally forward to FormSubmit, and provide a small admin dashboard.

Quick start

1. Copy `.env.example` to `.env` and set values (especially `ADMIN_PASS` and `SESSION_SECRET`).
2. Install dependencies:

```bash
cd backend
npm install
```

3. Seed admin (optional):

```bash
npm run seed-admin
```

4. Start server:

```bash
npm start
```

By default the server listens on `http://localhost:3000`.

Endpoints

- `POST /api/submit/payit` — receives form submissions from the `payit` page.
- `GET /api/admin/submissions` — requires login; returns list of submissions (JSON).
- `GET /api/admin/export` — CSV export (requires login).

Admin UI

Open `/admin/login.html` and log in with `ADMIN_USER` / `ADMIN_PASS` from `.env`.

Deployment notes (Render / Railway / similar)

- Recommended: set `DATABASE_URL` to a managed Postgres instance for production. The backend will use Postgres when `DATABASE_URL` is set and SQLite locally otherwise.
- Set these environment variables in the host's dashboard: `DATABASE_URL`, `ADMIN_USER`, `ADMIN_PASS`, `SESSION_SECRET`, `FORMSUBMIT_EMAIL` (optional), and `CORS_ORIGIN` (optional to restrict origins).
- Example Render steps:
	1. Push your repo to GitHub.
	2. Create a new Web Service on Render and link the repo.
	3. Set build command: `npm install` and start command: `npm start`.
	4. Add a Managed PostgreSQL from Render and copy its `DATABASE_URL` into the service env.
	5. Set the other env vars in the Render service settings.
	6. Deploy — the service will start and be reachable at the provided URL.

Notes about SQLite in production

- SQLite is fine for local development and small personal projects, but many cloud hosts use ephemeral filesystems for containers so SQLite data may be lost. Use Postgres for production.

Deploying with Render (recommended)

1. Create a GitHub repo and push this project.
2. On Render, create a new Web Service and connect your GitHub repo. Render will detect `render.yaml` and the `payit-backend` service.
3. In Render's service settings set environment variables:
	- `DATABASE_URL` (set automatically if you add the managed Postgres defined in `render.yaml`, or paste the URL from the created DB)
	- `ADMIN_USER`, `ADMIN_PASS`, `SESSION_SECRET` (generate a long random value), `FORMSUBMIT_EMAIL` (optional), `CORS_ORIGIN` (optional)
4. Deploy. Render will run `cd backend && npm install` and start the app with `cd backend && npm start`.
5. After deployment, point your domain at the Render service if you have a custom domain.

Docker deployment (optional)

If you prefer to use Docker (e.g., DigitalOcean droplet or your own server), build the image and run it exposing port 3000. Example:

```bash
# build
docker build -t payit-backend:latest .

# run (example with Postgres DATABASE_URL)
docker run -e DATABASE_URL="postgres://user:pass@host:5432/dbname" -e ADMIN_USER=admin -e ADMIN_PASS=YourPass -e SESSION_SECRET=$(openssl rand -hex 32) -p 80:3000 payit-backend:latest
```

This runs the app and serves both frontend and API from the container root on port 80.

Notes about production

- Use `DATABASE_URL` pointing to a managed Postgres instance.
- Set `SESSION_SECRET` to a secure random value.
- Don't commit `.env` or any secrets to Git.

