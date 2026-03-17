import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/companies
 *
 * Returns all active companies with their article counts.
 */
export async function GET() {
  try {
    const companies = await prisma.company.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        slug: true,
        logo: true,
        blogUrl: true,
        color: true,
        _count: {
          select: { articles: true },
        },
      },
      orderBy: { name: "asc" },
    });

    const data = companies.map((c) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      logo: c.logo,
      blogUrl: c.blogUrl,
      color: c.color,
      articleCount: c._count.articles,
    }));

    return NextResponse.json({ data });
  } catch (error) {
    console.error("GET /api/companies error:", error);
    return NextResponse.json(
      { error: "Failed to fetch companies" },
      { status: 500 },
    );
  }
}
