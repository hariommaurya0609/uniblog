"use client";

import { useState, useEffect, useCallback } from "react";
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

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch companies on mount
  useEffect(() => {
    fetch("/api/companies")
      .then((res) => res.json())
      .then((data) => setCompanies(data.data || []))
      .catch(console.error);
  }, []);

  // Fetch articles when filters change
  const fetchArticles = useCallback(
    async (page = 1, append = false) => {
      if (page === 1) setLoading(true);
      else setLoadingMore(true);

      try {
        const params = new URLSearchParams({
          page: String(page),
          limit: "20",
        });

        if (selectedCompany) params.set("company", selectedCompany);
        if (debouncedSearch) params.set("search", debouncedSearch);

        const res = await fetch(`/api/articles?${params}`);
        const data = await res.json();

        if (append) {
          setArticles((prev) => [...prev, ...(data.data || [])]);
        } else {
          setArticles(data.data || []);
        }
        setPagination(data.pagination || null);
      } catch (error) {
        console.error("Failed to fetch articles:", error);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [selectedCompany, debouncedSearch],
  );

  useEffect(() => {
    fetchArticles(1, false);
  }, [fetchArticles]);

  const handleLoadMore = () => {
    if (pagination?.hasNext) {
      fetchArticles(pagination.page + 1, true);
    }
  };

  const handleCompanySelect = (slug: string | null) => {
    setSelectedCompany(slug);
  };

  const totalArticles = pagination?.total ?? 0;

  return (
    <div className="min-h-screen">
      <Header />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Search & Stats */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {selectedCompany
                ? `${companies.find((c) => c.slug === selectedCompany)?.name ?? "Company"} Articles`
                : "Latest Articles"}
            </h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {totalArticles.toLocaleString()} article
              {totalArticles !== 1 ? "s" : ""}{" "}
              {selectedCompany
                ? `from ${companies.find((c) => c.slug === selectedCompany)?.name ?? selectedCompany}`
                : `from ${companies.length} companies`}
            </p>
          </div>
          <SearchBar value={searchQuery} onChange={setSearchQuery} />
        </div>

        {/* Company Filter */}
        <CompanyFilter
          companies={companies}
          selected={selectedCompany}
          onSelect={handleCompanySelect}
        />

        {/* Articles Grid */}
        {loading ? (
          <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
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
            <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {articles.map((article) => (
                <ArticleCard key={article.id} article={article} />
              ))}
            </div>

            {/* Load More */}
            {pagination?.hasNext && (
              <div className="mt-10 flex justify-center">
                <button
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                  className="rounded-lg border border-gray-300 bg-white px-8 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 transition-colors"
                >
                  {loadingMore ? (
                    <span className="flex items-center gap-2">
                      <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24">
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
                      Loading...
                    </span>
                  ) : (
                    `Load more (${pagination.page * pagination.limit} of ${pagination.total})`
                  )}
                </button>
              </div>
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-16 border-t border-gray-200 bg-white py-8 dark:border-gray-800 dark:bg-gray-900">
        <div className="mx-auto max-w-7xl px-4 text-center text-sm text-gray-500 dark:text-gray-400">
          <p>
            UniBlog — Aggregating engineering blogs from top tech companies.
          </p>
          <p className="mt-1">
            All articles link to their original source. We don&apos;t host any
            content.
          </p>
        </div>
      </footer>
    </div>
  );
}
