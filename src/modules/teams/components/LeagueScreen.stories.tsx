import type { Meta, StoryObj } from '@storybook/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { generateMockEvents } from '@/modules/data-source/data/mock-events';
import { LeagueScreen } from './LeagueScreen';

const meta: Meta<typeof LeagueScreen> = {
  title: 'Teams/LeagueScreen',
  component: LeagueScreen,
};
export default meta;
type Story = StoryObj<typeof LeagueScreen>;

function withRouter(initialEntry: string) {
  return (Story: () => React.ReactElement) => (
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route path="/teams/league/:leagueId" element={<Story />} />
      </Routes>
    </MemoryRouter>
  );
}

function seed(events: ReturnType<typeof generateMockEvents> = generateMockEvents()) {
  localStorage.setItem('gametime.devEvents', JSON.stringify(events));
  localStorage.setItem('gametime.favoriteTeams', JSON.stringify([]));
}

/** NHL z mockowego katalogu — lista alfabetyczna z gwiazdkami + search. */
export const WithData: Story = {
  decorators: [
    (Story) => {
      seed();
      return <Story />;
    },
    withRouter('/teams/league/nhl'),
  ],
};

/** Deep-link na F1 — wyjaśnienie zamiast pozornego buga (ADR-0021). */
export const F1DeepLink: Story = {
  decorators: [
    (Story) => {
      seed();
      return <Story />;
    },
    withRouter('/teams/league/f1'),
  ],
};

/** Nieznana liga — not found z powrotem do /teams. */
export const NotFound: Story = {
  decorators: [
    (Story) => {
      seed();
      return <Story />;
    },
    withRouter('/teams/league/does-not-exist'),
  ],
  parameters: {
    docs: {
      description: {
        story:
          'Wpisz coś w pole search w interaktywnym canvasie, żeby zobaczyć stan "No teams match".',
      },
    },
  },
};
