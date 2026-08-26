# Watchlist — Edge Cases

Wynik `proto-edgecases` (baseline po `proto-lofi`, commit `de8313d`). Audyt całego modułu.
Uwaga wyjściowa: moduł nie ma własnego specu z `proto-detail` — za baseline wymagań przyjęto
sekcję **watchlist** z `MODULES.md`, akcje Watchlist z `ACTIONS.md` i encję `WATCHLIST_ENTRY`
z `ENTITY_MAP.md` (tak samo jak przy budowie lofi).

## Coverage
- **Baseline już captures**: upcoming + automatycznie zwinięta sekcja past (MODULES.md);
  remove entry jako jedyny sposób sprzątania, jump to event, bulk ICS "wszystkie nadchodzące"
  (ACTIONS.md); upcoming → past automatycznie po zakończeniu, nigdy nie wygasa sama (ENTITY_MAP).
- **Already handled in code** (lofi + dziedziczone z hardened modułów):
  - pusta watchlista → wyjaśnienie + CTA "Browse this week" (`WatchlistScreen.tsx:177`, `EmptyWatchlist.tsx`)
  - zero-match po filtrach → empty state z "Clear filters" (`WatchlistScreen.tsx:188`)
  - błąd ładowania danych → LoadError + retry (`WatchlistScreen.tsx:118`)
  - skeleton pierwszego ładowania (`WatchlistScreen.tsx:120`)
  - awaria zapisu storage → StorageWarning banner, rollback wizualny gwiazdki (`WatchlistScreen.tsx:101`, `use-local-storage.ts:20`)
  - kanonizacja/deep-link filtrów z URL (`use-url-filters.ts:88`)
  - postponed widoczny przygaszony — parzystość z ADR-0011 (`EventRow.tsx:33`)
  - dialog: Escape/tło/× + zwrot fokusu (zweryfikowane E2E)
  - aria-live licznik upcoming (`WatchlistScreen.tsx:174`)
- **New gaps found**: 14
- **By severity**: 🔴 1 · 🟡 8 · 🟢 5

## Inventory

| # | Severity | Category | Edge case | Behavior today | Suggested behavior | Where |
|---|----------|----------|-----------|----------------|--------------------|-------|
| 1 | 🔴 | Prototype-specific | Parsowalny, ale niewłaściwy kształt w localStorage (np. `gametime.settings = {}` — odtworzone w E2E; analogicznie `gametime.watchlist` bez tablicy) | biały ekran — `bands[kind].start` / `entries.map` na undefined | walidacja kształtu przy odczycie + scalenie z defaultami (setters zostawiają dotychczasowy write-first) | `use-local-storage.ts:13`, `use-settings.ts:7`, `time-bands.ts:11`, `WatchlistScreen.tsx:53` |
| 2 | 🟡 | Cross-module / lifecycle | Odgwiazdkowane wydarzenie **przełożone**: feed rodzi nową instancję Event z nowym terminem (ENTITY_MAP), wpis dalej wskazuje starą | stara instancja przygaszona w upcoming, po upływie oryginalnego terminu dryfuje do past; nowa instancja nie ma gwiazdki — user traci wydarzenie, które chciał oglądać | wiersz przełożonego wpisu z hintem "Rescheduled — check new date" + gwiazdka na nowej instancji (dopasowanie po league+teamIds w oknie); wymaga decyzji designera | `watchlist-groups.ts:32` (podział czysto czasowy), brak mechanizmu w data modelu |
| 3 | 🟡 | Cross-module / lifecycle | Odgwiazdkowane wydarzenie **anulowane** | znika bez śladu (filtrowane z watchedEvents) — na liście, którą user świadomie kuratorował, pozycja evaporuje po cichu | pokazać anulowane przygaszone z "Canceled" + łatwe usunięcie (zaufanie do listy), albo utrzymać parzystość z kalendarzem ADR-0011 — decyzja designera | `WatchlistScreen.tsx:54` |
| 4 | 🟡 | Cross-module / lifecycle | Wpisy poza oknem danych (DataWindow przesunęło się po starych gwiazdkach) — przypadek częściowy | jeżeli CZĘŚĆ wpisów żyje w danych — sieroty są całkowicie niewidoczne (join po id gubi je po cichu), bez licznika i bez śladu | stopka "N entries outside loaded range" + opcja sprzątania sierot | `WatchlistScreen.tsx:52` |
| 5 | 🟡 | Navigation & flow | "No watched events in the loaded date range" — przypadek całkowity | blok informacyjny bez żadnej akcji — dead end | CTA "Browse this week" (jak EmptyWatchlist) + opcja wyczyszczenia sierot | `WatchlistScreen.tsx:181` |
| 6 | 🟡 | Action outcomes | Remove entry bez confirm/undo — na pastach nieodwracalne po wyjściu poza okno danych | gwiazdka usuwa wpis natychmiast; wpis z przeszłości poza oknem nie da się odtworzyć | undo toast (~5s) po odgwiazdkowaniu; confirm tylko przy zbiorczym sprzątaniu | `use-watchlist.ts:11`, `EventRow.tsx` (star) |
| 7 | 🟡 | State transitions | Przejście upcoming → past NA ŻWO na otwartym ekranie (tick 30s) | wiersz znika z Upcoming i ląduje w zwiniętej sekcji Past — bez wyjaśnienia | utrzymać automatyczne przejście (to jest feature), ale po ticku pokazać licznik Past / krótką notę "1 event just finished"; decyzja designera | `watchlist-groups.ts:32`, `PastSection.tsx:34` |
| 8 | 🟡 | Data states | Wydarzenie LIVE na watchliście nieodróżnialne od scheduled | wiersz bez markera live/elapsed (kalendarz ma NowBlock; EventRow przygasza tylko finished/postponed) | chip "Live" (± elapsed) w wierszu na watchliście albo sekcja Now nad Upcoming; decyzja designera | `EventRow.tsx:33`, `WatchlistScreen.tsx` (brak odpowiednika NowBlock) |
| 9 | 🟡 | Action outcomes | Eksport zbiorczy pakuje też przełożone | ICS zawiera wydarzenia, które w tym terminie się nie odbędą (statusOverride postponed z przyszłym startem liczone jako upcoming) | wykluczyć postponed z paczki eksportu (zostają w przeglądzie) | `WatchlistScreen.tsx:87` |
| 10 | 🟢 | Loading & async | Skeleton kształtu tygodnia na ekranie bez pagera | WeekSkeleton rysuje pasek pagera, którego watchlista nie ma | skeleton pod layout watchlisty (nagłówek + wiersze) | `WatchlistScreen.tsx:120` |
| 11 | 🟢 | Navigation & flow | Parametr `?w=` bez znaczenia na /watchlist | deep-link z w jest kanonizowany i utrzymywany w URL, nic nie robi | stripować `w` przy kanonizacji na watchliście (shared `useUrlFilters` z opcją) | `use-url-filters.ts:40`, `WatchlistScreen.tsx:39` |
| 12 | 🟢 | Navigation & flow | Dialog "Show in calendar" bez clamp offsetu tygodnia | event z dev-override latającego datą generuje `?w=999`; kalendarz clampuje do ±52 i pokazuje nie ten tydzień | clamp ±52 przy liczeniu offsetu w dialogu | `EventDetailsDialog.tsx:85` vs `use-url-filters.ts:40` |
| 13 | 🟢 | Prototype-specific | Offline w prod | fetch data.json pada → LoadError, choć wpisy watchlisty są lokalne | zaakceptować (cała app zależna od snapshota); ewentualnie przyszły SW-cache | `use-events.ts:79` |
| 14 | 🟢 | Action outcomes | Eksport bez feedbacku | klik = pobranie pliku w ciszy (tylko pasek przeglądarki) | krótki toast "Downloaded N events" | `WatchlistScreen.tsx:130` |

Kategorie sprawdzone bez gapów: **Forms & input** (moduł nie ma formularzy — jedyne wejścia to
filtry i gwiazdka, oba obsłużone), **Errors/validation** (brak pól user-input), **Boundary values**
(offsety/daty clampowane po stronie kalendarza), **very long values** (etykiety truncatowane w wierszach,
dialog zawija tytuł).

## Priority list
1. **#1 walidacja kształtu storage** — realny white-screen (odtworzony), tani fix, chroni wszystkie ekrany.
2. **#3 + #2 canceled/postponed na watchliście** — trust do jedynej listy, którą user kuratorował; silent vanish i utrata przełożonego meczu to najgłębsze productowe dziury modułu.
3. **#4 + #5 sieroty poza oknem** — dead end i niewidzialne wpisy; razem z #1 domykają lifecycle WATCHLIST_ENTRY.
4. **#8 live na watchliście + #7 żywe przejście do past** — widoczność "co się dzieje teraz" na liście planowanej na dziś.
5. **#6 undo odgwiazdkowania, #9 postponed w eksporcie** — bezpieczeństwo akcji niszczących i prawdomówność ICS.
6. Pozostałe 🟢 (#10–#14) — po drodze.

## Hand-off to proto-harden
Najpierw z pytaniem do designera (jedno naraz, z suggested behavior jako defaultem):
- #3 canceled (pokać vs znikać) i #2 postponed (carry-over gwiazdki na nową instancję — określa zakres v1)
- #8 live (chip w wierszu vs sekcja Now) i #7 (nota po żywym przejściu)
- #6 undo toast vs confirm

Bez decyzji designera, do wdrożenia od razu: #1, #4, #5, #9, #10, #11, #12.
