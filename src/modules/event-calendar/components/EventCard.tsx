import { Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ExportMenu } from '@/modules/calendar-export/components/ExportMenu';
import type { EventStatus, SportEvent } from '@/modules/data-source/types';
import type { TimeBandKind } from '@/modules/settings/types';
import { formatTimeInZone, type TimeZone } from '@/shared/lib/datetime';
import { BAND_EDGE } from '@/modules/settings/lib/bands-ui';
import { leagueName, participantsLabel, sportEmoji } from '../lib/event-labels';

interface EventCardProps {
  event: SportEvent;
  status: EventStatus;
  band: TimeBandKind;
  tz: TimeZone;
  watched: boolean;
  onToggleWatch: () => void;
  favorite: boolean;
  /** otwarcie szczegółów wydarzenia (klik w etykietę — jump to event z watchlisty) */
  onOpenDetails?: (event: SportEvent) => void;
  /** chip LIVE dla trwających — watchlista (kalendarz ma własny NowBlock, ADR-0018) */
  liveIndicator?: boolean;
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
}: EventCardProps) {
  const start = new Date(event.startUtc);

  return (
    <div
      className={[
        'rounded-lg border-l-4 bg-card p-4 shadow-sm',
        BAND_EDGE[band],
        favorite ? 'bg-muted/60' : '',
        status === 'finished' || status === 'postponed' || status === 'canceled'
          ? 'opacity-55'
          : '',
      ].join(' ')}
    >
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="text-2xl" aria-hidden="true">
          {sportEmoji(event)}
        </span>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            aria-label={watched ? 'Remove from watchlist' : 'Add to watchlist'}
            aria-pressed={watched}
            onClick={onToggleWatch}
          >
            <Star
              className={`size-4 ${watched ? 'fill-current text-amber-500' : 'text-muted-foreground'}`}
              aria-hidden="true"
            />
          </Button>
          <ExportMenu event={event} />
        </div>
      </div>
      {onOpenDetails ? (
        <button
          type="button"
          onClick={() => onOpenDetails(event)}
          className="block w-full text-left text-base font-medium leading-snug underline-offset-2 hover:underline focus-visible:underline"
        >
          {participantsLabel(event)}
        </button>
      ) : (
        <p className="text-base font-medium leading-snug">{participantsLabel(event)}</p>
      )}
      <p className="mt-1 text-sm text-muted-foreground">
        <span className="font-medium tabular-nums text-foreground">
          {formatTimeInZone(start, tz)}
        </span>{' '}
        · {leagueName(event)}
        {liveIndicator && status === 'live' && (
          <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-red-500/15 px-1.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-red-600">
            <span className="size-1.5 animate-pulse rounded-full bg-red-600" aria-hidden="true" />
            Live
          </span>
        )}
      </p>
    </div>
  );
}
