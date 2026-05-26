# 🔗 Snip — URL Shortener


## What it is

A full-stack URL shortener built to demonstrate production-grade engineering across the whole stack: typed frontend, async backend, real database, Redis caching, auth, CI/CD, and live deployment.

The idea is intentionally boring — everyone knows how a URL shortener works — so reviewers focus entirely on *execution*.

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Client (Browser)                      │
└────────────────────────┬────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────┐
│            Next.js 14 (App Router) — Vercel              │
│  / home   /dashboard   /stats/[code]   middleware.ts     │
│                   Clerk Auth                             │
└────────────────────────┬────────────────────────────────┘
                         │ REST API calls
┌────────────────────────▼────────────────────────────────┐
│              FastAPI (Python) — Railway                  │
│                                                          │
│  POST /api/links     GET /api/links    DELETE /api/links │
│  GET /api/stats/{code}    GET /health                    │
│                                                          │
│  GET /r/{code}  ──► Redis cache ──► PostgreSQL           │
│                      (10 min TTL)    (fallback)          │
│                                                          │
│  Click logging → Background task (non-blocking)          │
└──────────────┬──────────────┬───────────────────────────┘
               │              │
┌──────────────▼──┐    ┌──────▼──────────────────────────┐
│ PostgreSQL       │    │ Redis                           │
│ (Railway)        │    │ (Railway)                       │
│                  │    │                                 │
│ users            │    │ redirect:{code} → original_url  │
│ links            │    │ rate:anon:{ip}  → click count   │
│ clicks           │    │                                 │
└──────────────────┘    └─────────────────────────────────┘
```

---

## API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/api/links` | Optional | Create a short link |
| `GET` | `/api/links` | Required | List all user's links (paginated) |
| `GET` | `/api/links/{code}` | Required | Get metadata for one link |
| `DELETE` | `/api/links/{code}` | Required | Delete a link |
| `GET` | `/r/{code}` | Public | Redirect to original URL (Redis cached) |
| `GET` | `/api/stats/{code}` | Required | Click count + 30-day daily breakdown |
| `GET` | `/health` | Public | DB + Redis health check |

---

## Features

- **Anonymous users** — create up to 5 links/hour per IP, no account needed
- **Authenticated users** — unlimited links, full CRUD, click analytics
- **Custom slugs** — set your own short code (3–20 chars, alphanumeric + hyphens)
- **Link expiry** — optional `expires_at`; expired links return `410 Gone`
- **Redis caching** — every redirect checks Redis first (10-min TTL), then PostgreSQL
- **Async click logging** — redirect is never blocked by DB writes (background task)
- **Country tracking** — reads `CF-IPCountry` header when behind Cloudflare
- **Collision-safe code generation** — base62(SHA256(url + timestamp)), checks DB

---

## Local Setup

### Prerequisites

- Docker & Docker Compose
- A [Clerk](https://clerk.com) account (free tier)

### Steps

```bash
# 1. Clone
git clone https://github.com/yourname/url-shortener
cd url-shortener

# 2. Configure environment
cp .env.example .env
# Edit .env and fill in your Clerk keys

# 3. Start everything
docker compose up --build

# Frontend → http://localhost:3000
# Backend  → http://localhost:8000
# API docs → http://localhost:8000/docs
```

### Run backend tests only

```bash
cd backend
pip install -r requirements.txt
pytest tests/ -v
```

---

## Deployment

### Frontend → Vercel

1. Push repo to GitHub
2. Import project in [vercel.com](https://vercel.com), set root to `frontend/`
3. Add env vars:
   - `NEXT_PUBLIC_API_URL` — your Railway backend URL
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
   - `CLERK_SECRET_KEY`
4. Deploy — automatic on every push to `main`

### Backend + DB + Redis → Railway

1. Create a new [Railway](https://railway.app) project
2. Add services: **PostgreSQL plugin**, **Redis plugin**, **GitHub repo** (set root to `backend/`)
3. Set env vars on the backend service:
   - `DATABASE_URL` — from Railway's Postgres plugin (use `asyncpg` dialect)
   - `REDIS_URL` — from Railway's Redis plugin
   - `BASE_URL` — your Railway backend URL
   - `FRONTEND_URL` — your Vercel URL
   - `CLERK_SECRET_KEY`
4. Railway auto-deploys on push to `main`

### GitHub Actions secrets needed

For CI/CD to work, add these secrets in your repo settings:

| Secret | Value |
|--------|-------|
| `VERCEL_TOKEN` | From vercel.com account settings |
| `VERCEL_ORG_ID` | From `.vercel/project.json` after first deploy |
| `VERCEL_PROJECT_ID` | From `.vercel/project.json` |
| `RAILWAY_TOKEN` | From Railway account settings |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14 (App Router), TypeScript |
| Styling | Tailwind CSS |
| Auth | Clerk |
| Frontend deploy | Vercel |
| Backend | FastAPI (Python 3.12) |
| Database | PostgreSQL (via SQLAlchemy async) |
| Cache | Redis |
| Migrations | Alembic |
| Backend deploy | Railway |
| Local dev | Docker Compose |
| CI/CD | GitHub Actions |

---

## Project Structure

```
url-shortener/
├── backend/
│   ├── app/
│   │   ├── api/routes/
│   │   │   ├── links.py        # CRUD endpoints
│   │   │   ├── redirect.py     # GET /r/{code}
│   │   │   └── stats.py        # GET /api/stats/{code}
│   │   ├── core/
│   │   │   ├── auth.py         # Clerk JWT verification
│   │   │   ├── config.py       # Pydantic settings
│   │   │   ├── redis.py        # Redis client
│   │   │   └── shortener.py    # Code generation logic
│   │   ├── db/
│   │   │   ├── models.py       # SQLAlchemy models
│   │   │   └── session.py      # Async engine + session
│   │   ├── schemas/            # Pydantic request/response schemas
│   │   └── main.py
│   ├── alembic/                # DB migrations
│   ├── tests/
│   ├── Dockerfile
│   └── requirements.txt
│
├── frontend/
│   ├── app/
│   │   ├── page.tsx            # Home
│   │   ├── dashboard/page.tsx  # Link management
│   │   └── stats/[code]/page.tsx
│   ├── components/
│   │   ├── Navbar.tsx
│   │   ├── ShortenForm.tsx
│   │   ├── ResultCard.tsx      # QR code + copy
│   │   ├── LinkTable.tsx       # Sortable, searchable
│   │   └── StatsChart.tsx      # Recharts line chart
│   ├── lib/
│   │   └── api.ts              # Typed fetch wrapper
│   └── middleware.ts           # Clerk auth middleware
│
├── docker-compose.yml
├── .github/workflows/
│   ├── ci.yml                  # lint + test on every push
│   └── deploy.yml              # auto-deploy on merge to main
└── README.md
```
