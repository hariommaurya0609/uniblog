import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/articles
 *
 * Query params:
 *  - page (default: 1)
 *  - limit (default: 20, max: 50)
 *  - company (slug filter)
 *  - search (full-text search on title/description/author/company)
 *  - sort (publishedAt | createdAt, default: publishedAt)
 *  - order (asc | desc, default: desc)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(
      50,
      Math.max(1, parseInt(searchParams.get("limit") || "20")),
    );
    const company = searchParams.get("company");
    const search = searchParams.get("search");
    const sort =
      searchParams.get("sort") === "createdAt" ? "createdAt" : "publishedAt";
    const order = searchParams.get("order") === "asc" ? "asc" : "desc";

    const skip = (page - 1) * limit;

    // Build where clause
    const where: Record<string, unknown> = {};

    if (company) {
      where.company = { slug: company };
    }

    if (search) {
      const searchConditions = [
        { title: { contains: search, mode: "insensitive" as const } },
        { description: { contains: search, mode: "insensitive" as const } },
        { author: { contains: search, mode: "insensitive" as const } },
        ...(company ? [] : [{ company: { name: { contains: search, mode: "insensitive" as const } } }]),
      ];

      if (company) {
        // When company filter is active, search only within that company's articles
        where.AND = [{ OR: searchConditions }];
      } else {
        where.OR = searchConditions;
      }
    }

    // Run sequentially — pgBouncer transaction mode releases connections after each statement
    // Running in parallel with connection_limit would exhaust the pool
    const total = await prisma.article.count({ where });
    const articles = await prisma.article.findMany({
      where,
      include: {
        company: {
          select: {
            name: true,
            slug: true,
            logo: true,
            color: true,
          },
        },
      },
      orderBy: { [sort]: order },
      skip,
      take: limit,
    });

    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      data: articles,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    console.error("GET /api/articles error:", error);
    return NextResponse.json(
      { error: "Failed to fetch articles" },
      { status: 500 },
    );
  }
}
