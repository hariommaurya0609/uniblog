/**
 * Scrape only companies that have 0 articles.
 * Run with: NODE_TLS_REJECT_UNAUTHORIZED=0 npx tsx scripts/scrape-empty.ts
 */

import { PrismaClient } from "@prisma/client";
import RssParser from "rss-parser";
import https from "https";
import http from "http";

const prisma = new PrismaClient();
const parser = new RssParser({
  timeout: 15000,
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

function stripHtml(h: string) {
  return h.replace(/<[^>]*>/g, "").trim();
}

function truncate(s: string, l: number) {
  return s.length <= l ? s : s.slice(0, l).replace(/\s+\S*$/, "") + "…";
}

function estimateReadTime(t: string) {
  const w = t.split(/\s+/).length;
  const m = Math.ceil(w / 200);
  return m > 0 ? `${m} min read` : null;
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
            headers: { "User-Agent": "UniBlog/1.0", Accept: "text/html" },
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
                const u = new URL(targetUrl);
                loc = `${u.protocol}//${u.host}${loc}`;
              }
              res.resume();
              fetchPage(loc, redirects + 1)
                .then(resolve)
                .catch(reject);
              return;
            }
            let data = "";
            res.on("data", (c: string) => {
              data += c;
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
    const m1 = html.match(
      /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i,
    );
    if (m1?.[1]) return m1[1];
    const m2 = html.match(
      /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i,
    );
    if (m2?.[1]) return m2[1];
    return null;
  } catch {
    return null;
  }
}

async function main() {
  const companies = await prisma.company.findMany({
    where: { isActive: true },
    include: { _count: { select: { articles: true } } },
  });
  const empty = companies.filter((c) => c._count.articles === 0 && c.feedUrl);
  console.log(`🔍 Scraping ${empty.length} companies with 0 articles...\n`);

  let totalFound = 0,
    totalNew = 0,
    totalErrors = 0;

  for (let i = 0; i < empty.length; i++) {
    const company = empty[i];
    process.stdout.write(`[${i + 1}/${empty.length}] ${company.name}... `);
    try {
      const feed = await parser.parseURL(company.feedUrl!);
      const articles = (feed.items || []).slice(0, 100); // Limit to 100 most recent articles
      totalFound += articles.length;
      let newCount = 0;

      for (const item of articles) {
        const url = item.link;
        if (!url) continue;

        let imageUrl: string | null = null;
        if (item.enclosure?.url) imageUrl = item.enclosure.url;
        const mc = (item as Record<string, unknown>).mediaContent as
          | { $?: { url?: string } }
          | undefined;
        const mt = (item as Record<string, unknown>).mediaThumbnail as
          | { $?: { url?: string } }
          | undefined;
        if (!imageUrl && mc?.$?.url) imageUrl = mc.$.url;
        if (!imageUrl && mt?.$?.url) imageUrl = mt.$.url;
        if (!imageUrl) {
          const ch =
            ((item as Record<string, unknown>).contentEncoded as string) ||
            item.content ||
            "";
          const im = String(ch).match(/<img[^>]+src=["']?([^"'\s>]+)["']?/i);
          if (im?.[1]) imageUrl = im[1];
        }
        // Skip og:image for speed on bulk import
        // if (!imageUrl && url) imageUrl = await fetchOgImage(url);

        const rawDesc =
          item.contentSnippet || item.summary || item.content || "";
        const description = rawDesc ? truncate(stripHtml(rawDesc), 200) : null;
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
            if (publishedAt && isNaN(publishedAt.getTime())) publishedAt = null;
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
          /* duplicate — skip */
        }
      }
      totalNew += newCount;
      console.log(
        `✅ ${company.name.padEnd(20)} — ${articles.length} found, ${newCount} saved`,
      );
    } catch (err) {
      totalErrors++;
      console.error(
        `❌ ${company.name.padEnd(20)} — ${String(err).slice(0, 100)}`,
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
    console.error("💥 Fatal:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
