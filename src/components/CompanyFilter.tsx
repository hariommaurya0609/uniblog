"use client";

import Image from "next/image";
import { useState } from "react";
import { Search, X } from "lucide-react";

interface Company {
  id: string;
  name: string;
  slug: string;
  logo: string;
  color: string;
  articleCount: number;
}

interface CompanyFilterProps {
  companies: Company[];
  selected: string | null;
  onSelect: (slug: string | null) => void;
  variant?: "sidebar" | "default";
  totalArticles?: number;
}

export function CompanyFilter({
  companies,
  selected,
  onSelect,
  variant = "default",
  totalArticles,
}: CompanyFilterProps) {
  const [filterQuery, setFilterQuery] = useState("");

  if (companies.length === 0) return null;

  const filtered = filterQuery
    ? companies.filter((c) =>
        c.name.toLowerCase().includes(filterQuery.toLowerCase()),
      )
    : companies;

  // Force sidebar layout when variant="sidebar" (used in mobile drawer)
  const showSidebar = variant === "sidebar";

  return (
    <div className="space-y-2">
      {/* Search within companies */}
      <div
        className={`relative mb-3 ${showSidebar ? "block" : "hidden lg:block"}`}
      >
        <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Filter companies..."
          value={filterQuery}
          onChange={(e) => setFilterQuery(e.target.value)}
          className="w-full rounded-lg border border-gray-200/80 bg-gray-50 py-2 pl-8 pr-8 text-xs placeholder:text-gray-400 focus:border-indigo-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/10 dark:border-gray-700/60 dark:bg-gray-800/50 dark:text-gray-100 dark:placeholder:text-gray-500 dark:focus:bg-gray-800"
        />
        {filterQuery && (
          <button
            onClick={() => {
              setFilterQuery("");
              onSelect(null);
            }}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            aria-label="Clear search"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* All button */}
      <button
        onClick={() => onSelect(null)}
        className={`${showSidebar ? "flex" : "hidden lg:flex"} w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm font-medium transition-all ${
          selected === null
            ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300"
            : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
        }`}
      >
        <span className="flex h-6 w-6 items-center justify-center rounded-md bg-indigo-600 text-[10px] font-bold text-white">
          All
        </span>
        <span className="flex-1">All Companies</span>
        <span className="text-xs text-gray-400 dark:text-gray-500">
          {(
            totalArticles ??
            companies.reduce((sum, c) => sum + c.articleCount, 0)
          ).toLocaleString()}
        </span>
      </button>

      {/* Company list — vertical (sidebar / desktop) */}
      <div
        className={`${showSidebar ? "block" : "hidden lg:block"} space-y-0.5`}
      >
        {filtered.map((company) => (
          <button
            key={company.slug}
            onClick={() =>
              onSelect(selected === company.slug ? null : company.slug)
            }
            className={`sidebar-item flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm transition-all ${
              selected === company.slug
                ? "font-medium text-white shadow-sm"
                : "text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800/50"
            }`}
            style={
              selected === company.slug
                ? { backgroundColor: company.color }
                : undefined
            }
          >
            <Image
              src={company.logo}
              alt={company.name}
              width={20}
              height={20}
              className="shrink-0 rounded-sm"
              unoptimized
            />
            <span className="flex-1 truncate">{company.name}</span>
            <span
              className={`shrink-0 text-xs ${
                selected === company.slug
                  ? "text-white/70"
                  : "text-gray-400 dark:text-gray-500"
              }`}
            >
              {company.articleCount}
            </span>
          </button>
        ))}
        {filtered.length === 0 && (
          <p className="px-3 py-4 text-center text-xs text-gray-400">
            No companies match &ldquo;{filterQuery}&rdquo;
          </p>
        )}
      </div>

      {/* Mobile — horizontal pills (default variant only, never inside the sidebar drawer) */}
      {!showSidebar && (
        <div className="flex flex-wrap gap-2 lg:hidden">
          <button
            onClick={() => onSelect(null)}
            className={`company-pill flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium transition-all ${
              selected === null
                ? "bg-indigo-600 text-white shadow-md"
                : "bg-white text-gray-700 hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
            } border border-gray-200 dark:border-gray-700`}
          >
            All
          </button>
          {filtered.map((company) => (
            <button
              key={company.slug}
              onClick={() =>
                onSelect(selected === company.slug ? null : company.slug)
              }
              className={`company-pill flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-all ${
                selected === company.slug
                  ? "text-white shadow-md"
                  : "bg-white text-gray-700 hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
              } border border-gray-200 dark:border-gray-700`}
              style={
                selected === company.slug
                  ? { backgroundColor: company.color }
                  : undefined
              }
            >
              <Image
                src={company.logo}
                alt={company.name}
                width={16}
                height={16}
                className="rounded-sm"
                unoptimized
              />
              <span>{company.name}</span>
              <span
                className={`text-xs ${
                  selected === company.slug
                    ? "text-white/80"
                    : "text-gray-400 dark:text-gray-500"
                }`}
              >
                {company.articleCount}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
