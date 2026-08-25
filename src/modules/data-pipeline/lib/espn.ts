import type { DataWindow, SportEvent, Team } from '../../data-source/types';
import { espnId, type EspnLeagueConfig, type LeagueFetchResult } from './config';

/** Adapter ESPN hidden API — 7 lig zespołowych (ADR-0007). API nieudokumentowane:
 *  walidujemy wymagane pola per event, brak pola = drop z warningiem, nie crash ligi. */

const SITE_API = 'https://site.api.espn.com/apis/site/v2/sports';
const FETCH_TIMEOUT_MS = 15_000;
const FETCH_ATTEMPTS = 2;

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

export async function fetchEspnLeague(
  config: EspnLeagueConfig,
  window: DataWindow,
): Promise<LeagueFetchResult> {
  const dates = `${yyyymmdd(window.from)}-${yyyymmdd(window.to)}`;
  const [scoreboard, teamsRaw] = await Promise.all([
    fetchJson<{ events?: EspnRawEvent[] }>(
      `${SITE_API}/${config.espnPath}/scoreboard?dates=${dates}`,
      config.leagueId,
    ),
    fetchJson<EspnRawTeams>(`${SITE_API}/${config.espnPath}/teams?limit=500`, config.leagueId),
  ]);

  const events = (scoreboard.events ?? [])
    .map((raw) => mapEvent(config.leagueId, raw))
    .filter((e): e is SportEvent => e !== null && inWindow(e.startUtc, window));

  return { leagueId: config.leagueId, events, teams: mapTeams(config.leagueId, teamsRaw) };
}
