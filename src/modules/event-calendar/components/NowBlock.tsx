import type { SportEvent } from '@/modules/data-source/types';
import { Radio } from 'lucide-react';
import { formatDuration, formatTimeInZone, type TimeZone } from '@/shared/lib/datetime';
import { deriveStatus, isStartingSoon } from '@/modules/data-source/lib/status';
import { leagueName, participantsLabel, sportEmoji } from '../lib/event-labels';

interface NowItem {
  event: SportEvent;
  /** ms od startu (dla live) albo do startu (dla soon) */
  deltaMs: number;
  soon: boolean;
}

interface NowBlockProps {
  events: SportEvent[];
  now: Date;
  tz: TimeZone;
}

/**
 * Szczyt listy (ADR-0005): trwające + startujące w ≤60 min,
 * wszystko wyliczane z czasu startu — bez realtime API.
 */
export function NowBlock({ events, now, tz }: NowBlockProps) {
  const items: NowItem[] = [];

  for (const event of events) {
    const start = new Date(event.startUtc).getTime();
    if (deriveStatus(event, now) === 'live') {
      items.push({ event, deltaMs: now.getTime() - start, soon: false });
    } else if (isStartingSoon(event, now)) {
      items.push({ event, deltaMs: start - now.getTime(), soon: true });
    }
  }

  if (items.length === 0) return null;

  const live = items.filter((i) => !i.soon);
  const soon = items.filter((i) => i.soon);

  return (
    <section
      aria-labelledby="now-heading"
      // Signature surface: papayowy wash — „co jest teraz" to odpowiedź produktu
      className="mb-6 rounded-lg border border-primary/25 bg-primary/8 p-4"
    >
      <h2 id="now-heading" className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        <Radio className="size-4 text-live" aria-hidden="true" />
        Now
      </h2>
      <ul className="space-y-2">
        {live.map(({ event, deltaMs }) => (
          <li key={event.id} className="flex items-center gap-3 text-sm">
            <span className="flex items-center gap-1.5 rounded-full bg-live/12 px-1.5 py-0.5 text-caption font-semibold uppercase tracking-wide text-live-text">
              <span className="size-1.5 animate-live-pulse rounded-full bg-live" aria-hidden="true" />
              LIVE
            </span>
            <span aria-hidden="true">{sportEmoji(event)}</span>
            <span className="min-w-0 flex-1 truncate font-medium">{participantsLabel(event)}</span>
            <span className="hidden text-xs text-muted-foreground sm:inline">{leagueName(event)}</span>
            <span className="shrink-0 text-xs text-muted-foreground">
              Started {formatDuration(deltaMs)} ago
            </span>
          </li>
        ))}
        {soon.map(({ event, deltaMs }) => (
          <li key={event.id} className="flex items-center gap-3 text-sm">
            {/* SOON = wskaźnik stanu → akcent brandowy (DESIGN.md: akcent = akcje/stany) */}
            <span className="rounded-full bg-primary/12 px-1.5 py-0.5 text-caption font-semibold uppercase tracking-wide text-brand-text">
              SOON
            </span>
            <span aria-hidden="true">{sportEmoji(event)}</span>
            <span className="min-w-0 flex-1 truncate font-medium">{participantsLabel(event)}</span>
            <span className="hidden text-xs text-muted-foreground sm:inline">{leagueName(event)}</span>
            <span className="shrink-0 text-xs text-muted-foreground">
              {formatTimeInZone(new Date(event.startUtc), tz)} · in {formatDuration(deltaMs)}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
