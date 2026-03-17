import { NextRequest, NextResponse } from "next/server";
import { runScraper } from "@/lib/scraper";

/**
 * POST /api/scrape
 *
 * Triggers the scraper to fetch new articles from all active companies.
 * Protected by CRON_SECRET — meant to be called by a cron job or admin.
 *
 * To set up on Vercel, add to vercel.json:
 * {
 *   "crons": [{
 *     "path": "/api/scrape",
 *     "schedule": "0 * * * *"    // every hour
 *   }]
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // Authenticate — check for cron secret
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("🕷️  Starting scraper...");
    const startTime = Date.now();
    const results = await runScraper();
    const duration = Date.now() - startTime;

    const summary = {
      success: true,
      duration: `${(duration / 1000).toFixed(1)}s`,
      totalArticlesFound: results.reduce((sum, r) => sum + r.articlesFound, 0),
      totalArticlesNew: results.reduce((sum, r) => sum + r.articlesNew, 0),
      totalErrors: results.reduce((sum, r) => sum + r.errors.length, 0),
      companies: results,
    };

    console.log(
      `✅ Scraper done in ${summary.duration} — ${summary.totalArticlesNew} new articles`,
    );

    return NextResponse.json(summary);
  } catch (error) {
    console.error("POST /api/scrape error:", error);
    return NextResponse.json(
      { error: "Scraper failed", details: String(error) },
      { status: 500 },
    );
  }
}

// Also handle GET for Vercel Cron (which sends GET requests)
export async function GET(request: NextRequest) {
  return POST(request);
}
