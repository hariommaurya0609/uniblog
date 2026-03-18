import { PrismaClient } from "@prisma/client";
import Parser from "rss-parser";
import * as cheerio from "cheerio";

const prisma = new PrismaClient();
const parser = new Parser({
  customFields: {
    item: [
      ["media:content", "media:content"],
      ["content:encoded", "content:encoded"],
    ],
  },
});

// Timeout wrapper
function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error("Timeout")), ms),
    ),
  ]);
}

// Fetch og:image from article URL
async function fetchOgImage(url: string): Promise<string | null> {
  try {
    const response = await withTimeout(fetch(url), 5000);
    const html = await response.text();
    const $ = cheerio.load(html);

    // Try og:image
    const ogImage = $('meta[property="og:image"]').attr("content");
    if (ogImage) return ogImage;

    // Try twitter:image
    const twitterImage = $('meta[name="twitter:image"]').attr("content");
    if (twitterImage) return twitterImage;

    return null;
  } catch (error) {
    return null;
  }
}

// Resolve relative URLs
function resolveImageUrl(imageUrl: string, baseUrl: string): string {
  if (imageUrl.startsWith("/")) {
    const url = new URL(baseUrl);
    return `${url.protocol}//${url.host}${imageUrl}`;
  }
  return imageUrl;
}

async function fetchMissingImages(companySlug?: string) {
  console.log("🔍 Finding articles with missing images...\n");

  const where = companySlug
    ? { imageUrl: null, company: { slug: companySlug } }
    : { imageUrl: null };

  const articles = await prisma.article.findMany({
    where,
    include: { company: true },
    orderBy: { publishedAt: "desc" },
  });

  console.log(`Found ${articles.length} articles with missing images\n`);

  if (articles.length === 0) {
    console.log("✅ All articles have images!");
    return;
  }

  let updated = 0;
  let failed = 0;

  for (let i = 0; i < articles.length; i++) {
    const article = articles[i];
    const progress = `[${i + 1}/${articles.length}]`;

    process.stdout.write(
      `${progress} ${article.company.name}: ${article.title.substring(0, 50)}... `,
    );

    try {
      // Try to fetch og:image from article page
      const imageUrl = await fetchOgImage(article.originalUrl);

      if (imageUrl) {
        // Resolve relative URLs
        const resolvedUrl = resolveImageUrl(imageUrl, article.originalUrl);

        await prisma.article.update({
          where: { id: article.id },
          data: { imageUrl: resolvedUrl },
        });

        console.log(`✅ (${resolvedUrl.substring(0, 60)}...)`);
        updated++;
      } else {
        console.log("❌ (no image found)");
        failed++;
      }
    } catch (error) {
      console.log(
        `❌ (error: ${error instanceof Error ? error.message : "unknown"})`,
      );
      failed++;
    }

    // Rate limiting - wait 100ms between requests
    if (i < articles.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }

  console.log(`\n📊 Summary:`);
  console.log(`  ✅ Updated: ${updated}`);
  console.log(`  ❌ Failed: ${failed}`);
  console.log(`  📝 Total: ${articles.length}`);
}

// Run script
const companySlug = process.argv[2];

if (companySlug) {
  console.log(`🎯 Fetching images for company: ${companySlug}\n`);
}

fetchMissingImages(companySlug)
  .then(() => {
    console.log("\n✅ Done!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Error:", error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
