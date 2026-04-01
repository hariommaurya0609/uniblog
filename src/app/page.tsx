"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { X } from "lucide-react";
import { Header } from "@/components/Header";
import { SearchBar } from "@/components/SearchBar";
import { CompanyFilter } from "@/components/CompanyFilter";
import { ArticleCard } from "@/components/ArticleCard";
import { ArticleCardSkeleton } from "@/components/Skeleton";
import { Rss } from "lucide-react";

interface Company {
  id: string;
  name: string;
  slug: string;
  logo: string;
  color: string;
  articleCount: number;
}

interface Article {
  id: string;
  title: string;
  description: string | null;
  author: string | null;
  imageUrl: string | null;
  originalUrl: string;
  readTime: string | null;
  publishedAt: string | null;
  company: {
    name: string;
    slug: string;
    logo: string;
    color: string;
  };
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export default function HomePage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  // Debounce search: wait 500ms after user stops typing, require >= 2 chars
  useEffect(() => {
    const trimmed = searchQuery.trim();
    // Clear immediately when input is empty
    if (trimmed === "") {
      setDebouncedSearch("");
      return;
    }
    // Don't fire for single characters — wait for more input
    if (trimmed.length < 2) return;

    const timer = setTimeout(() => {
      setDebouncedSearch(trimmed);
      setSelectedCompany(null); // Global search clears company filter
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch companies on mount
  useEffect(() => {
    fetch("/api/companies")
      .then((res) => res.json())
      .then((data) => setCompanies(data.data || []))
      .catch(console.error);
  }, []);

  // Fetch articles when filters change — cancels in-flight requests via AbortController
  const fetchArticles = useCallback(
    async (page = 1, append = false, signal?: AbortSignal) => {
      if (page === 1) {
        setLoading(true);
        setArticles([]); // Clear stale results so skeleton renders immediately
      } else {
        setLoadingMore(true);
      }

      try {
        const params = new URLSearchParams({
          page: String(page),
          limit: "20",
        });

        if (selectedCompany) params.set("company", selectedCompany);
        if (debouncedSearch) params.set("search", debouncedSearch);

        const res = await fetch(`/api/articles?${params}`, { signal });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();

        if (append) {
          setArticles((prev) => [...prev, ...(data.data || [])]);
        } else {
          setArticles(data.data || []);
        }
        setPagination(data.pagination || null);
      } catch (error) {
        if ((error as Error).name === "AbortError") return; // Request was cancelled — don't touch loading state
        console.error("Failed to fetch articles:", error);
      } finally {
        // Only clear loading if this request wasn't aborted
        if (!signal?.aborted) {
          setLoading(false);
          setLoadingMore(false);
        }
      }
    },
    [selectedCompany, debouncedSearch],
  );

  useEffect(() => {
    const controller = new AbortController();
    fetchArticles(1, false, controller.signal);
    return () => controller.abort(); // Cancel request if filters change before it completes
  }, [fetchArticles]);

  // Infinite scroll — load more when sentinel is visible
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (
          entries[0].isIntersecting &&
          pagination?.hasNext &&
          !loadingMore &&
          !loading
        ) {
          fetchArticles(pagination.page + 1, true);
        }
      },
      { rootMargin: "400px" },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [pagination, loadingMore, loading, fetchArticles]);

  const handleCompanySelect = (slug: string | null) => {
    setSelectedCompany(slug);
    setSearchQuery(""); // Clear search when changing company
    setMobileDrawerOpen(false); // Close drawer on mobile after selection
  };

  const selectedCompanyData = selectedCompany
    ? (companies.find((c) => c.slug === selectedCompany) ?? null)
    : null;

  // Use company's known article count immediately on selection (no API round-trip lag).
  // Fall back to pagination total once the request completes.
  const totalArticles = loading
    ? (selectedCompanyData?.articleCount ?? pagination?.total ?? 0)
    : (pagination?.total ?? 0);

  return (
    <div className="min-h-screen">
      <Header onMenuOpen={() => setMobileDrawerOpen(true)} />

      {/* SEO Hero — keyword-rich text for search engines, subtle for users */}
      <section className="border-b border-gray-100 bg-linear-to-b from-indigo-50/60 to-transparent px-4 py-8 text-center dark:border-gray-800/50 dark:from-indigo-950/20">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-3xl">
          All Tech Engineering Blogs in One Place
        </h1>
        <p className="mx-auto mt-2 max-w-2xl text-sm leading-relaxed text-gray-500 dark:text-gray-400 sm:text-base">
          UniBlog aggregates engineering blogs from{" "}
          <strong className="text-gray-700 dark:text-gray-300">Netflix</strong>,{" "}
          <strong className="text-gray-700 dark:text-gray-300">Uber</strong>,{" "}
          <strong className="text-gray-700 dark:text-gray-300">Airbnb</strong>,{" "}
          <strong className="text-gray-700 dark:text-gray-300">Meta</strong>,{" "}
          <strong className="text-gray-700 dark:text-gray-300">Spotify</strong>,{" "}
          <strong className="text-gray-700 dark:text-gray-300">GitHub</strong>{" "}
          and 100+ top tech companies — updated daily.
        </p>
      </section>

      {/* Mobile drawer */}
      {mobileDrawerOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden"
            onClick={() => setMobileDrawerOpen(false)}
          />
          {/* Slide-in panel */}
          <div className="mobile-drawer fixed inset-y-0 left-0 z-50 w-72 overflow-y-auto bg-white p-4 shadow-2xl dark:bg-gray-950 lg:hidden">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-baseline gap-2">
                <h3 className="text-[11px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">
                  Companies
                </h3>
                <span className="text-xs text-gray-400 dark:text-gray-500">
                  {companies.length} sources
                </span>
              </div>
              <button
                onClick={() => setMobileDrawerOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-300"
                aria-label="Close menu"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <CompanyFilter
              companies={companies}
              selected={selectedCompany}
              onSelect={handleCompanySelect}
              variant="sidebar"
              totalArticles={!selectedCompany ? totalArticles : undefined}
            />
          </div>
        </>
      )}

      <div className="mx-auto flex max-w-7xl">
        {/* Left Sidebar — Company Filter */}
        <aside className="sticky top-16.25 hidden h-[calc(100vh-65px)] w-72 shrink-0 overflow-y-auto border-r border-gray-200/60 bg-white/70 p-4 backdrop-blur-sm dark:border-gray-800/50 dark:bg-gray-950/70 lg:block">
          <div className="mb-4 flex items-baseline gap-2">
            <h3 className="text-[11px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">
              Companies
            </h3>
            <span className="text-xs text-gray-400 dark:text-gray-500">
              {companies.length} sources
            </span>
          </div>
          <CompanyFilter
            companies={companies}
            selected={selectedCompany}
            onSelect={handleCompanySelect}
            totalArticles={!selectedCompany ? totalArticles : undefined}
          />
        </aside>

        {/* Main Content */}
        <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8">
          {/* Search & Stats */}
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
                {selectedCompanyData
                  ? `${selectedCompanyData.name} Articles`
                  : "Latest Articles"}
              </h2>
              <span className="text-sm text-gray-300 dark:text-gray-600">
                ·
              </span>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {totalArticles.toLocaleString()} article
                {totalArticles !== 1 ? "s" : ""}{" "}
                {selectedCompanyData
                  ? `from ${selectedCompanyData.name}`
                  : `from ${companies.length} companies`}
              </p>
            </div>
            <SearchBar value={searchQuery} onChange={setSearchQuery} />
          </div>

          {/* Articles List */}
          {loading ? (
            <div className="space-y-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <ArticleCardSkeleton key={i} />
              ))}
            </div>
          ) : articles.length === 0 ? (
            <div className="mt-16 flex flex-col items-center justify-center text-center">
              <Rss className="mb-4 h-16 w-16 text-gray-300 dark:text-gray-600" />
              <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300">
                No articles found
              </h3>
              <p className="mt-2 max-w-md text-gray-500 dark:text-gray-400">
                {debouncedSearch
                  ? `No results for "${debouncedSearch}". Try a different search term.`
                  : "No articles yet. Check back soon — new articles are fetched automatically."}
              </p>
            </div>
          ) : (
            <>
              <div className="space-y-4">
                {articles.map((article, index) => (
                  <ArticleCard
                    key={article.id}
                    article={article}
                    priority={index < 3}
                  />
                ))}
              </div>

              {/* Infinite scroll sentinel */}
              <div ref={sentinelRef} className="py-4">
                {loadingMore && (
                  <div className="flex justify-center">
                    <svg
                      className="h-6 w-6 animate-spin text-gray-400"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="none"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                      />
                    </svg>
                  </div>
                )}
              </div>
            </>
          )}
        </main>
      </div>

      {/* SEO Footer */}
      <footer className="border-t border-gray-100 px-4 py-10 dark:border-gray-800/50">
        <div className="mx-auto max-w-7xl">
          <p className="text-center text-xs leading-relaxed text-gray-400 dark:text-gray-600">
            UniBlog is a free tech blog aggregator. Read the latest software engineering articles,
            system design posts, and developer insights from top tech companies including Netflix
            Engineering, Uber Engineering, Airbnb Tech, Meta Engineering, GitHub Blog, Spotify
            Engineering, Google Developers, Amazon Science, Microsoft Tech Community, Dropbox Tech,
            Stripe Blog, Pinterest Engineering, Twitter/X Engineering, LinkedIn Engineering,
            DoorDash Engineering, Lyft Engineering, Shopify Engineering, Cloudflare Blog, and more.
          </p>
          <p className="mt-3 text-center text-xs text-gray-400 dark:text-gray-600">
            © {new Date().getFullYear()} UniBlog · Tech Engineering Blog Aggregator ·{" "}
            <a href="https://uniblog.site" className="hover:underline">
              uniblog.site
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}
