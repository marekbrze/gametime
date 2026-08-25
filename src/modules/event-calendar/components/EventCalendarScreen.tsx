import { useMemo, useState } from 'react';
import { CalendarX2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
import { MiniFilterBar, type BandFilter, type SportFilter } from './MiniFilterBar';
import { NowBlock } from './NowBlock';
import { WeekPager } from './WeekPager';

export function EventCalendarScreen() {
  const { events, status } = useEvents();
  const { settings, updateViewMode } = useSettings();
  const { isWatched, toggle } = useWatchlist();
  const { favoriteTeamIds } = useFavoriteTeams();

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

  /** Wydarzenia widoczne w wyświetlanym tygodniu (postponed/canceled znikają z feedu). */
  const weekEvents = useMemo(
    () =>
      events.filter((event) => {
        if (event.statusOverride) return false;
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

  const isCurrentWeek = weekOffset === 0;
  const totalVisible = weekKeys.reduce((sum, key) => sum + (dayGroups.get(key)?.length ?? 0), 0);

  return (
    <div>
      {/* Provisional states — pełne obsłużenie (skeleton, retry) na proto-harden */}
      {status === 'error' && (
        <p role="alert" className="mb-4 rounded-lg border border-destructive/50 p-3 text-sm text-destructive">
          Failed to load the schedule — check your connection and reload the page.
        </p>
      )}

      {status === 'loading' ? null : (
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
            onSportChange={setSportFilter}
            onBandChange={setBandFilter}
            onMyTeamsChange={setMyTeamsOnly}
            onViewModeChange={updateViewMode}
          />

          {totalVisible === 0 ? (
            <EmptyWeek hasFilters={hasFilters}
              onClearFilters={() => {
                setSportFilter('all');
                setBandFilter('all');
                setMyTeamsOnly(false);
              }}
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
        </>
      )}
    </div>
  );
}

function EmptyWeek({ hasFilters, onClearFilters }: { hasFilters: boolean; onClearFilters: () => void }) {
  return (
    <div className="rounded-lg border border-dashed p-10 text-center">
      <CalendarX2 className="mx-auto mb-3 size-8 text-muted-foreground" aria-hidden="true" />
      <p className="font-medium">
        {hasFilters ? 'No events match your filters this week' : 'No events this week'}
      </p>
      <p className="mt-1 text-sm text-muted-foreground">
        {hasFilters
          ? 'Try widening the time band or picking another sport.'
          : 'It may be off-season — check next week with the pager above.'}
      </p>
      {hasFilters && (
        <Button variant="outline" size="sm" className="mt-4" onClick={onClearFilters}>
          Clear filters
        </Button>
      )}
    </div>
  );
}
