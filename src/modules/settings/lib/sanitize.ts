import { DEFAULT_SETTINGS, type TimeBandKind, type UserSettings } from '../types';
import {
  BOUNDARY_STEP,
  DAY_START_MAX,
  DAY_START_MIN,
  EVENING_START_MAX,
  EVENING_START_MIN,
} from './band-boundaries';

const MINUTES_IN_DAY = 24 * 60;

/**
 * Scalenie zapisanych ustawień z domyślnymi (harden watchlist #1, ADR-0018):
 * parsowalny, ale niewłaściwy kształt w localStorage (np. `{}` po ręcznej
 * edycji lub starszej wersji) nie może wywalać ekranów na `bands[kind].start`.
 * Pole nieprawidłowego typu wraca do wartości domyślnej; storage zostaje
 * nietknięte do pierwszego zapisu (write-first bez zmian).
 */

/** Strefa, którą Intl faktycznie przyjmie — '' i śmieci rzucają RangeError
 * na KAŻDYM ekranie korzystającym z prezentacji godzin (harden #1, ADR-0027). */
function isValidTimezone(zone: string): boolean {
  if (zone === 'system') return true;
  try {
    new Intl.DateTimeFormat('en', { timeZone: zone });
    return true;
  } catch {
    return false;
  }
}

/** Pasma spójne z modelem dwugranicznym (ADR-0025): noc przypięta do północy,
 * wieczór do 24:00, granice na siatce steppera, zero luk i nakładek.
 * Niespójne (ręczna edycja) → defaults (decyzja designera, harden #2). */
function isConsistentBands(bands: UserSettings['bands']): boolean {
  const { night, day, evening } = bands;
  return (
    night.start === 0 &&
    night.end === day.start &&
    day.end === evening.start &&
    evening.end === MINUTES_IN_DAY &&
    day.start >= DAY_START_MIN &&
    day.start <= DAY_START_MAX &&
    day.start % BOUNDARY_STEP === 0 &&
    evening.start >= EVENING_START_MIN &&
    evening.start <= EVENING_START_MAX &&
    evening.start % BOUNDARY_STEP === 0 &&
    day.start < evening.start
  );
}

export function sanitizeSettings(raw: unknown): UserSettings {
  if (typeof raw !== 'object' || raw === null) return DEFAULT_SETTINGS;
  const stored = raw as Partial<UserSettings> & {
    bands?: Partial<Record<TimeBandKind, unknown>>;
  };

  const bands = { ...DEFAULT_SETTINGS.bands };
  if (typeof stored.bands === 'object' && stored.bands !== null) {
    const candidate = { ...DEFAULT_SETTINGS.bands };
    let numeric = true;
    for (const kind of Object.keys(bands) as TimeBandKind[]) {
      const band = stored.bands[kind] as { start?: unknown; end?: unknown } | undefined;
      if (
        typeof band === 'object' &&
        band !== null &&
        typeof band.start === 'number' &&
        typeof band.end === 'number' &&
        Number.isFinite(band.start) &&
        Number.isFinite(band.end)
      ) {
        candidate[kind] = { kind, start: band.start, end: band.end };
      } else {
        numeric = false;
        break;
      }
    }
    // Wartości liczbowe to za mało — dopiero pełna spójność doby pozwala
    // zaufać kształtowi; w przeciwnym razie całość wraca do defaults (#2).
    if (numeric && isConsistentBands(candidate)) {
      bands.night = candidate.night;
      bands.day = candidate.day;
      bands.evening = candidate.evening;
    }
  }

  const timezone =
    typeof stored.timezone === 'string' && isValidTimezone(stored.timezone)
      ? stored.timezone
      : DEFAULT_SETTINGS.timezone;
  const viewMode =
    stored.viewMode === 'cards' || stored.viewMode === 'list'
      ? stored.viewMode
      : DEFAULT_SETTINGS.viewMode;

  return { timezone, bands, viewMode };
}
