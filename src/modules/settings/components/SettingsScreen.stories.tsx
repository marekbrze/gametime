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

/** Harden #1 (ADR-0027): śmieciowa strefa ('Foo/Bar'/'') rzucałaby RangeError
 * w Intl na każdym ekranie — sanitize waliduje wartość i wraca do System default. */
export const InvalidTimezoneStorage: Story = {
  decorators: [
    (Story) => {
      localStorage.setItem(
        'gametime.settings',
        JSON.stringify({ ...DEFAULT_SETTINGS, timezone: 'Foo/Bar' }),
      );
      return <Story />;
    },
  ],
};

/** Harden #3 (ADR-0027): legacy alias 'Poland' — poprawny dla Intl, ale
 * nieobecny na liście — przypięty option „Saved:", select nie renderuje się pusty. */
export const LegacyAliasTimezone: Story = {
  decorators: [
    (Story) => {
      localStorage.setItem(
        'gametime.settings',
        JSON.stringify({ ...DEFAULT_SETTINGS, timezone: 'Poland' }),
      );
      return <Story />;
    },
  ],
};

/** Harden #2 (ADR-0027): pasma z luką (0–5:00, 6:40–22:00) — niespójne z
 * modelem dwugranicznym → defaults (decyzja designera). */
export const InconsistentBands: Story = {
  decorators: [
    (Story) => {
      localStorage.setItem(
        'gametime.settings',
        JSON.stringify({
          ...DEFAULT_SETTINGS,
          bands: {
            night: { kind: 'night', start: 0, end: 5 * 60 },
            day: { kind: 'day', start: 6 * 60 + 40, end: 22 * 60 },
            evening: { kind: 'evening', start: 22 * 60, end: 24 * 60 },
          },
        }),
      );
      return <Story />;
    },
  ],
};

/** Harden #2 (ADR-0027): granica off-grid (0:45) — poza siatką steppera → defaults. */
export const OffGridBands: Story = {
  decorators: [
    (Story) => {
      localStorage.setItem(
        'gametime.settings',
        JSON.stringify({
          ...DEFAULT_SETTINGS,
          bands: {
            night: { kind: 'night', start: 0, end: 45 },
            day: { kind: 'day', start: 45, end: 22 * 60 },
            evening: { kind: 'evening', start: 22 * 60, end: 24 * 60 },
          },
        }),
      );
      return <Story />;
    },
  ],
};
