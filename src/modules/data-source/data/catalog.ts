import type { League, Sport, Team } from '../types';

/** Zakres v1 (MODULES.md): 5 sportów, 8 lig. */
export const SPORTS: Sport[] = [
  { id: 'hockey', name: 'Hockey', emoji: '🏒' },
  { id: 'basketball', name: 'Basketball', emoji: '🏀' },
  { id: 'american-football', name: 'American Football', emoji: '🏈' },
  { id: 'soccer', name: 'Soccer', emoji: '⚽' },
  { id: 'motorsport', name: 'Motorsport', emoji: '🏁' },
];

export const LEAGUES: League[] = [
  { id: 'nhl', name: 'NHL', sportId: 'hockey' },
  { id: 'nba', name: 'NBA', sportId: 'basketball' },
  { id: 'nfl', name: 'NFL', sportId: 'american-football' },
  { id: 'premier-league', name: 'Premier League', sportId: 'soccer' },
  { id: 'serie-a', name: 'Serie A', sportId: 'soccer' },
  { id: 'bundesliga', name: 'Bundesliga', sportId: 'soccer' },
  { id: 'la-liga', name: 'La Liga', sportId: 'soccer' },
  { id: 'f1', name: 'F1', sportId: 'motorsport' },
];

const team = (id: string, name: string, leagueId: string): Team => ({ id, name, leagueId });

export const TEAMS: Team[] = [
  // NHL
  team('nhl-tor', 'Toronto Maple Leafs', 'nhl'),
  team('nhl-bos', 'Boston Bruins', 'nhl'),
  team('nhl-edm', 'Edmonton Oilers', 'nhl'),
  team('nhl-col', 'Colorado Avalanche', 'nhl'),
  team('nhl-nyr', 'New York Rangers', 'nhl'),
  team('nhl-fla', 'Florida Panthers', 'nhl'),
  team('nhl-veg', 'Vegas Golden Knights', 'nhl'),
  team('nhl-det', 'Detroit Red Wings', 'nhl'),
  // NBA
  team('nba-bos', 'Boston Celtics', 'nba'),
  team('nba-lal', 'Los Angeles Lakers', 'nba'),
  team('nba-gsw', 'Golden State Warriors', 'nba'),
  team('nba-den', 'Denver Nuggets', 'nba'),
  team('nba-mil', 'Milwaukee Bucks', 'nba'),
  team('nba-okc', 'Oklahoma City Thunder', 'nba'),
  team('nba-nyk', 'New York Knicks', 'nba'),
  team('nba-dal', 'Dallas Mavericks', 'nba'),
  // NFL
  team('nfl-kc', 'Kansas City Chiefs', 'nfl'),
  team('nfl-buf', 'Buffalo Bills', 'nfl'),
  team('nlf-sf', 'San Francisco 49ers', 'nfl'),
  team('nfl-dal', 'Dallas Cowboys', 'nfl'),
  team('nfl-gb', 'Green Bay Packers', 'nfl'),
  team('nfl-phi', 'Philadelphia Eagles', 'nfl'),
  // Premier League
  team('epl-ars', 'Arsenal', 'premier-league'),
  team('epl-liv', 'Liverpool', 'premier-league'),
  team('epl-mci', 'Manchester City', 'premier-league'),
  team('epl-che', 'Chelsea', 'premier-league'),
  team('epl-tot', 'Tottenham', 'premier-league'),
  team('epl-bha', 'Brighton', 'premier-league'),
  // Serie A
  team('sa-inter', 'Inter', 'serie-a'),
  team('sa-mil', 'Milan', 'serie-a'),
  team('sa-juv', 'Juventus', 'serie-a'),
  team('sa-nap', 'Napoli', 'serie-a'),
  // Bundesliga
  team('bl-bay', 'Bayern Munich', 'bundesliga'),
  team('bl-dor', 'Borussia Dortmund', 'bundesliga'),
  team('bl-lep', 'RB Leipzig', 'bundesliga'),
  team('bl-lev', 'Bayer Leverkusen', 'bundesliga'),
  // La Liga
  team('ll-rma', 'Real Madrid', 'la-liga'),
  team('ll-bar', 'Barcelona', 'la-liga'),
  team('ll-atm', 'Atletico Madrid', 'la-liga'),
  team('ll-ath', 'Athletic Bilbao', 'la-liga'),
];

export const SPORT_BY_ID = new Map(SPORTS.map((s) => [s.id, s]));
export const LEAGUE_BY_ID = new Map(LEAGUES.map((l) => [l.id, l]));
export const TEAM_BY_ID = new Map(TEAMS.map((t) => [t.id, t]));

/**
 * Rozszerza katalog runtime o drużyny ze snapshota (`public/data.json` z data-pipeline).
 * Mapy mutujemy w miejscu — konsumenci (event-labels, calendar-export) czytają je
 * przez Map.get przy renderze, więc realne ID `espn-{liga}-{id}` rozwiązują się od razu.
 * TODO(harden): refaktor na jeden katalog trzymany przez data-source.
 */
export function registerCatalogTeams(teams: Team[]): void {
  for (const team of teams) {
    if (TEAM_BY_ID.has(team.id)) continue;
    TEAMS.push(team);
    TEAM_BY_ID.set(team.id, team);
  }
}
