/**
 * Migrate data from SQLite to PostgreSQL using batch inserts.
 * Run with: npx tsx scripts/migrate-to-postgres.ts
 */

import { PrismaClient } from "@prisma/client";
import Database from "better-sqlite3";
import path from "path";

const POSTGRES_URL =
  "postgresql://postgres.lykdkofsetfoftwflezc:Hariom%4021121@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres";

const BATCH_SIZE = 100; // Insert 100 articles at a time

const sqliteDb = new Database(path.join(process.cwd(), "prisma/dev.db"), {
  readonly: true,
});

const postgresClient = new PrismaClient({
  datasources: { db: { url: POSTGRES_URL } },
});

async function migrate() {
  console.log("🚀 Starting migration from SQLite to PostgreSQL...\n");

  try {
    // Step 1: Read all data from SQLite (fast, local)
    console.log("📦 Fetching data from SQLite...");
    const companies = sqliteDb
      .prepare("SELECT * FROM companies ORDER BY name")
      .all() as any[];
    const articles = sqliteDb
      .prepare("SELECT * FROM articles ORDER BY companyId, publishedAt DESC")
      .all() as any[];
    console.log(`   ✅ ${companies.length} companies, ${articles.length} articles\n`);

    // Step 2: Clear PostgreSQL
    console.log("🗑️  Clearing PostgreSQL database...");
    await postgresClient.article.deleteMany();
    await postgresClient.company.deleteMany();
    console.log("   ✅ Cleared\n");

    // Step 3: Batch-insert companies (single query)
    console.log("📝 Migrating companies...");
    await postgresClient.company.createMany({
      data: companies.map((c) => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        logo: c.logo,
        website: c.website,
        blogUrl: c.blogUrl,
        feedUrl: c.feedUrl,
        feedType: c.feedType,
        color: c.color,
        isActive: c.isActive === 1,
        createdAt: new Date(c.createdAt),
        updatedAt: new Date(c.updatedAt),
      })),
      skipDuplicates: true,
    });
    console.log(`   ✅ Migrated ${companies.length} companies\n`);

    // Step 4: Batch-insert articles in chunks of BATCH_SIZE
    console.log(`📰 Migrating ${articles.length} articles in batches of ${BATCH_SIZE}...`);
    let migratedCount = 0;

    for (let i = 0; i < articles.length; i += BATCH_SIZE) {
      const batch = articles.slice(i, i + BATCH_SIZE);
      await postgresClient.article.createMany({
        data: batch.map((a) => ({
          id: a.id,
          title: a.title,
          description: a.description,
          author: a.author,
          imageUrl: a.imageUrl,
          originalUrl: a.originalUrl,
          readTime: a.readTime,
          publishedAt: new Date(a.publishedAt),
          createdAt: new Date(a.createdAt),
          updatedAt: new Date(a.updatedAt),
          companyId: a.companyId,
        })),
        skipDuplicates: true,
      });
      migratedCount += batch.length;
      process.stdout.write(`   [${migratedCount}/${articles.length}] ✅\n`);
    }
    console.log(`\n   ✅ Migrated ${migratedCount} articles\n`);

    // Step 5: Verify
    console.log("🔍 Verifying...");
    const pgCompanyCount = await postgresClient.company.count();
    const pgArticleCount = await postgresClient.article.count();
    console.log(`   Companies: ${pgCompanyCount} / ${companies.length}`);
    console.log(`   Articles:  ${pgArticleCount} / ${articles.length}`);

    if (pgCompanyCount === companies.length && pgArticleCount === articles.length) {
      console.log("\n✅ Migration completed successfully! 🎉");
    } else {
      console.log("\n⚠️  Some records may be missing. Check for errors above.");
    }
  } catch (error) {
    console.error("❌ Migration failed:", error);
    throw error;
  } finally {
    sqliteDb.close();
    await postgresClient.$disconnect();
  }
}

migrate().then(() => process.exit(0)).catch(() => process.exit(1));


// SQLite database (direct connection)
const sqliteDb = new Database(path.join(process.cwd(), "prisma/dev.db"), {
  readonly: true,
});

// PostgreSQL client - uses DATABASE_URL env var or falls back to the hardcoded Supabase URL
const POSTGRES_URL = process.env.DATABASE_URL?.startsWith("postgresql")
  ? process.env.DATABASE_URL
  : "postgresql://postgres.lykdkofsetfoftwflezc:Hariom%4021121@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres";

const postgresClient = new PrismaClient({
  datasources: { db: { url: POSTGRES_URL } },
});

async function migrate() {
  console.log("🚀 Starting migration from SQLite to PostgreSQL...\n");

  try {
    // Step 1: Fetch all data from SQLite
    console.log("📦 Fetching data from SQLite...");

    const companies = sqliteDb
      .prepare("SELECT * FROM companies ORDER BY name")
      .all() as any[];
    console.log(`   ✅ Found ${companies.length} companies`);

    const articles = sqliteDb
      .prepare("SELECT * FROM articles ORDER BY companyId, publishedAt DESC")
      .all() as any[];
    console.log(`   ✅ Found ${articles.length} articles\n`);

    // Step 2: Clear PostgreSQL database (optional - comment out if you want to keep existing data)
    console.log("🗑️  Clearing PostgreSQL database...");
    await postgresClient.article.deleteMany();
    await postgresClient.company.deleteMany();
    console.log("   ✅ Database cleared\n");

    // Step 3: Migrate companies first
    console.log("📝 Migrating companies...");

    for (const company of companies) {
      await postgresClient.company.create({
        data: {
          id: company.id,
          name: company.name,
          slug: company.slug,
          logo: company.logo,
          website: company.website,
          blogUrl: company.blogUrl,
          feedUrl: company.feedUrl,
          feedType: company.feedType,
          color: company.color,
          isActive: company.isActive === 1, // Convert SQLite integer to boolean
          createdAt: new Date(company.createdAt),
          updatedAt: new Date(company.updatedAt),
        },
      });

      process.stdout.write(`   ✅ ${company.name}\n`);
    }
    console.log(`\n   ✅ Migrated ${companies.length} companies\n`);

    // Step 4: Migrate articles
    console.log("📰 Migrating articles...");
    let migratedCount = 0;
    const companiesWithArticles = new Set(articles.map((a) => a.companyId));

    for (const companyId of companiesWithArticles) {
      const companyArticles = articles.filter((a) => a.companyId === companyId);
      const company = companies.find((c) => c.id === companyId);

      process.stdout.write(
        `   Migrating ${companyArticles.length} articles from ${company?.name || companyId}... `,
      );

      for (const article of companyArticles) {
        await postgresClient.article.create({
          data: {
            id: article.id,
            title: article.title,
            description: article.description,
            author: article.author,
            imageUrl: article.imageUrl,
            originalUrl: article.originalUrl,
            readTime: article.readTime,
            publishedAt: new Date(article.publishedAt),
            createdAt: new Date(article.createdAt),
            updatedAt: new Date(article.updatedAt),
            companyId: article.companyId,
          },
        });
        migratedCount++;
      }

      console.log(`✅`);
    }

    console.log(`\n   ✅ Migrated ${migratedCount} articles\n`);

    // Step 5: Verify migration
    console.log("🔍 Verifying migration...");
    const pgCompanyCount = await postgresClient.company.count();
    const pgArticleCount = await postgresClient.article.count();

    console.log(`   PostgreSQL now has:`);
    console.log(`   - ${pgCompanyCount} companies`);
    console.log(`   - ${pgArticleCount} articles\n`);

    if (
      pgCompanyCount === companies.length &&
      pgArticleCount === articles.length
    ) {
      console.log("✅ Migration completed successfully! 🎉\n");
      console.log("Next steps:");
      console.log("1. Test your app locally: npm run dev");
      console.log("2. Check data: npx prisma studio");
      console.log("3. If everything looks good, you can delete prisma/dev.db");
    } else {
      console.log("⚠️  Warning: Counts don't match. Please verify manually.");
    }
  } catch (error) {
    console.error("❌ Migration failed:", error);
    throw error;
  } finally {
    sqliteDb.close();
    await postgresClient.$disconnect();
  }
}

migrate()
  .then(() => {
    console.log("\n✅ Done!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Error:", error);
    process.exit(1);
  });
