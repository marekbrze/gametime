import type { Meta, StoryObj } from '@storybook/react';
import { EventCalendarScreen } from './EventCalendarScreen';

const meta: Meta<typeof EventCalendarScreen> = {
  title: 'Event Calendar/EventCalendarScreen',
  component: EventCalendarScreen,
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
