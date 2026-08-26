import { useState } from 'react';
import { ChevronDown, History } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { SportEvent } from '@/modules/data-source/types';
import { DayGroup } from '@/modules/event-calendar/components/DayGroup';
import type { DayItem } from '@/modules/event-calendar/components/DayGroup';
import type { ViewMode } from '@/modules/settings/types';
import type { TimeZone } from '@/shared/lib/datetime';
import { dayKeyInZone } from '@/shared/lib/datetime';

interface PastSectionProps {
  /** dayKey → itemy przeszłe (już przefiltrowane) */
  pastDays: Map<string, DayItem[]>;
  viewMode: ViewMode;
  tz: TimeZone;
  now: Date;
  onToggleWatch: (eventId: string) => void;
  /** opcjonalne — terminarz drużyny (teams) nie otwiera dialogu szczegółów */
  onOpenDetails?: (event: SportEvent) => void;
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
}: PastSectionProps) {
  const [open, setOpen] = useState(false);
  const total = [...pastDays.values()].reduce((sum, list) => sum + list.length, 0);
  if (total === 0) return null;

  const todayKey = dayKeyInZone(now, tz);
  const dayKeys = [...pastDays.keys()].sort((a, b) => b.localeCompare(a)); // najnowsze najpierw

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
          {dayKeys.map((key) => (
            <DayGroup
              key={key}
              dayKey={key}
              isToday={key === todayKey}
              items={pastDays.get(key) ?? []}
              viewMode={viewMode}
              tz={tz}
              onToggleWatch={onToggleWatch}
              onOpenDetails={onOpenDetails}
            />
          ))}
        </div>
      )}
    </section>
  );
}
