import { generateId } from '@/shared/types';
import type { SportEvent } from '../types';

/**
 * Mockowe wydarzenia generowane relatywnie do "teraz" — dzięki temu prototyp
 * zawsze ma live'y, starting soon i rozłożony tydzień, niezależnie od dnia
 * otwarcia. Czasy budujemy w strefie lokalnej przeglądarki → ISO UTC.
 */

const MIN = 60 * 1000;

/** Data w strefie lokalnej: dziś + dayOffset dni, o h:m. */
function at(dayOffset: number, hour: number, minute = 0): Date {
  const d = new Date();
  d.setDate(d.getDate() + dayOffset);
  d.setHours(hour, minute, 0, 0);
  return d;
}

/** at(...) ale jeśli czas już minął — przesuń o fallbackDays dni. */
function atFuture(dayOffset: number, hour: number, minute: number, fallbackDays = 1): Date {
  const candidate = at(dayOffset, hour, minute);
  return candidate.getTime() > Date.now() ? candidate : at(dayOffset + fallbackDays, hour, minute);
}

function fromNow(ms: number): Date {
  return new Date(Date.now() + ms);
}

let seq = 0;
const nextId = () => `mock-${++seq}-${generateId().slice(0, 8)}`;

function ev(
  sportId: string,
  leagueId: string,
  start: Date,
  teamIds: [string, string],
  statusOverride?: SportEvent['statusOverride'],
): SportEvent {
  return {
    id: nextId(),
    sportId,
    leagueId,
    startUtc: start.toISOString(),
    teamIds,
    ...(statusOverride ? { statusOverride } : {}),
  };
}

function motor(leagueId: string, start: Date, title: string): SportEvent {
  return {
    id: nextId(),
    sportId: 'motorsport',
    leagueId,
    startUtc: start.toISOString(),
    title,
  };
}

export function generateMockEvents(): SportEvent[] {
  seq = 0;

  return [
    // ── Blok Now: trwające ──
    ev('hockey', 'nhl', fromNow(-80 * MIN), ['nhl-tor', 'nhl-bos']),
    ev('basketball', 'nba', fromNow(-35 * MIN), ['nba-lal', 'nba-gsw']),
    // ── Blok Now: starting soon ──
    ev('soccer', 'premier-league', fromNow(42 * MIN), ['epl-ars', 'epl-liv']),

    // ── Dziś: dzień / wieczór ──
    motor('f1', atFuture(0, 15, 0, 2), 'Dutch GP — Practice 2'),
    ev('basketball', 'nba', atFuture(0, 18, 0), ['nba-den', 'nba-okc']),
    ev('soccer', 'la-liga', atFuture(0, 19, 30), ['ll-rma', 'll-bar']),
    ev('hockey', 'nhl', atFuture(0, 20, 45), ['nhl-edm', 'nhl-col']),

    // ── Noc po dzisiejszym wieczorze (viewing day = dziś) ──
    ev('american-football', 'nfl', at(1, 2, 5), ['nfl-kc', 'nfl-buf']),
    ev('basketball', 'nba', at(1, 1, 30), ['nba-bos', 'nba-nyk']),
    ev('hockey', 'nhl', at(1, 2, 15), ['nhl-veg', 'nhl-fla']),

    // ── Dalsze dni tygodnia ──
    motor('f1', at(2, 15, 0), 'Dutch GP — Practice 1'),
    ev('soccer', 'premier-league', at(2, 16, 0), ['epl-mci', 'epl-che']),
    ev('soccer', 'bundesliga', at(3, 18, 30), ['bl-bay', 'bl-dor']),
    ev('hockey', 'nhl', at(3, 19, 0), ['nhl-fla', 'nhl-det']),
    ev('basketball', 'nba', at(3, 20, 30), ['nba-mil', 'nba-dal']),
    motor('f1', at(4, 16, 0), 'Dutch GP — Qualifying'),
    ev('soccer', 'bundesliga', at(4, 18, 30), ['bl-lep', 'bl-lev']),
    ev('soccer', 'la-liga', at(4, 21, 0), ['ll-atm', 'll-ath']),
    ev('american-football', 'nfl', at(4, 22, 15), ['nlf-sf', 'nfl-dal']),
    ev('soccer', 'premier-league', at(5, 17, 30), ['epl-tot', 'epl-bha']),
    ev('basketball', 'nba', at(5, 20, 0), ['nba-gsw', 'nba-lal']),

    // ── Weekend: wyścig + wieczór + klaster nocny (demo licznika nocy) ──
    motor('f1', at(6, 15, 0), 'Dutch GP — Race'),
    ev('soccer', 'serie-a', at(6, 20, 45), ['sa-juv', 'sa-nap']),
    ev('soccer', 'serie-a', at(2, 20, 45), ['sa-inter', 'sa-mil']),
    ev('hockey', 'nhl', at(7, 1, 0), ['nhl-tor', 'nhl-nyr']),
    ev('basketball', 'nba', at(7, 1, 45), ['nba-okc', 'nba-den']),
    ev('american-football', 'nfl', at(7, 2, 30), ['nfl-gb', 'nfl-phi']),
    ev('hockey', 'nhl', at(7, 3, 0), ['nhl-bos', 'nhl-edm']),
    ev('soccer', 'premier-league', at(7, 4, 0), ['epl-liv', 'epl-mci']),

    // ── Przeszłość (wczoraj) ──
    ev('soccer', 'bundesliga', at(-1, 18, 30), ['bl-lep', 'bl-lev']),
    ev('hockey', 'nhl', at(-1, 21, 0), ['nhl-col', 'nhl-veg']),

    // ── Przełożone z nowym terminem (stara instancja + nowa za 3 dni) ──
    ev('basketball', 'nba', atFuture(0, 19, 0), ['nba-nyk', 'nba-mil'], 'postponed'),
    ev('basketball', 'nba', at(3, 19, 0), ['nba-nyk', 'nba-mil']),
  ];
}
