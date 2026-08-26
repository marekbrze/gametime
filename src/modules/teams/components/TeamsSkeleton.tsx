/** Skeleton ekranów teams — te same bloki co docelowy widok (kafle My teams,
 * karty lig), animate-pulse bez tekstu. */
export function TeamsSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading teams">
      <div className="mb-4 h-7 w-32 animate-pulse rounded bg-muted" />
      <div className="mb-2 h-4 w-20 animate-pulse rounded bg-muted" />
      <div className="mb-6 flex flex-wrap gap-2">
        <div className="h-16 w-44 animate-pulse rounded-lg bg-muted" />
        <div className="h-16 w-44 animate-pulse rounded-lg bg-muted" />
      </div>
      <div className="mb-2 h-4 w-20 animate-pulse rounded bg-muted" />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="h-20 animate-pulse rounded-lg bg-muted" />
        ))}
      </div>
    </div>
  );
}
