# UniBlog — All Tech Blogs in One Place 🚀

A tech blog aggregator that brings engineering blogs from **108 companies** including Netflix, Uber, Airbnb, Meta, Google, Microsoft, AWS, Datadog, MongoDB, and many more into one unified feed.

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

## � Deploy to Vercel

### 1. Push to GitHub

```bash
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/hariommaurya0609/uniblog.git
git push -u origin main
```

### 2. Set up PostgreSQL Database

Create a PostgreSQL database on [Neon](https://neon.tech), [Supabase](https://supabase.com), or [Railway](https://railway.app).

Get two connection strings:

- **Pooled connection URL** (for queries) → `DATABASE_URL`
- **Direct connection URL** (for migrations) → `DIRECT_URL`

### 3. Deploy to Vercel

1. Go to [Vercel](https://vercel.com) and import your GitHub repo
2. Add environment variables:
   ```
   DATABASE_URL=postgresql://user:password@host:5432/database
   DIRECT_URL=postgresql://user:password@host:5432/database
   NODE_TLS_REJECT_UNAUTHORIZED=0
   ```
3. Deploy! 🎉

The build command in `vercel.json` automatically:

- Generates Prisma client
- Pushes schema to database
- Builds the Next.js app

### 4. Seed the Database

After first deploy, run locally:

```bash
# Set Vercel's DATABASE_URL
export DATABASE_URL="your-production-url"
npx prisma db seed
```

Or use Vercel's terminal in the dashboard.

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
