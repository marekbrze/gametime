import type { Meta, StoryObj } from '@storybook/react';
import { WatchlistSkeleton } from './WatchlistSkeleton';
import { WatchlistToast } from './WatchlistToast';

/** Stany zahardowane w proto-harden — każda ścieżka ma swoją story (ADR-0018). */

const meta: Meta<typeof WatchlistSkeleton> = {
  title: 'Watchlist/States',
  component: WatchlistSkeleton,
};
export default meta;

export const Loading: StoryObj<typeof WatchlistSkeleton> = {
  render: () => <WatchlistSkeleton />,
};

export const UndoToast: StoryObj<typeof WatchlistToast> = {
  render: () => (
    <div className="min-h-48">
      <WatchlistToast
        toast={{
          id: 1,
          message: 'Removed from watchlist',
          onAction: () => console.log('undo clicked'),
        }}
        onDismiss={() => console.log('dismissed')}
      />
    </div>
  ),
};

export const InfoToast: StoryObj<typeof WatchlistToast> = {
  render: () => (
    <div className="min-h-48">
      <WatchlistToast
        toast={{ id: 2, message: 'Downloaded 7 events' }}
        onDismiss={() => console.log('dismissed')}
      />
    </div>
  ),
};
