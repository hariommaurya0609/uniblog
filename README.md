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

## 🚀 Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Set up environment variables

Create a `.env` file:

```env
# Transaction pooler (app runtime)
DATABASE_URL="postgresql://postgres.<ref>:<password>@<host>:6543/postgres?pgbouncer=true"
# Direct connection (migrations)
DIRECT_URL="postgresql://postgres.<ref>:<password>@<host>:5432/postgres"
CRON_SECRET="your-secret"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

> Get both URLs from your Supabase project → Settings → Database.

### 3. Push schema and seed companies

```bash
npx prisma db push
npm run db:seed
```

### 4. Scrape initial articles

```bash
# Fetches articles from all 108 companies (~5-10 min)
npm run scrape
```

### 5. Start the dev server

```bash
npm run dev
```

Visit **http://localhost:3000** 🎉

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
