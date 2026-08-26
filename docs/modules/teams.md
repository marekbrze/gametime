# Teams

## Vision

Drugi główny widok aplikacji (po week liście) — realizuje cel „planowania z wyprzedzeniem" z PROJECT.md: zamiast składać terminarz drużyny z strony ligi, user wchodzi w Teams, klika ligę, klika drużynę i ma **pełny terminarz sezonu** w swojej strefie czasowej, z pasmami godzinowymi i eksportami. Ulubione drużyny spajają trzy zachowania obiecanie w ENTITY_MAP: podświetlenie na week liście, szybki dostęp do terminarza i filtr „tylko moje drużyny".

Kluczowa decyzja tej fazy (designer): **terminarz sezonu ma być prawdziwy** — okno data-pipeline rozszerza się z −7d/+14d do pełnych sezonów lig zespołowych (ADR-0019). Bez tego ekran terminarza pokazywałby 3 tygodnie i łamał obietnicę z MODULES.md.

## Designer decisions (proto-detail, 2026-08-26)

1. **Terminarz = pełny sezon z pipeline'u** — rozszerzenie okna zamiast szczerego labela „tylko okno" albo fetchu on-demand (ADR-0019).
2. **Nawigacja dwupoziomowa** — `/teams` to karty lig (+ sekcja My teams), ekran ligi z listą drużyn, ekran terminarza drużyny (ADR-0020).
3. **F1 ukryta w katalogu teams** — brak encji Team dla kierowców w v1; konstruktorzy to otwarte Later (ADR-0021).
4. **„Go to team schedule" w EventDetailsDialog** — uczestnicy wydarzenia stają się linkami do terminarza; wiersz listy zostaje zwarty (ADR-0022).
5. **Prezentacja terminarza**: nadchodzące zgrupowane po ViewingDay + zwinięta sekcja przeszłych na dole — ten sam wzorzec co watchlista (sprawdzony w ADR-0018); separatory miesięcy w sekcji nadchodzących.
6. **Filtrowanie terminarza**: wspólny FilterBar w wariancie zredukowanym — tylko pasma (sport/liga przy jednej drużynie nie niosą informacji; zasada uniwersalna z ACTIONS.md dotyczy list wielodrużynowych).

## User Flows

### Browse catalog → team schedule
1. User klika Teams w nawigacji → widzi ekran `/teams`.
2. Sekcja **My teams** (jeśli są ulubione): kafle ulubionych drużyn z ligą — klik = od razu terminarz. Poniżej karty lig pogrupowane po sportach (hokej: NHL; koszykówka: NBA; futbol amer.: NFL; piłka: PL/Serie A/Bundesliga/La Liga; F1 niewidoczna — ADR-0021).
3. User klika kartę ligi → `/teams/league/:leagueId`: pełna lista drużyn ligi alfabetycznie (~20–32), pole wyszukiwania filtruje, gwiazdka w wierszu = ulubiona.
4. User klika drużynę → `/teams/team/:teamId`: terminarz.

### Favorite a team
1. User na ekranie ligi klika gwiazdkę przy drużynie (lub w nagłówku terminarza).
2. Drużyna trafia do `FavoriteTeam` (localStorage, sanityzacja jak ADR-0018).
3. Natychmiastowe efekty: kafel w My teams na `/teams`, podświetlenie wydarzeń na week liście, zasilenie MyTeamsFilter.

### Go to team schedule from event details
1. User otwiera szczegóły obserwowanego wydarzenia (watchlista → dialog).
2. Klik na nazwę uczestnika → nawigacja na `/teams/team/:teamId` (dialog się zamyka).

### View season schedule
1. User na `/teams/team/:teamId` widzi: nagłówek (emoji sportu, nazwa drużyny, liga, gwiazdka), label zakresu danych („Season data: {from} – {to}"), pasek filtrów pasm.
2. **Upcoming**: wydarzenia po ViewingDay (reuse DayGroup/EventRow), separatory miesięcy przy zmianie miesiąca; gwiazdka/eksporty z wiersza działają.
3. **Past ({n})**: zwinięta sekcja na dole, rozwijana — historia sezonu (finished/przełożone przygaszone jak wszędzie).
4. Pusta liga (off-season, np. NHL w sierpniu) → stan pusty z wyjaśnieniem i zakresem sezonu.

## Screens (rough)

- **TeamsScreen** (`/teams`): sekcja My teams (kafle: nazwa + liga + link terminarzu; pusty stan z CTA do katalogu lig) + karty lig pogrupowane po sportach (emoji, nazwa, liczba drużyn). F1 pominięta.
- **LeagueScreen** (`/teams/league/:leagueId`): nagłówek ligi (emoji sportu, nazwa), search input, lista drużyn alfabetycznie z gwiazdkami; stan „no matches" dla searcha.
- **TeamScheduleScreen** (`/teams/team/:teamId`): nagłówek + gwiazdka + label zakresu, FilterBar (bands only), Upcoming (DayGroupy + separatory miesięcy), Past (zwinięte). Stany: loading/error (fetch snapshota), not-found (nieznany teamId), empty (brak wydarzeń w sezonie/off-season).

## Actions

| Action | Description | Entity | Notes |
|--------|------------|--------|-------|
| Browse teams | Nawigacja sport → liga → drużyny. | Team | Dwa poziomy: karty lig → lista drużyn (ADR-0020) |
| Search teams | Tekstowe filtrowanie listy drużyn na ekranie ligi. | Team | Mechanika widoku; nowa akcja (ADR-0020) |
| View season schedule | Pełny terminarz sezonu drużyny — upcoming + zwinięte past. | Team | Wymaga rozszerzenia okna pipeline (ADR-0019); filtr pasm (wariant FilterBar) |
| Add favorite team | Z listy ligi lub nagłówka terminarza. | FavoriteTeam | Efekty: My teams, highlight, MyTeamsFilter |
| Remove favorite team | Ta sama gwiazdka + kafel w My teams. | FavoriteTeam | |
| Go to team schedule | Link z uczestnika w EventDetailsDialog → terminarz. | Team | ADR-0022 |

## Edge Cases

Systematyczny audyt: `teams-edgecases.md` (proto-edgecases → proto-harden, ADR-0024 — wszystkie 10 gapów obsłużone):

- **Liga w off-season** (NHL/NBA w sierpniu): terminarz pusty z wyjaśnieniem — normalny stan; sezon w danych od publikacji harmonogramu.
- **Sierota ulubiona** (teamId zniknęło ze snapshota): nota „n favorites are outside the current data catalog" + Clear z undo 5s, wpisy wracają verbatim (decyzja designera — parita z sierotami watchlisty).
- **Deep-link na nieistniejący teamId / leagueId**: not-found z powrotem do `/teams`.
- **Deep-link na `/teams/league/f1`**: „F1 has no teams in v1" + CTA na kalendarz (ADR-0021).
- **Snapshot loading/error**: skeleton/LoadError z retry na 3 ekranach.
- **localStorage favorites**: sanityzacja + dedup po teamId (ADR-0018 + 0024); pad zapisu → StorageWarning z rollbackiem wizualnym.
- **Długa lista drużyn**: scroll + search niewrażliwy na diakrytyki („Atletico" znajduje „Atlético").
- **Sezon z wieloma miesiącami**: Past zwinięte, separatory miesięcy w Upcoming i Past.
- **Obce parametry URL na terminarzu** (`?sport`/`?league`): stripowane przy kanonizacji — terminarz czyta wyłącznie `?band` (decyzja designera, ADR-0024).
- **Od-ulubienie**: undo toast 5s na kaflu, wierszu ligi i nagłówku terminarza (decyzja designera); nieznany uczestnik w dialogu → „Unknown team" bez linku.
- **Odroczone platformowo**: offline w prod (brak service workera — jak ADR-0018 #13).

## Integration Points

- **data-pipeline**: rozszerzenie okna — pełne sezony lig zespołowych (patrz Per-module changes niżej; ADR-0019).
- **data-source**: `useEvents` bez zmian API; `window` = unia okien lig (semantyka pola w GLOSSARY zaktualizowana); katalog drużyn już rejestrowany przez `registerCatalogTeams`.
- **filters**: MyTeamsFilter czyta FavoriteTeam (istnieje); FilterBar dostaje wariant bands-only dla terminarza.
- **event-calendar**: podświetlenie ulubionych w EventRow (istnieje, `favorite` prop).
- **watchlist**: EventDetailsDialog — uczestnicy jako linki (ADR-0022).
- **calendar-export**: ExportMenu w wierszach terminarza — bez zmian, reuse.

## Per-module changes — data-pipeline (rozszerzenie okna, ADR-0019)

Wykonywane jako direct-edit w kroku lofi (infra bez ekranów, wzorzec z real-league-data.md):

- **Okno per liga zespołowa**: pełny sezon zawierający „dziś" — daty z `leagues[].season.{startDate,endDate}` odpowiedzi scoreboard (do weryfikacji probem przy implementacji; fallback: heurystyka kalendarzowa per liga). Fetch w chunkach miesięcznych (`?dates=`), merge + dedup po id — pojedynczy 9-miesięczny range bywa capowany.
- **F1 bez zmian**: okno −7d/+14d z OpenF1 (ADR-0008).
- **`window` snapshota = unia** okien lig (min from / max to) — konsumenci (beyond-window states) działają bez zmian kodu.
- **Wolumetria**: ~4–5k wydarzeń/rok (NHL 1312, NBA 1230, NFL ~285, 4×soccer ~1.4k, F1 ~30) ≈ 1,5–2 MB pretty-printed, ~250–400 KB gzip — akceptowalne dla statycznego Pages. Pretty-print zostaje (czytelne diffy commit-if-changed).
- **Fail-soft bez zmian**: padła liga = jej wydarzenia z poprzedniego snapshota zostają (mechanizm `loadPreviousTeamsByLeague` rozszerzony o events).

## Open questions (na edgecases/harden)

- Czy ESPN `?dates=` znosi cały zakres sezonu w jednym requeście (probe przy implementacji; chunki to safe default).
- Czy `leagues[].season` jest obecne dla wszystkich lig — fallback heurystyk.
- Home/away w terminarzu (kolejność teamIds / pole homeAway w competitorach) — kandydat na Later, nie blokuje lofi.
