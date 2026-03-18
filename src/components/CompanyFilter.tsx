"use client";

import Image from "next/image";
import { useState } from "react";

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
  const [showAll, setShowAll] = useState(false);

  if (companies.length === 0) return null;

  const INITIAL_VISIBLE = 15;
  const visibleCompanies = showAll
    ? companies
    : companies.slice(0, INITIAL_VISIBLE);
  const hasMore = companies.length > INITIAL_VISIBLE;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {/* All button */}
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

        {/* Company pills */}
        {visibleCompanies.map((company) => (
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

      {/* Show more/less button */}
      {hasMore && (
        <button
          onClick={() => setShowAll(!showAll)}
          className="text-sm text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 font-medium transition-colors"
        >
          {showAll
            ? "← Show less companies"
            : `→ Show ${companies.length - INITIAL_VISIBLE} more companies`}
        </button>
      )}
    </div>
  );
}
