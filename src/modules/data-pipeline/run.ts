import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { LEAGUES, SPORTS } from '../data-source/data/catalog';
import type { DataSnapshot, DataWindow, Team } from '../data-source/types';
import { ESPN_LEAGUES, F1_LEAGUE_ID, type LeagueFetchResult } from './lib/config';
import { fetchEspnLeague } from './lib/espn';
import { fetchF1League } from './lib/openf1';

/**
 * data-pipeline entrypoint (`npm run pipeline`, GitHub Action na cronie — ADR-0007).
 * Fetch → normalizacja → `public/data.json` (DataSnapshot, ADR-0009).
 * Fail-soft per liga; exit 1 (bez zapisu) tylko przy totalnym padzie.
 */

const DAYS_PAST = 7;
const DAYS_FUTURE = 14;

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const outputPath = path.join(repoRoot, 'public', 'data.json');

const sportByLeague = new Map(LEAGUES.map((l) => [l.id, l.sportId]));

function computeWindow(now: Date): DataWindow {
  return {
    from: new Date(now.getTime() - DAYS_PAST * 86_400_000).toISOString(),
    to: new Date(now.getTime() + DAYS_FUTURE * 86_400_000).toISOString(),
  };
}

/** Poprzedni katalog drużyn per liga — fail-soft: padła liga nie traci składów. */
async function loadPreviousTeamsByLeague(): Promise<Map<string, Team[]>> {
  try {
    const raw = await readFile(outputPath, 'utf8');
    const snapshot = JSON.parse(raw) as DataSnapshot;
    const byLeague = new Map<string, Team[]>();
    for (const team of snapshot.catalog?.teams ?? []) {
      const list = byLeague.get(team.leagueId) ?? [];
      list.push(team);
      byLeague.set(team.leagueId, list);
    }
    return byLeague;
  } catch {
    return new Map();
  }
}

async function main(): Promise<void> {
  const now = new Date();
  const window = computeWindow(now);
  const previousTeams = await loadPreviousTeamsByLeague();

  console.log(`window: ${window.from} → ${window.to}`);

  const tasks: { leagueId: string; run: () => Promise<LeagueFetchResult> }[] = [
    ...ESPN_LEAGUES.map((config) => ({
      leagueId: config.leagueId,
      run: () => fetchEspnLeague(config, window),
    })),
    { leagueId: F1_LEAGUE_ID, run: () => fetchF1League(window) },
  ];

  const settled = await Promise.all(
    tasks.map(async ({ leagueId, run }) => {
      try {
        return { leagueId, result: await run(), failed: false as const, error: undefined };
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return {
          leagueId,
          result: {
            leagueId,
            events: [],
            teams: previousTeams.get(leagueId) ?? [],
          },
          failed: true as const,
          error: message,
        };
      }
    }),
  );

  const events = [] as DataSnapshot['events'];
  const teams = [] as Team[];
  let healthy = 0;

  for (const { leagueId, result, failed, error } of settled) {
    if (failed) {
      console.warn(`[${leagueId}] FAILED: ${error} (kept previous teams: ${result.teams.length})`);
      teams.push(...result.teams);
      continue;
    }
    healthy += 1;
    const note =
      result.events.length === 0 ? ' off-season (0 events)' : ` ${result.events.length} events`;
    console.log(`[${leagueId}]${note}`);
    for (const event of result.events) {
      events.push({ ...event, sportId: sportByLeague.get(leagueId) ?? '' });
    }
    teams.push(...result.teams);
  }

  if (healthy === 0) {
    console.error('all leagues failed — keeping previous snapshot (no write, non-zero exit)');
    process.exit(1);
  }

  // Deterministyczne sortowanie — czytelne diffy w historii commitów
  events.sort((a, b) => (a.startUtc === b.startUtc ? a.id.localeCompare(b.id) : a.startUtc < b.startUtc ? -1 : 1));
  teams.sort((a, b) => a.id.localeCompare(b.id));

  const snapshot: DataSnapshot = {
    generatedAt: now.toISOString(),
    source: 'espn-hidden-api+openf1',
    window,
    catalog: { sports: SPORTS, leagues: LEAGUES, teams },
    events,
  };

  const json = `${JSON.stringify(snapshot, null, 2)}\n`;

  // `generatedAt` i granice `window` liczone są od "teraz" — zmieniają się co run.
  // Porównujemy z nimi zrównanymi, żeby niecommitować (i nie deployować) szumu
  // 4× dziennie bez zmiany danych. Plik zachowuje wtedy swoje pierwotne
  // `generatedAt`/`window` — odzwierciedlają faktyczną świeżość danych, nie godzinę cronu.
  let unchanged = false;
  try {
    const existing = JSON.parse(await readFile(outputPath, 'utf8')) as DataSnapshot;
    existing.generatedAt = snapshot.generatedAt;
    existing.window = snapshot.window;
    unchanged = JSON.stringify(existing) === JSON.stringify(snapshot);
  } catch {
    // plik jeszcze nie istnieje
  }
  if (unchanged) {
    console.log('no changes — keeping existing public/data.json');
    return;
  }

  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(outputPath, json, 'utf8');

  console.log(
    `summary: ${events.length} events, ${teams.length} teams, ` +
      `${(Buffer.byteLength(json, 'utf8') / 1024).toFixed(1)} KB → ${path.relative(repoRoot, outputPath)}`,
  );
}

void main();
