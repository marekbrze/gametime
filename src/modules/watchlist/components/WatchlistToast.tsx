import { useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';

export interface WatchlistToastState {
  /** zmiana id = nowa wiadomość (restart timera) */
  id: number;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}

/**
 * Lekki toast na dole ekranu (harden #6/#14, ADR-0018): undo po odgwiazdkowaniu,
 * potwierdzenie eksportu, informacja o sprzątaniu sierot. Auto-dismiss 5s.
 * role="status" + aria-live — operacje nietrwałe ogłaszane uprzejmie.
 */
export function WatchlistToast({
  toast,
  onDismiss,
}: {
  toast: WatchlistToastState;
  onDismiss: () => void;
}) {
  // onDismiss przez ref — timer zależny wyłącznie od id, nie od re-renderów rodzica
  const dismissRef = useRef(onDismiss);
  dismissRef.current = onDismiss;

  useEffect(() => {
    const timer = window.setTimeout(() => dismissRef.current(), 5000);
    return () => window.clearTimeout(timer);
  }, [toast.id]);

  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 bottom-20 z-30 flex justify-center px-4 md:bottom-6"
    >
      <div className="pointer-events-auto flex items-center gap-3 rounded-md border bg-background px-4 py-2.5 shadow-lg">
        <p className="text-sm">{toast.message}</p>
        {toast.onAction && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              toast.onAction?.();
              onDismiss();
            }}
          >
            {toast.actionLabel ?? 'Undo'}
          </Button>
        )}
      </div>
    </div>
  );
}
