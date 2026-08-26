import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Apple, Check, CalendarDays, CalendarClock, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { SportEvent } from '@/modules/data-source/types';
import { downloadIcs, googleCalendarUrl } from '@/modules/calendar-export/lib/export';
import { MAX_WEEK_OFFSET } from '@/modules/filters';
import type { UserSettings } from '@/modules/settings/types';
import { bandOfDate } from '@/modules/settings/lib/time-bands';
import { BAND_CHIP } from '@/modules/settings/lib/bands-ui';
import {
  dayKeyInZone,
  formatDayLabel,
  formatTimeInZone,
  viewingDayKeyInZone,
  weekStartKey,
  type TimeZone,
} from '@/shared/lib/datetime';
import { leagueName, participantsLabel, sportEmoji } from '@/modules/event-calendar/lib/event-labels';
import { deriveStatus } from '@/modules/data-source/lib/status';
import { useNow } from '@/modules/event-calendar/hooks/use-now';
import { findRescheduled } from '../lib/reschedule';

interface EventDetailsDialogProps {
  /** null = zamknięty; otwarcie przez wybór wydarzenia (jump to event z ACTIONS.md) */
  event: SportEvent | null;
  /** pełny zbiór wydarzeń — szukanie nowej instancji przełożonego (#2, ADR-0018) */
  allEvents: SportEvent[];
  /** migracja gwiazdki na nową instancję („Watch new date") */
  onMigrate: (from: SportEvent, to: SportEvent) => void;
  settings: UserSettings;
  tz: TimeZone;
  onClose: () => void;
}

/**
 * Szczegóły obserwowanego wydarzenia (decyzja designera, proto-lofi): pełna
 * data/godzina, liga, pasmo, status + eksporty + „Show in calendar".
 * Natywny <dialog>: Escape, focus trap i aria-modal za darmo; każdy tor
 * zamknięcia (Escape, tło, ×, „Show in calendar") przechodzi przez native
 * 'close', które oddaje fokus elementowi otwierającemu i sprząta stan rodzica.
 */
export function EventDetailsDialog({
  event,
  allEvents,
  onMigrate,
  settings,
  tz,
  onClose,
}: EventDetailsDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const openerRef = useRef<HTMLElement | null>(null);
  const navigate = useNavigate();
  const now = useNow(30_000);

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
    if (!dialog) return;
    const onBackdropClick = (e: MouseEvent) => {
      if (e.target === dialog) dialog.close();
    };
    dialog.addEventListener('click', onBackdropClick);
    return () => dialog.removeEventListener('click', onBackdropClick);
  }, [event]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog || !event) return;
    openerRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    dialog.showModal();
  }, [event]);

  if (!event) return null;

  const start = new Date(event.startUtc);
  const band = bandOfDate(start, settings);
  const status = deriveStatus(event, now);
  const viewingKey = viewingDayKeyInZone(start, tz, band === 'night');
  const { weekday, date } = formatDayLabel(viewingKey);

  /** Offset tygodnia wydarzenia względem bieżącego — link do kalendarza (ADR-0014),
   * clamp ±52 jak w parserze URL (#12, ADR-0018). */
  const weekOffset = (() => {
    const eventMonday = weekStartKey(viewingKey);
    const currentMonday = weekStartKey(dayKeyInZone(now, tz));
    const toUtc = (key: string) => new Date(`${key}T00:00:00Z`).getTime();
    const raw = Math.round((toUtc(eventMonday) - toUtc(currentMonday)) / (7 * 86_400_000));
    return Math.max(-MAX_WEEK_OFFSET, Math.min(MAX_WEEK_OFFSET, raw));
  })();

  /** Przełożone: szukamy nowej instancji w danych (harden #2, ADR-0018). */
  const rescheduled = findRescheduled(event, allEvents);

  return (
    <dialog
      ref={dialogRef}
      aria-label="Event details"
      className="m-auto w-full max-w-md rounded-lg border bg-background p-0 backdrop:bg-black/30"
    >
      <div className="p-5">
        <div className="mb-3 flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl" aria-hidden="true">
              {sportEmoji(event)}
            </span>
            <h2 className="text-base font-semibold leading-snug">{participantsLabel(event)}</h2>
          </div>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Close details"
            onClick={() => dialogRef.current?.close()}
          >
            <X className="size-4" aria-hidden="true" />
          </Button>
        </div>

        <dl className="space-y-1.5 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">When</dt>
            <dd className="text-right font-medium">
              {weekday}, {date} · {formatTimeInZone(start, tz)}
              {band === 'night' && (
                <span className="ml-1 text-xs text-muted-foreground">(after midnight)</span>
              )}
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">League</dt>
            <dd className="font-medium">{leagueName(event)}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Time band</dt>
            <dd>
              <span className={`rounded-full px-2 py-0.5 text-xs capitalize ${BAND_CHIP[band]}`}>
                {band}
              </span>
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Status</dt>
            <dd className="font-medium capitalize">{status}</dd>
          </div>
        </dl>

        {rescheduled && (
          <div
            role="status"
            className="mt-3 flex flex-wrap items-center gap-2 rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm"
          >
            <CalendarClock className="size-4 text-amber-600" aria-hidden="true" />
            <span>
              Rescheduled →{' '}
              <span className="font-medium">
                {(() => {
                  const newStart = new Date(rescheduled.startUtc);
                  const newBand = bandOfDate(newStart, settings);
                  const { weekday: wd, date: d } = formatDayLabel(
                    viewingDayKeyInZone(newStart, tz, newBand === 'night'),
                  );
                  return `${wd}, ${d} · ${formatTimeInZone(newStart, tz)}`;
                })()}
              </span>
            </span>
            <Button
              size="sm"
              variant="outline"
              className="ml-auto"
              onClick={() => {
                onMigrate(event, rescheduled);
                dialogRef.current?.close();
              }}
            >
              Watch new date
            </Button>
          </div>
        )}

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <a
            href={googleCalendarUrl(event)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-9 items-center gap-2 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            <Check className="size-4" aria-hidden="true" />
            Google Calendar
          </a>
          <Button variant="outline" onClick={() => downloadIcs(event)}>
            <Apple className="size-4" aria-hidden="true" />
            Apple / ICS
          </Button>
          <Button
            variant="ghost"
            className="ml-auto gap-1.5"
            onClick={() => {
              dialogRef.current?.close();
              navigate(weekOffset === 0 ? '/event-calendar' : `/event-calendar?w=${weekOffset}`);
            }}
          >
            <CalendarDays className="size-4" aria-hidden="true" />
            Show in calendar
          </Button>
        </div>
      </div>
    </dialog>
  );
}
