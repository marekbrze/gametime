import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { CLEAN_FILTERS, type EventFilters } from '../types';
import { FilterBar } from './FilterBar';
import { LeagueFilterPanel } from './LeagueFilterPanel';

const meta: Meta<typeof FilterBar> = {
  title: 'Filters/FilterBar',
  component: FilterBar,
};
export default meta;
type Story = StoryObj<typeof FilterBar>;

const ALL_SPORTS = new Set([
  'hockey',
  'basketball',
  'american-football',
  'soccer',
  'motorsport',
]);
const ALL_LEAGUES = new Set([
  'nhl',
  'nba',
  'nfl',
  'premier-league',
  'serie-a',
  'bundesliga',
  'la-liga',
  'f1',
]);

/** Interaktywna ramka — stan filtrów w Storybook, w aplikacji trzyma go ekran-listy. */
function Frame({
  initial = CLEAN_FILTERS,
  sportsWithEvents = ALL_SPORTS,
  leaguesWithEvents = ALL_LEAGUES,
  hasFavorites = true,
}: {
  initial?: EventFilters;
  sportsWithEvents?: Set<string>;
  leaguesWithEvents?: Set<string>;
  hasFavorites?: boolean;
}) {
  const [filters, setFilters] = useState(initial);
  const [myTeamsOnly, setMyTeamsOnly] = useState(false);
  return (
    <FilterBar
      filters={filters}
      onFiltersChange={setFilters}
      myTeamsOnly={myTeamsOnly}
      onMyTeamsChange={setMyTeamsOnly}
      hasFavorites={hasFavorites}
      sportsWithEvents={sportsWithEvents}
      leaguesWithEvents={leaguesWithEvents}
    />
  );
}

/** Stan czysty — start każdej wizyty (ADR-0013). */
export const Clean: Story = {
  render: () => <Frame />,
};

/** Tier 1 + tier 2 naraz: pasmo wieczór, sport piłka nożna, dwie ligi (badge ·2). */
export const Narrowed: Story = {
  render: () => (
    <Frame
      initial={{
        band: 'evening',
        sport: 'soccer',
        leagues: ['premier-league', 'bundesliga'],
      }}
    />
  ),
};

/** Off-season: NFL i F1 bez wydarzeń w oknie danych — suffixy w selekcie i panelu. */
export const OffSeason: Story = {
  render: () => (
    <Frame
      sportsWithEvents={new Set(['hockey', 'basketball', 'soccer'])}
      leaguesWithEvents={new Set(['nhl', 'nba', 'premier-league', 'bundesliga'])}
    />
  ),
};

/** Toggle My teams wyłączony, gdy user nie ma ulubionych drużyn. */
export const MyTeamsDisabled: Story = {
  render: () => <Frame hasFavorites={false} />,
};

/** Panel lig z wybranym sportem — podpowiedź o uzgadnianiu (ADR-0016):
 * obca liga zeruje wybór sportu, user wie o tym zanim kliknie. */
export const LeaguePanelSportSelected: Story = {
  render: () => (
    <div className="w-80">
      <LeagueFilterPanel
        filters={{ sport: 'soccer', band: 'all', leagues: [] }}
        onFiltersChange={() => {}}
        leaguesWithEvents={ALL_LEAGUES}
      />
    </div>
  ),
};
