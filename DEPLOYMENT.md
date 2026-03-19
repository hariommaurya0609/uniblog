# 🚀 Vercel Deployment Guide

## Prerequisites

1. ✅ GitHub repo pushed: https://github.com/hariommaurya0609/uniblog.git
2. 🗄️ PostgreSQL database (choose one):
   - [Neon](https://neon.tech) - Recommended, free tier available
   - [Supabase](https://supabase.com) - Free tier available
   - [AWS RDS](https://aws.amazon.com/rds/) - Enterprise-grade, scalable
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

### Option C: AWS RDS PostgreSQL

**1. Create RDS Instance:**

1. Go to [AWS RDS Console](https://console.aws.amazon.com/rds/)
2. Click **"Create database"**
3. Choose:
   - Engine: **PostgreSQL**
   - Template: **Free tier** or **Production** (depending on your needs)
   - DB instance identifier: `uniblog-db`
   - Master username: `postgres` (or custom)
   - Master password: (set secure password)
4. Instance configuration:
   - Instance class: `db.t3.micro` (free tier) or `db.t4g.micro`
   - Storage: 20 GB (expandable)
5. Connectivity:
   - Public access: **Yes** (for Vercel to connect)
   - VPC security group: Create new → Allow PostgreSQL (port 5432) from anywhere (0.0.0.0/0)
6. Additional configuration:
   - Initial database name: `uniblog`
7. Click **"Create database"** (takes 5-10 minutes)

**2. Get Connection String:**

After database is created:

1. Click on your database instance
2. Copy the **Endpoint** (e.g., `uniblog-db.abc123.us-east-1.rds.amazonaws.com`)
3. Build connection strings:

```env
# For both DATABASE_URL and DIRECT_URL use:
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@uniblog-db.abc123.us-east-1.rds.amazonaws.com:5432/uniblog?sslmode=require
DIRECT_URL=postgresql://postgres:YOUR_PASSWORD@uniblog-db.abc123.us-east-1.rds.amazonaws.com:5432/uniblog?sslmode=require
```

Replace:

- `YOUR_PASSWORD` with your master password
- `uniblog-db.abc123.us-east-1.rds.amazonaws.com` with your actual endpoint

**3. Configure Security Group:**

Make sure port 5432 is open:

1. Go to EC2 → Security Groups
2. Find your RDS security group
3. Inbound rules → Add rule:
   - Type: PostgreSQL
   - Port: 5432
   - Source: 0.0.0.0/0 (or Vercel IPs for better security)

**Important Notes:**

- AWS RDS is **NOT free** after 12 months free tier expires (~$15-20/month for db.t3.micro)
- For production, consider using connection pooling with [RDS Proxy](https://aws.amazon.com/rds/proxy/)
- Enable automated backups for production databases

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
