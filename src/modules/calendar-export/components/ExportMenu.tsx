import { useState } from 'react';
import { CalendarPlus, Check, Apple } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { SportEvent } from '@/modules/data-source/types';
import { downloadIcs, googleCalendarUrl } from '../lib/export';

/**
 * Menu eksportu przy wierszu wydarzenia: Google (link TEMPLATE) + ICS (Apple).
 * Lo-fi: rozwijane natywnym <details> — dostępne z klawiatury bez zależności.
 */
export function ExportMenu({ event }: { event: SportEvent }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="icon"
        aria-label="Add to calendar"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <CalendarPlus className="size-4" aria-hidden="true" />
      </Button>
      {open && (
        <>
          {/* klik poza menu zamyka */}
          <button
            type="button"
            aria-label="Close menu"
            className="fixed inset-0 z-10 cursor-default"
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 z-20 mt-1 w-44 rounded-md border bg-background p-1 shadow-sm">
            <a
              href={googleCalendarUrl(event)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-muted"
              onClick={() => setOpen(false)}
            >
              <Check className="size-4" aria-hidden="true" />
              Google Calendar
            </a>
            <button
              type="button"
              className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm hover:bg-muted"
              onClick={() => {
                downloadIcs(event);
                setOpen(false);
              }}
            >
              <Apple className="size-4" aria-hidden="true" />
              Apple / ICS file
            </button>
          </div>
        </>
      )}
    </div>
  );
}
