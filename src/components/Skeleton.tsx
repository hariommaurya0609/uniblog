export function CompanyFilterSkeleton({
  variant = "default",
}: {
  variant?: "sidebar" | "default";
}) {
  const showSidebar = variant === "sidebar";
  const rows = [100, 80, 90, 70, 85, 75, 95, 65, 88, 72];

  return (
    <div className="space-y-2">
      {/* Search box skeleton */}
      <div
        className={`skeleton mb-3 h-8 w-full rounded-lg ${showSidebar ? "block" : "hidden lg:block"}`}
      />

      {/* "All" button skeleton */}
      <div
        className={`${showSidebar ? "flex" : "hidden lg:flex"} items-center gap-2.5 rounded-lg px-3 py-2`}
      >
        <div className="skeleton h-6 w-6 rounded-md" />
        <div className="skeleton h-3.5 w-24 rounded" />
        <div className="skeleton ml-auto h-3 w-8 rounded" />
      </div>

      {/* Company rows skeleton (sidebar / desktop) */}
      <div
        className={`${showSidebar ? "block" : "hidden lg:block"} space-y-0.5`}
      >
        {rows.map((w, i) => (
          <div key={i} className="flex items-center gap-2.5 rounded-lg px-3 py-2">
            <div className="skeleton h-5 w-5 shrink-0 rounded-sm" />
            <div className={`skeleton h-3.5 rounded`} style={{ width: `${w}%` }} />
            <div className="skeleton ml-auto h-3 w-6 shrink-0 rounded" />
          </div>
        ))}
      </div>

      {/* Mobile pills skeleton */}
      {!showSidebar && (
        <div className="flex flex-wrap gap-2 lg:hidden">
          {[60, 80, 50, 70, 90, 55, 75, 65].map((w, i) => (
            <div
              key={i}
              className="skeleton h-8 rounded-full"
              style={{ width: `${w}px` }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

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
