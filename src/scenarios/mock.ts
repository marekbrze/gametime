import type { AppData } from './types';
import { generateMockEvents } from '@/modules/data-source/data/mock-events';

/**
 * Deterministyczne mocki zamiast snapshota — dla dev bez sieci i stabilnych
 * testów UI (mocki mają znane team ids, więc ulubione/podświetlenia działają).
 * Pisze gametime.devEvents (czyta useEvents tylko w dev).
 */
export function mockScenario(): AppData {
  const events = generateMockEvents();
  return {
    'gametime.devEvents': events,
    'gametime.watchlist': [],
    'gametime.favoriteTeams': [{ teamId: 'nhl-tor', addedAt: new Date().toISOString() }],
  };
}
