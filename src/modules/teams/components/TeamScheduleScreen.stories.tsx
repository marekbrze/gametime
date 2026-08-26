import type { Meta, StoryObj } from '@storybook/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { generateMockEvents } from '@/modules/data-source/data/mock-events';
import { TeamScheduleScreen } from './TeamScheduleScreen';

const meta: Meta<typeof TeamScheduleScreen> = {
  title: 'Teams/TeamScheduleScreen',
  component: TeamScheduleScreen,
};
export default meta;
type Story = StoryObj<typeof TeamScheduleScreen>;

function withRouter(initialEntry: string) {
  return (Story: () => React.ReactElement) => (
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route path="/teams/team/:teamId" element={<Story />} />
      </Routes>
    </MemoryRouter>
  );
}

function seed(events: ReturnType<typeof generateMockEvents>) {
  localStorage.setItem('gametime.devEvents', JSON.stringify(events));
  localStorage.setItem('gametime.watchlist', '[]');
  localStorage.setItem('gametime.favoriteTeams', '[]');
}

/** Colorado Avalanche: live dziś + noc za tydzień + wczorajsza przegrana w Past. */
export const WithData: Story = {
  decorators: [
    (Story) => {
      seed(generateMockEvents());
      return <Story />;
    },
    withRouter('/teams/team/nhl-col'),
  ],
};

/** Drużyna bez wydarzeń w danych — sezon jeszcze się nie zaczął / brak terminarza. */
export const EmptySchedule: Story = {
  decorators: [
    (Story) => {
      seed([]);
      return <Story />;
    },
    withRouter('/teams/team/nhl-col'),
  ],
};

/** Nieznany teamId — not found z powrotem do /teams. */
export const NotFound: Story = {
  decorators: [
    (Story) => {
      seed(generateMockEvents());
      return <Story />;
    },
    withRouter('/teams/team/does-not-exist'),
  ],
};
