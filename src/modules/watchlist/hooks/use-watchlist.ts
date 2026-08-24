import { useLocalStorage } from '@/shared/hooks/use-local-storage';
import type { WatchlistEntry } from '../types';

const WATCHLIST_KEY = 'gametime.watchlist';

export function useWatchlist() {
  const [entries, setEntries] = useLocalStorage<WatchlistEntry[]>(WATCHLIST_KEY, []);

  const isWatched = (eventId: string) => entries.some((e) => e.eventId === eventId);

  const toggle = (eventId: string) => {
    if (isWatched(eventId)) {
      setEntries(entries.filter((e) => e.eventId !== eventId));
    } else {
      setEntries([...entries, { eventId, addedAt: new Date().toISOString() }]);
    }
  };

  return { entries, isWatched, toggle, storageKey: WATCHLIST_KEY };
}
