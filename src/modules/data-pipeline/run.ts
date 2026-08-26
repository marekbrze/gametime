import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { LEAGUES, SPORTS } from '../data-source/data/catalog';
import type { DataSnapshot, DataWindow, SportEvent, Team } from '../data-source/types';
import { ESPN_LEAGUES, F1_LEAGUE_ID, type LeagueFetchResult } from './lib/config';
import { fetchEspnLeague } from './lib/espn';
import { fetchF1League } from './lib/openf1';

/**
 * data-pipeline entrypoint (`npm run pipeline`, GitHub Action na cronie — ADR-0007).
 * Fetch → normalizacja → `public/data.json` (DataSnapshot, ADR-0009).
 * Okna per liga: ligi ESPN = pełny sezon (ADR-0019), F1 = −7d/+14d (ADR-0008);
 * `window` snapshota to unia okien lig (min from / max to).
 * Fail-soft per liga: padła liga zostaje po poprzednim snapshotu (skład + wydarzenia);
 * exit 1 (bez zapisu) tylko przy totalnym padzie.
 */

const DAYS_PAST = 7;
const DAYS_FUTURE = 14;

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const outputPath = path.join(repoRoot, 'public', 'data.json');

const sportByLeague = new Map(LEAGUES.map((l) => [l.id, l.sportId]));

function shortWindow(now: Date): DataWindow {
  return {
    from: new Date(now.getTime() - DAYS_PAST * 86_400_000).toISOString(),
    to: new Date(now.getTime() + DAYS_FUTURE * 86_400_000).toISOString(),
  };
}

/** Poprzedni snapshot per liga — fail-soft: padła liga nie traci ani składów,
 *  ani (od ADR-0019) wydarzeń sezonu. */
async function loadPreviousByLeague(): Promise<{
  teams: Map<string, Team[]>;
  events: Map<string, SportEvent[]>;
}> {
  try {
    const raw = await readFile(outputPath, 'utf8');
    const snapshot = JSON.parse(raw) as DataSnapshot;
    const teams = new Map<string, Team[]>();
    const events = new Map<string, SportEvent[]>();
    for (const team of snapshot.catalog?.teams ?? []) {
      const list = teams.get(team.leagueId) ?? [];
      list.push(team);
      teams.set(team.leagueId, list);
    }
    for (const event of snapshot.events ?? []) {
      const list = events.get(event.leagueId) ?? [];
      list.push(event);
      events.set(event.leagueId, list);
    }
    return { teams, events };
  } catch {
    return { teams: new Map(), events: new Map() };
  }
}

async function main(): Promise<void> {
  const now = new Date();
  const fallback = shortWindow(now);
  const previous = await loadPreviousByLeague();

  const tasks: { leagueId: string; run: () => Promise<LeagueFetchResult & { window: DataWindow }> }[] = [
    ...ESPN_LEAGUES.map((config) => ({
      leagueId: config.leagueId,
      run: () => fetchEspnLeague(config, fallback),
    })),
    {
      leagueId: F1_LEAGUE_ID,
      // OpenF1 trzyma krótkie okno (ADR-0008); opakowanie ujednolica kształt wyniku
      run: async () => ({ ...(await fetchF1League(fallback)), window: fallback }),
    },
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
            events: previous.events.get(leagueId) ?? [],
            teams: previous.teams.get(leagueId) ?? [],
            window: fallback,
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
      console.warn(
        `[${leagueId}] FAILED: ${error} (kept previous: ${result.teams.length} teams, ${result.events.length} events)`,
      );
      teams.push(...result.teams);
      // wydarzenia poprzednie trafiają do snapshota, ale NIE rozszerzają unii okna —
      // ich okno jest nieznane; unia opisuje to, co faktycznie pobraliśmy
      events.push(...result.events.map((event) => ({ ...event, sportId: sportByLeague.get(leagueId) ?? '' })));
      continue;
    }
    healthy += 1;
    const note =
      result.events.length === 0 ? ' off-season (0 events)' : ` ${result.events.length} events`;
    console.log(`[${leagueId}]${note} · window ${result.window.from.slice(0, 10)} → ${result.window.to.slice(0, 10)}`);
    for (const event of result.events) {
      events.push({ ...event, sportId: sportByLeague.get(leagueId) ?? '' });
    }
    teams.push(...result.teams);
  }

  if (healthy === 0) {
    console.error('all leagues failed — keeping previous snapshot (no write, non-zero exit)');
    process.exit(1);
  }

  // Unia okien zdrowych lig (ADR-0019): min from / max to
  const leagueWindows = settled
    .filter((s) => !s.failed)
    .map((s) => s.result.window);
  const window: DataWindow = {
    from: leagueWindows.reduce((min, w) => (w.from < min ? w.from : min), leagueWindows[0].from),
    to: leagueWindows.reduce((max, w) => (w.to > max ? w.to : max), leagueWindows[0].to),
  };
  console.log(`window (union): ${window.from} → ${window.to}`);

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
