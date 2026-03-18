# 🚀 Vercel Deployment Guide

## Prerequisites

1. ✅ GitHub repo pushed: https://github.com/hariommaurya0609/uniblog.git
2. 🗄️ PostgreSQL database (choose one):
   - [Neon](https://neon.tech) - Recommended, free tier available
   - [Supabase](https://supabase.com) - Free tier available
   - [Railway](https://railway.app) - Easy setup

## Step 1: Set up PostgreSQL Database

### Option A: Neon (Recommended)

1. Go to [neon.tech](https://neon.tech) and sign up
2. Create a new project
3. Copy your connection strings:
   - **Pooled connection** (for Prisma queries) → `DATABASE_URL`
   - **Direct connection** (for migrations) → `DIRECT_URL`

Example:
```
DATABASE_URL=postgresql://user:password@ep-xyz.us-east-2.aws.neon.tech/uniblog?sslmode=require
DIRECT_URL=postgresql://user:password@ep-xyz.us-east-2.aws.neon.tech/uniblog?sslmode=require
```

### Option B: Supabase

1. Go to [supabase.com](https://supabase.com) and create project
2. Go to Settings → Database
3. Copy **Connection pooling** URL for `DATABASE_URL`
4. Copy **Connection string** URL for `DIRECT_URL`

## Step 2: Deploy to Vercel

### 1. Import Project

1. Go to [vercel.com](https://vercel.com) and sign in with GitHub
2. Click **"Add New..." → "Project"**
3. Import `hariommaurya0609/uniblog` repository
4. Click **"Import"**

### 2. Configure Environment Variables

Before deploying, add these environment variables:

```env
DATABASE_URL=postgresql://user:password@host/database
DIRECT_URL=postgresql://user:password@host/database
NODE_TLS_REJECT_UNAUTHORIZED=0
```

**How to add:**
1. In Vercel dashboard → Project Settings → Environment Variables
2. Add each variable for all environments (Production, Preview, Development)

### 3. Deploy

1. Click **"Deploy"**
2. Wait 2-3 minutes for build
3. Your site will be live at: `https://uniblog-xxx.vercel.app`

## Step 3: Seed the Database

After successful deployment:

### Option A: Use Vercel CLI (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Link project
vercel link

# Pull environment variables
vercel env pull

# Run seed script
npm run db:seed
```

### Option B: Use Local Machine

```bash
# Set production DATABASE_URL
export DATABASE_URL="your-neon-connection-string"

# Run seed
npx prisma db seed

# Verify
npx prisma studio
```

### Option C: Use Vercel Dashboard Terminal

1. Go to Vercel Dashboard → Your Project → Deployments
2. Click on latest deployment
3. Go to **"Terminal"** tab
4. Run:
   ```bash
   npm run db:seed
   ```

## Step 4: Initial Scrape

After seeding companies, scrape articles:

```bash
# Set production URL
export DATABASE_URL="your-neon-connection-string"

# Run scraper (limits to 100 articles per company)
NODE_TLS_REJECT_UNAUTHORIZED=0 npm run scrape
```

This will take ~10-15 minutes to scrape all 108 companies.

## Step 5: Set up Automatic Scraping (Optional)

The `vercel.json` already configures a cron job to scrape every hour:

```json
{
  "crons": [
    {
      "path": "/api/scrape",
      "schedule": "0 */1 * * *"
    }
  ]
}
```

This is automatically enabled on Vercel Pro plan. For free tier, you'll need to trigger scraping manually or upgrade.

## Troubleshooting

### Build fails with "DATABASE_URL is required"

Make sure you added `DATABASE_URL` and `DIRECT_URL` to Vercel environment variables.

### Prisma schema push fails

Check your PostgreSQL connection strings are correct. Test locally with:
```bash
export DATABASE_URL="your-connection-string"
npx prisma db push
```

### Articles not showing up

Run the seed and scrape commands as shown in Steps 3 & 4.

### Scraper timing out

This is normal for first scrape. Run locally with:
```bash
NODE_TLS_REJECT_UNAUTHORIZED=0 npm run scrape
```

## Custom Domain (Optional)

1. Go to Vercel Dashboard → Your Project → Settings → Domains
2. Add your custom domain (e.g., `uniblog.dev`)
3. Follow Vercel's DNS configuration instructions

## Success! 🎉

Your UniBlog is now live with:
- ✅ 108 tech company blogs
- ✅ Search by company, article, author
- ✅ Dark mode
- ✅ Mobile responsive
- ✅ Auto-scraping (Pro plan)

Visit your site and start reading! 📚
