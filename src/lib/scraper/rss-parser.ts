import RssParser from "rss-parser";
import { stripHtml, truncate, estimateReadTime } from "@/lib/utils";
import type { ArticleItem } from "@/types";
import https from "https";
import http from "http";

const parser = new RssParser({
  timeout: 15_000, // 15s timeout per feed
  headers: {
    "User-Agent": "UniBlog/1.0 (Tech Blog Aggregator)",
    Accept:
      "application/rss+xml, application/atom+xml, application/xml, text/xml",
  },
  requestOptions: {
    rejectUnauthorized: false,
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

/**
 * Fetch og:image from a URL by loading the page HTML and extracting the meta tag.
 * Returns null on any failure (timeout, network, no tag found).
 */
async function fetchOgImage(pageUrl: string): Promise<string | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

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
          },
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
        controller.signal.addEventListener("abort", () => {
          req.destroy();
          reject(new Error("Timeout"));
        });
      });
    };

    const html = await fetchPage(pageUrl);
    clearTimeout(timeout);
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
 * Parse an RSS/Atom feed URL and return structured article items.
 *
 * Handles multiple image extraction strategies:
 * 1. enclosure (standard RSS media)
 * 2. media:content / media:thumbnail (Media RSS)
 * 3. First <img> tag in content
 * 4. og:image via link fallback
 */
export async function parseRssFeed(feedUrl: string): Promise<ArticleItem[]> {
  const feed = await parser.parseURL(feedUrl);

  const items = feed.items.map((item) => {
    // --- Extract image URL ---
    let imageUrl: string | null = null;

    // Strategy 1: enclosure
    if (item.enclosure?.url) {
      imageUrl = item.enclosure.url;
    }

    // Strategy 2: media:content or media:thumbnail
    const mediaContent = (item as Record<string, unknown>).mediaContent as
      | { $?: { url?: string } }
      | undefined;
    const mediaThumbnail = (item as Record<string, unknown>).mediaThumbnail as
      | { $?: { url?: string } }
      | undefined;

    if (!imageUrl && mediaContent?.$?.url) {
      imageUrl = mediaContent.$.url;
    }
    if (!imageUrl && mediaThumbnail?.$?.url) {
      imageUrl = mediaThumbnail.$.url;
    }

    // Strategy 3: Extract first <img> from content/description
    if (!imageUrl) {
      const contentHtml =
        ((item as Record<string, unknown>).contentEncoded as string) ||
        item.content ||
        item["content:encoded"] ||
        "";
      const imgMatch = String(contentHtml).match(
        /<img[^>]+src=["']?([^"'\s>]+)["']?/i,
      );
      if (imgMatch?.[1]) {
        imageUrl = imgMatch[1];
      }
    }

    // --- Extract description ---
    const rawDescription =
      item.contentSnippet ||
      item.summary ||
      (item.content ? stripHtml(item.content) : null);
    const description = rawDescription
      ? truncate(stripHtml(rawDescription), 200)
      : null;

    // --- Estimate read time ---
    const fullContent =
      ((item as Record<string, unknown>).contentEncoded as string) ||
      item.content ||
      item["content:encoded"] ||
      "";
    const readTime = fullContent
      ? estimateReadTime(stripHtml(String(fullContent)))
      : null;

    // Resolve relative image URLs (e.g. /img/foo.png → https://domain.com/img/foo.png)
    if (imageUrl && imageUrl.startsWith("/") && item.link) {
      try {
        const base = new URL(item.link);
        imageUrl = `${base.protocol}//${base.host}${imageUrl}`;
      } catch {
        /* ignore invalid URLs */
      }
    }

    return {
      title: item.title?.trim() || "Untitled",
      description,
      author:
        item.creator ||
        ((item as Record<string, unknown>).dcCreator as string) ||
        null,
      imageUrl,
      originalUrl: item.link || "",
      readTime,
      publishedAt: item.pubDate
        ? new Date(item.pubDate)
        : item.isoDate
          ? new Date(item.isoDate)
          : null,
    };
  });

  // Strategy 4: For articles without images, fetch og:image from the article page
  const needsOgImage = items.filter((a) => !a.imageUrl && a.originalUrl);
  if (needsOgImage.length > 0) {
    const BATCH = 5;
    for (let i = 0; i < needsOgImage.length; i += BATCH) {
      const batch = needsOgImage.slice(i, i + BATCH);
      const results = await Promise.allSettled(
        batch.map((a) => fetchOgImage(a.originalUrl)),
      );
      for (let j = 0; j < batch.length; j++) {
        const res = results[j];
        if (res.status === "fulfilled" && res.value) {
          batch[j].imageUrl = res.value;
        }
      }
    }
  }

  return items;
}
