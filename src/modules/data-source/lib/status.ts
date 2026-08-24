import type { EventStatus, SportEvent } from '../types';

/** Szacowany czas trwania wydarzenia (live → finished bez realtime API — ADR-0005). */
export const ESTIMATED_EVENT_DURATION_MS = 3 * 60 * 60 * 1000;

/**
 * Status wyliczany z czasu startu (ADR-0005):
 * scheduled → live (start ≤ teraz < start+3h) → finished.
 * Nadpis z danych (postponed/canceled) wygrywa.
 */
export function deriveStatus(event: SportEvent, now: Date): EventStatus {
  if (event.statusOverride) return event.statusOverride;
  const start = new Date(event.startUtc).getTime();
  if (now.getTime() >= start + ESTIMATED_EVENT_DURATION_MS) return 'finished';
  if (now.getTime() >= start) return 'live';
  return 'scheduled';
}

/** Próg "starting soon" dla bloku Now (ADR-0005). */
export const STARTING_SOON_MS = 60 * 60 * 1000;

export function isStartingSoon(event: SportEvent, now: Date): boolean {
  if (event.statusOverride) return false;
  const start = new Date(event.startUtc).getTime();
  const diff = start - now.getTime();
  return diff > 0 && diff <= STARTING_SOON_MS;
}
