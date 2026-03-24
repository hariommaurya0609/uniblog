/**
 * Standalone scraper script.
 * Run with: npm run scrape
 * Dry run:  npm run scrape:dry
 */

import { PrismaClient } from "@prisma/client";
import RssParser from "rss-parser";
import https from "https";
import http from "http";
import { COMPANY_CONFIGS } from "../src/lib/scraper/companies.config";

const prisma = new PrismaClient();

const parser = new RssParser({
  timeout: 15_000,
  headers: {
    "User-Agent": "UniBlog/1.0 (Tech Blog Aggregator)",
    Accept:
      "text/html, application/rss+xml, application/atom+xml, application/xml, text/xml",
  },
  customFields: {
    item: [
      ["media:content", "mediaContent", { keepArray: false }],
      ["media:thumbnail", "mediaThumbnail", { keepArray: false }],
      ["dc:creator", "dcCreator"],
      ["content:encoded", "contentEncoded"],
    ],
  },
});

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "").trim();
}

function truncate(str: string, len: number): string {
  if (str.length <= len) return str;
  return str.slice(0, len).replace(/\s+\S*$/, "") + "…";
}

function estimateReadTime(text: string): string | null {
  const words = text.split(/\s+/).length;
  const minutes = Math.ceil(words / 200);
  return minutes > 0 ? `${minutes} min read` : null;
}

/** Race a promise against a timeout */
function withTimeout<T>(
  promise: Promise<T>,
  ms: number,
  fallback: T,
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((resolve) => setTimeout(() => resolve(fallback), ms)),
  ]);
}

/**
 * Fetch og:image from a URL by loading the page HTML and extracting the meta tag.
 */
async function fetchOgImage(pageUrl: string): Promise<string | null> {
  try {
    const fetchPage = (
      targetUrl: string,
      redirects = 0,
    ): Promise<string | null> => {
      if (redirects > 5) return Promise.resolve(null);

      const mod = targetUrl.startsWith("https") ? https : http;
      return new Promise<string | null>((resolve, reject) => {
        const req = mod.get(
          targetUrl,
          {
            headers: {
              "User-Agent": "UniBlog/1.0 (Tech Blog Aggregator)",
              Accept: "text/html",
            },
            rejectUnauthorized: false,
            timeout: 5000,
          } as Parameters<typeof https.get>[1],
          (res) => {
            if (
              res.statusCode &&
              res.statusCode >= 300 &&
              res.statusCode < 400 &&
              res.headers.location
            ) {
              let loc = res.headers.location;
              if (loc.startsWith("/")) {
                const parsed = new URL(targetUrl);
                loc = `${parsed.protocol}//${parsed.host}${loc}`;
              }
              res.resume();
              fetchPage(loc, redirects + 1)
                .then(resolve)
                .catch(reject);
              return;
            }
            let data = "";
            let destroyed = false;
            res.on("data", (chunk: string) => {
              data += chunk;
              if (data.length > 200_000) {
                destroyed = true;
                req.destroy();
                resolve(data);
              }
            });
            res.on("end", () => {
              if (!destroyed) resolve(data);
            });
            res.on("error", (err) => {
              if (!destroyed) reject(err);
            });
          },
        );
        req.on("error", reject);
        req.on("timeout", () => {
          req.destroy();
          reject(new Error("Timeout"));
        });
      });
    };

    const html = await withTimeout(fetchPage(pageUrl), 6000, null);
    if (!html) return null;

    const ogMatch = html.match(
      /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i,
    );
    if (ogMatch?.[1]) return ogMatch[1];

    const ogMatchReverse = html.match(
      /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i,
    );
    if (ogMatchReverse?.[1]) return ogMatchReverse[1];

    return null;
  } catch {
    return null;
  }
}

/**
 * Fetch a feed URL as raw XML, capping at maxBytes of uncompressed content.
 * Truncates cleanly at the last complete </item> so oversized feeds (e.g. 15 MB)
 * still parse correctly. Falls back to the full response if no </item> boundary found.
 */
async function fetchFeedXml(
  url: string,
  maxBytes = 2_000_000,
  redirects = 0,
): Promise<string | null> {
  if (redirects > 5) return null;
  return new Promise((resolve) => {
    const mod = url.startsWith("https") ? https : http;
    const req = mod.get(
      url,
      {
        headers: {
          "User-Agent": "UniBlog/1.0 (Tech Blog Aggregator)",
          Accept:
            "application/rss+xml, application/atom+xml, application/xml, text/xml, text/html",
        },
        rejectUnauthorized: false,
      },
      (res) => {
        if (
          res.statusCode &&
          res.statusCode >= 300 &&
          res.statusCode < 400 &&
          res.headers.location
        ) {
          let loc = res.headers.location as string;
          if (loc.startsWith("/")) {
            const parsed = new URL(url);
            loc = `${parsed.protocol}//${parsed.host}${loc}`;
          }
          req.destroy();
          res.resume();
          fetchFeedXml(loc, maxBytes, redirects + 1).then(resolve);
          return;
        }
        let data = "";
        res.on("data", (chunk: Buffer) => {
          data += chunk.toString();
          if (data.length >= maxBytes) {
            req.destroy();
            const lastItem = data.lastIndexOf("</item>");
            if (lastItem !== -1) {
              resolve(
                data.slice(0, lastItem + "</item>".length) + "</channel></rss>",
              );
            } else {
              resolve(data);
            }
          }
        });
        res.on("end", () => resolve(data));
        res.on("error", () => resolve(null));
      },
    );
    req.on("error", () => resolve(null));
    req.setTimeout(30_000, () => {
      req.destroy();
      resolve(null);
    });
  });
}

async function main() {
  const isDry = process.argv.includes("--dry");
  const onlyFlag = process.argv.find((a) => a.startsWith("--only="));
  const onlySlug = onlyFlag ? onlyFlag.split("=")[1] : null;

  console.log(isDry ? "🧪 DRY RUN MODE\n" : "🕷️  Starting scraper...\n");

  // Step 1 — Sync companies
  const configsToSync = onlySlug
    ? COMPANY_CONFIGS.filter((c) => c.slug === onlySlug)
    : COMPANY_CONFIGS;

  if (onlySlug && configsToSync.length === 0) {
    console.error(`❌ No company found with slug "${onlySlug}"`);
    process.exit(1);
  }

  console.log(`📦 Syncing ${configsToSync.length} companies...\n`);
  for (const config of configsToSync) {
    await prisma.company.upsert({
      where: { slug: config.slug },
      create: config,
      update: config,
    });
  }

  // Deactivate removed companies (skip when using --only)
  if (!onlySlug) {
    const activeSlugs = COMPANY_CONFIGS.map((c) => c.slug);
    await prisma.company.updateMany({
      where: { slug: { notIn: activeSlugs } },
      data: { isActive: false },
    });
  }

  // Step 2 — Fetch active companies
  const companies = await prisma.company.findMany({
    where: {
      isActive: true,
      ...(onlySlug ? { slug: onlySlug } : {}),
    },
  });

  console.log(`🔍 Scraping ${companies.length} feeds...\n`);

  let totalFound = 0;
  let totalNew = 0;
  let totalErrors = 0;

  for (const company of companies) {
    if (!company.feedUrl) {
      console.log(`⏭️  ${company.name} — No feed URL`);
      continue;
    }

    try {
      const xml = await withTimeout(
        fetchFeedXml(company.feedUrl),
        45_000,
        null,
      );
      if (!xml) throw new Error("Feed fetch timed out");
      const feed = await parser.parseString(xml);
      const articles = (feed.items || []).slice(0, 100); // Limit to 100 most recent articles
      totalFound += articles.length;
      let newCount = 0;

      if (!isDry) {
        for (const item of articles) {
          const url = item.link?.trim();
          if (!url) continue;

          // Extract image
          let imageUrl: string | null = null;
          if (item.enclosure?.url) imageUrl = item.enclosure.url;
          const mediaContent = (item as Record<string, unknown>)
            .mediaContent as { $?: { url?: string } } | undefined;
          const mediaThumbnail = (item as Record<string, unknown>)
            .mediaThumbnail as { $?: { url?: string } } | undefined;
          if (!imageUrl && mediaContent?.$?.url) imageUrl = mediaContent.$.url;
          if (!imageUrl && mediaThumbnail?.$?.url)
            imageUrl = mediaThumbnail.$.url;
          if (!imageUrl) {
            const contentHtml =
              ((item as Record<string, unknown>).contentEncoded as string) ||
              item.content ||
              "";
            const imgMatch = String(contentHtml).match(
              /<img[^>]+src=["']?([^"'\s>]+)["']?/i,
            );
            if (imgMatch?.[1]) imageUrl = imgMatch[1];
          }

          // Resolve relative image URLs (e.g. /img/foo.png → https://domain.com/img/foo.png)
          if (imageUrl && imageUrl.startsWith("/") && url) {
            try {
              const base = new URL(url);
              imageUrl = `${base.protocol}//${base.host}${imageUrl}`;
            } catch {
              /* ignore */
            }
          }

          // Strategy 4: Fetch og:image from article page
          if (!imageUrl && url) {
            imageUrl = await fetchOgImage(url);
          }

          // Description
          const rawDesc =
            item.contentSnippet || item.summary || item.content || "";
          const description = rawDesc
            ? truncate(stripHtml(rawDesc), 200)
            : null;

          // Read time
          const fullContent =
            ((item as Record<string, unknown>).contentEncoded as string) ||
            item.content ||
            "";
          const readTime = fullContent
            ? estimateReadTime(stripHtml(String(fullContent)))
            : null;

          try {
            let publishedAt: Date | null = null;
            try {
              if (item.pubDate) publishedAt = new Date(item.pubDate);
              else if (item.isoDate) publishedAt = new Date(item.isoDate);
              if (publishedAt && isNaN(publishedAt.getTime()))
                publishedAt = null;
            } catch {
              publishedAt = null;
            }

            await prisma.article.upsert({
              where: { originalUrl: url },
              create: {
                title: item.title?.trim() || "Untitled",
                description,
                author:
                  item.creator ||
                  ((item as Record<string, unknown>).dcCreator as string) ||
                  null,
                imageUrl,
                originalUrl: url,
                readTime,
                publishedAt,
                companyId: company.id,
              },
              update: {
                title: item.title?.trim() || "Untitled",
                description,
                author:
                  item.creator ||
                  ((item as Record<string, unknown>).dcCreator as string) ||
                  null,
                imageUrl,
                readTime,
              },
            });
            newCount++;
          } catch {
            // duplicate — skip
          }
        }
      }

      totalNew += newCount;
      console.log(
        `✅ ${company.name.padEnd(15)} — ${articles.length} found, ${newCount} saved`,
      );
    } catch (err) {
      totalErrors++;
      console.error(
        `❌ ${company.name.padEnd(15)} — ${String(err).slice(0, 100)}`,
      );
    }
  }

  console.log(`\n${"═".repeat(50)}`);
  console.log(
    `📊 Summary: ${totalFound} found, ${totalNew} saved, ${totalErrors} errors`,
  );
}

main()
  .catch((e) => {
    console.error("💥 Fatal error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
