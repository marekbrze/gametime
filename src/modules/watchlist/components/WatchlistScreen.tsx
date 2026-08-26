import { useMemo, useState } from 'react';
import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { SportEvent } from '@/modules/data-source/types';
import { useEvents } from '@/modules/data-source/hooks/use-events';
import { downloadIcsBundle } from '@/modules/calendar-export/lib/export';
import {
  FilterBar,
  matchesEventFilters,
  useUrlFilters,
} from '@/modules/filters';
import { useFavoriteTeams } from '@/modules/teams/hooks/use-favorite-teams';
import { useSettings } from '@/modules/settings/hooks/use-settings';
import { LayoutGrid, List } from 'lucide-react';
import { DayGroup } from '@/modules/event-calendar/components/DayGroup';
import { LoadError } from '@/modules/event-calendar/components/LoadError';
import { StorageWarning } from '@/modules/event-calendar/components/StorageWarning';
import { WeekSkeleton } from '@/modules/event-calendar/components/WeekSkeleton';
import { useNow } from '@/modules/event-calendar/hooks/use-now';
import { dayKeyInZone } from '@/shared/lib/datetime';
import { useWatchlist } from '../hooks/use-watchlist';
import { buildWatchlistGroups } from '../lib/watchlist-groups';
import { EmptyWatchlist } from './EmptyWatchlist';
import { EventDetailsDialog } from './EventDetailsDialog';
import { PastSection } from './PastSection';

/**
 * Ekran watchlisty (MODULES.md): nadchodzące grupowane po dniach (decyzja
 * designera — identycznie jak kalendarz) + zwinięta sekcja przeszłych na dole.
 * Filtruje się wspólnym FilterBar (zasada pasm); eksport ICS packuje ZAWSZE
 * wszystkie nadchodzące, ignorując filtry (decyzja designera — filtry są
 * soczewką przeglądania, nie zawartością eksportu).
 */
export function WatchlistScreen() {
  const { events, status, source, generatedAt, refresh } = useEvents();
  const { settings, updateViewMode, writeError: settingsError } = useSettings();
  const { entries, toggle, writeError: watchlistError } = useWatchlist();
  const { favoriteTeamIds, writeError: favoritesError } = useFavoriteTeams();

  const now = useNow(30_000);
  // Filtry w URL jak na kalendarzu (ADR-0014) — parametr tygodnia `w` jest
  // tutaj bez znaczenia (watchlista nie stronicuje), świadomie nieużywany.
  const { filters, setFilters, clearFilters } = useUrlFilters();
  const [myTeamsOnly, setMyTeamsOnly] = useState(false);
  const [detailsEvent, setDetailsEvent] = useState<SportEvent | null>(null);

  const tz = settings.timezone === 'system' ? undefined : settings.timezone;
  const todayKey = dayKeyInZone(now, tz);

  /** Obserwowane obecne w danych: anulowane ukryte (domykanie z feedu —
   * parzystość z ADR-0011). Wpisy bez wydarzenia w oknie danych pomijamy. */
  const watchedEvents = useMemo(() => {
    const ids = new Set(entries.map((e) => e.eventId));
    return events.filter((event) => ids.has(event.id) && event.statusOverride !== 'canceled');
  }, [events, entries]);

  const filteredWatched = useMemo(
    () =>
      watchedEvents.filter(
        (event) =>
          matchesEventFilters(event, filters, settings) &&
          (!myTeamsOnly || (event.teamIds ?? []).some((teamId) => favoriteTeamIds.includes(teamId))),
      ),
    [watchedEvents, filters, settings, myTeamsOnly, favoriteTeamIds],
  );

  /** Wyświetlane grupy (po filtrach) i pełny podział (do eksportu bez filtrów). */
  const groups = useMemo(
    () => buildWatchlistGroups(filteredWatched, now, settings, tz, favoriteTeamIds),
    [filteredWatched, now, settings, tz, favoriteTeamIds],
  );
  const allGroups = useMemo(
    () => buildWatchlistGroups(watchedEvents, now, settings, tz, favoriteTeamIds),
    [watchedEvents, now, settings, tz, favoriteTeamIds],
  );

  const upcomingCount = useMemo(
    () => [...groups.upcoming.values()].reduce((sum, list) => sum + list.length, 0),
    [groups],
  );
  const pastCount = useMemo(
    () => [...groups.past.values()].reduce((sum, list) => sum + list.length, 0),
    [groups],
  );

  /** Eksport: wszystkie nadchodzące, chronologicznie, poza filtrami. */
  const exportEvents = useMemo(() => {
    const keys = [...allGroups.upcoming.keys()].sort((a, b) => a.localeCompare(b));
    return keys.flatMap((key) => (allGroups.upcoming.get(key) ?? []).map((item) => item.event));
  }, [allGroups]);

  const upcomingDayKeys = useMemo(
    () => [...groups.upcoming.keys()].sort((a, b) => a.localeCompare(b)),
    [groups],
  );

  /** Sporty/ligi mające wydarzenia w danych — adnotacje off-season w FilterBar. */
  const sportsWithEvents = useMemo(() => new Set(events.map((e) => e.sportId)), [events]);
  const leaguesWithEvents = useMemo(() => new Set(events.map((e) => e.leagueId)), [events]);

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
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <h1 className="text-xl font-semibold tracking-tight">Watchlist</h1>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              disabled={exportEvents.length === 0}
              onClick={() => downloadIcsBundle(exportEvents, 'gametime-watchlist')}
            >
              <Download className="size-4" aria-hidden="true" />
              Export upcoming ({exportEvents.length})
            </Button>
          </div>

          {entries.length === 0 ? (
            <EmptyWatchlist />
          ) : (
            <>
              <FilterBar
                filters={filters}
                onFiltersChange={setFilters}
                myTeamsOnly={myTeamsOnly}
                onMyTeamsChange={setMyTeamsOnly}
                hasFavorites={favoriteTeamIds.length > 0}
                sportsWithEvents={sportsWithEvents}
                leaguesWithEvents={leaguesWithEvents}
              >
                {/* View-mode to własność ekranu-listy (ADR-0006), nie modułu filters */}
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

              {/* SR: zawężenie listy ogłaszane live (parzystość z ADR-0016) */}
              <p className="sr-only" aria-live="polite">
                {upcomingCount} upcoming events shown
              </p>

              {watchedEvents.length === 0 ? (
                /* Wpisy są, ale żadne wydarzenie nie żyje w oknie danych */
                <div className="rounded-lg border border-dashed p-10 text-center">
                  <p className="font-medium">No watched events in the loaded date range</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    We load schedules about two weeks ahead and one week back.
                  </p>
                </div>
              ) : upcomingCount + pastCount === 0 ? (
                <div className="rounded-lg border border-dashed p-10 text-center">
                  <p className="font-medium">No watched events match your filters</p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-4"
                    onClick={() => {
                      clearFilters();
                      setMyTeamsOnly(false);
                    }}
                  >
                    Clear filters
                  </Button>
                </div>
              ) : (
                <>
                  {upcomingCount === 0 && (
                    <p className="mb-4 rounded-md bg-muted/50 px-3 py-2 text-sm text-muted-foreground">
                      No upcoming watched events — everything has already finished.
                    </p>
                  )}
                  <section aria-labelledby="watchlist-upcoming">
                    <h2
                      id="watchlist-upcoming"
                      className="mb-3 text-sm font-medium uppercase tracking-wide text-muted-foreground"
                    >
                      Upcoming ({upcomingCount})
                    </h2>
                    {upcomingDayKeys.map((key) => (
                      <DayGroup
                        key={key}
                        dayKey={key}
                        isToday={key === todayKey}
                        items={groups.upcoming.get(key) ?? []}
                        viewMode={settings.viewMode}
                        tz={tz}
                        onToggleWatch={toggle}
                        onOpenDetails={setDetailsEvent}
                      />
                    ))}
                  </section>

                  <PastSection
                    pastDays={groups.past}
                    viewMode={settings.viewMode}
                    tz={tz}
                    now={now}
                    onToggleWatch={toggle}
                    onOpenDetails={setDetailsEvent}
                  />
                </>
              )}
            </>
          )}

          {dataAsOf && (
            <p className="mt-2 text-center text-xs text-muted-foreground">
              Data as of {dataAsOf}
            </p>
          )}
        </>
      )}

      <EventDetailsDialog
        event={detailsEvent}
        settings={settings}
        tz={tz}
        onClose={() => setDetailsEvent(null)}
      />
    </div>
  );
}
