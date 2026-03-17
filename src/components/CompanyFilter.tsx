import Image from "next/image";

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
  if (companies.length === 0) return null;

  return (
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
  );
}
