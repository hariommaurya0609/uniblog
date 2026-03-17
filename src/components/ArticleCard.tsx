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
      className="article-card group flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900"
    >
      {/* Image */}
      <div className="relative aspect-[16/9] overflow-hidden bg-gray-100 dark:bg-gray-800">
        {article.imageUrl ? (
          <Image
            src={article.imageUrl}
            alt={article.title}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
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
              width={48}
              height={48}
              className="opacity-40"
              unoptimized
            />
          </div>
        )}

        {/* Company badge */}
        <div className="absolute left-3 top-3">
          <span
            className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium text-white shadow-lg backdrop-blur-sm"
            style={{ backgroundColor: article.company.color + "CC" }}
          >
            <Image
              src={article.company.logo}
              alt={article.company.name}
              width={14}
              height={14}
              className="brightness-0 invert"
              unoptimized
            />
            {article.company.name}
          </span>
        </div>

        {/* External link icon */}
        <div className="absolute right-3 top-3 rounded-full bg-black/20 p-1.5 opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100">
          <ExternalLink className="h-3.5 w-3.5 text-white" />
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col p-4">
        {/* Title */}
        <h3 className="line-clamp-2 text-base font-semibold leading-snug text-gray-900 group-hover:text-indigo-600 dark:text-white dark:group-hover:text-indigo-400">
          {article.title}
        </h3>

        {/* Description */}
        {article.description && (
          <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-gray-600 dark:text-gray-400">
            {article.description}
          </p>
        )}

        {/* Meta row */}
        <div className="mt-auto flex items-center gap-3 pt-4 text-xs text-gray-500 dark:text-gray-500">
          {article.author && (
            <span className="flex items-center gap-1">
              <User className="h-3 w-3" />
              <span className="max-w-[120px] truncate">{article.author}</span>
            </span>
          )}
          {article.readTime && (
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {article.readTime}
            </span>
          )}
          {article.publishedAt && (
            <span className="ml-auto">{timeAgo(article.publishedAt)}</span>
          )}
        </div>
      </div>
    </a>
  );
}
