import type { ReactNode } from 'react';
import { Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SPORTS } from '@/modules/data-source/data/catalog';
import { BAND_CHIP } from '@/modules/settings/lib/bands-ui';
import { selectBand, selectSport } from '../lib/filter-events';
import type { FiltersUpdater } from '../hooks/use-url-filters';
import type { BandFilter, EventFilters, SportFilter } from '../types';
import { MoreFilters } from './MoreFilters';

interface FilterBarProps {
  filters: EventFilters;
  onFiltersChange: (updater: FiltersUpdater) => void;
  /**
   * Wariant bands-only (ADR-0022): sama grupa pasm + slot dzieci — dla list
   * jednodrużynowych (terminarz drużyny), gdzie sport/liga/My teams nie niosą
   * informacji. Propsy wymiarów konkursowych stają się wtedy opcjonalne.
   */
  bandsOnly?: boolean;
  myTeamsOnly?: boolean;
  onMyTeamsChange?: (value: boolean) => void;
  hasFavorites?: boolean;
  /** sporty mające wydarzenia w oknie danych — adnotacja off-season (ADR-0011) */
  sportsWithEvents?: Set<string>;
  /** ligi mające wydarzenia w oknie danych — adnotacja off-season w panelu */
  leaguesWithEvents?: Set<string>;
  /** Slot ekranu-listy (np. toggle list ↔ cards — własność event-calendar, nie filters) */
  children?: ReactNode;
}

/**
 * Wspólny pasek filtrowania list (ADR-0012). Tier 1 zawsze widoczny:
 * pasma + sport + My teams. Ligi schowane za "More filters" z licznikiem.
 * Bezstanowy — stan trzyma ekran-listy (na event-calendar: URL, ADR-0014).
 */
export function FilterBar({
  filters,
  onFiltersChange,
  bandsOnly,
  myTeamsOnly = false,
  onMyTeamsChange,
  hasFavorites = false,
  sportsWithEvents = new Set<string>(),
  leaguesWithEvents = new Set<string>(),
  children,
}: FilterBarProps) {
  return (
    <div className="mb-4 flex flex-wrap items-center gap-2">
      <div role="group" aria-label="Filter by time band" className="flex items-center gap-1">
        {(['all', 'day', 'evening', 'night'] as BandFilter[]).map((option) => (
          <Button
            key={option}
            variant={filters.band === option ? 'default' : 'outline'}
            size="sm"
            aria-pressed={filters.band === option}
            onClick={() => onFiltersChange((prev) => selectBand(prev, option))}
            className={option !== 'all' && filters.band === option ? BAND_CHIP[option] : ''}
          >
            {option === 'all' ? 'Any time' : option[0].toUpperCase() + option.slice(1)}
          </Button>
        ))}
      </div>

      {!bandsOnly && (
        <>
          <label className="sr-only" htmlFor="sport-filter">
            Filter by sport
          </label>
          <select
            id="sport-filter"
            value={filters.sport}
            onChange={(e) =>
              onFiltersChange((prev) => selectSport(prev, e.target.value as SportFilter))
            }
            className="h-9 rounded-md border bg-background px-2 text-sm"
          >
            <option value="all">All sports</option>
            {SPORTS.map((s) => (
              <option key={s.id} value={s.id}>
                {s.emoji} {s.name}
                {sportsWithEvents.has(s.id) ? '' : ' — no events'}
              </option>
            ))}
          </select>

          <Button
            variant={myTeamsOnly ? 'default' : 'outline'}
            size="sm"
            aria-pressed={myTeamsOnly}
            disabled={!hasFavorites}
            title={hasFavorites ? undefined : 'Add favorite teams first (Teams module)'}
            onClick={() => onMyTeamsChange?.(!myTeamsOnly)}
            className="gap-1.5"
          >
            <Star className="size-3.5" aria-hidden="true" />
            My teams
          </Button>

          <MoreFilters
            filters={filters}
            onFiltersChange={onFiltersChange}
            leaguesWithEvents={leaguesWithEvents}
          />
        </>
      )}

      {children && (
        <div className={`${bandsOnly ? 'ml-auto' : ''} flex items-center gap-1`}>{children}</div>
      )}
    </div>
  );
}
