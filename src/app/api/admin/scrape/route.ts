import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import RssParser from "rss-parser";
import https from "https";
import http from "http";

/**
 * GET /api/admin/scrape
 *
 * Server-Sent Events (SSE) endpoint that streams scrape logs to the browser.
 * Protected by admin token (cookie or Authorization header).
 */

const ADMIN_USERNAME = "admin";
const ADMIN_PASSWORD = "uniblog@2026";
const VALID_TOKEN = Buffer.from(`${ADMIN_USERNAME}:${ADMIN_PASSWORD}`).toString(
  "base64",
);

/**
 * Fetch og:image from a URL by loading the page HTML.
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

function isAuthenticated(request: NextRequest): boolean {
  // Check cookie
  const cookieToken = request.cookies.get("admin_token")?.value;
  if (cookieToken === VALID_TOKEN) return true;

  // Check Authorization header
  const authHeader = request.headers.get("authorization");
  if (authHeader === `Bearer ${VALID_TOKEN}`) return true;

  return false;
}

export async function GET(request: NextRequest) {
  if (!isAuthenticated(request)) {
    return new Response("Unauthorized", { status: 401 });
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: {
        type: string;
        message: string;
        [key: string]: unknown;
      }) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      try {
        send({ type: "info", message: "🕷️ Starting scraper..." });

        // Import company configs
        const { COMPANY_CONFIGS } =
          await import("@/lib/scraper/companies.config");

        // Sync companies
        send({
          type: "info",
          message: `📦 Syncing ${COMPANY_CONFIGS.length} companies to database...`,
        });

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

        send({
          type: "success",
          message: `✅ ${COMPANY_CONFIGS.length} companies synced`,
        });

        // Fetch active companies
        const companies = await prisma.company.findMany({
          where: { isActive: true },
        });

        send({
          type: "info",
          message: `\n🔍 Scraping ${companies.length} company feeds...\n`,
        });

        const parser = new RssParser({
          timeout: 15_000,
          headers: {
            "User-Agent": "UniBlog/1.0 (Tech Blog Aggregator)",
            Accept:
              "application/rss+xml, application/atom+xml, application/xml, text/xml",
          },
          requestOptions: {
            rejectUnauthorized: false,
          },
        });

        let totalFound = 0;
        let totalNew = 0;
        let totalErrors = 0;

        for (const company of companies) {
          if (!company.feedUrl) {
            send({
              type: "warn",
              message: `⏭️  ${company.name} — No feed URL configured`,
            });
            continue;
          }

          try {
            const feed = await parser.parseURL(company.feedUrl);
            const articles = feed.items || [];
            totalFound += articles.length;
            let newCount = 0;

            for (const item of articles) {
              const url = item.link;
              if (!url) continue;

              const rawDesc = item.contentSnippet || item.summary || "";
              const description = rawDesc
                ? rawDesc
                    .replace(/<[^>]*>/g, "")
                    .trim()
                    .slice(0, 200)
                : null;
              const fullContent = item.content || "";
              const readTime = fullContent
                ? `${Math.ceil(
                    fullContent
                      .replace(/<[^>]*>/g, "")
                      .trim()
                      .split(/\s+/).length / 200,
                  )} min read`
                : null;

              let imageUrl: string | null = null;
              if (item.enclosure?.url) imageUrl = item.enclosure.url;
              if (!imageUrl) {
                const imgMatch = String(item.content || "").match(
                  /<img[^>]+src=["']?([^"'\s>]+)["']?/i,
                );
                if (imgMatch?.[1]) imageUrl = imgMatch[1];
              }

              // Fallback: fetch og:image from article page
              if (!imageUrl && url) {
                imageUrl = await fetchOgImage(url);
              }

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
                    author: item.creator || null,
                    imageUrl,
                    originalUrl: url,
                    readTime,
                    publishedAt,
                    companyId: company.id,
                  },
                  update: {
                    title: item.title?.trim() || "Untitled",
                    description,
                    author: item.creator || null,
                    imageUrl,
                    readTime,
                  },
                });
                newCount++;
              } catch {
                // duplicate — skip
              }
            }

            totalNew += newCount;
            send({
              type: "success",
              message: `✅ ${company.name.padEnd(15)} — ${articles.length} found, ${newCount} saved`,
              company: company.name,
              found: articles.length,
              saved: newCount,
            });
          } catch (err) {
            totalErrors++;
            send({
              type: "error",
              message: `❌ ${company.name.padEnd(15)} — ${String(err).slice(0, 100)}`,
              company: company.name,
              error: String(err).slice(0, 200),
            });
          }
        }

        send({
          type: "complete",
          message: `\n${"═".repeat(50)}\n📊 Summary: ${totalFound} found, ${totalNew} saved, ${totalErrors} errors`,
          totalFound,
          totalNew,
          totalErrors,
        });
      } catch (err) {
        send({ type: "error", message: `💥 Fatal error: ${String(err)}` });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
