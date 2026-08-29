import { Heart, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ExportMenu } from '@/modules/calendar-export/components/ExportMenu';
import type { EventStatus, SportEvent } from '@/modules/data-source/types';
import type { TimeBandKind } from '@/modules/settings/types';
import { formatTimeInZone, type TimeZone } from '@/shared/lib/datetime';
import { BAND_CARD, BAND_DOT, BAND_TIME } from '@/modules/settings/lib/bands-ui';
import { leagueName, participantsLabel, sportEmoji } from '../lib/event-labels';

interface EventCardProps {
  event: SportEvent;
  status: EventStatus;
  band: TimeBandKind;
  tz: TimeZone;
  watched: boolean;
  onToggleWatch: () => void;
  /** którykolwiek uczestnik jest ulubioną drużyną → serduszko przed etykietą
   * (ADR-0034: heart = ulubiona drużyna, star = watchlista wydarzenia) */
  favorite: boolean;
  /** otwarcie szczegółów wydarzenia (klik w etykietę — jump to event z watchlisty) */
  onOpenDetails?: (event: SportEvent) => void;
  /** chip LIVE dla trwających — watchlista (kalendarz ma własny NowBlock, ADR-0018) */
  liveIndicator?: boolean;
  /** data ("Sat" / "Sep 6") dla płaskich list bez grup dnia — terminarz (ADR-0032) */
  dateLabel?: { weekday: string; date: string };
}

/** Widok alternatywny (UserSettings.viewMode = 'cards'): większy format, kolor pasa mocniej. */
export function EventCard({
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
}: EventCardProps) {
  const start = new Date(event.startUtc);

  return (
    <div
      className={[
        // Karta widoku cards: kolor pasa mocniej — tint całej powierzchni (DESIGN.md)
        'rounded-lg border p-4',
        BAND_CARD[band],
        status === 'finished' || status === 'postponed' || status === 'canceled'
          ? 'opacity-55'
          : '',
      ].join(' ')}
    >
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {/* Kropka wiodąca pasma — zamiast zbanowanego side-stripe'a (ADR-0029) */}
          <span className={`size-2 rounded-full ${BAND_DOT[band]}`} aria-hidden="true" />
          <span className="text-2xl" aria-hidden="true">
            {sportEmoji(event)}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            aria-label={watched ? 'Remove from watchlist' : 'Add to watchlist'}
            aria-pressed={watched}
            onClick={onToggleWatch}
          >
            {/* Gwiazdka = akcja brandowa: papaya */}
            <Star
              className={`size-4 ${watched ? 'fill-current text-brand-text' : 'text-muted-foreground'}`}
              aria-hidden="true"
            />
          </Button>
          <ExportMenu event={event} />
        </div>
      </div>
      {/* Serduszko = mecz ulubionej drużyny, wiodące przed uczestnikami (ADR-0034);
          tint pasma pozostaje czystym nośnikiem powierzchni */}
      <div className="flex items-start gap-1.5">
        {favorite && (
          <>
            <Heart
              className="mt-0.5 size-3.5 shrink-0 fill-current text-brand-text"
              aria-hidden="true"
            />
            <span className="sr-only">My team. </span>
          </>
        )}
        {onOpenDetails ? (
          <button
            type="button"
            onClick={() => onOpenDetails(event)}
            className="min-w-0 flex-1 text-left text-base font-medium leading-snug underline-offset-2 hover:underline focus-visible:underline"
          >
            {participantsLabel(event)}
          </button>
        ) : (
          <p className="min-w-0 flex-1 text-base font-medium leading-snug">{participantsLabel(event)}</p>
        )}
      </div>
      <p className="mt-1 text-sm text-muted-foreground">
        {dateLabel && (
          <span className="font-medium text-foreground">
            {dateLabel.weekday}, {dateLabel.date} ·{' '}
          </span>
        )}
        {/* Czas w kolorze pasma — drugi nośnik obok kropki (ADR-0032, AA na tincie) */}
        <span className={`font-medium ${BAND_TIME[band]}`}>{formatTimeInZone(start, tz)}</span>{' '}
        · {leagueName(event)}
        {liveIndicator && status === 'live' && (
          <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-live/12 px-1.5 py-0.5 text-caption font-semibold uppercase tracking-wide text-live-text">
            <span className="size-1.5 animate-live-pulse rounded-full bg-live" aria-hidden="true" />
            Live
          </span>
        )}
      </p>
    </div>
  );
}
