import type { DataWindow, SessionType, SportEvent } from '../../data-source/types';
import type { LeagueFetchResult } from './config';

/** Adapter OpenF1 — pełne sesje weekendów F1 (ADR-0008). Bez klucza, stabilne session_key. */

const OPENF1_API = 'https://api.openf1.org/v1';
const FETCH_TIMEOUT_MS = 15_000;
const FETCH_ATTEMPTS = 2;

interface OpenF1Session {
  session_key?: number;
  session_name?: string;
  session_type?: string;
  date_start?: string;
  meeting_key?: number;
}

interface OpenF1Meeting {
  meeting_key?: number;
  meeting_name?: string;
}

const SESSION_TYPES: SessionType[] = ['practice', 'qualifying', 'sprint', 'race'];

function normalizeSessionType(raw: string | undefined): SessionType {
  const lowered = (raw ?? '').toLowerCase() as SessionType;
  return SESSION_TYPES.includes(lowered) ? lowered : 'practice';
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

export async function fetchF1League(window: DataWindow): Promise<LeagueFetchResult> {
  // Okno może przekraczać granicę roku (grudzień/styczeń) — pobieramy każdy rok osobno.
  const years = new Set([window.from.slice(0, 4), window.to.slice(0, 4)]);

  const [sessions, meetings] = await Promise.all([
    Promise.all(
      [...years].map((year) =>
        fetchJson<OpenF1Session[]>(`${OPENF1_API}/sessions?year=${year}`, 'f1-sessions'),
      ),
    ).then((lists) => lists.flat()),
    Promise.all(
      [...years].map((year) =>
        fetchJson<OpenF1Meeting[]>(`${OPENF1_API}/meetings?year=${year}`, 'f1-meetings'),
      ),
    ).then((lists) => lists.flat()),
  ]);

  const meetingName = new Map<number, string>();
  for (const meeting of meetings) {
    if (meeting.meeting_key !== undefined && meeting.meeting_name) {
      meetingName.set(meeting.meeting_key, meeting.meeting_name);
    }
  }

  const events: SportEvent[] = [];
  for (const session of sessions) {
    if (session.session_key === undefined || !session.date_start || !session.session_name) continue;
    const start = new Date(session.date_start);
    if (Number.isNaN(start.getTime())) continue;
    const startUtc = start.toISOString();
    if (startUtc < window.from || startUtc > window.to) continue;
    const gpName =
      (session.meeting_key !== undefined && meetingName.get(session.meeting_key)) || 'Grand Prix';
    events.push({
      id: `f1-${session.session_key}`,
      sportId: 'motorsport', // uzupełnia run.ts z katalogu
      leagueId: 'f1',
      startUtc,
      title: `${gpName} — ${session.session_name}`,
      sessionType: normalizeSessionType(session.session_type),
    });
  }

  // F1 bez katalogu drużyn — eventy title-only (konstruktorzy jako Team: Later)
  return { leagueId: 'f1', events, teams: [] };
}
