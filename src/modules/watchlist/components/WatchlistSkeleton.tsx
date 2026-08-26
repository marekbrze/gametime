/**
 * Skeleton pierwszego ładowania watchlisty (harden #10, ADR-0018) — kształt
 * własny ekranu: nagłówek + eksport, pasek filtrów, grupy dni z wierszami
 * (bez pagera tygodnia, w odróżnieniu od WeekSkeleton).
 */
export function WatchlistSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading watchlist" className="animate-pulse">
      {/* nagłówek + przycisk eksportu */}
      <div className="mb-4 flex items-center justify-between">
        <div className="h-7 w-32 rounded bg-muted" />
        <div className="h-8 w-44 rounded-md bg-muted" />
      </div>
      {/* pasek filtrów */}
      <div className="mb-4 flex items-center gap-2">
        {[24, 20, 28, 32].map((w, i) => (
          <div key={i} className="h-8 rounded-md bg-muted" style={{ width: `${w * 4}px` }} />
        ))}
      </div>
      {/* grupy dni */}
      {[0, 1, 2].map((day) => (
        <section key={day} className="mb-8">
          <div className="mb-3 flex items-center gap-3 border-b pb-2">
            <div className="h-5 w-24 rounded bg-muted" />
            <div className="h-4 w-20 rounded bg-muted" />
          </div>
          <ul className="space-y-1.5">
            {[0, 1].map((row) => (
              <li key={row} className="h-11 rounded-md border-l-4 border-muted bg-muted/40" />
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
