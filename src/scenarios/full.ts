import type { AppData } from './types';

/**
 * Realne wydarzenia ze snapshota + ulubione drużyny o stabilnych ID z katalogu
 * ESPN (podświetlenia, MyTeamsFilter). Watchlisty nie seedujemy — realne ID
 * eventów zmieniają się z każdym odświeżeniem snapshota.
 */
export function fullScenario(): AppData {
  const addedAt = new Date().toISOString();
  return {
    'gametime.watchlist': [],
    'gametime.favoriteTeams': [
      { teamId: 'espn-nhl-21', addedAt }, // Toronto Maple Leafs
      { teamId: 'espn-nba-13', addedAt }, // Los Angeles Lakers
      { teamId: 'espn-premier-league-359', addedAt }, // Arsenal
    ],
  };
}
