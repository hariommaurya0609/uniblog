import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const BASE_URL = "https://uniblog.site";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const ua = request.headers.get("user-agent") ?? "";
  const referer = request.headers.get("referer") ?? "";
  console.log(
    JSON.stringify({ type: "ai_fetch", path: "/llms-full.txt", ua, referer }),
  );

  try {
    const [companies, articles] = await Promise.all([
      prisma.company.findMany({
        where: { isActive: true, isDisabled: false },
        select: { name: true, slug: true, blogUrl: true },
        orderBy: { name: "asc" },
      }),
      prisma.article.findMany({
        where: { company: { isActive: true, isDisabled: false } },
        include: { company: { select: { name: true, slug: true } } },
        orderBy: [{ company: { name: "asc" } }, { publishedAt: "desc" }],
        take: 1000,
      }),
    ]);

    const sections: string[] = [
      `# UniBlog — Complete Content Index`,
      "",
      `> Full content index for AI and LLM tools. Aggregates engineering blog posts from ${companies.length} tech companies. Updated daily.`,
      "",
      `**Site:** ${BASE_URL}`,
      `**Index:** [/llms.txt](${BASE_URL}/llms.txt)`,
      `**Recent feed:** [/index.md](${BASE_URL}/index.md)`,
      `**API:** [/api/articles](${BASE_URL}/api/articles)`,
      "",
      `---`,
      "",
      `## Companies (${companies.length})`,
      "",
    ];

    for (const company of companies) {
      sections.push(
        `- **${company.name}** — [Filter articles](${BASE_URL}/?company=${company.slug}) | [Original blog](${company.blogUrl})`,
      );
    }

    sections.push(
      "",
      "---",
      "",
      `## Articles (${articles.length} most recent)`,
      "",
    );

    let currentCompany = "";
    for (const article of articles) {
      if (article.company.name !== currentCompany) {
        currentCompany = article.company.name;
        sections.push("", `### ${currentCompany}`, "");
      }

      const date = article.publishedAt
        ? new Date(article.publishedAt).toISOString().split("T")[0]
        : "";
      const meta = [date, article.author].filter(Boolean).join(" · ");
      const description = article.description
        ? `\n  > ${article.description.replace(/\n/g, " ").trim().slice(0, 350)}`
        : "";

      sections.push(
        `- **[${article.title}](${article.originalUrl})**${meta ? ` (${meta})` : ""}${description}`,
      );
    }

    return new NextResponse(sections.join("\n"), {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "public, s-maxage=600, stale-while-revalidate=3600",
      },
    });
  } catch (error) {
    console.error("GET /llms-full.txt error:", error);
    return new NextResponse(
      `# UniBlog\n\n> Tech blog aggregator.\n\n- [Home](${BASE_URL})\n`,
      {
        status: 500,
        headers: { "Content-Type": "text/plain; charset=utf-8" },
      },
    );
  }
}
