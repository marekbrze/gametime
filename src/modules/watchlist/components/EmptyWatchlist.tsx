import { Link } from 'react-router-dom';
import { Star } from 'lucide-react';

/**
 * Pusta watchlista (decyzja designera, proto-lofi): wyjaśnienie mechanizmu
 * gwiazdki + CTA do kalendarza — domyka pętlę calendar → star → watchlist.
 */
export function EmptyWatchlist() {
  return (
    <div className="rounded-lg border border-dashed p-10 text-center">
      <Star className="mx-auto mb-3 size-8 text-muted-foreground" aria-hidden="true" />
      <p className="font-medium">Your watchlist is empty</p>
      <p className="mt-1 text-sm text-muted-foreground">
        Star events in the calendar to build your watchlist.
      </p>
      <Link
        to="/event-calendar"
        className="mt-4 inline-flex h-9 items-center rounded-md border bg-background px-4 text-sm font-medium transition-colors hover:bg-muted focus-visible:underline"
      >
        Browse this week
      </Link>
    </div>
  );
}
