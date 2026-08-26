import { useCallback, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Download, LayoutGrid, List } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { SportEvent } from '@/modules/data-source/types';
import { useEvents } from '@/modules/data-source/hooks/use-events';
import { downloadIcsBundle } from '@/modules/calendar-export/lib/export';
import { FilterBar, matchesEventFilters, useUrlFilters } from '@/modules/filters';
import { useFavoriteTeams } from '@/modules/teams/hooks/use-favorite-teams';
import { useSettings } from '@/modules/settings/hooks/use-settings';
import { DayGroup } from '@/modules/event-calendar/components/DayGroup';
import { LoadError } from '@/modules/event-calendar/components/LoadError';
import { StorageWarning } from '@/modules/event-calendar/components/StorageWarning';
import { useNow } from '@/modules/event-calendar/hooks/use-now';
import { dayKeyInZone } from '@/shared/lib/datetime';
import { useWatchlist } from '../hooks/use-watchlist';
import { buildWatchlistGroups } from '../lib/watchlist-groups';
import { EmptyWatchlist } from './EmptyWatchlist';
import { EventDetailsDialog } from './EventDetailsDialog';
import { PastSection } from './PastSection';
import { WatchlistSkeleton } from './WatchlistSkeleton';
import { WatchlistToast, type WatchlistToastState } from './WatchlistToast';

/**
 * Ekran watchlisty (MODULES.md): nadchodzące grupowane po dniach (decyzja
 * designera — identycznie jak kalendarz) + zwinięta sekcja przeszłych na dole.
 * Filtruje się wspólnym FilterBar (zasada pasm); eksport ICS packuje ZAWSZE
 * wszystkie nadchodzące, ignorując filtry (decyzja designera).
 *
 * Harden (ADR-0018): canceled zostaje widoczny przygaszony (lista usera nie
 * traci wpisów po cichu), postponed ma migrację gwiazdki na nową instancję
 * w dialogu, LIVE ma chip w wierszu, odgwiazdkowanie ma undo (5s), sieroty
 * poza oknem danych są widoczne z opcją sprzątania.
 */
export function WatchlistScreen() {
  const { events, status, source, generatedAt, refresh } = useEvents();
  const { settings, updateViewMode, writeError: settingsError } = useSettings();
  const { entries, add, remove, keepOnly, writeError: watchlistError } = useWatchlist();
  const { favoriteTeamIds, writeError: favoritesError } = useFavoriteTeams();

  const now = useNow(30_000);
  // Filtry w URL jak na kalendarzu (ADR-0014); `week: false` — watchlista nie
  // stronicuje tygodni, parametr `w` z obcych linków jest stripowany (#11).
  const { filters, setFilters, clearFilters } = useUrlFilters({ week: false });
  const [myTeamsOnly, setMyTeamsOnly] = useState(false);
  const [detailsEvent, setDetailsEvent] = useState<SportEvent | null>(null);
  const [toast, setToast] = useState<WatchlistToastState | null>(null);
  const showToast = useCallback((message: string, onAction?: () => void, actionLabel?: string) => {
    setToast({ id: Date.now(), message, onAction, actionLabel });
  }, []);

  const tz = settings.timezone === 'system' ? undefined : settings.timezone;
  const todayKey = dayKeyInZone(now, tz);

  /** Obserwowane obecne w danych (join po id). Anulowane ZOSTAJĄ — przygaszone
   * (decyzja designera, ADR-0018); wpisy bez wydarzenia w oknie = sieroty (#4). */
  const watchedEvents = useMemo(() => {
    const ids = new Set(entries.map((e) => e.eventId));
    return events.filter((event) => ids.has(event.id));
  }, [events, entries]);

  /** Sieroty: wpisy, których wydarzenia nie ma w oknie danych. */
  const orphanedEntries = useMemo(() => {
    const present = new Set(watchedEvents.map((e) => e.id));
    return entries.filter((e) => !present.has(e.eventId));
  }, [entries, watchedEvents]);

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

  /** Eksport: wszystkie nadchodzące, chronologicznie, poza filtrami; bez
   * przełożonych i anulowanych — w tym terminie się nie odbędą (#9, ADR-0018). */
  const exportEvents = useMemo(() => {
    const keys = [...allGroups.upcoming.keys()].sort((a, b) => a.localeCompare(b));
    return keys
      .flatMap((key) => (allGroups.upcoming.get(key) ?? []).map((item) => item.event))
      .filter((event) => !event.statusOverride);
  }, [allGroups]);

  const upcomingDayKeys = useMemo(
    () => [...groups.upcoming.keys()].sort((a, b) => a.localeCompare(b)),
    [groups],
  );

  /** Sporty/ligi mające wydarzenia w danych — adnotacje off-season w FilterBar. */
  const sportsWithEvents = useMemo(() => new Set(events.map((e) => e.sportId)), [events]);
  const leaguesWithEvents = useMemo(() => new Set(events.map((e) => e.leagueId)), [events]);

  /** Gwiazdka z wiersza: odgwiazdkowanie dostaje undo 5s (#6 — na przeszłych
   * poza oknem danych nie da się przywrócić wpisu ręcznie). */
  const handleToggleWatch = useCallback(
    (eventId: string) => {
      const entry = entries.find((e) => e.eventId === eventId);
      if (entry) {
        remove(eventId);
        showToast('Removed from watchlist', () => add(entry.eventId, entry.addedAt));
      } else {
        add(eventId);
      }
    },
    [entries, remove, add, showToast],
  );

  /** Migracja gwiazdki na nową instancję przełożonego (#2, decyzja designera). */
  const handleMigrate = useCallback(
    (from: SportEvent, to: SportEvent) => {
      const entry = entries.find((e) => e.eventId === from.id);
      remove(from.id);
      add(to.id, entry?.addedAt);
      showToast('Watch moved to the new date');
    },
    [entries, remove, add, showToast],
  );

  /** Sprzątanie sierot — z undo, wpis wraca verbatim (#4). */
  const handleClearOrphans = useCallback(() => {
    const removed = orphanedEntries;
    if (removed.length === 0) return;
    keepOnly(watchedEvents.map((e) => e.id));
    showToast(`Removed ${removed.length} stale ${removed.length === 1 ? 'entry' : 'entries'}`, () => {
      for (const entry of removed) add(entry.eventId, entry.addedAt);
    });
  }, [orphanedEntries, keepOnly, watchedEvents, add, showToast]);

  const handleExport = useCallback(() => {
    downloadIcsBundle(exportEvents, 'gametime-watchlist');
    showToast(`Downloaded ${exportEvents.length} ${exportEvents.length === 1 ? 'event' : 'events'}`);
  }, [exportEvents, showToast]);

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
        <WatchlistSkeleton />
      ) : (
        <>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <h1 className="text-xl font-semibold tracking-tight">Watchlist</h1>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              disabled={exportEvents.length === 0}
              onClick={handleExport}
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
                /* Wszystkie wpisy to sieroty poza oknem danych (#5) — CTA + sprzątanie */
                <div className="rounded-lg border border-dashed p-10 text-center">
                  <p className="font-medium">No watched events in the loaded date range</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    We load schedules about two weeks ahead and one week back.
                  </p>
                  <div className="mt-4 flex items-center justify-center gap-2">
                    <Link
                      to="/event-calendar"
                      className="inline-flex h-9 items-center rounded-md border bg-background px-4 text-sm font-medium transition-colors hover:bg-muted focus-visible:underline"
                    >
                      Browse this week
                    </Link>
                    {orphanedEntries.length > 0 && (
                      <Button variant="outline" size="sm" onClick={handleClearOrphans}>
                        Clear {orphanedEntries.length} stale{' '}
                        {orphanedEntries.length === 1 ? 'entry' : 'entries'}
                      </Button>
                    )}
                  </div>
                </div>
              ) : upcomingCount + ([...groups.past.values()].flat().length) === 0 ? (
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
                        onToggleWatch={handleToggleWatch}
                        onOpenDetails={setDetailsEvent}
                        liveIndicator
                      />
                    ))}
                  </section>

                  <PastSection
                    pastDays={groups.past}
                    viewMode={settings.viewMode}
                    tz={tz}
                    now={now}
                    onToggleWatch={handleToggleWatch}
                    onOpenDetails={setDetailsEvent}
                  />
                </>
              )}

              {/* Sieroty przy widocznej liście — nota + sprzątanie (#4) */}
              {watchedEvents.length > 0 && orphanedEntries.length > 0 && (
                <p className="mt-6 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <span>
                    {orphanedEntries.length} starred{' '}
                    {orphanedEntries.length === 1 ? 'event is' : 'events are'} outside the loaded
                    date range.
                  </span>
                  <Button variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={handleClearOrphans}>
                    Clear
                  </Button>
                </p>
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
        allEvents={events}
        onMigrate={handleMigrate}
        settings={settings}
        tz={tz}
        onClose={() => setDetailsEvent(null)}
      />

      {toast && <WatchlistToast toast={toast} onDismiss={() => setToast(null)} />}
    </div>
  );
}
