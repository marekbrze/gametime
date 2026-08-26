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
import { useFavoriteTeams } from '../hooks/use-favorite-teams';
import { TeamsSkeleton } from './TeamsSkeleton';

/** F1 ukryta w katalogu teams (ADR-0021) — brak encji Team dla kierowców w v1. */
const HIDDEN_LEAGUE_IDS = new Set(['f1']);

/**
 * Ekran katalogu drużyn, poziom 1 nawigacji (ADR-0020): sekcja My teams
 * (szybki dostęp do terminarzy ulubionych — ENTITY_MAP) + karty lig
 * pogrupowane po sportach.
 */
export function TeamsScreen() {
  const { status, refresh } = useEvents();
  const { favorites, toggle: toggleFavorite } = useFavoriteTeams();

  if (status === 'error') return <LoadError onRetry={refresh} />;
  if (status === 'loading') return <TeamsSkeleton />;

  /** Ulubione rozwiązane przez katalog; sieroty (teamId poza katalogiem po
   * zmianie snapshotu) pomijamy w widoku — sprzątanie/prosta nota to edgecases. */
  const favoriteTeams = favorites
    .map((f) => TEAM_BY_ID.get(f.teamId))
    .filter((team): team is NonNullable<typeof team> => Boolean(team));

  const teamCountByLeague = new Map<string, number>();
  for (const team of TEAMS) {
    teamCountByLeague.set(team.leagueId, (teamCountByLeague.get(team.leagueId) ?? 0) + 1);
  }

  const visibleLeagues = LEAGUES.filter((l) => !HIDDEN_LEAGUE_IDS.has(l.id));

  return (
    <div>
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
                  onClick={() => toggleFavorite(team.id)}
                >
                  <Star className="size-4 fill-current text-amber-500" aria-hidden="true" />
                </Button>
              </li>
            ))}
          </ul>
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
    </div>
  );
}
