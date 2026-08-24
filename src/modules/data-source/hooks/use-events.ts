import { useLocalStorage } from '@/shared/hooks/use-local-storage';
import { generateMockEvents } from '../data/mock-events';
import type { SportEvent } from '../types';

const EVENTS_KEY = 'gametime.events';

/**
 * Default = wygenerowany tydzień mocków (klucz zapisuje dopiero zmiana).
 * Scenariusz 'empty' zapisuje jawnie [] — wtedy widać empty state.
 */
export function useEvents() {
  const [events, setEvents, removeEvents] = useLocalStorage<SportEvent[]>(
    EVENTS_KEY,
    generateMockEvents(),
  );
  return { events, setEvents, removeEvents, storageKey: EVENTS_KEY };
}
