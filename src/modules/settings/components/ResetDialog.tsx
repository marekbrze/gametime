import { useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';

interface ResetDialogProps {
  /** null = zamknięty; sterowany przez „Reset to defaults" na ekranie */
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

/**
 * Potwierdzenie resetu ustawień (ADR-0026): świadoma decyzja designera ponad
 * idiom undo-toast — reset kasuje strefę, pasma I viewMode naraz, więc toast
 * „przywrócono" byłby mylący (zmian widocznych na innych ekranach nie da się
 * pokazać z poziomu toastu). Natywny <dialog>: Escape, focus trap i zwrot
 * fokusu do otwierającego za darmo (idiom EventDetailsDialog).
 */
export function ResetDialog({ open, onClose, onConfirm }: ResetDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const openerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const onNativeClose = () => {
      (openerRef.current as HTMLElement | null)?.focus?.();
      onClose();
    };
    dialog.addEventListener('close', onNativeClose);
    return () => dialog.removeEventListener('close', onNativeClose);
  }, [onClose]);

  // Klik w tło zamyka (cel == samo <dialog>); klawiatura ma natywny Escape
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog || !open) return;
    const onBackdropClick = (e: MouseEvent) => {
      if (e.target === dialog) dialog.close();
    };
    dialog.addEventListener('click', onBackdropClick);
    return () => dialog.removeEventListener('click', onBackdropClick);
  }, [open]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog || !open) return;
    openerRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    dialog.showModal();
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      aria-label="Reset settings"
      className="m-auto w-full max-w-sm rounded-lg border bg-background p-0 backdrop:bg-black/30"
    >
      <div className="p-5">
        <h2 className="text-base font-semibold">Reset all settings?</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          This will reset timezone, bands and view mode to defaults.
        </p>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="outline" onClick={() => dialogRef.current?.close()}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={() => {
              onConfirm();
              dialogRef.current?.close();
            }}
          >
            Reset
          </Button>
        </div>
      </div>
    </dialog>
  );
}
