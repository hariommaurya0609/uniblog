import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const BASE_URL = "https://uniblog.site";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const ua = request.headers.get("user-agent") ?? "";
  const referer = request.headers.get("referer") ?? "";
  console.log(
    JSON.stringify({ type: "ai_fetch", path: "/index.md", ua, referer }),
  );

  try {
    const [companiesCount, articles] = await Promise.all([
      prisma.company.count({ where: { isActive: true, isDisabled: false } }),
      prisma.article.findMany({
        where: { company: { isActive: true, isDisabled: false } },
        include: {
          company: { select: { name: true, slug: true } },
        },
        orderBy: { publishedAt: "desc" },
        take: 100,
      }),
    ]);

    const lines: string[] = [
      `# UniBlog — Engineering Articles`,
      "",
      `> Aggregated engineering blog content from ${companiesCount} top tech companies. Updated daily.`,
      "",
      `**Full index:** [/llms.txt](${BASE_URL}/llms.txt) | **Complete dump:** [/llms-full.txt](${BASE_URL}/llms-full.txt) | **API:** [/api/articles](${BASE_URL}/api/articles)`,
      "",
      `## Recent Articles`,
      "",
    ];

    for (const article of articles) {
      const date = article.publishedAt
        ? new Date(article.publishedAt).toISOString().split("T")[0]
        : "";
      const author = article.author ? ` · ${article.author}` : "";
      const description = article.description
        ? `\n  > ${article.description.replace(/\n/g, " ").trim().slice(0, 250)}`
        : "";

      lines.push(
        `- **[${article.title}](${article.originalUrl})** — ${article.company.name}${date ? ` (${date}${author})` : ""}${description}`,
      );
    }

    return new NextResponse(lines.join("\n"), {
      headers: {
        "Content-Type": "text/markdown; charset=utf-8",
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=3600",
        Vary: "Accept",
      },
    });
  } catch (error) {
    console.error("GET /index.md error:", error);
    return new NextResponse("# UniBlog\n\nFailed to load articles.\n", {
      status: 500,
      headers: { "Content-Type": "text/markdown; charset=utf-8" },
    });
  }
}
