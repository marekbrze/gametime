import { Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ExportMenu } from '@/modules/calendar-export/components/ExportMenu';
import type { EventStatus, SportEvent } from '@/modules/data-source/types';
import type { TimeBandKind } from '@/modules/settings/types';
import { formatTimeInZone, type TimeZone } from '@/shared/lib/datetime';
import { BAND_DOT, BAND_TIME } from '@/modules/settings/lib/bands-ui';
import { leagueName, participantsLabel, sportEmoji } from '../lib/event-labels';

interface EventRowProps {
  event: SportEvent;
  status: EventStatus;
  band: TimeBandKind;
  tz: TimeZone;
  watched: boolean;
  onToggleWatch: () => void;
  /** którykolwiek uczestnik jest ulubioną drużyną → subtelne podświetlenie */
  favorite: boolean;
  /** otwarcie szczegółów wydarzenia (klik w etykietę — jump to event z watchlisty) */
  onOpenDetails?: (event: SportEvent) => void;
  /** chip LIVE dla trwających — watchlista (kalendarz ma własny NowBlock, ADR-0018) */
  liveIndicator?: boolean;
  /** data ("Sat" / "Sep 6") dla płaskich list bez grup dnia — terminarz (ADR-0032) */
  dateLabel?: { weekday: string; date: string };
}

export function EventRow({
  event,
  status,
  band,
  tz,
  watched,
  onToggleWatch,
  favorite,
  onOpenDetails,
  liveIndicator,
  dateLabel,
}: EventRowProps) {
  const start = new Date(event.startUtc);
  /** finished/postponed przygaszone — przełożone zostają widoczne (ADR-0011);
   * canceled też (na watchliście lista usera nie traci wpisów po cichu, ADR-0018) */
  const dimmed = status === 'finished' || status === 'postponed' || status === 'canceled';

  const label = (
    <>
      {participantsLabel(event)}
      {status === 'postponed' && (
        <span className="ml-2 text-xs text-muted-foreground">Postponed</span>
      )}
      {status === 'canceled' && (
        <span className="ml-2 text-xs text-muted-foreground">Canceled</span>
      )}
    </>
  );

  return (
    // li — wiersz żyje wyłącznie w listach (ul w DayGroup/PastSection/terminarzu)
    <li
      className={[
        'flex items-center gap-3 rounded-md border bg-card px-3 py-2 transition-colors duration-150',
        favorite ? 'bg-muted/60' : '',
        dimmed ? 'opacity-55' : '',
      ].join(' ')}
    >
      {/* Kropka wiodąca pasma — zamiast zbanowanego side-stripe'a (ADR-0029) */}
      <span
        className={`size-2 shrink-0 rounded-full ${BAND_DOT[band]}`}
        aria-hidden="true"
      />
      <span className="text-lg" aria-hidden="true">
        {sportEmoji(event)}
      </span>
      {dateLabel && (
        <span className="flex w-14 shrink-0 flex-col leading-tight">
          <span className="text-caption text-muted-foreground">{dateLabel.weekday}</span>
          <span className="text-caption text-foreground/80">{dateLabel.date}</span>
        </span>
      )}
      {/* Czas w kolorze pasma — drugi nośnik obok kropki (ADR-0032, AA na card) */}
      <span className={`w-12 shrink-0 text-sm font-medium ${BAND_TIME[band]}`}>
        {formatTimeInZone(start, tz)}
      </span>
      {onOpenDetails ? (
        <button
          type="button"
          onClick={() => onOpenDetails(event)}
          className="min-w-0 flex-1 truncate text-left text-sm underline-offset-2 hover:underline focus-visible:underline"
        >
          {label}
        </button>
      ) : (
        <span className="min-w-0 flex-1 truncate text-sm">{label}</span>
      )}
      <span className="hidden shrink-0 text-xs text-muted-foreground sm:inline">
        {leagueName(event)}
      </span>
      {liveIndicator && status === 'live' && (
        <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-live/12 px-1.5 py-0.5 text-caption font-semibold uppercase tracking-wide text-live-text">
          <span className="size-1.5 animate-live-pulse rounded-full bg-live" aria-hidden="true" />
          Live
        </span>
      )}
      <Button
        variant="ghost"
        size="icon"
        className="relative after:absolute after:-inset-1.5 after:content-['']"
        aria-label={watched ? 'Remove from watchlist' : 'Add to watchlist'}
        aria-pressed={watched}
        onClick={onToggleWatch}
      >
        {/* Gwiazdka = akcja brandowa: papaya (DESIGN.md — akcent tylko akcje/stany) */}
        <Star
          className={`size-4 ${watched ? 'fill-current text-brand-text' : 'text-muted-foreground'}`}
          aria-hidden="true"
        />
      </Button>
      <ExportMenu event={event} />
    </li>
  );
}
