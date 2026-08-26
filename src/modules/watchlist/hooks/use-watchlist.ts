import { useMemo } from 'react';
import { useLocalStorage } from '@/shared/hooks/use-local-storage';
import type { WatchlistEntry } from '../types';

const WATCHLIST_KEY = 'gametime.watchlist';

/** Parsowalny, ale niewłaściwy kształt w storage (np. obiekt zamiast tablicy)
 * → pusta lista zamiast białego ekranu (harden watchlist #1, ADR-0018). */
function sanitizeEntries(raw: unknown): WatchlistEntry[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter(
    (entry): entry is WatchlistEntry =>
      typeof entry === 'object' &&
      entry !== null &&
      typeof (entry as { eventId?: unknown }).eventId === 'string',
  );
}

export function useWatchlist() {
  const [rawEntries, setEntries, , writeError] = useLocalStorage<unknown>(WATCHLIST_KEY, []);
  const entries = useMemo(() => sanitizeEntries(rawEntries), [rawEntries]);

  // Mutatory funkcyjne (prev => ...) — odroczone wywołania (Undo z toastu po 5s)
  // nie mogą czytać stanu z renderu, w którym powstały.
  const isWatched = (eventId: string) => entries.some((e) => e.eventId === eventId);

  /** Dodaje wpis; addedAt pozwala odtworzyć wpis verbatim po Undo. */
  const add = (eventId: string, addedAt?: string) => {
    setEntries((prev: unknown) =>
      Array.isArray(prev) && prev.some((e) => e.eventId === eventId)
        ? prev
        : [
            ...(Array.isArray(prev) ? prev : []),
            { eventId, addedAt: addedAt ?? new Date().toISOString() },
          ],
    );
  };

  const remove = (eventId: string) => {
    setEntries((prev: unknown) => (Array.isArray(prev) ? prev.filter((e) => e.eventId !== eventId) : prev));
  };

  const toggle = (eventId: string) => {
    setEntries((prev: unknown) => {
      const list = Array.isArray(prev) ? prev : [];
      return list.some((e) => e.eventId === eventId)
        ? list.filter((e) => e.eventId !== eventId)
        : [...list, { eventId, addedAt: new Date().toISOString() }];
    });
  };

  /** Zostawia tylko wpisy pasujące do podanych id — sprzątanie sierot
   * poza oknem danych (harden watchlist #4). */
  const keepOnly = (eventIds: string[]) => {
    const ids = new Set(eventIds);
    setEntries((prev: unknown) => (Array.isArray(prev) ? prev.filter((e) => ids.has(e.eventId)) : prev));
  };

  return { entries, isWatched, toggle, add, remove, keepOnly, storageKey: WATCHLIST_KEY, writeError };
}
