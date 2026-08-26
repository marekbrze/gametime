import { useCallback, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { LayoutGrid, List, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LEAGUE_BY_ID, SPORT_BY_ID, TEAM_BY_ID } from '@/modules/data-source/data/catalog';
import { useEvents } from '@/modules/data-source/hooks/use-events';
import { FilterBar, matchesEventFilters, useUrlFilters } from '@/modules/filters';
import { DayGroup } from '@/modules/event-calendar/components/DayGroup';
import { LoadError } from '@/modules/event-calendar/components/LoadError';
import { StorageWarning } from '@/modules/event-calendar/components/StorageWarning';
import { PastSection } from '@/modules/watchlist/components/PastSection';
import { WatchlistToast, type WatchlistToastState } from '@/modules/watchlist/components/WatchlistToast';
import { useNow } from '@/modules/event-calendar/hooks/use-now';
import { useWatchlist } from '@/modules/watchlist/hooks/use-watchlist';
import { useSettings } from '@/modules/settings/hooks/use-settings';
import { dayKeyInZone, formatMonthLabel } from '@/shared/lib/datetime';
import { useFavoriteTeams } from '../hooks/use-favorite-teams';
import { buildScheduleGroups } from '../lib/schedule-groups';
import { TeamsSkeleton } from './TeamsSkeleton';

/**
 * Terminarz drużyny (MODULES.md): pełny sezon z okna pipeline (ADR-0019) w
 * strefie usera. Prezentacja jak watchlista (ADR-0022): nadchodzące po dniach
 * widokowych z separatorami miesięcy + zwinięte Past na dole (separatory też,
 * harden #7). Filtr: wspólny FilterBar w wariancie bands-only — sport/liga
 * przy jednej drużynie nie niosą informacji, a ich obce parametry URL są
 * stripowane przy kanonizacji (harden #3, ADR-0024).
 * Harden: od-ulubienie z undo 5s; pad zapisu (favorites/watchlist) → StorageWarning.
 */
export function TeamScheduleScreen() {
  const { teamId } = useParams<{ teamId: string }>();
  const { events, status, source, generatedAt, window: dataWindow, refresh } = useEvents();
  const { settings, updateViewMode, writeError: settingsError } = useSettings();
  const { entries, add, remove, writeError: watchlistError } = useWatchlist();
  const {
    favorites: favoriteEntries,
    favoriteTeamIds,
    isFavorite,
    add: addFavorite,
    remove: removeFavorite,
    writeError: favoritesError,
  } = useFavoriteTeams();

  const now = useNow(30_000);
  const { filters, setFilters, clearFilters } = useUrlFilters({ week: false, dimensions: 'bands' });
  const [toast, setToast] = useState<WatchlistToastState | null>(null);

  const tz = settings.timezone === 'system' ? undefined : settings.timezone;
  const todayKey = dayKeyInZone(now, tz);
  const team = teamId ? TEAM_BY_ID.get(teamId) : undefined;
  const league = team ? LEAGUE_BY_ID.get(team.leagueId) : undefined;
  const sport = league ? SPORT_BY_ID.get(league.sportId) : undefined;

  const teamEvents = useMemo(
    () => (team ? events.filter((e) => (e.teamIds ?? []).includes(team.id)) : []),
    // TEAM_BY_ID (katalog live) rozszerzany po fetchu snapshota — status wymusza przeliczenie
    [events, team, status],
  );

  const filteredEvents = useMemo(
    () => teamEvents.filter((event) => matchesEventFilters(event, filters, settings)),
    [teamEvents, filters, settings],
  );

  const groups = useMemo(() => {
    const watchedIds = new Set(entries.map((e) => e.eventId));
    return buildScheduleGroups(filteredEvents, now, settings, tz, watchedIds, favoriteTeamIds);
  }, [filteredEvents, now, settings, tz, entries, favoriteTeamIds]);

  const upcomingCount = useMemo(
    () => [...groups.upcoming.values()].reduce((sum, list) => sum + list.length, 0),
    [groups],
  );
  const pastCount = useMemo(
    () => [...groups.past.values()].reduce((sum, list) => sum + list.length, 0),
    [groups],
  );

  const upcomingDayKeys = useMemo(
    () => [...groups.upcoming.keys()].sort((a, b) => a.localeCompare(b)),
    [groups],
  );

  const handleToggleWatch = (eventId: string) => {
    if (entries.some((e) => e.eventId === eventId)) remove(eventId);
    else add(eventId);
  };

  /** Od-ulubienie z nagłówka z undo 5s — wpis wraca verbatim (ADR-0024). */
  const handleToggleFavorite = useCallback(() => {
    if (!team) return;
    const entry = favoriteEntries.find((f) => f.teamId === team.id);
    if (entry) {
      removeFavorite(team.id);
      setToast({
        id: Date.now(),
        message: `Removed ${team.name} from favorites`,
        onAction: () => addFavorite(team.id, entry.addedAt),
      });
    } else {
      addFavorite(team.id);
    }
  }, [team, favoriteEntries, removeFavorite, addFavorite]);

  if (status === 'error') return <LoadError onRetry={refresh} />;
  if (status === 'loading') return <TeamsSkeleton />;

  if (!team) {
    return (
      <div className="rounded-lg border border-dashed p-10 text-center">
        <p className="font-medium">Team not found</p>
        <p className="mt-1 text-sm text-muted-foreground">
          This team isn&apos;t in the current data catalog.
        </p>
        <Link
          to="/teams"
          className="mt-4 inline-flex h-9 items-center rounded-md border bg-background px-4 text-sm font-medium transition-colors hover:bg-muted focus-visible:underline"
        >
          Back to teams
        </Link>
      </div>
    );
  }

  const dataRange =
    dataWindow && `Data range: ${formatDateLabel(dataWindow.from)} – ${formatDateLabel(dataWindow.to)}`;

  const storageFailed = Boolean(favoritesError ?? watchlistError ?? settingsError);

  return (
    <div>
      {storageFailed && <StorageWarning />}

      <div className="mb-4 flex flex-wrap items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          {sport && (
            <span className="text-2xl" aria-hidden="true">
              {sport.emoji}
            </span>
          )}
          <div>
            <h1 className="text-xl font-semibold tracking-tight">{team.name}</h1>
            <p className="text-xs text-muted-foreground">
              {league?.name ?? team.leagueId}
              {dataRange && ` · ${dataRange}`}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            aria-label={
              isFavorite(team.id)
                ? `Remove ${team.name} from favorites`
                : `Add ${team.name} to favorites`
            }
            aria-pressed={isFavorite(team.id)}
            onClick={handleToggleFavorite}
            className="ml-1"
          >
            <Star
              className={`size-5 ${isFavorite(team.id) ? 'fill-current text-amber-500' : 'text-muted-foreground'}`}
              aria-hidden="true"
            />
          </Button>
        </div>
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
      </div>

      {teamEvents.length === 0 ? (
        <div className="rounded-lg border border-dashed p-10 text-center">
          <p className="font-medium">No games in the loaded data</p>
          <p className="mt-1 text-sm text-muted-foreground">
            The season may not have started yet or the schedule isn&apos;t published
            yet — data refreshes daily.
          </p>
        </div>
      ) : upcomingCount + pastCount === 0 ? (
        <div className="rounded-lg border border-dashed p-10 text-center">
          <p className="font-medium">No games match your filters</p>
          <Button variant="outline" size="sm" className="mt-4" onClick={() => clearFilters()}>
            Clear filters
          </Button>
        </div>
      ) : (
        <>
          <FilterBar bandsOnly filters={filters} onFiltersChange={setFilters}>
            <span className="text-xs text-muted-foreground">
              {upcomingCount} upcoming · {pastCount} past
            </span>
          </FilterBar>

          <p className="sr-only" aria-live="polite">
            {upcomingCount} upcoming {upcomingCount === 1 ? 'game' : 'games'} shown
          </p>

          {upcomingCount === 0 && (
            <p className="mb-4 rounded-md bg-muted/50 px-3 py-2 text-sm text-muted-foreground">
              No upcoming games — the season has finished for this team in the loaded data.
            </p>
          )}

          <section aria-labelledby="schedule-upcoming">
            <h2
              id="schedule-upcoming"
              className="mb-3 text-sm font-medium uppercase tracking-wide text-muted-foreground"
            >
              Upcoming ({upcomingCount})
            </h2>
            {upcomingDayKeys.map((key, i) => {
              const prev = upcomingDayKeys[i - 1];
              const monthChanged = !prev || prev.slice(0, 7) !== key.slice(0, 7);
              return (
                <div key={key}>
                  {monthChanged && <MonthSeparator dayKey={key} />}
                  <DayGroup
                    dayKey={key}
                    isToday={key === todayKey}
                    items={groups.upcoming.get(key) ?? []}
                    viewMode={settings.viewMode}
                    tz={tz}
                    onToggleWatch={handleToggleWatch}
                    liveIndicator
                  />
                </div>
              );
            })}
          </section>

          <PastSection
            pastDays={groups.past}
            viewMode={settings.viewMode}
            tz={tz}
            now={now}
            onToggleWatch={handleToggleWatch}
            monthSeparators
          />
        </>
      )}

      {source === 'json' && generatedAt && (
        <p className="mt-2 text-center text-xs text-muted-foreground">
          Data as of {new Date(generatedAt).toLocaleString()}
        </p>
      )}

      {toast && <WatchlistToast toast={toast} onDismiss={() => setToast(null)} />}
    </div>
  );
}

/** Separator miesiąca przed pierwszym dniem danego miesiąca (ADR-0022). */
function MonthSeparator({ dayKey }: { dayKey: string }) {
  return (
    <p className="mb-3 mt-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
      {formatMonthLabel(dayKey)}
    </p>
  );
}

function formatDateLabel(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}
