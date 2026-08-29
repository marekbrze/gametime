import type { Meta, StoryObj } from '@storybook/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { generateMockEvents } from '@/modules/data-source/data/mock-events';
import { DEFAULT_SETTINGS } from '@/modules/settings/types';
import { EventCalendarScreen } from './EventCalendarScreen';

const meta: Meta<typeof EventCalendarScreen> = {
  title: 'Event Calendar/EventCalendarScreen',
  component: EventCalendarScreen,
  // Ekran czyta filtry z URL (useSearchParams) — bez Routera hook rzuca,
  // więc każda story żyje w MemoryRouter (wzorzec z teams, ADR-0020).
  decorators: [
    (Story) => (
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route path="/" element={<Story />} />
        </Routes>
      </MemoryRouter>
    ),
  ],
};
export default meta;
type Story = StoryObj<typeof EventCalendarScreen>;

/** Realny snapshot z fetcha; na jego nieobecność hook reaguje fallbackiem mocków. */
export const WithData: Story = {
  decorators: [
    (Story) => {
      localStorage.removeItem('gametime.devEvents');
      localStorage.removeItem('gametime.favoriteTeams');
      localStorage.removeItem('gametime.watchlist');
      return <Story />;
    },
  ],
};

/** Pusty tydzień — jawny override devEvents (scenariusz 'empty' DevToolbara). */
export const EmptyWeek: Story = {
  decorators: [
    (Story) => {
      localStorage.setItem('gametime.devEvents', '[]');
      localStorage.setItem('gametime.favoriteTeams', '[]');
      return <Story />;
    },
  ],
};

/** Mocki: dziś wieczorem + 3 mecze po północy → zwinięty disclosure nocy
 * (pełnoszerokościowy przycisk w czerwonym tincie, ADR-0032). */
export const NightDisclosureCollapsed: Story = {
  decorators: [
    (Story) => {
      localStorage.setItem('gametime.devEvents', JSON.stringify(generateMockEvents()));
      localStorage.setItem('gametime.favoriteTeams', '[]');
      localStorage.setItem('gametime.watchlist', '[]');
      return <Story />;
    },
  ],
};

/** Lokalny czas seeda (nie UTC-owe stringi) — pasma liczą się w strefie usera. */
function atLocal(dayOffset: number, hour: number, minute = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + dayOffset);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}

const onlyNightEvents = () => [
  {
    id: 'night-only-1',
    sportId: 'basketball',
    leagueId: 'nba',
    startUtc: atLocal(2, 1, 30),
    teamIds: ['nba-lal', 'nba-gsw'],
  },
  {
    id: 'night-only-2',
    sportId: 'hockey',
    leagueId: 'nhl',
    startUtc: atLocal(2, 2, 15),
    teamIds: ['nhl-edm', 'nhl-col'],
  },
];

/** Harden (ADR-0032): dzień, w którym noc jest JEDYNYM pasmem → sekcja rozwija
 * się sama (mini-nagłówek Night jak Day/Evening) — chowanie jedynej treści
 * dnia za disclosure byłoby pułapką. */
export const NightOnlyDayAutoOpen: Story = {
  decorators: [
    (Story) => {
      localStorage.setItem('gametime.devEvents', JSON.stringify(onlyNightEvents()));
      localStorage.setItem('gametime.favoriteTeams', '[]');
      localStorage.setItem('gametime.watchlist', '[]');
      return <Story />;
    },
  ],
};

/** Harden (ADR-0032): filtr ?band=night przefiltrowuje dzień/evening — noc
 * zostaje JEDYNYM widocznym pasmem i rozwija się sama; filtr nigdy nie chowa
 * wyników za zwinięciem. */
export const NightBandFilterAutoOpen: Story = {
  decorators: [
    (Story) => {
      localStorage.setItem('gametime.devEvents', JSON.stringify(generateMockEvents()));
      localStorage.setItem('gametime.favoriteTeams', '[]');
      localStorage.setItem('gametime.watchlist', '[]');
      return (
        <MemoryRouter initialEntries={['/?band=night']}>
          <Routes>
            <Route path="/" element={<Story />} />
          </Routes>
        </MemoryRouter>
      );
    },
  ],
};

/** Dni przeszłe zwinięte pod nagłówkiem (skan tygodnia zaczyna się od Today):
 * nagłówki z chipami liczników zostają, treść po kliknięciu. */
const weekWithPast = () => [
  {
    id: 'past-1',
    sportId: 'basketball',
    leagueId: 'nba',
    startUtc: atLocal(-3, 19, 30),
    teamIds: ['nba-bos', 'nba-lal'],
  },
  {
    id: 'past-2',
    sportId: 'hockey',
    leagueId: 'nhl',
    startUtc: atLocal(-3, 22, 0),
    teamIds: ['nhl-veg', 'nhl-col'],
  },
  {
    id: 'past-3',
    sportId: 'soccer',
    leagueId: 'premier-league',
    startUtc: atLocal(-1, 15, 0),
    teamIds: ['epl-liv', 'epl-mci'],
  },
  {
    id: 'today-1',
    sportId: 'basketball',
    leagueId: 'nba',
    startUtc: atLocal(0, 19, 30),
    teamIds: ['nba-gsw', 'nba-lal'],
  },
  {
    id: 'future-1',
    sportId: 'hockey',
    leagueId: 'nhl',
    startUtc: atLocal(2, 18, 0),
    teamIds: ['nhl-bos', 'nhl-det'],
  },
];

export const PastDaysCollapsed: Story = {
  decorators: [
    (Story) => {
      localStorage.setItem('gametime.devEvents', JSON.stringify(weekWithPast()));
      localStorage.setItem('gametime.favoriteTeams', '[]');
      localStorage.setItem('gametime.watchlist', '[]');
      return <Story />;
    },
  ],
};

/** Tydzień z ulubionymi drużynami (ADR-0034) — offsety w obrębie bieżącego
 * tygodnia (dziś + juto + dwa dni przeszłe), żeby cała suma była widoczna
 * bez pagera niezależnie od dnia, w którym story renderują. */
const weekWithFavorites = () => [
  // przeszły dzień z meczem ulubionej — zwinięty, ale chip "1 my team" w nagłówku
  {
    id: 'fav-past-1',
    sportId: 'basketball',
    leagueId: 'nba',
    startUtc: atLocal(-2, 19, 0),
    teamIds: ['nba-lal', 'nba-bos'],
  },
  // przeszły dzień bez ulubionych — zwinięty, bez chipa
  {
    id: 'fav-4',
    sportId: 'hockey',
    leagueId: 'nhl',
    startUtc: atLocal(-1, 18, 30),
    teamIds: ['nhl-bos', 'nhl-det'],
  },
  {
    id: 'fav-1',
    sportId: 'basketball',
    leagueId: 'nba',
    startUtc: atLocal(0, 19, 30),
    teamIds: ['nba-lal', 'nba-bos'],
  },
  {
    id: 'fav-2',
    sportId: 'basketball',
    leagueId: 'nba',
    startUtc: atLocal(0, 21, 0),
    teamIds: ['nba-den', 'nba-gsw'],
  },
  // po północy (ViewingDay: należy do wieczoru dnia poprzedniego) — serduszko w sekcji nocy
  {
    id: 'fav-night-1',
    sportId: 'hockey',
    leagueId: 'nhl',
    startUtc: atLocal(1, 1, 0),
    teamIds: ['nhl-col', 'nhl-veg'],
  },
  {
    id: 'fav-3',
    sportId: 'soccer',
    leagueId: 'premier-league',
    startUtc: atLocal(1, 15, 0),
    teamIds: ['epl-liv', 'epl-mci'],
  },
];

const favoriteTeamsSeed = () =>
  JSON.stringify([
    { teamId: 'nba-lal', addedAt: '2026-08-01T00:00:00.000Z' },
    { teamId: 'nhl-col', addedAt: '2026-08-02T00:00:00.000Z' },
    { teamId: 'epl-liv', addedAt: '2026-08-03T00:00:00.000Z' },
  ]);

/** ADR-0034: serduszko = mecz ulubionej drużyny — wiodące przed etykietą
 * (dzień, noc w disclosure, dzień przeszły zwinięty z chipem w nagłówku);
 * chip "N my teams" w nagłówkach dni. fav-1 jest też na watchliście: ♥ + ☆
 * w jednym wierszu, kształt rozróżnia (heart = drużyna, star = wydarzenie). */
export const FavoriteTeamsMarked: Story = {
  decorators: [
    (Story) => {
      localStorage.setItem('gametime.devEvents', JSON.stringify(weekWithFavorites()));
      localStorage.setItem('gametime.favoriteTeams', favoriteTeamsSeed());
      localStorage.setItem(
        'gametime.watchlist',
        JSON.stringify([{ eventId: 'fav-1', addedAt: '2026-08-04T00:00:00.000Z' }]),
      );
      return <Story />;
    },
  ],
};

/** ADR-0034 w widoku cards: serduszko przed uczestnikami na tincie pasma —
 * tint pozostaje czystym nośnikiem powierzchni (bez washu muted). */
export const FavoriteTeamsCardsView: Story = {
  decorators: [
    (Story) => {
      localStorage.setItem('gametime.devEvents', JSON.stringify(weekWithFavorites()));
      localStorage.setItem('gametime.favoriteTeams', favoriteTeamsSeed());
      localStorage.setItem('gametime.watchlist', '[]');
      localStorage.setItem(
        'gametime.settings',
        JSON.stringify({ ...DEFAULT_SETTINGS, viewMode: 'cards' }),
      );
      return <Story />;
    },
  ],
};
