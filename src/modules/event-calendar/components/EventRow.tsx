import { Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ExportMenu } from '@/modules/calendar-export/components/ExportMenu';
import type { EventStatus, SportEvent } from '@/modules/data-source/types';
import type { TimeBandKind } from '@/modules/settings/types';
import { formatTimeInZone, type TimeZone } from '@/shared/lib/datetime';
import { BAND_EDGE } from '@/modules/settings/lib/bands-ui';
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
}

export function EventRow({
  event,
  status,
  band,
  tz,
  watched,
  onToggleWatch,
  favorite,
}: EventRowProps) {
  const start = new Date(event.startUtc);
  /** finished i postponed przygaszone — przełożone zostają widoczne (ADR-0011) */
  const dimmed = status === 'finished' || status === 'postponed';

  return (
    <div
      className={[
        'flex items-center gap-3 rounded-md border-l-4 bg-card px-3 py-2',
        BAND_EDGE[band],
        favorite ? 'bg-muted/60' : '',
        dimmed ? 'opacity-55' : '',
      ].join(' ')}
    >
      <span className="text-lg" aria-hidden="true">
        {sportEmoji(event)}
      </span>
      <span className="w-12 shrink-0 text-sm font-medium tabular-nums">
        {formatTimeInZone(start, tz)}
      </span>
      <span className="min-w-0 flex-1 truncate text-sm">
        {participantsLabel(event)}
        {status === 'postponed' && (
          <span className="ml-2 text-xs text-muted-foreground">Postponed</span>
        )}
        {status === 'canceled' && (
          <span className="ml-2 text-xs text-muted-foreground">Canceled</span>
        )}
      </span>
      <span className="hidden shrink-0 text-xs text-muted-foreground sm:inline">
        {leagueName(event)}
      </span>
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
  );
}
