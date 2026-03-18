import { PrismaClient } from "@prisma/client";
import RssParser from "rss-parser";
import https from "https";
import http from "http";
import { COMPANY_CONFIGS } from "../src/lib/scraper/companies.config";

const prisma = new PrismaClient();

const parser = new RssParser({
  timeout: 20_000,
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
            res.on("data", (chunk) => (data += chunk));
            res.on("end", () => {
              const ogMatch = data.match(
                /<meta\s+property=["']og:image["']\s+content=["']([^"']+)["']/i,
              );
              const twitterMatch = data.match(
                /<meta\s+name=["']twitter:image["']\s+content=["']([^"']+)["']/i,
              );
              resolve(ogMatch?.[1] || twitterMatch?.[1] || null);
            });
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

    return await withTimeout(fetchPage(pageUrl), 8000, null);
  } catch {
    return null;
  }
}

async function scrapeMongoDB() {
  const companyConfig = COMPANY_CONFIGS.find((c) => c.slug === "mongodb");

  if (!companyConfig) {
    console.error("❌ MongoDB not found in company configs");
    return;
  }

  const company = await prisma.company.findUnique({
    where: { slug: "mongodb" },
  });

  if (!company) {
    console.error("❌ MongoDB company not found in database");
    return;
  }

  console.log(`🔍 Scraping ${company.name}...`);
  console.log(`   Feed URL: ${companyConfig.feedUrl}\n`);

  try {
    const feed = await parser.parseURL(companyConfig.feedUrl);
    const articles = (feed.items || []).slice(0, 100);

    console.log(`✅ Found ${articles.length} articles\n`);

    let scrapeCount = 0;
    let updateCount = 0;

    for (let i = 0; i < articles.length; i++) {
      const item = articles[i];
      const url = item.link;

      if (!url) continue;

      process.stdout.write(
        `[${i + 1}/${articles.length}] ${item.title?.substring(0, 50)}... `,
      );

      // MongoDB RSS feed has NO images in feed, must fetch og:image
      const imageUrl = await fetchOgImage(url);

      if (imageUrl) {
        console.log(`✅ (${imageUrl.substring(0, 60)}...)`);
      } else {
        console.log(`⚠️ (no image found)`);
      }

      const rawDesc = item.contentSnippet || item.summary || item.content || "";
      const description = rawDesc ? truncate(stripHtml(rawDesc), 300) : null;
      const fullText =
        (item as any).contentEncoded ||
        item.content ||
        item.contentSnippet ||
        "";
      const readTime = estimateReadTime(stripHtml(fullText));
      const author =
        (item as any).dcCreator || item.creator || item.author || null;
      const pubDate = item.pubDate || item.isoDate;
      const publishedAt = pubDate ? new Date(pubDate) : null;

      try {
        const result = await prisma.article.upsert({
          where: { originalUrl: url },
          create: {
            title: item.title || "Untitled",
            description,
            author,
            imageUrl,
            originalUrl: url,
            readTime,
            publishedAt,
            companyId: company.id,
          },
          update: {
            title: item.title || "Untitled",
            description,
            author,
            imageUrl,
            readTime,
            publishedAt,
          },
        });

        if (result.id) {
          scrapeCount++;
          if (imageUrl) updateCount++;
        }
      } catch (error) {
        console.log(
          `❌ Error saving: ${error instanceof Error ? error.message : "unknown"}`,
        );
      }
    }

    console.log(
      `\n✅ ${company.name} — ${articles.length} found, ${scrapeCount} saved, ${updateCount} with images\n`,
    );
  } catch (error) {
    console.error(
      `❌ ${company.name} — Error: ${error instanceof Error ? error.message : "unknown"}\n`,
    );
  }
}

scrapeMongoDB()
  .then(() => {
    console.log("✅ Done!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Error:", error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
