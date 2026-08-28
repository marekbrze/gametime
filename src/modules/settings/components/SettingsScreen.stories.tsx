import type { Meta, StoryObj } from '@storybook/react';
import { DEFAULT_SETTINGS } from '../types';
import { SettingsScreen } from './SettingsScreen';

const meta: Meta<typeof SettingsScreen> = {
  title: 'Settings/SettingsScreen',
  component: SettingsScreen,
};
export default meta;
type Story = StoryObj<typeof SettingsScreen>;

/** Default: strefa systemowa, pasma 6:00/22:00 — zero-setup przed pierwszą edycją. */
export const Defaults: Story = {
  decorators: [
    (Story) => {
      localStorage.setItem('gametime.settings', JSON.stringify(DEFAULT_SETTINGS));
      return <Story />;
    },
  ],
};

/** Shiftowiec: Day 5:00 / Evening 23:30 — długa noc, degenerujący się wieczór. */
export const ShiftWorkerBands: Story = {
  decorators: [
    (Story) => {
      localStorage.setItem(
        'gametime.settings',
        JSON.stringify({
          ...DEFAULT_SETTINGS,
          bands: {
            night: { kind: 'night', start: 0, end: 5 * 60 },
            day: { kind: 'day', start: 5 * 60, end: 23 * 60 + 30 },
            evening: { kind: 'evening', start: 23 * 60 + 30, end: 24 * 60 },
          },
        }),
      );
      return <Story />;
    },
  ],
};

/** Strefa nadpisana (kibic NHL w Warszawie) — select na konkretnej IANA. */
export const SpecificTimezone: Story = {
  decorators: [
    (Story) => {
      localStorage.setItem(
        'gametime.settings',
        JSON.stringify({ ...DEFAULT_SETTINGS, timezone: 'America/New_York' }),
      );
      return <Story />;
    },
  ],
};

/**
 * Krańce zakresu (spec Edge Cases): day=23:00 / evening=23:30 — noc 23h,
 * oba steppery na krawędziach (inc day disabled, dec evening disabled).
 */
export const DegenerateBands: Story = {
  decorators: [
    (Story) => {
      localStorage.setItem(
        'gametime.settings',
        JSON.stringify({
          ...DEFAULT_SETTINGS,
          bands: {
            night: { kind: 'night', start: 0, end: 23 * 60 },
            day: { kind: 'day', start: 23 * 60, end: 23 * 60 + 30 },
            evening: { kind: 'evening', start: 23 * 60 + 30, end: 24 * 60 },
          },
        }),
      );
      return <Story />;
    },
  ],
};

/** Zepsuty kształt w storage — sanitizeSettings scala z defaultami (ADR-0018). */
export const CorruptedStorage: Story = {
  decorators: [
    (Story) => {
      localStorage.setItem('gametime.settings', '{"bands":"nonsense"}');
      return <Story />;
    },
  ],
};
