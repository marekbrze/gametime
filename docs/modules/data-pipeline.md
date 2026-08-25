# data-pipeline

Wynik `proto-detail`. Infrastruktura — moduł bez ekranów i akcji użytkownika; zamiast tego kontrakt danych, przepływ CI i tryby awaryjne. Baza: `docs/changes/real-league-data.md` (proto-feature) + ADR-0007…0009.

## Vision

Świeże, prawdziwe terminarze 8 lig v1 bez backendu: skrypt Node pobiera dane z publicznych API (bez kluczy), normalizuje do kontraktu `SportEvent` i commituje statyczny `DataSnapshot` do repo. GitHub Action na cronie utrzymuje aktualność; commit triggeruje deploy Pages. Strona czyta JSON same-origin — zero CORS, zero limitów w przeglądarce, zero kosztów. To realizacja architektury rozstrzygniętej w MODULES.md i odpowiedź na ryzyko techniczne #1 (rdzewienie scraperów) — dlatego failure modes są częścią kontraktu, nie dodatkiem.

## Źródła (zweryfikowane probe'em 2026-08-25)

| Adapter | Ligi | Endpointy | Uwagi |
|---|---|---|---|
| **ESPN hidden API** (`site.api.espn.com/apis/site/v2/sports/…`) | NHL, NBA, NFL, Premier League, Serie A, Bundesliga, La Liga | `{path}/scoreboard?dates=YYYYMMDD-YYYYMMDD` (wydarzenia okna) · `{path}/teams?limit=500` (katalog drużyn) | bez klucza; UTC ISO; stabilne ID numeryczne; statusy `STATUS_*` |
| **OpenF1** (`api.openf1.org/v1`) | F1 | `/sessions?year=YYYY` (sesje z czasami) · `/meetings?year=YYYY` (nazwy GP po `meeting_key`) | bez klucza; pełny weekend: Practice 1/2/3, Qualifying, Race; `session_key` stabilny |

Ścieżki ESPN: `hockey/nhl` · `basketball/nba` · `football/nfl` · `soccer/eng.1` · `soccer/ita.1` · `soccer/ger.1` · `soccer/esp.1`. F1 NIE korzysta z ESPN — scoreboard nie wylicza pełnego weekendu sesji z wyprzedzeniem (ADR-0008).

## User Flows

### Scheduled refresh (happy path, CI)
1. Cron `23 4 * * *` — raz dziennie o 04:23 UTC / 6:23 CEST (lub `workflow_dispatch`) odpala Action `data-pipeline`
2. Skrypt liczy `DataWindow`: od dziś −7 dni do dziś +14 dni (UTC)
3. Per liga zespołowa: jeden request scoreboard dla całego okna + jeden request `teams` (katalog)
4. F1: request `sessions` + `meetings` dla roku okna; filtracja do okna
5. Normalizacja wszystkiego do `SportEvent[]` + katalogu (mapowania poniżej)
6. Skład `DataSnapshot`, deterministyczne sortowanie, zapis `public/data.json` (pretty-print)
7. Commit `data(pipeline): refresh events <ISO>` **tylko jeśli plik się zmienił**; bez `[skip ci]`
8. Push triggeruje deploy → świeże dane na Pages

### Manual refresh (dev)
1. Deweloper odpala `npm run pipeline`
2. Ten sam skrypt pisze `public/data.json` lokalnie; Vite dev server serwuje go od następnego requestu
3. Konsola raportuje per ligę: liczbę wydarzeń / błąd / „off-season (0 events)"

### Failure flow
1. Pojedyncza liga pada (timeout, 5xx, zmiana kształtu) → log warning, reszta biegnie dalej (**fail-soft**)
2. Commit zawiera to co się udało; wydarzenia zdrowych lig nie znikają przez pad jednej
3. **Totalny pad** (0 zdrowych lig) → skrypt kończy się błędem, **commit się nie wykonuje** → Action czerwony = sygnał, że źródło drgnęło; na Pages zostaje ostatni dobry snapshot
4. Nikt nic nie robi ręcznie — kolejny cron ponawia próbę

## Kontrakt danych — `DataSnapshot` (`public/data.json`)

```jsonc
{
  "generatedAt": "<ISO UTC>",          // świeżość (stopka UI, diagnostyka)
  "source": "espn-hidden-api+openf1",
  "window": { "from": "<ISO>", "to": "<ISO>" },   // DataWindow: −7d / +14d
  "catalog": {
    "sports":  [ /* Sport — jak src/modules/data-source/types */ ],
    "leagues": [ /* League */ ],
    "teams":   [ /* Team — pełne składy lig; F1: [] (title-only) */ ]
  },
  "events": [ /* SportEvent[] — kontrakt bez zmian poza nowym opcjonalnym sessionType */ ]
}
```

Sortowanie: `startUtc`, potem `id` — deterministyczne diffy w historii commitów.

### Mapowanie ESPN → `SportEvent`
| Pole | Źródło | Zasada |
|---|---|---|
| `id` | `events[].id` | `"espn-{leagueId}-{id}"` — per-sportowe przestrzenie ID ESPN kolidują między ligami (probe 2026-08-25: 29–30 wspólnych ID drużyn między każdą parą), więc scopesuje je liga |
| `startUtc` | `events[].date` | już UTC ISO — pass-through |
| `teamIds` | `competitions[].competitors[].team.id` | `"espn-{leagueId}-{teamId}"` (katalog z endpointu `teams` używa tego samego schematu) |
| `statusOverride` | `status.type.name` | tylko `STATUS_POSTPONED` → `postponed`, `STATUS_CANCELED*` → `canceled`; `pre`/`in`/`post` **ignorowane** — klient wylicza z czasu (ADR-0005) |
| `sessionType` | — | nie dotyczy (tylko F1) |

### Mapowanie OpenF1 → `SportEvent`
| Pole | Źródło | Zasada |
|---|---|---|
| `id` | `session_key` | `"f1-{session_key}"` |
| `startUtc` | `date_start` | normalizacja `+00:00` → `Z` |
| `title` | `meeting_name` + `session_name` | `"{Italian Grand Prix} — {Qualifying}"`; wyścig też z sufiksem (`— Race`) — jedno uniwersalne reguło tytułu |
| `sessionType` | `session_type` | `'practice' | 'qualifying' | 'sprint' | 'race'` — strukturalny marker dla UI (wyróżnienie wyścigu bez parsowania tytułu); sprint weekendy pokryte |
| `teamIds` | — | brak — F1 title-only; konstruktorzy jako `Team` odroczeni (Later) |
| `statusOverride` | — | przesunięta sesja = zmiana `date_start` pod tym samym `session_key` (update in place); anulowania nie mapujemy (rzadkie, sesja znika z feedu) |

## Screens (rough)

Moduł nie ma UI. Powierzchnie, które „widzi" deweloper:

- **`npm run pipeline` (konsola)**: per-linia per liga — `[nhl] 42 events` / `[nba] off-season (0 events)` / `[serie-a] FAILED: 503 (kept previous)`; na końcu summary: liczba wydarzeń, rozmiar pliku, `window`
- **GitHub Action `data-pipeline` (run log)**: to samo + krok commit (`skipped: no changes` / sha); czerwony run = wyłącznie totalny pad

## Actions

Moduł nie ma akcji użytkownika (rola: brak — CI). Akcje deweloperskie:

| Action | Description | Entity | Notes |
|--------|-------------|--------|-------|
| Run pipeline manually | `npm run pipeline` pisze `public/data.json` lokalnie | `DataSnapshot` | ten sam entrypoint co Action |
| Trigger pipeline manually | `workflow_dispatch` w UI GitHuba | `DataSnapshot` | bez czekania na cron |

## Edge Cases

- **Liga w off-season (0 wydarzeń)**: stan normalny, nie błąd — NHL/NBA puste od czerwca do października; log `"off-season (0 events)"`
- **Pad jednej ligi**: fail-soft — patrz Failure flow; zepsuta liga znika z okna (eventy wypadają), reszta nietknięta
- **Totalny pad**: brak commitu, Action czerwony, na Pages zostaje stary snapshot (graceful staleness)
- **Mecz przełożony (ESPN)**: ESPN często tworzy nowy `event.id` → stary event ze `STATUS_POSTPONED` wypada z okna sam (znika), nowy wchodzi jako `scheduled`; `statusOverride: postponed` łapiemy tylko dla eventów jeszcze widocznych w oknie
- **Sesja F1 przesunięta**: ten sam `session_key`, nowy `date_start` → update in place (odmiennej semantyki niż "nowa instancja" z ENTITY_MAP — stabilize przez stabilne ID)
- **Sesja opublikowana w OpenF1 późno**: weekend na krawędzi okna (+14d) może być niekompletny;下一个 cron go domknie — akceptowalne
- **Sprint weekend**: 3 sesje zamiast 4 praktyk + Sprint — OpenF1 zwraca `session_name: "Sprint"` automatycznie, adapter nie rozróżnia
- **Zmiana kształtu ESPN/OpenF1** (API nieudokumentowane): adapter waliduje REQUIRED pola per event; brak pola = drop tego eventu z warningiem, nie crash całej ligi
- **`public/data.json` nie istnieje** (świeży clone przed pierwszym runem): dev → fallback mocków w `data-source`; prod → stan error z retry (harden)
- **Commit przy braku zmian danych**: skip — `generatedAt` i granice `window` (liczone od "teraz") są wyłączane z detekcji zmian, żeby cron nie commitował (i nie deployował) pustych refreshy (np. poza sezonem); `generatedAt` w pliku odzwierciedla ostatnią realną zmianę danych
- **Równoległość pipeline ↔ deploy**: oba pushe na main; GitHub serializuje workflow runs — najwyżej kolejka, brak konfliktu

## Integration Points

- **data-source**: jedyny konsument `DataSnapshot` — fetch same-origin, normalizacja do encji, statusy wyliczane klientowo (ADR-0005). Kontrakt `SportEvent` rozszerzony o **opcjonalne** `sessionType` — zmiana w `src/modules/data-source/types/index.ts` musi być atomowa z pierwszym runem pipeline
- **event-calendar**: pośrednio — nowe stany runtime (loading / error / tydzień poza oknem) na edgecases→harden
- **deploy workflow**: commit danych świadomie triggeruje deploy (bez `[skip ci]`) — łańcuch „dane → Pages" jest featurem, nie skutkiem ubocznym
- **teams / watchlist / filters (przyszłe)**: katalog drużyn i stabilność ID (`espn-{teamId}`) to ich fundament — `FavoriteTeam` przetrwa odświeżenia snapshotu
- **settings**: brak powiązania
