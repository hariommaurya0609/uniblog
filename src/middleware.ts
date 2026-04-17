import { NextRequest, NextResponse } from "next/server";

// Known AI crawler User-Agent substrings for server-side analytics
const AI_CRAWLER_UA_PATTERNS = [
  "GPTBot",
  "ChatGPT-User",
  "ClaudeBot",
  "Claude-Web",
  "PerplexityBot",
  "anthropic-ai",
  "cohere-ai",
  "YouBot",
  "CCBot",
  "Diffbot",
  "Bytespider",
  "ImagesiftBot",
  "omgili",
  "facebookexternalhit",
];

function isAICrawler(ua: string): boolean {
  return AI_CRAWLER_UA_PATTERNS.some((p) =>
    ua.toLowerCase().includes(p.toLowerCase()),
  );
}

// Paths that already have dedicated route handlers — no Link header needed
const AI_ENDPOINT_PATHS = new Set(["/llms.txt", "/llms-full.txt", "/index.md"]);

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const accept = request.headers.get("accept") ?? "";
  const ua = request.headers.get("user-agent") ?? "";

  // Log AI crawler visits to AI-specific endpoints (visible in Vercel function logs)
  const isAiEndpoint = AI_ENDPOINT_PATHS.has(pathname);
  if (isAiEndpoint && isAICrawler(ua)) {
    console.log(
      JSON.stringify({
        type: "ai_crawler_fetch",
        path: pathname,
        ua,
        referer: request.headers.get("referer") ?? "",
      }),
    );
  }

  // Content negotiation: if a client explicitly requests Markdown for the homepage,
  // redirect to /index.md (same content, different representation).
  // Vary: Accept in the /index.md response tells CDNs to cache these separately.
  if (pathname === "/" && accept.includes("text/markdown")) {
    return NextResponse.redirect(new URL("/index.md", request.nextUrl.origin));
  }

  const response = NextResponse.next();

  // Add HTTP Link header pointing to the Markdown alternate for every HTML page.
  // This is readable before the response body — useful for headless AI agents that
  // inspect headers without parsing HTML.
  // Skip: API routes, Next.js internals, and paths that already ARE the .md file.
  const skipLinkHeader =
    pathname.startsWith("/api/") ||
    pathname.startsWith("/_next/") ||
    isAiEndpoint ||
    /\.(ico|png|jpg|jpeg|gif|webp|svg|css|js|woff2?|txt|xml|json|md)$/.test(
      pathname,
    );

  if (!skipLinkHeader) {
    const mdPath = pathname === "/" ? "/index.md" : `${pathname}.md`;
    response.headers.set(
      "Link",
      `<${mdPath}>; rel="alternate"; type="text/markdown"`,
    );
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Run on all paths except Next.js static chunks and image optimization.
     * We still need to hit API routes so we can log AI crawler activity there.
     */
    "/((?!_next/static|_next/image).*)",
  ],
};
