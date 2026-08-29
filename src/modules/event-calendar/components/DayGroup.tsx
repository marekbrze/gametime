import { useState } from 'react';
import { ChevronDown, Moon } from 'lucide-react';
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
  /** otwarcie szczegółów wydarzenia (klik w etykietę) — opcjonalne, używa watchlist */
  onOpenDetails?: (event: SportEvent) => void;
  /** chip LIVE dla trwających — watchlista (kalendarz ma NowBlock, ADR-0018) */
  liveIndicator?: boolean;
}

const SECTION_ORDER: TimeBandKind[] = ['day', 'evening'];

const bandLabel = (band: TimeBandKind) => band[0].toUpperCase() + band.slice(1);

/**
 * Grupa dnia: nagłówek z podsumowaniem pasm → sekcje Day/Evening (mini-nagłówki
 * z kolorem) → noc na końcu jako WIDOCZNY disclosure "after midnight"
 * (ViewingDay, ADR-0004). Noc zwinięta pod pełnoszerokościowym, obwiedzionym
 * przyciskiem w czerwonym tincie pasma (ADR-0032 — zbyt subtelne ukrywanie
 * było nieczytelne); gdy noc jest jedynym pasmem dnia, rozwija się sama —
 * chowanie jedynej treści dnia byłoby pułapką.
 */
export function DayGroup({
  dayKey,
  isToday,
  items,
  viewMode,
  tz,
  onToggleWatch,
  onOpenDetails,
  liveIndicator,
}: DayGroupProps) {
  const [nightOpen, setNightOpen] = useState(false);
  const { weekday, date } = formatDayLabel(dayKey);

  const counts: Record<TimeBandKind, number> = {
    day: items.filter((i) => i.band === 'day').length,
    evening: items.filter((i) => i.band === 'evening').length,
    night: items.filter((i) => i.band === 'night').length,
  };
  if (counts.day + counts.evening + counts.night === 0) return null;

  /** Dzień tylko z nocą → sekcja otwarta jak Day/Evening (nic do zwijania). */
  const nightOnly = counts.day + counts.evening === 0;
  const nightVisible = nightOnly || nightOpen;

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
            onOpenDetails={onOpenDetails}
            liveIndicator={liveIndicator}
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
            onOpenDetails={onOpenDetails}
            liveIndicator={liveIndicator}
          />
        ),
      );

  const renderBandList = (band: TimeBandKind) =>
    viewMode === 'cards' ? (
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">{renderItems(band)}</div>
    ) : (
      <ul className="space-y-1.5">{renderItems(band)}</ul>
    );

  const renderBandSection = (band: TimeBandKind, extraClass = '') => (
    <div key={band} className={`mb-3 ${extraClass}`}>
      <p className="mb-1.5 flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        <span className={`size-2 rounded-full ${BAND_DOT[band]}`} aria-hidden="true" />
        {bandLabel(band)}
      </p>
      {renderBandList(band)}
    </div>
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
                  className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 ${BAND_CHIP[kind]}`}
                  title={`${counts[kind]} ${kind} events`}
                >
                  {kind === 'night' && <Moon className="size-3" aria-hidden="true" />}
                  {counts[kind]} {bandLabel(kind)}
                </span>
              ),
          )}
        </span>
      </h3>

      {SECTION_ORDER.map((band) => counts[band] > 0 && renderBandSection(band))}

      {counts.night > 0 &&
        (nightOnly ? (
          renderBandSection('night')
        ) : (
          <div className="mt-2">
            <button
              type="button"
              aria-expanded={nightOpen}
              aria-controls={`night-${dayKey}`}
              onClick={() => setNightOpen((v) => !v)}
              className="flex w-full items-center gap-2.5 rounded-lg border border-band-night/20 bg-band-night-tint px-3 py-2 text-left transition-colors duration-150 outline-none hover:border-band-night/35 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 motion-reduce:transition-none"
            >
              <Moon className="size-4 shrink-0 text-band-night-text" aria-hidden="true" />
              <span className="text-sm font-medium text-foreground">
                Night — {counts.night} {counts.night === 1 ? 'event' : 'events'} after midnight
              </span>
              <span className="ml-auto flex shrink-0 items-center gap-1.5">
                <span className="rounded-full bg-band-night/12 px-2 py-0.5 text-caption font-semibold text-band-night-text">
                  {nightOpen ? 'Hide' : 'Show'}
                </span>
                <ChevronDown
                  className={`size-4 text-muted-foreground transition-transform duration-150 motion-reduce:transition-none ${
                    nightOpen ? '' : '-rotate-90'
                  }`}
                  aria-hidden="true"
                />
              </span>
            </button>
            {nightVisible && (
              <div id={`night-${dayKey}`} className="mt-1.5">
                {renderBandList('night')}
              </div>
            )}
          </div>
        ))}
    </section>
  );
}
