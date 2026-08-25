import type { AppData } from './types';

/** Realne wydarzenia ze snapshota + jedna ulubiona drużyna (MyTeamsFilter testowalny). */
export function minimalScenario(): AppData {
  return {
    'gametime.watchlist': [],
    'gametime.favoriteTeams': [{ teamId: 'espn-nhl-21', addedAt: new Date().toISOString() }],
  };
}
