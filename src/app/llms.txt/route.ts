import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const BASE_URL = "https://uniblog.site";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const ua = request.headers.get("user-agent") ?? "";
  const referer = request.headers.get("referer") ?? "";
  console.log(
    JSON.stringify({ type: "ai_fetch", path: "/llms.txt", ua, referer }),
  );

  try {
    const companies = await prisma.company.findMany({
      where: { isActive: true, isDisabled: false },
      select: { name: true, slug: true, blogUrl: true },
      orderBy: { name: "asc" },
    });

    const companiesList = companies
      .map(
        (c) =>
          `- [${c.name}](${BASE_URL}/?company=${c.slug}): Engineering articles from ${c.blogUrl}`,
      )
      .join("\n");

    const content = `# UniBlog

> UniBlog aggregates engineering blog posts from ${companies.length} top tech companies — Netflix, Uber, Airbnb, Meta, GitHub, Spotify, and more — into a single unified feed. Updated daily.

## Content

- [Full Article Feed](${BASE_URL}/index.md): Recent engineering articles in Markdown, optimized for AI tools
- [Complete Index](${BASE_URL}/llms-full.txt): All articles with descriptions, grouped by company
- [JSON API](${BASE_URL}/api/articles): Articles as JSON (supports ?search=, ?company=, ?page=, ?limit=)

## Companies

${companiesList}

## Optional

- [Sitemap](${BASE_URL}/sitemap.xml): XML sitemap
`;

    return new NextResponse(content, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
      },
    });
  } catch (error) {
    console.error("GET /llms.txt error:", error);
    return new NextResponse(
      `# UniBlog\n\n> Tech blog aggregator — engineering blogs from top companies.\n\n- [Home](${BASE_URL})\n`,
      {
        headers: { "Content-Type": "text/plain; charset=utf-8" },
      },
    );
  }
}
