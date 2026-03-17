/**
 * Standalone scraper script.
 * Run with: npm run scrape
 * Dry run:  npm run scrape:dry
 */

import { PrismaClient } from "@prisma/client";
import RssParser from "rss-parser";
import https from "https";
import http from "http";

const prisma = new PrismaClient();

const COMPANY_CONFIGS = [
  // ─── Global Companies ──────────────────────────────────,
  {
    name: "Netflix",
    slug: "netflix",
    logo: "https://cdn.simpleicons.org/netflix/E50914",
    website: "https://netflix.com",
    blogUrl: "https://netflixtechblog.com",
    feedUrl: "https://medium.com/feed/netflix-techblog",
    feedType: "rss",
    color: "#E50914",
  },
  {
    name: "Airbnb",
    slug: "airbnb",
    logo: "https://cdn.simpleicons.org/airbnb/FF5A5F",
    website: "https://airbnb.com",
    blogUrl: "https://medium.com/airbnb-engineering",
    feedUrl: "https://medium.com/feed/airbnb-engineering",
    feedType: "rss",
    color: "#FF5A5F",
  },
  {
    name: "Meta",
    slug: "meta",
    logo: "https://cdn.simpleicons.org/meta/0081FB",
    website: "https://meta.com",
    blogUrl: "https://engineering.fb.com",
    feedUrl: "https://engineering.fb.com/feed/",
    feedType: "rss",
    color: "#0081FB",
  },
  {
    name: "GitHub",
    slug: "github",
    logo: "https://cdn.simpleicons.org/github/181717",
    website: "https://github.com",
    blogUrl: "https://github.blog/engineering",
    feedUrl: "https://github.blog/engineering/feed/",
    feedType: "rss",
    color: "#181717",
  },
  {
    name: "Spotify",
    slug: "spotify",
    logo: "https://cdn.simpleicons.org/spotify/1DB954",
    website: "https://spotify.com",
    blogUrl: "https://engineering.atspotify.com",
    feedUrl: "https://engineering.atspotify.com/feed/",
    feedType: "rss",
    color: "#1DB954",
  },
  {
    name: "Cloudflare",
    slug: "cloudflare",
    logo: "https://cdn.simpleicons.org/cloudflare/F38020",
    website: "https://cloudflare.com",
    blogUrl: "https://blog.cloudflare.com",
    feedUrl: "https://blog.cloudflare.com/rss/",
    feedType: "rss",
    color: "#F38020",
  },
  {
    name: "Stripe",
    slug: "stripe",
    logo: "https://cdn.simpleicons.org/stripe/635BFF",
    website: "https://stripe.com",
    blogUrl: "https://stripe.com/blog",
    feedUrl: "https://stripe.com/blog/feed.rss",
    feedType: "rss",
    color: "#635BFF",
  },
  {
    name: "AWS",
    slug: "aws",
    logo: "https://www.google.com/s2/favicons?domain=aws.amazon.com&sz=128",
    website: "https://aws.amazon.com",
    blogUrl: "https://aws.amazon.com/blogs/architecture",
    feedUrl: "https://aws.amazon.com/blogs/architecture/feed/",
    feedType: "rss",
    color: "#FF9900",
  },
  {
    name: "Dropbox",
    slug: "dropbox",
    logo: "https://cdn.simpleicons.org/dropbox/0061FF",
    website: "https://dropbox.com",
    blogUrl: "https://dropbox.tech",
    feedUrl: "https://dropbox.tech/feed",
    feedType: "rss",
    color: "#0061FF",
  },
  {
    name: "HashiCorp",
    slug: "hashicorp",
    logo: "https://cdn.simpleicons.org/hashicorp/000000",
    website: "https://hashicorp.com",
    blogUrl: "https://www.hashicorp.com/blog",
    feedUrl: "https://www.hashicorp.com/blog/feed.xml",
    feedType: "rss",
    color: "#000000",
  },
  // ─── Indian Startups ───────────────────────────────────,
  {
    name: "CRED",
    slug: "cred",
    logo: "https://www.google.com/s2/favicons?domain=cred.club&sz=128",
    website: "https://cred.club",
    blogUrl: "https://engineering.cred.club",
    feedUrl: "https://medium.com/feed/cred-engineering",
    feedType: "rss",
    color: "#1A1A2E",
  },
  {
    name: "Razorpay",
    slug: "razorpay",
    logo: "https://cdn.simpleicons.org/razorpay/0C2451",
    website: "https://razorpay.com",
    blogUrl: "https://engineering.razorpay.com",
    feedUrl: "https://engineering.razorpay.com/feed",
    feedType: "rss",
    color: "#0C2451",
  },
  {
    name: "Zerodha",
    slug: "zerodha",
    logo: "https://cdn.simpleicons.org/zerodha/387ED1",
    website: "https://zerodha.com",
    blogUrl: "https://zerodha.tech",
    feedUrl: "https://zerodha.tech/blog/index.xml",
    feedType: "rss",
    color: "#387ED1",
  },
  {
    name: "Flipkart",
    slug: "flipkart",
    logo: "https://www.google.com/s2/favicons?domain=flipkart.com&sz=128",
    website: "https://flipkart.com",
    blogUrl: "https://blog.flipkart.tech",
    feedUrl: "https://blog.flipkart.tech/feed",
    feedType: "rss",
    color: "#F7D03F",
  },
  {
    name: "Swiggy",
    slug: "swiggy",
    logo: "https://cdn.simpleicons.org/swiggy/FC8019",
    website: "https://swiggy.com",
    blogUrl: "https://bytes.swiggy.com",
    feedUrl: "https://medium.com/feed/swiggy-bytes",
    feedType: "rss",
    color: "#FC8019",
  },
  {
    name: "Groww",
    slug: "groww",
    logo: "https://www.google.com/s2/favicons?domain=groww.in&sz=128",
    website: "https://groww.in",
    blogUrl: "https://tech.groww.in",
    feedUrl: "https://tech.groww.in/feed",
    feedType: "rss",
    color: "#5367FF",
  },
];

const parser = new RssParser({
  timeout: 15_000,
  headers: {
    "User-Agent": "UniBlog/1.0 (Tech Blog Aggregator)",
    Accept:
      "application/rss+xml, application/atom+xml, application/xml, text/xml",
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
            timeout: 10000,
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
            res.on("data", (chunk: string) => {
              data += chunk;
              if (data.length > 200_000) req.destroy();
            });
            res.on("end", () => resolve(data));
            res.on("error", reject);
          },
        );
        req.on("error", reject);
        req.on("timeout", () => {
          req.destroy();
          reject(new Error("Timeout"));
        });
      });
    };

    const html = await fetchPage(pageUrl);
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

async function main() {
  const isDry = process.argv.includes("--dry");

  console.log(isDry ? "🧪 DRY RUN MODE\n" : "🕷️  Starting scraper...\n");

  // Step 1 — Sync companies
  console.log(`📦 Syncing ${COMPANY_CONFIGS.length} companies...\n`);
  for (const config of COMPANY_CONFIGS) {
    await prisma.company.upsert({
      where: { slug: config.slug },
      create: config,
      update: config,
    });
  }

  // Deactivate removed companies
  const activeSlugs = COMPANY_CONFIGS.map((c) => c.slug);
  await prisma.company.updateMany({
    where: { slug: { notIn: activeSlugs } },
    data: { isActive: false },
  });

  // Step 2 — Fetch active companies
  const companies = await prisma.company.findMany({
    where: { isActive: true },
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
      const feed = await parser.parseURL(company.feedUrl);
      const articles = feed.items || [];
      totalFound += articles.length;
      let newCount = 0;

      if (!isDry) {
        for (const item of articles) {
          const url = item.link;
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
