import * as cheerio from "cheerio";
import { truncate } from "@/lib/utils";
import type { ArticleItem } from "@/types";

interface ScrapeConfig {
  /** CSS selector for each article card/container */
  articleSelector: string;
  /** CSS selector for the title (relative to article) */
  titleSelector: string;
  /** CSS selector for the link (relative to article) */
  linkSelector: string;
  /** CSS selector for description (relative to article) */
  descriptionSelector?: string;
  /** CSS selector for image (relative to article) */
  imageSelector?: string;
  /** CSS selector for author (relative to article) */
  authorSelector?: string;
  /** CSS selector for read time (relative to article) */
  readTimeSelector?: string;
  /** CSS selector for published date (relative to article) */
  dateSelector?: string;
  /** Base URL to prepend to relative links */
  baseUrl?: string;
}

/**
 * Scrape a blog listing page using Cheerio (HTML parser).
 *
 * This is the fallback strategy for blogs that don't have RSS feeds.
 * Each blog needs a custom ScrapeConfig defining its HTML structure.
 */
export async function scrapeHtml(
  pageUrl: string,
  config: ScrapeConfig,
): Promise<ArticleItem[]> {
  const response = await fetch(pageUrl, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      Accept: "text/html,application/xhtml+xml",
    },
  });

  if (!response.ok) {
    throw new Error(
      `Failed to fetch ${pageUrl}: ${response.status} ${response.statusText}`,
    );
  }

  const html = await response.text();
  const $ = cheerio.load(html);
  const articles: ArticleItem[] = [];

  $(config.articleSelector).each((_, el) => {
    const $el = $(el);

    // Title
    const title = $el.find(config.titleSelector).first().text().trim();
    if (!title) return; // skip if no title

    // Link
    let link = $el.find(config.linkSelector).first().attr("href") || "";
    if (link && config.baseUrl && !link.startsWith("http")) {
      link = new URL(link, config.baseUrl).toString();
    }
    if (!link) return; // skip if no link

    // Description
    const rawDesc = config.descriptionSelector
      ? $el.find(config.descriptionSelector).first().text().trim()
      : null;
    const description = rawDesc ? truncate(rawDesc, 200) : null;

    // Image
    let imageUrl: string | null = null;
    if (config.imageSelector) {
      imageUrl =
        $el.find(config.imageSelector).first().attr("src") ||
        $el.find(config.imageSelector).first().attr("data-src") ||
        null;
      if (imageUrl && config.baseUrl && !imageUrl.startsWith("http")) {
        imageUrl = new URL(imageUrl, config.baseUrl).toString();
      }
    }

    // Author
    const author = config.authorSelector
      ? $el.find(config.authorSelector).first().text().trim() || null
      : null;

    // Read time
    const readTime = config.readTimeSelector
      ? $el.find(config.readTimeSelector).first().text().trim() || null
      : null;

    // Date
    let publishedAt: Date | null = null;
    if (config.dateSelector) {
      const dateStr =
        $el.find(config.dateSelector).first().attr("datetime") ||
        $el.find(config.dateSelector).first().text().trim();
      if (dateStr) {
        const parsed = new Date(dateStr);
        if (!isNaN(parsed.getTime())) publishedAt = parsed;
      }
    }

    articles.push({
      title,
      description,
      author,
      imageUrl,
      originalUrl: link,
      readTime,
      publishedAt,
    });
  });

  return articles;
}

/**
 * Try to extract og:image from an article page.
 * Useful as a fallback when RSS feed doesn't include images.
 */
export async function fetchOgImage(url: string): Promise<string | null> {
  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; UniBlog/1.0; +https://uniblog.dev)",
      },
      signal: AbortSignal.timeout(10_000),
    });

    if (!response.ok) return null;

    const html = await response.text();
    const $ = cheerio.load(html);

    const ogImage =
      $('meta[property="og:image"]').attr("content") ||
      $('meta[name="twitter:image"]').attr("content") ||
      null;

    return ogImage;
  } catch {
    return null;
  }
}
