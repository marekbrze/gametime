import { useMemo, useState } from 'react';
import { deriveStatus } from '@/modules/data-source/lib/status';
import { useEvents } from '@/modules/data-source/hooks/use-events';
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
import { MiniFilterBar, type BandFilter, type SportFilter } from './MiniFilterBar';
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
  const [weekOffset, setWeekOffset] = useState(0);
  const [sportFilter, setSportFilter] = useState<SportFilter>('all');
  const [bandFilter, setBandFilter] = useState<BandFilter>('all');
  const [myTeamsOnly, setMyTeamsOnly] = useState(false);

  const tz = settings.timezone === 'system' ? undefined : settings.timezone;

  const todayKey = dayKeyInZone(now, tz);
  const currentMonday = weekStartKey(todayKey);
  const displayMonday = shiftWeekKey(currentMonday, weekOffset);
  const weekKeys = useMemo(() => weekDayKeys(displayMonday), [displayMonday]);
  const weekKeySet = useMemo(() => new Set(weekKeys), [weekKeys]);
  const hasFilters = sportFilter !== 'all' || bandFilter !== 'all' || myTeamsOnly;

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

  const filtered = useMemo(
    () =>
      weekEvents.filter((event) => {
        if (sportFilter !== 'all' && event.sportId !== sportFilter) return false;
        if (bandFilter !== 'all' && bandOfDate(new Date(event.startUtc), settings) !== bandFilter)
          return false;
        if (
          myTeamsOnly &&
          !(event.teamIds ?? []).some((teamId) => favoriteTeamIds.includes(teamId))
        )
          return false;
        return true;
      }),
    [weekEvents, sportFilter, bandFilter, myTeamsOnly, settings, favoriteTeamIds],
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

  /** Sporty mające jakiekolwiek wydarzenia w oknie danych — adnotacja off-season w filtrze. */
  const sportsWithEvents = useMemo(() => new Set(events.map((e) => e.sportId)), [events]);

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
      {storageFailed && <StorageWarning />}

      {status === 'error' ? (
        <LoadError onRetry={refresh} />
      ) : status === 'loading' ? (
        <WeekSkeleton />
      ) : (
        <>
          <NowBlock events={events} now={now} tz={tz} />

          <WeekPager
            mondayKey={displayMonday}
            isCurrentWeek={isCurrentWeek}
            onShift={(weeks) => setWeekOffset((offset) => offset + weeks)}
            onThisWeek={() => setWeekOffset(0)}
          />

          <MiniFilterBar
            sport={sportFilter}
            band={bandFilter}
            myTeamsOnly={myTeamsOnly}
            hasFavorites={favoriteTeamIds.length > 0}
            viewMode={settings.viewMode}
            sportsWithEvents={sportsWithEvents}
            onSportChange={setSportFilter}
            onBandChange={setBandFilter}
            onMyTeamsChange={setMyTeamsOnly}
            onViewModeChange={updateViewMode}
          />

          {totalVisible === 0 ? (
            <EmptyWeek
              hasFilters={hasFilters}
              beyondWindow={beyondWindow}
              dataWindow={dataWindow}
              onClearFilters={() => {
                setSportFilter('all');
                setBandFilter('all');
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
