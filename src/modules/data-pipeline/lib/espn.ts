import type { DataWindow, SportEvent, Team } from '../../data-source/types';
import { espnId, type EspnLeagueConfig, type LeagueFetchResult } from './config';

/** Adapter ESPN hidden API — 7 lig zespołowych (ADR-0007). API nieudokumentowane:
 *  walidujemy wymagane pola per event, brak pola = drop z warningiem, nie crash ligi.
 *  Okno = pełny sezon z metadanych scoreboardu (ADR-0019), fetch w chunkach
 *  ~30-dniowych z dedupem po id (range `?dates=` bywa capowany na dłuższych zakresach). */

const SITE_API = 'https://site.api.espn.com/apis/site/v2/sports';
const FETCH_TIMEOUT_MS = 15_000;
const FETCH_ATTEMPTS = 2;
const CHUNK_DAYS = 30;

interface EspnRawEvent {
  id?: string;
  date?: string;
  status?: { type?: { name?: string } };
  competitions?: {
    competitors?: { team?: { id?: string; displayName?: string } }[];
  }[];
}

interface EspnRawTeams {
  sports?: { leagues?: { teams?: { team?: { id?: string; displayName?: string } }[] }[] }[];
}

interface EspnRawSeason {
  leagues?: { season?: { startDate?: string; endDate?: string } }[];
}

/** Statusy ESPN mapowane na statusOverride; pre/in/post ignorowane (ADR-0005 — klient wylicza). */
function mapOverride(statusName: string | undefined): SportEvent['statusOverride'] {
  switch (statusName) {
    case 'STATUS_POSTPONED':
      return 'postponed';
    case 'STATUS_CANCELED':
    case 'STATUS_CANCELLED':
      return 'canceled';
    default:
      return undefined;
  }
}

async function fetchJson<T>(url: string, label: string): Promise<T> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= FETCH_ATTEMPTS; attempt++) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return (await res.json()) as T;
    } catch (error) {
      lastError = error;
      if (attempt < FETCH_ATTEMPTS) await new Promise((r) => setTimeout(r, 1500 * attempt));
    }
  }
  throw new Error(`${label}: ${lastError instanceof Error ? lastError.message : String(lastError)}`);
}

function yyyymmdd(iso: string): string {
  return iso.slice(0, 10).replace(/-/g, '');
}

function inWindow(startUtc: string, window: DataWindow): boolean {
  return startUtc >= window.from && startUtc <= window.to;
}

function mapEvent(leagueId: string, raw: EspnRawEvent): SportEvent | null {
  if (!raw.id || !raw.date) return null;
  const startUtc = new Date(raw.date).toISOString();
  if (Number.isNaN(new Date(startUtc).getTime())) return null;
  const competitors = raw.competitions?.[0]?.competitors ?? [];
  const teamIds = competitors
    .map((c) => c.team?.id)
    .filter((id): id is string => Boolean(id))
    .map((id) => espnId(leagueId, id));
  const statusOverride = mapOverride(raw.status?.type?.name);
  return {
    id: espnId(leagueId, raw.id),
    sportId: '', // uzupełnia run.ts z katalogu
    leagueId,
    startUtc,
    ...(teamIds.length > 0 ? { teamIds } : {}),
    ...(statusOverride ? { statusOverride } : {}),
  };
}

function mapTeams(leagueId: string, raw: EspnRawTeams): Team[] {
  const entries = raw.sports?.[0]?.leagues?.[0]?.teams ?? [];
  return entries
    .map((entry) => entry.team)
    .filter((team): team is { id: string; displayName: string } =>
      Boolean(team?.id && team?.displayName),
    )
    .map((team) => ({ id: espnId(leagueId, team.id), name: team.displayName, leagueId }));
}

/** Okno ligi = pełny sezon zawierający "dziś" (ADR-0019). Metadane bierze z
 *  scoreboardu bez parametrów; jak ich brak (zmiana kształtu API) — fallback
 *  na okno krótkie przekazane przez run.ts, liga żyje dalej oknem −7/+14d. */
async function fetchSeasonWindow(
  config: EspnLeagueConfig,
  fallback: DataWindow,
): Promise<DataWindow> {
  const raw = await fetchJson<EspnRawSeason>(`${SITE_API}/${config.espnPath}/scoreboard`, config.leagueId);
  const season = raw.leagues?.[0]?.season;
  if (season?.startDate && season?.endDate) {
    const from = new Date(season.startDate);
    const to = new Date(season.endDate);
    if (!Number.isNaN(from.getTime()) && !Number.isNaN(to.getTime()) && from < to) {
      return { from: from.toISOString(), to: to.toISOString() };
    }
  }
  console.warn(`[${config.leagueId}] no season metadata — fallback to short window`);
  return fallback;
}

/** Zakresy `?dates=` (inkluzywne po obu stronach) pokrywające okno chunkami
 *  po CHUNK_DAYS dni. Chunk idzie po dniach kalendarzowych od `from`. */
function chunkRanges(window: DataWindow): string[] {
  const ranges: string[] = [];
  const DAY_MS = 86_400_000;
  let start = new Date(window.from);
  const end = new Date(window.to);
  // wyrównanie do północy — chunki po pełnych dniach, bez dryfu godziny
  start = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate()));
  const endDay = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate(), 23, 59, 59));
  while (start < endDay) {
    const chunkEnd = new Date(Math.min(start.getTime() + (CHUNK_DAYS - 1) * DAY_MS, endDay.getTime()));
    ranges.push(`${yyyymmdd(start.toISOString())}-${yyyymmdd(chunkEnd.toISOString())}`);
    start = new Date(chunkEnd.getTime() + DAY_MS);
  }
  return ranges;
}

export interface EspnLeagueFetch extends LeagueFetchResult {
  /** okno faktycznie pobrane (sezon albo fallback) — run.ts liczy z nich unię */
  window: DataWindow;
}

export async function fetchEspnLeague(
  config: EspnLeagueConfig,
  fallbackWindow: DataWindow,
): Promise<EspnLeagueFetch> {
  const window = await fetchSeasonWindow(config, fallbackWindow);
  const ranges = chunkRanges(window);

  // Chunki sekwencyjnie per liga (ligi i tak lecą równolegle w run.ts);
  // katalog drużyn równolegle do pętli — jedno żądanie.
  const teamsPromise = fetchJson<EspnRawTeams>(
    `${SITE_API}/${config.espnPath}/teams?limit=500`,
    config.leagueId,
  );

  const byId = new Map<string, SportEvent>();
  for (const range of ranges) {
    const raw = await fetchJson<{ events?: EspnRawEvent[] }>(
      `${SITE_API}/${config.espnPath}/scoreboard?dates=${range}`,
      config.leagueId,
    );
    for (const event of raw.events ?? []) {
      const mapped = mapEvent(config.leagueId, event);
      // dedup po id: chunki nachodzą na siebie na granicach dnia
      if (mapped && inWindow(mapped.startUtc, window)) byId.set(mapped.id, mapped);
    }
  }

  return {
    leagueId: config.leagueId,
    events: [...byId.values()],
    teams: mapTeams(config.leagueId, await teamsPromise),
    window,
  };
}
