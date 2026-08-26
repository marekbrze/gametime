import { DEFAULT_SETTINGS, type TimeBandKind, type UserSettings } from '../types';

/**
 * Scalenie zapisanych ustawień z domyślnymi (harden watchlist #1, ADR-0018):
 * parsowalny, ale niewłaściwy kształt w localStorage (np. `{}` po ręcznej
 * edycji lub starszej wersji) nie może wywalać ekranów na `bands[kind].start`.
 * Pole nieprawidłowego typu wraca do wartości domyślnej; storage zostaje
 * nietknięte do pierwszego zapisu (write-first bez zmian).
 */
export function sanitizeSettings(raw: unknown): UserSettings {
  if (typeof raw !== 'object' || raw === null) return DEFAULT_SETTINGS;
  const stored = raw as Partial<UserSettings> & {
    bands?: Partial<Record<TimeBandKind, unknown>>;
  };

  const bands = { ...DEFAULT_SETTINGS.bands };
  if (typeof stored.bands === 'object' && stored.bands !== null) {
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
        bands[kind] = { kind, start: band.start, end: band.end };
      }
    }
  }

  const timezone =
    typeof stored.timezone === 'string' ? stored.timezone : DEFAULT_SETTINGS.timezone;
  const viewMode =
    stored.viewMode === 'cards' || stored.viewMode === 'list'
      ? stored.viewMode
      : DEFAULT_SETTINGS.viewMode;

  return { timezone, bands, viewMode };
}
