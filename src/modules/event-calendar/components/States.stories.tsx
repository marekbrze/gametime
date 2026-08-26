import type { Meta, StoryObj } from '@storybook/react';
import { EmptyWeek } from './EmptyWeek';
import { LoadError } from './LoadError';
import { StorageWarning } from './StorageWarning';
import { WeekSkeleton } from './WeekSkeleton';

/** Stany zahardowane w proto-harden — każda ścieżka błędna ma swoją story. */

const skeleton: Meta<typeof WeekSkeleton> = {
  title: 'Event Calendar/States',
  component: WeekSkeleton,
};
export default skeleton;

export const Loading: StoryObj<typeof WeekSkeleton> = { render: () => <WeekSkeleton /> };

export const FetchError: StoryObj<typeof LoadError> = {
  render: () => <LoadError onRetry={() => console.log('retry clicked')} />,
};

export const StorageFailure: StoryObj<typeof StorageWarning> = {
  render: () => <StorageWarning />,
};

const emptyWeekProps = {
  hasFilters: false,
  beyondWindow: false,
  dataWindow: null,
  onClearFilters: () => {},
  onThisWeek: () => {},
};

export const EmptyOffSeason: StoryObj<typeof EmptyWeek> = {
  render: () => <EmptyWeek {...emptyWeekProps} />,
};

export const EmptyWithFilters: StoryObj<typeof EmptyWeek> = {
  render: () => <EmptyWeek {...emptyWeekProps} hasFilters />,
};

export const EmptyBeyondWindow: StoryObj<typeof EmptyWeek> = {
  render: () => (
    <EmptyWeek
      {...emptyWeekProps}
      beyondWindow
      dataWindow={{ from: '2026-08-18T00:00:00Z', to: '2026-09-08T23:59:59Z' }}
    />
  ),
};

/** ADR-0016: brak danych dominuje nad filtrami — deep-link ?w=50&league=nhl
 * nie twierdzi "nie pasuje do filtrów" na tygodniu bez danych. */
export const EmptyBeyondWindowWithFilters: StoryObj<typeof EmptyWeek> = {
  render: () => (
    <EmptyWeek
      {...emptyWeekProps}
      hasFilters
      beyondWindow
      dataWindow={{ from: '2026-08-18T00:00:00Z', to: '2026-09-08T23:59:59Z' }}
    />
  ),
};
