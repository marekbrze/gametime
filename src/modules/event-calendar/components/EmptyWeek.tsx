import { CalendarX2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { DataWindow } from '@/modules/data-source/types';

/**
 * Pusty tydzień — trzy różne powody wymagają różnych wyjaśnień:
 * tydzień poza oknem danych (DataWindow) / filtry / faktycznie pusty tydzień
 * (off-season). Komunikat nie może kłamać: "off-season" na tygodniu, dla
 * którego po prostu nie mamy danych, byłby przekłamaniem — a "nie pasuje do
 * filtrów" na tygodniu, w którym nie mamy żadnych danych, też (ADR-0016).
 * Dlatego beyondWindow ma pierwszeństwo przed hasFilters.
 */
interface EmptyWeekProps {
  hasFilters: boolean;
  /** wyświetlany tydzień wypada poza oknem danych snapshota */
  beyondWindow: boolean;
  dataWindow: DataWindow | null;
  onClearFilters: () => void;
  onThisWeek: () => void;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export function EmptyWeek({
  hasFilters,
  beyondWindow,
  dataWindow,
  onClearFilters,
  onThisWeek,
}: EmptyWeekProps) {
  const showWindowNote = beyondWindow && dataWindow !== null;

  return (
    <div className="rounded-lg border border-dashed p-10 text-center">
      <CalendarX2 className="mx-auto mb-3 size-8 text-muted-foreground" aria-hidden="true" />
      {beyondWindow ? (
        <p className="font-medium">No data for this week</p>
      ) : hasFilters ? (
        <>
          <p className="font-medium">No events match your filters this week</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Try widening the time band or picking another sport.
          </p>
          <Button variant="outline" size="sm" className="mt-4" onClick={onClearFilters}>
            Clear filters
          </Button>
        </>
      ) : (
        <>
          <p className="font-medium">No events this week</p>
          <p className="mt-1 text-sm text-muted-foreground">
            It may be off-season — check next week with the pager above.
          </p>
        </>
      )}
      {showWindowNote && dataWindow && (
        <p className="mt-3 text-xs text-muted-foreground">
          We load schedules {formatDate(dataWindow.from)} – {formatDate(dataWindow.to)}, about two
          weeks ahead and one week back.{' '}
          <button type="button" className="underline underline-offset-2" onClick={onThisWeek}>
            Back to this week
          </button>
        </p>
      )}
    </div>
  );
}
