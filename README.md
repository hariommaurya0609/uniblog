# UniBlog — All Tech Blogs in One Place

**GitHub:** https://github.com/hariommaurya0609/uniblog

A tech blog aggregator that brings engineering blogs from **108 companies** including Netflix, Uber, Airbnb, Meta, Google, Microsoft, AWS, Cloudflare, Vercel, Supabase, and many more into one unified feed.

## 🎯 Features

- **📚 108 Companies**: Aggregates blogs from FAANG, unicorns, and top tech companies worldwide
- **🔍 Smart Search**: Search by article title, description, author, or company name
- **🏷️ Company Filter**: Filter by any of the 108 companies with article counts
- **🌓 Dark Mode**: Beautiful light and dark themes
- **📱 Responsive**: Works perfectly on mobile, tablet, and desktop
- **🔄 Auto-Sync**: Automatically scrapes new articles (limited to 100 most recent per company)
- **⚡ Fast**: Server-side rendering with infinite scroll and lazy loading

## 🛠️ Tech Stack

| Layer      | Technology                        |
| ---------- | --------------------------------- |
| Frontend   | Next.js 15 (App Router), React 19 |
| Styling    | Tailwind CSS v4                   |
| Backend    | Next.js API Routes                |
| Database   | Supabase (PostgreSQL 17)          |
| ORM        | Prisma 6                          |
| Scraping   | rss-parser + cheerio              |
| Deployment | Vercel + Vercel Cron (daily)      |
| Icons      | Lucide React                      |

## 📂 Project Structure

```
uniblog/
├── prisma/
│   ├── schema.prisma          # Database schema
│   └── seed.ts                # Seed companies into DB
├── scripts/
│   └── scrape.ts              # Standalone scraper CLI
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── articles/route.ts   # GET articles with pagination
│   │   │   ├── companies/route.ts  # GET companies list
│   │   │   └── scrape/route.ts     # POST trigger scraper
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx                # Home page
│   ├── components/
│   │   ├── ArticleCard.tsx
│   │   ├── CompanyFilter.tsx
│   │   ├── Header.tsx
│   │   ├── SearchBar.tsx
│   │   └── Skeleton.tsx
│   ├── lib/
│   │   ├── prisma.ts               # Prisma client singleton
│   │   ├── utils.ts                # Helper utilities
│   │   └── scraper/
│   │       ├── index.ts            # Scraper orchestrator
│   │       ├── companies.config.ts # Company registry
│   │       ├── rss-parser.ts       # RSS feed parser
│   │       └── html-scraper.ts     # HTML scraping fallback
│   └── types/
│       └── index.ts                # TypeScript types
├── ARCHITECTURE.md                 # System design docs
├── package.json
├── next.config.ts
└── vercel.json                     # Vercel cron config
```

## 🚀 Local Setup (for Contributors)

### Prerequisites

- **Node.js** v24 or higher — check with `node -v`, install via [nvm](https://github.com/nvm-sh/nvm)
- **npm** v11 or higher — check with `npm -v`
- A **Supabase** account and project (free tier works)

> The project enforces these versions via `engines` in `package.json` and `.nvmrc`. If your version is too old, `npm install` will error out. Run `nvm install 24 && nvm use 24` to fix it.

---

### Step 1 — Clone & install dependencies

```bash
git clone https://github.com/hariommaurya0609/uniblog.git
cd uniblog
nvm use          # switches to Node 24 (reads .nvmrc)
npm ci           # ✅ use THIS — never modifies package-lock.json
```

> 🚫 **Do NOT run `npm install`** on a cloned repo. It rewrites `package-lock.json` every time, even on the same Node version if the npm patch version differs (e.g. `11.6.1` vs `11.11.0`). Always use `npm ci` — it installs exactly what's in the lockfile and never touches it.

---

### Step 2 — Create your `.env` file

> ⚠️ The `.env` file is gitignored and is **never committed**. Every contributor must create their own.

Create a file named `.env` in the project root:

```env
# ── Database (Supabase) ─────────────────────────────────────────────
# Used by the app at runtime (connection pooler, port 6543)
DATABASE_URL="postgresql://postgres.<project-ref>:<password>@aws-0-<region>.pooler.supabase.com:6543/postgres?pgbouncer=true"

# Used by Prisma for migrations/introspection (direct connection, port 5432)
DIRECT_URL="postgresql://postgres:<password>@db.<project-ref>.supabase.co:5432/postgres"

# ── App ─────────────────────────────────────────────────────────────
NODE_TLS_REJECT_UNAUTHORIZED="0"
CRON_SECRET="dev-secret-123"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

**Where to get these values:**

1. Go to [supabase.com/dashboard](https://supabase.com/dashboard) → your project
2. Navigate to **Project Settings → Database**
3. Under **Connection string**, select **URI**:
   - Copy the **Transaction pooler** URL (port `6543`) → paste as `DATABASE_URL`
   - Copy the **Session pooler / Direct** URL (port `5432`) → paste as `DIRECT_URL`, but change the host from `pooler.supabase.com` to `db.<project-ref>.supabase.co` and the username from `postgres.<project-ref>` to `postgres`

> ⚠️ **Special characters in password?** If your password contains `@`, `#`, `$`, `!`, `%`, etc., URL-encode them:
> `@` → `%40`, `#` → `%23`, `$` → `%24`, `!` → `%21`

**Example with password `Hariom@2024`:**

```env
DATABASE_URL="postgresql://postgres.abcxyz:Hariom%402024@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres:Hariom%402024@db.abcxyz.supabase.co:5432/postgres"
```

---

### Step 3 — Set up the database

```bash
# Generate Prisma client
npx prisma generate

# Push schema to your Supabase database
npx prisma db push

# Seed all 108 companies
npm run db:seed
```

---

### Step 4 — Scrape initial articles

```bash
# Fetches articles from all 108 companies (~5–10 min)
npm run scrape
```

---

### Step 5 — Start the dev server

```bash
npm run dev
```

Visit **http://localhost:3000** 🎉

---

### Troubleshooting

| Error                                 | Fix                                                                                                                                                      |
| ------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `P1000: Authentication failed`        | Password has special characters — URL-encode them (e.g. `@` → `%40`). Also make sure `DIRECT_URL` uses `db.<ref>.supabase.co`, not `pooler.supabase.com` |
| `Cannot find module '@prisma/client'` | Run `npx prisma generate`                                                                                                                                |
| `Table does not exist`                | Run `npx prisma db push`                                                                                                                                 |
| `No articles showing`                 | Run `npm run scrape` to populate the database                                                                                                            |
| `package-lock.json` keeps changing    | You're using a different Node/npm version. Run `nvm use` then `npm ci` instead of `npm install`                                                          |
| `Unsupported engine` error            | Your Node/npm is too old. Run `nvm install 24 && nvm use 24`, then retry                                                                                 |

## � Deploy to Vercel

### 1. Create a PostgreSQL database

Use [Supabase](https://supabase.com) (recommended), [Neon](https://neon.tech), or [Railway](https://railway.app).

### 2. Set environment variables in Vercel

Go to your Vercel project → Settings → Environment Variables:

| Variable                       | Value                                           |
| ------------------------------ | ----------------------------------------------- |
| `DATABASE_URL`                 | Transaction pooler URL (port 6543 for Supabase) |
| `DIRECT_URL`                   | Session/direct URL (port 5432 for Supabase)     |
| `CRON_SECRET`                  | A random secret string                          |
| `NEXT_PUBLIC_APP_URL`          | Your Vercel deployment URL                      |
| `NODE_TLS_REJECT_UNAUTHORIZED` | `0` (required for Supabase SSL)                 |

### 3. Deploy

Push to `main` — Vercel auto-deploys:

```bash
git push origin main
```

### 4. Seed the production database

Run once after first deploy:

```bash
DATABASE_URL="your-production-url" npx prisma db seed
npm run scrape
```

### Cron Job

`vercel.json` runs the scraper every day at 2am UTC automatically (Vercel Hobby plan).

## �📡 API Endpoints

### `GET /api/articles`

Fetch paginated articles with filtering.

| Param   | Type   | Default     | Description              |
| ------- | ------ | ----------- | ------------------------ |
| page    | number | 1           | Page number              |
| limit   | number | 20 (max 50) | Articles per page        |
| company | string | —           | Filter by company slug   |
| search  | string | —           | Search title/description |
| sort    | string | publishedAt | Sort field               |
| order   | string | desc        | Sort order (asc/desc)    |

### `GET /api/companies`

Get all active companies with article counts.

### `POST /api/scrape`

Trigger the scraper (protected by `CRON_SECRET`).

## 🏗️ Architecture

See [ARCHITECTURE.md](./ARCHITECTURE.md) for the full system design.

## 📄 License

MIT
