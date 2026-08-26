import type { Meta, StoryObj } from '@storybook/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { generateMockEvents } from '@/modules/data-source/data/mock-events';
import { TeamsScreen } from './TeamsScreen';

const meta: Meta<typeof TeamsScreen> = {
  title: 'Teams/TeamsScreen',
  component: TeamsScreen,
};
export default meta;
type Story = StoryObj<typeof TeamsScreen>;

/** Ekran w prawdziwym routerze — Link wymaga kontekstu routera. */
function withRouter(initialEntry: string) {
  return (Story: () => React.ReactElement) => (
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route path="/teams" element={<Story />} />
      </Routes>
    </MemoryRouter>
  );
}

/** Ulubione z mockowego katalogu (static TEAMS) — kafle My teams + karty lig. */
export const WithFavorites: Story = {
  decorators: [
    (Story) => {
      localStorage.setItem('gametime.devEvents', JSON.stringify(generateMockEvents()));
      localStorage.setItem(
        'gametime.favoriteTeams',
        JSON.stringify([
          { teamId: 'nhl-tor', addedAt: '2026-08-20T10:00:00.000Z' },
          { teamId: 'epl-ars', addedAt: '2026-08-21T12:00:00.000Z' },
        ]),
      );
      return <Story />;
    },
    withRouter('/teams'),
  ],
};

/** Zero ulubionych — hint z CTA do katalogu lig (sekcje poniżej na tym samym ekranie). */
export const EmptyFavorites: Story = {
  decorators: [
    (Story) => {
      localStorage.setItem('gametime.devEvents', JSON.stringify(generateMockEvents()));
      localStorage.setItem('gametime.favoriteTeams', '[]');
      return <Story />;
    },
    withRouter('/teams'),
  ],
};

/** Harden #2 (ADR-0024): sierota ulubiona — nota + Clear z undo pod sekcją My teams. */
export const WithOrphanedFavorites: Story = {
  decorators: [
    (Story) => {
      localStorage.setItem('gametime.devEvents', JSON.stringify(generateMockEvents()));
      localStorage.setItem(
        'gametime.favoriteTeams',
        JSON.stringify([
          { teamId: 'nhl-tor', addedAt: '2026-08-20T10:00:00.000Z' },
          { teamId: 'gone-from-snapshot-1', addedAt: '2026-01-01T00:00:00.000Z' },
          { teamId: 'gone-from-snapshot-2', addedAt: '2026-01-02T00:00:00.000Z' },
        ]),
      );
      return <Story />;
    },
    withRouter('/teams'),
  ],
};
