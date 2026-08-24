import type { AppData } from './types';
import { generateMockEvents } from '@/modules/data-source/data/mock-events';

/** Pełny tydzień: wszystkie mocki + ulubione drużyny (podświetlenia, MyTeamsFilter). */
export function fullScenario(): AppData {
  const events = generateMockEvents();
  const firstNhl = events.find((e) => e.leagueId === 'nhl');
  const firstSoccer = events.find((e) => e.sportId === 'soccer');
  return {
    'gametime.events': events,
    'gametime.watchlist': [
      ...(firstNhl ? [{ eventId: firstNhl.id, addedAt: new Date().toISOString() }] : []),
      ...(firstSoccer ? [{ eventId: firstSoccer.id, addedAt: new Date().toISOString() }] : []),
    ],
    'gametime.favoriteTeams': [
      { teamId: 'nhl-tor', addedAt: new Date().toISOString() },
      { teamId: 'nba-lal', addedAt: new Date().toISOString() },
      { teamId: 'epl-ars', addedAt: new Date().toISOString() },
    ],
  };
}
