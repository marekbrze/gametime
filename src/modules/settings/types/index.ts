export type TimeBandKind = 'day' | 'evening' | 'night';

/** Pasmo godzinowe — zakres w minutach od północy, koniec wyłączny. */
export interface TimeBand {
  kind: TimeBandKind;
  /** minuty od północy, np. 360 = 6:00 */
  start: number;
  /** minuty od północy, wyłączny; 1440 = koniec doby */
  end: number;
}

export type ViewMode = 'list' | 'cards';

export interface UserSettings {
  /** 'system' = strefa przeglądarki; inaczej nazwa IANA, np. 'Europe/Warsaw' */
  timezone: string;
  bands: Record<TimeBandKind, TimeBand>;
  viewMode: ViewMode;
}

export const DEFAULT_SETTINGS: UserSettings = {
  timezone: 'system',
  bands: {
    day: { kind: 'day', start: 6 * 60, end: 22 * 60 },
    evening: { kind: 'evening', start: 22 * 60, end: 24 * 60 },
    night: { kind: 'night', start: 0, end: 6 * 60 },
  },
  viewMode: 'list',
};
