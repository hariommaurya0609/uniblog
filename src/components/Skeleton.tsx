export function ArticleCardSkeleton() {
  return (
    <div className="flex gap-4 rounded-xl border border-gray-200/80 bg-white p-4 dark:border-gray-800/60 dark:bg-gray-900/80 sm:gap-5">
      {/* Image skeleton */}
      <div className="skeleton hidden h-28 w-44 shrink-0 rounded-lg sm:block" />

      {/* Content skeleton */}
      <div className="flex min-w-0 flex-1 flex-col justify-between">
        <div>
          {/* Company */}
          <div className="mb-1.5 flex items-center gap-2">
            <div className="skeleton h-4 w-4 rounded-sm" />
            <div className="skeleton h-3 w-20 rounded" />
          </div>
          {/* Title */}
          <div className="skeleton h-5 w-4/5 rounded" />
          <div className="skeleton mt-1.5 h-5 w-3/5 rounded" />
          {/* Description */}
          <div className="skeleton mt-2 h-4 w-full rounded" />
          <div className="skeleton mt-1 h-4 w-4/5 rounded" />
        </div>
        {/* Meta */}
        <div className="mt-2 flex items-center gap-3">
          <div className="skeleton h-3 w-20 rounded" />
          <div className="skeleton h-3 w-16 rounded" />
          <div className="skeleton h-3 w-12 rounded" />
        </div>
      </div>
    </div>
  );
}
