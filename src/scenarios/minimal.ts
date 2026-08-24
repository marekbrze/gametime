import type { AppData } from './types';
import { generateMockEvents } from '@/modules/data-source/data/mock-events';

/** Trochę danych: kilka wydarzeń wokół "teraz" + jedna ulubiona drużyna (MyTeamsFilter testowalny). */
export function minimalScenario(): AppData {
  const events = generateMockEvents().slice(0, 10);
  return {
    'gametime.events': events,
    'gametime.watchlist': [{ eventId: events[0].id, addedAt: new Date().toISOString() }],
    'gametime.favoriteTeams': [{ teamId: 'nhl-tor', addedAt: new Date().toISOString() }],
  };
}
