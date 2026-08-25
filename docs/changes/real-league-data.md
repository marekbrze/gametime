# Feature: Real League Data (realne terminarze lig)

## Type
Feature (planned by proto-feature)

## User goal
"Chcę pobrać realne dane dotyczące lig" — kalendarz ma pokazywać prawdziwe terminarze 8 lig v1 zamiast wygenerowanych mocków. To realizacja spike'u `data-pipeline` (ryzyko techniczne #1 z MODULES.md, zaplanowane "równolegle od startu").

## MVP scope
**Must:**
- Jeden adapter źródła: **ESPN hidden API** (`site.api.espn.com`, bez klucza, zweryfikowany żywy 2026-08-25) pokrywający wszystkie 8 lig v1 jednym formatem
- Skrypt Node (`npm run pipeline`) pobierający terminarze w oknie **−7 dni / +14 dni**, normalizujący do kontraktu `SportEvent` i piszący `public/data.json` (katalog + wydarzenia + `generatedAt`)
- GitHub Action na cronie (co 6h) commitujący odświeżony `data.json`; commit triggeruje deploy Pages → świeże dane bez backendu (architektura rozstrzygnięta w MODULES.md)
- `data-source`: `useEvents` czyta statyczny `data.json` zamiast generatora mocków; mock zostaje jako fallback dev/Storybook
- Realny katalog drużyn (endpoint `teams` per liga — stabilne ID numeryczne ESPN, żeby `FavoriteTeam` i moduł `teams` miały pełne listy nawet bez wydarzeń w oknie)

**Deferred (Later):**
- Pełna granularność sesji F1 (treningi/kwalifikacje) — ESPN zwraca niekompletnie sesje z wyprzedzeniem; spike decyduje: race-only na start vs OpenF1 jako drugie źródło
- Live scores / realtime, MLB, PlusLiga, NASCAR, WRC, tabele (`Standing`)
- Alerty o rdzewieniu scraperów poza statusem Action, strojenie retencji okna

## Impact map
- **New module?**: nie — wypełnia dwa zaplanowane moduły infra: `data-pipeline` (dziś pusty) i `data-source` (przełączenie z mocków)
- **Modules affected**:
  - `data-pipeline` — cała treść modułu powstaje tutaj
  - `data-source` — źródło danych: fetch statycznego JSON zamiast localStorage z mockami
  - `event-calendar` — bez zmian strukturalnych; nowe stany runtime (loading / błąd / tydzień bez danych) → `harden`
- **Cross-module integration** (ryzyko #1): **kontrakt JSON pipeline → data-source** (MODULES.md: "kontrakt JSON musi być stabilny, zanim powstaną inne moduły") + **stabilność ID drużyn** między snapshotami (ESPN ID numeryczne są stabilne — katalog i `FavoriteTeam` na nich polegają)
- **Shared-doc additions**: GLOSSARY.md [+`DataSnapshot`, +`DataWindow`]; ACTIONS.md [bez zmian — zero nowych akcji użytkownika]; ENTITY_MAP.md [bez zmian — encje istnieją, `statusOverride` już w kontrakcie]

## Zweryfikowane fakty o źródle (probe 2026-08-25)
- Endpointy żywe i bez klucza: `hockey/nhl`, `basketball/nba`, `football/nfl`, `soccer/{eng.1, ita.1, ger.1, esp.1}`, `racing/f1` — wszystkie pod `…/apis/site/v2/sports/…/scoreboard`
- Parametr `?dates=YYYYMMDD-YYYYMMDD` działa (range w jednym requeście; NFL zwrócił 18 wydarzeń dla zakresu 2-tygodniowego)
- Kształt eventu: `events[].date` (UTC ISO) · `competitions[].competitors[].team.{id, abbreviation, displayName}` · `status.type.state` (`pre`/`in`/`post`) · `status.type.name` (np. `STATUS_FULL_TIME`, `STATUS_SCHEDULED`)
- Sezonowość w sierpniu 2026: soccer 2026-27 i NFL wystartowały, F1 w trakcie, NHL/NBA pustą (start październik) — liga bez wydarzeń to **stan normalny, nie błąd**
- F1: scoreboard zwraca pojedyncze sesje (`competitions[0].type.abbreviation`, np. `FP1`), ale nie wylicza pełnego weekendu z wyprzedzeniem — **punkt decyzyjny spike'u**

## Per-module changes

### data-pipeline
- **Data**: produkuje `public/data.json` — `DataSnapshot`:
  ```jsonc
  {
    "generatedAt": "<ISO UTC>",        // świeżość danych (stopka UI, diagnostyka)
    "source": "espn-hidden-api",
    "window": { "from": "<ISO>", "to": "<ISO>" },  // DataWindow: −7d / +14d
    "catalog": { "sports": [...], "leagues": [...], "teams": [...] },  // te same kształty co types/index.ts
    "events": [ /* SportEvent — kontrakt bez zmian */ ]
  }
  ```
  Mapowanie: `id` → `espn-{espnEventId}` · `startUtc` ← `events[].date` · `teamIds` ← `competitors[].team.id` jako `espn-{teamId}` · F1 `title` → `"{GrandPrix} — {session}"` (bez encji Team dla kierowców — patrz Later) · statusy ESPN mapowane **tylko** na `statusOverride`: `STATUS_POSTPONED` → `postponed`, `STATUS_CANCELED*` → `canceled`; `pre`/`in`/`post` ignorowane (klient wylicza z czasu — ADR-0005)
- **Actions**: brak użytkownika (CI). Nowe komendy deweloperskie: `npm run pipeline`
- **Screens & flows**: brak. Workflow: cron `23 */6 * * *` (po pełnej godzinie — mniejszy congestion GitHub Actions) + `workflow_dispatch`; `permissions: contents: write`; commit `data(pipeline): refresh events <ISO>` **tylko gdy plik się zmienił**; bez `[skip ci]` — push świadomie triggeruje deploy
- **States (failure modes)**:
  - Fail-soft per liga: błąd jednej ligi ≠ błąd pipeline'u — commituje się to co się udało, błąd w logu runu
  - Action failuje (czerwono) tylko gdy **wszystkie** ligi padły — to sygnał monitoringu "źródło drgnęło"
  - Liga z 0 wydarzeń (off-season) — normalny stan, nie błąd
  - Stary `data.json` zostaje nietknięty przy totalnym failu (_COMMIT tylko przy udanym fetchu — użytkownik ma wczorajsze dane zamiast braku danych)
- **Edge cases**: partial weekendy F1; mecz przełożony (nowa instancja ESPN ID zastępuje starą — dedup po `id` załatwia semantykę z ENTITY_MAP); zmiana sługów/kształtu ESPN (API nieudokumentowane — wersjonowanie `source` w snapshocie ułatwia diagnozę)
- **Design**: brak (infra)

### data-source
- **Data**: źródłem `SportEvent` + katalogu staje się `DataSnapshot` z `data.json` (fetch same-origin — plik jedzie w bundlu Pages, zero CORS/kluczy). Kontrakt `types/index.ts` bez zmian
- **Actions**: brak nowych; wewnętrzna zmiana źródła dla istniejącego `useEvents`
- **Screens & flows**: brak ekranów; `use-events.ts` zwraca dodatkowo `status: 'loading' | 'ready' | 'error'` i `source: 'json' | 'mock'` (dla diagnostyki/dev)
- **States**:
  - `loading` — fetch w locie (pierwszy paint)
  - `error` — fetch padł: MVP pokazuje error state z retry; fallback do mocków **tylko** gdy plik nie istnieje w dev (`import.meta.env.DEV`) — w prod mocki nie mogą udawać prawdziwych terminarzy
  - scenariusze DevToolbar (`src/scenarios/*`) piszą dziś `gametime.events` do localStorage — po przełączeniu na fetch ten mechanizm przestaje działać; `empty` warto uprościć do jawnego override'u, `full`/`minimal` usunąć (decyzja na edgecases/harden)
- **Edge cases**: stary klucz `gametime.events` w localStorage użytkowników dev (martwy — ignorować); BASE_URL `/gametime/` przy fetchu pliku; week pager poza `DataWindow` → tydzień z zerem wydarzeń
- **Design**: stopka "Data as of {generatedAt}" — kandydat na drobny detal (zostawione cyklowi design)

### event-calendar
- **Data/Actions/Screens**: bez zmian strukturalnych — konsumuje ten sam `SportEvent[]`
- **States**: nowe stany runtime do zaprojektowania i zahardenowania: skeleton/loading, error+retry, "no events this week" (stronicowanie poza okno danych, liga w off-season po przefiltrowaniu)
- **Edge cases**: realna wolumetria (~100–200 wydarzeń w oknie vs ~30 mocków) — sprawdzić wydajność listy i sensowność sekcji nocy przy realnych nocnych bundle'ach NHL/NBA (w sierpniu niewidoczne — wrócić do tego w październiku)
- **Design**: nowe stany dostaną design w cyklu brand→design; nie blokować na nich MVP

## Routing — which proto skill builds what
| Step | Skill | Target | What it does |
|------|-------|--------|--------------|
| 1 | proto-detail | data-pipeline (+ kontrakt data-source) | zespecyfikować: finalny kształt `DataSnapshot`, okno, failure modes, dev workflow, decyzję F1 (race-only vs OpenF1); dopisać terminy do GLOSSARY.md |
| 2 | (direct edit) | `src/modules/data-pipeline/`, `package.json`, `.github/workflows/` | budowa pipeline — czysta infra bez ekranów, `proto-lofi` nie ma czego budować (residual poniżej) |
| 3 | (direct edit) | `src/modules/data-source/` | przełączenie `useEvents` na fetch + fallback (residual poniżej) |
| 4 | proto-edgecases | event-calendar + data-source | zdiagnozować nowe stany: loading/error/no-data/stale-data + scenariusze DevToolbar |
| 5 | proto-harden | event-calendar + data-source | zaimplementować stany z diagnozy |
| 6 | proto-design → polish | — | nie dotyczy MVP (brak DESIGN.md; nowe stany w standardowym cyklu design później) |

## Residual — direct edits not covered by a proto skill
- **[create `src/modules/data-pipeline/lib/config.ts`]** — 8 konfiguracji lig (`{ sportId, leagueId, espnPath }` — slugi zweryfikowane powyżej) + definicje katalogu Sport/League jako nowe źródło prawdy (dziś `data-source/data/catalog.ts:4-21`)
- **[create `src/modules/data-pipeline/lib/espn.ts`]** — fetch scoreboard (+ endpoint `teams` per liga do katalogu), mapowanie na `SportEvent` wg tabeli wyżej, fail-soft per liga z wyraźnym logiem
- **[create `src/modules/data-pipeline/run.ts`]** — wyliczenie `DataWindow` (−7d/+14d), orchestracja lig, skład snapshota, zapis `public/data.json` (pretty-print, deterministyczne sortowanie po `startUtc` — czytelne diffy)
- **[`package.json` scripts]** — now: brak. change to: `"pipeline": "tsx src/modules/data-pipeline/run.ts"` + devDep `tsx`. why: ręczny refresh lokalny i ten sam entry dla Action
- **[create `.github/workflows/data-pipeline.yml`]** — cron `23 */6 * * *` + `workflow_dispatch`, checkout → node 22 → `npm ci` → `npm run pipeline` → commit-if-changed z `permissions: contents: write`
- **[`src/modules/data-source/hooks/use-events.ts:11-17`]** — now: `useLocalStorage(EVENTS_KEY, generateMockEvents())`. change to: fetch `${import.meta.env.BASE_URL}data.json`, zwraca `{ events, catalog, status, source }`, fallback mock tylko dev-bez-pliku. why: źródłem prawdy staje się snapshot, nie localStorage
- **[`src/scenarios/full.ts`, `src/scenarios/minimal.ts`]** — now: piszą `gametime.events`. change to: usunąć (albo przenieść na mockowanie fetcha — decyzja na harden; `empty.ts` zostaje jako jawny pusty stan)
- **[`src/modules/event-calendar/components/EventCalendarScreen.tsx:24`]** — now: `const { events } = useEvents()`. change to: rozpakować też `status` i przekazać do ekranu (puste obsługi na razie — stany dorabia harden)

## Later (deferred)
- F1: pełne sesje weekendu (ESPN core API / OpenF1 `sessions`) + konstruktorzy jako `Team` (dziś title-only)
- Rozszerzenie lig (MLB, PlusLiga, NASCAR, WRC) — wpisy konfiguracyjne, adapter ten sam
- `Standing` jako miernik atrakcyjności meczu
- Powiadomienia o staleness (badge "dane sprzed Xh" gdy Action czerwony)
- Retencja okna jako parametr konfigurowalny (test wydajności przy 4tyg)

## Hand-off
Run the routing steps in order. This doc is the base each skill reads.
Krok 1: `proto-detail data-pipeline` — spec kontraktu i failure modes; kroki 2–3 to residual (bez skilla); kroki 4–5 wracają na ścieżkę proto.
