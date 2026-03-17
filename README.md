# UniBlog — All Tech Blogs in One Place 🚀

A tech blog aggregator that brings engineering blogs from Netflix, Uber, Airbnb, Meta, GitHub, Spotify, Cloudflare, and many more into one unified feed.

## 🎯 What It Does

As developers, we all read engineering blogs from top tech companies — but visiting each site individually is time-consuming. UniBlog solves this by:

- **Aggregating** 15+ company engineering blogs into one feed
- **Displaying** article image, title, description, author, and read time
- **Redirecting** users to the original blog post on click
- **Filtering** by company and searching across all articles
- **Auto-scraping** new articles every hour via cron

## 🛠️ Tech Stack

| Layer      | Technology                        |
| ---------- | --------------------------------- |
| Frontend   | Next.js 15 (App Router), React 19 |
| Styling    | Tailwind CSS v4                   |
| Backend    | Next.js API Routes                |
| Database   | SQLite (dev) / PostgreSQL (prod)  |
| ORM        | Prisma                            |
| Scraping   | rss-parser + cheerio              |
| Deployment | Vercel + Vercel Cron              |
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

### 2. Set up the database

```bash
# Create the .env file
cp .env.example .env

# Generate Prisma client & push schema to SQLite
npx prisma generate
npx prisma db push
```

### 3. Seed companies

```bash
npm run db:seed
```

### 4. Scrape articles

```bash
# Dry run (just see what would be scraped)
npm run scrape:dry

# Actually scrape and save articles
npm run scrape
```

### 5. Start the dev server

```bash
npm run dev
```

Visit **http://localhost:3000** 🎉

## 📡 API Endpoints

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
