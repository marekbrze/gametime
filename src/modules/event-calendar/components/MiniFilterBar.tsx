import { LayoutGrid, List, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SPORTS } from '@/modules/data-source/data/catalog';
import type { TimeBandKind, ViewMode } from '@/modules/settings/types';
import { BAND_CHIP } from '../lib/bands-ui';

export type SportFilter = string | 'all';
export type BandFilter = TimeBandKind | 'all';

interface MiniFilterBarProps {
  sport: SportFilter;
  band: BandFilter;
  myTeamsOnly: boolean;
  hasFavorites: boolean;
  viewMode: ViewMode;
  onSportChange: (sport: SportFilter) => void;
  onBandChange: (band: BandFilter) => void;
  onMyTeamsChange: (value: boolean) => void;
  onViewModeChange: (mode: ViewMode) => void;
}

/**
 * Minimalny pasek filtrowania na potrzeby testów tego modułu —
 * pełny wspólny pasek przyjdzie z modułem filters (MODULES.md).
 */
export function MiniFilterBar({
  sport,
  band,
  myTeamsOnly,
  hasFavorites,
  viewMode,
  onSportChange,
  onBandChange,
  onMyTeamsChange,
  onViewModeChange,
}: MiniFilterBarProps) {
  return (
    <div className="mb-4 flex flex-wrap items-center gap-2">
      <label className="sr-only" htmlFor="sport-filter">
        Filter by sport
      </label>
      <select
        id="sport-filter"
        value={sport}
        onChange={(e) => onSportChange(e.target.value as SportFilter)}
        className="h-9 rounded-md border bg-background px-2 text-sm"
      >
        <option value="all">All sports</option>
        {SPORTS.map((s) => (
          <option key={s.id} value={s.id}>
            {s.emoji} {s.name}
          </option>
        ))}
      </select>

      <div role="group" aria-label="Filter by time band" className="flex items-center gap-1">
        {(['all', 'day', 'evening', 'night'] as const).map((option) => (
          <Button
            key={option}
            variant={band === option ? 'default' : 'outline'}
            size="sm"
            aria-pressed={band === option}
            onClick={() => onBandChange(option)}
            className={option !== 'all' && band === option ? BAND_CHIP[option] : ''}
          >
            {option === 'all' ? 'Any time' : option}
          </Button>
        ))}
      </div>

      <Button
        variant={myTeamsOnly ? 'default' : 'outline'}
        size="sm"
        aria-pressed={myTeamsOnly}
        disabled={!hasFavorites}
        title={hasFavorites ? undefined : 'Add favorite teams first (Teams module)'}
        onClick={() => onMyTeamsChange(!myTeamsOnly)}
        className="gap-1.5"
      >
        <Star className="size-3.5" aria-hidden="true" />
        My teams
      </Button>

      <div role="group" aria-label="View mode" className="ml-auto flex items-center gap-1">
        <Button
          variant={viewMode === 'list' ? 'default' : 'ghost'}
          size="icon"
          aria-label="List view"
          aria-pressed={viewMode === 'list'}
          onClick={() => onViewModeChange('list')}
        >
          <List className="size-4" aria-hidden="true" />
        </Button>
        <Button
          variant={viewMode === 'cards' ? 'default' : 'ghost'}
          size="icon"
          aria-label="Cards view"
          aria-pressed={viewMode === 'cards'}
          onClick={() => onViewModeChange('cards')}
        >
          <LayoutGrid className="size-4" aria-hidden="true" />
        </Button>
      </div>
    </div>
  );
}
