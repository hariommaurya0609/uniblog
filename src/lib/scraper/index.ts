import { prisma } from "@/lib/prisma";
import { parseRssFeed } from "./rss-parser";
import { COMPANY_CONFIGS } from "./companies.config";
import type { ScrapeResult } from "@/types";

/**
 * Main scraper orchestrator.
 *
 * 1. Ensures all companies from config exist in DB
 * 2. For each active company, fetches articles via RSS or scraper
 * 3. Upserts articles (dedup by originalUrl)
 * 4. Returns summary of results
 */
export async function runScraper(): Promise<ScrapeResult[]> {
  const results: ScrapeResult[] = [];

  // Step 1: Sync companies from config to database
  await syncCompanies();

  // Step 2: Fetch active companies
  const companies = await prisma.company.findMany({
    where: { isActive: true },
  });

  // Step 3: Scrape each company (with concurrency limit)
  const CONCURRENCY = 3;
  for (let i = 0; i < companies.length; i += CONCURRENCY) {
    const batch = companies.slice(i, i + CONCURRENCY);
    const batchResults = await Promise.allSettled(
      batch.map((company) =>
        scrapeCompany(
          company.id,
          company.slug,
          company.feedUrl,
          company.feedType,
        ),
      ),
    );

    for (const result of batchResults) {
      if (result.status === "fulfilled") {
        results.push(result.value);
      } else {
        results.push({
          company: batch[batchResults.indexOf(result)]?.slug || "unknown",
          articlesFound: 0,
          articlesNew: 0,
          errors: [String(result.reason)],
        });
      }
    }
  }

  return results;
}

/**
 * Sync company configs to database (upsert).
 */
async function syncCompanies() {
  for (const config of COMPANY_CONFIGS) {
    await prisma.company.upsert({
      where: { slug: config.slug },
      create: {
        name: config.name,
        slug: config.slug,
        logo: config.logo,
        website: config.website,
        blogUrl: config.blogUrl,
        feedUrl: config.feedUrl,
        feedType: config.feedType,
        color: config.color,
      },
      update: {
        name: config.name,
        logo: config.logo,
        website: config.website,
        blogUrl: config.blogUrl,
        feedUrl: config.feedUrl,
        feedType: config.feedType,
        color: config.color,
      },
    });
  }
}

/**
 * Scrape a single company's blog.
 */
async function scrapeCompany(
  companyId: string,
  slug: string,
  feedUrl: string | null,
  feedType: string,
): Promise<ScrapeResult> {
  const result: ScrapeResult = {
    company: slug,
    articlesFound: 0,
    articlesNew: 0,
    errors: [],
  };

  try {
    let articles;

    if (feedType === "rss" || feedType === "atom") {
      if (!feedUrl) {
        result.errors.push("No feed URL configured");
        return result;
      }
      articles = await parseRssFeed(feedUrl);
    } else {
      // TODO: Add scrape configs per company
      result.errors.push(
        `Scrape type "${feedType}" not yet implemented for ${slug}`,
      );
      return result;
    }

    result.articlesFound = articles.length;

    // Upsert articles (skip duplicates)
    for (const article of articles) {
      if (!article.originalUrl) continue;

      try {
        await prisma.article.upsert({
          where: { originalUrl: article.originalUrl },
          create: {
            title: article.title,
            description: article.description,
            author: article.author,
            imageUrl: article.imageUrl,
            originalUrl: article.originalUrl,
            readTime: article.readTime,
            publishedAt: article.publishedAt,
            companyId,
          },
          update: {
            title: article.title,
            description: article.description,
            author: article.author,
            imageUrl: article.imageUrl,
            readTime: article.readTime,
          },
        });
        result.articlesNew++;
      } catch (err) {
        // Likely a duplicate — skip silently
        if (String(err).includes("Unique constraint")) continue;
        result.errors.push(`Article save error: ${String(err).slice(0, 100)}`);
      }
    }
  } catch (err) {
    result.errors.push(`Feed error: ${String(err).slice(0, 200)}`);
  }

  return result;
}
