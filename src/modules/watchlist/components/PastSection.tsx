import { useState } from 'react';
import { ChevronDown, History } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { SportEvent } from '@/modules/data-source/types';
import { DayGroup } from '@/modules/event-calendar/components/DayGroup';
import type { DayItem } from '@/modules/event-calendar/components/DayGroup';
import { EventCard } from '@/modules/event-calendar/components/EventCard';
import { EventRow } from '@/modules/event-calendar/components/EventRow';
import type { ViewMode } from '@/modules/settings/types';
import type { TimeZone } from '@/shared/lib/datetime';
import { dayKeyInZone, formatMonthLabel, formatShortDateParts } from '@/shared/lib/datetime';

interface PastSectionProps {
  /** dayKey → itemy przeszłe (już przefiltrowane) */
  pastDays: Map<string, DayItem[]>;
  viewMode: ViewMode;
  tz: TimeZone;
  now: Date;
  onToggleWatch: (eventId: string) => void;
  /** opcjonalne — terminarz drużyny (teams) nie otwiera dialogu szczegółów */
  onOpenDetails?: (event: SportEvent) => void;
  /** separatory miesięcy między grupami dni — terminarz sezonu (harden #7, ADR-0024) */
  monthSeparators?: boolean;
  /** wariant płaski (ADR-0032): terminarz drużyny bez grup dni — sama chronologia
   * z kolumną daty w wierszu; separatory miesięcy nie mają wtedy zastosowania */
  flat?: boolean;
}

/**
 * Sekcja przeszłych na dole (MODULES.md): zwinięta domyślnie, z licznikiem;
 * rozwinięcie pokazuje historię — dni od najnowszych. Nic nie ginie, nic
 * nie trzeba sprzątać ręcznie (ENTITY_MAP: upcoming → past automatycznie).
 */
export function PastSection({
  pastDays,
  viewMode,
  tz,
  now,
  onToggleWatch,
  onOpenDetails,
  monthSeparators,
  flat,
}: PastSectionProps) {
  const [open, setOpen] = useState(false);
  const total = [...pastDays.values()].reduce((sum, list) => sum + list.length, 0);
  if (total === 0) return null;

  const todayKey = dayKeyInZone(now, tz);
  const dayKeys = [...pastDays.keys()].sort((a, b) => b.localeCompare(a)); // najnowsze najpierw

  /** Wariant płaski: wszystkie itemy chronologicznie od najnowszego, z datą w wierszu. */
  const flatItems = flat
    ? [...pastDays.values()]
        .flat()
        .sort((a, b) => b.event.startUtc.localeCompare(a.event.startUtc))
    : [];

  const renderFlatItems = () =>
    viewMode === 'cards' ? (
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {flatItems.map((item) => (
          <EventCard
            key={item.event.id}
            event={item.event}
            status={item.status}
            band={item.band}
            tz={tz}
            watched={item.watched}
            onToggleWatch={() => onToggleWatch(item.event.id)}
            onOpenDetails={onOpenDetails}
            favorite={item.favorite}
            dateLabel={formatShortDateParts(new Date(item.event.startUtc), tz)}
          />
        ))}
      </div>
    ) : (
      <ul className="space-y-1.5">
        {flatItems.map((item) => (
          <EventRow
            key={item.event.id}
            event={item.event}
            status={item.status}
            band={item.band}
            tz={tz}
            watched={item.watched}
            onToggleWatch={() => onToggleWatch(item.event.id)}
            onOpenDetails={onOpenDetails}
            favorite={item.favorite}
            dateLabel={formatShortDateParts(new Date(item.event.startUtc), tz)}
            bandTint
          />
        ))}
      </ul>
    );

  return (
    <section aria-labelledby="watchlist-past" className="mt-10 border-t pt-4">
      <Button
        id="watchlist-past"
        variant="ghost"
        size="sm"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="gap-2 text-muted-foreground"
      >
        {open ? <ChevronDown className="size-4" aria-hidden="true" /> : <ChevronDown className="size-4 -rotate-90" aria-hidden="true" />}
        <History className="size-4" aria-hidden="true" />
        Past — {total} {total === 1 ? 'event' : 'events'}
      </Button>
      {open && (
        <div className="mt-2">
          {flat ? (
            renderFlatItems()
          ) : (
            <>
              {dayKeys.map((key, i) => {
                const prev = dayKeys[i - 1];
                const monthChanged = !prev || prev.slice(0, 7) !== key.slice(0, 7);
                return (
                  <div key={key}>
                    {monthSeparators && monthChanged && (
                      <p className="mb-3 mt-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                        {formatMonthLabel(key)}
                      </p>
                    )}
                    <DayGroup
                      dayKey={key}
                      isToday={key === todayKey}
                      items={pastDays.get(key) ?? []}
                      viewMode={viewMode}
                      tz={tz}
                      onToggleWatch={onToggleWatch}
                      onOpenDetails={onOpenDetails}
                    />
                  </div>
                );
              })}
            </>
          )}
        </div>
      )}
    </section>
  );
}
