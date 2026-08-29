import { Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ExportMenu } from '@/modules/calendar-export/components/ExportMenu';
import type { EventStatus, SportEvent } from '@/modules/data-source/types';
import type { TimeBandKind } from '@/modules/settings/types';
import { formatTimeInZone, type TimeZone } from '@/shared/lib/datetime';
import { BAND_CARD, BAND_DOT, BAND_TIME } from '@/modules/settings/lib/bands-ui';
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
  /** tło wiersza w tincie pasma — płaskie listy terminarza, gdzie pasma mijają
   * się wiersz po wierszu i samotna kropka je zlewa (iteracja 2, ADR-0032) */
  bandTint?: boolean;
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
  bandTint,
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

  // li — wiersz żyje wyłącznie w listach (ul w DayGroup/PastSection/terminarzu)
  const surface = [
    'rounded-md border px-3 py-2 transition-colors duration-150',
    bandTint ? BAND_CARD[band] : 'bg-card',
    // tint pasma sam akcentuje — podświetlenie ulubionego tylko na neutralnym tle
    !bandTint && favorite ? 'bg-muted/60' : '',
    dimmed ? 'opacity-55' : '',
  ].join(' ');

  /** Kropka wiodąca pasma — zamiast zbanowanego side-stripe'a (ADR-0029) */
  const dot = <span className={`size-2 shrink-0 rounded-full ${BAND_DOT[band]}`} aria-hidden="true" />;
  const emoji = (
    <span className="text-lg" aria-hidden="true">
      {sportEmoji(event)}
    </span>
  );
  /** Czas w kolorze pasma — drugi nośnik obok kropki (ADR-0032, AA na card);
   * klasa rozmiaru/szerokości podaje wariant (w-12 w linii, caption w metarowsie) */
  const time = (sizeClass: string) => (
    <span className={`shrink-0 font-medium ${sizeClass} ${BAND_TIME[band]}`}>
      {formatTimeInZone(start, tz)}
    </span>
  );
  const league = (
    <span className="hidden shrink-0 text-xs text-muted-foreground sm:inline">{leagueName(event)}</span>
  );
  const liveChip =
    liveIndicator &&
    status === 'live' && (
      <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-live/12 px-1.5 py-0.5 text-caption font-semibold uppercase tracking-wide text-live-text">
        <span className="size-1.5 animate-live-pulse rounded-full bg-live" aria-hidden="true" />
        Live
      </span>
    );
  const starButton = (
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
  );

  // Wiersz BEZ daty (kalendarz, watchlista): jedna linia flex. Mobilnie bez
  // truncate — karta może zająć 2-3 wiersze, żeby pełne nazwy drużyn były
  // czytelne (375 px); ≥sm gęstość jednowierszowa (ADR-0033).
  if (!dateLabel) {
    return (
      <li className={`flex items-center gap-3 ${surface}`}>
        {dot}
        {emoji}
        {time('w-12 text-sm')}
        {onOpenDetails ? (
          <button
            type="button"
            onClick={() => onOpenDetails(event)}
            className="min-w-0 flex-1 text-left text-sm leading-snug underline-offset-2 hover:underline focus-visible:underline sm:truncate"
          >
            {label}
          </button>
        ) : (
          <span className="min-w-0 flex-1 text-sm leading-snug sm:truncate">{label}</span>
        )}
        {league}
        {liveChip}
        {starButton}
        <ExportMenu event={event} />
      </li>
    );
  }

  // Wiersz Z datą (terminarz płaski, PastSection flat): mobile dwa wiersze —
  // meta (kropka, emoji, data, czas + gwiazdka/eksport po prawej) i etykieta
  // meczu na całej szerokości (ADR-0033, iteracja 2: kolumna daty + czas +
  // akcje zjadały ~260 px z 375 px i ściskały nazwy drużyn). ≥sm: ta sama
  // pojedyncza linia co zawsze (kolumna daty w-14, czas w-12, truncate).
  return (
    <li
      className={[
        'grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1',
        "[grid-template-areas:'meta_actions'_'body_body']",
        'sm:grid-cols-[auto_minmax(0,1fr)_auto]',
        "sm:[grid-template-areas:'meta_body_actions']",
        surface,
      ].join(' ')}
    >
      <div className="flex min-w-0 items-center gap-2 [grid-area:meta] sm:gap-3">
        {dot}
        {emoji}
        <span className="flex shrink-0 items-baseline gap-1 text-caption leading-tight sm:w-14 sm:flex-col sm:gap-0">
          <span className="text-muted-foreground">{dateLabel.weekday}</span>
          <span className="text-muted-foreground/50 sm:hidden" aria-hidden="true">
            ·
          </span>
          <span className="text-foreground/80">{dateLabel.date}</span>
        </span>
        {time('text-caption sm:w-12 sm:text-sm')}
      </div>
      <div className="flex min-w-0 items-center gap-3 [grid-area:body]">
        {onOpenDetails ? (
          <button
            type="button"
            onClick={() => onOpenDetails(event)}
            className="min-w-0 flex-1 text-left text-sm leading-snug underline-offset-2 hover:underline focus-visible:underline sm:truncate"
          >
            {label}
          </button>
        ) : (
          <span className="min-w-0 flex-1 text-sm leading-snug sm:truncate">{label}</span>
        )}
        {league}
        {liveChip}
      </div>
      <div className="flex items-center gap-3 [grid-area:actions]">
        {starButton}
        <ExportMenu event={event} />
      </div>
    </li>
  );
}
