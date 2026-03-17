# UniBlog — System Architecture

> A tech blog aggregator that brings engineering blogs from top companies into one unified feed.

## 📐 High-Level Architecture

```
                          ┌─────────────────────────────────────────────┐
                          │              CLIENT BROWSER                 │
                          │  ┌─────────────────────────────────────┐    │
                          │  │      Next.js SSR + CSR Frontend     │    │
                          │  │  ┌──────┐ ┌────────┐ ┌──────────┐  │    │
                          │  │  │ Home │ │Company │ │ Search/  │  │    │
                          │  │  │ Feed │ │ Page   │ │ Filter   │  │    │
                          │  │  └──────┘ └────────┘ └──────────┘  │    │
                          │  └─────────────────────────────────────┘    │
                          └──────────────────┬──────────────────────────┘
                                             │ HTTP / SSR
                          ┌──────────────────▼──────────────────────────┐
                          │            NEXT.JS SERVER                    │
                          │  ┌─────────────────────────────────────┐    │
                          │  │         API Routes Layer             │    │
                          │  │  ┌──────────┐ ┌───────────────────┐ │    │
                          │  │  │/api/     │ │/api/companies     │ │    │
                          │  │  │articles  │ │                   │ │    │
                          │  │  └──────────┘ └───────────────────┘ │    │
                          │  │  ┌──────────────────────────────┐   │    │
                          │  │  │ /api/scrape (admin/cron)     │   │    │
                          │  │  └──────────────────────────────┘   │    │
                          │  └─────────────────────────────────────┘    │
                          │  ┌─────────────────────────────────────┐    │
                          │  │         Scraper Engine               │    │
                          │  │  ┌──────────┐ ┌──────────┐          │    │
                          │  │  │RSS/Atom  │ │HTML      │          │    │
                          │  │  │Parser    │ │Scraper   │          │    │
                          │  │  └──────────┘ └──────────┘          │    │
                          │  └─────────────────────────────────────┘    │
                          └──────────────────┬──────────────────────────┘
                                             │ Prisma ORM
                          ┌──────────────────▼──────────────────────────┐
                          │           DATABASE LAYER                    │
                          │  ┌─────────────────────────────────────┐    │
                          │  │  PostgreSQL (prod) / SQLite (dev)   │    │
                          │  │  ┌───────────┐ ┌──────────┐         │    │
                          │  │  │ companies │ │ articles │         │    │
                          │  │  └───────────┘ └──────────┘         │    │
                          │  │  ┌──────┐ ┌──────────────┐          │    │
                          │  │  │ tags │ │ article_tags │          │    │
                          │  │  └──────┘ └──────────────┘          │    │
                          │  └─────────────────────────────────────┘    │
                          └────────────────────────────────────────────┘
```

## 🔄 Data Flow

### 1. Scraping Pipeline

```
Cron Job (every 30 min)
    │
    ├──▶ For each Company in DB:
    │        │
    │        ├── Has RSS feed? ──▶ rss-parser ──▶ Parse items
    │        │
    │        └── No RSS feed?  ──▶ cheerio ──▶ Scrape HTML
    │                                  │
    │                                  ▼
    │                          Extract metadata:
    │                          - title
    │                          - description
    │                          - author
    │                          - image (og:image)
    │                          - readTime
    │                          - publishedAt
    │                          - originalUrl
    │                                  │
    │                                  ▼
    │                          Dedup by originalUrl
    │                                  │
    │                                  ▼
    │                          Upsert into PostgreSQL
    │
    └──▶ Log results & errors
```

### 2. User Request Flow

```
User visits uniblog.dev
    │
    ├──▶ SSR renders page with initial articles (first 20)
    │
    ├──▶ User scrolls ──▶ Infinite scroll ──▶ GET /api/articles?page=2
    │
    ├──▶ User filters by company ──▶ GET /api/articles?company=netflix
    │
    ├──▶ User searches ──▶ GET /api/articles?q=microservices
    │
    └──▶ User clicks article ──▶ window.open(originalUrl) ──▶ Company blog
```

## 🗄️ Database Schema (ERD)

```
┌──────────────────────┐       ┌──────────────────────────────────┐
│     companies        │       │           articles               │
├──────────────────────┤       ├──────────────────────────────────┤
│ id          (PK)     │───┐   │ id              (PK)            │
│ name        VARCHAR  │   │   │ companyId       (FK) ──────────┐│
│ slug        UNIQUE   │   │   │ title           TEXT            ││
│ logo        URL      │   └──▶│ description     TEXT            ││
│ website     URL      │       │ author          VARCHAR         ││
│ blogUrl     URL      │       │ imageUrl        URL             ││
│ feedUrl     URL      │       │ originalUrl     UNIQUE          ││
│ feedType    ENUM     │       │ readTime        VARCHAR         ││
│ color       HEX      │       │ publishedAt     DATETIME        ││
│ isActive    BOOL     │       │ createdAt       DATETIME        ││
│ createdAt   DATETIME │       │ updatedAt       DATETIME        ││
│ updatedAt   DATETIME │       └──────────────────────────────────┘│
└──────────────────────┘                                           │
                                                                   │
┌──────────────────────┐       ┌──────────────────────────┐       │
│       tags           │       │     article_tags         │       │
├──────────────────────┤       ├──────────────────────────┤       │
│ id          (PK)     │───┐   │ articleId    (FK) ───────┘       │
│ name        UNIQUE   │   └──▶│ tagId        (FK)               │
│ slug        UNIQUE   │       │ (composite PK)                  │
│ createdAt   DATETIME │       └──────────────────────────┘       │
└──────────────────────┘
```

## 🌐 Supported Blog Sources

### Tier 1 — RSS/Atom Feeds (Reliable, structured)

| Company    | Feed URL                                          |
| ---------- | ------------------------------------------------- |
| Netflix    | `https://netflixtechblog.com/feed`                |
| Uber       | `https://www.uber.com/blog/engineering/rss/`      |
| Airbnb     | `https://medium.com/airbnb-engineering/feed`      |
| Meta       | `https://engineering.fb.com/feed/`                |
| GitHub     | `https://github.blog/engineering/feed/`           |
| Spotify    | `https://engineering.atspotify.com/feed/`         |
| Cloudflare | `https://blog.cloudflare.com/rss/`                |
| Shopify    | `https://shopify.engineering/blog/feed`           |
| LinkedIn   | `https://engineering.linkedin.com/blog.rss`       |
| Stripe     | `https://stripe.com/blog/feed.rss`                |
| AWS        | `https://aws.amazon.com/blogs/architecture/feed/` |
| Dropbox    | `https://dropbox.tech/feed`                       |
| HashiCorp  | `https://www.hashicorp.com/blog/feed.xml`         |
| Figma      | `https://www.figma.com/blog/feed/`                |
| Vercel     | `https://vercel.com/blog/rss.xml`                 |

### Tier 2 — Web Scraping (When RSS unavailable)

- Google AI Blog
- Apple Machine Learning
- Custom scraper per site using Cheerio

## 📡 API Design

### GET `/api/articles`

```json
{
  "query_params": {
    "page": 1,
    "limit": 20,
    "company": "netflix",
    "search": "microservices",
    "sort": "publishedAt",
    "order": "desc"
  },
  "response": {
    "articles": [...],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 1500,
      "totalPages": 75,
      "hasNext": true
    }
  }
}
```

### GET `/api/companies`

```json
{
  "response": {
    "companies": [
      {
        "id": "...",
        "name": "Netflix",
        "slug": "netflix",
        "logo": "/logos/netflix.svg",
        "articleCount": 245
      }
    ]
  }
}
```

### POST `/api/scrape` (Admin only, triggered by cron)

```json
{
  "headers": { "Authorization": "Bearer <CRON_SECRET>" },
  "response": {
    "success": true,
    "scraped": 15,
    "errors": 0,
    "companies": ["netflix", "uber", "airbnb"]
  }
}
```

## 🚀 Deployment Architecture

```
┌──────────────────────────────────────────────────┐
│                   Vercel                          │
│  ┌────────────────────────────────────────────┐  │
│  │  Next.js App (Frontend + API)              │  │
│  │  • Edge-optimized SSR                      │  │
│  │  • API routes at /api/*                    │  │
│  │  • Vercel Cron for scheduled scraping      │  │
│  └────────────────────┬───────────────────────┘  │
│                       │                          │
└───────────────────────┼──────────────────────────┘
                        │
            ┌───────────▼───────────┐
            │  Supabase / Neon      │
            │  PostgreSQL Database  │
            │  • Connection pooling │
            │  • Auto backups       │
            └───────────────────────┘
```

## 📊 Scaling Considerations

1. **Caching**: ISR (Incremental Static Regeneration) for the home feed — revalidate every 5 min
2. **Rate Limiting**: Respect robots.txt, add delays between scrapes
3. **Deduplication**: Unique constraint on `originalUrl` prevents duplicate articles
4. **Image Proxy**: Use `next/image` with remote patterns to optimize images
5. **Search**: Start with SQL LIKE, migrate to full-text search / Meilisearch later
6. **Monitoring**: Track scraper health, feed availability, error rates

## 🛡️ Legal & Ethical Considerations

- ✅ Only store metadata (title, description, image URL) — NOT full article content
- ✅ Always link to the original article — drive traffic to the source
- ✅ Respect `robots.txt` and rate limits
- ✅ Use RSS feeds when available (they're meant for syndication)
- ✅ Add proper attribution to each company
- ⚠️ Cache images through your own proxy to avoid hotlinking
