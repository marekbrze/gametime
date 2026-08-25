/**
 * Skeleton pierwszego ładowania — odzwierciedla strukturę widoku tygodnia
 * (pager + grupy dni z wierszami), nie generyczny spinner.
 */
export function WeekSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading schedule" className="animate-pulse">
      {/* pager */}
      <div className="mb-4 flex items-center justify-between">
        <div className="size-9 rounded-md bg-muted" />
        <div className="h-5 w-44 rounded bg-muted" />
        <div className="size-9 rounded-md bg-muted" />
      </div>
      {/* grupy dni */}
      {[0, 1, 2].map((day) => (
        <section key={day} className="mb-8">
          <div className="mb-3 flex items-center gap-3 border-b pb-2">
            <div className="h-5 w-24 rounded bg-muted" />
            <div className="h-4 w-20 rounded bg-muted" />
          </div>
          <ul className="space-y-1.5">
            {[0, 1, 2].map((row) => (
              <li key={row} className="h-11 rounded-md border-l-4 border-muted bg-muted/40" />
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
