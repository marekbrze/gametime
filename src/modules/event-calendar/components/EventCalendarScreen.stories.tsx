import type { Meta, StoryObj } from '@storybook/react';
import { EventCalendarScreen } from './EventCalendarScreen';

const meta: Meta<typeof EventCalendarScreen> = {
  title: 'Event Calendar/EventCalendarScreen',
  component: EventCalendarScreen,
};

export default meta;
type Story = StoryObj<typeof EventCalendarScreen>;

/** Domyślnie hooki wezmą mockowy tydzień — wymuszamy brak kluczy w localStorage. */
export const WithData: Story = {
  decorators: [
    (Story) => {
      localStorage.removeItem('gametime.events');
      localStorage.removeItem('gametime.favoriteTeams');
      localStorage.removeItem('gametime.watchlist');
      return <Story />;
    },
  ],
};

/** Pusty tydzień — empty state z przyciskiem czyszczenia filtrów. */
export const EmptyWeek: Story = {
  decorators: [
    (Story) => {
      localStorage.setItem('gametime.events', '[]');
      localStorage.setItem('gametime.favoriteTeams', '[]');
      return <Story />;
    },
  ],
};
