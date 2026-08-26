import type { Meta, StoryObj } from '@storybook/react';
import { generateMockEvents } from '@/modules/data-source/data/mock-events';
import { WatchlistScreen } from './WatchlistScreen';

const meta: Meta<typeof WatchlistScreen> = {
  title: 'Watchlist/WatchlistScreen',
  component: WatchlistScreen,
};
export default meta;
type Story = StoryObj<typeof WatchlistScreen>;

/**
 * Deweloperski seed: deterministyczne mocki (devEvents) + watchlista z wpisami
 * o znanych id — soon/dzień/noc/dalsze dni + przeszłość + przełożone.
 */
function seedWatchlist(indices: number[]) {
  const events = generateMockEvents();
  const watchlist = indices.map((i) => ({
    eventId: events[i].id,
    addedAt: new Date().toISOString(),
  }));
  localStorage.setItem('gametime.devEvents', JSON.stringify(events));
  localStorage.setItem('gametime.watchlist', JSON.stringify(watchlist));
  localStorage.setItem('gametime.favoriteTeams', JSON.stringify([]));
}

/** Mutowalna kopia mocków — statusy na potrzeby stories (canceled itp.). */
function eventsWithOverride(index: number, statusOverride: 'canceled' | 'postponed') {
  const events = generateMockEvents();
  events[index] = { ...events[index], statusOverride };
  return events;
}

/** Pełna watchlista: live/soon dziś, pasma, noc za północy, weekend, przeszłość. */
export const WithData: Story = {
  decorators: [
    (Story) => {
      // [2]=starting soon [5]=la liga dziś [8]=noc [13]=dalszy dzień [21]=F1 race
      // [24]=noc weekendu [29,30]=wczoraj (past) [31]=przełożone
      seedWatchlist([2, 5, 8, 13, 21, 24, 29, 30, 31]);
      return <Story />;
    },
  ],
};

/** Pusta watchlista — wyjaśnienie + CTA do kalendarza (decyzja designera). */
export const Empty: Story = {
  decorators: [
    (Story) => {
      localStorage.setItem('gametime.devEvents', JSON.stringify(generateMockEvents()));
      localStorage.setItem('gametime.watchlist', '[]');
      localStorage.setItem('gametime.favoriteTeams', JSON.stringify([]));
      return <Story />;
    },
  ],
};

/** Same przeszłe wpisy — upcoming pusty, nota + zwinięta sekcja Past. */
export const OnlyPast: Story = {
  decorators: [
    (Story) => {
      seedWatchlist([29, 30]);
      return <Story />;
    },
  ],
};

/** Filtr zabija wszystko — empty state z „Clear filters". */
export const FilteredToEmpty: Story = {
  decorators: [
    (Story) => {
      seedWatchlist([5, 13]); // piłka nożna (la-liga, bundesliga)
      return <Story />;
    },
  ],
  parameters: {
    docs: {
      description: {
        story:
          'Story renderuje z czystymi filtrami — włącz pasmo "day" w pasku, żeby zobaczyć empty state z Clear filters (oba mecze są wieczorne).',
      },
    },
  },
};

/** Harden (ADR-0018): canceled zostaje przygaszony z plakietką; trwający ma chip LIVE. */
export const WithCanceledAndLive: Story = {
  decorators: [
    (Story) => {
      const events = eventsWithOverride(5, 'canceled'); // la liga dziś → canceled
      localStorage.setItem('gametime.devEvents', JSON.stringify(events));
      localStorage.setItem(
        'gametime.watchlist',
        JSON.stringify(
          [5, 0, 2].map((i) => ({ eventId: events[i].id, addedAt: new Date().toISOString() })),
        ),
      );
      localStorage.setItem('gametime.favoriteTeams', JSON.stringify([]));
      return <Story />;
    },
  ],
};

/** Harden #4: część wpisów poza oknem danych — nota + Clear przy żywej liście. */
export const WithOrphans: Story = {
  decorators: [
    (Story) => {
      const events = generateMockEvents();
      const watchlist = [
        { eventId: events[5].id, addedAt: new Date().toISOString() },
        { eventId: 'gone-from-feed-1', addedAt: '2026-01-01T00:00:00.000Z' },
        { eventId: 'gone-from-feed-2', addedAt: '2026-01-02T00:00:00.000Z' },
      ];
      localStorage.setItem('gametime.devEvents', JSON.stringify(events));
      localStorage.setItem('gametime.watchlist', JSON.stringify(watchlist));
      localStorage.setItem('gametime.favoriteTeams', JSON.stringify([]));
      return <Story />;
    },
  ],
};

/** Harden #5: wszystkie wpisy poza oknem — blok z CTA i sprzątaniem sierot. */
export const OnlyOrphaned: Story = {
  decorators: [
    (Story) => {
      localStorage.setItem('gametime.devEvents', JSON.stringify(generateMockEvents()));
      localStorage.setItem(
        'gametime.watchlist',
        JSON.stringify([{ eventId: 'gone-from-feed-1', addedAt: '2026-01-01T00:00:00.000Z' }]),
      );
      localStorage.setItem('gametime.favoriteTeams', JSON.stringify([]));
      return <Story />;
    },
  ],
};
