import { LEAGUES, SPORTS } from '@/modules/data-source/data/catalog';
import { toggleLeague } from '../lib/filter-events';
import type { FiltersUpdater } from '../hooks/use-url-filters';
import type { EventFilters } from '../types';

interface LeagueFilterPanelProps {
  filters: EventFilters;
  onFiltersChange: (updater: FiltersUpdater) => void;
  /** ligi mające wydarzenia w oknie danych — pozostałe dostają adnotację off-season */
  leaguesWithEvents: Set<string>;
}

/**
 * Zawartość panelu "More filters": ligi jako multi-select pogrupowany
 * po sportach (ADR-0012) — grupy widoczne od razu, bez kaskady wyboru.
 * Natychmiastowe stosowanie (decyzja lofi) — każdy checkbox zawęża listę.
 */
export function LeagueFilterPanel({
  filters,
  onFiltersChange,
  leaguesWithEvents,
}: LeagueFilterPanelProps) {
  return (
    <div className="flex flex-col gap-3">
      {filters.sport !== 'all' && (
        <p className="text-xs text-muted-foreground">
          Picking a league from another sport resets the sport filter to All sports.
        </p>
      )}
      {SPORTS.map((sport) => {
        const sportLeagues = LEAGUES.filter((league) => league.sportId === sport.id);
        return (
          <fieldset key={sport.id} className="min-w-0">
            <legend className="mb-1 px-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {sport.emoji} {sport.name}
            </legend>
            <div className="flex flex-col">
              {sportLeagues.map((league) => (
                <label
                  key={league.id}
                  className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted"
                >
                  <input
                    type="checkbox"
                    checked={filters.leagues.includes(league.id)}
                    onChange={() => onFiltersChange((prev) => toggleLeague(prev, league.id))}
                    className="size-4"
                  />
                  <span>{league.name}</span>
                  {!leaguesWithEvents.has(league.id) && (
                    <span className="ml-auto text-xs text-muted-foreground">no events</span>
                  )}
                </label>
              ))}
            </div>
          </fieldset>
        );
      })}
    </div>
  );
}
