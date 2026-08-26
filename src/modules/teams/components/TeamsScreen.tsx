import { useCallback, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  LEAGUES,
  SPORTS,
  TEAM_BY_ID,
  TEAMS,
} from '@/modules/data-source/data/catalog';
import { useEvents } from '@/modules/data-source/hooks/use-events';
import { LoadError } from '@/modules/event-calendar/components/LoadError';
import { StorageWarning } from '@/modules/event-calendar/components/StorageWarning';
import { WatchlistToast, type WatchlistToastState } from '@/modules/watchlist/components/WatchlistToast';
import { useFavoriteTeams } from '../hooks/use-favorite-teams';
import type { FavoriteTeam } from '../types';
import { TeamsSkeleton } from './TeamsSkeleton';

/** F1 ukryta w katalogu teams (ADR-0021) — brak encji Team dla kierowców w v1. */
const HIDDEN_LEAGUE_IDS = new Set(['f1']);

/**
 * Ekran katalogu drużyn, poziom 1 nawigacji (ADR-0020): sekcja My teams
 * (szybki dostęp do terminarzy ulubionych — ENTITY_MAP) + karty lig
 * pogrupowane po sportach.
 *
 * Harden (ADR-0024): sieroty ulubionych dostają notę + Clear z undo (parita
 * z sierotami watchlisty, ADR-0018 #4); od-ulubienie z kafla ma undo 5s;
 * pad zapisu localStorage widoczny jako StorageWarning.
 */
export function TeamsScreen() {
  const { status, refresh } = useEvents();
  const { favorites, writeError, add, remove } = useFavoriteTeams();
  const [toast, setToast] = useState<WatchlistToastState | null>(null);
  const showToast = useCallback(
    (message: string, onAction?: () => void, actionLabel?: string) => {
      setToast({ id: Date.now(), message, onAction, actionLabel });
    },
    [],
  );

  // Hooki bezwarunkowo (rules of hooks) — early returny dopiero pod spodem
  /** Ulubione rozwiązane przez katalog; sieroty (teamId poza katalogiem po
   * zmianie snapshota) dostają notę + sprzątanie z undo (ADR-0024). */
  const orphanedFavorites = useMemo(
    () => favorites.filter((f) => !TEAM_BY_ID.has(f.teamId)),
    [favorites, status], // katalog live rozszerza się po fetchu — status wymusza przeliczenie
  );
  const favoriteTeams = useMemo(
    () =>
      favorites
        .map((f) => TEAM_BY_ID.get(f.teamId))
        .filter((team): team is NonNullable<typeof team> => Boolean(team)),
    [favorites, status],
  );

  /** Od-ulubienie z undo 5s — wpis wraca verbatim z oryginalnym addedAt. */
  const handleRemoveFavorite = useCallback(
    (teamId: string, teamName: string) => {
      const entry = favorites.find((f) => f.teamId === teamId);
      remove(teamId);
      showToast(`Removed ${teamName} from favorites`, () => add(teamId, entry?.addedAt));
    },
    [favorites, remove, add, showToast],
  );

  /** Sprzątanie sierot — z undo, wpisy wracają verbatim (parita z ADR-0018 #4). */
  const handleClearOrphans = useCallback(() => {
    if (orphanedFavorites.length === 0) return;
    const removed: FavoriteTeam[] = orphanedFavorites;
    for (const entry of removed) remove(entry.teamId);
    showToast(
      `Removed ${removed.length} stale ${removed.length === 1 ? 'favorite' : 'favorites'}`,
      () => {
        for (const entry of removed) add(entry.teamId, entry.addedAt);
      },
    );
  }, [orphanedFavorites, remove, add, showToast]);

  if (status === 'error') return <LoadError onRetry={refresh} />;
  if (status === 'loading') return <TeamsSkeleton />;

  const teamCountByLeague = new Map<string, number>();
  for (const team of TEAMS) {
    teamCountByLeague.set(team.leagueId, (teamCountByLeague.get(team.leagueId) ?? 0) + 1);
  }

  const visibleLeagues = LEAGUES.filter((l) => !HIDDEN_LEAGUE_IDS.has(l.id));

  return (
    <div>
      {Boolean(writeError) && <StorageWarning />}

      <h1 className="mb-4 text-xl font-semibold tracking-tight">Teams</h1>

      <section aria-labelledby="my-teams" className="mb-8">
        <h2
          id="my-teams"
          className="mb-3 text-sm font-medium uppercase tracking-wide text-muted-foreground"
        >
          My teams ({favoriteTeams.length})
        </h2>
        {favoriteTeams.length === 0 ? (
          <p className="rounded-lg border border-dashed px-4 py-6 text-center text-sm text-muted-foreground">
            Star teams from a league below to pin them here for quick access.
          </p>
        ) : (
          <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {favoriteTeams.map((team) => (
              <li
                key={team.id}
                className="flex items-center gap-2 rounded-lg border bg-card px-3 py-2"
              >
                <Link
                  to={`/teams/team/${team.id}`}
                  className="min-w-0 flex-1 text-sm font-medium underline-offset-2 hover:underline focus-visible:underline"
                >
                  <span className="block truncate">{team.name}</span>
                  <span className="block truncate text-xs font-normal text-muted-foreground">
                    {LEAGUES.find((l) => l.id === team.leagueId)?.name ?? team.leagueId}
                  </span>
                </Link>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={`Remove ${team.name} from favorites`}
                  aria-pressed={false}
                  onClick={() => handleRemoveFavorite(team.id, team.name)}
                >
                  <Star className="size-4 fill-current text-amber-500" aria-hidden="true" />
                </Button>
              </li>
            ))}
          </ul>
        )}

        {orphanedFavorites.length > 0 && (
          <p className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span>
              {orphanedFavorites.length}{' '}
              {orphanedFavorites.length === 1 ? 'favorite is' : 'favorites are'} outside the
              current data catalog.
            </span>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-xs"
              onClick={handleClearOrphans}
            >
              Clear
            </Button>
          </p>
        )}
      </section>

      {SPORTS.map((sport) => {
        const leagues = visibleLeagues.filter((l) => l.sportId === sport.id);
        if (leagues.length === 0) return null;
        return (
          <section key={sport.id} aria-labelledby={`sport-${sport.id}`} className="mb-8">
            <h2
              id={`sport-${sport.id}`}
              className="mb-3 flex items-center gap-2 text-sm font-medium uppercase tracking-wide text-muted-foreground"
            >
              <span aria-hidden="true">{sport.emoji}</span>
              {sport.name}
            </h2>
            <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {leagues.map((league) => (
                <li key={league.id}>
                  <Link
                    to={`/teams/league/${league.id}`}
                    className="flex h-20 items-center justify-between rounded-lg border bg-card px-4 transition-colors hover:bg-muted/60 focus-visible:bg-muted/60"
                  >
                    <span className="text-sm font-medium">{league.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {teamCountByLeague.get(league.id) ?? 0} teams
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        );
      })}

      {toast && <WatchlistToast toast={toast} onDismiss={() => setToast(null)} />}
    </div>
  );
}
