export function ArticleCardSkeleton() {
  return (
    <div className="flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
      {/* Image skeleton */}
      <div className="skeleton aspect-video" />

      {/* Content skeleton */}
      <div className="flex flex-1 flex-col p-4">
        {/* Title */}
        <div className="skeleton h-5 w-4/5 rounded" />
        <div className="skeleton mt-1.5 h-5 w-3/5 rounded" />

        {/* Description */}
        <div className="skeleton mt-3 h-4 w-full rounded" />
        <div className="skeleton mt-1 h-4 w-4/5 rounded" />

        {/* Meta */}
        <div className="mt-auto flex items-center gap-3 pt-4">
          <div className="skeleton h-3 w-20 rounded" />
          <div className="skeleton h-3 w-16 rounded" />
          <div className="skeleton ml-auto h-3 w-12 rounded" />
        </div>
      </div>
    </div>
  );
}
