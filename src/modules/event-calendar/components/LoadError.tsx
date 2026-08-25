import { useEffect, useRef } from 'react';
import { CalendarX2, RotateCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

/** Stan błędu wczytywania danych — z drogą powrotu (retry bez reloadu strony). */
export function LoadError({ onRetry }: { onRetry: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  // focus na kartę błędu (nie na przycisk) — czytniki ekranu ogłaszają zmianę,
  // klawiatura ma natychmiastowy dostęp do retry
  useEffect(() => {
    ref.current?.focus();
  }, []);

  return (
    <div
      ref={ref}
      role="alert"
      tabIndex={-1}
      className="rounded-lg border border-destructive/50 p-8 text-center outline-none"
    >
      <CalendarX2 className="mx-auto mb-3 size-8 text-muted-foreground" aria-hidden="true" />
      <p className="font-medium">Couldn't load the schedule</p>
      <p className="mt-1 text-sm text-muted-foreground">
        Check your connection — the schedule is fetched fresh from the page data.
      </p>
      <Button variant="outline" size="sm" className="mt-4 gap-1.5" onClick={onRetry}>
        <RotateCw className="size-3.5" aria-hidden="true" />
        Try again
      </Button>
    </div>
  );
}
