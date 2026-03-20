"use client";

import Image from "next/image";
import { useState } from "react";
import { Search } from "lucide-react";

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
}

export function CompanyFilter({
  companies,
  selected,
  onSelect,
}: CompanyFilterProps) {
  const [filterQuery, setFilterQuery] = useState("");

  if (companies.length === 0) return null;

  const filtered = filterQuery
    ? companies.filter((c) =>
        c.name.toLowerCase().includes(filterQuery.toLowerCase()),
      )
    : companies;

  return (
    <div className="space-y-2">
      {/* Search within companies — desktop sidebar only */}
      <div className="relative mb-3 hidden lg:block">
        <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Filter companies..."
          value={filterQuery}
          onChange={(e) => setFilterQuery(e.target.value)}
          className="w-full rounded-md border border-gray-200 bg-white py-1.5 pl-8 pr-3 text-xs placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:placeholder:text-gray-500"
        />
      </div>

      {/* All button */}
      <button
        onClick={() => onSelect(null)}
        className={`hidden w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm font-medium transition-all lg:flex ${
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
          {companies
            .reduce((sum, c) => sum + c.articleCount, 0)
            .toLocaleString()}
        </span>
      </button>

      {/* Company list — vertical on desktop */}
      <div className="hidden space-y-0.5 lg:block">
        {filtered.map((company) => (
          <button
            key={company.slug}
            onClick={() =>
              onSelect(selected === company.slug ? null : company.slug)
            }
            className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm transition-all ${
              selected === company.slug
                ? "font-medium text-white"
                : "text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-800/50"
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

      {/* Mobile — horizontal pills */}
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
        {companies.map((company) => (
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
    </div>
  );
}
