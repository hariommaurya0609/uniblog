import Image from "next/image";
import { Clock, User, ExternalLink } from "lucide-react";
import { timeAgo } from "@/lib/utils";

interface ArticleCardProps {
  article: {
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
  };
}

export function ArticleCard({ article }: ArticleCardProps) {
  return (
    <a
      href={article.originalUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="article-card group flex gap-4 rounded-xl border border-gray-200/80 bg-white p-4 dark:border-gray-800/60 dark:bg-gray-900/80 sm:gap-5"
    >
      {/* Thumbnail */}
      <div className="relative hidden h-28 w-44 shrink-0 overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-800 sm:block">
        {article.imageUrl ? (
          <Image
            src={article.imageUrl}
            alt={article.title}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="176px"
            unoptimized
          />
        ) : (
          <div
            className="flex h-full w-full items-center justify-center"
            style={{ backgroundColor: article.company.color + "15" }}
          >
            <Image
              src={article.company.logo}
              alt={article.company.name}
              width={32}
              height={32}
              className="opacity-40"
              unoptimized
            />
          </div>
        )}
        {/* Company badge on image */}
        <div className="absolute left-2 top-2">
          <span
            className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium text-white shadow-sm backdrop-blur-sm"
            style={{ backgroundColor: article.company.color + "CC" }}
          >
            <Image
              src={article.company.logo}
              alt={article.company.name}
              width={12}
              height={12}
              className="brightness-0 invert"
              unoptimized
            />
            {article.company.name}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="flex min-w-0 flex-1 flex-col justify-between">
        {/* Top: Company (mobile only) + Title */}
        <div>
          {/* Company badge — mobile only (no image visible) */}
          <div className="mb-1.5 flex items-center gap-2 sm:hidden">
            <Image
              src={article.company.logo}
              alt={article.company.name}
              width={16}
              height={16}
              className="shrink-0 rounded-sm"
              unoptimized
            />
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
              {article.company.name}
            </span>
          </div>

          {/* Title */}
          <h3 className="line-clamp-2 text-[15px] font-semibold leading-snug text-gray-800 group-hover:text-indigo-600 dark:text-gray-50 dark:group-hover:text-indigo-400">
            {article.title}
          </h3>

          {/* Description */}
          {article.description && (
            <p className="mt-1.5 line-clamp-3 text-[13px] leading-relaxed text-gray-600 dark:text-gray-400">
              {article.description}
            </p>
          )}
        </div>

        {/* Bottom: Meta row */}
        <div className="mt-3 flex items-center gap-3 text-xs text-gray-500 dark:text-gray-500">
          {article.author && (
            <span className="flex items-center gap-1">
              <User className="h-3 w-3" />
              <span className="max-w-30 truncate">{article.author}</span>
            </span>
          )}
          {article.readTime && (
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {article.readTime}
            </span>
          )}
          {article.publishedAt && <span>{timeAgo(article.publishedAt)}</span>}
          <ExternalLink className="ml-auto h-3.5 w-3.5 opacity-0 transition-opacity group-hover:opacity-100" />
        </div>
      </div>
    </a>
  );
}
