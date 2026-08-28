import { useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * Banner awarii zapisu localStorage (private mode, quota) — jedyna droga
 * utraty danych użytkownika w aplikacji bez backendu. Pokazujemy dopóki
 * błąd trwa i dopóki user nie zamknie; zmiana, której nie udało się zapisać,
 * została wycofana wizualnie (rollback w useLocalStorage).
 */
export function StorageWarning() {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;
  return (
    <div
      role="alert"
      className="mb-4 flex items-start gap-2 rounded-lg border border-warning/50 bg-warning/10 p-3 text-sm"
    >
      <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warning-text" aria-hidden="true" />
      <p className="flex-1">
        Couldn't save your change — browser storage is unavailable or full.
        The last change wasn't saved and has been reverted.
      </p>
      <Button
        variant="ghost"
        size="icon"
        className="size-6 shrink-0"
        aria-label="Dismiss warning"
        onClick={() => setDismissed(true)}
      >
        <X className="size-3.5" aria-hidden="true" />
      </Button>
    </div>
  );
}
