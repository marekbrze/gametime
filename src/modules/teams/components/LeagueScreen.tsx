import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Search, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LEAGUE_BY_ID, SPORT_BY_ID, TEAMS } from '@/modules/data-source/data/catalog';
import { useEvents } from '@/modules/data-source/hooks/use-events';
import { LoadError } from '@/modules/event-calendar/components/LoadError';
import { useFavoriteTeams } from '../hooks/use-favorite-teams';
import { TeamsSkeleton } from './TeamsSkeleton';

/**
 * Ekran ligi, poziom 2 nawigacji (ADR-0020): pełna lista drużyn alfabetycznie,
 * search tekstowy + gwiazdka ulubionego w każdym wierszu. Klik w drużynę → terminarz.
 */
export function LeagueScreen() {
  const { leagueId } = useParams<{ leagueId: string }>();
  const { status, refresh } = useEvents();
  const { isFavorite, toggle: toggleFavorite } = useFavoriteTeams();
  const [query, setQuery] = useState('');

  const league = leagueId ? LEAGUE_BY_ID.get(leagueId) : undefined;

  // Hooki bezwarunkowo (rules of hooks) — early returny dopiero pod spodem
  const teams = useMemo(
    () =>
      TEAMS.filter((t) => league && t.leagueId === league.id)
        .filter((t) => t.name.toLowerCase().includes(query.trim().toLowerCase()))
        .sort((a, b) => a.name.localeCompare(b.name)),
    // TEAMS (katalog live) rośnie po fetchu snapshota — status w deps wymusza przeliczenie
    [league, query, status],
  );

  if (!league) {
    return (
      <div className="rounded-lg border border-dashed p-10 text-center">
        <p className="font-medium">League not found</p>
        <p className="mt-1 text-sm text-muted-foreground">
          This league doesn&apos;t exist in the catalog.
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

  // Świadomy deep-link na F1 (ADR-0021) — wyjaśnienie zamiast pozornego buga
  if (league.id === 'f1') {
    return (
      <div className="rounded-lg border border-dashed p-10 text-center">
        <p className="font-medium">F1 has no teams in v1</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Race weekends aren&apos;t team-based here — browse F1 sessions on the calendar.
        </p>
        <Link
          to="/event-calendar?sport=motorsport"
          className="mt-4 inline-flex h-9 items-center rounded-md border bg-background px-4 text-sm font-medium transition-colors hover:bg-muted focus-visible:underline"
        >
          F1 on the calendar
        </Link>
      </div>
    );
  }

  if (status === 'error') return <LoadError onRetry={refresh} />;

  const sport = SPORT_BY_ID.get(league.sportId);

  if (status === 'loading') {
    return (
      <div>
        <LeagueHeader leagueName={league.name} sportEmoji={sport?.emoji} />
        <TeamsSkeleton />
      </div>
    );
  }

  return (
    <div>
      <LeagueHeader leagueName={league.name} sportEmoji={sport?.emoji} />

      <div className="mb-4 relative">
        <Search
          className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        />
        <label className="sr-only" htmlFor="team-search">
          Search teams
        </label>
        <input
          id="team-search"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search teams…"
          className="h-10 w-full max-w-sm rounded-md border bg-background pl-9 pr-3 text-sm"
        />
      </div>

      {teams.length === 0 ? (
        query.trim() ? (
          <p className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
            No teams match &ldquo;{query.trim()}&rdquo;.
          </p>
        ) : (
          <p className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
            No teams in the catalog for this league yet.
          </p>
        )
      ) : (
        <ul className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
          {teams.map((team) => (
            <li
              key={team.id}
              className="flex items-center gap-2 rounded-md border bg-card px-3 py-2"
            >
              <Link
                to={`/teams/team/${team.id}`}
                className="min-w-0 flex-1 truncate text-sm font-medium underline-offset-2 hover:underline focus-visible:underline"
              >
                {team.name}
              </Link>
              <Button
                variant="ghost"
                size="icon"
                aria-label={
                  isFavorite(team.id)
                    ? `Remove ${team.name} from favorites`
                    : `Add ${team.name} to favorites`
                }
                aria-pressed={isFavorite(team.id)}
                onClick={() => toggleFavorite(team.id)}
              >
                <Star
                  className={`size-4 ${isFavorite(team.id) ? 'fill-current text-amber-500' : 'text-muted-foreground'}`}
                  aria-hidden="true"
                />
              </Button>
            </li>
          ))}
        </ul>
      )}

      <p className="sr-only" aria-live="polite">
        {teams.length} {teams.length === 1 ? 'team' : 'teams'} shown
      </p>
    </div>
  );
}

function LeagueHeader({ leagueName, sportEmoji }: { leagueName: string; sportEmoji?: string }) {
  return (
    <div className="mb-4 flex items-center gap-2">
      {sportEmoji && (
        <span className="text-xl" aria-hidden="true">
          {sportEmoji}
        </span>
      )}
      <h1 className="text-xl font-semibold tracking-tight">{leagueName}</h1>
    </div>
  );
}
