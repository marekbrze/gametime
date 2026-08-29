import { useCallback, useMemo, useState } from 'react';
import { LayoutGrid, List } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { SportEvent } from '@/modules/data-source/types';
import { deriveStatus } from '@/modules/data-source/lib/status';
import { useEvents } from '@/modules/data-source/hooks/use-events';
import {
  FilterBar,
  hasActiveFilters,
  matchesEventFilters,
  useUrlFilters,
} from '@/modules/filters';
import { useFavoriteTeams } from '@/modules/teams/hooks/use-favorite-teams';
import { useSettings } from '@/modules/settings/hooks/use-settings';
import { bandOfDate } from '@/modules/settings/lib/time-bands';
import { useWatchlist } from '@/modules/watchlist/hooks/use-watchlist';
import {
  dayKeyInZone,
  shiftWeekKey,
  viewingDayKeyInZone,
  weekDayKeys,
  weekStartKey,
} from '@/shared/lib/datetime';
import { useNow } from '../hooks/use-now';
import { DayGroup, type DayItem } from './DayGroup';
import { EmptyWeek } from './EmptyWeek';
import { LoadError } from './LoadError';
import { NowBlock } from './NowBlock';
import { StorageWarning } from './StorageWarning';
import { WeekPager } from './WeekPager';
import { WeekSkeleton } from './WeekSkeleton';

export function EventCalendarScreen() {
  const { events, status, source, generatedAt, window: dataWindow, refresh } = useEvents();
  const { settings, updateViewMode, writeError: settingsError } = useSettings();
  const { isWatched, toggle, writeError: watchlistError } = useWatchlist();
  const { favoriteTeamIds, writeError: favoritesError } = useFavoriteTeams();

  const now = useNow(30_000);
  // Filtry i tydzień żyją w URL (ADR-0014): deep-linki, Back po zmianach widoku,
  // czysty start bez parametrów. MyTeams celowo poza URL (nieprzenośne między userami).
  const { filters, weekOffset, setFilters, shiftWeek, setWeekOffset, clearFilters } = useUrlFilters();
  const [myTeamsOnly, setMyTeamsOnly] = useState(false);

  const tz = settings.timezone === 'system' ? undefined : settings.timezone;

  const todayKey = dayKeyInZone(now, tz);
  const currentMonday = weekStartKey(todayKey);
  const displayMonday = shiftWeekKey(currentMonday, weekOffset);
  const weekKeys = useMemo(() => weekDayKeys(displayMonday), [displayMonday]);
  const weekKeySet = useMemo(() => new Set(weekKeys), [weekKeys]);
  const hasFilters = hasActiveFilters(filters) || myTeamsOnly;

  /** Wyświetlany tydzień poza oknem danych? (klucze dni są 'YYYY-MM-DD', porównywalne leksykograficznie) */
  const beyondWindow =
    dataWindow !== null &&
    (weekKeys[6] < dataWindow.from.slice(0, 10) || weekKeys[0] > dataWindow.to.slice(0, 10));

  /** Wydarzenia widoczne w wyświetlanym tygodniu. Przełożone (postponed) zostają
   * na liście przygaszone — user, który planował oglądać, widzi, że mecz odpada
   * (decyzja harden, ADR-0011). Anulowane znikają (domykanie z feedu — ENTITY_MAP). */
  const weekEvents = useMemo(
    () =>
      events.filter((event) => {
        if (event.statusOverride === 'canceled') return false;
        const start = new Date(event.startUtc);
        const isNight = bandOfDate(start, settings) === 'night';
        const viewingKey = viewingDayKeyInZone(start, tz, isNight);
        return weekKeySet.has(viewingKey);
      }),
    [events, settings, tz, weekKeySet],
  );

  /** Predykat wspólny dla całego ekranu (decyzja harden, ADR-0016): filtry
   * obowiązują też blok Now — pasek jest soczewką na wszystko, co widać. */
  const passesScreenFilters = useCallback(
    (event: SportEvent) =>
      event.statusOverride !== 'canceled' &&
      matchesEventFilters(event, filters, settings) &&
      (!myTeamsOnly || (event.teamIds ?? []).some((teamId) => favoriteTeamIds.includes(teamId))),
    [filters, myTeamsOnly, settings, favoriteTeamIds],
  );

  const filtered = useMemo(
    () => weekEvents.filter(passesScreenFilters),
    [weekEvents, passesScreenFilters],
  );

  /** Blok Now czyta ten sam predykat co lista tygodnia — live/soon w obrębie
   * przefiltrowanego zbioru (pusty zbiór = blok znika, ADR-0016). */
  const nowEvents = useMemo(
    () => events.filter(passesScreenFilters),
    [events, passesScreenFilters],
  );

  /** dayKey → posortowane itemy (DayItem z pasmem i statusem). */
  const dayGroups = useMemo(() => {
    const groups = new Map<string, DayItem[]>();
    for (const event of filtered) {
      const start = new Date(event.startUtc);
      const band = bandOfDate(start, settings);
      const viewingKey = viewingDayKeyInZone(start, tz, band === 'night');
      const item: DayItem = {
        event,
        status: deriveStatus(event, now),
        band,
        watched: isWatched(event.id),
        favorite: (event.teamIds ?? []).some((teamId) => favoriteTeamIds.includes(teamId)),
      };
      const list = groups.get(viewingKey) ?? [];
      list.push(item);
      groups.set(viewingKey, list);
    }
    for (const list of groups.values()) {
      list.sort((a, b) => a.event.startUtc.localeCompare(b.event.startUtc));
    }
    return groups;
  }, [filtered, settings, tz, now, isWatched, favoriteTeamIds]);

  /** Sporty i ligi mające jakiekolwiek wydarzenia w oknie danych — adnotacje off-season. */
  const sportsWithEvents = useMemo(() => new Set(events.map((e) => e.sportId)), [events]);
  const leaguesWithEvents = useMemo(() => new Set(events.map((e) => e.leagueId)), [events]);

  const isCurrentWeek = weekOffset === 0;
  const totalVisible = weekKeys.reduce((sum, key) => sum + (dayGroups.get(key)?.length ?? 0), 0);

  const storageFailed = Boolean(watchlistError ?? favoritesError ?? settingsError);
  const dataAsOf =
    source === 'json' && generatedAt
      ? new Intl.DateTimeFormat(undefined, {
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          ...(tz ? { timeZone: tz } : {}),
        }).format(new Date(generatedAt))
      : null;

  return (
    <div>
      {/* h1 per ekran (a11y: kolejność nagłówków zaczyna się od h1); „Calendar"
          jak label nawigacji — header appki jest linkiem-brandem, nie nagłówkiem */}
      <h1 className="sr-only">Calendar</h1>
      {storageFailed && <StorageWarning />}

      {status === 'error' ? (
        <LoadError onRetry={refresh} />
      ) : status === 'loading' ? (
        <WeekSkeleton />
      ) : (
        <>
          <NowBlock events={nowEvents} now={now} tz={tz} />

          <WeekPager
            mondayKey={displayMonday}
            isCurrentWeek={isCurrentWeek}
            onShift={shiftWeek}
            onThisWeek={() => setWeekOffset(0)}
          />

          <FilterBar
            filters={filters}
            onFiltersChange={setFilters}
            myTeamsOnly={myTeamsOnly}
            onMyTeamsChange={setMyTeamsOnly}
            hasFavorites={favoriteTeamIds.length > 0}
            sportsWithEvents={sportsWithEvents}
            leaguesWithEvents={leaguesWithEvents}
          >
            {/* View-mode to własność tego ekranu (ADR-0006), nie modułu filters */}
            <div role="group" aria-label="View mode" className="flex items-center gap-1">
              <Button
                variant={settings.viewMode === 'list' ? 'default' : 'ghost'}
                size="icon"
                aria-label="List view"
                aria-pressed={settings.viewMode === 'list'}
                onClick={() => updateViewMode('list')}
              >
                <List className="size-4" aria-hidden="true" />
              </Button>
              <Button
                variant={settings.viewMode === 'cards' ? 'default' : 'ghost'}
                size="icon"
                aria-label="Cards view"
                aria-pressed={settings.viewMode === 'cards'}
                onClick={() => updateViewMode('cards')}
              >
                <LayoutGrid className="size-4" aria-hidden="true" />
              </Button>
            </div>
          </FilterBar>

          {/* SR: zawężenie listy ogłaszane live — bez tego filtr to cisza dla czytników (ADR-0016) */}
          <p className="sr-only" aria-live="polite">
            {totalVisible} events shown this week
          </p>

          {totalVisible === 0 ? (
            <EmptyWeek
              hasFilters={hasFilters}
              beyondWindow={beyondWindow}
              dataWindow={dataWindow}
              onClearFilters={() => {
                clearFilters();
                setMyTeamsOnly(false);
              }}
              onThisWeek={() => setWeekOffset(0)}
            />
          ) : (
            weekKeys.map((key) => (
              <DayGroup
                key={key}
                dayKey={key}
                isToday={key === todayKey}
                isPast={key < todayKey}
                items={dayGroups.get(key) ?? []}
                viewMode={settings.viewMode}
                tz={tz}
                onToggleWatch={toggle}
              />
            ))
          )}

          {dataAsOf && (
            <p className="mt-2 text-center text-xs text-muted-foreground">
              Data as of {dataAsOf}
            </p>
          )}
        </>
      )}
    </div>
  );
}
