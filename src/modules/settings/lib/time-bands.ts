import type { TimeBand, TimeBandKind, UserSettings } from '../types';

/** Minuty od północy dla chwili w strefie użytkownika. */
import { minutesInZone } from '@/shared/lib/datetime';

/** Pasmo dla minuty doby (klasyfikacja po czasie STARTU wydarzenia — ADR/time-band). */
export function bandOfMinutes(minutes: number, bands: UserSettings['bands']): TimeBandKind {
  const ordered: TimeBandKind[] = ['night', 'day', 'evening'];
  for (const kind of ordered) {
    const band = bands[kind] as TimeBand;
    if (minutes >= band.start && minutes < band.end) return kind;
  }
  // luka w konfiguracji (np. pasma nie pokrywają doby) — traktuj jako dzień
  return 'day';
}

export function bandOfDate(date: Date, settings: UserSettings): TimeBandKind {
  return bandOfMinutes(minutesInZone(date, settings.timezone), settings.bands);
}

export const BAND_LABELS: Record<TimeBandKind, string> = {
  day: 'Day',
  evening: 'Evening',
  night: 'Night',
};
