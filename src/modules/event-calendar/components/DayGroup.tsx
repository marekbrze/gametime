import { useState } from 'react';
import { Moon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { EventStatus, SportEvent } from '@/modules/data-source/types';
import type { TimeBandKind } from '@/modules/settings/types';
import type { ViewMode } from '@/modules/settings/types';
import type { TimeZone } from '@/shared/lib/datetime';
import { formatDayLabel } from '@/shared/lib/datetime';
import { BAND_CHIP, BAND_DOT } from '@/modules/settings/lib/bands-ui';
import { EventCard } from './EventCard';
import { EventRow } from './EventRow';

export interface DayItem {
  event: SportEvent;
  status: EventStatus;
  band: TimeBandKind;
  watched: boolean;
  favorite: boolean;
}

interface DayGroupProps {
  dayKey: string;
  isToday: boolean;
  items: DayItem[];
  viewMode: ViewMode;
  tz: TimeZone;
  onToggleWatch: (eventId: string) => void;
}

const SECTION_ORDER: TimeBandKind[] = ['day', 'evening'];

/**
 * Grupa dnia: nagłówek z podsumowaniem pasm → sekcje Day/Evening (mini-nagłówki
 * z kolorem) → noc zwinięta na końcu ("after midnight" — ViewingDay, ADR-0004).
 */
export function DayGroup({ dayKey, isToday, items, viewMode, tz, onToggleWatch }: DayGroupProps) {
  const [nightOpen, setNightOpen] = useState(false);
  const { weekday, date } = formatDayLabel(dayKey);

  const counts: Record<TimeBandKind, number> = {
    day: items.filter((i) => i.band === 'day').length,
    evening: items.filter((i) => i.band === 'evening').length,
    night: items.filter((i) => i.band === 'night').length,
  };
  if (counts.day + counts.evening + counts.night === 0) return null;

  const renderItems = (band: TimeBandKind) =>
    items
      .filter((i) => i.band === band)
      .map((item) =>
        viewMode === 'cards' ? (
          <EventCard
            key={item.event.id}
            event={item.event}
            status={item.status}
            band={item.band}
            tz={tz}
            watched={item.watched}
            onToggleWatch={() => onToggleWatch(item.event.id)}
            favorite={item.favorite}
          />
        ) : (
          <EventRow
            key={item.event.id}
            event={item.event}
            status={item.status}
            band={item.band}
            tz={tz}
            watched={item.watched}
            onToggleWatch={() => onToggleWatch(item.event.id)}
            favorite={item.favorite}
          />
        ),
      );

  return (
    <section aria-labelledby={`day-${dayKey}`} className="mb-8">
      <h3
        id={`day-${dayKey}`}
        className="mb-3 flex flex-wrap items-center gap-x-3 gap-y-1 border-b pb-2"
      >
        <span className="text-base font-semibold">
          {isToday ? (
            <span className="rounded bg-foreground px-2 py-0.5 text-sm text-background">
              Today
            </span>
          ) : (
            weekday
          )}
        </span>
        <span className="text-sm text-muted-foreground">{date}</span>
        <span className="ml-auto flex items-center gap-1.5 text-xs">
          {(['day', 'evening', 'night'] as TimeBandKind[]).map(
            (kind) =>
              counts[kind] > 0 && (
                <span
                  key={kind}
                  className={`rounded-full px-2 py-0.5 ${BAND_CHIP[kind]}`}
                  title={`${counts[kind]} ${kind} events`}
                >
                  {kind === 'night' ? '🌙' : counts[kind]} {kind}
                </span>
              ),
          )}
        </span>
      </h3>

      {SECTION_ORDER.map((band) =>
        counts[band] > 0 ? (
          <div key={band} className="mb-3">
            <p className="mb-1.5 flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              <span className={`size-2 rounded-full ${BAND_DOT[band]}`} aria-hidden="true" />
              {band}
            </p>
            {viewMode === 'cards' ? (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {renderItems(band)}
              </div>
            ) : (
              <ul className="space-y-1.5">{renderItems(band)}</ul>
            )}
          </div>
        ) : null,
      )}

      {counts.night > 0 && (
        <div className="mt-2">
          <Button
            variant="ghost"
            size="sm"
            aria-expanded={nightOpen}
            onClick={() => setNightOpen((v) => !v)}
            className="gap-2 text-muted-foreground"
          >
            <Moon className="size-4" aria-hidden="true" />
            Night — {counts.night} {counts.night === 1 ? 'event' : 'events'} after midnight
          </Button>
          {nightOpen && (
            <div className="mt-1.5">
              {viewMode === 'cards' ? (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {renderItems('night')}
                </div>
              ) : (
                <ul className="space-y-1.5">{renderItems('night')}</ul>
              )}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
